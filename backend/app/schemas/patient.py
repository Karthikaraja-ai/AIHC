from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class ABDMConsentSchema(BaseModel):
    status: str
    timestamp: str
    purpose: str
    version: str
    scope: List[str]
    withdrawalDate: Optional[str] = None

class PatientUpdate(BaseModel):
    fullName: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None
    gender: Optional[str] = None
    ageGroup: Optional[str] = None
    preferredMedicineSystem: Optional[str] = None
    preferredLanguage: Optional[str] = None
    abhaAddress: Optional[str] = None
    abhaId: Optional[str] = None
    bloodGroup: Optional[str] = None
    allergies: Optional[Dict[str, Any]] = None
    chronicDiseases: Optional[List[str]] = None
    diseases: Optional[List[str]] = None
    chronicSynchronousDiseases: Optional[List[str]] = None
    relativeNumber: Optional[str] = None
    consent: Optional[Dict[str, Any]] = None
