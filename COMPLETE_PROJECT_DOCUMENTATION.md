# AI Healthcare Case-Taking & Clinical Decision Support System
## Master Architecture, Feature Reference, and Complete Code Documentation

---

## 1. Executive Summary & Vision

The **AI Healthcare Case-Taking System (AIHC Digital Hospital)** is an accessible, tri-lingual (English, Tamil, Hindi), multi-framework clinical pre-consultation and hospital workflow management system.

The system addresses critical clinical pain points in modern outpatient departments (OPDs):
1. **Clinical Time Deficit**: Doctors spend 50–70% of consultation time recording repetitive demographic, chronological, and symptom history instead of focused clinical examination.
2. **Language & Literacy Barriers**: Rural and multilingual patients often struggle to articulate symptom progression, pain quality, and timelines in English or technical terminology.
3. **Emergency Red-Flag Delays**: Patients with life-threatening presentations (e.g. myocardial infarction, ischemic stroke, acute respiratory distress) wait in standard OPD queues instead of being immediately triaged to emergency rooms.
4. **Integration of AYUSH & Modern Medicine**: Traditional medicine systems (Ayurveda, Siddha, Unani, Yoga & Naturopathy, Homoeopathy) require unique constitutional and diagnostic case-taking frameworks (e.g., *Prakriti/Tridosha*, *Mukkuttram/Envagai Thervu*, *Mizaj*, *Similia* modalities) that standard Western electronic medical record (EMR) systems do not accommodate.
5. **DPDP Act (2023) & ABDM / ABHA Compliance**: The platform is built around patient privacy, immutable audit logging, explicit consent-driven data sharing, and conceptual integration with the Ayushman Bharat Digital Mission (ABDM).

---

## 2. System Architecture & Technology Stack

```
+-------------------------------------------------------------------------------+
|                             CLIENT / PRESENTATION LAYER                       |
|   React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Web Speech API |
|   [English | Tamil | Hindi] | [Voice Typing & Read-Aloud] | [9-Region Body Canvas]|
+---------------------------------------+---------------------------------------+
                                        | REST APIs (JSON / JWT Bearer)
                                        v
+-------------------------------------------------------------------------------+
|                          BACKEND / APPLICATION LAYER (FastAPI)                |
|   Uvicorn ASGI Server | Python 3.12 | Pydantic v2 Schemas | Async SQLAlchemy  |
|                                                                               |
|   +--------------------------+---------------------------+----------------+   |
|   |  AYUSH Adaptive Engine   |  Emergency & Red-Flags   |  OCR Pipeline  |   |
|   |  - 1,875 Clinical Cases  |  - Deterministic Keyword  |  - PyPDF       |   |
|   |  - 4-Step Branching      |  - Zero-Latency Safety    |  - Pillow      |   |
|   |  - 5 Classical Systems   |  - EN / TA / HI Rules     |  - Ref Ranges  |   |
|   +--------------------------+---------------------------+----------------+   |
|                                                                               |
|   +-----------------------------------------------------------------------+   |
|   |  API Routers: Auth | Patients | Doctors | Pre-Consult | Rx | Reports  |   |
|   +-----------------------------------------------------------------------+   |
+---------------------------------------+---------------------------------------+
                                        | Async I/O (asyncpg / aiosqlite)
                                        v
+-------------------------------------------------------------------------------+
|                            PERSISTENCE / DATA LAYER                           |
|   PostgreSQL (Primary) <---> Automatic Transparent SQLite Fallback (aihc.db)  |
|                                                                               |
|   - ayush_preconsultation_dataset (1,875 canonical clinical records)          |
|   - preconsultation_sessions & preconsultation_responses                      |
|   - users, patients, doctors, appointments, medical_records                   |
|   - prescriptions, diagnostic_reports, emergency_alerts, dpdp_audit_logs      |
+-------------------------------------------------------------------------------+
```

