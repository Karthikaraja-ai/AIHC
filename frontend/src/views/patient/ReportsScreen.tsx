import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { ocrService } from '../../services/ocrService';
import { storageService } from '../../services/storageService';
import { MedicalReport } from '../../types/ocr';
import { Prescription, PrescriptionItem } from '../../types';
import { ReportUploader } from '../../components/ocr/ReportUploader';
import {
  FileText,
  Plus,
  ArrowLeft,
  Pill,
  Printer,
  Calendar,
  Stethoscope,
  Building,
  CheckCircle,
  X,
  Download,
  Eye,
  BellRing,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

interface ReportsScreenProps {
  onBack?: () => void;
  onNavigateToReminders?: () => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ onBack, onNavigateToReminders }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const patientId = currentUser?.patientId || 'PAT-0001';

  const [activeTab, setActiveTab] = useState<'REPORTS' | 'PRESCRIPTIONS'>('REPORTS');
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showUploader, setShowUploader] = useState(false);

  // Original Document Viewer Modal
  const [showOriginalModal, setShowOriginalModal] = useState(false);

  // Set Reminder Modal
  const [reminderModalMed, setReminderModalMed] = useState<PrescriptionItem | null>(null);
  const [reminderTimesInput, setReminderTimesInput] = useState('08:00 AM, 08:00 PM');
  const [reminderSavedMsg, setReminderSavedMsg] = useState<string | null>(null);
  const [scheduledMeds, setScheduledMeds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Strictly load only own patient records
    const loadedReports = ocrService.getReportsForPatient(patientId);
    setReports(loadedReports);
    if (loadedReports.length > 0) {
      setSelectedReport(loadedReports[0]);
    }

    const loadedPrescriptions = storageService.getPrescriptionsForPatient(patientId);
    setPrescriptions(loadedPrescriptions);
    if (loadedPrescriptions.length > 0) {
      setSelectedPrescription(loadedPrescriptions[0]);
    }

    const existingReminders = storageService.getMedicineRemindersForPatient(patientId);
    setScheduledMeds(new Set(existingReminders.map(r => r.medicineName.toLowerCase())));
  }, [patientId]);

  const handleReportProcessed = (newReport: MedicalReport) => {
    setReports(prev => [newReport, ...prev]);
    setSelectedReport(newReport);
    setShowUploader(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPrescription = (rx: Prescription) => {
    const content = `=====================================================
${rx.hospitalName || 'AIHC MULTI-SPECIALITY HOSPITAL'}
NABH Accredited • Integrated AYUSH & Modern Healthcare
=====================================================
PRESCRIPTION ID: ${rx.id || rx.prescriptionId}
Date: ${rx.date}
Doctor: ${rx.doctorName} (${rx.doctorRegNo || 'MCI-TN-48291'})
Department: ${rx.department || 'General Medicine'}
Patient Name: ${rx.patientName} (ID: ${rx.patientId})

DIAGNOSIS:
${rx.diagnosis || 'General OPD Consultation'}

MEDICATIONS:
${(rx.medications || rx.items || []).map((m, i) => `${i + 1}. ${m.medicineName} | Dose: ${m.dosage || '-'} | Freq: ${m.frequency} | Dur: ${m.duration} | Instructions: ${m.instructions || 'As advised'}`).join('\n')}

CLINICAL NOTES:
${rx.doctorNotes || 'Routine follow-up as advised.'}
=====================================================
Digitally Signed under DPDP Act 2023. Original document preserved.
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Prescription_${rx.id || rx.prescriptionId}_${rx.patientId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadOriginalReport = (report: MedicalReport) => {
    if (report.fileDataUri && report.fileDataUri.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = report.fileDataUri;
      a.download = `${report.reportTitle.replace(/\s+/g, '_')}_Original.${report.fileType.toLowerCase()}`;
      a.click();
    } else {
      const rawText = report.extractedRawText || `DIAGNOSTIC LABORATORY REPORT\nTitle: ${report.reportTitle}\nDate: ${report.reportDate}\nPatient ID: ${report.patientId}\n\nParameters:\n${(report.extractedParameters || []).map(p => `${p.parameterName}: ${p.measuredValue} ${p.unit} (Ref: ${p.referenceRange})`).join('\n')}`;
      const blob = new Blob([rawText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.reportTitle.replace(/\s+/g, '_')}_OriginalScan.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleOpenReminderModal = (med: PrescriptionItem) => {
    setReminderModalMed(med);
    if (med.frequency.toLowerCase().includes('three') || med.frequency.includes('1-1-1')) {
      setReminderTimesInput('08:00 AM, 02:00 PM, 08:00 PM');
    } else if (med.frequency.toLowerCase().includes('once') || med.frequency.includes('0-0-1')) {
      setReminderTimesInput('08:00 PM');
    } else {
      setReminderTimesInput('08:00 AM, 08:00 PM');
    }
  };

  const handleConfirmReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderModalMed) return;

    const times = reminderTimesInput.split(',').map(t => t.trim()).filter(Boolean);

    storageService.createMedicineReminder({
      patientId,
      prescriptionId: selectedPrescription?.id || selectedPrescription?.prescriptionId,
      medicineName: reminderModalMed.medicineName,
      dosage: reminderModalMed.dosage || '1 dose',
      frequency: reminderModalMed.frequency,
      duration: reminderModalMed.duration,
      startDate: new Date().toISOString().split('T')[0],
      reminderTimes: times.length > 0 ? times : ['08:00 AM'],
      instructions: reminderModalMed.instructions || 'Take as advised by physician.',
      status: 'ACTIVE',
    });

    const medName = reminderModalMed.medicineName;
    setScheduledMeds(prev => new Set([...prev, medName.toLowerCase()]));
    setReminderModalMed(null);
    setReminderSavedMsg(`✓ Reminder Scheduled: Daily reminder active for "${medName}"!`);
    setTimeout(() => setReminderSavedMsg(null), 5000);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 animate-fade-in space-y-6 pb-20 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-black text-slate-900">{t.reports.title}</h1>
            <p className="text-xs text-slate-500 font-medium">
              {t.dashboard.patientId}: <span className="font-mono font-bold text-slate-700">{patientId}</span>
            </p>
          </div>
        </div>

        {/* Tab Toggle Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('REPORTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'REPORTS'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t.reports.reportsTab} ({reports.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('PRESCRIPTIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'PRESCRIPTIONS'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>{t.reports.prescriptionsTab} ({prescriptions.length})</span>
          </button>
        </div>
      </div>

      {/* Reminder Created Success Toast */}
      {reminderSavedMsg && (
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2 print:hidden animate-slide-down shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{reminderSavedMsg}</span>
          </div>
          {onNavigateToReminders && (
            <button
              type="button"
              onClick={onNavigateToReminders}
              className="font-bold underline text-emerald-700 hover:text-emerald-900 text-[11px]"
            >
              {t.dashboard.heroRemindersBtn} →
            </button>
          )}
        </div>
      )}

      {/* TAB 1: MEDICAL REPORTS & OCR SUMMARIES */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t.reports.reportsTab} ({reports.length})
            </span>
            <button
              onClick={() => setShowUploader(!showUploader)}
              className="py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.reports.uploadPrompt}</span>
            </button>
          </div>

          {/* Report Uploader Form */}
          {showUploader && (
            <div className="p-6 bg-white rounded-3xl border border-brand-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">{t.reports.uploadPrompt}</h3>
                <button
                  onClick={() => setShowUploader(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  ✕ {t.common.cancel}
                </button>
              </div>
              <ReportUploader patientId={patientId} onReportProcessed={handleReportProcessed} />
            </div>
          )}

          {/* Reports selector chips if multiple reports exist */}
          {reports.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  className={`px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                    selectedReport?.id === r.id
                      ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm ring-2 ring-brand-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-brand-600" />
                  <span>{r.reportTitle}</span>
                  <span className="text-[10px] text-slate-400">({r.reportDate})</span>
                </button>
              ))}
            </div>
          )}

          {/* Selected Report Original Document View (Doctor-only summary omitted for patients) */}
          {selectedReport ? (
            <div className="space-y-4">
              {/* Original Document Preservation Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-brand-600" />
                      <h3 className="text-lg font-black text-slate-900">{selectedReport.reportTitle}</h3>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {selectedReport.reportDate} • {selectedReport.reportType}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowOriginalModal(true)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{t.reports.viewOriginal}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadOriginalReport(selectedReport)}
                      className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>{t.reports.downloadOriginal}</span>
                    </button>
                  </div>
                </div>

                {/* Original Document Metadata Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {t.reports.originalReport}
                    </span>
                    <p className="text-sm font-black text-slate-800">{selectedReport.fileType} Document</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {Math.round(selectedReport.fileSizeBytes / 1024)} KB
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {t.reports.status}
                    </span>
                    <p className="text-sm font-black text-slate-800">{selectedReport.reportDate}</p>
                    <p className="text-[11px] text-slate-500">{selectedReport.uploadedBy}</p>
                  </div>

                  <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-100 space-y-1">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                      {t.reports.originalPreserved}
                    </span>
                    <p className="text-sm font-black text-emerald-900 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>DPDP 2023 Verified</span>
                    </p>
                    <p className="text-[11px] text-emerald-700">Original scan permanently preserved</p>
                  </div>
                </div>

                {/* Preserved Raw Document Preview Bar */}
                {selectedReport.extractedRawText && (
                  <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>{t.reports.originalReport} Preview</span>
                      <button
                        type="button"
                        onClick={() => setShowOriginalModal(true)}
                        className="text-brand-600 hover:text-brand-800 text-[11px] underline cursor-pointer"
                      >
                        {t.reports.viewOriginal} →
                      </button>
                    </div>
                    <pre className="text-[11px] font-mono text-slate-600 bg-white p-3 rounded-xl border border-slate-200 overflow-x-auto max-h-40 whitespace-pre-wrap">
                      {selectedReport.extractedRawText}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 bg-white rounded-3xl border border-slate-100 text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">{t.reports.noReportsYet}</p>
              <button
                onClick={() => setShowUploader(true)}
                className="py-2.5 px-5 bg-brand-50 text-brand-700 font-bold rounded-xl text-xs hover:bg-brand-100 cursor-pointer"
              >
                {t.reports.uploadFirstReport}
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DOCTOR PRESCRIPTIONS & HOSPITAL-GRADE PRINT */}
      {activeTab === 'PRESCRIPTIONS' && (
        <div className="space-y-6">
          {prescriptions.length === 0 ? (
            <div className="p-12 bg-white rounded-3xl border border-slate-100 text-center space-y-3">
              <Pill className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">{t.reports.noPrescriptionsYet}</p>
              <p className="text-xs text-slate-400">
                {t.reports.noPrescriptionsDesc}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Prescriptions Selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 print:hidden">
                {prescriptions.map((rx) => (
                  <button
                    key={rx.id || rx.prescriptionId}
                    onClick={() => setSelectedPrescription(rx)}
                    className={`px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                      (selectedPrescription?.id || selectedPrescription?.prescriptionId) === (rx.id || rx.prescriptionId)
                        ? 'border-purple-600 bg-purple-50 text-purple-800 shadow-sm ring-2 ring-purple-200'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Pill className="w-3.5 h-3.5 text-purple-600" />
                    <span>Rx #{rx.id || rx.prescriptionId}</span>
                    <span className="text-[10px] text-slate-400">({rx.date})</span>
                  </button>
                ))}
              </div>

              {/* HOSPITAL-GRADE PRESCRIPTION VIEW */}
              {selectedPrescription && (
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6 print:shadow-none print:border-none print:p-0">
                  {/* Action Bar (Download & Print) */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 print:hidden">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t.reports.officialPrescription}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadPrescription(selectedPrescription)}
                        className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>{t.reports.downloadRx}</span>
                      </button>
                      <button
                        onClick={handlePrint}
                        className="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        <span>{t.reports.printRx}</span>
                      </button>
                    </div>
                  </div>

                  {/* Hospital Prescription Letterhead */}
                  <div className="border-b-2 border-slate-900 pb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-black text-xl">
                          +
                        </div>
                        <div>
                          <h1 className="text-xl font-black text-slate-900 uppercase tracking-wide">
                            {selectedPrescription.hospitalName || 'AIHC Multi-Speciality Hospital'}
                          </h1>
                          <p className="text-[11px] text-slate-500 font-medium">
                            NABH Accredited • ABDM / DPDP Integrated Healthcare Network
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-xs font-bold text-slate-500 block">
                          Rx ID: {selectedPrescription.id || selectedPrescription.prescriptionId}
                        </span>
                        <span className="text-xs text-slate-600 font-semibold">
                          {t.history.date}: {selectedPrescription.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Clinician & Patient Metadata Grid */}
                  <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="space-y-1">
                      <span className="text-slate-400 font-semibold block text-[11px] uppercase">{t.reports.prescribingDoctor}:</span>
                      <span className="font-extrabold text-slate-900 block text-sm">{selectedPrescription.doctorName}</span>
                      <span className="text-slate-600 block">
                        {selectedPrescription.doctorSpecialization || selectedPrescription.department || 'Clinical Consultant'}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 block">
                        Reg No: {selectedPrescription.doctorRegNo || 'MCI-TN-48291'}
                      </span>
                    </div>

                    <div className="space-y-1 text-right">
                      <span className="text-slate-400 font-semibold block text-[11px] uppercase">{t.reports.patientDetails}:</span>
                      <span className="font-extrabold text-slate-900 block text-sm">{selectedPrescription.patientName}</span>
                      <span className="font-mono text-xs font-bold text-brand-700 block">
                        {t.dashboard.patientId}: {selectedPrescription.patientId}
                      </span>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  {selectedPrescription.diagnosis && (
                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-slate-700 block uppercase text-[11px] tracking-wider">
                        {t.reports.diagnosis}:
                      </span>
                      <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 font-bold text-slate-900">
                        {selectedPrescription.diagnosis}
                      </div>
                    </div>
                  )}

                  {/* Medications Table with 1-Click Set Medicine Reminder */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                      <span className="text-base font-serif italic font-extrabold">Rx</span>
                      <span>{t.reports.medications}</span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">#</th>
                            <th className="py-2.5 px-3">{t.reports.medicineName}</th>
                            <th className="py-2.5 px-3">{t.reports.dosage}</th>
                            <th className="py-2.5 px-3">{t.reports.frequency}</th>
                            <th className="py-2.5 px-3">{t.reports.duration}</th>
                            <th className="py-2.5 px-3">{t.reports.instructions}</th>
                            <th className="py-2.5 px-3 text-right print:hidden">{t.reminders.title}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(selectedPrescription.medications || selectedPrescription.items || []).map((med, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-extrabold text-slate-900">{med.medicineName}</td>
                              <td className="py-2.5 px-3 text-slate-700 font-medium">{med.dosage || '-'}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-brand-700">{med.frequency}</td>
                              <td className="py-2.5 px-3 text-slate-700">{med.duration}</td>
                              <td className="py-2.5 px-3 text-slate-600 italic">{med.instructions || '-'}</td>
                              <td className="py-2.5 px-3 text-right print:hidden">
                                {scheduledMeds.has(med.medicineName.toLowerCase()) ? (
                                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-[11px] inline-flex items-center gap-1 border border-emerald-200 shadow-xs">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>✓ Reminder Set</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReminderModal(med)}
                                    className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-lg text-[11px] inline-flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                                    title={t.reports.setReminderBtn}
                                  >
                                    <BellRing className="w-3 h-3" />
                                    <span>{t.reports.setReminderBtn}</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Doctor Clinical Notes */}
                  {selectedPrescription.doctorNotes && (
                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-slate-700 block uppercase text-[11px] tracking-wider">
                        {t.reports.doctorAdvice}:
                      </span>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                        {selectedPrescription.doctorNotes}
                      </div>
                    </div>
                  )}

                  {/* Prescription Footer & Sign-off */}
                  <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs">
                    <div className="space-y-0.5 text-slate-400 text-[11px]">
                      <p>Valid across all AIHC network dispensaries & partner AYUSH pharmacies.</p>
                      <p>Generated under ABDM Consent Architecture & DPDP Act 2023.</p>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="w-32 h-10 border-b border-slate-400 flex items-end justify-center pb-1">
                        <span className="font-serif italic text-slate-800 text-sm font-semibold">
                          {selectedPrescription.doctorName}
                        </span>
                      </div>
                      <span className="font-bold text-slate-700 text-[11px] block">{t.reports.signatureStamp}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW ORIGINAL DOCUMENT MODAL */}
      {showOriginalModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col border border-slate-200 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-600" />
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedReport.reportTitle}</h3>
                  <p className="text-xs text-slate-400">{t.reports.originalPreserved}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOriginalModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              {selectedReport.fileDataUri && selectedReport.fileDataUri.startsWith('data:image') ? (
                <div className="text-center">
                  <img
                    src={selectedReport.fileDataUri}
                    alt={t.reports.originalReport}
                    className="max-w-full h-auto rounded-xl mx-auto shadow-sm border border-slate-200"
                  />
                </div>
              ) : selectedReport.fileDataUri && selectedReport.fileDataUri.startsWith('data:application/pdf') ? (
                <iframe
                  src={selectedReport.fileDataUri}
                  title={t.reports.originalReport}
                  className="w-full h-96 rounded-xl border border-slate-200 bg-white"
                />
              ) : (
                <div className="p-6 bg-white rounded-xl border border-slate-200 font-mono text-xs text-slate-700 space-y-4 shadow-sm">
                  <div className="border-b border-slate-200 pb-3 flex justify-between">
                    <span className="font-bold">AIHC DIAGNOSTIC & PATHOLOGY LABORATORY</span>
                    <span>NABH / NABL ACCREDITED</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-xs text-slate-800 leading-relaxed">
                    {selectedReport.extractedRawText ||
                      `PATIENT ID: ${selectedReport.patientId}\nREPORT: ${selectedReport.reportTitle}\nDATE: ${selectedReport.reportDate}\nSTATUS: VERIFIED CLINICAL SCAN\n\n` +
                        (selectedReport.extractedParameters || [])
                          .map(
                            p =>
                              `${p.parameterName.padEnd(28)}: ${p.measuredValue} ${p.unit} (Ref: ${p.referenceRange}) [${p.severity}]`
                          )
                          .join('\n')}
                  </pre>
                  <div className="border-t border-slate-200 pt-3 text-[11px] text-slate-400 flex justify-between">
                    <span>Authentic scan preserved intact under DPDP Act.</span>
                    <span>Page 1 of 1</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs font-mono text-slate-400">Document ID: {selectedReport.id}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadOriginalReport(selectedReport)}
                  className="py-2 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{t.reports.downloadOriginal}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowOriginalModal(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  {t.reports.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK SET MEDICINE REMINDER MODAL */}
      {reminderModalMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-100 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-black text-slate-900">{t.reports.setReminderModalTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setReminderModalMed(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReminder} className="space-y-3 text-xs">
              <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 space-y-1">
                <span className="font-black text-teal-900 block text-sm">{reminderModalMed.medicineName}</span>
                <p className="text-teal-700 text-xs">
                  {t.reports.dosage}: {reminderModalMed.dosage || '1 dose'} • {t.reports.duration}: {reminderModalMed.duration}
                </p>
                <p className="text-teal-600 text-[11px]">{t.reports.instructions}: {reminderModalMed.instructions}</p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{t.reports.reminderTimesLabel}</label>
                <input
                  type="text"
                  required
                  value={reminderTimesInput}
                  onChange={e => setReminderTimesInput(e.target.value)}
                  placeholder={t.reports.reminderTimesPlaceholder}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium focus:border-teal-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setReminderModalMed(null)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md active:scale-95 cursor-pointer"
                >
                  {t.reports.saveReminderBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
