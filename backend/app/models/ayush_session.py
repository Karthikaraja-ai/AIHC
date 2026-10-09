import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean, JSON, ForeignKey
from app.database.base import Base

class PreConsultationSession(Base):
    __tablename__ = "preconsultation_sessions"

    id = Column(String(64), primary_key=True, index=True) # e.g. SES-... or CNS-...
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False, index=True)
    appointment_id = Column(String(64), ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True, index=True)
    language = Column(String(32), default="English", nullable=False) # English, Tamil, Hindi
    medical_system = Column(String(64), default="Ayurveda", nullable=False) # Ayurveda, Siddha, Unani, Yoga & Naturopathy, Homoeopathy
    chief_complaint = Column(String(512), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(16), nullable=True)
    duration = Column(String(64), nullable=True)
    severity = Column(String(32), default="Moderate", nullable=True) # Mild, Moderate, Severe
    status = Column(String(32), default="IN_PROGRESS") # IN_PROGRESS, COMPLETED, EMERGENCY_STOPPED
    emergency_flag = Column(Boolean, default=False)
    emergency_reason = Column(String(512), nullable=True)
    current_step = Column(Integer, default=1)
    summary = Column(Text, nullable=True)
    context_data = Column(JSON, default=dict) # Stores full question/answer audit state & selections
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class PreConsultationResponse(Base):
    __tablename__ = "preconsultation_responses"

    id = Column(String(64), primary_key=True, index=True) # e.g. RESP-...
    session_id = Column(String(64), ForeignKey("preconsultation_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False, index=True)
    question_id = Column(String(64), nullable=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(64), default="duration")
    patient_answer = Column(Text, nullable=False)
    answer_category = Column(String(64), default="patient_response")
    language = Column(String(32), default="English")
    medical_system = Column(String(64), nullable=True)
    step_number = Column(Integer, default=1)
    emergency_flag = Column(String(64), default="No") # No, Needs clinician review, Review urgently
    is_emergency = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