### Technology Highlights:
- **Frontend**: React 18 with TypeScript for type safety, Vite for sub-second hot-reloads and fast production bundling, Tailwind CSS for accessible responsive layouts, and Lucide React icons.
- **Speech & Audio**: Browser-native Web Speech API with bidirectional bilingual speech-to-text (`webkitSpeechRecognition`) and text-to-speech (`speechSynthesis`) supporting `en-IN`, `ta-IN`, and `hi-IN`.
- **Backend**: FastAPI (Python 3.12) providing asynchronous REST endpoints, automated OpenAPI documentation (`/docs`), and Pydantic v2 models for data validation.
- **Database Resilience**: Dual-engine database architecture using SQLAlchemy 2.0 async. Automatically attempts connection to PostgreSQL (`postgresql+asyncpg://...`) and seamlessly falls back to SQLite (`sqlite+aiosqlite:///./aihc.db`) with zero manual configuration.
- **Unified Execution**: Single-command startup (`start.bat` / `python start.py`) that checks dependencies, installs missing packages automatically, runs both servers concurrently, and launches the browser.

---

## 3. Directory Structure & File Manifest

```
aihc-patient-casetaking/
├── start.bat                         # 1-Click Windows execution script
├── start.py                          # Unified Python runner: auto-installs deps & starts servers
├── package_project.py                # Fast export script creating clean 0.6 MB zip (omits node_modules)
├── .gitignore                        # Standard git ignores (node_modules, dist, __pycache__, venv)
├── README.md                         # Project overview and quickstart guide
├── SHARE_GUIDE.md                    # Sharing instructions for teammates, clients, and evaluators
├── COMPLETE_PROJECT_DOCUMENTATION.md # Complete architectural and technical reference
├── package.json                      # Root workspace orchestrator ("npm start" -> python start.py)
│
├── backend/                          # FastAPI Python Backend
│   ├── run.py                        # Backend runner script (starts uvicorn on port 8000)
│   ├── requirements.txt              # Python dependencies
│   ├── .env                          # Local environment settings
│   ├── .env.example                  # Environment template
│   ├── aihc.db                       # Auto-created SQLite database (offline fallback)
│   └── app/
│       ├── __init__.py
│       ├── config.py                 # Pydantic-settings configuration (DB url, JWT keys, CORS)
│       ├── main.py                   # FastAPI app instance, lifespan lifecycle, CORS, route mounts
│       ├── ai/
│       │   ├── emergency_detector/
│       │   │   └── detector.py       # Deterministic red-flag keyword rules across EN, TA, HI
│       │   ├── pre_consultation/
│       │   │   └── adaptive_engine.py# Core AYUSH 1,875-dataset adaptive engine & clinical brancher
│       │   └── report_summarizer/
│       │       └── summarizer.py     # Multilingual diagnostic report summarizer (EN, TA, HI)
│       ├── api/
│       │   ├── deps.py               # Dependency injection & JWT token verification
│       │   └── v1/
│       │       ├── router.py         # Root v1 API router
│       │       └── endpoints/
│       │           ├── auth.py       # User login, registration, JWT issuance, profile
│       │           ├── patients.py   # Patient registration, demographics, ABHA linking
│       │           ├── doctors.py    # Doctor directory, departments, OPD scheduling
│       │           ├── appointments.py# Booking, status transitions, pre-consultation linkage
│       │           ├── preconsultation.py # AYUSH adaptive questionnaire, session state, answers
│       │           ├── prescriptions.py # Doctor prescription creation, medicines, signatures
│       │           ├── reports.py    # Medical report upload, OCR extraction, summaries
│       │           └── vitals.py     # Nurse vitals recording & triage updates
│       ├── core/
│       │   └── security.py           # PBKDF2 password hashing & JWT token encode/decode
│       ├── data/
│       │   └── AYUSH_Adaptive_PreConsultation_1875.csv # Authoritative clinical dataset
│       ├── database/
│       │   ├── base.py               # SQLAlchemy DeclarativeBase
│       │   ├── session.py            # PostgreSQL async engine + SQLite fallback logic
│       │   └── seed.py               # Database seeder (demo users, hospitals, 1,875 dataset)
│       ├── models/
│       │   ├── __init__.py           # Model aggregator for SQLAlchemy migrations
│       │   ├── user.py               # User authentication accounts & roles
│       │   ├── patient.py            # Patient demographics, age, sex, ABHA ID
│       │   ├── doctor.py             # Doctor profiles, qualifications, room number, OPD slot
│       │   ├── appointment.py        # Appointments, dates, triage level, status
│       │   ├── ayush_dataset.py      # 1,875 AYUSH canonical dataset records
│       │   ├── ayush_session.py      # Live pre-consultation sessions & responses
│       │   ├── prescription.py       # Prescriptions, dosage, instructions
│       │   ├── report.py             # Diagnostic lab reports, extracted parameters
│       │   └── emergency_alert.py    # Emergency alerts for doctor/nurse dashboards
│       ├── ocr/
│       │   ├── pipeline.py           # Image & PDF OCR parameter extractor
│       │   └── reference_ranges.py   # Biological reference intervals (Hb, Sugar, Creatinine, etc.)
│       └── schemas/
│           ├── auth.py               # Login, Token, User schemas
│           ├── preconsultation.py    # Request/response schemas for adaptive questionnaire
│           ├── prescription.py       # Prescription schemas
│           └── report.py             # Diagnostic report & OCR schemas
│
└── frontend/                         # React 18 + TypeScript + Tailwind CSS Frontend
    ├── index.html                    # Root HTML document
    ├── package.json                  # Frontend packages & scripts (dev, build, preview)
    ├── vite.config.ts                # Vite build and dev server configuration
    ├── tsconfig.json                 # TypeScript compiler options
    ├── tailwind.config.js            # Tailwind typography, colors, animations
    ├── postcss.config.js             # PostCSS Tailwind integration
    └── src/
        ├── main.tsx                  # Application entry point
        ├── App.tsx                   # Top-level application router & view switcher
        ├── index.css                 # Global CSS rules, custom animations
        ├── types/
        │   ├── index.ts              # Core clinical types, roles, MedicineSystem
        │   └── ai.ts                 # Pre-consultation, Body Map, Q&A, and AYUSH types
        ├── i18n/
        │   ├── index.tsx             # Translation provider and hook (useTranslation)
        │   ├── en.ts                 # Comprehensive English translations
        │   ├── ta.ts                 # Comprehensive Tamil (தமிழ்) translations
        │   └── hi.ts                 # Comprehensive Hindi (हिन्दी) translations
        ├── context/
        │   ├── AuthContext.tsx       # User authentication state, login, logout, demo switch
        │   ├── AccessibilityContext.tsx # High contrast, large fonts, auto-voice toggle
        │   └── EmergencyContext.tsx  # Global emergency alert broadcaster
        ├── services/
        │   ├── apiService.ts         # Central HTTP client targeting FastAPI endpoints
        │   ├── aiEngine.ts           # Client-side fallback adaptive engine & context trail
        │   ├── voiceService.ts       # Web Speech API speech-to-text & speech synthesis
        │   ├── storageService.ts     # Resilient local caching & offline storage
        │   ├── multilingualInterpreter.ts # Clinical term normalization across languages
        │   └── dpdpService.ts        # Immutable DPDP consent & access logs
        ├── components/
        │   ├── common/
        │   │   ├── Header.tsx        # Top navigation, role badges, language toggle
        │   │   ├── Footer.tsx        # DPDP compliance notice, hospital helplines
        │   │   └── VoiceButton.tsx   # Universal voice listen / voice speak button
        │   ├── bodyMap/
        │   │   └── BodyMap.tsx       # Interactive anatomical 9-region body canvas
        │   └── modals/
        │       ├── EmergencyModal.tsx # Red-flag emergency notification overlay
        │       └── ConsentModal.tsx  # DPDP statutory consent agreement modal
        └── views/
            ├── auth/
            │   └── LoginScreen.tsx   # Role-based login and 1-click demo switcher
            ├── patient/
            │   ├── PatientDashboard.tsx # Patient main care portal & appointment history
            │   ├── AppointmentBooking.tsx # 4-Step hospital/specialist appointment booking
            │   ├── MedicineSystemSelectScreen.tsx # 5 AYUSH + Allopathy selection screen
            │   ├── AIQuestionScreen.tsx # 4-Step adaptive pre-consultation workflow
            │   └── ReportsView.tsx   # Patient diagnostic report viewer & OCR uploader
            ├── doctor/
            │   └── DoctorDashboard.tsx # Attending physician queue, case-taking review, Rx
            ├── nurse/
            │   └── NurseDashboard.tsx  # Vitals recording, triage queue, report summarizer
            └── admin/
                └── AdminDashboard.tsx  # Hospital directory, doctor rosters, DPDP audit trail
```

