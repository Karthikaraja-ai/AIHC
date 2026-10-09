import datetime
from sqlalchemy import Column, String, DateTime, JSON
from app.database.base import Base

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(String(64), primary_key=True, index=True)
    prescription_id = Column(String(64), index=True)
    patient_id = Column(String(64), nullable=False, index=True)
    patient_name = Column(String(128), nullable=False)
    doctor_id = Column(String(64), nullable=False, index=True)
    doctor_name = Column(String(128), nullable=False)
    doctor_reg_no = Column(String(64), nullable=True)
    doctor_specialization = Column(String(128), nullable=True)
    department = Column(String(128), nullable=True)
    hospital_name = Column(String(256), nullable=False)
    appointment_id = Column(String(64), nullable=True)
    consultation_id = Column(String(64), nullable=True)
    date = Column(String(32), nullable=False)
    prescribed_at = Column(DateTime, default=datetime.datetime.utcnow)
    diagnosis = Column(String(512), nullable=True)
    items = Column(JSON, default=list) # List of PrescriptionItem: medicineName, dosage, frequency, duration, instructions
    doctor_notes = Column(String(1024), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
