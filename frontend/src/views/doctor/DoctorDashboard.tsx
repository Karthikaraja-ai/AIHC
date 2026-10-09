import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEmergency } from '../../context/EmergencyContext';
import { storageService } from '../../services/storageService';
import { ocrService } from '../../services/ocrService';
import { notificationService } from '../../services/notificationService';
import { Appointment, TriageLevel, PatientProfile, Prescription, NurseAssignment, PrescriptionItem } from '../../types';
import { AIConsultationSummary } from '../../types/ai';
import { MedicalReport } from '../../types/ocr';
import { TriageBadge } from '../../components/common/TriageBadge';
import { OCRSummaryCard } from '../../components/ocr/OCRSummaryCard';
import {
  Stethoscope,
  Users,
  Sparkles,
  FileText,
  Clock,
  CheckCircle,
  AlertOctagon,
  Search,
  Filter,
  Eye,
  Check,
  X,
  FilePlus,
  Heart,
  Activity,
  AlertTriangle,
  ShieldAlert,
  UserPlus,
  Pill,
  Plus,
  Trash2,
  Lock,
  ChevronRight,
  ScanLine,
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { activeAlerts } = useEmergency();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [aiSummaries, setAiSummaries] = useState<AIConsultationSummary[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [triageFilter, setTriageFilter] = useState<'ALL' | TriageLevel>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [queueTab, setQueueTab] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');

  // Clickable Dashboard Summary Card Modal State
  const [activeCardModal, setActiveCardModal] = useState<
    'APPOINTMENTS' | 'AI_CONSULTATIONS' | 'EMERGENCY' | 'REPORTS' | null
  >(null);

  // Access Control & Unauthorized Attempt Modal State
  const [accessDeniedError, setAccessDeniedError] = useState<{
    patientId: string;
    reason: string;
  } | null>(null);

  // Case Inspection Modal State
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientProfile, setSelectedPatientProfile] = useState<PatientProfile | null>(null);
  const [activeAISummary, setActiveAISummary] = useState<AIConsultationSummary | null>(null);
  const [patientReports, setPatientReports] = useState<MedicalReport[]>([]);
  const [selectedDoctorReportId, setSelectedDoctorReportId] = useState<string | null>(null);
  const [patientPrescriptions, setPatientPrescriptions] = useState<Prescription[]>([]);
  const [patientNurseAssignments, setPatientNurseAssignments] = useState<NurseAssignment[]>([]);

  // Structured Prescription Form State
  const [diagnosis, setDiagnosis] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [medications, setMedications] = useState<PrescriptionItem[]>([
    { medicineName: '', dosage: '', frequency: '1-0-1', duration: '5 days', instructions: 'After food' },
  ]);
  const [prescriptionSuccessMsg, setPrescriptionSuccessMsg] = useState<string | null>(null);

  // Nurse Assignment Modal State
  const [isAssignNurseOpen, setIsAssignNurseOpen] = useState(false);
  const [selectedNurseId, setSelectedNurseId] = useState('');
  const [nurseCareType, setNurseCareType] = useState<NurseAssignment['careType']>('MONITORING');
  const [nursePriority, setNursePriority] = useState<'NORMAL' | 'URGENT' | 'EMERGENCY'>('NORMAL');
  const [nurseInstructions, setNurseInstructions] = useState('');
  const [assignmentSuccessMsg, setAssignmentSuccessMsg] = useState<string | null>(null);

  // Load Authorized Data
  const refreshData = () => {
    const authAppts = storageService.getAuthorizedAppointments(currentUser);
    const authAi = storageService.getAuthorizedAISummaries(currentUser);
    const authReps = storageService.getAuthorizedReports(currentUser);
    setAppointments(authAppts);
    setAiSummaries(authAi);
    setReports(authReps);
  };

  useEffect(() => {
    refreshData();
  }, [currentUser]);

  // Handle Opening a Patient Case with Strict RBAC Check
  const handleOpenPatientCase = (patientId: string) => {
    const authCheck = storageService.canUserAccessPatientData(currentUser, patientId);

    if (!authCheck.allowed) {
      setAccessDeniedError({
        patientId,
        reason:
          authCheck.reason ||
          `403 Forbidden: You do not have an active authorized clinical appointment with patient ${patientId}.`,
      });
      return;
    }

    // Access authorized -> load full clinical details
    setSelectedPatientId(patientId);
    const profile = storageService.getPatientById(patientId);
    setSelectedPatientProfile(profile || null);
    const summary = storageService.getAISummaryForPatient(patientId) || null;
    setActiveAISummary(summary);
    const rawReps = ocrService.getReportsForPatient(patientId, true);
    // Deduplicate by reportTitle or id to avoid identical report repetitions
    const uniqueReps = Array.from(
      new Map(rawReps.map(r => [(r.reportTitle || r.id).toLowerCase().trim(), r])).values()
    );
    setPatientReports(uniqueReps);
    setSelectedDoctorReportId(uniqueReps.length > 0 ? uniqueReps[0].id : null);
    const rxList = storageService.getPrescriptionsForPatient(patientId);
    setPatientPrescriptions(rxList);
    const assignments = storageService.getNurseAssignmentsForPatient(patientId);
    setPatientNurseAssignments(assignments);

    // Reset forms
    setDiagnosis('');
    setDoctorNotes('');
    setMedications([
      { medicineName: '', dosage: '', frequency: '1-0-1', duration: '5 days', instructions: 'After food' },
    ]);
    setPrescriptionSuccessMsg(null);
  };

  // Add Medication Row
  const handleAddMedicationRow = () => {
    setMedications(prev => [
      ...prev,
      { medicineName: '', dosage: '', frequency: '1-0-1', duration: '5 days', instructions: 'After food' },
    ]);
  };

  // Remove Medication Row
  const handleRemoveMedicationRow = (index: number) => {
    if (medications.length <= 1) return;
    setMedications(prev => prev.filter((_, i) => i !== index));
  };

  // Update Medication Field
  const handleUpdateMedication = (index: number, field: keyof PrescriptionItem, value: string) => {
    setMedications(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Save Structured Prescription
  const handleSavePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    const validMeds = medications.filter(m => m.medicineName.trim() !== '');
    if (validMeds.length === 0) {
      alert('Please enter at least one medication name.');
      return;
    }

    const newRx = storageService.createPrescription({
      patientId: selectedPatientId,
      patientName: selectedPatientProfile ? selectedPatientProfile.fullName : selectedPatientId,
      doctorId: currentUser.staffId || currentUser.id,
      doctorName: currentUser.name,
      department: currentUser.doctorDetails?.department || 'General Medicine',
      diagnosis: diagnosis.trim() || 'General OPD Consultation & Symptom Management',
      medications: validMeds,
      doctorNotes: doctorNotes.trim() || undefined,
    });

    setPatientPrescriptions(prev => [newRx, ...prev]);
    setPrescriptionSuccessMsg(`Prescription #${newRx.id} signed and stored permanently in database.`);

    // Notification
    notificationService.intimateConsultationSigned({
      patientId: selectedPatientId,
      patientName: selectedPatientProfile ? selectedPatientProfile.fullName : selectedPatientId,
      doctorName: currentUser.name,
    });

    // Reset meds form
    setMedications([{ medicineName: '', dosage: '', frequency: '1-0-1', duration: '5 days', instructions: 'After food' }]);
    setTimeout(() => setPrescriptionSuccessMsg(null), 4000);
  };

  // Complete Consultation & Terminate Session (Revoke Clinical Access)
  const handleCompleteConsultation = () => {
    if (!selectedPatientId) return;

    if (
      !window.confirm(
        `Complete Consultation for ${selectedPatientProfile?.fullName || selectedPatientId}?\n\n• The patient consultation will be marked as completed.\n• Patient will be removed from your active consultation queue.\n• All medical history, prescriptions, and reports remain safely preserved.\n• The patient will appear again in your active queue only if they book another appointment.`
      )
    ) {
      return;
    }

    const activeAppts = appointments.filter(
      a => a.patientId === selectedPatientId && a.status !== 'COMPLETED'
    );
    const activeSession = storageService.getActiveConsultationSession(
      currentUser.staffId || currentUser.id,
      selectedPatientId
    );

    // If medications were entered without saving, auto-issue prescription
    const validMeds = medications.filter(m => m.medicineName.trim() !== '');
    if (validMeds.length > 0) {
      storageService.createPrescription({
        patientId: selectedPatientId,
        patientName: selectedPatientProfile ? selectedPatientProfile.fullName : selectedPatientId,
        doctorId: currentUser.staffId || currentUser.id,
        doctorName: currentUser.name,
        department: currentUser.doctorDetails?.department || 'General Medicine',
        appointmentId: activeAppts[0]?.id,
        consultationId: activeSession?.consultationId,
        diagnosis: diagnosis.trim() || 'General Consultation Sign-off',
        medications: validMeds,
        doctorNotes: doctorNotes.trim() || undefined,
      });
    }

    // Terminate session
    if (activeSession) {
      storageService.completeConsultationSession(activeSession.sessionId);
    }

    // Explicitly update all active appointments for this patient to COMPLETED
    if (activeAppts.length > 0) {
      activeAppts.forEach(apt => {
        storageService.updateAppointmentStatus(apt.id, 'COMPLETED');
      });
    } else {
      const storedAppts = storageService.getAppointments();
      storedAppts.forEach(apt => {
        if (apt.patientId === selectedPatientId && apt.status !== 'COMPLETED') {
          storageService.updateAppointmentStatus(apt.id, 'COMPLETED');
        }
      });
    }

    notificationService.intimateConsultationSigned({
      patientId: selectedPatientId,
      patientName: selectedPatientProfile ? selectedPatientProfile.fullName : selectedPatientId,
      doctorName: currentUser.name,
    });

    const finishedPatientId = selectedPatientId;
    setSelectedPatientId(null);
    setSelectedPatientProfile(null);
    refreshData();

    alert(
      `Consultation completed for Patient ${finishedPatientId}.\nThe patient has been removed from your active consultation queue. All records and history are preserved.`
    );
  };

  // Handle Assign Patient to Nurse
  const handleConfirmNurseAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedNurseId) return;

    const allNurses = storageService.getAllNurses();
    const assignedNurse = allNurses.find(n => n.id === selectedNurseId || n.staffId === selectedNurseId);

    const assignment = storageService.createNurseAssignment({
      patientId: selectedPatientId,
      patientName: selectedPatientProfile ? selectedPatientProfile.fullName : selectedPatientId,
      doctorId: currentUser.staffId || currentUser.id,
      doctorName: currentUser.name,
      nurseId: assignedNurse ? (assignedNurse.staffId || assignedNurse.id) : selectedNurseId,
      nurseName: assignedNurse ? assignedNurse.name : 'Duty Nurse',
      instructions: nurseInstructions.trim() || 'Monitor vitals and provide routine nursing care.',
      careType: nurseCareType,
      priority: nursePriority,
    });

    setPatientNurseAssignments(prev => [assignment, ...prev]);
    setIsAssignNurseOpen(false);
    setAssignmentSuccessMsg(`Patient successfully assigned to Nurse ${assignment.nurseName}.`);
    setTimeout(() => setAssignmentSuccessMsg(null), 4000);
  };

  // Filter queue by Active/Completed, Triage and search
  const filteredAppointments = appointments.filter((apt) => {
    const matchesQueue = queueTab === 'ACTIVE' ? apt.status !== 'COMPLETED' : apt.status === 'COMPLETED';
    const matchesTriage = triageFilter === 'ALL' || apt.triagePriority === triageFilter;
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.patientId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesQueue && matchesTriage && matchesSearch;
  });

  // Sort: Emergency first if filtered by ALL
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const priorityWeight: Record<TriageLevel, number> = {
      EMERGENCY: 4,
      URGENT: 3,
      PRIORITY: 2,
      NORMAL: 1,
    };
    return priorityWeight[b.triagePriority] - priorityWeight[a.triagePriority];
  });

  const emergencyAppointments = appointments.filter(a => a.triagePriority === 'EMERGENCY');

  // Collect serious conditions detected by AI Pre-Consultation, Triage, and Active Alerts
  const seriousConditionItems = useMemo(() => {
    const itemsMap = new Map<string, {
      patientId: string;
      patientName: string;
      condition: string;
      severity: string;
      details?: string;
      detectedAt: string;
      appointmentId?: string;
    }>();

    // 1. From AI Pre-Consultation Summaries (Authorized for this doctor)
    aiSummaries.forEach(s => {
      const isSerious =
        s.recommendedTriage === 'EMERGENCY' ||
        (s.detectedRedFlags && s.detectedRedFlags.length > 0) ||
        (s.severity && s.severity >= 8);

      if (isSerious) {
        const pt = storageService.getPatientById(s.patientId);
        const conditionText =
          (s.detectedRedFlags && s.detectedRedFlags[0]) ||
          s.chiefComplaint ||
          'Critical pre-consultation condition detected';

        itemsMap.set(s.patientId, {
          patientId: s.patientId,
          patientName: pt?.fullName || s.patientId,
          condition: conditionText,
          severity: s.recommendedTriage === 'EMERGENCY' ? 'CRITICAL' : 'URGENT',
          details: s.chiefComplaint,
          detectedAt: s.createdAt || new Date().toISOString(),
          appointmentId: s.appointmentId,
        });
      }
    });

    // 2. From Active Emergency Alerts
    activeAlerts.forEach(alt => {
      if (alt.status === 'ACTIVE') {
        const existing = itemsMap.get(alt.patientId);
        itemsMap.set(alt.patientId, {
          patientId: alt.patientId,
          patientName: alt.patientName || existing?.patientName || alt.patientId,
          condition: alt.symptomSummary || existing?.condition || 'Emergency Alert Triggered',
          severity: alt.triageLevel === 'EMERGENCY' ? 'CRITICAL' : 'URGENT',
          details: alt.vitalsAlert || existing?.details,
          detectedAt: alt.detectedAt || new Date().toISOString(),
          appointmentId: existing?.appointmentId,
        });
      }
    });

    // 3. From Emergency Triage Appointments
    emergencyAppointments.forEach(apt => {
      const existing = itemsMap.get(apt.patientId);
      itemsMap.set(apt.patientId, {
        patientId: apt.patientId,
        patientName: apt.patientName || existing?.patientName || apt.patientId,
        condition: existing?.condition || 'Emergency Priority Scheduled',
        severity: 'CRITICAL',
        details: existing?.details || `Scheduled Slot: ${apt.timeSlot}`,
        detectedAt: existing?.detectedAt || apt.bookedAt || new Date().toISOString(),
        appointmentId: apt.id,
      });
    });

    return Array.from(itemsMap.values());
  }, [aiSummaries, activeAlerts, emergencyAppointments]);
  const completedAiAppts = appointments.filter(a => a.preConsultationStatus === 'COMPLETED');
  const allNursesList = storageService.getAllNurses();
  const allSystemAppts = storageService.getAppointments();

  const completedAppts = appointments.filter(a => a.status === 'COMPLETED');
  const cancelledRevokeAppts = completedAppts.filter(
    a => Boolean(a.revokeCancelled || allSystemAppts.some(sa => sa.patientId === a.patientId && sa.status !== 'COMPLETED'))
  );
  const stillRevokedAppts = completedAppts.filter(
    a => !cancelledRevokeAppts.includes(a)
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 animate-fade-in pb-20">
      {/* Doctor Profile Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xl shadow-sm border border-brand-100">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">{currentUser.name}</h2>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Online" />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              ID: <span className="font-mono font-bold text-brand-700">{currentUser.staffId || currentUser.id}</span> • {currentUser.doctorDetails?.specialization} • {currentUser.doctorDetails?.department}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 border border-slate-200">
            OPD Session: 09:00 - 14:00
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Strict RBAC Active</span>
          </span>
        </div>
      </div>

      {assignmentSuccessMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-bold flex items-center gap-2 animate-scale-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{assignmentSuccessMsg}</span>
        </div>
      )}

      {/* 3 DYNAMIC CLICKABLE DASHBOARD SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Today's Appointments */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveCardModal('APPOINTMENTS')}
          onKeyDown={(e) => e.key === 'Enter' && setActiveCardModal('APPOINTMENTS')}
          className="p-5 bg-white hover:bg-brand-50/40 rounded-3xl border border-slate-100 hover:border-brand-200 shadow-sm hover:shadow-md transition-all cursor-pointer group select-none"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-brand-50 group-hover:bg-brand-100 text-brand-600 rounded-2xl transition-colors">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-brand-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              <span>View</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{appointments.length}</span>
            <p className="text-xs text-slate-500 font-medium">Today's Appointments</p>
          </div>
        </div>

        {/* Card 2: AI Consultations Done */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveCardModal('AI_CONSULTATIONS')}
          onKeyDown={(e) => e.key === 'Enter' && setActiveCardModal('AI_CONSULTATIONS')}
          className="p-5 bg-white hover:bg-purple-50/40 rounded-3xl border border-slate-100 hover:border-purple-200 shadow-sm hover:shadow-md transition-all cursor-pointer group select-none"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-purple-50 group-hover:bg-purple-100 text-purple-600 rounded-2xl transition-colors">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-purple-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              <span>View</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{completedAiAppts.length}</span>
            <p className="text-xs text-slate-500 font-medium">AI Consultations Done</p>
          </div>
        </div>

        {/* Card 3: Emergency Flags - Displays AI Pre-Consultation Serious Conditions & Patient Unique ID */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveCardModal('EMERGENCY')}
          onKeyDown={(e) => e.key === 'Enter' && setActiveCardModal('EMERGENCY')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer group select-none ${
            seriousConditionItems.length > 0
              ? 'bg-gradient-to-br from-red-50 via-rose-50/70 to-red-100/50 hover:from-red-100/80 hover:to-rose-100/70 border-red-300 shadow-md ring-2 ring-red-300/70'
              : 'bg-white hover:bg-red-50/30 border-slate-100 hover:border-red-200 shadow-sm hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className={`p-3 rounded-2xl transition-colors ${
                seriousConditionItems.length > 0
                  ? 'bg-red-600 text-white shadow-md shadow-red-500/30'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              <AlertOctagon className={`w-6 h-6 ${seriousConditionItems.length > 0 ? 'animate-pulse' : ''}`} />
            </div>
            <span className="text-[11px] font-bold text-red-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              <span>View</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-red-600">
                {seriousConditionItems.length}
              </span>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                Emergency Flags
              </span>
            </div>

            {/* AI Detected Serious Condition(s) with Patient Unique ID shown directly in this card */}
            {seriousConditionItems.length > 0 ? (
              <div className="mt-3 pt-2.5 border-t border-red-200/80 space-y-2 text-left">
                {seriousConditionItems.slice(0, 2).map((item) => (
                  <div
                    key={item.patientId}
                    className="p-2.5 bg-white/95 rounded-2xl border border-red-200 shadow-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                        <span className="font-mono font-black text-[11px] text-red-950 bg-red-100 px-2 py-0.5 rounded-md border border-red-200">
                          ID: {item.patientId}
                        </span>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-red-700 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100">
                        {item.severity}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-red-950 line-clamp-1 flex items-center gap-1">
                      <span className="text-red-600 font-black">⚠️</span>
                      <span>{item.condition}</span>
                    </p>
                    {item.patientName && (
                      <p className="text-[10px] font-medium text-slate-500 truncate">
                        Patient: {item.patientName}
                      </p>
                    )}
                  </div>
                ))}
                {seriousConditionItems.length > 2 && (
                  <p className="text-[10px] font-bold text-red-600 text-center pt-0.5">
                    +{seriousConditionItems.length - 2} more critical patient(s)
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                No active serious conditions detected
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Patient Queue & Clinical Triage Filter */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900">Patient Queue & Clinical Triage</h3>
            <p className="text-xs text-slate-500">
              Only authorized patients with appointments scheduled with Dr. {currentUser.name}
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID or Name..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-brand-600"
            />
          </div>
        </div>

        {/* Queue Mode Tabs: Active Consultations vs Terminated / Completed */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => setQueueTab('ACTIVE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              queueTab === 'ACTIVE'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Active Consultation Queue ({appointments.filter(a => a.status !== 'COMPLETED').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setQueueTab('COMPLETED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              queueTab === 'COMPLETED'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>
              Completed ({stillRevokedAppts.length} Revoked{cancelledRevokeAppts.length > 0 ? ` • ${cancelledRevokeAppts.length} Revoke Cancelled` : ''})
            </span>
          </button>
        </div>

        {/* Triage Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Triage Filter:</span>
          </span>
          {(['ALL', 'EMERGENCY', 'URGENT', 'PRIORITY', 'NORMAL'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setTriageFilter(lvl)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                triageFilter === lvl
                  ? lvl === 'EMERGENCY'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-brand-600 text-white shadow-md'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {lvl === 'ALL'
                ? 'All Patients'
                : lvl === 'EMERGENCY'
                ? '🔴 Emergency First'
                : lvl === 'URGENT'
                ? '🟠 Urgent'
                : lvl === 'PRIORITY'
                ? '🟡 Priority'
                : '🟢 Normal Health'}
            </button>
          ))}
        </div>

        {/* Patients Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Triage Priority</th>
                <th className="py-3 px-4">Patient ID & Name</th>
                <th className="py-3 px-4">Time Slot</th>
                <th className="py-3 px-4">AI Pre-Consultation</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    No authorized appointments found matching the current criteria.
                  </td>
                </tr>
              ) : (
                sortedAppointments.map((apt) => {
                  const isEmergency = apt.triagePriority === 'EMERGENCY';
                  const hasNewActiveBooking = allSystemAppts.some(a => a.patientId === apt.patientId && a.status !== 'COMPLETED');
                  const isRevokeCancelled = Boolean(apt.revokeCancelled || hasNewActiveBooking);
                  const wasPreviouslyRevoked = allSystemAppts.some(a => a.patientId === apt.patientId && a.status === 'COMPLETED');
                  return (
                    <tr
                      key={apt.id}
                      className={`transition-colors ${
                        isEmergency ? 'bg-red-50/50 hover:bg-red-50 font-medium' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <TriageBadge level={apt.triagePriority} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900">{apt.patientName}</div>
                        <div className="font-mono text-[11px] text-slate-400">{apt.patientId}</div>
                        {(() => {
                          const reps = ocrService.getReportsForPatient(apt.patientId, true);
                          if (reps.length === 0) return null;
                          return (
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                                <ScanLine className="w-3 h-3 text-teal-600" />
                                <span>{reps.length} Scanned Report{reps.length > 1 ? 's' : ''} Attached</span>
                              </span>
                            </div>
                          );
                        })()}
                        {apt.status !== 'COMPLETED' && wasPreviouslyRevoked && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-0.5">
                            ✓ Revoke Cancelled • Normal Health
                          </span>
                        )}
                        {apt.status === 'COMPLETED' && isRevokeCancelled && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-0.5">
                            ✓ Revoke Cancelled (New Booking)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{apt.timeSlot}</td>
                      <td className="py-3 px-4">
                        {apt.preConsultationStatus === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700">
                            <Sparkles className="w-3 h-3" />
                            <span>Summary Ready</span>
                          </span>
                        ) : apt.preConsultationStatus === 'IN_PROGRESS' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700">
                            <span>In Progress</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Not Started</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600">
                        {apt.status === 'COMPLETED' ? (
                          isRevokeCancelled ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>Revoke Cancelled</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>Access Revoked</span>
                            </span>
                          )
                        ) : (
                          <span className="font-semibold">{apt.status}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {apt.status === 'COMPLETED' ? (
                          isRevokeCancelled ? (
                            <button
                              onClick={() => handleOpenPatientCase(apt.patientId)}
                              className="py-1.5 px-3 rounded-xl font-bold text-[11px] transition-all shadow-sm flex items-center gap-1.5 ml-auto bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95"
                              title="Next consultation booked - Revocation cancelled & access restored to Normal Health"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-white" />
                              <span>Revoke Cancelled (Open Case)</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenPatientCase(apt.patientId)}
                              className="py-2 px-3.5 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 ml-auto bg-slate-700 hover:bg-slate-800 text-slate-200 cursor-pointer active:scale-95"
                            >
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              <span>Access Terminated</span>
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => handleOpenPatientCase(apt.patientId)}
                            className={`py-2 px-3.5 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 ml-auto active:scale-95 ${
                              isEmergency
                                ? 'bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-300'
                                : 'bg-brand-600 hover:bg-brand-700 text-white'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Open Case</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 403 FORBIDDEN / ACCESS DENIED MODAL */}
      {accessDeniedError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 md:p-8 space-y-5 border border-red-200 animate-scale-in">
            <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-10 h-10" />
            </div>

            <div className="text-center space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-red-100 text-red-800 uppercase tracking-wider">
                403 Forbidden • Access Denied
              </span>
              <h3 className="text-xl font-black text-slate-900">Unauthorized Patient Record Access</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {accessDeniedError.reason}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between font-medium">
                <span className="text-slate-400">Target Patient ID:</span>
                <span className="font-mono font-bold text-slate-800">{accessDeniedError.patientId}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-400">Attempted Clinician:</span>
                <span className="font-bold text-slate-800">{currentUser.name} ({currentUser.staffId || currentUser.id})</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-400">DPDP Compliance:</span>
                <span className="text-emerald-700 font-semibold">Violation Logged & Audit Recorded</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setAccessDeniedError(null)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-all shadow-md active:scale-98"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD CARD DETAIL MODALS */}
      {activeCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 space-y-5 max-h-[85vh] overflow-y-auto border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
                  {activeCardModal === 'APPOINTMENTS' && <Clock className="w-5 h-5" />}
                  {activeCardModal === 'AI_CONSULTATIONS' && <Sparkles className="w-5 h-5" />}
                  {activeCardModal === 'EMERGENCY' && <AlertOctagon className="w-5 h-5 text-red-600" />}
                  {activeCardModal === 'REPORTS' && <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {activeCardModal === 'APPOINTMENTS' && "Today's Authorized Appointments"}
                    {activeCardModal === 'AI_CONSULTATIONS' && 'Completed AI Pre-Consultations'}
                    {activeCardModal === 'EMERGENCY' && 'Emergency Priority Clinical Flags'}
                    {activeCardModal === 'REPORTS' && 'Authorized Diagnostic Reports'}
                  </h3>
                  <p className="text-xs text-slate-500">Live records linked to Dr. {currentUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveCardModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content for Appointments Modal */}
            {activeCardModal === 'APPOINTMENTS' && (
              <div className="space-y-3">
                {appointments.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No appointments today.</p>
                ) : (
                  appointments.map(apt => (
                    <div
                      key={apt.id}
                      className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="font-extrabold text-slate-900 block">{apt.patientName}</span>
                        <span className="font-mono text-[11px] text-slate-500">{apt.patientId} • {apt.timeSlot}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TriageBadge level={apt.triagePriority} size="sm" />
                        <button
                          onClick={() => {
                            setActiveCardModal(null);
                            handleOpenPatientCase(apt.patientId);
                          }}
                          className="py-1.5 px-3 bg-brand-600 text-white font-bold rounded-xl text-xs"
                        >
                          Open Case
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Content for AI Consultations Modal */}
            {activeCardModal === 'AI_CONSULTATIONS' && (
              <div className="space-y-3">
                {completedAiAppts.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No completed AI pre-consultations yet.</p>
                ) : (
                  completedAiAppts.map(apt => {
                    const sum = storageService.getAISummaryForPatient(apt.patientId);
                    return (
                      <div
                        key={apt.id}
                        className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{apt.patientName} ({apt.patientId})</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-200 text-purple-800">
                            AI Ready
                          </span>
                        </div>
                        {sum && (
                          <p className="text-slate-700 text-[11px]">
                            <span className="font-semibold text-purple-900">Chief Complaint:</span> {sum.chiefComplaint} • Duration: {sum.duration} • Severity: {sum.severity}/10
                          </p>
                        )}
                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              setActiveCardModal(null);
                              handleOpenPatientCase(apt.patientId);
                            }}
                            className="py-1 px-3 bg-purple-600 text-white font-bold rounded-xl text-xs"
                          >
                            Review AI Clinical Summary
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Content for Emergency Flags Modal */}
            {activeCardModal === 'EMERGENCY' && (
              <div className="space-y-3">
                {seriousConditionItems.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl text-center space-y-1.5">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">All Clear</p>
                    <p className="text-xs text-slate-400">No emergency flags or critical conditions detected by AI pre-consultation.</p>
                  </div>
                ) : (
                  seriousConditionItems.map((item) => (
                    <div
                      key={item.patientId}
                      className="p-4 bg-red-50/90 rounded-2xl border-2 border-red-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-black text-xs text-red-950 bg-white px-2.5 py-1 rounded-xl border border-red-200 shadow-xs">
                            Unique ID: {item.patientId}
                          </span>
                          <span className="font-extrabold text-slate-900 text-sm">{item.patientName}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse">
                            {item.severity}
                          </span>
                        </div>
                        <div className="p-2.5 bg-white/80 rounded-xl border border-red-200/80 space-y-1">
                          <p className="text-xs font-black text-red-900 flex items-center gap-1.5">
                            <span className="text-red-600">⚠️</span>
                            <span>Detected Condition: {item.condition}</span>
                          </p>
                          {item.details && (
                            <p className="text-[11px] text-slate-600 italic">
                              ✦ Pre-Consultation Summary: {item.details}
                            </p>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Detected by AI Pre-Consultation • {new Date(item.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setActiveCardModal(null);
                          handleOpenPatientCase(item.patientId);
                        }}
                        className="py-2.5 px-4 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-md flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer"
                      >
                        <Stethoscope className="w-4 h-4" />
                        <span>Prioritize & Open Case</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Content for Reports Modal */}
            {activeCardModal === 'REPORTS' && (
              <div className="space-y-3">
                {reports.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No diagnostic reports uploaded yet.</p>
                ) : (
                  reports.map(rep => (
                    <div
                      key={rep.id}
                      className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{rep.reportTitle}</span>
                        <span className="font-mono text-[11px] text-slate-500">Patient: {rep.patientId} • Date: {rep.reportDate}</span>
                      </div>
                      <button
                        onClick={() => {
                          setActiveCardModal(null);
                          handleOpenPatientCase(rep.patientId);
                        }}
                        className="py-1.5 px-3 bg-emerald-600 text-white font-bold rounded-xl text-xs"
                      >
                        View Full Case
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPLETE CLINICAL CASE CONSULTATION MODAL */}
      {selectedPatientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-6 md:p-8 space-y-6 max-h-[92vh] overflow-y-auto my-6 border border-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center font-black text-lg">
                  {selectedPatientProfile ? selectedPatientProfile.fullName.charAt(0) : 'P'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900">
                      {selectedPatientProfile ? selectedPatientProfile.fullName : selectedPatientId}
                    </h3>
                    <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                      {selectedPatientId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Age: {selectedPatientProfile?.age || 'N/A'} • Gender: {selectedPatientProfile?.gender || 'N/A'} • Phone: {selectedPatientProfile?.phone || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(() => {
                  const currentAppt = appointments.find(a => a.patientId === selectedPatientId && a.status !== 'COMPLETED');
                  if (currentAppt) {
                    return (
                      <button
                        type="button"
                        onClick={handleCompleteConsultation}
                        className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                        title="Complete current consultation & remove patient from active queue"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Complete Consultation</span>
                      </button>
                    );
                  }
                  return null;
                })()}
                <button
                  type="button"
                  onClick={() => setIsAssignNurseOpen(true)}
                  className="py-2 px-3.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Assign to Nurse</span>
                </button>
                <button
                  onClick={() => setSelectedPatientId(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                  title="Close Case Window"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PATIENT MEDICAL PROFILE (Allergies, Blood Group, Chronic Diseases) */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-brand-600" />
                  <span>Patient Medical Profile</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white text-slate-800 border border-slate-200">
                  Blood Group: {selectedPatientProfile?.bloodGroup || 'Not Recorded'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Allergies Box */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Allergies:</span>
                  </span>
                  {selectedPatientProfile?.allergies ? (
                    <div className="space-y-1 text-[11px]">
                      {selectedPatientProfile.allergies.drugs && selectedPatientProfile.allergies.drugs.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-red-700 font-semibold">Drugs:</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedPatientProfile.allergies.drugs.map(d => (
                              <span key={d} className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold">
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedPatientProfile.allergies.food && selectedPatientProfile.allergies.food.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-700 font-semibold">Food:</span>
                          <span className="text-slate-700">{selectedPatientProfile.allergies.food.join(', ')}</span>
                        </div>
                      )}
                      {(!selectedPatientProfile.allergies.drugs || selectedPatientProfile.allergies.drugs.length === 0) &&
                       (!selectedPatientProfile.allergies.food || selectedPatientProfile.allergies.food.length === 0) &&
                       (!selectedPatientProfile.allergies.others || selectedPatientProfile.allergies.others.length === 0) && (
                        <span className="text-slate-400 italic">No known allergies recorded.</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No allergies recorded.</span>
                  )}
                </div>

                {/* Chronic Diseases Box */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-800">Chronic Diseases / Conditions:</span>
                  {selectedPatientProfile?.chronicDiseases && selectedPatientProfile.chronicDiseases.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedPatientProfile.chronicDiseases.map(c => (
                        <span key={c} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200">
                          {c}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">No known chronic disease recorded.</span>
                  )}
                </div>
              </div>

              {/* Active Nurse Assignments for this patient */}
              {patientNurseAssignments.length > 0 && (
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-purple-900">Active Nurse Assignment:</span>
                  {patientNurseAssignments.map(a => (
                    <span key={a.id} className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-medium">
                      Assigned to {a.nurseName} ({a.careType} • {a.priority})
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* AI Summary Section */}
            {activeAISummary ? (
              <div className="p-5 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="font-black text-purple-950 text-sm">Doctor Clinical Summary (Internal Pre-Consultation)</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-900 text-[10px] font-extrabold uppercase tracking-wider">
                      Doctor-Only View
                    </span>
                  </div>
                  <TriageBadge level={activeAISummary.recommendedTriage} size="sm" />
                </div>

                {/* Structured Clinical Breakdown: 6 Core Clinical Attributes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-purple-100">
                    <span className="text-slate-400 block font-bold text-[10px] uppercase tracking-wider">1. Chief Concern</span>
                    <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">{activeAISummary.chiefComplaint}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-purple-100">
                    <span className="text-slate-400 block font-bold text-[10px] uppercase tracking-wider">2. Duration</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{activeAISummary.duration || 'Acute / Unspecified'}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-purple-100">
                    <span className="text-slate-400 block font-bold text-[10px] uppercase tracking-wider">3. Severity</span>
                    <span className="font-extrabold text-red-600 text-sm mt-0.5 block">{activeAISummary.severity} / 10</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-purple-100">
                    <span className="text-slate-400 block font-bold text-[10px] uppercase tracking-wider">4. Associated Symptoms / Locations</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">
                      {activeAISummary.bodyLocations.length > 0 ? activeAISummary.bodyLocations.join(', ') : 'General discomfort'}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-purple-100">
                    <span className="text-slate-400 block font-bold text-[10px] uppercase tracking-wider">5. Relevant History / Red Flags</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">
                      {activeAISummary.detectedRedFlags.length > 0
                        ? `⚠️ Flags: ${activeAISummary.detectedRedFlags.join('; ')}`
                        : (selectedPatientProfile?.chronicDiseases && selectedPatientProfile.chronicDiseases.length > 0)
                        ? `Chronic: ${selectedPatientProfile.chronicDiseases.join(', ')}`
                        : 'No critical flags or chronic conditions reported.'}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-purple-100">
                    <span className="text-slate-400 block font-bold text-[10px] uppercase tracking-wider">6. Important Notes</span>
                    <span className="font-medium text-slate-700 mt-0.5 block italic text-[11px]">
                      {activeAISummary.ayushObservations?.ashtavidhaPariksha?.jihvaReported
                        ? `Ayurveda: Jihva - ${activeAISummary.ayushObservations.ashtavidhaPariksha.jihvaReported}`
                        : activeAISummary.siddhaObservations?.mukkuttramDominance
                        ? `Siddha: ${activeAISummary.siddhaObservations.mukkuttramDominance}`
                        : activeAISummary.unaniObservations?.mizajTemperament
                        ? `Unani Mizaj: ${activeAISummary.unaniObservations.mizajTemperament}`
                        : 'Pre-consultation adaptive questions completed. Standard clinical evaluation recommended.'}
                    </span>
                  </div>
                </div>

                {/* Multilingual QA Audit Trail */}
                {(() => {
                  const qaRecords = selectedPatientId ? storageService.getQAPairsForPatient(selectedPatientId) : [];
                  if (qaRecords.length === 0) return null;
                  return (
                    <div className="space-y-2 pt-2 border-t border-purple-200">
                      <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider block">
                        Multilingual QA Audit Trail ({qaRecords.length} recorded answers)
                      </span>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {qaRecords.map((qa) => (
                          <div key={qa.id} className="p-2.5 bg-white rounded-xl border border-purple-100 text-xs space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-slate-800">{qa.originalQuestion}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800 shrink-0">
                                🗣️ {qa.detectedResponseLanguage.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-slate-700 bg-slate-50 p-1.5 rounded text-[11px] font-medium">
                              "{qa.patientOriginalResponse}"
                            </p>
                            {qa.structuredInterpretation.clinicalNotes && (
                              <p className="text-[10px] font-bold text-brand-700">
                                ✦ Extracted: {qa.structuredInterpretation.clinicalNotes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <p className="text-[10px] text-slate-400 italic">
                  Note: {activeAISummary.disclaimer}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-400 text-center">
                Patient has not completed AI pre-consultation yet.
              </div>
            )}

            {/* Smart Kiosk Scanned Diagnostic Reports & AI Summary */}
            {patientReports.length > 0 && (() => {
              const activeReport = patientReports.find(r => r.id === selectedDoctorReportId) || patientReports[0];
              return (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-teal-50/90 rounded-2xl border border-teal-200">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-teal-600 text-white rounded-xl shadow-xs">
                        <ScanLine className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900">
                            Smart Kiosk Scanned Medical Report &amp; AI Clinical Summary
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800 border border-teal-300">
                            Scanned on Kiosk Optical Bed • OCR Completed
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">
                          Paper document digitized at Smart Kiosk • Parameters extracted with clinical flags
                        </p>
                      </div>
                    </div>
                    {patientReports.length > 1 && (
                      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                        {patientReports.map((r, idx) => {
                          const isSelected = activeReport.id === r.id;
                          return (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => setSelectedDoctorReportId(r.id)}
                              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                                isSelected
                                  ? 'bg-brand-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                              }`}
                            >
                              {r.reportTitle || `Report ${idx + 1}`}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Render only once: the single selected report */}
                  <OCRSummaryCard
                    key={activeReport.id}
                    report={activeReport}
                    forceEnglish={true}
                    initialSummarized={true}
                    showDoctorVerificationAction={true}
                    onVerify={() => {
                      ocrService.verifyReportByDoctor(activeReport.id, currentUser.name);
                      if (selectedPatientId) {
                        const updated = ocrService.getReportsForPatient(selectedPatientId, true);
                        const uniqueUpdated = Array.from(
                          new Map(updated.map(r => [(r.reportTitle || r.id).toLowerCase().trim(), r])).values()
                        );
                        setPatientReports(uniqueUpdated);
                      }
                    }}
                  />
                </div>
              );
            })()}

            {/* STRUCTURED e-PRESCRIPTION WRITER */}
            <form onSubmit={handleSavePrescription} className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-brand-600" />
                  <span>Structured e-Prescription & Consultation Notes</span>
                </h4>
                <button
                  type="button"
                  onClick={handleAddMedicationRow}
                  className="py-1 px-3 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-xl text-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Medicine</span>
                </button>
              </div>

              {prescriptionSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{prescriptionSuccessMsg}</span>
                </div>
              )}

              {/* Diagnosis Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Clinical Diagnosis / Impression:</label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Gastritis, Essential Hypertension, Type 2 Diabetes"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-brand-600"
                />
              </div>

              {/* Medications Table */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Prescribed Medications:</label>
                <div className="space-y-2">
                  {medications.map((med, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-6 gap-2 text-xs items-center"
                    >
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={med.medicineName}
                          onChange={(e) => handleUpdateMedication(idx, 'medicineName', e.target.value)}
                          placeholder="Medicine Name (e.g. Tab. Pantoprazole)"
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={(e) => handleUpdateMedication(idx, 'dosage', e.target.value)}
                          placeholder="Dosage (e.g. 40mg)"
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={med.frequency}
                          onChange={(e) => handleUpdateMedication(idx, 'frequency', e.target.value)}
                          placeholder="Frequency (1-0-1)"
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={med.duration}
                          onChange={(e) => handleUpdateMedication(idx, 'duration', e.target.value)}
                          placeholder="Duration (5 days)"
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={med.instructions}
                          onChange={(e) => handleUpdateMedication(idx, 'instructions', e.target.value)}
                          placeholder="Instructions (After food)"
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                        {medications.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicationRow(idx)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Doctor General Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Clinical Advice / Notes:</label>
                <textarea
                  rows={2}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Additional lifestyle, dietary, or follow-up instructions..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-brand-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedPatientId(null)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Issue Prescription</span>
                </button>
                <button
                  type="button"
                  onClick={handleCompleteConsultation}
                  className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Complete Consultation</span>
                </button>
              </div>
            </form>

            {/* Previously Issued Prescriptions for this patient */}
            {patientPrescriptions.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Prescription History ({patientPrescriptions.length})
                </h4>
                <div className="space-y-2">
                  {patientPrescriptions.map((rx) => (
                    <div key={rx.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">Rx #{rx.id} • {rx.diagnosis}</span>
                        <span className="font-mono text-[11px] text-slate-500">{new Date(rx.prescribedAt || rx.createdAt || rx.date).toLocaleDateString()}</span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {(rx.medications || rx.items || []).map((m, i) => (
                          <span key={i} className="inline-block mr-3">
                            • <strong>{m.medicineName}</strong> {m.dosage} ({m.frequency} x {m.duration})
                          </span>
                        ))}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Prescribed by: {rx.doctorName} ({rx.department})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DOCTOR-TO-NURSE PATIENT ASSIGNMENT MODAL */}
      {isAssignNurseOpen && selectedPatientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-100 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Assign Patient to Nurse</h3>
                  <p className="text-[11px] text-slate-500">
                    Patient: {selectedPatientProfile?.fullName || selectedPatientId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignNurseOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmNurseAssignment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Duty Nurse:</label>
                <select
                  value={selectedNurseId}
                  onChange={(e) => setSelectedNurseId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                  required
                >
                  <option value="">-- Choose Nurse --</option>
                  {allNursesList.map(n => (
                    <option key={n.id} value={n.staffId || n.id}>
                      {n.name} ({n.staffId || n.id} - {n.nurseDetails?.shift || 'Duty'} Shift)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Care Type:</label>
                  <select
                    value={nurseCareType}
                    onChange={(e) => setNurseCareType(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="MONITORING">Routine Monitoring</option>
                    <option value="VITALS_CHECK">Frequent Vitals Check</option>
                    <option value="MEDICATION_ADMIN">Medication Administration</option>
                    <option value="WOUND_CARE">Wound Care / Dressing</option>
                    <option value="POST_OP">Post-Operative Care</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Priority:</label>
                  <select
                    value={nursePriority}
                    onChange={(e) => setNursePriority(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="URGENT">Urgent</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Care Instructions / Orders:</label>
                <textarea
                  rows={3}
                  value={nurseInstructions}
                  onChange={(e) => setNurseInstructions(e.target.value)}
                  placeholder="e.g. Check BP every 2 hours, monitor SPO2, administer IV fluids as prescribed..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignNurseOpen(false)}
                  className="py-2 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-md"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Assign Patient</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
