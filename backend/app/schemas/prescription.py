from typing import Optional, List
from pydantic import BaseModel

class PrescriptionItemSchema(BaseModel):
    medicineName: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None

class PrescriptionCreate(BaseModel):
    prescriptionId: Optional[str] = None
    patientId: str
    patientName: str
    doctorId: str
    doctorName: str
    doctorRegNo: Optional[str] = None
    doctorSpecialization: Optional[str] = None
    department: Optional[str] = None
    hospitalName: str
    appointmentId: Optional[str] = None
    consultationId: Optional[str] = None
    date: str
    diagnosis: Optional[str] = None
    items: List[PrescriptionItemSchema]
    doctorNotes: Optional[str] = None
