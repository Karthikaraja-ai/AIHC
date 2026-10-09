import uuid
import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.models.reminder import MedicineReminder
from app.schemas.reminder import ReminderCreate, AdherenceLogSchema

router = APIRouter()

def serialize_reminder(r: MedicineReminder) -> Dict[str, Any]:
    return {
        "reminderId": r.id,
        "patientId": r.patient_id,
        "prescriptionId": r.prescription_id,
        "medicineName": r.medicine_name,
        "dosage": r.dosage,
        "frequency": r.frequency,
        "duration": r.duration,
        "startDate": r.start_date,
        "endDate": r.end_date,
        "reminderTimes": r.reminder_times or [],
        "instructions": r.instructions,
        "status": r.status,
        "adherenceLogs": r.adherence_logs or [],
        "createdAt": r.created_at.isoformat() if r.created_at else None
    }

@router.get("", response_model=List[Dict[str, Any]])
async def list_reminders(
    patient_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(MedicineReminder)
    if patient_id:
        query = query.where(MedicineReminder.patient_id == patient_id)

    result = await db.execute(query)
    reminders = result.scalars().all()
    return [serialize_reminder(r) for r in reminders]

@router.post("", response_model=Dict[str, Any])
async def create_reminder(req: ReminderCreate, db: AsyncSession = Depends(get_db)):
    rem_id = req.reminderId or f"REM-{int(datetime.datetime.utcnow().timestamp()*1000)}-{uuid.uuid4().hex[:4].upper()}"
    new_rem = MedicineReminder(
        id=rem_id,
        patient_id=req.patientId,
        prescription_id=req.prescriptionId,
        medicine_name=req.medicineName,
        dosage=req.dosage,
        frequency=req.frequency,
        duration=req.duration,
        start_date=req.startDate,
        end_date=req.endDate,
        reminder_times=req.reminderTimes,
        instructions=req.instructions,
        status=req.status or "ACTIVE",
        adherence_logs=req.adherenceLogs or []
    )
    db.add(new_rem)
    await db.commit()
    await db.refresh(new_rem)
    return serialize_reminder(new_rem)

@router.put("/{reminder_id}/status", response_model=Dict[str, Any])
async def update_reminder_status(reminder_id: str, status_val: str = Query(..., alias="status"), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MedicineReminder).where(MedicineReminder.id == reminder_id))
    rem = result.scalars().first()
    if not rem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")

    rem.status = status_val
    await db.commit()
    await db.refresh(rem)
    return serialize_reminder(rem)

@router.post("/{reminder_id}/adherence", response_model=Dict[str, Any])
async def log_adherence(reminder_id: str, req: AdherenceLogSchema, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MedicineReminder).where(MedicineReminder.id == reminder_id))
    rem = result.scalars().first()
    if not rem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")

    log_entry = {
        "logId": req.logId or f"ADH-{int(datetime.datetime.utcnow().timestamp()*1000)}-{uuid.uuid4().hex[:3].upper()}",
        "date": req.date,
        "time": req.time,
        "status": req.status,
        "loggedAt": req.loggedAt or datetime.datetime.utcnow().isoformat(),
        "notes": req.notes
    }

    logs = list(rem.adherence_logs or [])
    logs.insert(0, log_entry)
    rem.adherence_logs = logs

    await db.commit()
    await db.refresh(rem)
    return serialize_reminder(rem)

@router.delete("/{reminder_id}")
async def delete_reminder(reminder_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MedicineReminder).where(MedicineReminder.id == reminder_id))
    rem = result.scalars().first()
    if not rem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")

    await db.delete(rem)
    await db.commit()
    return {"message": "Reminder deleted successfully"}