---

## 4. Comprehensive Feature Breakdown

### Feature 1: Multi-Role Clinical Workflows & DPDP/ABHA Authentication
- **Roles Supported**:
  - **Patient (`PATIENT`)**: Books appointments, completes adaptive pre-consultation, views signed electronic prescriptions, uploads diagnostic reports, and tracks medicine schedules.
  - **Doctor (`DOCTOR`)**: Consults attending queue, inspects structured AI pre-consultation summaries, compares symptom progression with previous visits, prescribes medications with dosage and frequency, and verifies OCR reports.
  - **Nurse (`NURSE`)**: Records patient vitals (Blood Pressure, Heart Rate, SpO2, Temperature, Respiratory Rate, BMI), reviews all previous patient reports, triggers instant AI summarization, and manages emergency triage.
  - **Administrator (`ADMIN`)**: Audits DPDP consent logs, manages hospital departments, configures doctor rosters, and oversees system performance.
- **DPDP Act (2023) Compliance**: Implements explicit consent notice with purpose limitation, notice of data retention, immutable timestamped audit trails in `dpdp_audit_logs`, and data minimization principles.

---

### Feature 2: Five Classical AYUSH Systems + Modern Medicine Integration
The system provides specialized clinical frameworks for the 5 traditional AYUSH systems alongside Allopathy:
1. **Ayurveda**: Gathers constitutional *Prakriti* indicators (*Vata*, *Pitta*, *Kapha*), digestive fire (*Agni* status: Sama, Vishama, Tikshna, Manda), bowel habits (*Koshta*), and prior Panchakarma therapies.
2. **Siddha**: Investigates *Mukkuttram* (*Vali/Vatham*, *Azhal/Pitham*, *Iyyam/Kabam*), *Envagai Thervu* (eight classical diagnostic assessments: *Naadi*, *Sparsam*, *Naa*, *Niram*, *Mozhi*, *Vizhi*, *Malam*, *Moothiram*), and *Varmam* location points.
3. **Unani**: Assesses temperament (*Mizaj*: Damwi, Balghami, Safrawi, Saudawi), digestion (*Hazm*), and sleep wakefulness cycles (*Naum-o-Yaqzah*).
4. **Yoga & Naturopathy**: Evaluates physical mobility limitations, sitting posture hours, breathing patterns, stress triggers, and daily lifestyle routine (*Dinacharya*).
5. **Homoeopathy**: Captures *Similia Similibus Curentur* case-taking, thermal states (chilly vs. hot patient), modality triggers (aggravation/amelioration by weather, time of day, movement), and constitutional traits.

