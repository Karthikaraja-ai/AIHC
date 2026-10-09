import uuid
import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.models.clinical import PatientVitals, NurseAssignment
from app.schemas.clinical import VitalsCreate, NurseAssignmentCreate

router = APIRouter()

def serialize_vitals(v: PatientVitals) -> Dict[str, Any]:
    return {
        "id": v.id,
        "patientId": v.patient_id,
        "recordedAt": v.recorded_at.isoformat() if v.recorded_at else None,
        "recordedBy": v.recorded_by,
        "bpSystolic": v.bp_systolic,
        "bpDiastolic": v.bp_diastolic,
        "pulse": v.pulse,
        "spo2": v.spo2,
        "temperature": v.temperature,
        "respiratoryRate": v.respiratory_rate,
        "bloodSugar": v.blood_sugar,
        "notes": v.notes
    }

def serialize_assignment(a: NurseAssignment) -> Dict[str, Any]:
    return {
        "id": a.id,
        "assignmentId": a.assignment_id,
        "patientId": a.patient_id,
        "patientName": a.patient_name,
        "nurseId": a.nurse_id,
        "nurseName": a.nurse_name,
        "doctorId": a.doctor_id,
        "doctorName": a.doctor_name,
        "appointmentId": a.appointment_id,
        "assignedDate": a.assigned_date,
        "careType": a.care_type,
        "priority": a.priority,
        "status": a.status,
        "instructions": a.instructions,
        "createdAt": a.created_at.isoformat() if a.created_at else None
    }

@router.get("/vitals/{patient_id}", response_model=List[Dict[str, Any]])
async def get_patient_vitals(patient_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PatientVitals).where(PatientVitals.patient_id == patient_id))
    vitals = result.scalars().all()
    return [serialize_vitals(v) for v in vitals]

@router.post("/vitals", response_model=Dict[str, Any])
async def record_vitals(req: VitalsCreate, db: AsyncSession = Depends(get_db)):
    vit_id = f"VIT-{int(datetime.datetime.utcnow().timestamp()*1000)}-{uuid.uuid4().hex[:4].upper()}"
    new_vitals = PatientVitals(
        id=vit_id,
        patient_id=req.patientId,
        recorded_by=req.recordedBy,
        bp_systolic=req.bpSystolic,
        bp_diastolic=req.bpDiastolic,
        pulse=req.pulse,
        spo2=req.spo2,
        temperature=req.temperature,
        respiratory_rate=req.respiratoryRate,
        blood_sugar=req.bloodSugar,
        notes=req.notes
    )
    db.add(new_vitals)
    await db.commit()
    await db.refresh(new_vitals)
    return serialize_vitals(new_vitals)

@router.get("/assignments/{nurse_id}", response_model=List[Dict[str, Any]])
async def get_nurse_assignments(nurse_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(NurseAssignment).where(NurseAssignment.nurse_id == nurse_id))
    assignments = result.scalars().all()
    return [serialize_assignment(a) for a in assignments]

@router.post("/assignments", response_model=Dict[str, Any])
async def create_nurse_assignment(req: NurseAssignmentCreate, db: AsyncSession = Depends(get_db)):
    assign_id = f"ASN-{uuid.uuid4().hex[:6].upper()}"
    new_assign = NurseAssignment(
        id=assign_id,
        assignment_id=assign_id,
        patient_id=req.patientId,
        patient_name=req.patientName,
        nurse_id=req.nurseId,
        nurse_name=req.nurseName,
        doctor_id=req.doctorId,
        doctor_name=req.doctorName,
        appointment_id=req.appointmentId,
        assigned_date=req.assignedDate,
        care_type=req.careType or "MONITORING",
        priority=req.priority or "NORMAL",
        status="ACTIVE",
        instructions=req.instructions
    )
    db.add(new_assign)
    await db.commit()
    await db.refresh(new_assign)
    return serialize_assignment(new_assign)
