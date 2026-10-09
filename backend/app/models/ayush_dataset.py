import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text
from app.database.base import Base

class AYUSHPreConsultationDataset(Base):
    __tablename__ = "ayush_preconsultation_dataset"

    id = Column(String(64), primary_key=True, index=True) # e.g. AYUSH-ADAPTIVE-0001
    language = Column(String(32), nullable=False, index=True) # English, Tamil, Hindi
    medical_system = Column(String(64), nullable=False, index=True) # Ayurveda, Siddha, Unani, Yoga & Naturopathy, Homoeopathy
    age = Column(Integer, nullable=True)
    gender = Column(String(16), nullable=True) # Male, Female
    chief_complaint = Column(String(256), nullable=False, index=True)
    duration = Column(String(64), nullable=True)
    severity = Column(String(32), nullable=True) # Mild, Moderate, Severe
    current_question = Column(Text, nullable=False)
    patient_answer = Column(Text, nullable=False)
    answer_category = Column(String(64), nullable=True) # initial
    next_question = Column(Text, nullable=False)
    next_question_type = Column(String(64), nullable=True) # duration
    emergency_flag = Column(String(64), nullable=False, default="No") # No, Review urgently, Needs clinician review
    pre_consultation_summary = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