---

### Feature 3: The 1,875-Record Adaptive Pre-Consultation Dataset
- **File**: `backend/app/data/AYUSH_Adaptive_PreConsultation_1875.csv`
- **Total Records**: Exactly **1,875 records**.
- **Distribution**:
  - **Languages**: 625 English, 625 Tamil, 625 Hindi (balanced 1:1:1).
  - **AYUSH Systems**: 375 records per system (Ayurveda, Siddha, Unani, Yoga & Naturopathy, Homoeopathy).
  - **Language + System Combinations**: Exactly 125 records per language-system pair (e.g. Tamil + Siddha = 125, Hindi + Unani = 125).
- **Core Dataset Schema**:
  - `id`: Unique record identifier (`AYU_EN_001`, `SID_TA_042`, etc.)
  - `language`: `English`, `Tamil`, or `Hindi`
  - `medical_system`: `Ayurveda`, `Siddha`, `Unani`, `Yoga & Naturopathy`, `Homoeopathy`
  - `age`: Integer (1 to 90)
  - `gender`: `Male`, `Female`, `Other`
  - `chief_complaint`: Canonical complaint (Headache, Stomach pain, Skin itching, Cough, Back pain, Fever, Joint pain, Chest pain, etc.)
  - `duration`: Symptom duration (e.g., *2-3 days*, *1 week*, *3 months*)
  - `severity`: `Mild`, `Moderate`, `Severe`
  - `current_question`: Active inquiry presented to the patient
  - `patient_answer`: Representative patient response
  - `answer_category`: Category tag (`duration`, `progression`, `modulating`, `ayush_nuance`)
  - `next_question`: Subsequent branched question
  - `next_question_type`: Type of subsequent question
  - `emergency_flag`: `Yes` or `No`
  - `pre_consultation_summary`: Golden reference clinical summary

