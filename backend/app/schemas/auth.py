from typing import Optional, Dict, Any
from pydantic import BaseModel

class LoginCredentials(BaseModel):
    uniqueId: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class TokenData(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None

class UserRegister(BaseModel):
    name: str
    role: str # PATIENT, DOCTOR, NURSE, LAB_TECHNICIAN
    password: str
    phone: Optional[str] = None
    email: Optional[str] = None
    patientId: Optional[str] = None
    staffId: Optional[str] = None
    doctorDetails: Optional[Dict[str, Any]] = None
    nurseDetails: Optional[Dict[str, Any]] = None
    labTechDetails: Optional[Dict[str, Any]] = None
    age: Optional[int] = None
    sex: Optional[str] = None
    gender: Optional[str] = None
    ageGroup: Optional[str] = None
    bloodGroup: Optional[str] = None
    blood_group: Optional[str] = None
    patientDetails: Optional[Dict[str, Any]] = None
