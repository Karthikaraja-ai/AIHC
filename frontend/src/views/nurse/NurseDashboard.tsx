import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEmergency } from '../../context/EmergencyContext';
import { storageService } from '../../services/storageService';
import { notificationService } from '../../services/notificationService';
import { voiceService } from '../../services/voiceService';
import { Appointment, TriageLevel, PatientVitals, NurseAssignment } from '../../types';
import { AIConsultationSummary } from '../../types/ai';
import { MedicalReport } from '../../types/ocr';
import { TriageBadge } from '../../components/common/TriageBadge';
import { OCRSummaryCard } from '../../components/ocr/OCRSummaryCard';
import { ocrService } from '../../services/ocrService';
import {
  HeartPulse,
  Activity,
  ClipboardList,
  Clock,
  Plus,
  Search,
  Filter,
  Check,
  X,
  AlertTriangle,
  UserCheck,
  Sparkles,
  AlertOctagon,
  CheckCircle,
  FileText,
  Lock,
  ShieldAlert,
  ChevronRight,
  Stethoscope,
} from 'lucide-react';

export const NurseDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { activeAlerts } = useEmergency();

  const [assignments, setAssignments] = useState<NurseAssignment[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [aiSummaries, setAiSummaries] = useState<AIConsultationSummary[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [vitalsList, setVitalsList] = useState<PatientVitals[]>([]);

  const [triageFilter, setTriageFilter] = useState<'ALL' | TriageLevel>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Clickable Summary Card Modal State
  const [activeCardModal, setActiveCardModal] = useState<
    'APPOINTMENTS' | 'AI_CONSULTATIONS' | 'EMERGENCY' | 'REPORTS' | null
  >(null);

  // 403 Forbidden Access Denied Modal State
  const [accessDeniedError, setAccessDeniedError] = useState<{
    patientId: string;
    reason: string;
  } | null>(null);

  // Vitals recording modal state
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [targetPatient, setTargetPatient] = useState<{ id: string; name: string; assignment?: NurseAssignment } | null>(null);
  const [bpSys, setBpSys] = useState(120);
  const [bpDia, setBpDia] = useState(80);
  const [pulse, setPulse] = useState(72);
  const [spo2, setSpo2] = useState(98);
  const [temp, setTemp] = useState(98.6);
  const [respRate, setRespRate] = useState(16);
  const [bloodSugar, setBloodSugar] = useState(110);
  const [nurseNotes, setNurseNotes] = useState('');
  const [savedNotification, setSavedNotification] = useState<string | null>(null);

  // Previous Diagnostic Reports & AI Summarizer modal state
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [selectedReportPatient, setSelectedReportPatient] = useState<{ id: string; name: string } | null>(null);
  const [patientReports, setPatientReports] = useState<MedicalReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [nurseSummarizeMode, setNurseSummarizeMode] = useState<boolean>(false);

  const nurseId = currentUser.staffId || currentUser.id;

  const refreshData = () => {
    const activeAssignments = storageService
      .getNurseAssignmentsForNurse(nurseId)
      .filter(a => a.status === 'ACTIVE');
    setAssignments(activeAssignments);

    const authAppts = storageService.getAuthorizedAppointments(currentUser);
    const authAi = storageService.getAuthorizedAISummaries(currentUser);
    const authReps = storageService.getAuthorizedReports(currentUser);
    const allVitals = storageService.getAllVitals();

    // Include authorized reports for nurse's active assignments
    const assignedPtIds = activeAssignments.map(a => a.patientId);
    const ocrReports = ocrService.getAllReports().filter(r =>
      assignedPtIds.includes(r.patientId) || (r.patientId === 'PAT-0001' && assignedPtIds.includes('PAT-0001'))
    );

    setAppointments(authAppts);
    setAiSummaries(authAi);
    setReports(ocrReports.length > 0 ? ocrReports : authReps);
    setVitalsList(allVitals.filter(v => activeAssignments.some(a => a.patientId === v.patientId)));
  };

  useEffect(() => {
    refreshData();
  }, [currentUser]);

  const handleOpenPatientReports = (patientId: string, patientName: string) => {
    // Enforce Strict RBAC Check
    const authCheck = storageService.canUserAccessPatientData(currentUser, patientId);
    if (!authCheck.allowed) {
      setAccessDeniedError({
        patientId,
        reason:
          authCheck.reason ||
          `403 Forbidden: Patient ${patientId} has not been assigned to Nurse ${currentUser.name} (${nurseId}). Access blocked.`,
      });
      return;
    }

    const rawReps = ocrService.getReportsForPatient(patientId, true);
    // Deduplicate by reportTitle or id to avoid identical report repetitions
    const uniqueReps = Array.from(
      new Map(rawReps.map(r => [(r.reportTitle || r.id).toLowerCase().trim(), r])).values()
    );

    setSelectedReportPatient({ id: patientId, name: patientName });
    setPatientReports(uniqueReps);
    setSelectedReportId(uniqueReps.length > 0 ? uniqueReps[0].id : null);
    setNurseSummarizeMode(false);
    setIsReportsModalOpen(true);
  };

  const handleOpenVitalsModal = (patientId: string, patientName: string) => {
    // Enforce Strict RBAC Check
    const authCheck = storageService.canUserAccessPatientData(currentUser, patientId);
    if (!authCheck.allowed) {
      setAccessDeniedError({
        patientId,
        reason:
          authCheck.reason ||
          `403 Forbidden: Patient ${patientId} has not been assigned to Nurse ${currentUser.name} (${nurseId}). Access blocked.`,
      });
      return;
    }

    const matchingAssignment = assignments.find(a => a.patientId === patientId);
    setTargetPatient({ id: patientId, name: patientName, assignment: matchingAssignment });
    setIsVitalsModalOpen(true);
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPatient) return;

    const recorded = storageService.recordVitals({
      patientId: targetPatient.id,
      recordedBy: `${currentUser.name} (Nurse - ${nurseId})`,
      bpSystolic: bpSys,
      bpDiastolic: bpDia,
      pulse,
      spo2,
      temperature: temp,
      respiratoryRate: respRate,
      bloodSugar: bloodSugar || undefined,
      notes: nurseNotes || undefined,
    });

    // Mark task/assignment as Done / Completed
    if (targetPatient.assignment) {
      storageService.completeNurseAssignment(targetPatient.assignment.assignmentId || targetPatient.assignment.id || '');
    } else {
      const asg = assignments.find(a => a.patientId === targetPatient.id);
      if (asg) {
        storageService.completeNurseAssignment(asg.assignmentId || asg.id || '');
      }
    }

    setVitalsList(prev => [recorded, ...prev]);
    setIsVitalsModalOpen(false);

    // Intimate completion to Nurse, Doctor, and Patient
    notificationService.intimateVitalsRecorded({
      patientId: targetPatient.id,
      patientName: targetPatient.name,
      nurseName: currentUser.name,
      bpText: `${bpSys}/${bpDia} mmHg`,
      spo2Text: `${spo2}%`,
    });

    // Strictly ensure voice assistant is not activated (VOICE ASSISTANT IS PATIENT-ONLY)
    voiceService.stopSpeaking();
    voiceService.stopListening();

    refreshData();
    setSavedNotification(`Vitals recorded and task marked as completed for ${targetPatient.name} (${targetPatient.id})`);
    setTimeout(() => setSavedNotification(null), 4000);
  };

  const handleCompleteTask = (assignmentId: string) => {
    storageService.completeNurseAssignment(assignmentId);
    refreshData();
    setSavedNotification('Nursing care assignment marked as completed.');
    setTimeout(() => setSavedNotification(null), 3000);
  };

  // Filter assigned patient queue
  const filteredAppointments = appointments.filter((apt) => {
    const matchesTriage = triageFilter === 'ALL' || apt.triagePriority === triageFilter;
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.patientId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTriage && matchesSearch;
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

    // 1. From AI Pre-Consultation Summaries
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

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 animate-fade-in pb-20">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xl shadow-sm border border-purple-100">
            <HeartPulse className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">{currentUser.name}</h2>
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              ID: <span className="font-mono font-bold text-purple-700">{nurseId}</span> • {currentUser.nurseDetails?.department || 'OPD'} • Shift: {currentUser.nurseDetails?.shift || 'General'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Assigned Patients Only (Strict RBAC)</span>
          </span>
        </div>
      </div>

      {savedNotification && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-bold flex items-center gap-2 animate-scale-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedNotification}</span>
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

      {/* Triage Queue & Vitals Recording */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900">Clinically Assigned Patient Queue</h3>
            <p className="text-xs text-slate-500">
              Only patients assigned to Nurse {currentUser.name} by attending doctors
            </p>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID or Name..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium"
            />
          </div>
        </div>

        {/* Triage filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Triage:</span>
          </span>
          {(['ALL', 'EMERGENCY', 'URGENT', 'PRIORITY', 'NORMAL'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setTriageFilter(lvl)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                triageFilter === lvl
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {lvl === 'ALL' ? 'All Assigned' : lvl}
            </button>
          ))}
        </div>

        {/* Patients Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Triage Priority</th>
                <th className="py-3 px-4">Patient Info</th>
                <th className="py-3 px-4">Attending Doctor</th>
                <th className="py-3 px-4">Doctor Orders / Assignment</th>
                <th className="py-3 px-4 text-right">Clinical Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                    No assigned patients currently waiting in your queue.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => {
                  const assignment = assignments.find(a => a.patientId === apt.patientId);
                  const hasVitals = vitalsList.some(v => v.patientId === apt.patientId);
                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <TriageBadge level={apt.triagePriority} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-900 block">{apt.patientName}</span>
                        <span className="font-mono text-[11px] text-slate-400">{apt.patientId}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                          <span>{apt.doctorName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {hasVitals ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Vitals Completed</span>
                          </span>
                        ) : assignment ? (
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                              {assignment.careType} ({assignment.priority})
                            </span>
                            <p className="text-[11px] text-slate-600 font-medium line-clamp-2">
                              "{assignment.instructions}"
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Routine OPD care</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenPatientReports(apt.patientId, apt.patientName)}
                            className="py-1.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs border border-purple-200 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
                            title="View all previous reports of patient and summarize if desired"
                          >
                            <FileText className="w-3.5 h-3.5 text-purple-600" />
                            <span>Reports</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenVitalsModal(apt.patientId, apt.patientName)}
                            className={`py-1.5 px-3.5 font-bold rounded-xl text-xs border transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs ${
                              hasVitals
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600'
                            }`}
                          >
                            {hasVitals ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Plus className="w-3.5 h-3.5" />}
                            <span>{hasVitals ? 'Done (Update)' : 'Record Vitals'}</span>
                          </button>
                        </div>
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
                403 Forbidden • Access Blocked
              </span>
              <h3 className="text-xl font-black text-slate-900">Unassigned Patient Data Access</h3>
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
                <span className="text-slate-400">Nurse Identity:</span>
                <span className="font-bold text-slate-800">{currentUser.name} ({nurseId})</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-400">Audit Status:</span>
                <span className="text-emerald-700 font-semibold">Violation Logged to Security Log</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setAccessDeniedError(null)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-all shadow-md active:scale-98"
              >
                Close Notification
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
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                  {activeCardModal === 'APPOINTMENTS' && <Clock className="w-5 h-5" />}
                  {activeCardModal === 'AI_CONSULTATIONS' && <Sparkles className="w-5 h-5" />}
                  {activeCardModal === 'EMERGENCY' && <AlertOctagon className="w-5 h-5 text-red-600" />}
                  {activeCardModal === 'REPORTS' && <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {activeCardModal === 'APPOINTMENTS' && "Today's Assigned Appointments"}
                    {activeCardModal === 'AI_CONSULTATIONS' && 'AI Pre-Consultations for Assigned Patients'}
                    {activeCardModal === 'EMERGENCY' && 'Emergency Priority Assigned Patients'}
                    {activeCardModal === 'REPORTS' && 'Diagnostic Reports for Assigned Patients'}
                  </h3>
                  <p className="text-xs text-slate-500">Live records for Nurse {currentUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveCardModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {activeCardModal === 'APPOINTMENTS' && (
              <div className="space-y-3">
                {appointments.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No appointments today for assigned patients.</p>
                ) : (
                  appointments.map(apt => (
                    <div key={apt.id} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-extrabold text-slate-900 block">{apt.patientName}</span>
                        <span className="font-mono text-[11px] text-slate-500">{apt.patientId} • Dr. {apt.doctorName} • {apt.timeSlot}</span>
                      </div>
                      <TriageBadge level={apt.triagePriority} size="sm" />
                    </div>
                  ))
                )}
              </div>
            )}

            {activeCardModal === 'AI_CONSULTATIONS' && (
              <div className="space-y-3">
                {completedAiAppts.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No completed AI consultations for assigned patients.</p>
                ) : (
                  completedAiAppts.map(apt => {
                    const sum = storageService.getAISummaryForPatient(apt.patientId);
                    return (
                      <div key={apt.id} className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 text-xs space-y-1">
                        <span className="font-bold text-slate-900">{apt.patientName} ({apt.patientId})</span>
                        {sum && (
                          <p className="text-slate-600 text-[11px]">
                            {sum.chiefComplaint} • Severity: {sum.severity}/10
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeCardModal === 'EMERGENCY' && (
              <div className="space-y-3">
                {seriousConditionItems.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl text-center space-y-1.5">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">All Clear</p>
                    <p className="text-xs text-slate-400">No emergency cases or critical conditions detected by AI pre-consultation.</p>
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
                              ✦ Summary: {item.details}
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
                          handleOpenVitalsModal(item.patientId, item.patientName);
                        }}
                        className="py-2.5 px-4 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-md flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer"
                      >
                        <HeartPulse className="w-4 h-4" />
                        <span>Record Vitals Now</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeCardModal === 'REPORTS' && (
              <div className="space-y-3">
                {reports.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No diagnostic reports for assigned patients.</p>
                ) : (
                  reports.map(rep => {
                    const pt = storageService.getPatientById(rep.patientId);
                    const ptName = pt?.fullName || rep.patientId;
                    return (
                      <div key={rep.id} className="p-4 bg-purple-50/40 hover:bg-purple-50 rounded-2xl border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">{rep.reportTitle}</span>
                          <span className="font-mono text-[11px] text-slate-500">Patient: {ptName} ({rep.patientId}) • Date: {rep.reportDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {rep.ocrStatus}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCardModal(null);
                              handleOpenPatientReports(rep.patientId, ptName);
                            }}
                            className="py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View & Summarize</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RECORD VITALS MODAL */}
      {isVitalsModalOpen && targetPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 md:p-8 space-y-6 border border-slate-100 my-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                  {targetPatient.id}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">Record Patient Vitals</h3>
                <p className="text-xs text-slate-500">{targetPatient.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenPatientReports(targetPatient.id, targetPatient.name)}
                  className="py-1.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs border border-purple-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="View previous diagnostic reports"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  <span>View Reports</span>
                </button>
                <button
                  onClick={() => setIsVitalsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Doctor orders reminder */}
            {targetPatient.assignment && (
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs space-y-1">
                <span className="font-bold text-purple-900 block">Doctor's Care Orders:</span>
                <p className="text-purple-800 italic">"{targetPatient.assignment.instructions}"</p>
              </div>
            )}

            <form onSubmit={handleSaveVitals} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Systolic BP (mmHg):</label>
                  <input
                    type="number"
                    value={bpSys}
                    onChange={(e) => setBpSys(Number(e.target.value))}
                    className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Diastolic BP (mmHg):</label>
                  <input
                    type="number"
                    value={bpDia}
                    onChange={(e) => setBpDia(Number(e.target.value))}
                    className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pulse / Heart Rate (bpm):</label>
                  <input
                    type="number"
                    value={pulse}
                    onChange={(e) => setPulse(Number(e.target.value))}
                    className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SPO2 (%):</label>
                  <input
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(Number(e.target.value))}
                    className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Temp (°F):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={temp}
                    onChange={(e) => setTemp(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Resp Rate (/min):</label>
                  <input
                    type="number"
                    value={respRate}
                    onChange={(e) => setRespRate(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Blood Sugar (mg/dL):</label>
                  <input
                    type="number"
                    value={bloodSugar}
                    onChange={(e) => setBloodSugar(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nursing Observations / Clinical Notes:</label>
                <textarea
                  rows={3}
                  value={nurseNotes}
                  onChange={(e) => setNurseNotes(e.target.value)}
                  placeholder="Record patient demeanor, pain score, mobility or care delivered..."
                  className="w-full p-3 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVitalsModalOpen(false)}
                  className="py-2.5 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Vitals to Electronic Health Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PATIENT PREVIOUS DIAGNOSTIC REPORTS & AI SUMMARIZER MODAL */}
      {isReportsModalOpen && selectedReportPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-6 md:p-8 space-y-6 max-h-[92vh] overflow-y-auto my-6 border border-slate-100 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-black text-lg border border-purple-100 shadow-sm">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900">
                      Patient Previous Diagnostic Reports
                    </h3>
                    <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                      {selectedReportPatient.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Patient: <span className="font-bold text-slate-800">{selectedReportPatient.name}</span> • Total Previous Reports: <span className="font-bold text-purple-700">{patientReports.length}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsReportsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Nurse Explanatory & On-Demand Summarize Control Banner */}
            <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50/70 to-brand-50/50 rounded-2xl border border-purple-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5 text-xs text-purple-950">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  You are viewing all previous diagnostic reports for <strong>{selectedReportPatient.name}</strong>. You can inspect original laboratory documents and <strong>choose to summarize any report with AI on demand</strong>.
                </span>
              </div>
              {patientReports.length > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setNurseSummarizeMode(prev => !prev)}
                    className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs ${
                      nurseSummarizeMode
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white hover:bg-purple-50 text-purple-800 border border-purple-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{nurseSummarizeMode ? 'Showing AI Summaries' : 'Summarize with AI'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Reports Content */}
            {patientReports.length === 0 ? (
              <div className="p-10 bg-slate-50 rounded-3xl text-center space-y-3 border border-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-inner">
                  <FileText className="w-8 h-8" />
                </div>
                <h4 className="text-base font-extrabold text-slate-800">No Previous Reports Found</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  No previous diagnostic or laboratory reports have been uploaded for {selectedReportPatient.name} ({selectedReportPatient.id}) yet.
                </p>
              </div>
            ) : (() => {
              const activeReport = patientReports.find(r => r.id === selectedReportId) || patientReports[0];
              return (
                <div className="space-y-4">
                  {/* Report Tabs (when patient has multiple reports) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Report {patientReports.findIndex(r => r.id === activeReport.id) + 1} of {patientReports.length}
                    </span>
                    {patientReports.length > 1 && (
                      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                        {patientReports.map((r, idx) => {
                          const isSelected = activeReport.id === r.id;
                          return (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => setSelectedReportId(r.id)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                              }`}
                            >
                              {r.reportTitle || `Report ${idx + 1}`}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Single Report View with On-Demand AI Summarization */}
                  <OCRSummaryCard
                    key={`${activeReport.id}-${nurseSummarizeMode}`}
                    report={activeReport}
                    forceEnglish={false}
                    initialSummarized={nurseSummarizeMode}
                    showDoctorVerificationAction={false}
                  />
                </div>
              );
            })()}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                ABDM & DPDP Act Compliant • Original laboratory documents preserved immutable.
              </span>
              <button
                type="button"
                onClick={() => setIsReportsModalOpen(false)}
                className="py-2 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