---

### Feature 4: 4-Step Patient Pre-Consultation Workflow

#### Step 1: Explain Health Condition (`EXPLAIN_CONDITION`)
- Patient enters their primary health complaint in their own words.
- Dual input modalities:
  - **Typing**: Text area with placeholder guidance.
  - **Voice Speech-to-Text**: Microphone button capturing natural speech in English, Tamil, or Hindi.
- **Quick Condition Chips**: 1-tap shortcuts for common complaints: *Headache / தலைவலி / सिरदर्द*, *Stomach Pain / வயிற்று வலி / पेट दर्द*, *Skin Itching / தோல் அரிப்பு / त्वचा में खुजली*, *Cough / இருமல் / खांसी*, *Back Pain / முதுகு வலி / पीठ दर्द*, *Fever / காய்ச்சல் / बुखार*, *Chest Pain / மார்பு வலி / सीने में दर्द*, or *Other*.
- Immediate background execution of red-flag emergency detection.

#### Step 2: Patient Age Collection (`ASK_AGE`)
- Immediately follows Step 1 to ground the adaptive logic in patient demographics:
- **Large Touch Stepper (+ / −)**: Easily increment or decrement age.
- **Direct Numeric Input**: Keyboard entry with bounds validation (1 to 120 years).
- **Voice Typing / Number Parsing**: Speech-to-text automatically extracts integers from words (e.g., *"thirty five"*, *"முப்பது"*, *"पैंतीस"*, or *"42"*).
- **Quick Age Bracket Chips**:
  - 🧒 **Child (1–12)** / குழந்தை / बच्चा (sets age to 8)
  - 🧑 **Teen (13–19)** / வளரிளம்பருவம் / किशोर (sets age to 16)
  - 👨‍🦰 **Adult (20–39)** / இளம் வயது / वयस्क (sets age to 28)
  - 🧔 **Middle Age (40–59)** / நடுத்தர வயது / मध्यम आयु (sets age to 48)
  - 👴 **Senior Citizen (60+)** / மூத்த குடிமகன் / वरिष्ठ नागरिक (sets age to 68)
- Reads question aloud: *"How old are you? Please tell us your age so your doctor can assess your health accurately"* in the chosen language.

#### Step 3: Interactive Body Map Canvas (`BODY_MAP`)
- Visual anatomical canvas allowing patients to tap affected body areas instead of typing complex medical terms:
- **9 Large Anatomical Regions**: Head (*தலை / सिर*), Neck (*கழுத்து / गर्दन*), Chest (*மார்பு / सीना*), Abdomen (*வயிறு / पेट*), Back (*முதுகு / पीठ*), Arm (*கை புயம் / बांह*), Hand (*கை / हाथ*), Leg (*கால் / टांग*), Foot (*பாதம் / पैर*).
- Displays condition recap pill and patient age badge for visual continuity.
- Omits redundant *"Where is your pain?"* questions in later steps.

#### Step 4+: Adaptive Clinical Questions (`QUESTIONS`)
- 4-step branching progression powered by the 1,875-record dataset:
  - **Question 1 (Duration & Onset)**: Identifies acute vs. chronic onset.
  - **Question 2 (Progression & Trend)**: Distinguishes worsening, steady, or improving courses.
  - **Question 3 (Associated Symptoms & Modulators)**: Aggravating and relieving factors.
  - **Question 4 (AYUSH Nuance / Constitutional Traits)**: Specific system indicators (*Agni*, *Mukkuttram*, *Mizaj*, thermal state).
- **Dynamic In-Session Multi-Language Switching**: Toggling English, தமிழ், or हिन्दी instantly translates the question text, option cards, and audio read-aloud prompt without restarting the session.
- Both typing and voice recognition are available for all answers.

---

