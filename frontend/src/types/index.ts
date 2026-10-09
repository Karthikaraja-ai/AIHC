// Core System Types for AIHC Digital Hospital Patient Case Taking System
// Strictly 4 roles: Patient, Doctor, Nurse, Lab Technician (NO ADMIN)

export type UserRole = 'PATIENT' | 'DOCTOR' | 'NURSE' | 'LAB_TECHNICIAN';

export type LanguageCode = 'en' | 'ta' | 'hi';

export type TriageLevel = 'EMERGENCY' | 'URGENT' | 'PRIORITY' | 'NORMAL';

export type MedicineSystem = 
  | 'AYURVEDA'
  | 'SIDDHA'
  | 'UNANI'
  | 'YOGA_NATUROPATHY'
  | 'HOMOEOPATHY'
  | 'ALLOPATHY_HOMEOPATHY';

export interface UploadedDocument {
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
  uploadedAt?: string;
}

export interface ClinicDetails {
  clinicName: string;
  address?: string;
  phone?: string;
  licenseDoc?: UploadedDocument;
}

export interface User {
  id: string;
  role: UserRole;
  name: string;
  phone?: string;
  email?: string;
  patientId?: string; // e.g. PAT-0001 or AIHC-7X9P26
  staffId?: string;   // e.g. DOC-0001, NUR-0001, LAB-0001
  passwordHash?: string;
  salt?: string;
  isDemoAccount?: boolean;
  accountStatus?: 'ACTIVE' | 'SUSPENDED';
  createdAt?: string;
  doctorDetails?: {
    specialization: string;
    department: string;
    hospital: string;
    councilRegNo?: string;
    medicineSystem?: MedicineSystem;
    isOnline: boolean;
    registrationDoc?: UploadedDocument;
    hasOwnClinic?: boolean;
    clinicDetails?: ClinicDetails;
  };
  nurseDetails?: {
    department: string;
    hospital: string;
    nursingRegNo?: string;
    shift: string;
    registrationDoc?: UploadedDocument;
    hasOwnClinic?: boolean;
    clinicDetails?: ClinicDetails;
  };
  labTechDetails?: {
    labSection: string;
    hospital: string;
    certificationNo?: string;
    registrationDoc?: UploadedDocument;
    hasOwnEstablishment?: boolean;
    establishmentDetails?: {
      establishmentName: string;
      address?: string;
      licenseDoc?: UploadedDocument;
    };
  };
  age?: number;
  sex?: 'MALE' | 'FEMALE' | 'OTHER';
  gender?: string;
  ageGroup?: 'ADULT' | 'CHILD' | 'SENIOR';
  patientDetails?: {
    age?: number;
    sex?: string;
    gender?: string;
    ageGroup?: string;
  };
}

export interface LoginCredentials {
  uniqueId: string;
  password: string;
}

export interface ABDMConsent {
  status: 'GRANTED' | 'DENIED' | 'SKIPPED' | 'WITHDRAWN';
  timestamp: string;
  purpose: string;
  version: string;
  withdrawalDate?: string;
  scope: string[];
}

export interface PatientProfile {
  patientId: string;
  fullName: string;
  phone: string;
  email?: string; // Optional for rural/elderly
  age?: number;
  sex?: 'MALE' | 'FEMALE' | 'OTHER';
  gender?: string;
  ageGroup?: 'ADULT' | 'CHILD' | 'SENIOR';
  preferredMedicineSystem?: MedicineSystem;
  preferredLanguage?: LanguageCode;
  abhaAddress?: string;
  abhaId?: string;
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
  allergies?: {
    drugs?: string[];
    food?: string[];
    others?: string[];
  };
  chronicDiseases?: string[];
  diseases?: string[];
  chronicSynchronousDiseases?: string[];
  relativeNumber?: string;
  medicalUpdatesHistory?: Array<{
    field: string;
    previousValue: any;
    newValue: any;
    updatedAt: string;
    updatedBy: string;
  }>;
  passwordHash?: string;
  salt?: string;
  isDemoAccount?: boolean;
  accountStatus?: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  consent: ABDMConsent;
}

export interface NurseAssignment {
  id?: string;
  assignmentId: string;
  patientId: string;
  patientName: string;
  nurseId: string;
  nurseName: string;
  doctorId: string;
  doctorName: string;
  appointmentId?: string;
  assignedDate: string;
  careType?: 'MONITORING' | 'VITALS_CHECK' | 'MEDICATION_ADMIN' | 'WOUND_CARE' | 'POST_OP' | string;
  priority?: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  status: 'ACTIVE' | 'COMPLETED';
  instructions?: string;
  createdAt: string;
}

export interface PrescriptionItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface ConsultationSession {
  sessionId: string;
  consultationId: string;
  appointmentId?: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  startedAt: string;
  completedAt?: string;
  notes?: string;
}

