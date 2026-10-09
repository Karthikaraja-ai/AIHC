// Universal Cross-Role Notification & Intimation Service
// Intimates completion of work for every person (Patient, Doctor, Nurse, Lab Technician)

import { UserRole, TriageLevel } from '../types';
import { voiceService } from './voiceService';

export interface Intimation {
  id: string;
  recipientRole: UserRole | 'ALL';
  recipientId?: string;
  title: string;
  message: string;
  timestamp: string;
  workType: 
    | 'AI_PRE_CONSULTATION_COMPLETED'
    | 'VITALS_RECORDED'
    | 'LAB_REPORT_COMPLETED'
    | 'DOCTOR_CONSULTATION_SIGNED'
    | 'APPOINTMENT_BOOKED';
  isRead: boolean;
  priority: 'HIGH' | 'NORMAL' | 'URGENT';
}

const NOTIFICATIONS_KEY = 'aihc_system_notifications';

class NotificationService {
  public getAllNotifications(): Intimation[] {
    try {
      const raw = localStorage.getItem(NOTIFICATIONS_KEY);
      return raw ? JSON.parse(raw) : this.getDefaultSeedNotifications();
    } catch (e) {
      return this.getDefaultSeedNotifications();
    }
  }

  public getNotificationsForUser(role: UserRole, identifier?: string): Intimation[] {
    const all = this.getAllNotifications();
    return all.filter(n => {
      if (n.recipientRole === 'ALL') return true;
      if (n.recipientRole !== role) return false;
      if (n.recipientId && identifier && n.recipientId !== identifier) return false;
      return true;
    });
  }

