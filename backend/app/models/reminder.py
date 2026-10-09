import datetime
from sqlalchemy import Column, String, DateTime, JSON
from app.database.base import Base

class MedicineReminder(Base):
    __tablename__ = "medicine_reminders"

    id = Column(String(64), primary_key=True, index=True) # reminderId
    patient_id = Column(String(64), nullable=False, index=True)
    prescription_id = Column(String(64), nullable=True)
    medicine_name = Column(String(128), nullable=False)
    dosage = Column(String(64), nullable=False)
    frequency = Column(String(64), nullable=False)
    duration = Column(String(64), nullable=False)
    start_date = Column(String(32), nullable=False)
    end_date = Column(String(32), nullable=True)
    reminder_times = Column(JSON, default=list) # e.g. ["08:00 AM", "08:00 PM"]
    instructions = Column(String(256), nullable=True)
    status = Column(String(32), default="ACTIVE") # ACTIVE, PAUSED, COMPLETED
    adherence_logs = Column(JSON, default=list) # list of {logId, date, time, status, loggedAt, notes}
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
