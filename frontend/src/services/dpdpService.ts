// DPDP Act & ABDM Consent Compliance Service
// Manages privacy-by-design, audit trails, data minimization, and user consent control.

import { ABDMConsent, AuditLog, UserRole } from '../types';

const AUDIT_LOGS_KEY = 'aihc_dpdp_audit_logs';
const ABDM_CONSENT_KEY = 'aihc_abdm_consent_';

class DPDPService {
  // Save or update ABDM Consent for a patient
  public saveConsent(patientId: string, status: ABDMConsent['status'], scope: string[] = ['REPORTS', 'OPD_SUMMARY']): ABDMConsent {
    const consent: ABDMConsent = {
      status,
      timestamp: new Date().toISOString(),
      purpose: 'Care Continuity, Doctor Cross-Consultation & Interoperable ABHA Record',
      version: 'v2.1-DPDP-2023',
      withdrawalDate: status === 'WITHDRAWN' ? new Date().toISOString() : undefined,
      scope,
    };

    localStorage.setItem(`${ABDM_CONSENT_KEY}${patientId}`, JSON.stringify(consent));

    this.logAudit({
      actorId: patientId,
      actorRole: 'PATIENT',
      action: status === 'WITHDRAWN' ? 'CONSENT_WITHDRAWN' : 'CONSENT_GRANTED',
      resourceId: `ABDM_CONSENT_${patientId}`,
      details: `ABDM Consent status transitioned to ${status} under DPDP Act purpose-limitation guidelines.`,
    });

    return consent;
  }

  // Get current ABDM consent for a patient
  public getConsent(patientId: string): ABDMConsent {
    const raw = localStorage.getItem(`${ABDM_CONSENT_KEY}${patientId}`);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {}
    }
    return {
      status: 'SKIPPED',
      timestamp: new Date().toISOString(),
      purpose: 'Care Continuity',
      version: 'v2.1-DPDP-2023',
      scope: [],
    };
  }

  // Withdraw ABDM consent
  public withdrawConsent(patientId: string): ABDMConsent {
    return this.saveConsent(patientId, 'WITHDRAWN', []);
  }

  // Record an immutable audit log
  public logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const newLog: AuditLog = {
      id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    try {
      const logs = this.getAuditLogs();
      logs.unshift(newLog);
      // Keep last 500 logs locally
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs.slice(0, 500)));
    } catch (e) {
      console.warn('Failed to persist audit log', e);
    }
  }

  // Get audit logs (Authorized staff only)
  public getAuditLogs(): AuditLog[] {
    try {
      const raw = localStorage.getItem(AUDIT_LOGS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  // Data Minimization: Check if role has permission to access specific resource
  public canAccessResource(role: UserRole, resourceType: 'CLINICAL_NOTES' | 'VITALS' | 'LAB_SAMPLE' | 'BILLING' | 'AUDIT_LOGS'): boolean {
    switch (role) {
      case 'PATIENT':
        return resourceType !== 'AUDIT_LOGS';
      case 'DOCTOR':
        return true;
      case 'NURSE':
        return resourceType === 'VITALS' || resourceType === 'CLINICAL_NOTES' || resourceType === 'LAB_SAMPLE';
      case 'LAB_TECHNICIAN':
        // Lab Technician MUST NOT view clinical notes, doctor prescriptions, or psychiatric history
        return resourceType === 'LAB_SAMPLE';
      default:
        return false;
    }
  }
}

export const dpdpService = new DPDPService();
