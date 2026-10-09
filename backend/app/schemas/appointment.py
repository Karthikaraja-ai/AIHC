from typing import Optional
from pydantic import BaseModel

class AppointmentCreate(BaseModel):
    patientId: str
    patientName: str
    hospital: str
    department: str
    doctorId: str
    doctorName: str
    medicineSystem: Optional[str] = "ALLOPATHY_HOMEOPATHY"
    date: str
    timeSlot: str
    triagePriority: Optional[str] = "NORMAL"
    tokenNumber: Optional[str] = None

class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    preConsultationStatus: Optional[str] = None
    triagePriority: Optional[str] = None
    tokenNumber: Optional[str] = None
    isArchived: Optional[bool] = None
    revokeCancelled: Optional[bool] = None
