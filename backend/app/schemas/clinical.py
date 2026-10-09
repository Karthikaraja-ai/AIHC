from typing import Optional
from pydantic import BaseModel

class VitalsCreate(BaseModel):
    patientId: str
    recordedBy: str
    bpSystolic: int
    bpDiastolic: int
    pulse: int
    spo2: int
    temperature: float
    respiratoryRate: int
    bloodSugar: Optional[float] = None
    notes: Optional[str] = None

class LabSampleCreate(BaseModel):
    sampleId: Optional[str] = None
    patientId: str
    patientName: str
    testName: str
    sampleType: str
    department: str
    status: Optional[str] = "COLLECTED"
    technicianName: Optional[str] = None
    reportUrl: Optional[str] = None
    summaryFindings: Optional[str] = None

class LabSampleUpdate(BaseModel):
    status: Optional[str] = None
    technicianName: Optional[str] = None
    reportUrl: Optional[str] = None
    summaryFindings: Optional[str] = None

class NurseAssignmentCreate(BaseModel):
    patientId: str
    patientName: str
    nurseId: str
    nurseName: str
    doctorId: str
    doctorName: str
    appointmentId: Optional[str] = None
    assignedDate: str
    careType: Optional[str] = "MONITORING"
    priority: Optional[str] = "NORMAL"
    instructions: Optional[str] = None
