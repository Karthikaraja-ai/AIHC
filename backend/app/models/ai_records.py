import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, Text
from app.database.base import Base

class AIConsultationSummary(Base):
    __tablename__ = "ai_consultation_summaries"

    id = Column(String(64), primary_key=True, index=True)
    patient_id = Column(String(64), nullable=False, index=True)
    appointment_id = Column(String(64), nullable=True, index=True)
    medicine_system = Column(String(32), default="ALLOPATHY_HOMEOPATHY")
    hospital_name = Column(JSON, nullable=True) # Multilingual or string
    doctor_name = Column(JSON, nullable=True)   # Multilingual or string
    doctor_room = Column(String(32), nullable=True)
    chief_complaint = Column(String(512), nullable=False)
    chief_complaint_localized = Column(JSON, nullable=True) # {en, ta, hi}
    symptoms_list = Column(JSON, default=list)
    duration = Column(String(64), default="")
    severity = Column(Integer, default=5)
    body_locations = Column(JSON, default=list)
    associated_symptoms = Column(JSON, default=list)
    ayush_observations = Column(JSON, default=dict)
    yoga_observations = Column(JSON, default=dict)
    siddha_observations = Column(JSON, default=dict)
    unani_observations = Column(JSON, default=dict)
    allopathy_observations = Column(JSON, default=dict)
    detected_red_flags = Column(JSON, default=list)
    recommended_triage = Column(String(32), default="NORMAL") # EMERGENCY, URGENT, PRIORITY, NORMAL
    confidence_score = Column(Float, default=95.0)
    unanswered_questions = Column(JSON, default=list)
    disclaimer = Column(String(512), default="AI pre-consultation summary. Doctor verification required.")
    verified_by_doctor = Column(String(128), nullable=True)
    doctor_notes = Column(String(1024), nullable=True)
    qa_records = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class MultilingualQAPairRecord(Base):
    __tablename__ = "qa_pair_records"

    id = Column(String(64), primary_key=True, index=True)
    patient_id = Column(String(64), nullable=False, index=True)
    consultation_id = Column(String(64), nullable=False, index=True)
    medicine_system = Column(String(32), default="ALLOPATHY_HOMEOPATHY")
    question_id = Column(String(64), nullable=False)
    question_category = Column(String(64), nullable=False)
    original_question = Column(Text, nullable=False)
    english_question = Column(Text, nullable=False)
    tamil_question = Column(Text, nullable=False)
    hindi_question = Column(Text, nullable=False)
    patient_original_response = Column(Text, nullable=False)
    detected_response_language = Column(String(16), default="en")
    structured_interpretation = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    input_method = Column(String(32), default="TOUCH_SELECTION") # VOICE, TOUCH_SELECTION, TEXT
