import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON
from app.database.base import Base

class PatientVitals(Base):
    __tablename__ = "patient_vitals"

    id = Column(String(64), primary_key=True, index=True)
    patient_id = Column(String(64), nullable=False, index=True)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)
    recorded_by = Column(String(128), nullable=False) # Nurse name or staff ID
    bp_systolic = Column(Integer, nullable=False)
    bp_diastolic = Column(Integer, nullable=False)
    pulse = Column(Integer, nullable=False)
    spo2 = Column(Integer, nullable=False)
    temperature = Column(Float, nullable=False)
    respiratory_rate = Column(Integer, nullable=False)
    blood_sugar = Column(Float, nullable=True)
    notes = Column(String(512), nullable=True)

class LabSample(Base):
    __tablename__ = "lab_samples"

    sample_id = Column(String(64), primary_key=True, index=True) # e.g. SMP-88321
    patient_id = Column(String(64), nullable=False, index=True)
    patient_name = Column(String(128), nullable=False)
    test_name = Column(String(128), nullable=False)
    sample_type = Column(String(64), nullable=False) # Blood, Urine, Sputum, Swab, Biopsy
    department = Column(String(64), nullable=False)  # Biochemistry, Hematology, etc.
    status = Column(String(32), default="COLLECTED") # COLLECTED, IN_PROGRESS, COMPLETED
    received_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    technician_name = Column(String(128), nullable=True)
    report_url = Column(String(512), nullable=True)
    summary_findings = Column(String(1024), nullable=True)

class NurseAssignment(Base):
    __tablename__ = "nurse_assignments"

    id = Column(String(64), primary_key=True, index=True)
    assignment_id = Column(String(64), index=True)
    patient_id = Column(String(64), nullable=False, index=True)
    patient_name = Column(String(128), nullable=False)
    nurse_id = Column(String(64), nullable=False, index=True)
    nurse_name = Column(String(128), nullable=False)
    doctor_id = Column(String(64), nullable=False)
    doctor_name = Column(String(128), nullable=False)
    appointment_id = Column(String(64), nullable=True)
    assigned_date = Column(String(32), nullable=False)
    care_type = Column(String(64), default="MONITORING")
    priority = Column(String(32), default="NORMAL")
    status = Column(String(32), default="ACTIVE")
    instructions = Column(String(1024), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
