from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.models.patient import Patient
from app.schemas.patient import PatientUpdate

router = APIRouter()

def serialize_patient(p: Patient) -> Dict[str, Any]:
    return {
        "patientId": p.id,
        "fullName": p.full_name,
        "phone": p.phone,
        "email": p.email,
        "age": p.age,
        "sex": p.sex,
        "gender": p.gender,
        "ageGroup": p.age_group,
        "preferredMedicineSystem": p.preferred_medicine_system,
        "preferredLanguage": p.preferred_language,
        "abhaAddress": p.abha_address,
        "abhaId": p.abha_id,
        "bloodGroup": p.blood_group,
        "allergies": p.allergies or {},
        "chronicDiseases": p.chronic_diseases or [],
        "diseases": p.diseases or [],
        "chronicSynchronousDiseases": p.chronic_synchronous_diseases or [],
        "relativeNumber": p.relative_number,
        "medicalUpdatesHistory": p.medical_updates_history or [],
        "consent": p.consent or {},
        "isDemoAccount": p.is_demo_account,
        "accountStatus": p.account_status,
        "createdAt": p.created_at.isoformat() if p.created_at else None
    }

@router.get("", response_model=List[Dict[str, Any]])
async def list_patients(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Patient))
    patients = result.scalars().all()
    return [serialize_patient(p) for p in patients]

@router.get("/{patient_id}")
async def get_patient(patient_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalars().first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return serialize_patient(patient)

@router.put("/{patient_id}")
async def update_patient(patient_id: str, update: PatientUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalars().first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    if update.fullName is not None:
        patient.full_name = update.fullName
    if update.phone is not None:
        patient.phone = update.phone
    if update.email is not None:
        patient.email = update.email
    if update.age is not None:
        patient.age = update.age
    if update.sex is not None:
        patient.sex = update.sex
    if update.gender is not None:
        patient.gender = update.gender
    if update.ageGroup is not None:
        patient.age_group = update.ageGroup
    if update.preferredMedicineSystem is not None:
        patient.preferred_medicine_system = update.preferredMedicineSystem
    if update.preferredLanguage is not None:
        patient.preferred_language = update.preferredLanguage
    if update.abhaAddress is not None:
        patient.abha_address = update.abhaAddress
    if update.abhaId is not None:
        patient.abha_id = update.abhaId
    if update.bloodGroup is not None:
        patient.blood_group = update.bloodGroup
    if update.allergies is not None:
        patient.allergies = update.allergies
    if update.chronicDiseases is not None:
        patient.chronic_diseases = update.chronicDiseases
    if update.diseases is not None:
        patient.diseases = update.diseases
    if update.chronicSynchronousDiseases is not None:
        patient.chronic_synchronous_diseases = update.chronicSynchronousDiseases
    if update.relativeNumber is not None:
        patient.relative_number = update.relativeNumber
    if update.consent is not None:
        patient.consent = update.consent

    await db.commit()
    await db.refresh(patient)
    return serialize_patient(patient)
