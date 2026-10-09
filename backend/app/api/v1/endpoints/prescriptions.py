import uuid
import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.models.prescription import Prescription
from app.schemas.prescription import PrescriptionCreate

router = APIRouter()

def serialize_prescription(p: Prescription) -> Dict[str, Any]:
    return {
        "id": p.id,
        "prescriptionId": p.prescription_id,
        "patientId": p.patient_id,
        "patientName": p.patient_name,
        "doctorId": p.doctor_id,
        "doctorName": p.doctor_name,
        "doctorRegNo": p.doctor_reg_no,
        "doctorSpecialization": p.doctor_specialization,
        "department": p.department,
        "hospitalName": p.hospital_name,
        "appointmentId": p.appointment_id,
        "consultationId": p.consultation_id,
        "date": p.date,
        "prescribedAt": p.prescribed_at.isoformat() if p.prescribed_at else None,
        "diagnosis": p.diagnosis,
        "items": p.items or [],
        "medications": p.items or [],
        "doctorNotes": p.doctor_notes,
        "createdAt": p.created_at.isoformat() if p.created_at else None
    }

@router.get("", response_model=List[Dict[str, Any]])
async def list_prescriptions(
    patient_id: Optional[str] = Query(None),
    doctor_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(Prescription)
    if patient_id:
        query = query.where(Prescription.patient_id == patient_id)
    if doctor_id:
        query = query.where(Prescription.doctor_id == doctor_id)

    result = await db.execute(query)
    prescriptions = result.scalars().all()
    return [serialize_prescription(p) for p in prescriptions]

@router.post("", response_model=Dict[str, Any])
async def create_prescription(req: PrescriptionCreate, db: AsyncSession = Depends(get_db)):
    rx_id = req.prescriptionId or f"RX-{int(datetime.datetime.utcnow().timestamp()*1000)}-{uuid.uuid4().hex[:4].upper()}"
    new_rx = Prescription(
        id=rx_id,
        prescription_id=rx_id,
        patient_id=req.patientId,
        patient_name=req.patientName,
        doctor_id=req.doctorId,
        doctor_name=req.doctorName,
        doctor_reg_no=req.doctorRegNo,
        doctor_specialization=req.doctorSpecialization,
        department=req.department,
        hospital_name=req.hospitalName,
        appointmentId=req.appointmentId,
        consultationId=req.consultationId,
        date=req.date,
        diagnosis=req.diagnosis,
        items=[item.model_dump() for item in req.items],
        doctor_notes=req.doctorNotes
    )
    db.add(new_rx)
    await db.commit()
    await db.refresh(new_rx)
    return serialize_prescription(new_rx)
