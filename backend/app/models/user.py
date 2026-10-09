import datetime
from sqlalchemy import Column, String, Boolean, DateTime, JSON
from app.database.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    role = Column(String(32), nullable=False, index=True) # PATIENT, DOCTOR, NURSE, LAB_TECHNICIAN
    name = Column(String(128), nullable=False)
    phone = Column(String(32), nullable=True, index=True)
    email = Column(String(128), nullable=True, index=True)
    patient_id = Column(String(64), nullable=True, index=True) # e.g. PAT-0001
    staff_id = Column(String(64), nullable=True, index=True)   # e.g. DOC-0001, NUR-0001, LAB-0001
    password_hash = Column(String(256), nullable=False)
    salt = Column(String(64), nullable=True)
    is_demo_account = Column(Boolean, default=False)
    account_status = Column(String(32), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Role-specific nested metadata (stored cleanly as JSON)
    doctor_details = Column(JSON, nullable=True)
    nurse_details = Column(JSON, nullable=True)
    lab_tech_details = Column(JSON, nullable=True)
    patient_details = Column(JSON, nullable=True)
