import uuid
import datetime
import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database.session import get_db
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.ayush_dataset import AYUSHPreConsultationDataset
from app.models.ayush_session import PreConsultationSession, PreConsultationResponse
from app.models.ai_records import AIConsultationSummary, MultilingualQAPairRecord
from app.models.emergency import EmergencyAlert
from app.schemas.preconsultation import (
    PreConsultationStartRequest,
    PreConsultationAnswerRequest,
    PreConsultationQuestionResponse,
    PreConsultationSessionResponse
)
from app.ai.pre_consultation.adaptive_engine import ayush_adaptive_engine

logger = logging.getLogger("aihc.api.preconsultation")
router = APIRouter()

@router.post("/start", response_model=PreConsultationSessionResponse)
async def start_pre_consultation(req: PreConsultationStartRequest, db: AsyncSession = Depends(get_db)):
    """
    Starts an adaptive AYUSH Pre-Consultation session for a patient.
    Checks for immediate emergencies, maps complaint to the 1,875 dataset,
    and returns the first relevant question in the patient's language.
    """
    lang = ayush_adaptive_engine.normalize_language(req.language)
    sys = ayush_adaptive_engine.normalize_medical_system(req.medicalSystem)
    canonical_complaint = ayush_adaptive_engine.map_to_canonical_complaint(req.chiefComplaint)

    # 1. Deterministic Emergency & Red-Flag Check
    is_emergency, emergency_flag, emergency_reason = ayush_adaptive_engine.detect_emergency(
        req.chiefComplaint,
        req.severity
    )

    # 2. Retrieve initial question from 1,875 dataset
    first_q = ayush_adaptive_engine.get_first_question(
        language=lang,
        medical_system=sys,
        chief_complaint=canonical_complaint,
        age=req.age,
        gender=req.gender
    )

    session_id = f"SES-{int(datetime.datetime.utcnow().timestamp()*1000)}-{uuid.uuid4().hex[:4].upper()}"

    # 3. Create PreConsultationSession in DB
    session = PreConsultationSession(
        id=session_id,
        patient_id=req.patientId,
        appointment_id=req.appointmentId,
        language=lang,
        medical_system=sys,
        chief_complaint=req.chiefComplaint,
        age=req.age,
        gender=req.gender,
        duration=req.duration or "",
        severity=req.severity or "Moderate",
        status="EMERGENCY_STOPPED" if is_emergency else "IN_PROGRESS",
        emergency_flag=is_emergency,
        emergency_reason=emergency_reason if is_emergency else None,
        current_step=1,
        context_data={
            "canonicalComplaint": canonical_complaint,
            "bodySelections": req.bodySelections or [],
            "answersHistory": []
        }
    )
    db.add(session)

    # 4. If emergency, also record in emergency_alerts
    if is_emergency:
        pt_res = await db.execute(select(Patient).where(Patient.id == req.patientId))
        pt = pt_res.scalars().first()
        alert = EmergencyAlert(
            id=f"ALT-{int(datetime.datetime.utcnow().timestamp()*1000)}-{uuid.uuid4().hex[:4].upper()}",
            patient_id=req.patientId,
            patient_name=pt.full_name if pt else req.patientId,
            symptom_summary=f"{emergency_reason} - Complaint: {req.chiefComplaint}",
            triage_level="EMERGENCY",
            status="ACTIVE"
        )
        db.add(alert)

    await db.commit()
    await db.refresh(session)

    return PreConsultationSessionResponse(
        sessionId=session.id,
        patientId=session.patient_id,
        appointmentId=session.appointment_id,
        language=session.language,
        medicalSystem=session.medical_system,
        chiefComplaint=session.chief_complaint,
        currentStep=session.current_step,
        status=session.status,
        isEmergency=session.emergency_flag,
        emergencyFlag=emergency_flag,
        emergencyReason=session.emergency_reason,
        isSufficient=False,
        progressPercent=20,
        nextQuestion=PreConsultationQuestionResponse(
            id=first_q["id"],
            text=first_q["text"],
            englishText=first_q.get("englishText"),
            tamilText=first_q.get("tamilText"),
            hindiText=first_q.get("hindiText"),
            questionType=first_q.get("questionType", "duration"),
            inputType=first_q.get("inputType", "OPTIONS"),
            options=first_q.get("options", []),
            stepNumber=first_q.get("stepNumber", 1),
            isEmergency=is_emergency,
            emergencyFlag=emergency_flag
        ) if not is_emergency else None,
        summary=None,
        qaHistory=[]
    )