### Feature 5: Emergency Detection & Red-Flag Safety Interception
- **Deterministic Zero-Latency Safety Engine**: Does not rely on uncertain generative AI for emergency decisions. Uses strict rule-based pattern matching:
  - **Cardiac Red Flags**: *crushing chest pain, heart attack, chest pressure, நெஞ்சு வலி, மாரடைப்பு, மார்பில் அழுத்தம், सीने में दर्द, दिल का दौरा, छाती में तेज दर्द*
  - **Respiratory Red Flags**: *cannot breathe, choking, shortness of breath, மூச்சுத்திணறல், மூச்சு விட முடியவில்லை, सांस फूलना, दम घुटना*
  - **Neurological / Stroke Red Flags**: *sudden weakness, paralysis, slurred speech, பக்கவாதம், பேச்சு குழறுதல், திடீர் பலவீனம், लकवा, आवाज लड़खड़ाना*
  - **Hemorrhagic Red Flags**: *vomiting blood, heavy bleeding, coughing blood, ரத்த வாந்தி, அதிக ரத்தப்போக்கு, खून की उल्टी*
  - **Syncope / Unconsciousness**: *unconscious, fainted, blackout, மயக்கம், நினைவிழப்பு, बेहोश*
- **Emergency Action Triggered**:
  - Sets session status to `EMERGENCY_STOPPED`.
  - Automatically inserts an active `EmergencyAlert` record.
  - Instantly renders a prominent Red Emergency Alert banner with instructions to call 108 or proceed to the casualty department.
  - Alerts the doctor and nurse dashboards immediately with highest priority triage tag (`EMERGENCY`).

---

### Feature 6: Automated Pre-Consultation Summary Generation
Upon completing Step 4, the backend adaptive engine synthesizes a concise, structured clinical handover summary:
- **Patient Context**: Age, gender, selected medical system, language.
- **Chief Complaint & Duration**: Precise timeline and anatomical location from Body Map.
- **Clinical Progression & Character**: Improving/worsening trajectory and associated symptoms.
- **AYUSH Constitutional Findings**: System-specific clinical observations (*Prakriti*, *Agni*, *Mizaj*, etc.).
- **Triage Assessment**: Emergency status and recommendation for the attending specialist.

---

### Feature 7: Doctor Dashboard & Electronic Prescriptions
- **Queue Overview**: Live list of scheduled patients with appointment times, triage levels (`NORMAL`, `URGENT`, `EMERGENCY`), and pre-consultation status.
- **Case Review**: Attending physician views the pre-consultation summary, patient answers, and historical vitals before calling the patient.
- **Electronic Prescription Writer**:
  - Adds multiple medications with formulation (Tablet, Syrup, Kashayam, Churna, Taila, etc.), dosage, frequency (1-0-1, 1-1-1), duration, and dietary advice.
  - Generates digitally verified, printable prescriptions conforming to clinical guidelines.

---

### Feature 8: Nurse Dashboard & Vitals Recording
- **Vitals Input**: Record Blood Pressure (systolic/diastolic), Pulse Rate, SpO2, Body Temperature, Respiratory Rate, Blood Glucose, and Weight.
- **All Previous Reports Viewer**: Nurse can view all past lab reports and prescription history for any patient.
- **Touch-to-Summarize**: Nurse can click "Summarize Reports" to trigger instant AI synthesis of historical trends, abnormal values, and vital signs.

---

### Feature 9: Diagnostic Lab Reports & AI OCR Pipeline
- **File Ingestion**: Accepts PDF, PNG, JPG medical diagnostic reports.
- **OCR Parameter Extraction**: Analyzes document text to extract clinical parameters (Hemoglobin, Fasting Blood Sugar, HbA1c, Serum Creatinine, Total Cholesterol, Platelet Count, etc.).
- **Biological Reference Interval Comparison**: Evaluates values against standard physiological ranges (`backend/app/ocr/reference_ranges.py`).
- **Abnormal Flagging**: Categorizes parameters as `NORMAL`, `HIGH`, `LOW`, `CRITICAL_HIGH`, or `CRITICAL_LOW`.
- **Multilingual Report Summary**: Automatically translates findings and doctor impressions into English, Tamil, and Hindi.

