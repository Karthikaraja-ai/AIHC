import os
import csv
import logging
import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.user import User
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.clinical import PatientVitals, LabSample, NurseAssignment
from app.models.prescription import Prescription
from app.models.reminder import MedicineReminder
from app.models.ayush_dataset import AYUSHPreConsultationDataset
from app.core.security import get_password_hash

logger = logging.getLogger("aihc.database")
DEFAULT_DEMO_PASSWORD = "Demo@123"

async def seed_ayush_dataset(session: AsyncSession):
    try:
        res = await session.execute(select(func.count(AYUSHPreConsultationDataset.id)))
        current_count = res.scalar() or 0
        if current_count >= 1875:
            logger.info(f"AYUSH dataset already seeded ({current_count} records).")
            return

        csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "AYUSH_Adaptive_PreConsultation_1875.csv")
        if not os.path.exists(csv_path):
            logger.warning(f"AYUSH dataset CSV file not found at: {csv_path}")
            return

        records = []
        with open(csv_path, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                records.append(
                    AYUSHPreConsultationDataset(
                        id=row["id"].strip(),
                        language=row["language"].strip(),
                        medical_system=row["medical_system"].strip(),
                        age=int(row["age"]) if row.get("age") and row["age"].strip().isdigit() else None,
                        gender=row.get("gender", "").strip(),
                        chief_complaint=row.get("chief_complaint", "").strip(),
                        duration=row.get("duration", "").strip(),
                        severity=row.get("severity", "").strip(),
                        current_question=row.get("current_question", "").strip(),
                        patient_answer=row.get("patient_answer", "").strip(),
                        answer_category=row.get("answer_category", "initial").strip(),
                        next_question=row.get("next_question", "").strip(),
                        next_question_type=row.get("next_question_type", "duration").strip(),
                        emergency_flag=row.get("emergency_flag", "No").strip(),
                        pre_consultation_summary=row.get("pre_consultation_summary", "").strip()
                    )
                )

        if records:
            session.add_all(records)
            await session.commit()
            logger.info(f"Successfully seeded {len(records)} AYUSH adaptive pre-consultation dataset records.")
    except Exception as e:
        logger.error(f"Error seeding AYUSH dataset: {e}")
        await session.rollback()

async def seed_database(session: AsyncSession):
    # Always ensure AYUSH dataset is seeded
    await seed_ayush_dataset(session)

    # Check if demo users already exist
    res = await session.execute(select(User).where(User.id == "USR-DOC-0001"))
    if res.scalars().first():
        return

    pwd_hash = get_password_hash(DEFAULT_DEMO_PASSWORD)

    # 1. Doctors
    doctors = [
        User(
            id="USR-DOC-0001",
            staff_id="DOC-0001",
            role="DOCTOR",
            name="Dr. A. Sundaram (MD)",
            phone="9840112233",
            email="dr.sundaram@aihc.hospital",
            password_hash=pwd_hash,
            is_demo_account=True,
            account_status="ACTIVE",
            doctor_details={
                "specialization": "Senior Physician & Internal Medicine",
                "department": "General Medicine & OPD",
                "hospital": "AIHC Multi-Speciality Hospital",
                "councilRegNo": "MCI-TN-48291",
                "medicineSystem": "ALLOPATHY_HOMEOPATHY",
                "isOnline": True,
            }
        ),
        User(
            id="USR-DOC-0002",
            staff_id="DOC-0002",
            role="DOCTOR",
            name="Dr. Priya Natarajan (DM)",
            phone="9840223344",
            email="dr.priya@aihc.hospital",
            password_hash=pwd_hash,
            is_demo_account=True,
            account_status="ACTIVE",
            doctor_details={
                "specialization": "Interventional Cardiology",
                "department": "Cardiology",
                "hospital": "AIHC Multi-Speciality Hospital",
                "councilRegNo": "MCI-TN-59102",
                "medicineSystem": "ALLOPATHY_HOMEOPATHY",
                "isOnline": True,
            }
        ),
        User(
            id="USR-DOC-0003",
            staff_id="DOC-0003",
            role="DOCTOR",
            name="Dr. B. Ramanathan (BAMS)",
            phone="9840334455",
            email="dr.ramanathan@aihc.hospital",
            password_hash=pwd_hash,
            is_demo_account=True,
            account_status="ACTIVE",
            doctor_details={
                "specialization": "Panchakarma & Ayurvedic Kayachikitsa",
                "department": "AYUSH / Ayurvedic Care Wing",
                "hospital": "AIHC Community Health & AYUSH Center",
                "councilRegNo": "AYU-TN-11209",
                "medicineSystem": "AYURVEDA",
                "isOnline": True,
            }
        )
    ]
    session.add_all(doctors)

    # 2. Nurses
    nurses = [
        User(
            id="USR-NUR-0001",
            staff_id="NUR-0001",
            role="NURSE",
            name="Nurse Deepa V",
            phone="9840445566",
            email="deepa.v@aihc.hospital",
            password_hash=pwd_hash,
            is_demo_account=True,
            account_status="ACTIVE",
            nurse_details={
                "department": "OPD Triage & Emergency Assessment",
                "hospital": "AIHC Multi-Speciality Hospital",
                "nursingRegNo": "TNC-NUR-99120",
                "shift": "Morning (08:00 - 16:00)",
            }
        ),
        User(
            id="USR-NUR-0002",
            staff_id="NUR-0002",
            role="NURSE",
            name="Nurse Anitha M",
            phone="9840556677",
            email="anitha.m@aihc.hospital",
            password_hash=pwd_hash,
            is_demo_account=True,
            account_status="ACTIVE",
            nurse_details={
                "department": "AYUSH & Inpatient Ward",
                "hospital": "AIHC Community Health & AYUSH Center",
                "nursingRegNo": "TNC-NUR-88432",
                "shift": "Evening (14:00 - 22:00)",
            }
        )
    ]
    session.add_all(nurses)

    # 3. Lab Technicians
    techs = [
        User(
            id="USR-LAB-0001",
            staff_id="LAB-0001",
            role="LAB_TECHNICIAN",
            name="Suresh K (Lab Tech)",
            phone="9840778899",
            email="suresh.k@aihc.hospital",
            password_hash=pwd_hash,
            is_demo_account=True,
            account_status="ACTIVE",
            lab_tech_details={
                "labSection": "Clinical Biochemistry & Hematology Diagnostic Center",
                "hospital": "AIHC Multi-Speciality Hospital",
                "certificationNo": "NABL-LT-8812",
            }
        ),
        User(
            id="USR-LAB-0002",
            staff_id="LAB-0002",
            role="LAB_TECHNICIAN",
            name="Lakshmi Narayan (Lab Tech)",
            phone="9840889900",
            email="lakshmi.n@aihc.hospital",
            password_hash=pwd_hash,
            is_demo_account=True,
            account_status="ACTIVE",
            lab_tech_details={
                "labSection": "Pathology & Microbiology Diagnostic Lab",
                "hospital": "AIHC Multi-Speciality Hospital",
                "certificationNo": "NABL-LT-9023",
            }
        )
    ]
    session.add_all(techs)

    # 4. Patients
    patient_users = [
        User(
            id="USR-PAT-0001",
            patient_id="PAT-0001",
            role="PATIENT",
            name="Kavitha Raman",
            phone="9840123456",
            email="kavitha.raman@sample.in",
            password_hash=pwd_hash,
            is_demo_account=True,
            account_status="ACTIVE",
            patient_details={"age": 44, "sex": "FEMALE", "gender": "FEMALE", "ageGroup": "ADULT"}
        ),
        User(
            id="USR-PAT-0002",
            patient_id="PAT-0002",
            role="PATIENT",
            name="Muthukumar S",
            phone="9840234567",
            email="muthu.s@sample.in",
            password_hash=pwd_hash,
            is_demo_account=True,
            account_status="ACTIVE",
            patient_details={"age": 52, "sex": "MALE", "gender": "MALE", "ageGroup": "ADULT"}
        )
    ]
    session.add_all(patient_users)

    patients = [
        Patient(
            id="PAT-0001",
            full_name="Kavitha Raman",
            phone="9840123456",
            email="kavitha.raman@sample.in",
            age=44,
            sex="FEMALE",
            gender="FEMALE",
            age_group="ADULT",
            preferred_medicine_system="AYURVEDA",
            preferred_language="en",
            blood_group="B+",
            allergies={"drugs": ["Sulfa Drugs"], "food": ["Peanuts"], "others": []},
            chronic_diseases=["No known chronic disease"],
            abha_address="kavitha.raman@abdm",
            abha_id="91-8834-2910-4491",
            is_demo_account=True,
            account_status="ACTIVE",
            consent={
                "status": "GRANTED",
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "purpose": "Care Continuity",
                "version": "v2.1-DPDP-2023",
                "scope": ["HEALTH_RECORDS", "CONSULTATION_SUMMARY", "DIAGNOSTICS"]
            }
        ),
        Patient(
            id="PAT-0002",
            full_name="Muthukumar S",
            phone="9840234567",
            email="muthu.s@sample.in",
            age=58,
            sex="MALE",
            gender="MALE",
            age_group="SENIOR",
            preferred_medicine_system="ALLOPATHY_HOMEOPATHY",
            preferred_language="en",
            blood_group="O+",
            allergies={"drugs": ["Penicillin"], "food": [], "others": []},
            chronic_diseases=["Hypertension", "Type 2 Diabetes"],
            abha_address="muthukumar.s@abdm",
            abha_id="91-4412-8873-1029",
            is_demo_account=True,
            account_status="ACTIVE",
            consent={
                "status": "GRANTED",
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "purpose": "Care Continuity",
                "version": "v2.1-DPDP-2023",
                "scope": ["HEALTH_RECORDS"]
            }
        )
    ]
    session.add_all(patients)

    # 5. Appointments
    today_str = datetime.date.today().isoformat()
    appointments = [
        Appointment(
            id="APT-0001",
            patient_id="PAT-0001",
            patient_name="Kavitha Raman",
            hospital="AIHC Multi-Speciality Hospital",
            department="General Medicine & OPD",
            doctor_id="DOC-0001",
            doctor_name="Dr. A. Sundaram (MD)",
            medicine_system="ALLOPATHY_HOMEOPATHY",
            date=today_str,
            time_slot="09:30 AM",
            status="SCHEDULED",
            pre_consultation_status="NOT_STARTED",
            triage_priority="NORMAL",
            token_number="TK-01",
            is_archived=False
        ),
        Appointment(
            id="APT-0002",
            patient_id="PAT-0002",
            patient_name="Muthukumar S",
            hospital="AIHC Multi-Speciality Hospital",
            department="Cardiology",
            doctor_id="DOC-0002",
            doctor_name="Dr. Priya Natarajan (DM)",
            medicine_system="ALLOPATHY_HOMEOPATHY",
            date=today_str,
            time_slot="10:15 AM",
            status="WAITING",
            pre_consultation_status="COMPLETED",
            triage_priority="URGENT",
            token_number="TK-02",
            is_archived=False
        )
    ]
    session.add_all(appointments)

    # 6. Patient Vitals
    vitals = [
        PatientVitals(
            id="VIT-0001",
            patient_id="PAT-0001",
            recorded_by="Nurse Deepa V",
            bp_systolic=120,
            bp_diastolic=80,
            pulse=72,
            spo2=99,
            temperature=98.4,
            respiratory_rate=16,
            blood_sugar=95.0,
            notes="Vitals within standard baseline limits."
        )
    ]
    session.add_all(vitals)

    # 7. Lab Samples
    samples = [
        LabSample(
            sample_id="SMP-88321",
            patient_id="PAT-0001",
            patient_name="Kavitha Raman",
            test_name="Complete Blood Count (CBC)",
            sample_type="Blood",
            department="Hematology",
            status="COLLECTED",
            technician_name="Suresh K (Lab Tech)"
        ),
        LabSample(
            sample_id="SMP-88322",
            patient_id="PAT-0002",
            patient_name="Muthukumar S",
            test_name="Lipid Profile & Serum Creatinine",
            sample_type="Blood",
            department="Biochemistry",
            status="IN_PROGRESS",
            technician_name="Suresh K (Lab Tech)"
        )
    ]
    session.add_all(samples)

    # 8. Medicine Reminders
    reminders = [
        MedicineReminder(
            id="REM-0001",
            patient_id="PAT-0001",
            medicine_name="Amoxicillin 500mg",
            dosage="1 Capsule",
            frequency="Twice Daily",
            duration="5 days",
            start_date=today_str,
            reminder_times=["08:00 AM", "08:00 PM"],
            instructions="After food",
            status="ACTIVE",
            adherence_logs=[]
        )
    ]
    session.add_all(reminders)

    await session.commit()