@router.post("/answer", response_model=PreConsultationSessionResponse)
async def submit_pre_consultation_answer(req: PreConsultationAnswerRequest, db: AsyncSession = Depends(get_db)):
    """
    Submits patient response for current question, updates adaptive context,
    performs emergency checks, and returns next branched question or generated summary.
    """
    res = await db.execute(select(PreConsultationSession).where(PreConsultationSession.id == req.sessionId))
    session = res.scalars().first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Session {req.sessionId} not found.")

    if session.status == "EMERGENCY_STOPPED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session has been stopped due to critical red-flag emergency symptoms."
        )

    # 1. Deterministic Emergency & Red-Flag Check on answer text
    is_emergency, emergency_flag, emergency_reason = ayush_adaptive_engine.detect_emergency(
        req.patientAnswer,
        session.severity
    )

    # 2. Record PreConsultationResponse
    resp_id = f"RESP-{int(datetime.datetime.utcnow().timestamp()*1000)}-{uuid.uuid4().hex[:4].upper()}"
    response_record = PreConsultationResponse(
        id=resp_id,
        session_id=session.id,
        patient_id=session.patient_id,
        question_id=req.questionId or f"Q_STEP_{session.current_step}",
        question_text=req.questionId or f"Step {session.current_step}",
        patient_answer=req.patientAnswer,
        answer_category=req.answerCategory or "patient_response",
        language=session.language,
        medical_system=session.medical_system,
        step_number=session.current_step,
        emergency_flag=emergency_flag,
        is_emergency=is_emergency
    )
    db.add(response_record)

    # 3. Update session context
    ctx = dict(session.context_data or {})
    answers_hist = list(ctx.get("answersHistory", []))
    answers_hist.append({
        "step_number": session.current_step,
        "question_id": req.questionId,
        "patient_answer": req.patientAnswer
    })
    ctx["answersHistory"] = answers_hist
    session.context_data = ctx

    if is_emergency:
        session.emergency_flag = True
        session.emergency_reason = emergency_reason
        session.status = "EMERGENCY_STOPPED"

        # Record active emergency alert
        pt_res = await db.execute(select(Patient).where(Patient.id == session.patient_id))
        pt = pt_res.scalars().first()
        alert = EmergencyAlert(
            id=f"ALT-{int(datetime.datetime.utcnow().timestamp()*1000)}-{uuid.uuid4().hex[:4].upper()}",
            patient_id=session.patient_id,
            patient_name=pt.full_name if pt else session.patient_id,
            symptom_summary=f"{emergency_reason} - Answer: {req.patientAnswer}",
            triage_level="EMERGENCY",
            status="ACTIVE"
        )
        db.add(alert)
        await db.commit()
        await db.refresh(session)

        return PreConsultationSessionResponse(
            sessionId=session.id,
            patientId=session.patient_id,
            appointmentId=session.appointment_id,
            language=session.language,
            medicalSystem=session.medical_system,
            chiefComplaint=session.chief_complaint,
            currentStep=session.current_step,
            status=session.status,
            isEmergency=True,
            emergencyFlag=emergency_flag,
            emergencyReason=emergency_reason,
            isSufficient=False,
            progressPercent=100,
            nextQuestion=None,
            summary=f"EMERGENCY DETECTED: {emergency_reason}",
            qaHistory=answers_hist
        )

    # 4. Determine next question
    patient_context = {
        "language": session.language,
        "medicalSystem": session.medical_system,
        "chiefComplaint": session.chief_complaint,
        "age": session.age,
        "gender": session.gender,
        "severity": session.severity
    }

    next_q = ayush_adaptive_engine.get_next_question(
        current_step=session.current_step,
        answers_history=answers_hist,
        patient_context=patient_context
    )

    is_sufficient = (next_q is None)
    summary_text = None

    if is_sufficient:
        # Session complete -> generate and persist summary
        summary_text = ayush_adaptive_engine.generate_summary(
            patient_context=patient_context,
            answers_history=answers_hist,
            emergency_flag=emergency_flag
        )
        session.status = "COMPLETED"
        session.summary = summary_text

        # Create or update AIConsultationSummary for doctor dashboard access
        sum_id = f"SUM-{int(datetime.datetime.utcnow().timestamp()*1000)}-{uuid.uuid4().hex[:4].upper()}"
        ai_summary = AIConsultationSummary(
            id=sum_id,
            patient_id=session.patient_id,
            appointment_id=session.appointment_id,
            medicine_system=session.medical_system,
            chief_complaint=session.chief_complaint or "Clinical case consultation",
            chief_complaint_localized={session.language: session.chief_complaint},
            symptoms_list=[f"Step {a['step_number']}: {a['patient_answer']}" for a in answers_hist],
            duration=session.duration or "3 days",
            severity=8 if session.severity == "Severe" else 5,
            detected_red_flags=[emergency_reason] if session.emergency_flag and emergency_reason else [],
            recommended_triage="EMERGENCY" if session.emergency_flag else ("URGENT" if session.severity == "Severe" else "NORMAL"),
            confidence_score=98.0,
            disclaimer="IMPORTANT CLINICAL NOTICE: Pre-consultation information-collection summary based on AYUSH adaptive dataset. Does not constitute a medical diagnosis or prescription.",
            qa_records=answers_hist
        )
        db.add(ai_summary)

        # Update appointment status if appointment_id provided
        if session.appointment_id:
            apt_res = await db.execute(select(Appointment).where(Appointment.id == session.appointment_id))
            apt = apt_res.scalars().first()
            if apt:
                apt.pre_consultation_status = "COMPLETED"

    else:
        session.current_step += 1

    await db.commit()
    await db.refresh(session)

    # Progress Calculation
    progress = min(100, int((len(answers_hist) / 4) * 100)) if not is_sufficient else 100

    return PreConsultationSessionResponse(
        sessionId=session.id,
        patientId=session.patient_id,
        appointmentId=session.appointment_id,
        language=session.language,
        medicalSystem=session.medical_system,
        chiefComplaint=session.chief_complaint,
        currentStep=session.current_step,
        status=session.status,
        isEmergency=session.emergency_flag,
        emergencyFlag=emergency_flag,
        emergencyReason=session.emergency_reason,
        isSufficient=is_sufficient,
        progressPercent=progress,
        nextQuestion=PreConsultationQuestionResponse(
            id=next_q["id"],
            text=next_q["text"],
            englishText=next_q.get("englishText"),
            tamilText=next_q.get("tamilText"),
            hindiText=next_q.get("hindiText"),
            questionType=next_q.get("questionType", "duration"),
            inputType=next_q.get("inputType", "OPTIONS"),
            options=next_q.get("options", []),
            stepNumber=next_q.get("stepNumber", session.current_step),
            isEmergency=False,
            emergencyFlag="No"
        ) if next_q else None,
        summary=summary_text or session.summary,
        qaHistory=answers_hist
    )

