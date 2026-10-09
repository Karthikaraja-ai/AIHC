from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class AdherenceLogSchema(BaseModel):
    logId: Optional[str] = None
    date: str
    time: str
    status: str # TAKEN, SKIPPED, SNOOZED
    loggedAt: Optional[str] = None
    notes: Optional[str] = None

class ReminderCreate(BaseModel):
    reminderId: Optional[str] = None
    patientId: str
    prescriptionId: Optional[str] = None
    medicineName: str
    dosage: str
    frequency: str
    duration: str
    startDate: str
    endDate: Optional[str] = None
    reminderTimes: List[str]
    instructions: Optional[str] = None
    status: Optional[str] = "ACTIVE"
    adherenceLogs: Optional[List[Dict[str, Any]]] = []
