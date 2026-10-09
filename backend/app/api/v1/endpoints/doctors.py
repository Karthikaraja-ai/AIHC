from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.models.user import User
from app.models.appointment import Appointment
from app.api.v1.endpoints.auth import serialize_user
from app.api.v1.endpoints.appointments import serialize_appointment

router = APIRouter()

@router.get("", response_model=List[Dict[str, Any]])
async def list_doctors(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.role == "DOCTOR"))
    doctors = result.scalars().all()
    return [serialize_user(d) for d in doctors]

@router.get("/{doctor_id}")
async def get_doctor(doctor_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.staff_id == doctor_id, User.role == "DOCTOR"))
    doc = result.scalars().first()
    if not doc:
        result = await db.execute(select(User).where(User.id == doctor_id, User.role == "DOCTOR"))
        doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return serialize_user(doc)

@router.get("/{doctor_id}/queue")
async def get_doctor_queue(doctor_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Appointment).where(Appointment.doctor_id == doctor_id))
    appointments = result.scalars().all()
    return [serialize_appointment(a) for a in appointments]