@router.get("/{session_id}", response_model=PreConsultationSessionResponse)
async def get_pre_consultation_session(session_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve existing pre-consultation session and history."""
    res = await db.execute(select(PreConsultationSession).where(PreConsultationSession.id == session_id))
    session = res.scalars().first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Session {session_id} not found.")

    ctx = session.context_data or {}
    answers_hist = ctx.get("answersHistory", [])

    return PreConsultationSessionResponse(
        sessionId=session.id,
        patientId=session.patient_id,
        appointmentId=session.appointment_id,
        language=session.language,
        medicalSystem=session.medical_system,
        chiefComplaint=session.chief_complaint,
        currentStep=session.current_step,
        status=session.status,
        isEmergency=session.emergency_flag,
        emergencyFlag="Review urgently" if session.emergency_flag else "No",
        emergencyReason=session.emergency_reason,
        isSufficient=(session.status == "COMPLETED"),
        progressPercent=100 if session.status == "COMPLETED" else 50,
        nextQuestion=None,
        summary=session.summary,
        qaHistory=answers_hist
    )

@router.post("/{session_id}/complete", response_model=PreConsultationSessionResponse)
async def complete_pre_consultation_session(session_id: str, db: AsyncSession = Depends(get_db)):
    """Explicitly finalize pre-consultation session and generate final clinical summary."""
    res = await db.execute(select(PreConsultationSession).where(PreConsultationSession.id == session_id))
    session = res.scalars().first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Session {session_id} not found.")

    ctx = session.context_data or {}
    answers_hist = ctx.get("answersHistory", [])

    patient_context = {
        "language": session.language,
        "medicalSystem": session.medical_system,
        "chiefComplaint": session.chief_complaint,
        "age": session.age,
        "gender": session.gender,
        "severity": session.severity
    }

    summary_text = ayush_adaptive_engine.generate_summary(
        patient_context=patient_context,
        answers_history=answers_hist,
        emergency_flag="Review urgently" if session.emergency_flag else "No"
    )

    session.status = "COMPLETED"
    session.summary = summary_text

    # Update AIConsultationSummary
    sum_id = f"SUM-{int(datetime.datetime.utcnow().timestamp()*1000)}-{uuid.uuid4().hex[:4].upper()}"
    ai_summary = AIConsultationSummary(
        id=sum_id,
        patient_id=session.patient_id,
        appointment_id=session.appointment_id,
        medicine_system=session.medical_system,
        chief_complaint=session.chief_complaint or "Clinical case consultation",
        symptoms_list=[f"Step {a['step_number']}: {a['patient_answer']}" for a in answers_hist],
        duration=session.duration or "3 days",
        severity=8 if session.severity == "Severe" else 5,
        detected_red_flags=[session.emergency_reason] if session.emergency_flag and session.emergency_reason else [],
        recommended_triage="EMERGENCY" if session.emergency_flag else "NORMAL",
        confidence_score=98.0,
        disclaimer="IMPORTANT CLINICAL NOTICE: Pre-consultation information-collection summary based on AYUSH adaptive dataset. Does not constitute a medical diagnosis or prescription.",
        qa_records=answers_hist
    )
    db.add(ai_summary)

    if session.appointment_id:
        apt_res = await db.execute(select(Appointment).where(Appointment.id == session.appointment_id))
        apt = apt_res.scalars().first()
        if apt:
            apt.pre_consultation_status = "COMPLETED"

    await db.commit()
    await db.refresh(session)

    return PreConsultationSessionResponse(
        sessionId=session.id,
        patientId=session.patient_id,
        appointmentId=session.appointment_id,
        language=session.language,
        medicalSystem=session.medical_system,
        chiefComplaint=session.chief_complaint,
        currentStep=session.current_step,
        status=session.status,
        isEmergency=session.emergency_flag,
        emergencyFlag="Review urgently" if session.emergency_flag else "No",
        emergencyReason=session.emergency_reason,
        isSufficient=True,
        progressPercent=100,
        nextQuestion=None,
        summary=summary_text,
        qaHistory=answers_hist
    )

@router.get("/dataset/stats")
async def get_dataset_stats(db: AsyncSession = Depends(get_db)):
    """Returns validation statistics for the 1,875-record AYUSH adaptive dataset."""
    total_res = await db.execute(select(func.count(AYUSHPreConsultationDataset.id)))
    total_count = total_res.scalar() or 0

    languages_res = await db.execute(
        select(AYUSHPreConsultationDataset.language, func.count(AYUSHPreConsultationDataset.id))
        .group_by(AYUSHPreConsultationDataset.language)
    )
    lang_stats = {r[0]: r[1] for r in languages_res.all()}

    systems_res = await db.execute(
        select(AYUSHPreConsultationDataset.medical_system, func.count(AYUSHPreConsultationDataset.id))
        .group_by(AYUSHPreConsultationDataset.medical_system)
    )
    sys_stats = {r[0]: r[1] for r in systems_res.all()}

    return {
        "totalRecords": total_count,
        "targetTotal": 1875,
        "isValid": (total_count == 1875),
        "languages": lang_stats,
        "medicalSystems": sys_stats,
        "ayushSystemsList": ["Ayurveda", "Siddha", "Unani", "Yoga & Naturopathy", "Homoeopathy"]
    }
