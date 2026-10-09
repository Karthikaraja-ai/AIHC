import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON, Boolean
from app.database.base import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(64), primary_key=True, index=True) # Primary Key / patientId e.g. PAT-0001
    full_name = Column(String(128), nullable=False)
    phone = Column(String(32), nullable=False, index=True)
    email = Column(String(128), nullable=True)
    age = Column(Integer, nullable=True)
    sex = Column(String(16), nullable=True)
    gender = Column(String(16), nullable=True)
    age_group = Column(String(16), nullable=True)
    preferred_medicine_system = Column(String(32), default="ALLOPATHY_HOMEOPATHY")
    preferred_language = Column(String(8), default="en")
    abha_address = Column(String(128), nullable=True)
    abha_id = Column(String(128), nullable=True)
    blood_group = Column(String(8), nullable=True)
    allergies = Column(JSON, default=dict) # drugs, food, others
    chronic_diseases = Column(JSON, default=list)
    diseases = Column(JSON, default=list)
    chronic_synchronous_diseases = Column(JSON, default=list)
    relative_number = Column(String(32), nullable=True)
    medical_updates_history = Column(JSON, default=list)
    consent = Column(JSON, default=dict) # ABDMConsent object
    is_demo_account = Column(Boolean, default=False)
    account_status = Column(String(32), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
