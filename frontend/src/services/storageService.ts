// Storage Service: Central Data Store & Entity Management
// Universal Registration for All 4 Roles: Patient, Doctor, Nurse, Lab Tech (NO ADMIN)
// Enforces cryptographic password hashing and role-based access control.

import {
  User,
  PatientProfile,
  Appointment,
  PatientVitals,
  LabSample,
  TriageLevel,
  MedicineSystem,
  UserRole,
  NurseAssignment,
  Prescription,
  PrescriptionItem,
  EmergencyAlert,
  ConsultationSession,
  MedicineReminder,
  AdherenceLog,
  LanguageCode,
  UploadedDocument,
  ClinicDetails,
} from '../types/index';
import { AIConsultationSummary, MultilingualQAPairRecord } from '../types/ai';
import { MedicalReport } from '../types/ocr';
import { dpdpService } from './dpdpService';
import { authSecurity, DEFAULT_DEMO_PASSWORD, STATIC_SALT } from './authSecurity';

const PATIENTS_KEY = 'aihc_patients_db';
const DOCTORS_KEY = 'aihc_doctors_db';
const NURSES_KEY = 'aihc_nurses_db';
const LAB_TECHS_KEY = 'aihc_lab_techs_db';
const APPOINTMENTS_KEY = 'aihc_appointments_db';
const VITALS_KEY = 'aihc_vitals_db';
const LAB_SAMPLES_KEY = 'aihc_lab_samples_db';
const AI_SUMMARIES_KEY = 'aihc_ai_summaries_db';
const QA_PAIRS_KEY = 'aihc_qa_pairs_db';
const PRESCRIPTIONS_KEY = 'aihc_prescriptions_db';
const NURSE_ASSIGNMENTS_KEY = 'aihc_nurse_assignments_db';
const CONSULTATION_SESSIONS_KEY = 'aihc_consultation_sessions_db';
const MEDICINE_REMINDERS_KEY = 'aihc_medicine_reminders_db';
const SEED_VERSION_KEY = 'aihc_seed_v8_serious_conditions';

export const normalizeDocId = (id?: string): string =>
  (id || '').trim().toUpperCase().replace(/^USR-/, '').replace(/^(DOC|NUR|LAB)-0+/, '$1-');

class StorageService {
  constructor() {
    this.initSeedData();
  }