  public addIntimation(intimation: Omit<Intimation, 'id' | 'timestamp' | 'isRead'>): Intimation {
    const newEntry: Intimation = {
      id: `NTF-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      isRead: false,
      ...intimation,
    };

    const current = this.getAllNotifications();
    current.unshift(newEntry);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(current.slice(0, 100)));

    // Emit browser custom event for real-time reactivity
    window.dispatchEvent(new CustomEvent('aihc_new_intimation', { detail: newEntry }));

    return newEntry;
  }

  public markAsRead(id: string): void {
    const all = this.getAllNotifications();
    const item = all.find(n => n.id === id);
    if (item) {
      item.isRead = true;
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
      window.dispatchEvent(new CustomEvent('aihc_notifications_updated'));
    }
  }

  public markAllAsReadForRole(role: UserRole): void {
    const all = this.getAllNotifications();
    all.forEach(n => {
      if (n.recipientRole === role || n.recipientRole === 'ALL') {
        n.isRead = true;
      }
    });
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('aihc_notifications_updated'));
  }

  // 1. INTIMATION: AI Pre-Consultation Completed
  public intimatePreConsultationCompleted(params: {
    patientId: string;
    patientName: string;
    doctorName?: string;
    triageLevel: TriageLevel;
    medicineSystem?: string;
  }) {
    // Intimate Patient
    this.addIntimation({
      recipientRole: 'PATIENT',
      recipientId: params.patientId,
      title: 'AI Pre-Consultation Completed ✅',
      message: `Your clinical case summary has been sent to ${params.doctorName || 'your consulting doctor'} and Nurse Station.`,
      workType: 'AI_PRE_CONSULTATION_COMPLETED',
      priority: 'NORMAL',
    });

    // Intimate Doctor
    this.addIntimation({
      recipientRole: 'DOCTOR',
      title: `New Case Ready: ${params.patientName} (${params.patientId})`,
      message: `AI pre-consultation completed [${params.triageLevel} priority]. Case summary & body map ready for doctor review.`,
      workType: 'AI_PRE_CONSULTATION_COMPLETED',
      priority: params.triageLevel === 'EMERGENCY' ? 'URGENT' : 'NORMAL',
    });

    // Intimate Nurse
    this.addIntimation({
      recipientRole: 'NURSE',
      title: `Patient Checked In: ${params.patientName}`,
      message: `Pre-consultation completed. Ready for pre-OPD vitals recording at Nurse Station.`,
      workType: 'AI_PRE_CONSULTATION_COMPLETED',
      priority: params.triageLevel === 'EMERGENCY' ? 'URGENT' : 'NORMAL',
    });
  }

  // 2. INTIMATION: Vitals Recorded by Nurse
  public intimateVitalsRecorded(params: {
    patientId: string;
    patientName: string;
    nurseName: string;
    bpText: string;
    spo2Text: string;
  }) {
    // Intimate Nurse
    this.addIntimation({
      recipientRole: 'NURSE',
      title: 'Vitals Recorded Successfully ✅',
      message: `Clinical vitals logged for ${params.patientName} (${params.patientId}): BP ${params.bpText}, SpO2 ${params.spo2Text}.`,
      workType: 'VITALS_RECORDED',
      priority: 'NORMAL',
    });

    // Intimate Doctor
    this.addIntimation({
      recipientRole: 'DOCTOR',
      title: `Vitals Updated: ${params.patientName}`,
      message: `${params.nurseName} has recorded patient vitals (BP ${params.bpText}, SpO2 ${params.spo2Text}).`,
      workType: 'VITALS_RECORDED',
      priority: 'NORMAL',
    });

    // Intimate Patient
    this.addIntimation({
      recipientRole: 'PATIENT',
      recipientId: params.patientId,
      title: 'Nursing Vitals Recorded ✅',
      message: `${params.nurseName} recorded your vitals (BP: ${params.bpText}, SpO2: ${params.spo2Text}). Added to your Health Records.`,
      workType: 'VITALS_RECORDED',
      priority: 'NORMAL',
    });
  }

  // 3. INTIMATION: Lab Report Completed by Lab Tech
  public intimateLabReportCompleted(params: {
    patientId: string;
    patientName: string;
    testName: string;
    techName: string;
  }) {
    // Intimate Lab Tech
    this.addIntimation({
      recipientRole: 'LAB_TECHNICIAN',
      title: 'Report Uploaded & Verified ✅',
      message: `Diagnostic test report for ${params.patientName} (${params.testName}) completed and verified.`,
      workType: 'LAB_REPORT_COMPLETED',
      priority: 'NORMAL',
    });

    // Intimate Doctor
    this.addIntimation({
      recipientRole: 'DOCTOR',
      title: `Lab Report Ready: ${params.patientName}`,
      message: `${params.testName} report uploaded by ${params.techName}. OCR parameter extraction available.`,
      workType: 'LAB_REPORT_COMPLETED',
      priority: 'NORMAL',
    });

    // Intimate Patient
    this.addIntimation({
      recipientRole: 'PATIENT',
      recipientId: params.patientId,
      title: 'Medical Report Available ✅',
      message: `Your test report for "${params.testName}" is now available in your Medical Reports section.`,
      workType: 'LAB_REPORT_COMPLETED',
      priority: 'NORMAL',
    });
  }

  // 4. INTIMATION: Doctor Consultation Signed Off
  public intimateConsultationSigned(params: {
    patientId: string;
    patientName: string;
    doctorName: string;
  }) {
    // Intimate Doctor
    this.addIntimation({
      recipientRole: 'DOCTOR',
      title: 'Consultation Signed Off ✅',
      message: `Case records, diagnosis notes, and e-prescription locked for ${params.patientName}.`,
      workType: 'DOCTOR_CONSULTATION_SIGNED',
      priority: 'NORMAL',
    });

    // Intimate Patient
    this.addIntimation({
      recipientRole: 'PATIENT',
      recipientId: params.patientId,
      title: 'Doctor Consultation Completed ✅',
      message: `${params.doctorName} has completed your consultation. Your medical advice and prescription are in Consultation History.`,
      workType: 'DOCTOR_CONSULTATION_SIGNED',
      priority: 'HIGH',
    });

    // Intimate Nurse
    this.addIntimation({
      recipientRole: 'NURSE',
      title: `Patient Discharged / Completed: ${params.patientName}`,
      message: `Consultation concluded by ${params.doctorName}. Patient advised on medications.`,
      workType: 'DOCTOR_CONSULTATION_SIGNED',
      priority: 'NORMAL',
    });
  }

  private getDefaultSeedNotifications(): Intimation[] {
    return [
      {
        id: 'NTF-SEED-1',
        recipientRole: 'DOCTOR',
        title: 'New Case Ready: Kavitha Raman (AIHC-7X9P26)',
        message: 'AI pre-consultation completed [URGENT priority]. Case summary & body map ready for doctor review.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        workType: 'AI_PRE_CONSULTATION_COMPLETED',
        isRead: false,
        priority: 'HIGH',
      },
      {
        id: 'NTF-SEED-2',
        recipientRole: 'PATIENT',
        recipientId: 'AIHC-7X9P26',
        title: 'Appointment Confirmed ✅',
        message: 'Your OPD appointment with Dr. A. Sundaram (MD) is scheduled for today at 10:30 AM.',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        workType: 'APPOINTMENT_BOOKED',
        isRead: false,
        priority: 'NORMAL',
      },
      {
        id: 'NTF-SEED-3',
        recipientRole: 'NURSE',
        title: 'Patient Checked In: Kavitha Raman',
        message: 'Pre-consultation completed. Ready for pre-OPD vitals recording at Nurse Station.',
        timestamp: new Date(Date.now() - 3500000).toISOString(),
        workType: 'AI_PRE_CONSULTATION_COMPLETED',
        isRead: false,
        priority: 'NORMAL',
      },
      {
        id: 'NTF-SEED-4',
        recipientRole: 'LAB_TECHNICIAN',
        title: 'New Diagnostic Request',
        message: 'Blood sample received for Complete Blood Count (CBC) - AIHC-7X9P26.',
        timestamp: new Date(Date.now() - 7100000).toISOString(),
        workType: 'APPOINTMENT_BOOKED',
        isRead: false,
        priority: 'NORMAL',
      },
    ];
  }
}

export const notificationService = new NotificationService();
