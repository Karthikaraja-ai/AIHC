# AIHC Digital Hospital - Patient Case Taking & Clinical Support System

A production-quality, accessible, bilingual/multilingual digital hospital Patient Case Taking System compliant with the **DPDP Act (2023)** and integrated conceptually with the **ABDM / ABHA ecosystem**.

---

## Target Technology Stack

* **UI**: React 18 + TypeScript
* **Styling**: Tailwind CSS
* **Backend**: FastAPI (Python 3.12)
* **Database**: PostgreSQL (with automatic asynchronous SQLite fallback for seamless local/offline execution)
* **AI/ML & Emergency Detection**: Python (`backend/app/ai/`)
* **OCR Pipeline**: Python (`backend/app/ocr/` with PyPDF & Pillow)
* **AI Report Summarizer**: Python (`backend/app/ai/report_summarizer/`)
* **AI Pre-Consultation**: Python (`backend/app/ai/pre_consultation/`)
* **Authentication**: FastAPI + PostgreSQL / Database (JWT Bearer tokens + PBKDF2-HMAC-SHA256 password hashing)
* **API Communication**: High-performance REST APIs (`http://localhost:8000/api/v1`) with OpenAPI / Swagger UI (`/docs`)

---

## Architecture & Project Structure

```
aihc-patient-casetaking/
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── emergency_detector/   # Python emergency and red-flag symptom detection
│   │   │   ├── pre_consultation/     # Adaptive AI consultation question engine & condition trees
│   │   │   └── report_summarizer/    # Multi-panel lab report summarizer (EN, TA, HI)
│   │   ├── api/
│   │   │   ├── deps.py               # Dependency injection & JWT token verification
│   │   │   └── v1/                   # REST API routers (auth, patients, appointments, doctors, etc.)
│   │   ├── core/
│   │   │   └── security.py           # PBKDF2-HMAC-SHA256 hashing & JWT generation
│   │   ├── database/
│   │   │   ├── base.py               # DeclarativeBase SQLAlchemy
│   │   │   ├── session.py            # PostgreSQL async engine + SQLite transparent fallback
│   │   │   └── seed.py               # Demo accounts & clinical dataset seeder
│   │   ├── models/                   # SQLAlchemy ORM database models
│   │   ├── ocr/
│   │   │   ├── pipeline.py           # PDF/image OCR parameter extraction & keyword validation
│   │   │   └── reference_ranges.py   # Standard biological reference intervals
│   │   ├── schemas/                  # Pydantic data validation schemas
│   │   ├── config.py                 # Pydantic-settings environment configuration
│   │   └── main.py                   # FastAPI application instance, lifespan, CORS, and routing
│   ├── .env                          # Local environment variables
│   ├── .env.example                  # Environment template
│   ├── requirements.txt              # Python dependencies
│   └── run.py                        # Backend runner script (port 8000)
├── frontend/                         # React 18 + TypeScript + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/               # Dashboards, Body Map, Modals, Audio/Voice
│   │   ├── context/                  # AuthContext, LanguageContext, AccessibilityContext
│   │   ├── services/
│   │   │   ├── apiService.ts         # Central REST client targeting FastAPI endpoints
│   │   │   ├── storageService.ts     # Resilient local cache layer
│   │   │   ├── dpdpService.ts        # DPDP immutable audit log
│   │   │   └── aiEngine.ts           # Pre-consultation client engine
│   │   └── types/                    # Core TypeScript interfaces
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── package.json                      # Monorepo root script runner
└── README.md
```

---

## Quick Start Guide

### 1. Start the FastAPI Python Backend

Make sure dependencies are installed:
```bash
pip install -r backend/requirements.txt
```

Run the backend server:
```bash
python backend/run.py
```
* **API Root**: `http://localhost:8000/`
* **Interactive OpenAPI Documentation (Swagger UI)**: `http://localhost:8000/docs`
* **Alternative Documentation (ReDoc)**: `http://localhost:8000/redoc`

> **Note on Database**: By default, the backend connects to PostgreSQL (`DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/aihc_db`). If PostgreSQL is not currently running locally, it gracefully and transparently defaults to local SQLite (`aihc.db`) with zero downtime.

---

### 2. Start the React Frontend

In a separate terminal:
```bash
npm run dev
```
Open your browser at `http://localhost:3000` (or the port displayed in terminal).

### 3. Production Frontend Build
```bash
npm run build
```

---

## Four Strict User Roles & Demo Accounts

All demo accounts share the password: `Demo@123`

| Role | Unique ID | Name | Department / Specialization |
| :--- | :--- | :--- | :--- |
| **PATIENT** | `PAT-0001` | Kavitha Raman | General OPD (Ayurveda preferred) |
| **PATIENT** | `PAT-0002` | Muthukumar S | Cardiology / Hypertension |
| **DOCTOR** | `DOC-0001` | Dr. A. Sundaram (MD) | Senior Physician & Internal Medicine |
| **DOCTOR** | `DOC-0002` | Dr. Priya Natarajan (DM) | Interventional Cardiology |
| **DOCTOR** | `DOC-0003` | Dr. B. Ramanathan (BAMS) | Panchakarma & Ayurvedic Kayachikitsa |
| **NURSE** | `NUR-0001` | Nurse Deepa V | OPD Triage & Emergency Assessment |
| **NURSE** | `NUR-0002` | Nurse Anitha M | AYUSH & Inpatient Ward |
| **LAB TECH** | `LAB-0001` | Suresh K (Lab Tech) | Clinical Biochemistry & Hematology |
| **LAB TECH** | `LAB-0002` | Lakshmi Narayan (Lab Tech) | Pathology & Microbiology |

---

## Core Features & Workflow Guarantees

1. **4 Strict User Roles (Zero Admin)**: Preserves Patient, Doctor, Nurse, and Lab Technician boundaries.
2. **AYUSH & Allopathy Integration**: Support for Ayurveda, Siddha, Unani, Yoga & Naturopathy, and Allopathy.
3. **Adaptive AI Pre-Consultation**: Dynamic condition routing (Back Pain, Headache, Abdominal Pain, Cough, Skin, Joints, Fever).
4. **4-Step Consultation Reset**: Allows resetting consultation flow back to starting step for new consultation cycles.
5. **Interactive Body Map**: Anatomical front/back selection with Wong-Baker visual 1-10 pain faces.
6. **Report Upload & OCR Summarizer**:
   - Duplicate report prevention.
   - Non-medical document keyword rejection.
   - Biological reference interval comparisons (CBC, Diabetic, LFT, RFT, Lipid, Thyroid).
   - Multilingual AI summaries in English, Tamil (தமிழ்), and Hindi (हिन्दी).
7. **Medicine Reminders & Adherence**: Daily schedules with visual tick confirmation upon setting reminders.
8. **Emergency 108 System**: Real-time alerts for critical red-flag cardiac, respiratory, neurological, and hemorrhagic distress.
