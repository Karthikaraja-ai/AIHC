import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON, Text
from app.database.base import Base

class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(String(64), primary_key=True, index=True)
    patient_id = Column(String(64), nullable=False, index=True)
    report_title = Column(String(256), nullable=False)
    report_date = Column(String(32), nullable=False)
    file_type = Column(String(16), nullable=False) # PDF, JPG, PNG
    original_file_url = Column(String(512), nullable=False)
    file_data_uri = Column(Text, nullable=True) # Optional base64 / data uri
    thumbnail_url = Column(String(512), nullable=True)
    file_size_bytes = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    uploaded_by = Column(String(128), nullable=True)
    report_type = Column(String(128), nullable=True)
    ocr_status = Column(String(32), default="COMPLETED") # PENDING, PROCESSING, COMPLETED, FAILED
    confidence_score = Column(Float, default=95.0)
    is_low_confidence = Column(Boolean, default=False)
    extracted_raw_text = Column(Text, nullable=True)
    extracted_parameters = Column(JSON, default=list) # LabParameter list
    ai_summary = Column(JSON, default=dict) # {en, ta, hi}
    critical_findings = Column(JSON, default=list)
    observations_for_discussion = Column(JSON, default=list)
    keywords = Column(JSON, default=list)
    doctor_verification_status = Column(String(32), default="UNVERIFIED")
    verified_by_doctor_name = Column(String(128), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    doctor_reported_impression = Column(String(1024), nullable=True)
    disclaimer = Column(String(512), default="AI-generated summary. Doctor verification required. Original document preserved.")
