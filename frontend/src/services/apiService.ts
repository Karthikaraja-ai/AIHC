// REST API Service for FastAPI Backend Communication
// Target Tech Stack: FastAPI (Python) + PostgreSQL / SQLite fallback + REST APIs

import {
  User,
  PatientProfile,
  Appointment,
  PatientVitals,
  LabSample,
  NurseAssignment,
  Prescription,
  MedicineReminder,
  EmergencyAlert,
  AuditLog,
} from '../types';
import {
  AIConsultationSummary,
  AIQuestion,
  BodyMapSelection,
  PreConsultationQuestionResponse,
  PreConsultationSessionResponse
} from '../types/ai';
import { MedicalReport } from '../types/ocr';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1';
const TOKEN_KEY = 'aihc_access_token';

class ApiService {
  private baseUrl: string = API_BASE_URL;

  private getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  public setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  public removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    // Don't set Content-Type for FormData uploads (browser sets multipart/form-data boundary automatically)
    if (!(options.body instanceof FormData)) {
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    }

    const token = this.getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status} ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorMsg = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
        }
      } catch (e) {
        // use default errorMsg
      }
      throw new Error(errorMsg);
    }

    return response.json() as Promise<T>;
  }

  // =========================================================================
  // 1. AUTHENTICATION & SESSION
  // =========================================================================
  public async login(uniqueId: string, password: string): Promise<{ access_token: string; token_type: string; user: User }> {
    const data = await this.request<{ access_token: string; token_type: string; user: User }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ uniqueId, password }),
      }
    );
    if (data.access_token) {
      this.setToken(data.access_token);
    }
    return data;
  }

  public async register(payload: any): Promise<{ access_token: string; token_type: string; user: User }> {
    const data = await this.request<{ access_token: string; token_type: string; user: User }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    if (data.access_token) {
      this.setToken(data.access_token);
    }
    return data;
  }

  public async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  public logout() {
    this.removeToken();
  }

  // =========================================================================
  // 2. PATIENTS & PROFILES
  // =========================================================================
  public async getAllPatients(): Promise<PatientProfile[]> {
    return this.request<PatientProfile[]>('/patients');
  }

  public async getPatient(patientId: string): Promise<PatientProfile> {
    return this.request<PatientProfile>(`/patients/${patientId}`);
  }

  public async updatePatient(patientId: string, update: Partial<PatientProfile>): Promise<PatientProfile> {
    return this.request<PatientProfile>(`/patients/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify(update),
    });
  }

  // =========================================================================
  // 3. APPOINTMENTS & CONSULTATION WORKFLOW
  // =========================================================================
  public async getAppointments(params?: { patient_id?: string; doctor_id?: string }): Promise<Appointment[]> {
    const query = new URLSearchParams();
    if (params?.patient_id) query.set('patient_id', params.patient_id);
    if (params?.doctor_id) query.set('doctor_id', params.doctor_id);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<Appointment[]>(`/appointments${qs}`);
  }

  public async createAppointment(appointment: Partial<Appointment>): Promise<Appointment> {
    return this.request<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointment),
    });
  }

  public async updateAppointment(appointmentId: string, update: Partial<Appointment>): Promise<Appointment> {
    return this.request<Appointment>(`/appointments/${appointmentId}`, {
      method: 'PUT',
      body: JSON.stringify(update),
    });
  }

  // Reverses the 4-step consultation flow back to initial state
  public async resetAppointmentCycle(appointmentId: string): Promise<Appointment> {
    return this.request<Appointment>(`/appointments/${appointmentId}/reset-cycle`, {
      method: 'POST',
    });
  }

  // =========================================================================
  // 4. DOCTORS DIRECTORY & QUEUE
  // =========================================================================
  public async getDoctors(): Promise<User[]> {
    return this.request<User[]>('/doctors');
  }

  public async getDoctor(doctorId: string): Promise<User> {
    return this.request<User>(`/doctors/${doctorId}`);
  }

  public async getDoctorQueue(doctorId: string): Promise<Appointment[]> {
    return this.request<Appointment[]>(`/doctors/${doctorId}/queue`);
  }

  // =========================================================================
  // 5. NURSES & CLINICAL VITALS
  // =========================================================================
  public async getPatientVitals(patientId: string): Promise<PatientVitals[]> {
    return this.request<PatientVitals[]>(`/nurses/vitals/${patientId}`);
  }

  public async recordVitals(vitals: Partial<PatientVitals>): Promise<PatientVitals> {
    return this.request<PatientVitals>('/nurses/vitals', {
      method: 'POST',
      body: JSON.stringify(vitals),
    });
  }

  public async getNurseAssignments(nurseId: string): Promise<NurseAssignment[]> {
    return this.request<NurseAssignment[]>(`/nurses/assignments/${nurseId}`);
  }

  public async createNurseAssignment(assignment: Partial<NurseAssignment>): Promise<NurseAssignment> {
    return this.request<NurseAssignment>('/nurses/assignments', {
      method: 'POST',
      body: JSON.stringify(assignment),
    });
  }

  // =========================================================================
  // 6. LAB TECHNICIANS & SAMPLES
  // =========================================================================
  public async getLabSamples(params?: { patient_id?: string; status?: string }): Promise<LabSample[]> {
    const query = new URLSearchParams();
    if (params?.patient_id) query.set('patient_id', params.patient_id);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<LabSample[]>(`/lab/samples${qs}`);
  }

  public async registerLabSample(sample: Partial<LabSample>): Promise<LabSample> {
    return this.request<LabSample>('/lab/samples', {
      method: 'POST',
      body: JSON.stringify(sample),
    });
  }

  public async updateLabSample(sampleId: string, update: Partial<LabSample>): Promise<LabSample> {
    return this.request<LabSample>(`/lab/samples/${sampleId}`, {
      method: 'PUT',
      body: JSON.stringify(update),
    });
  }

  // =========================================================================
  // 7. PRESCRIPTIONS
  // =========================================================================
  public async getPrescriptions(params?: { patient_id?: string; doctor_id?: string }): Promise<Prescription[]> {
    const query = new URLSearchParams();
    if (params?.patient_id) query.set('patient_id', params.patient_id);
    if (params?.doctor_id) query.set('doctor_id', params.doctor_id);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<Prescription[]>(`/prescriptions${qs}`);
  }

  public async createPrescription(rx: Partial<Prescription>): Promise<Prescription> {
    return this.request<Prescription>('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(rx),
    });
  }

  // =========================================================================
  // 8. MEDICINE REMINDERS & ADHERENCE
  // =========================================================================
  public async getReminders(patientId?: string): Promise<MedicineReminder[]> {
    const qs = patientId ? `?patient_id=${patientId}` : '';
    return this.request<MedicineReminder[]>(`/reminders${qs}`);
  }

  public async createReminder(reminder: Partial<MedicineReminder>): Promise<MedicineReminder> {
    return this.request<MedicineReminder>('/reminders', {
      method: 'POST',
      body: JSON.stringify(reminder),
    });
  }

  public async updateReminderStatus(reminderId: string, status: 'ACTIVE' | 'PAUSED' | 'COMPLETED'): Promise<MedicineReminder> {
    return this.request<MedicineReminder>(`/reminders/${reminderId}/status?status=${status}`, {
      method: 'PUT',
    });
  }

  public async logReminderAdherence(
    reminderId: string,
    log: { date: string; time: string; status: 'TAKEN' | 'SKIPPED' | 'SNOOZED'; notes?: string }
  ): Promise<MedicineReminder> {
    return this.request<MedicineReminder>(`/reminders/${reminderId}/adherence`, {
      method: 'POST',
      body: JSON.stringify(log),
    });
  }

  public async deleteReminder(reminderId: string): Promise<void> {
    return this.request<void>(`/reminders/${reminderId}`, {
      method: 'DELETE',
    });
  }

  // =========================================================================
  // 9. AI PRE-CONSULTATION ENGINE
  // =========================================================================
  public async getNextAIQuestion(params: {
    patientId: string;
    medicineSystem: string;
    currentQuestionIndex: number;
    answersSoFar: any[];
    bodySelections?: BodyMapSelection[];
  }): Promise<{ nextQuestion: AIQuestion | null; isSufficient: boolean; progressPercent: number }> {
    return this.request<{ nextQuestion: AIQuestion | null; isSufficient: boolean; progressPercent: number }>(
      '/ai/next-question',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
  }

  public async submitAIAnswer(payload: {
    patientId: string;
    consultationId: string;
    medicineSystem: string;
    questionId: string;
    questionCategory: string;
    originalQuestion: string;
    englishQuestion: string;
    tamilQuestion: string;
    hindiQuestion: string;
    patientOriginalResponse: string;
    inputMethod?: string;
  }): Promise<{ success: boolean; qaId: string; structuredInterpretation: any }> {
    return this.request<{ success: boolean; qaId: string; structuredInterpretation: any }>(
      '/ai/submit-answer',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  }

  public async generateAISummary(payload: {
    patientId: string;
    appointmentId?: string;
    medicineSystem: string;
    answers: any[];
    bodySelections?: BodyMapSelection[];
    preferredLanguage?: string;
  }): Promise<AIConsultationSummary> {
    return this.request<AIConsultationSummary>('/ai/generate-summary', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getAISummaries(patientId: string): Promise<AIConsultationSummary[]> {
    return this.request<AIConsultationSummary[]>(`/ai/summaries/${patientId}`);
  }

  // =========================================================================
  // 10. OCR & REPORT SUMMARIZER
  // =========================================================================
  public async uploadReportFile(file: File, patientId: string, uploadedBy: string = 'Patient'): Promise<MedicalReport> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_id', patientId);
    formData.append('uploaded_by', uploadedBy);

    return this.request<MedicalReport>('/ocr/process', {
      method: 'POST',
      body: formData,
    });
  }

  public async getReports(patientId?: string): Promise<MedicalReport[]> {
    const qs = patientId ? `?patient_id=${patientId}` : '';
    return this.request<MedicalReport[]>(`/ocr/reports${qs}`);
  }

  public async getReport(reportId: string): Promise<MedicalReport> {
    return this.request<MedicalReport>(`/ocr/reports/${reportId}`);
  }

  public async verifyReport(
    reportId: string,
    verification: {
      doctorVerificationStatus: string;
      verifiedByDoctorName: string;
      doctorReportedImpression?: string;
      amendedParameters?: any[];
    }
  ): Promise<MedicalReport> {
    return this.request<MedicalReport>(`/ocr/reports/${reportId}/verify`, {
      method: 'PUT',
      body: JSON.stringify(verification),
    });
  }

  public async deleteReport(reportId: string): Promise<void> {
    return this.request<void>(`/ocr/reports/${reportId}`, {
      method: 'DELETE',
    });
  }

  // =========================================================================
  // 11. EMERGENCY ALERTS
  // =========================================================================
  public async getEmergencyAlerts(status?: string): Promise<EmergencyAlert[]> {
    const qs = status ? `?status=${status}` : '';
    return this.request<EmergencyAlert[]>(`/emergency/alerts${qs}`);
  }

  public async triggerEmergency(alert: {
    patientId: string;
    patientName: string;
    symptomSummary: string;
    triageLevel?: string;
    vitalsAlert?: string;
  }): Promise<EmergencyAlert> {
    return this.request<EmergencyAlert>('/emergency/trigger', {
      method: 'POST',
      body: JSON.stringify(alert),
    });
  }

  public async acknowledgeEmergency(alertId: string, acknowledgedBy: string): Promise<EmergencyAlert> {
    return this.request<EmergencyAlert>(`/emergency/alerts/${alertId}/acknowledge`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'ACKNOWLEDGED', acknowledgedBy }),
    });
  }

  // =========================================================================
  // 12. AUDIT LOGS
  // =========================================================================
  public async getAuditLogs(params?: { actor_id?: string; resource_id?: string }): Promise<AuditLog[]> {
    const query = new URLSearchParams();
    if (params?.actor_id) query.set('actor_id', params.actor_id);
    if (params?.resource_id) query.set('resource_id', params.resource_id);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<AuditLog[]>(`/audit/logs${qs}`);
  }

  public async logAudit(log: {
    actorId: string;
    actorRole: string;
    action: string;
    resourceId: string;
    details: string;
  }): Promise<AuditLog> {
    return this.request<AuditLog>('/audit/logs', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  }

  // =========================================================================
  // 13. AYUSH ADAPTIVE PRE-CONSULTATION (1,875 Dataset Powered)
  // =========================================================================
  public async startPreConsultation(payload: {
    patientId: string;
    appointmentId?: string;
    language: string;
    medicalSystem: string;
    chiefComplaint: string;
    age?: number;
    gender?: string;
    severity?: string;
    duration?: string;
    bodySelections?: any[];
  }): Promise<PreConsultationSessionResponse> {
    return this.request<PreConsultationSessionResponse>('/preconsultation/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async answerPreConsultation(payload: {
    sessionId: string;
    questionId: string;
    patientAnswer: string;
    answerCategory?: string;
  }): Promise<PreConsultationSessionResponse> {
    return this.request<PreConsultationSessionResponse>('/preconsultation/answer', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getPreConsultationSession(sessionId: string): Promise<PreConsultationSessionResponse> {
    return this.request<PreConsultationSessionResponse>(`/preconsultation/${sessionId}`);
  }

  public async completePreConsultation(sessionId: string): Promise<PreConsultationSessionResponse> {
    return this.request<PreConsultationSessionResponse>(`/preconsultation/${sessionId}/complete`, {
      method: 'POST',
    });
  }

  public async getAYUSHDatasetStats(): Promise<{
    totalRecords: number;
    targetTotal: number;
    isValid: boolean;
    languages: Record<string, number>;
    medicalSystems: Record<string, number>;
    ayushSystemsList: string[];
  }> {
    return this.request('/preconsultation/dataset/stats');
  }
}

export const apiService = new ApiService();