---

### Feature 10: Unified Single-Command Execution
- `start.bat`: Double-clickable Windows batch script.
- `start.py`: Cross-platform Python runner:
  - Verifies presence of `node_modules`; runs `npm install` automatically if missing.
  - Verifies backend dependencies; runs `pip install -r requirements.txt` if needed.
  - Launches FastAPI backend (`run.py` on port 8000) and React frontend (`npm run dev` on port 5173) concurrently.
  - Streams color-coded logs `[BACKEND]` and `[FRONTEND]` to a single unified console.
  - Automatically launches the user's default browser to `http://localhost:5173`.
  - Handles `Ctrl + C` gracefully to terminate both child processes cleanly.
- `package_project.py`: Generates a clean, 0.60 MB distribution ZIP file ready for sharing via email or cloud storage.

---

## 5. Core Source Code Implementations

### 5.1 Backend Adaptive Engine (`backend/app/ai/pre_consultation/adaptive_engine.py`)
```python
class AYUSHAdaptiveEngine:
    """
    Core AI Pre-Consultation Engine powered by 1,875 canonical clinical records.
    Provides canonical complaint mapping, 4-step adaptive branching,
    deterministic red-flag safety, and multilingual question generation.
    """
    def __init__(self, dataset_path: str = None):
        self.records: List[Dict[str, Any]] = []
        self._load_dataset(dataset_path)

    def detect_emergency(self, answer_text: str, severity: str = "Moderate") -> Tuple[bool, str, str]:
        """Deterministic safety check across English, Tamil, and Hindi."""
        lower = answer_text.lower()
        if severity == "Severe":
            for term in ["chest", "நெஞ்சு", "மார்பு", "सीने", "छाती"]:
                if term in lower:
                    return True, "CRITICAL: Acute Chest Discomfort", "Severe"
        for kw in RED_FLAG_KEYWORDS:
            if kw in lower:
                return True, f"EMERGENCY RED-FLAG: {kw}", "Severe"
        return False, "No", "None"

    def get_first_question(self, language: str, medical_system: str, chief_complaint: str, age: int, gender: str) -> Dict[str, Any]:
        """Step 1: Duration & Onset with multi-language texts & localized options."""
        # Queries dataset and returns:
        # { "id": "...", "text": "...", "englishText": "...", "tamilText": "...", "hindiText": "...", "options": [...] }
```

### 5.2 Pre-Consultation REST Endpoint (`backend/app/api/v1/endpoints/preconsultation.py`)
```python
@router.post("/start", response_model=PreConsultationSessionResponse)
async def start_pre_consultation(req: PreConsultationStartRequest, db: AsyncSession = Depends(get_db)):
    """Initializes session, executes safety checks, and returns Step 1 question."""
    is_emergency, emergency_flag, emergency_reason = ayush_adaptive_engine.detect_emergency(req.chiefComplaint, req.severity)
    session = PreConsultationSession(...)
    db.add(session)
    await db.commit()
    return PreConsultationSessionResponse(
        sessionId=session.id,
        currentStep=1,
        nextQuestion=PreConsultationQuestionResponse(...)
    )

@router.post("/answer", response_model=PreConsultationSessionResponse)
async def submit_pre_consultation_answer(req: PreConsultationAnswerRequest, db: AsyncSession = Depends(get_db)):
    """Receives patient response, updates clinical trail, returns next branched question or summary."""
    # Records response in preconsultation_responses
    # Returns next branched question (with englishText, tamilText, hindiText) or final summary
```

### 5.3 Frontend Patient AI Question Screen (`frontend/src/views/patient/AIQuestionScreen.tsx`)
```typescript
// 4-Step Pre-Consultation State Management:
type PreConsultFlowStep = 'EXPLAIN_CONDITION' | 'ASK_AGE' | 'BODY_MAP' | 'QUESTIONS';

// Real-time multilingual question getter:
const getActiveQuestionText = () => {
  if (adaptiveQuestion) {
    if (language === 'ta' && adaptiveQuestion.tamilText) return adaptiveQuestion.tamilText;
    if (language === 'hi' && adaptiveQuestion.hindiText) return adaptiveQuestion.hindiText;
    if (language === 'en' && adaptiveQuestion.englishText) return adaptiveQuestion.englishText;
    return adaptiveQuestion.text;
  }
  return currentQuestion?.text[language] || currentQuestion?.text.en || '';
};

// Automatic localized option chip translation:
const optLabel = optLocalized
  ? (optLocalized[language] || optLocalized.en || optLocalized.ta || optLocalized.hi)
  : (opt.label || opt.id);
```

