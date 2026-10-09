import datetime
from sqlalchemy import Column, String, DateTime, Boolean
from app.database.base import Base

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String(64), primary_key=True, index=True)
    patient_id = Column(String(64), nullable=False, index=True)
    patient_name = Column(String(128), nullable=False)
    hospital = Column(String(256), nullable=False)
    department = Column(String(128), nullable=False)
    doctor_id = Column(String(64), nullable=False, index=True)
    doctor_name = Column(String(128), nullable=False)
    medicine_system = Column(String(32), default="ALLOPATHY_HOMEOPATHY")
    date = Column(String(32), nullable=False)
    time_slot = Column(String(32), nullable=False)
    status = Column(String(32), default="SCHEDULED") # SCHEDULED, WAITING, IN_CONSULTATION, COMPLETED, CANCELLED
    pre_consultation_status = Column(String(32), default="NOT_STARTED") # NOT_STARTED, IN_PROGRESS, COMPLETED
    triage_priority = Column(String(32), default="NORMAL") # EMERGENCY, URGENT, PRIORITY, NORMAL
    booked_at = Column(DateTime, default=datetime.datetime.utcnow)
    token_number = Column(String(32), nullable=True)
    is_archived = Column(Boolean, default=False)
    revoke_cancelled = Column(Boolean, default=False)