  // Generate unique permanent ID with prefix
  public generateUniqueId(prefix: 'PAT' | 'DOC' | 'NUR' | 'LAB' | 'AIHC' = 'PAT'): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${code}`;
  }

  // 1. PATIENT REGISTRATION (Email is optional)
  public registerPatient(params: {
    fullName: string;
    phone: string;
    email?: string;
    age?: number;
    sex?: 'MALE' | 'FEMALE' | 'OTHER';
    ageGroup?: 'ADULT' | 'CHILD';
    preferredMedicineSystem?: MedicineSystem;
    preferredLanguage?: LanguageCode;
    bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
    password?: string;
  }): PatientProfile {
    const patientId = this.generateUniqueId('PAT');
    const salt = authSecurity.generateSalt();
    const passwordHash = authSecurity.hashPasswordSync(params.password || DEFAULT_DEMO_PASSWORD, salt);

    const newProfile: PatientProfile = {
      patientId,
      fullName: params.fullName,
      phone: params.phone,
      email: params.email || undefined,
      age: params.age !== undefined ? params.age : 42,
      sex: params.sex || 'FEMALE',
      gender: params.sex || 'FEMALE',
      ageGroup: params.ageGroup || (params.age && params.age < 18 ? 'CHILD' : 'ADULT'),
      preferredMedicineSystem: params.preferredMedicineSystem || 'ALLOPATHY_HOMEOPATHY',
      preferredLanguage: params.preferredLanguage || (localStorage.getItem('aihc_patient_lang') as LanguageCode) || 'en',
      bloodGroup: params.bloodGroup || 'Unknown',
      passwordHash,
      salt,
      isDemoAccount: false,
      accountStatus: 'ACTIVE',
      createdAt: new Date().toISOString(),
      consent: {
        status: 'SKIPPED',
        timestamp: new Date().toISOString(),
        purpose: 'Care Continuity',
        version: 'v2.1-DPDP-2023',
        scope: [],
      },
    };

    const patients = this.getAllPatients();
    patients.unshift(newProfile);
    localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));

    dpdpService.logAudit({
      actorId: patientId,
      actorRole: 'PATIENT',
      action: 'REGISTER',
      resourceId: patientId,
      details: `Registered new patient profile (${patientId}) with hashed credentials under DPDP Act.`,
    });

    return newProfile;
  }

  // 2. DOCTOR REGISTRATION
  public registerDoctor(params: {
    fullName: string;
    phone: string;
    email: string;
    specialization: string;
    department: string;
    hospital: string;
    councilRegNo: string;
    medicineSystem?: MedicineSystem;
    password?: string;
    registrationDoc?: UploadedDocument;
    hasOwnClinic?: boolean;
    clinicDetails?: ClinicDetails;
  }): User {
    const staffId = this.generateUniqueId('DOC');
    const salt = authSecurity.generateSalt();
    const passwordHash = authSecurity.hashPasswordSync(params.password || DEFAULT_DEMO_PASSWORD, salt);

    const newDoctor: User = {
      id: `USR-${staffId}`,
      staffId,
      role: 'DOCTOR',
      name: params.fullName.startsWith('Dr.') ? params.fullName : `Dr. ${params.fullName}`,
      phone: params.phone,
      email: params.email,
      passwordHash,
      salt,
      isDemoAccount: false,
      accountStatus: 'ACTIVE',
      createdAt: new Date().toISOString(),
      doctorDetails: {
        specialization: params.specialization,
        department: params.department,
        hospital: params.hospital,
        councilRegNo: params.councilRegNo,
        medicineSystem: params.medicineSystem || 'ALLOPATHY_HOMEOPATHY',
        isOnline: true,
        registrationDoc: params.registrationDoc,
        hasOwnClinic: params.hasOwnClinic,
        clinicDetails: params.clinicDetails,
      },
    };

    const doctors = this.getAllDoctors();
    doctors.unshift(newDoctor);
    localStorage.setItem(DOCTORS_KEY, JSON.stringify(doctors));

    dpdpService.logAudit({
      actorId: staffId,
      actorRole: 'DOCTOR',
      action: 'REGISTER',
      resourceId: staffId,
      details: `Registered medical practitioner: ${newDoctor.name} (${staffId})`,
    });

    return newDoctor;
  }

  // 3. NURSE REGISTRATION
  public registerNurse(params: {
    fullName: string;
    phone: string;
    email: string;
    department: string;
    hospital: string;
    nursingRegNo: string;
    shift: string;
    password?: string;
    registrationDoc?: UploadedDocument;
    hasOwnClinic?: boolean;
    clinicDetails?: ClinicDetails;
  }): User {
    const staffId = this.generateUniqueId('NUR');
    const salt = authSecurity.generateSalt();
    const passwordHash = authSecurity.hashPasswordSync(params.password || DEFAULT_DEMO_PASSWORD, salt);

    const newNurse: User = {
      id: `USR-${staffId}`,
      staffId,
      role: 'NURSE',
      name: params.fullName.startsWith('Nurse') ? params.fullName : `Nurse ${params.fullName}`,
      phone: params.phone,
      email: params.email,
      passwordHash,
      salt,
      isDemoAccount: false,
      accountStatus: 'ACTIVE',
      createdAt: new Date().toISOString(),
      nurseDetails: {
        department: params.department,
        hospital: params.hospital,
        nursingRegNo: params.nursingRegNo,
        shift: params.shift,
        registrationDoc: params.registrationDoc,
        hasOwnClinic: params.hasOwnClinic,
        clinicDetails: params.clinicDetails,
      },
    };

    const nurses = this.getAllNurses();
    nurses.unshift(newNurse);
    localStorage.setItem(NURSES_KEY, JSON.stringify(nurses));

    dpdpService.logAudit({
      actorId: staffId,
      actorRole: 'NURSE',
      action: 'REGISTER',
      resourceId: staffId,
      details: `Registered clinical nurse: ${newNurse.name} (${staffId})`,
    });

    return newNurse;
  }

  // 4. LAB TECHNICIAN REGISTRATION
  public registerLabTech(params: {
    fullName: string;
    phone: string;
    email: string;
    labSection: string;
    hospital: string;
    certificationNo: string;
    password?: string;
    registrationDoc?: UploadedDocument;
    hasOwnEstablishment?: boolean;
    establishmentDetails?: {
      establishmentName: string;
      address?: string;
      licenseDoc?: UploadedDocument;
    };
  }): User {
    const staffId = this.generateUniqueId('LAB');
    const salt = authSecurity.generateSalt();
    const passwordHash = authSecurity.hashPasswordSync(params.password || DEFAULT_DEMO_PASSWORD, salt);

    const newLabTech: User = {
      id: `USR-${staffId}`,
      staffId,
      role: 'LAB_TECHNICIAN',
      name: params.fullName,
      phone: params.phone,
      email: params.email,
      passwordHash,
      salt,
      isDemoAccount: false,
      accountStatus: 'ACTIVE',
      createdAt: new Date().toISOString(),
      labTechDetails: {
        labSection: params.labSection,
        hospital: params.hospital,
        certificationNo: params.certificationNo,
        registrationDoc: params.registrationDoc,
        hasOwnEstablishment: params.hasOwnEstablishment,
        establishmentDetails: params.establishmentDetails,
      },
    };

    const techs = this.getAllLabTechs();
    techs.unshift(newLabTech);
    localStorage.setItem(LAB_TECHS_KEY, JSON.stringify(techs));

    dpdpService.logAudit({
      actorId: staffId,
      actorRole: 'LAB_TECHNICIAN',
      action: 'REGISTER',
      resourceId: staffId,
      details: `Registered lab technician: ${newLabTech.name} (${staffId})`,
    });

    return newLabTech;
  }

  // Query functions for all entities
  public getAllPatients(): PatientProfile[] {
    try {
      const raw = localStorage.getItem(PATIENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  public getPatientById(patientId: string): PatientProfile | undefined {
    return this.getAllPatients().find(p => p.patientId === patientId.trim().toUpperCase());
  }

  public updatePatientLanguage(patientId: string, lang: LanguageCode): void {
    const patients = this.getAllPatients();
    const patient = patients.find(p => p.patientId === patientId.trim().toUpperCase());
    if (patient) {
      patient.preferredLanguage = lang;
      localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
    }
  }

  public getPatientLanguage(patientId: string): LanguageCode {
    const patient = this.getPatientById(patientId);
    return patient?.preferredLanguage || (localStorage.getItem('aihc_patient_lang') as LanguageCode) || 'en';
  }

  public getAllDoctors(): User[] {
    try {
      const raw = localStorage.getItem(DOCTORS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  public getAllNurses(): User[] {
    try {
      const raw = localStorage.getItem(NURSES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  public getAllLabTechs(): User[] {
    try {
      const raw = localStorage.getItem(LAB_TECHS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  public findUserById(idOrIdentifier: string): User | undefined {
    let clean = idOrIdentifier.trim().toUpperCase();
    // Alias legacy ID AIHC-7X9P26 to PAT-0001 if needed
    if (clean === 'AIHC-7X9P26') {
      clean = 'PAT-0001';
    }

    // Check doctors
    const doc = this.getAllDoctors().find(d => d.staffId === clean || d.id === clean);
    if (doc) return doc;

    // Check nurses
    const nur = this.getAllNurses().find(n => n.staffId === clean || n.id === clean);
    if (nur) return nur;

    // Check lab techs
    const lab = this.getAllLabTechs().find(l => l.staffId === clean || l.id === clean);
    if (lab) return lab;

    // Check patients
    const pat = this.getAllPatients().find(p => p.patientId === clean || (clean === 'PAT-0001' && p.patientId === 'AIHC-7X9P26'));
    if (pat) {
      return {
        id: `USR-${pat.patientId}`,
        patientId: pat.patientId,
        role: 'PATIENT',
        name: pat.fullName,
        phone: pat.phone,
        email: pat.email,
        passwordHash: pat.passwordHash,
        salt: pat.salt,
        isDemoAccount: pat.isDemoAccount ?? true,
        accountStatus: pat.accountStatus || 'ACTIVE',
        createdAt: pat.createdAt,
        age: pat.age,
        sex: pat.sex,
        gender: pat.gender || pat.sex,
        ageGroup: pat.ageGroup,
        patientDetails: {
          age: pat.age,
          sex: pat.sex,
          gender: pat.gender || pat.sex,
          ageGroup: pat.ageGroup,
        },
      };
    }

    return undefined;
  }

  // Authenticate user with Unique ID and Password
  public async authenticateUser(identifier: string, plainTextPassword: string): Promise<{
    success: boolean;
    user?: User;
    role?: UserRole;
    error?: string;
  }> {
    const cleanId = identifier.trim().toUpperCase();
    const user = this.findUserById(cleanId);

    if (!user) {
      return {
        success: false,
        error: `User ID "${identifier}" not found. Please verify your Unique ID (e.g. PAT-0001, DOC-0001, NUR-0001, LAB-0001) or register a new account.`,
      };
    }

    if (user.accountStatus && user.accountStatus !== 'ACTIVE') {
      return {
        success: false,
        error: 'Your account is currently inactive or suspended. Please contact hospital reception.',
      };
    }

    // Salt and hash
    const salt = user.salt || STATIC_SALT;
    const hashToCompare = user.passwordHash || authSecurity.hashPasswordSync(DEFAULT_DEMO_PASSWORD, salt);

    const isValid = await authSecurity.verifyPassword(plainTextPassword, hashToCompare, salt);
    if (!isValid) {
      return {
        success: false,
        error: 'Invalid password. Please check your password and try again. (For demo accounts, use Demo@123)',
      };
    }

    dpdpService.logAudit({
      actorId: user.patientId || user.staffId || user.id,
      actorRole: user.role,
      action: 'LOGIN',
      resourceId: user.patientId || user.staffId || user.id,
      details: `User authenticated successfully via Common Login as ${user.role} (${user.name})`,
    });

    return {
      success: true,
      user,
      role: user.role,
    };
  }

  // Appointments
  public getAppointments(): Appointment[] {
    try {
      const raw = localStorage.getItem(APPOINTMENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  public getAppointmentsForPatient(patientId: string): Appointment[] {
    return this.getAppointments().filter(a => a.patientId === patientId);
  }

  public canPatientAccessPreConsultation(patientId: string): {
    allowed: boolean;
    reason?: string;
    appointment?: Appointment;
  } {
    const activeAppts = this.getAppointmentsForPatient(patientId).filter(
      a => a.status !== 'CANCELLED' && !a.isArchived
    );
    if (activeAppts.length === 0) {
      return {
        allowed: false,
        reason: 'No active booked appointment found in database. Pre-consultation is available only after booking an appointment.',
      };
    }
    return {
      allowed: true,
      appointment: activeAppts[0],
    };
  }

  public canPatientAccessReportSummarizer(patientId: string): {
    allowed: boolean;
    reason?: string;
    appointment?: Appointment;
  } {
    const preAuth = this.canPatientAccessPreConsultation(patientId);
    if (!preAuth.allowed || !preAuth.appointment) {
      return {
        allowed: false,
        reason: 'You must first book an appointment and complete AI Pre-Consultation before uploading reports for AI summarization.',
      };
    }

    const appt = preAuth.appointment;
    const isCompleted =
      appt.preConsultationStatus === 'COMPLETED' ||
      this.getQAPairsForPatient(patientId).length > 0;

    if (!isCompleted) {
      return {
        allowed: false,
        reason: 'Please complete your Pre-Consultation first. The Report Summarizer is available only after completing Pre-Consultation.',
        appointment: appt,
      };
    }

    return {
      allowed: true,
      appointment: appt,
    };
  }

  // Convert any previous "access revoked" or critical emergency states to Normal Health on next consultation booking
  // Cancels the access revocation across appointments and consultation sessions
  public convertRevokedAccessToNormalHealthOnNextBooking(patientId: string): void {
    const cleanId = patientId.trim().toUpperCase();

    // 1. Archive past completed/revoked appointments and cancel revocation flag
    this.archiveCompletedConsultationCycle(cleanId);

    // Also explicitly ensure any completed appointments have revokeCancelled set
    const allAppts = this.getAppointments();
    allAppts.forEach(apt => {
      if (apt.patientId === cleanId && apt.status === 'COMPLETED') {
        apt.revokeCancelled = true;
        apt.revokeCancelledAt = new Date().toISOString();
      }
    });
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(allAppts));

    // 2. Clear/resolve lingering emergency alerts for this patient to Normal Health
    try {
      const activeEmergencies = JSON.parse(localStorage.getItem('aihc_active_emergencies') || '[]');
      const updatedEmergencies = activeEmergencies.map((alt: any) => {
        if (alt.patientId === cleanId && alt.status === 'ACTIVE') {
          return {
            ...alt,
            status: 'RESOLVED',
            resolvedAt: new Date().toISOString(),
            resolutionNote: 'Revocation cancelled and converted to Normal Health on next consultation booking',
          };
        }
        return alt;
      });
      localStorage.setItem('aihc_active_emergencies', JSON.stringify(updatedEmergencies));

      const allAlerts = JSON.parse(localStorage.getItem('aihc_emergency_alerts_db') || '[]');
      const updatedAll = allAlerts.map((alt: any) => {
        if (alt.patientId === cleanId && alt.status === 'ACTIVE') {
          return {
            ...alt,
            status: 'RESOLVED',
            resolvedAt: new Date().toISOString(),
            resolutionNote: 'Revocation cancelled and converted to Normal Health on next consultation booking',
          };
        }
        return alt;
      });
      localStorage.setItem('aihc_emergency_alerts_db', JSON.stringify(updatedAll));
    } catch (e) {}

    // 3. If DPDP consent was WITHDRAWN/revoked, reinstate to GRANTED for care continuity
    const consent = dpdpService.getConsent(cleanId);
    if (consent && consent.status === 'WITHDRAWN') {
      dpdpService.saveConsent(cleanId, 'GRANTED');
    }

    // 4. Update consultation sessions note to reflect revocation cancellation and access restoration to Normal Health
    const sessions = this.getAllConsultationSessions();
    sessions.forEach(s => {
      if (s.patientId === cleanId && s.status === 'COMPLETED' && (!s.notes || s.notes.includes('revoked'))) {
        s.notes = `${s.notes || 'Consultation completed.'} (Next consultation booked: Revocation cancelled & access restored to Normal Health)`;
      }
    });
    localStorage.setItem(CONSULTATION_SESSIONS_KEY, JSON.stringify(sessions));

    // 5. Log DPDP audit
    dpdpService.logAudit({
      actorId: cleanId,
      actorRole: 'PATIENT',
      action: 'ACCESS_RESTORED_NORMAL_HEALTH',
      resourceId: cleanId,
      details: `Previous access revoked state cancelled and converted to Normal Health upon next consultation booking for patient ${cleanId}.`,
    });
  }

  public bookAppointment(params: {
    patientId: string;
    patientName: string;
    hospital: string;
    department: string;
    doctorId: string;
    doctorName: string;
    date: string;
    timeSlot: string;
    medicineSystem?: MedicineSystem;
  }): Appointment {
    // Convert previous revoked access and emergency states to Normal Health
    this.convertRevokedAccessToNormalHealthOnNextBooking(params.patientId);

    const newApt: Appointment = {
      id: `APT-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      patientId: params.patientId,
      patientName: params.patientName,
      hospital: params.hospital,
      department: params.department,
      doctorId: params.doctorId,
      doctorName: params.doctorName,
      medicineSystem: params.medicineSystem || 'ALLOPATHY_HOMEOPATHY',
      date: params.date,
      timeSlot: params.timeSlot,
      status: 'SCHEDULED',
      preConsultationStatus: 'NOT_STARTED',
      triagePriority: 'NORMAL',
      bookedAt: new Date().toISOString(),
    };

    const all = this.getAppointments();
    all.unshift(newApt);
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(all));
    return newApt;
  }

  public updateAppointmentPreConsultation(
    appointmentId: string,
    status: 'IN_PROGRESS' | 'COMPLETED',
    triagePriority?: TriageLevel
  ): void {
    const all = this.getAppointments();
    const apt = all.find(a => a.id === appointmentId);
    if (apt) {
      apt.preConsultationStatus = status;
      if (triagePriority) {
        apt.triagePriority = triagePriority;
      }
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(all));
    }
  }

  public updateAppointmentStatus(appointmentId: string, status: Appointment['status']): void {
    const all = this.getAppointments();
    const apt = all.find(a => a.id === appointmentId);
    if (apt) {
      apt.status = status;
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(all));
    }
  }

  // Reverse completed consultation workflow to starting step (Step 1: Book Appointment)
  public archiveCompletedConsultationCycle(patientId: string): void {
    const all = this.getAppointments();
    let count = 0;
    all.forEach(apt => {
      if (apt.patientId === patientId && (apt.status === 'COMPLETED' || apt.preConsultationStatus === 'COMPLETED')) {
        apt.isArchived = true;
        apt.revokeCancelled = true;
        apt.revokeCancelledAt = new Date().toISOString();
        count++;
      }
    });
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(all));

    // Clear session-specific reports skipped flag for next cycle
    try {
      localStorage.removeItem(`aihc_reports_skipped_${patientId}`);
    } catch (e) {}

    dpdpService.logAudit({
      actorId: patientId,
      actorRole: 'PATIENT',
      action: 'SESSION_TERMINATED',
      resourceId: patientId,
      details: `Reversed consultation workflow to starting point. Marked ${count} appointment(s) as revoke-cancelled and archived. Medical history and prescriptions preserved.`,
    });
  }

  // Vitals (Nurse Only)
  public recordVitals(vitals: Omit<PatientVitals, 'id' | 'recordedAt'>): PatientVitals {
    const record: PatientVitals = {
      id: `VIT-${Date.now()}`,
      recordedAt: new Date().toISOString(),
      ...vitals,
    };
    const all = this.getAllVitals();
    all.unshift(record);
    localStorage.setItem(VITALS_KEY, JSON.stringify(all));
    return record;
  }

  public getVitalsForPatient(patientId: string): PatientVitals[] {
    return this.getAllVitals().filter(v => v.patientId === patientId);
  }

  public getAllVitals(): PatientVitals[] {
    try {
      const raw = localStorage.getItem(VITALS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  // Lab Samples (Lab Technician Only)
  public getAllLabSamples(): LabSample[] {
    try {
      const raw = localStorage.getItem(LAB_SAMPLES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  public updateLabSampleStatus(sampleId: string, status: LabSample['status'], summaryFindings?: string): void {
    const all = this.getAllLabSamples();
    const sample = all.find(s => s.sampleId === sampleId);
    if (sample) {
      sample.status = status;
      if (summaryFindings) sample.summaryFindings = summaryFindings;
      if (status === 'COMPLETED') sample.completedAt = new Date().toISOString();
      localStorage.setItem(LAB_SAMPLES_KEY, JSON.stringify(all));
    }
  }

  public registerLabSample(sample: Omit<LabSample, 'sampleId' | 'receivedAt' | 'status'>): LabSample {
    const newSample: LabSample = {
      sampleId: `SMP-${Math.floor(10000 + Math.random() * 90000)}`,
      receivedAt: new Date().toISOString(),
      status: 'COLLECTED',
      ...sample,
    };
    const all = this.getAllLabSamples();
    all.unshift(newSample);
    localStorage.setItem(LAB_SAMPLES_KEY, JSON.stringify(all));
    return newSample;
  }

  // AI Consultation Summaries
  public saveAISummary(summary: AIConsultationSummary): void {
    const all = this.getAllAISummaries();
    const index = all.findIndex(s => s.id === summary.id || s.patientId === summary.patientId);
    if (index >= 0) {
      all[index] = summary;
    } else {
      all.unshift(summary);
    }
    localStorage.setItem(AI_SUMMARIES_KEY, JSON.stringify(all));
  }

  public getAISummaryForPatient(patientId: string): AIConsultationSummary | undefined {
    return this.getAllAISummaries().find(s => s.patientId === patientId);
  }

  public getAllAISummaries(): AIConsultationSummary[] {
    try {
      const raw = localStorage.getItem(AI_SUMMARIES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  // Multilingual Adaptive QA Pairs Storage
  public saveQAPair(record: MultilingualQAPairRecord): void {
    const all = this.getAllQAPairs();
    const index = all.findIndex(q => q.id === record.id);
    if (index >= 0) {
      all[index] = record;
    } else {
      all.push(record);
    }
    localStorage.setItem(QA_PAIRS_KEY, JSON.stringify(all));
  }

  public getAllQAPairs(): MultilingualQAPairRecord[] {
    try {
      const raw = localStorage.getItem(QA_PAIRS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  public getQAPairsForConsultation(consultationId: string): MultilingualQAPairRecord[] {
    return this.getAllQAPairs().filter(q => q.consultationId === consultationId);
  }

  public getQAPairsForPatient(patientId: string): MultilingualQAPairRecord[] {
    return this.getAllQAPairs().filter(q => q.patientId === patientId.trim().toUpperCase());
  }

  // ==========================================
  // CENTRAL STRICT RBAC & ANTI-ID MANIPULATION
  // ==========================================

  public canUserAccessPatientData(user: User, patientId: string): { allowed: boolean; reason?: string } {
    const cleanPatientId = patientId.trim().toUpperCase();

    // 1. PATIENT: Strictly own profile and records only
    if (user.role === 'PATIENT') {
      const myId = (user.patientId || '').trim().toUpperCase();
      if (myId === cleanPatientId || (cleanPatientId === 'PAT-0001' && myId === 'AIHC-7X9P26')) {
        return { allowed: true };
      }
      dpdpService.logAudit({
        actorId: user.patientId || user.id,
        actorRole: 'PATIENT',
        action: 'UNAUTHORIZED_ACCESS_BLOCKED',
        resourceId: cleanPatientId,
        details: `403 Forbidden: Patient ${user.name} (${myId}) attempted unauthorized cross-patient access to record ${cleanPatientId}. Request blocked.`,
      });
      return {
        allowed: false,
        reason: `403 Forbidden: You are only authorized to access your own healthcare records (${myId}). Cross-patient access is prohibited under the DPDP Act.`,
      };
    }

    // 2. DOCTOR: Only patients who have an active consultation session or non-completed appointment, or where revoke is cancelled by new booking
    if (user.role === 'DOCTOR') {
      const docId = (user.staffId || user.id).trim().toUpperCase();
      const appointments = this.getAppointments();
      const doctorAppointments = appointments.filter(
        apt => (
          normalizeDocId(apt.doctorId) === normalizeDocId(docId) ||
          apt.doctorId === docId ||
          apt.doctorId === user.id ||
          `DOC-${apt.doctorId}` === docId
        )
      );
      const patientAppointments = doctorAppointments.filter(apt => apt.patientId === cleanPatientId);

      const activeAppt = patientAppointments.find(apt => apt.status !== 'COMPLETED');
      const activeSession = this.getActiveConsultationSession(docId, cleanPatientId);

      // Check if patient has a new active appointment in the system or revocation was cancelled
      const allPatientAppts = appointments.filter(apt => apt.patientId === cleanPatientId);
      const hasSystemActiveBooking = allPatientAppts.some(apt => apt.status !== 'COMPLETED');
      const hasRevokeCancelled = allPatientAppts.some(apt => apt.revokeCancelled);

      if (activeAppt || activeSession || (patientAppointments.length > 0 && (hasSystemActiveBooking || hasRevokeCancelled))) {
        dpdpService.logAudit({
          actorId: docId,
          actorRole: 'DOCTOR',
          action: 'RECORD_VIEWED',
          resourceId: cleanPatientId,
          details: `Doctor ${user.name} (${docId}) accessed authorized clinical case (active consultation / revocation cancelled upon new booking) for patient ${cleanPatientId}.`,
        });
        return { allowed: true };
      }

      if (patientAppointments.length > 0) {
        dpdpService.logAudit({
          actorId: docId,
          actorRole: 'DOCTOR',
          action: 'ACCESS_TERMINATED_BLOCKED',
          resourceId: cleanPatientId,
          details: `403 Forbidden: Doctor ${user.name} (${docId}) attempted to access patient ${cleanPatientId}, but the consultation session has ended. Request blocked.`,
        });
        return {
          allowed: false,
          reason: `403 Forbidden: The access session for this patient consultation has ended and access is revoked. Medical records remain securely stored with the patient's Unique ID (${cleanPatientId}). Access will be restored upon booking the next consultation.`,
        };
      }

      dpdpService.logAudit({
        actorId: docId,
        actorRole: 'DOCTOR',
        action: 'UNAUTHORIZED_ACCESS_BLOCKED',
        resourceId: cleanPatientId,
        details: `403 Forbidden: Doctor ${user.name} (${docId}) attempted to access patient ${cleanPatientId} without an active consultation session. Request blocked.`,
      });
      return {
        allowed: false,
        reason: `403 Forbidden: Doctor ${user.name} (${docId}) does not have an active consultation session with patient ${cleanPatientId}. Clinical access denied.`,
      };
    }

    // 3. NURSE: Only patients assigned to this nurse by an attending doctor
    if (user.role === 'NURSE') {
      const nurseId = (user.staffId || user.id).trim().toUpperCase();
      const assignments = this.getAllNurseAssignments();
      const hasAssignment = assignments.some(
        asg => asg.patientId === cleanPatientId && (asg.nurseId === nurseId || asg.nurseId === user.id) && asg.status === 'ACTIVE'
      );

      if (hasAssignment) {
        dpdpService.logAudit({
          actorId: nurseId,
          actorRole: 'NURSE',
          action: 'RECORD_VIEWED',
          resourceId: cleanPatientId,
          details: `Nurse ${user.name} (${nurseId}) accessed clinical records for assigned patient ${cleanPatientId}.`,
        });
        return { allowed: true };
      }

      dpdpService.logAudit({
        actorId: nurseId,
        actorRole: 'NURSE',
        action: 'UNAUTHORIZED_ACCESS_BLOCKED',
        resourceId: cleanPatientId,
        details: `403 Forbidden: Nurse ${user.name} (${nurseId}) attempted to access patient ${cleanPatientId} without an authorized clinical assignment. Request blocked.`,
      });
      return {
        allowed: false,
        reason: `403 Forbidden: Patient ${cleanPatientId} has not been clinically assigned to Nurse ${user.name} (${nurseId}) by an attending doctor. Clinical access denied.`,
      };
    }

    // 4. LAB TECHNICIAN: Only patient laboratory workflow/sample records
    if (user.role === 'LAB_TECHNICIAN') {
      const samples = this.getAllLabSamples();
      const hasSample = samples.some(s => s.patientId === cleanPatientId);

      if (hasSample) {
        return { allowed: true };
      }

      return {
        allowed: false,
        reason: `403 Forbidden: No active laboratory orders or specimens found for patient ${cleanPatientId}. Laboratory access restricted.`,
      };
    }

    return { allowed: false, reason: '403 Forbidden: Access denied.' };
  }

  // Role-Authorized Query Methods
  public getAuthorizedAppointments(user: User): Appointment[] {
    const all = this.getAppointments();
    if (user.role === 'PATIENT') {
      const pId = (user.patientId || '').trim().toUpperCase();
      return all.filter(a => a.patientId === pId || (pId === 'PAT-0001' && a.patientId === 'AIHC-7X9P26'));
    }
    if (user.role === 'DOCTOR') {
      const docId = (user.staffId || user.id).trim().toUpperCase();
      return all.filter(a =>
        normalizeDocId(a.doctorId) === normalizeDocId(docId) ||
        a.doctorId === docId ||
        a.doctorId === user.id ||
        `DOC-${a.doctorId}` === docId
      );
    }
    if (user.role === 'NURSE') {
      const nurseId = (user.staffId || user.id).trim().toUpperCase();
      const assignedPatientIds = this.getNurseAssignmentsForNurse(nurseId).filter(a => a.status === 'ACTIVE').map(a => a.patientId);
      return all.filter(a => assignedPatientIds.includes(a.patientId));
    }
    return [];
  }

  public getAuthorizedPatients(user: User): PatientProfile[] {
    const all = this.getAllPatients();
    if (user.role === 'PATIENT') {
      const pId = (user.patientId || '').trim().toUpperCase();
      return all.filter(p => p.patientId === pId || (pId === 'PAT-0001' && p.patientId === 'AIHC-7X9P26'));
    }
    if (user.role === 'DOCTOR') {
      const myAppts = this.getAuthorizedAppointments(user);
      const myActiveAppts = myAppts.filter(a => a.status !== 'COMPLETED' || a.revokeCancelled);
      const authorizedIds = Array.from(new Set(myActiveAppts.map(a => a.patientId)));
      return all.filter(p => authorizedIds.includes(p.patientId));
    }
    if (user.role === 'NURSE') {
      const nurseId = (user.staffId || user.id).trim().toUpperCase();
      const assignedIds = this.getNurseAssignmentsForNurse(nurseId).filter(a => a.status === 'ACTIVE').map(a => a.patientId);
      return all.filter(p => assignedIds.includes(p.patientId));
    }
    if (user.role === 'LAB_TECHNICIAN') {
      const labPatientIds = Array.from(new Set(this.getAllLabSamples().map(s => s.patientId)));
      return all.filter(p => labPatientIds.includes(p.patientId));
    }
    return [];
  }

  public getAuthorizedReports(user: User): MedicalReport[] {
    try {
      const raw = localStorage.getItem('aihc_medical_reports_db');
      const all: MedicalReport[] = raw ? JSON.parse(raw) : [];
      if (user.role === 'PATIENT') {
        const pId = (user.patientId || '').trim().toUpperCase();
        const patientReports = all.filter(r => r.patientId === pId || (pId === 'PAT-0001' && r.patientId === 'AIHC-7X9P26'));
        // Backend authorization: Strip doctor-only AI summary and keywords from patient response
        return patientReports.map(r => ({
          ...r,
          aiSummary: undefined,
          keywords: [],
        }));
      }
      if (user.role === 'DOCTOR') {
        const myAppts = this.getAuthorizedAppointments(user);
        const myActiveAppts = myAppts.filter(a => a.status !== 'COMPLETED' || a.revokeCancelled);
        const authorizedIds = myActiveAppts.map(a => a.patientId);
        return all.filter(r => authorizedIds.includes(r.patientId));
      }
      if (user.role === 'NURSE') {
        const nurseId = (user.staffId || user.id).trim().toUpperCase();
        const assignedIds = this.getNurseAssignmentsForNurse(nurseId).filter(a => a.status === 'ACTIVE').map(a => a.patientId);
        return all.filter(r => assignedIds.includes(r.patientId));
      }
      if (user.role === 'LAB_TECHNICIAN') {
        return all;
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  public getAuthorizedAISummaries(user: User): AIConsultationSummary[] {
    const all = this.getAllAISummaries();
    if (user.role === 'PATIENT') {
      // Backend authorization: Patient APIs MUST NOT return doctor-facing AI pre-consultation summary
      return [];
    }
    if (user.role === 'DOCTOR') {
      const myAppts = this.getAuthorizedAppointments(user);
      const myActiveAppts = myAppts.filter(a => a.status !== 'COMPLETED' || a.revokeCancelled);
      const authorizedIds = myActiveAppts.map(a => a.patientId);
      return all.filter(s => authorizedIds.includes(s.patientId));
    }
    if (user.role === 'NURSE') {
      const nurseId = (user.staffId || user.id).trim().toUpperCase();
      const assignedIds = this.getNurseAssignmentsForNurse(nurseId).filter(a => a.status === 'ACTIVE').map(a => a.patientId);
      return all.filter(s => assignedIds.includes(s.patientId));
    }
    return [];
  }

  // Patient Medical Profile Updates (Allergies, Blood Group, Chronic Diseases, Diseases, Chronic Synchronous Diseases, Relative Number)
  public updatePatientMedicalProfile(
    patientId: string,
    updates: {
      allergies?: { drugs?: string[]; food?: string[]; others?: string[] };
      bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
      chronicDiseases?: string[];
      diseases?: string[];
      chronicSynchronousDiseases?: string[];
      relativeNumber?: string;
    },
    updatedBy: string
  ): PatientProfile | null {
    const cleanId = patientId.trim().toUpperCase();
    const patients = this.getAllPatients();
    const index = patients.findIndex(p => p.patientId === cleanId);
    if (index === -1) return null;

    const current = patients[index];
    const history = current.medicalUpdatesHistory || [];

    if (updates.bloodGroup && updates.bloodGroup !== current.bloodGroup) {
      history.unshift({
        field: 'bloodGroup',
        previousValue: current.bloodGroup || 'Not Recorded',
        newValue: updates.bloodGroup,
        updatedAt: new Date().toISOString(),
        updatedBy,
      });
      current.bloodGroup = updates.bloodGroup;
    }

    if (updates.allergies) {
      history.unshift({
        field: 'allergies',
        previousValue: current.allergies || { drugs: [], food: [], others: [] },
        newValue: updates.allergies,
        updatedAt: new Date().toISOString(),
        updatedBy,
      });
      current.allergies = updates.allergies;
    }

    if (updates.chronicDiseases) {
      history.unshift({
        field: 'chronicDiseases',
        previousValue: current.chronicDiseases || [],
        newValue: updates.chronicDiseases,
        updatedAt: new Date().toISOString(),
        updatedBy,
      });
      current.chronicDiseases = updates.chronicDiseases;
    }

    if (updates.diseases) {
      history.unshift({
        field: 'diseases',
        previousValue: current.diseases || [],
        newValue: updates.diseases,
        updatedAt: new Date().toISOString(),
        updatedBy,
      });
      current.diseases = updates.diseases;
    }

    if (updates.chronicSynchronousDiseases) {
      history.unshift({
        field: 'chronicSynchronousDiseases',
        previousValue: current.chronicSynchronousDiseases || [],
        newValue: updates.chronicSynchronousDiseases,
        updatedAt: new Date().toISOString(),
        updatedBy,
      });
      current.chronicSynchronousDiseases = updates.chronicSynchronousDiseases;
    }

    if (updates.relativeNumber !== undefined && updates.relativeNumber !== current.relativeNumber) {
      history.unshift({
        field: 'relativeNumber',
        previousValue: current.relativeNumber || 'Not Recorded',
        newValue: updates.relativeNumber,
        updatedAt: new Date().toISOString(),
        updatedBy,
      });
      current.relativeNumber = updates.relativeNumber;
    }

    current.medicalUpdatesHistory = history;
    patients[index] = current;
    localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));

    dpdpService.logAudit({
      actorId: updatedBy,
      actorRole: 'PATIENT',
      action: 'PROFILE_UPDATED',
      resourceId: cleanId,
      details: `Updated medical profile (allergies, blood group, diseases, chronic synchronous diseases, relative number) for patient ${cleanId}.`,
    });

    return current;
  }

  // Prescriptions Management
  public createPrescription(params: {
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    doctorRegNo?: string;
    doctorSpecialization?: string;
    department?: string;
    hospitalName?: string;
    appointmentId?: string;
    consultationId?: string;
    date?: string;
    diagnosis?: string;
    items?: PrescriptionItem[];
    medications?: PrescriptionItem[];
    doctorNotes?: string;
  }): Prescription {
    const prescriptions = this.getAllPrescriptions();
    const rxId = `RX-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    const medList = params.medications || params.items || [];

    const newRx: Prescription = {
      id: rxId,
      prescriptionId: rxId,
      patientId: params.patientId.trim().toUpperCase(),
      patientName: params.patientName,
      doctorId: params.doctorId,
      doctorName: params.doctorName,
      doctorRegNo: params.doctorRegNo || 'MCI-TN-48291',
      doctorSpecialization: params.doctorSpecialization || params.department || 'Clinical Medicine',
      department: params.department || 'General Medicine',
      hospitalName: params.hospitalName || 'AIHC Multi-Speciality Hospital',
      appointmentId: params.appointmentId,
      consultationId: params.consultationId,
      date: params.date || new Date().toISOString().split('T')[0],
      prescribedAt: new Date().toISOString(),
      diagnosis: params.diagnosis,
      items: medList,
      medications: medList,
      doctorNotes: params.doctorNotes,
      createdAt: new Date().toISOString(),
    };

    prescriptions.unshift(newRx);
    localStorage.setItem(PRESCRIPTIONS_KEY, JSON.stringify(prescriptions));

    dpdpService.logAudit({
      actorId: params.doctorId,
      actorRole: 'DOCTOR',
      action: 'PRESCRIPTION_ADDED',
      resourceId: newRx.prescriptionId,
      details: `Doctor ${params.doctorName} issued prescription ${newRx.prescriptionId} for patient ${newRx.patientId} (${newRx.items.length} items).`,
    });

    return newRx;
  }

  public getAllPrescriptions(): Prescription[] {
    try {
      const raw = localStorage.getItem(PRESCRIPTIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  public getPrescriptionsForPatient(patientId: string): Prescription[] {
    return this.getAllPrescriptions().filter(r => r.patientId === patientId.trim().toUpperCase());
  }

  public getPrescriptionsByDoctor(doctorId: string): Prescription[] {
    const clean = doctorId.trim().toUpperCase();
    return this.getAllPrescriptions().filter(r => r.doctorId === clean || `DOC-${clean}` === r.doctorId);
  }

  // Nurse Assignments Management
  public createNurseAssignment(params: {
    patientId: string;
    patientName: string;
    nurseId: string;
    nurseName: string;
    doctorId: string;
    doctorName: string;
    appointmentId?: string;
    careType?: string;
    priority?: 'NORMAL' | 'URGENT' | 'EMERGENCY';
    instructions?: string;
  }): NurseAssignment {
    const assignments = this.getAllNurseAssignments();
    const asgId = `ASG-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    const newAsg: NurseAssignment = {
      id: asgId,
      assignmentId: asgId,
      patientId: params.patientId.trim().toUpperCase(),
      patientName: params.patientName,
      nurseId: params.nurseId.trim().toUpperCase(),
      nurseName: params.nurseName,
      doctorId: params.doctorId.trim().toUpperCase(),
      doctorName: params.doctorName,
      appointmentId: params.appointmentId,
      assignedDate: new Date().toISOString().split('T')[0],
      careType: params.careType || 'MONITORING',
      priority: params.priority || 'NORMAL',
      status: 'ACTIVE',
      instructions: params.instructions || 'Routine vital sign assessment and clinical monitoring.',
      createdAt: new Date().toISOString(),
    };

    assignments.unshift(newAsg);
    localStorage.setItem(NURSE_ASSIGNMENTS_KEY, JSON.stringify(assignments));

    dpdpService.logAudit({
      actorId: params.doctorId,
      actorRole: 'DOCTOR',
      action: 'PATIENT_ASSIGNED',
      resourceId: newAsg.assignmentId,
      details: `Doctor ${params.doctorName} assigned patient ${newAsg.patientId} to Nurse ${newAsg.nurseName} (${newAsg.nurseId}). Instructions: ${newAsg.instructions}`,
    });

    return newAsg;
  }

  public getAllNurseAssignments(): NurseAssignment[] {
    try {
      const raw = localStorage.getItem(NURSE_ASSIGNMENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  public getNurseAssignmentsForNurse(nurseId: string): NurseAssignment[] {
    const clean = nurseId.trim().toUpperCase();
    return this.getAllNurseAssignments().filter(a => a.nurseId === clean || a.nurseId === `NUR-${clean}`);
  }

  public getNurseAssignmentsByDoctor(doctorId: string): NurseAssignment[] {
    const clean = doctorId.trim().toUpperCase();
    return this.getAllNurseAssignments().filter(a => a.doctorId === clean || a.doctorId === `DOC-${clean}`);
  }

  public getNurseAssignmentsForPatient(patientId: string): NurseAssignment[] {
    return this.getAllNurseAssignments().filter(a => a.patientId === patientId.trim().toUpperCase());
  }

  public completeNurseAssignment(assignmentId: string): boolean {
    const assignments = this.getAllNurseAssignments();
    const found = assignments.find(a => a.assignmentId === assignmentId);
    if (found) {
      found.status = 'COMPLETED';
      localStorage.setItem(NURSE_ASSIGNMENTS_KEY, JSON.stringify(assignments));
      return true;
    }
    return false;
  }

  // ==========================================
  // MEDICAL REPORTS STORAGE (OCR & Preserved Originals)
  // ==========================================
  public getAllMedicalReports(): MedicalReport[] {
    try {
      const raw = localStorage.getItem('aihc_medical_reports_db');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  public getReportsForPatient(patientId: string): MedicalReport[] {
    const clean = patientId.trim().toUpperCase();
    return this.getAllMedicalReports().filter(r => r.patientId === clean || (clean === 'PAT-0001' && r.patientId === 'AIHC-7X9P26'));
  }

  public saveMedicalReport(report: MedicalReport): void {
    const all = this.getAllMedicalReports();
    const existingIndex = all.findIndex(r => r.id === report.id);
    if (existingIndex >= 0) {
      all[existingIndex] = report;
    } else {
      all.unshift(report);
    }
    localStorage.setItem('aihc_medical_reports_db', JSON.stringify(all));
    localStorage.setItem('aihc_medical_reports', JSON.stringify(all));

    dpdpService.logAudit({
      actorId: report.uploadedBy || report.patientId,
      actorRole: 'PATIENT',
      action: 'REPORT_SAVED',
      resourceId: report.id,
      details: `Medical report ${report.reportTitle} (${report.id}) securely stored with preserved original document.`,
    });
  }

  public deleteMedicalReport(reportId: string): boolean {
    const all = this.getAllMedicalReports();
    const filtered = all.filter(r => r.id !== reportId);
    if (filtered.length !== all.length) {
      localStorage.setItem('aihc_medical_reports_db', JSON.stringify(filtered));
      localStorage.setItem('aihc_medical_reports', JSON.stringify(filtered));
      dpdpService.logAudit({
        actorId: 'PATIENT',
        actorRole: 'PATIENT',
        action: 'REPORT_DELETED',
        resourceId: reportId,
        details: `Medical report ${reportId} removed.`,
      });
      return true;
    }
    return false;
  }

  // ==========================================
  // CONSULTATION SESSIONS LIFECYCLE
  // ==========================================
  public getAllConsultationSessions(): ConsultationSession[] {
    try {
      const raw = localStorage.getItem(CONSULTATION_SESSIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  public createConsultationSession(params: {
    consultationId?: string;
    appointmentId?: string;
    patientId: string;
    doctorId: string;
    doctorName: string;
    notes?: string;
  }): ConsultationSession {
    const all = this.getAllConsultationSessions();
    const sessionId = `SES-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newSession: ConsultationSession = {
      sessionId,
      consultationId: params.consultationId || `CON-${Date.now()}`,
      appointmentId: params.appointmentId,
      patientId: params.patientId.trim().toUpperCase(),
      doctorId: params.doctorId,
      doctorName: params.doctorName,
      status: 'ACTIVE',
      startedAt: new Date().toISOString(),
      notes: params.notes,
    };
    all.unshift(newSession);
    localStorage.setItem(CONSULTATION_SESSIONS_KEY, JSON.stringify(all));

    dpdpService.logAudit({
      actorId: params.doctorId,
      actorRole: 'DOCTOR',
      action: 'SESSION_STARTED',
      resourceId: newSession.sessionId,
      details: `Consultation session ${newSession.sessionId} opened by Dr. ${params.doctorName} for patient ${newSession.patientId}.`,
    });

    return newSession;
  }

  public getActiveConsultationSession(doctorId: string, patientId: string): ConsultationSession | undefined {
    const docClean = doctorId.trim().toUpperCase();
    const patClean = patientId.trim().toUpperCase();
    return this.getAllConsultationSessions().find(
      s => s.status === 'ACTIVE' && s.patientId === patClean && (
        normalizeDocId(s.doctorId) === normalizeDocId(docClean) ||
        s.doctorId.toUpperCase() === docClean ||
        `DOC-${s.doctorId.toUpperCase()}` === docClean
      )
    );
  }

  public completeConsultationSession(identifier: string): ConsultationSession | undefined {
    const all = this.getAllConsultationSessions();
    const cleanId = identifier.trim();
    const session = all.find(s => s.sessionId === cleanId || s.consultationId === cleanId || s.appointmentId === cleanId);
    if (session) {
      session.status = 'COMPLETED';
      session.completedAt = new Date().toISOString();
      localStorage.setItem(CONSULTATION_SESSIONS_KEY, JSON.stringify(all));

      if (session.appointmentId) {
        this.updateAppointmentStatus(session.appointmentId, 'COMPLETED');
      }

      dpdpService.logAudit({
        actorId: session.doctorId,
        actorRole: 'DOCTOR',
        action: 'SESSION_TERMINATED',
        resourceId: session.sessionId,
        details: `Consultation session ${session.sessionId} marked COMPLETED. Active clinical access revoked for patient ${session.patientId}.`,
      });
    }
    return session;
  }

  public getConsultationSessionsForPatient(patientId: string): ConsultationSession[] {
    const clean = patientId.trim().toUpperCase();
    return this.getAllConsultationSessions().filter(s => s.patientId === clean);
  }

  // ==========================================
  // MEDICINE REMINDERS & ADHERENCE
  // ==========================================
  public getAllMedicineReminders(): MedicineReminder[] {
    try {
      const raw = localStorage.getItem(MEDICINE_REMINDERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  public getMedicineRemindersForPatient(patientId: string): MedicineReminder[] {
    const clean = patientId.trim().toUpperCase();
    return this.getAllMedicineReminders().filter(r => r.patientId === clean || (clean === 'PAT-0001' && r.patientId === 'AIHC-7X9P26'));
  }

  public createMedicineReminder(params: {
    patientId: string;
    prescriptionId?: string;
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    startDate: string;
    endDate?: string;
    reminderTimes: string[];
    instructions?: string;
    status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
    adherenceLogs?: AdherenceLog[];
  }): MedicineReminder {
    const all = this.getAllMedicineReminders();
    const reminderId = `REM-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newReminder: MedicineReminder = {
      reminderId,
      patientId: params.patientId.trim().toUpperCase(),
      prescriptionId: params.prescriptionId,
      medicineName: params.medicineName,
      dosage: params.dosage,
      frequency: params.frequency,
      duration: params.duration,
      startDate: params.startDate,
      endDate: params.endDate,
      reminderTimes: params.reminderTimes || ['08:00 AM', '08:00 PM'],
      instructions: params.instructions || 'Take after meals with warm water',
      status: params.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
      adherenceLogs: params.adherenceLogs || [],
    };
    all.unshift(newReminder);
    localStorage.setItem(MEDICINE_REMINDERS_KEY, JSON.stringify(all));

    dpdpService.logAudit({
      actorId: newReminder.patientId,
      actorRole: 'PATIENT',
      action: 'MEDICINE_REMINDER_CREATED',
      resourceId: reminderId,
      details: `Medicine reminder created for ${newReminder.medicineName} (${newReminder.dosage}) by patient ${newReminder.patientId}.`,
    });

    return newReminder;
  }

  public updateReminderStatus(reminderId: string, status: 'ACTIVE' | 'PAUSED' | 'COMPLETED'): MedicineReminder | undefined {
    const all = this.getAllMedicineReminders();
    const reminder = all.find(r => r.reminderId === reminderId);
    if (reminder) {
      reminder.status = status;
      localStorage.setItem(MEDICINE_REMINDERS_KEY, JSON.stringify(all));
    }
    return reminder;
  }

  public logAdherence(reminderId: string, log: {
    date: string;
    time: string;
    status: 'TAKEN' | 'SKIPPED' | 'SNOOZED';
    notes?: string;
  }): AdherenceLog | undefined {
    const all = this.getAllMedicineReminders();
    const reminder = all.find(r => r.reminderId === reminderId);
    if (!reminder) return undefined;

    const newLog: AdherenceLog = {
      logId: `ADH-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      date: log.date,
      time: log.time,
      status: log.status,
      loggedAt: new Date().toISOString(),
      notes: log.notes,
    };

    if (!reminder.adherenceLogs) {
      reminder.adherenceLogs = [];
    }
    reminder.adherenceLogs.unshift(newLog);
    localStorage.setItem(MEDICINE_REMINDERS_KEY, JSON.stringify(all));

    dpdpService.logAudit({
      actorId: reminder.patientId,
      actorRole: 'PATIENT',
      action: 'MEDICINE_ADHERENCE_LOGGED',
      resourceId: reminderId,
      details: `Adherence marked ${log.status} for ${reminder.medicineName} on ${log.date} ${log.time}.`,
    });

    return newLog;
  }

  public deleteMedicineReminder(reminderId: string): boolean {
    const all = this.getAllMedicineReminders();
    const filtered = all.filter(r => r.reminderId !== reminderId);
    if (filtered.length !== all.length) {
      localStorage.setItem(MEDICINE_REMINDERS_KEY, JSON.stringify(filtered));
      return true;
    }
    return false;
  }

  // Seed default data (Ensuring exact 12 sample demo accounts are always present and up-to-date)
  private initSeedData() {
    const isSeedV6 = localStorage.getItem(SEED_VERSION_KEY) === 'true';
    const defaultHash = authSecurity.hashPasswordSync(DEFAULT_DEMO_PASSWORD, STATIC_SALT);

    // 1. DOCTORS (DOC-0001, DOC-0002, DOC-0003)
    if (!isSeedV6 || !localStorage.getItem(DOCTORS_KEY)) {
      const seedDoctors: User[] = [
        {
          id: 'USR-DOC-0001',
          staffId: 'DOC-0001',
          role: 'DOCTOR',
          name: 'Dr. A. Sundaram (MD)',
          phone: '9840112233',
          email: 'dr.sundaram@aihc.hospital',
          passwordHash: defaultHash,
          salt: STATIC_SALT,
          isDemoAccount: true,
          accountStatus: 'ACTIVE',
          createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
          doctorDetails: {
            specialization: 'Senior Physician & Internal Medicine',
            department: 'General Medicine & OPD',
            hospital: 'AIHC Multi-Speciality Hospital',
            councilRegNo: 'MCI-TN-48291',
            medicineSystem: 'ALLOPATHY_HOMEOPATHY',
            isOnline: true,
          },
        },
        {
          id: 'USR-DOC-0002',
          staffId: 'DOC-0002',
          role: 'DOCTOR',
          name: 'Dr. Priya Natarajan (DM)',
          phone: '9840223344',
          email: 'dr.priya@aihc.hospital',
          passwordHash: defaultHash,
          salt: STATIC_SALT,
          isDemoAccount: true,
          accountStatus: 'ACTIVE',
          createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
          doctorDetails: {
            specialization: 'Interventional Cardiology',
            department: 'Cardiology',
            hospital: 'AIHC Multi-Speciality Hospital',
            councilRegNo: 'MCI-TN-59102',
            medicineSystem: 'ALLOPATHY_HOMEOPATHY',
            isOnline: true,
          },
        },
        {
          id: 'USR-DOC-0003',
          staffId: 'DOC-0003',
          role: 'DOCTOR',
          name: 'Dr. B. Ramanathan (BAMS)',
          phone: '9840334455',
          email: 'dr.ramanathan@aihc.hospital',
          passwordHash: defaultHash,
          salt: STATIC_SALT,
          isDemoAccount: true,
          accountStatus: 'ACTIVE',
          createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
          doctorDetails: {
            specialization: 'Panchakarma & Ayurvedic Kayachikitsa',
            department: 'AYUSH / Ayurvedic Care Wing',
            hospital: 'AIHC Community Health & AYUSH Center',
            councilRegNo: 'AYU-TN-11209',
            medicineSystem: 'AYURVEDA',
            isOnline: true,
          },
        },
      ];
      localStorage.setItem(DOCTORS_KEY, JSON.stringify(seedDoctors));
    }

    // 2. NURSES (NUR-0001, NUR-0002, NUR-0003)
    if (!isSeedV6 || !localStorage.getItem(NURSES_KEY)) {
      const seedNurses: User[] = [
        {
          id: 'USR-NUR-0001',
          staffId: 'NUR-0001',
          role: 'NURSE',
          name: 'Nurse Deepa V',
          phone: '9840445566',
          email: 'deepa.v@aihc.hospital',
          passwordHash: defaultHash,
          salt: STATIC_SALT,
          isDemoAccount: true,
          accountStatus: 'ACTIVE',
          createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
          nurseDetails: {
            department: 'OPD Triage & Emergency Assessment',
            hospital: 'AIHC Multi-Speciality Hospital',
            nursingRegNo: 'TNC-NUR-99120',
            shift: 'Morning (08:00 - 16:00)',
          },
        },
        {
          id: 'USR-NUR-0002',
          staffId: 'NUR-0002',
          role: 'NURSE',
          name: 'Nurse Anitha M',
          phone: '9840556677',
          email: 'anitha.m@aihc.hospital',
          passwordHash: defaultHash,
          salt: STATIC_SALT,
          isDemoAccount: true,
          accountStatus: 'ACTIVE',
          createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
          nurseDetails: {
            department: 'AYUSH & Inpatient Ward',
            hospital: 'AIHC Community Health & AYUSH Center',
            nursingRegNo: 'TNC-NUR-88432',
            shift: 'Evening (14:00 - 22:00)',
          },
        },
        {
          id: 'USR-NUR-0003',
          staffId: 'NUR-0003',
          role: 'NURSE',
          name: 'Nurse Rajeshwari S',
          phone: '9840667788',
          email: 'rajeshwari.s@aihc.hospital',
          passwordHash: defaultHash,
          salt: STATIC_SALT,
          isDemoAccount: true,
          accountStatus: 'ACTIVE',
          createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
          nurseDetails: {
            department: 'ICU & Critical Monitoring',
            hospital: 'AIHC Multi-Speciality Hospital',
            nursingRegNo: 'TNC-NUR-77541',
            shift: 'Night (22:00 - 06:00)',
          },
        },
      ];
      localStorage.setItem(NURSES_KEY, JSON.stringify(seedNurses));
    }

    // 3. LAB TECHS (LAB-0001, LAB-0002, LAB-0003)
    if (!isSeedV6 || !localStorage.getItem(LAB_TECHS_KEY)) {
      const seedTechs: User[] = [
        {
          id: 'USR-LAB-0001',
          staffId: 'LAB-0001',
          role: 'LAB_TECHNICIAN',
          name: 'Suresh K (Lab Tech)',
          phone: '9840778899',
          email: 'suresh.k@aihc.hospital',
          passwordHash: defaultHash,
          salt: STATIC_SALT,
          isDemoAccount: true,
          accountStatus: 'ACTIVE',
          createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
          labTechDetails: {
            labSection: 'Clinical Biochemistry & Hematology Diagnostic Center',
            hospital: 'AIHC Multi-Speciality Hospital',
            certificationNo: 'NABL-LT-8812',
          },
        },
        {
          id: 'USR-LAB-0002',
          staffId: 'LAB-0002',
          role: 'LAB_TECHNICIAN',
          name: 'Lakshmi Narayan (Lab Tech)',
          phone: '9840889900',
          email: 'lakshmi.n@aihc.hospital',
          passwordHash: defaultHash,
          salt: STATIC_SALT,
          isDemoAccount: true,
          accountStatus: 'ACTIVE',
          createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
          labTechDetails: {
            labSection: 'Pathology & Microbiology Diagnostic Lab',
            hospital: 'AIHC Multi-Speciality Hospital',
            certificationNo: 'NABL-LT-9023',
          },
        },
        {
          id: 'USR-LAB-0003',
          staffId: 'LAB-0003',
          role: 'LAB_TECHNICIAN',
          name: 'Arunkumar R (Radiology Tech)',
          phone: '9840990011',
          email: 'arunkumar.r@aihc.hospital',
          passwordHash: defaultHash,
          salt: STATIC_SALT,
          isDemoAccount: true,
          accountStatus: 'ACTIVE',
          createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
          labTechDetails: {
            labSection: 'Diagnostic Imaging & Radiology Wing',
            hospital: 'AIHC Multi-Speciality Hospital',
            certificationNo: 'AERB-RT-4419',
          },
        },
      ];
      localStorage.setItem(LAB_TECHS_KEY, JSON.stringify(seedTechs));
    }

    // 4. PATIENTS (PAT-0001, PAT-0002, PAT-0003 with Allergies, Blood Group, Chronic Diseases)
    if (!isSeedV6 || !localStorage.getItem(PATIENTS_KEY)) {
      const seedPatients: PatientProfile[] = [
        {
          patientId: 'PAT-0001',
          fullName: 'Kavitha Raman',
          phone: '9840123456',
          email: 'kavitha.raman@sample.in',
          age: 44,
          sex: 'FEMALE',
          ageGroup: 'ADULT',
          preferredMedicineSystem: 'AYURVEDA',
          bloodGroup: 'B+',
          allergies: {
            drugs: ['Sulfa Drugs'],
            food: ['Peanuts'],
            others: [],
          },
          chronicDiseases: ['No known chronic disease'],
          medicalUpdatesHistory: [
            {
              field: 'bloodGroup',
              previousValue: 'Not Recorded',
              newValue: 'B+',
              updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
              updatedBy: 'PAT-0001',
            },
          ],
          abhaAddress: 'kavitha.raman@abdm',
          abhaId: '91-8834-2910-4491',
          passwordHash: defaultHash,
          salt: STATIC_SALT,
          isDemoAccount: true,
          accountStatus: 'ACTIVE',
          createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
          consent: {
            status: 'GRANTED',
            timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
            purpose: 'Care Continuity, Cross-Consultation',
            version: 'v2.1-DPDP-2023',
            scope: ['REPORTS', 'OPD_SUMMARY', 'PRESCRIPTIONS'],
          },
        },
        {
          patientId: 'PAT-0002',
          fullName: 'Rajesh Sharma',
          phone: '9876543210',
          email: 'rajesh.sharma@sample.in',
          age: 36,
          sex: 'MALE',
          ageGroup: 'ADULT',
          preferredMedicineSystem: 'ALLOPATHY_HOMEOPATHY',
          bloodGroup: 'O+',
          allergies: {
            drugs: ['Penicillin'],
            food: [],
            others: ['Dust Mites'],
          },
          chronicDiseases: ['Hypertension', 'Type 2 Diabetes'],
          medicalUpdatesHistory: [],
          abhaAddress: 'rajesh.sharma@abdm',
          abhaId: '91-7721-4456-1123',
          passwordHash: defaultHash,
          salt: STATIC_SALT,
          isDemoAccount: true,
          accountStatus: 'ACTIVE',
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          consent: {
            status: 'GRANTED',
            timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
            purpose: 'General OPD Consultation',
            version: 'v2.1-DPDP-2023',
            scope: ['REPORTS', 'OPD_SUMMARY'],
          },
        },
        {
          patientId: 'PAT-0003',
          fullName: 'Meena Kumari',
          phone: '9841238901',
          email: 'meena.kumari@sample.in',
          age: 62,
          sex: 'FEMALE',
          ageGroup: 'SENIOR',
          preferredMedicineSystem: 'SIDDHA',
          bloodGroup: 'A+',
          allergies: {
            drugs: [],
            food: ['Shellfish'],
            others: [],
          },
          chronicDiseases: ['Osteoarthritis'],
          medicalUpdatesHistory: [],
          abhaAddress: 'meena.kumari@abdm',
          abhaId: '91-6644-8899-3321',
          passwordHash: defaultHash,
          salt: STATIC_SALT,
          isDemoAccount: true,
          accountStatus: 'ACTIVE',
          createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
          consent: {
            status: 'GRANTED',
            timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
            purpose: 'Chronic Pain & Joint Care Management',
            version: 'v2.1-DPDP-2023',
            scope: ['REPORTS', 'OPD_SUMMARY', 'PRESCRIPTIONS'],
          },
        },
      ];
      localStorage.setItem(PATIENTS_KEY, JSON.stringify(seedPatients));
    }

    // 5. APPOINTMENTS (Authorizes Specific Doctor Relationships)
    if (!isSeedV6 || !localStorage.getItem(APPOINTMENTS_KEY)) {
      const today = new Date().toISOString().split('T')[0];
      const seedAppointments: Appointment[] = [
        {
          id: 'APT-101',
          patientId: 'PAT-0001',
          patientName: 'Kavitha Raman',
          hospital: 'AIHC Community Health & AYUSH Center',
          department: 'AYUSH / Ayurvedic Care Wing',
          doctorId: 'DOC-0003',
          doctorName: 'Dr. B. Ramanathan (BAMS)',
          medicineSystem: 'AYURVEDA',
          date: today,
          timeSlot: '10:30 AM',
          status: 'WAITING',
          preConsultationStatus: 'COMPLETED',
          triagePriority: 'URGENT',
          bookedAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'APT-102',
          patientId: 'PAT-0001',
          patientName: 'Kavitha Raman',
          hospital: 'AIHC Multi-Speciality Hospital',
          department: 'General Medicine & OPD',
          doctorId: 'DOC-0001',
          doctorName: 'Dr. A. Sundaram (MD)',
          medicineSystem: 'ALLOPATHY_HOMEOPATHY',
          date: today,
          timeSlot: '11:45 AM',
          status: 'SCHEDULED',
          preConsultationStatus: 'COMPLETED',
          triagePriority: 'EMERGENCY',
          bookedAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: 'APT-103',
          patientId: 'PAT-0002',
          patientName: 'Rajesh Sharma',
          hospital: 'AIHC Multi-Speciality Hospital',
          department: 'General Medicine & OPD',
          doctorId: 'DOC-0001',
          doctorName: 'Dr. A. Sundaram (MD)',
          medicineSystem: 'ALLOPATHY_HOMEOPATHY',
          date: today,
          timeSlot: '09:30 AM',
          status: 'WAITING',
          preConsultationStatus: 'COMPLETED',
          triagePriority: 'PRIORITY',
          bookedAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'APT-104',
          patientId: 'PAT-0003',
          patientName: 'Meena Kumari',
          hospital: 'AIHC Multi-Speciality Hospital',
          department: 'Cardiology',
          doctorId: 'DOC-0002',
          doctorName: 'Dr. Priya Natarajan (DM)',
          medicineSystem: 'ALLOPATHY_HOMEOPATHY',
          date: today,
          timeSlot: '02:00 PM',
          status: 'WAITING',
          preConsultationStatus: 'COMPLETED',
          triagePriority: 'NORMAL',
          bookedAt: new Date(Date.now() - 43200000).toISOString(),
        },
      ];
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(seedAppointments));
    }

    // 6. NURSE ASSIGNMENTS (Authorizes Specific Nurse Relationships)
    if (!isSeedV6 || !localStorage.getItem(NURSE_ASSIGNMENTS_KEY)) {
      const today = new Date().toISOString().split('T')[0];
      const seedAssignments: NurseAssignment[] = [
        {
          assignmentId: 'ASG-001',
          patientId: 'PAT-0001',
          patientName: 'Kavitha Raman',
          nurseId: 'NUR-0001',
          nurseName: 'Nurse Deepa V',
          doctorId: 'DOC-0003',
          doctorName: 'Dr. B. Ramanathan (BAMS)',
          appointmentId: 'APT-101',
          assignedDate: today,
          status: 'ACTIVE',
          instructions: 'Monitor Ayurvedic post-panchakarma digestion, blood pressure, and pulse twice daily.',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          assignmentId: 'ASG-002',
          patientId: 'PAT-0002',
          patientName: 'Rajesh Sharma',
          nurseId: 'NUR-0002',
          nurseName: 'Nurse Anitha M',
          doctorId: 'DOC-0001',
          doctorName: 'Dr. A. Sundaram (MD)',
          appointmentId: 'APT-103',
          assignedDate: today,
          status: 'ACTIVE',
          instructions: 'Check fasting capillary blood glucose and monitor for adverse drug/penicillin reactions.',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          assignmentId: 'ASG-003',
          patientId: 'PAT-0003',
          patientName: 'Meena Kumari',
          nurseId: 'NUR-0003',
          nurseName: 'Nurse Rajeshwari S',
          doctorId: 'DOC-0002',
          doctorName: 'Dr. Priya Natarajan (DM)',
          appointmentId: 'APT-104',
          assignedDate: today,
          status: 'ACTIVE',
          instructions: 'Geriatric joint mobility monitoring and SpO2 tracking.',
          createdAt: new Date(Date.now() - 10800000).toISOString(),
        },
      ];
      localStorage.setItem(NURSE_ASSIGNMENTS_KEY, JSON.stringify(seedAssignments));
    }

    // 7. PRESCRIPTIONS (Linked to Patient ID, Doctor ID, and Appointment)
    if (!isSeedV6 || !localStorage.getItem(PRESCRIPTIONS_KEY)) {
      const today = new Date().toISOString().split('T')[0];
      const seedPrescriptions: Prescription[] = [
        {
          prescriptionId: 'RX-88210',
          patientId: 'PAT-0001',
          patientName: 'Kavitha Raman',
          doctorId: 'DOC-0003',
          doctorName: 'Dr. B. Ramanathan (BAMS)',
          doctorRegNo: 'AYU-TN-11209',
          doctorSpecialization: 'Panchakarma & Ayurvedic Kayachikitsa',
          hospitalName: 'AIHC Community Health & AYUSH Center',
          appointmentId: 'APT-101',
          date: today,
          diagnosis: 'Amlapitta & Vataja Grahani (Acid Dyspepsia)',
          items: [
            {
              medicineName: 'Triphala Churna',
              dosage: '5g (1 Teaspoon)',
              frequency: '0-0-1 (Bedtime)',
              duration: '14 Days',
              instructions: 'Take with warm water before sleep.',
            },
            {
              medicineName: 'Avipattikar Churna',
              dosage: '3g',
              frequency: '1-0-1 (Before Food)',
              duration: '10 Days',
              instructions: 'Mix with half teaspoon of honey or lukewarm water.',
            },
            {
              medicineName: 'Kamadudha Ras (Mukta Yukta)',
              dosage: '1 Tablet (250mg)',
              frequency: '1-0-1 (After Food)',
              duration: '7 Days',
              instructions: 'Swallow with warm milk or plain water.',
            },
          ],
          doctorNotes: 'Maintain satvik diet. Avoid fermented, deep-fried, and spicy meals. Sip warm water regularly.',
          createdAt: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          prescriptionId: 'RX-77412',
          patientId: 'PAT-0002',
          patientName: 'Rajesh Sharma',
          doctorId: 'DOC-0001',
          doctorName: 'Dr. A. Sundaram (MD)',
          doctorRegNo: 'MCI-TN-48291',
          doctorSpecialization: 'Senior Physician & Internal Medicine',
          hospitalName: 'AIHC Multi-Speciality Hospital',
          appointmentId: 'APT-103',
          date: today,
          diagnosis: 'Essential Hypertension & Gastritis',
          items: [
            {
              medicineName: 'Telmisartan 40mg',
              dosage: '40mg Tablet',
              frequency: '1-0-0 (Morning after food)',
              duration: '30 Days',
              instructions: 'Do not skip dose. Measure BP once weekly.',
            },
            {
              medicineName: 'Pantoprazole 40mg',
              dosage: '40mg Capsule',
              frequency: '1-0-0 (Before food)',
              duration: '14 Days',
              instructions: 'Take 30 minutes before morning breakfast.',
            },
            {
              medicineName: 'Paracetamol 650mg',
              dosage: '650mg Tablet',
              frequency: 'SOS (As needed for pain/headache)',
              duration: '5 Days',
              instructions: 'Maintain minimum 6 hours gap between tablets. Maximum 3 tablets daily.',
            },
          ],
          doctorNotes: 'Limit sodium and salt consumption. Engage in 30 minutes of aerobic walking daily.',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
      localStorage.setItem(PRESCRIPTIONS_KEY, JSON.stringify(seedPrescriptions));
    }

    // 8. VITALS (Linked to PAT-0001)
    if (!isSeedV6 || !localStorage.getItem(VITALS_KEY)) {
      const seedVitals: PatientVitals[] = [
        {
          id: 'VIT-001',
          patientId: 'PAT-0001',
          recordedAt: new Date(Date.now() - 1800000).toISOString(),
          recordedBy: 'Nurse Deepa V',
          bpSystolic: 128,
          bpDiastolic: 82,
          pulse: 78,
          spo2: 98,
          temperature: 99.1,
          respiratoryRate: 18,
          bloodSugar: 115,
          notes: 'Patient alert. Complains of intermittent stomach ache.',
        },
      ];
      localStorage.setItem(VITALS_KEY, JSON.stringify(seedVitals));
    }

    // 9. LAB SAMPLES (Linked to PAT-0001 & LAB-0001)
    if (!isSeedV6 || !localStorage.getItem(LAB_SAMPLES_KEY)) {
      const seedSamples: LabSample[] = [
        {
          sampleId: 'SMP-88321',
          patientId: 'PAT-0001',
          patientName: 'Kavitha Raman',
          testName: 'Complete Blood Count (CBC) & Serum Electrolytes',
          sampleType: 'Blood',
          department: 'Hematology',
          status: 'COMPLETED',
          receivedAt: new Date(Date.now() - 7200000).toISOString(),
          completedAt: new Date(Date.now() - 1800000).toISOString(),
          technicianName: 'Suresh K (Lab Tech)',
          summaryFindings: 'Hemoglobin 10.8 g/dL (Mild low), WBC 11,800/mcL (Mild high)',
        },
        {
          sampleId: 'SMP-99102',
          patientId: 'PAT-0002',
          patientName: 'Rajesh Sharma',
          testName: 'Fasting Blood Sugar (FBS) & HbA1c Glycated Hemoglobin',
          sampleType: 'Blood',
          department: 'Biochemistry',
          status: 'COMPLETED',
          receivedAt: new Date(Date.now() - 14400000).toISOString(),
          completedAt: new Date(Date.now() - 7200000).toISOString(),
          technicianName: 'Suresh K (Lab Tech)',
          summaryFindings: 'Fasting Glucose 142 mg/dL (Elevated), HbA1c 7.4% (Diabetic Range)',
        },
      ];
      localStorage.setItem(LAB_SAMPLES_KEY, JSON.stringify(seedSamples));
    }

    // 10. MEDICAL REPORTS DATABASE (Linked to PAT-0001 & PAT-0002)
    if (!isSeedV6 || !localStorage.getItem('aihc_medical_reports_db')) {
      const seedReports: MedicalReport[] = [
        {
          id: 'REP-88210',
          patientId: 'PAT-0001',
          reportTitle: 'Complete Blood Count (CBC) Diagnostic Panel',
          reportDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          fileType: 'PDF',
          originalFileUrl: '#',
          fileSizeBytes: 142050,
          uploadedAt: new Date(Date.now() - 7200000).toISOString(),
          ocrStatus: 'COMPLETED',
          extractedParameters: [
            { parameterName: 'Hemoglobin', measuredValue: '10.8', unit: 'g/dL', referenceRange: '12.0 - 15.5', isAbnormal: true, severity: 'LOW' },
            { parameterName: 'Total WBC Count', measuredValue: '11800', unit: '/mcL', referenceRange: '4,000 - 11,000', isAbnormal: true, severity: 'HIGH' },
            { parameterName: 'Platelets', measuredValue: '280000', unit: '/mcL', referenceRange: '150,000 - 450,000', isAbnormal: false, severity: 'NORMAL' },
            { parameterName: 'Serum Sodium', measuredValue: '139', unit: 'mmol/L', referenceRange: '135 - 145', isAbnormal: false, severity: 'NORMAL' },
            { parameterName: 'Serum Potassium', measuredValue: '4.2', unit: 'mmol/L', referenceRange: '3.5 - 5.0', isAbnormal: false, severity: 'NORMAL' },
          ],
          criticalFindings: [
            'Mild anemia (Hemoglobin 10.8 g/dL)',
            'Mild leukocytosis (WBC 11,800/mcL, possible localized inflammation)',
          ],
          doctorVerificationStatus: 'VERIFIED',
          verifiedByDoctorName: 'Dr. B. Ramanathan (BAMS)',
          verifiedAt: new Date(Date.now() - 1800000).toISOString(),
          disclaimer: 'AI-generated summary. Doctor verification confirmed. Original document preserved.',
          aiSummary: {
            en: 'Analysis of CBC Panel: Detected mild low Hemoglobin (10.8 g/dL) and elevated White Blood Cell count (11,800/mcL). Electrolytes normal.',
            ta: 'ரத்தப் பரிசோதனை அறிக்கை: ஹீமோகுளோபின் அளவு குறைவாகவும் (10.8 g/dL), வெள்ளை ரத்த அணுக்கள் சற்று அதிகமாகவும் உள்ளன.',
            hi: 'सीबीसी रिपोर्ट विश्लेषण: हीमोग्लोबिन 10.8 g/dL थोड़ा कम है और डब्ल्यूबीसी 11,800/mcL अधिक है। इलेक्ट्रोलाइट्स सामान्य हैं।',
          },
        },
        {
          id: 'REP-77192',
          patientId: 'PAT-0002',
          reportTitle: 'Fasting Blood Sugar & Glycated Hemoglobin (HbA1c)',
          reportDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          fileType: 'PDF',
          originalFileUrl: '#',
          fileSizeBytes: 98320,
          uploadedAt: new Date(Date.now() - 10800000).toISOString(),
          ocrStatus: 'COMPLETED',
          extractedParameters: [
            { parameterName: 'Fasting Blood Glucose', measuredValue: '142', unit: 'mg/dL', referenceRange: '70 - 100', isAbnormal: true, severity: 'HIGH' },
            { parameterName: 'HbA1c', measuredValue: '7.4', unit: '%', referenceRange: '< 5.7', isAbnormal: true, severity: 'HIGH' },
          ],
          criticalFindings: [
            'Fasting Glucose 142 mg/dL (Elevated)',
            'HbA1c 7.4% (Sub-optimal glycemic control)',
          ],
          doctorVerificationStatus: 'UNVERIFIED',
          disclaimer: 'AI-generated summary. Attending physician verification required.',
          aiSummary: {
            en: 'Diabetic Profile: Fasting blood glucose is 142 mg/dL (high) and HbA1c is 7.4% indicating moderate diabetic dysregulation.',
            ta: 'நீரிழிவு அறிக்கை: ரத்த சர்க்கரை அளவு 142 mg/dL மற்றும் HbA1c 7.4% அதிகமாக உள்ளது.',
            hi: 'मधुमेह रिपोर्ट: फास्टिंग ब्लड शुगर 142 mg/dL और HbA1c 7.4% है, जो मधुमेह वृद्धि दर्शाता है।',
          },
        },
      ];
      localStorage.setItem('aihc_medical_reports_db', JSON.stringify(seedReports));
    }

    // 10B. AI PRE-CONSULTATION SUMMARIES (With Detected Serious Condition for PAT-0001)
    if (!isSeedV6 || !localStorage.getItem(AI_SUMMARIES_KEY)) {
      const seedAISummaries: AIConsultationSummary[] = [
        {
          id: 'SUM-PAT-0001',
          patientId: 'PAT-0001',
          appointmentId: 'APT-102',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          medicineSystem: 'ALLOPATHY_HOMEOPATHY',
          hospitalName: 'AIHC Multi-Speciality Hospital',
          doctorName: 'Dr. A. Sundaram (MD)',
          doctorRoom: 'OPD-102',
          chiefComplaint: 'Acute chest tightness & radiating discomfort to left arm with breathlessness',
          symptomsList: [
            'Chest pain: Severe crushing retrosternal pressure',
            'Radiation: Left shoulder and arm',
            'Associated: Shortness of breath, mild cold sweating',
            'Pain score: 9/10 (Severe)',
          ],
          duration: '2 hours',
          severity: 9,
          bodyLocations: ['Chest (Center)', 'Shoulder (Left)'],
          associatedSymptoms: ['Shortness of breath', 'Diaphoresis'],
          detectedRedFlags: ['CRITICAL: Acute Chest Discomfort / Suspected Cardiac Event'],
          recommendedTriage: 'EMERGENCY',
          confidenceScore: 0.98,
          disclaimer:
            'IMPORTANT CLINICAL NOTICE: AI-generated pre-consultation summary. Critical emergency condition flagged.',
        },
      ];
      localStorage.setItem(AI_SUMMARIES_KEY, JSON.stringify(seedAISummaries));
    }

    // 11. EMERGENCY ALERTS
    if (!isSeedV6 || !localStorage.getItem('aihc_emergency_alerts_db')) {
      const seedAlerts: EmergencyAlert[] = [
        {
          id: 'ALT-101',
          patientId: 'PAT-0001',
          patientName: 'Kavitha Raman',
          symptomSummary: 'CRITICAL: Acute Chest Discomfort / Suspected Cardiac Event',
          detectedAt: new Date(Date.now() - 3600000).toISOString(),
          triageLevel: 'EMERGENCY',
          status: 'ACTIVE',
          vitalsAlert: 'Heart rate elevated to 98 bpm, acute retrosternal chest pressure reported',
        },
      ];
      localStorage.setItem('aihc_emergency_alerts_db', JSON.stringify(seedAlerts));
      localStorage.setItem('aihc_active_emergencies', JSON.stringify(seedAlerts));
    }

    // 12. CONSULTATION SESSIONS
    if (!isSeedV6 || !localStorage.getItem(CONSULTATION_SESSIONS_KEY)) {
      const seedSessions: ConsultationSession[] = [
        {
          sessionId: 'SES-1001-ACTIVE',
          consultationId: 'CON-1001',
          appointmentId: 'APT-101',
          patientId: 'PAT-0001',
          doctorId: 'DOC-0003',
          doctorName: 'Dr. B. Ramanathan (BAMS)',
          status: 'ACTIVE',
          startedAt: new Date(Date.now() - 1800000).toISOString(),
          notes: 'Active Ayurvedic consultation in progress for acute gastric burning and indigestion.',
        },
        {
          sessionId: 'SES-1002-ACTIVE',
          consultationId: 'CON-1002',
          appointmentId: 'APT-102',
          patientId: 'PAT-0001',
          doctorId: 'DOC-0001',
          doctorName: 'Dr. A. Sundaram (MD)',
          status: 'ACTIVE',
          startedAt: new Date(Date.now() - 3600000).toISOString(),
          notes: 'General Medicine consultation scheduled for routine follow-up.',
        },
        {
          sessionId: 'SES-1003-COMPLETED',
          consultationId: 'CON-1000',
          appointmentId: 'APT-100-PAST',
          patientId: 'PAT-0001',
          doctorId: 'DOC-0002',
          doctorName: 'Dr. Priya Natarajan (DM)',
          status: 'COMPLETED',
          startedAt: new Date(Date.now() - 86400000).toISOString(),
          completedAt: new Date(Date.now() - 82800000).toISOString(),
          notes: 'Cardiology review completed. Clinical access revoked upon consultation sign-off.',
        },
      ];
      localStorage.setItem(CONSULTATION_SESSIONS_KEY, JSON.stringify(seedSessions));
    }

    // 13. MEDICINE REMINDERS & ADHERENCE LOGS (PAT-0001)
    if (!isSeedV6 || !localStorage.getItem(MEDICINE_REMINDERS_KEY)) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      const seedReminders: MedicineReminder[] = [
        {
          reminderId: 'REM-88210-01',
          patientId: 'PAT-0001',
          prescriptionId: 'RX-88210',
          medicineName: 'Ashwagandha Churna 500mg',
          dosage: '1 tsp (3g)',
          frequency: 'Twice daily',
          duration: '30 days',
          startDate: yesterday,
          reminderTimes: ['08:00 AM', '08:00 PM'],
          instructions: 'Take after meals with warm milk or warm water.',
          status: 'ACTIVE',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          adherenceLogs: [
            {
              logId: 'ADH-001',
              date: today,
              time: '08:00 AM',
              status: 'TAKEN',
              loggedAt: new Date(Date.now() - 7200000).toISOString(),
              notes: 'Taken on time after breakfast.',
            },
            {
              logId: 'ADH-002',
              date: yesterday,
              time: '08:00 PM',
              status: 'TAKEN',
              loggedAt: new Date(Date.now() - 50400000).toISOString(),
              notes: 'Taken after dinner.',
            },
            {
              logId: 'ADH-003',
              date: yesterday,
              time: '08:00 AM',
              status: 'TAKEN',
              loggedAt: new Date(Date.now() - 93600000).toISOString(),
            },
          ],
        },
        {
          reminderId: 'REM-88210-02',
          patientId: 'PAT-0001',
          prescriptionId: 'RX-88210',
          medicineName: 'Tab. Amoxicillin 500mg',
          dosage: '500 mg',
          frequency: 'Three times daily',
          duration: '5 days',
          startDate: today,
          reminderTimes: ['08:00 AM', '02:00 PM', '08:00 PM'],
          instructions: 'Complete the entire course. Take after food.',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          adherenceLogs: [
            {
              logId: 'ADH-004',
              date: today,
              time: '08:00 AM',
              status: 'TAKEN',
              loggedAt: new Date(Date.now() - 7000000).toISOString(),
              notes: 'Taken after breakfast.',
            },
          ],
        },
        {
          reminderId: 'REM-88210-03',
          patientId: 'PAT-0001',
          prescriptionId: 'RX-88210',
          medicineName: 'Triphala Kwath 30ml',
          dosage: '30 ml',
          frequency: 'Once daily at bedtime',
          duration: '15 days',
          startDate: yesterday,
          reminderTimes: ['09:30 PM'],
          instructions: 'Mix with half a cup of warm water at bedtime.',
          status: 'ACTIVE',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          adherenceLogs: [
            {
              logId: 'ADH-005',
              date: yesterday,
              time: '09:30 PM',
              status: 'SNOOZED',
              loggedAt: new Date(Date.now() - 46000000).toISOString(),
              notes: 'Snoozed 10 mins, then consumed.',
            },
            {
              logId: 'ADH-006',
              date: yesterday,
              time: '09:40 PM',
              status: 'TAKEN',
              loggedAt: new Date(Date.now() - 45400000).toISOString(),
            },
          ],
        },
      ];
      localStorage.setItem(MEDICINE_REMINDERS_KEY, JSON.stringify(seedReminders));
    }

    // Mark seed version key complete
    localStorage.setItem(SEED_VERSION_KEY, 'true');
  }
}

export const storageService = new StorageService();
