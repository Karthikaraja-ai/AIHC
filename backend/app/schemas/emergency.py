from typing import Optional
from pydantic import BaseModel

class EmergencyAlertCreate(BaseModel):
    patientId: str
    patientName: str
    symptomSummary: str
    triageLevel: Optional[str] = "EMERGENCY"
    vitalsAlert: Optional[str] = None

class EmergencyAlertStatusUpdate(BaseModel):
    status: str # ACTIVE, ACKNOWLEDGED, RESOLVED
    acknowledgedBy: Optional[str] = None
