import uuid
import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.models.ai_records import AIConsultationSummary, MultilingualQAPairRecord
from app.schemas.ai import NextQuestionRequest, AnswerSubmissionRequest, SummaryGenerateRequest
from app.ai.pre_consultation.engine import ai_engine

router = APIRouter()

def serialize_summary(s: AIConsultationSummary) -> Dict[str, Any]:
    return {
        "id": s.id,
        "patientId": s.patient_id,
        "appointmentId": s.appointment_id,
        "createdAt": s.created_at.isoformat() if s.created_at else None,
        "medicineSystem": s.medicine_system,
        "hospitalName": s.hospital_name,
        "doctorName": s.doctor_name,
        "doctorRoom": s.doctor_room,
        "chiefComplaint": s.chief_complaint,
        "chiefComplaintLocalized": s.chief_complaint_localized,
        "symptomsList": s.symptoms_list or [],
        "duration": s.duration,
        "severity": s.severity,
        "bodyLocations": s.body_locations or [],
        "associatedSymptoms": s.associated_symptoms or [],
        "ayushObservations": s.ayush_observations,
        "yogaObservations": s.yoga_observations,
        "siddhaObservations": s.siddha_observations,
        "unaniObservations": s.unani_observations,
        "allopathyObservations": s.allopathy_observations,
        "detectedRedFlags": s.detected_red_flags or [],
        "recommendedTriage": s.recommended_triage,
        "confidenceScore": s.confidence_score,
        "unansweredQuestions": s.unanswered_questions or [],
        "disclaimer": s.disclaimer,
        "verifiedByDoctor": s.verified_by_doctor,
        "doctorNotes": s.doctor_notes,
        "qaRecords": s.qa_records or []
    }

@router.post("/next-question")
async def get_next_question(req: NextQuestionRequest):
    question = ai_engine.get_next_adaptive_question(
        medicine_system=req.medicineSystem,
        answers=req.answersSoFar,
        body_selections=req.bodySelections
    )
    sufficiency = ai_engine.evaluate_sufficiency(
        answers=req.answersSoFar,
        chief_complaint="",
        body_selections=req.bodySelections or []
    )
    return {
        "nextQuestion": question,
        "isSufficient": sufficiency["isSufficient"],
        "progressPercent": sufficiency["progressPercent"]
    }

@router.post("/submit-answer")
async def submit_answer(req: AnswerSubmissionRequest, db: AsyncSession = Depends(get_db)):
    interpretation = ai_engine.interpret_patient_response(
        question_id=req.questionId,
        answer_text=req.patientOriginalResponse,
        medicine_system=req.medicineSystem
    )
    qa_id = f"QA-{int(datetime.datetime.utcnow().timestamp()*1000)}-{uuid.uuid4().hex[:4].upper()}"
    record = MultilingualQAPairRecord(
        id=qa_id,
        patient_id=req.patientId,
        consultation_id=req.consultationId,
        medicine_system=req.medicineSystem,
        question_id=req.questionId,
        question_category=req.questionCategory,
        original_question=req.originalQuestion,
        english_question=req.englishQuestion,
        tamil_question=req.tamilQuestion,
        hindi_question=req.hindiQuestion,
        patient_original_response=req.patientOriginalResponse,
        detected_response_language="en",
        structured_interpretation=interpretation,
        input_method=req.inputMethod or "TOUCH_SELECTION"
    )
    db.add(record)
    await db.commit()

    return {
        "success": True,
        "qaId": qa_id,
        "structuredInterpretation": interpretation
    }

@router.post("/generate-summary", response_model=Dict[str, Any])
async def generate_summary(req: SummaryGenerateRequest, db: AsyncSession = Depends(get_db)):
    summary_data = ai_engine.generate_summary(
        patient_id=req.patientId,
        medicine_system=req.medicineSystem,
        answers=req.answers,
        body_selections=req.bodySelections,
        appointment_id=req.appointmentId,
        preferred_language=req.preferredLanguage or "en"
    )

    summary_record = AIConsultationSummary(
        id=summary_data["id"],
        patient_id=summary_data["patientId"],
        appointment_id=summary_data.get("appointmentId"),
        medicine_system=summary_data["medicineSystem"],
        chief_complaint=summary_data["chiefComplaint"],
        symptoms_list=summary_data["symptomsList"],
        duration=summary_data["duration"],
        severity=summary_data["severity"],
        body_locations=summary_data["bodyLocations"],
        associated_symptoms=summary_data["associatedSymptoms"],
        detected_red_flags=summary_data["detectedRedFlags"],
        recommended_triage=summary_data["recommendedTriage"],
        confidence_score=summary_data["confidenceScore"],
        disclaimer=summary_data["disclaimer"],
        qa_records=summary_data.get("qaRecords", [])
    )
    db.add(summary_record)
    await db.commit()
    await db.refresh(summary_record)

    return serialize_summary(summary_record)

@router.get("/summaries/{patient_id}", response_model=List[Dict[str, Any]])
async def get_patient_summaries(patient_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AIConsultationSummary).where(AIConsultationSummary.patient_id == patient_id))
    summaries = result.scalars().all()
    return [serialize_summary(s) for s in summaries]