---

## 6. Database Schema Specifications

### `ayush_preconsultation_dataset`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) | PRIMARY KEY | Unique record ID (e.g. `AYU_EN_001`) |
| `language` | VARCHAR(20) | NOT NULL, INDEX | `English`, `Tamil`, or `Hindi` |
| `medical_system` | VARCHAR(50) | NOT NULL, INDEX | Ayurveda, Siddha, Unani, Yoga & Naturopathy, Homoeopathy |
| `age` | INTEGER | NOT NULL | Patient reference age |
| `gender` | VARCHAR(20) | NOT NULL | `Male`, `Female`, `Other` |
| `chief_complaint` | VARCHAR(255) | NOT NULL, INDEX | Primary symptom complaint |
| `duration` | VARCHAR(100) | NOT NULL | Symptom duration |
| `severity` | VARCHAR(50) | NOT NULL | `Mild`, `Moderate`, `Severe` |
| `current_question` | TEXT | NOT NULL | Inquired question text |
| `patient_answer` | TEXT | NOT NULL | Representative response |
| `answer_category` | VARCHAR(100) | NOT NULL | Category tag |
| `next_question` | TEXT | NULLABLE | Next branched inquiry |
| `next_question_type`| VARCHAR(100) | NULLABLE | Branching category |
| `emergency_flag` | VARCHAR(10) | NOT NULL | `Yes` or `No` |
| `pre_consultation_summary` | TEXT | NOT NULL | Benchmark clinical handover summary |

### `preconsultation_sessions`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) | PRIMARY KEY | Session ID (e.g. `SES-178869...`) |
| `patient_id` | VARCHAR(50) | NOT NULL, INDEX | Foreign key to `patients.id` |
| `appointment_id`| VARCHAR(50) | NULLABLE | Associated appointment ID |
| `language` | VARCHAR(20) | NOT NULL | Active session language |
| `medical_system`| VARCHAR(50) | NOT NULL | Selected clinical discipline |
| `chief_complaint`| TEXT | NOT NULL | Patient reported condition |
| `current_step` | INTEGER | DEFAULT 1 | Active step number (1 to 4) |
| `status` | VARCHAR(50) | DEFAULT 'IN_PROGRESS'| `IN_PROGRESS`, `COMPLETED`, `EMERGENCY_STOPPED` |
| `emergency_flag`| BOOLEAN | DEFAULT FALSE | True if emergency detected |
| `emergency_reason`| TEXT | NULLABLE | Medical reason for emergency halt |
| `summary` | TEXT | NULLABLE | Generated handover summary |
| `context_data` | JSON | NULLABLE | Serialized answers history & body selections |

---

## 7. Verification, Validation & Build Results

1. **Frontend Production Build**:
   - Command: `npm.cmd run build` inside `frontend/`
   - Output: `tsc && vite build` transformed 1,643 modules in **9.01s** with **0 errors**.
2. **Backend Adaptive Engine Tests**:
   - Command: `python test_multilingual_age.py`
   - Validated: 1,875 records indexed, emergency rules passed, multi-language texts present in all steps, localized option labels present in all steps.
3. **REST API Endpoints Integration Test**:
   - Command: `python test_api_endpoints.py`
   - Validated: `/dataset/stats` returns 1,875 valid records; `/start` initializes session with multi-language fields; `/answer` steps 1–4 advance correctly to completion and generate summary.

---

## 8. Summary of How to Run the Project

```bash
# Step 1: Open project directory
cd C:\Users\Karthika\.gemini\antigravity\scratch\aihc-patient-casetaking

# Step 2: Run unified startup (Windows)
start.bat

# Or run with Python on any OS:
python start.py
```

Both servers will start up concurrently and your browser will open to `http://localhost:5173`.
All features are completely self-contained with zero external API dependencies.
