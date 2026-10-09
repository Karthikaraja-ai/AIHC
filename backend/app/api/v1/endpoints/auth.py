import datetime
import uuid
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.database.session import get_db
from app.models.user import User
from app.models.patient import Patient
from app.schemas.auth import LoginCredentials, Token, UserRegister
from app.core.security import verify_password, get_password_hash, create_access_token
from app.api.deps import get_current_user

router = APIRouter()

def serialize_user(user: User) -> Dict[str, Any]:
    p_details = user.patient_details or {}
    return {
        "id": user.id,
        "role": user.role,
        "name": user.name,
        "phone": user.phone,
        "email": user.email,
        "patientId": user.patient_id,
        "staffId": user.staff_id,
        "isDemoAccount": user.is_demo_account,
        "accountStatus": user.account_status,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
        "doctorDetails": user.doctor_details,
        "nurseDetails": user.nurse_details,
        "labTechDetails": user.lab_tech_details,
        "patientDetails": user.patient_details,
        "age": p_details.get("age"),
        "sex": p_details.get("sex"),
        "gender": p_details.get("gender"),
        "ageGroup": p_details.get("ageGroup"),
    }

@router.post("/login", response_model=Token)
async def login(credentials: LoginCredentials, db: AsyncSession = Depends(get_db)):
    clean_id = credentials.uniqueId.strip()
    
    # Query across staff_id, patient_id, phone, email, or id
    query = select(User).where(
        or_(
            User.staff_id == clean_id,
            User.patient_id == clean_id,
            User.phone == clean_id,
            User.email == clean_id,
            User.id == clean_id
        )
    )
    result = await db.execute(query)
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Unique ID or credentials."
        )

    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password."
        )

    token = create_access_token(
        subject=user.id,
        extra_claims={
            "role": user.role,
            "patientId": user.patient_id,
            "staffId": user.staff_id,
            "name": user.name
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": serialize_user(user)
    }

@router.post("/register")
async def register(req: UserRegister, db: AsyncSession = Depends(get_db)):
    pwd_hash = get_password_hash(req.password)
    user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"

    patient_id = req.patientId
    staff_id = req.staffId

    if req.role == "PATIENT" and not patient_id:
        patient_id = f"PAT-{uuid.uuid4().hex[:4].upper()}"
    elif req.role != "PATIENT" and not staff_id:
        prefix = "DOC" if req.role == "DOCTOR" else "NUR" if req.role == "NURSE" else "LAB"
        staff_id = f"{prefix}-{uuid.uuid4().hex[:4].upper()}"

    patient_details = req.patientDetails
    age_val = req.age
    sex_val = req.sex or req.gender or "FEMALE"
    gender_val = req.gender or req.sex or "FEMALE"
    age_group_val = req.ageGroup or ("CHILD" if (age_val is not None and age_val < 18) else "ADULT")

    blood_group_val = req.bloodGroup or req.blood_group

    if req.role == "PATIENT":
        if not patient_details:
            patient_details = {
                "age": age_val,
                "sex": sex_val,
                "gender": gender_val,
                "ageGroup": age_group_val,
                "bloodGroup": blood_group_val,
            }
        else:
            if age_val is not None and "age" not in patient_details:
                patient_details["age"] = age_val
            if "sex" not in patient_details:
                patient_details["sex"] = sex_val
            if "gender" not in patient_details:
                patient_details["gender"] = gender_val
            if "ageGroup" not in patient_details:
                patient_details["ageGroup"] = age_group_val
            if blood_group_val and "bloodGroup" not in patient_details:
                patient_details["bloodGroup"] = blood_group_val

    new_user = User(
        id=user_id,
        role=req.role,
        name=req.name,
        phone=req.phone,
        email=req.email,
        patient_id=patient_id,
        staff_id=staff_id,
        password_hash=pwd_hash,
        is_demo_account=False,
        account_status="ACTIVE",
        doctor_details=req.doctorDetails,
        nurse_details=req.nurseDetails,
        lab_tech_details=req.labTechDetails,
        patient_details=patient_details
    )
    db.add(new_user)

    if req.role == "PATIENT":
        new_patient = Patient(
            id=patient_id,
            full_name=req.name,
            phone=req.phone or "",
            email=req.email,
            age=age_val,
            sex=sex_val,
            gender=gender_val,
            age_group=age_group_val,
            blood_group=blood_group_val,
            is_demo_account=False,
            account_status="ACTIVE",
            consent={
                "status": "SKIPPED",
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "purpose": "Care Continuity",
                "version": "v2.1-DPDP-2023",
                "scope": []
            }
        )
        db.add(new_patient)

    await db.commit()
    await db.refresh(new_user)

    token = create_access_token(
        subject=new_user.id,
        extra_claims={
            "role": new_user.role,
            "patientId": new_user.patient_id,
            "staffId": new_user.staff_id,
            "name": new_user.name
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": serialize_user(new_user)
    }

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return serialize_user(current_user)
