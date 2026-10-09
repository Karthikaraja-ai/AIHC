import datetime
from sqlalchemy import Column, String, DateTime
from app.database.base import Base

class EmergencyAlert(Base):
    __tablename__ = "emergency_alerts"

    id = Column(String(64), primary_key=True, index=True)
    patient_id = Column(String(64), nullable=False, index=True)
    patient_name = Column(String(128), nullable=False)
    symptom_summary = Column(String(512), nullable=False)
    detected_at = Column(DateTime, default=datetime.datetime.utcnow)
    triage_level = Column(String(32), default="EMERGENCY") # EMERGENCY, URGENT
    status = Column(String(32), default="ACTIVE") # ACTIVE, ACKNOWLEDGED, RESOLVED
    acknowledged_by = Column(String(128), nullable=True)
    vitals_alert = Column(String(512), nullable=True)
