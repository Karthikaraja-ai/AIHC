import uuid
import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate

router = APIRouter()

def serialize_appointment(a: Appointment) -> Dict[str, Any]:
    return {
        "id": a.id,
        "patientId": a.patient_id,
        "patientName": a.patient_name,
        "hospital": a.hospital,
        "department": a.department,
        "doctorId": a.doctor_id,
        "doctorName": a.doctor_name,
        "medicineSystem": a.medicine_system,
        "date": a.date,
        "timeSlot": a.time_slot,
        "status": a.status,
        "preConsultationStatus": a.pre_consultation_status,
        "triagePriority": a.triage_priority,
        "bookedAt": a.booked_at.isoformat() if a.booked_at else None,
        "tokenNumber": a.token_number,
        "isArchived": a.is_archived,
        "revokeCancelled": getattr(a, "revoke_cancelled", False)
    }

@router.get("", response_model=List[Dict[str, Any]])
async def list_appointments(
    patient_id: Optional[str] = Query(None),
    doctor_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(Appointment)
    if patient_id:
        query = query.where(Appointment.patient_id == patient_id)
    if doctor_id:
        query = query.where(Appointment.doctor_id == doctor_id)

    result = await db.execute(query)
    apts = result.scalars().all()
    return [serialize_appointment(a) for a in apts]

@router.post("", response_model=Dict[str, Any])
async def create_appointment(req: AppointmentCreate, db: AsyncSession = Depends(get_db)):
    # On next consultation booking, convert previous access revoked/completed appointments to archived and cancel revocation
    past_query = select(Appointment).where(
        Appointment.patient_id == req.patientId,
        Appointment.status == "COMPLETED"
    )
    past_res = await db.execute(past_query)
    past_apts = past_res.scalars().all()
    for pa in past_apts:
        pa.is_archived = True
        pa.revoke_cancelled = True

    apt_id = f"APT-{int(datetime.datetime.utcnow().timestamp()*1000)}-{uuid.uuid4().hex[:4].upper()}"
    new_apt = Appointment(
        id=apt_id,
        patient_id=req.patientId,
        patient_name=req.patientName,
        hospital=req.hospital,
        department=req.department,
        doctor_id=req.doctorId,
        doctor_name=req.doctorName,
        medicine_system=req.medicineSystem or "ALLOPATHY_HOMEOPATHY",
        date=req.date,
        time_slot=req.timeSlot,
        status="SCHEDULED",
        pre_consultation_status="NOT_STARTED",
        triage_priority="NORMAL",
        token_number=req.tokenNumber or f"TK-{uuid.uuid4().hex[:2].upper()}",
        is_archived=False
    )
    db.add(new_apt)
    await db.commit()
    await db.refresh(new_apt)
    return serialize_appointment(new_apt)

@router.put("/{appointment_id}")
async def update_appointment(appointment_id: str, update: AppointmentUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    apt = result.scalars().first()
    if not apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    if update.status is not None:
        apt.status = update.status
    if update.preConsultationStatus is not None:
        apt.pre_consultation_status = update.preConsultationStatus
    if update.triagePriority is not None:
        apt.triage_priority = update.triagePriority
    if update.tokenNumber is not None:
        apt.token_number = update.tokenNumber
    if update.isArchived is not None:
        apt.is_archived = update.isArchived
    if update.revokeCancelled is not None:
        apt.revoke_cancelled = update.revokeCancelled

    await db.commit()
    await db.refresh(apt)
    return serialize_appointment(apt)

@router.post("/{appointment_id}/reset-cycle")
async def reset_appointment_cycle(appointment_id: str, db: AsyncSession = Depends(get_db)):
    """Reset consultation workflow back to starting step for new cycle."""
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    apt = result.scalars().first()
    if not apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    apt.status = "SCHEDULED"
    apt.pre_consultation_status = "NOT_STARTED"
    apt.triage_priority = "NORMAL"

    await db.commit()
    await db.refresh(apt)
    return serialize_appointment(apt)