export interface AdherenceLog {
  logId: string;
  date: string;
  time: string;
  status: 'TAKEN' | 'SKIPPED' | 'SNOOZED';
  loggedAt: string;
  notes?: string;
}

export interface MedicineReminder {
  reminderId: string;
  patientId: string;
  prescriptionId?: string;
  medicineName: string;
  dosage: string;
  frequency: string; // e.g. 'Daily', 'Twice Daily', 'Thrice Daily', 'As Needed'
  duration: string;  // e.g. '5 days', '14 days'
  startDate: string;
  endDate?: string;
  reminderTimes: string[]; // e.g. ['08:00 AM', '08:00 PM']
  instructions?: string;   // e.g. 'After food'
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  createdAt: string;
  adherenceLogs: AdherenceLog[];
}

export interface Prescription {
  id?: string;
  prescriptionId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorRegNo?: string;
  doctorSpecialization?: string;
  department?: string;
  hospitalName: string;
  appointmentId?: string;
  consultationId?: string;
  date: string;
  prescribedAt?: string;
  diagnosis?: string;
  items: PrescriptionItem[];
  medications?: PrescriptionItem[];
  doctorNotes?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  hospital: string;
  department: string;
  doctorId: string;
  doctorName: string;
  medicineSystem?: MedicineSystem;
  date: string;
  timeSlot: string;
  status: 'SCHEDULED' | 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';
  preConsultationStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  triagePriority: TriageLevel;
  bookedAt: string;
  tokenNumber?: string;
  isArchived?: boolean;
  revokeCancelled?: boolean;
  revokeCancelledAt?: string;
}

export interface PatientVitals {
  id: string;
  patientId: string;
  recordedAt: string;
  recordedBy: string; // Nurse name
  bpSystolic: number; // mmHg
  bpDiastolic: number; // mmHg
  pulse: number; // bpm
  spo2: number; // %
  temperature: number; // °F
  respiratoryRate: number; // breaths/min
  bloodSugar?: number; // mg/dL
  notes?: string;
}

export interface LabSample {
  sampleId: string; // Barcode ID e.g. SMP-88321
  patientId: string;
  patientName: string;
  testName: string;
  sampleType: 'Blood' | 'Urine' | 'Sputum' | 'Swab' | 'Biopsy';
  department: 'Biochemistry' | 'Hematology' | 'Microbiology' | 'Pathology';
  status: 'COLLECTED' | 'IN_PROGRESS' | 'COMPLETED';
  receivedAt: string;
  completedAt?: string;
  technicianName?: string;
  reportUrl?: string;
  summaryFindings?: string;
}

export interface EmergencyAlert {
  id: string;
  patientId: string;
  patientName: string;
  symptomSummary: string;
  detectedAt: string;
  triageLevel: 'EMERGENCY' | 'URGENT';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  acknowledgedBy?: string;
  vitalsAlert?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorRole: UserRole;
  action: 'LOGIN' | 'LOGOUT' | 'REGISTER' | 'CONSENT_GRANTED' | 'CONSENT_WITHDRAWN' | 'RECORD_VIEWED' | 'REPORT_UPLOADED' | 'REPORT_SAVED' | 'REPORT_DELETED' | 'AI_CONSULTATION_COMPLETED' | 'EMERGENCY_TRIGGERED' | 'TRIAGE_UPDATED' | 'VITALS_RECORDED' | 'PRESCRIPTION_ADDED' | 'PRESCRIPTION_VIEWED' | 'PATIENT_ASSIGNED' | 'PROFILE_UPDATED' | 'SESSION_STARTED' | 'SESSION_TERMINATED' | 'ACCESS_TERMINATED_BLOCKED' | 'ACCESS_RESTORED_NORMAL_HEALTH' | 'MEDICINE_REMINDER_CREATED' | 'MEDICINE_ADHERENCE_LOGGED' | 'UNAUTHORIZED_ACCESS_BLOCKED';
  resourceId: string;
  details: string;
  ipAddress?: string;
}

export interface Hospital {
  id: string;
  name: { en: string; ta: string; hi: string };
  category: MedicineSystem;
  location: { en: string; ta: string; hi: string };
  distanceKm: string;
  opdWing: { en: string; ta: string; hi: string };
  facilities: { en: string[]; ta: string[]; hi: string[] };
  rating: number;
}

export interface DoctorDirectoryEntry {
  id: string;
  name: { en: string; ta: string; hi: string };
  qualification: string;
  medicineSystem: MedicineSystem;
  department: { en: string; ta: string; hi: string };
  hospitalId: string;
  roomNumber: string;
  experience: { en: string; ta: string; hi: string };
  timings: string;
  status: 'AVAILABLE' | 'IN_CONSULTATION' | 'NEXT_TOKEN';
  currentToken?: number;
  estimatedWaitMins?: number;
  languages: string[];
}

