import React, { useEffect } from 'react';
import { useTranslation } from '../../i18n';
import { aiEngine, AIConversationContext } from '../../services/aiEngine';
import { storageService } from '../../services/storageService';
import { notificationService } from '../../services/notificationService';
import { emergencyDetector } from '../../services/emergencyDetector';
import { AIConsultationSummary } from '../../types/ai';
import { VoiceButton } from '../../components/common/VoiceButton';
import {
  CheckCircle2,
  Building2,
  Stethoscope,
  FileText,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { ConsultationProgressPath } from '../../components/common/ConsultationProgressPath';

interface AISummaryScreenProps {
  context: AIConversationContext;
  onProceedToBooking?: () => void;
  onProceedToReports?: () => void;
  onDone: () => void;
}

export const AISummaryScreen: React.FC<AISummaryScreenProps> = ({
  context,
  onProceedToReports,
  onDone,
}) => {
  const { language, t } = useTranslation();

  const hospitalName = typeof context.selectedHospitalName === 'object' && context.selectedHospitalName
    ? (context.selectedHospitalName[language] || context.selectedHospitalName.en)
    : (context.selectedHospitalName || 'AIHC Medical Center');

  const doctorName = typeof context.selectedDoctorName === 'object' && context.selectedDoctorName
    ? (context.selectedDoctorName[language] || context.selectedDoctorName.en)
    : (context.selectedDoctorName || 'Consulting Physician');

  useEffect(() => {
    // Compile internal clinical summary for the DOCTOR ONLY and persist to database
    const summary: AIConsultationSummary = aiEngine.generateSummary(context);
    const qaRecords = storageService.getQAPairsForPatient(context.patientId);
    summary.qaRecords = qaRecords;
    storageService.saveAISummary(summary);

    // If AI detects serious condition, trigger Emergency Alert with patient unique ID
    const isSerious =
      summary.recommendedTriage === 'EMERGENCY' ||
      (summary.detectedRedFlags && summary.detectedRedFlags.length > 0) ||
      (summary.severity && summary.severity >= 8);

    if (isSerious) {
      const conditionText =
        (summary.detectedRedFlags && summary.detectedRedFlags[0]) ||
        summary.chiefComplaint ||
        'Critical condition detected in AI Pre-Consultation';

      emergencyDetector.createEmergencyAlert(
        context.patientId,
        context.patientName,
        conditionText,
        'EMERGENCY'
      );
    }

    // If an appointment exists, mark pre-consultation completed
    const appointments = storageService.getAppointmentsForPatient(context.patientId);
    if (appointments.length > 0) {
      storageService.updateAppointmentPreConsultation(
        appointments[0].id,
        'COMPLETED',
        isSerious ? 'EMERGENCY' : summary.recommendedTriage
      );
    }

    // Intimate completion to Attending Doctor and Care Team
    notificationService.intimatePreConsultationCompleted({
      patientId: context.patientId,
      patientName: context.patientName,
      triageLevel: summary.recommendedTriage,
      medicineSystem: summary.medicineSystem,
    });
  }, []);

  const spokenAudioText = `${t.aiPreConsultation.completedTitle}. ${t.aiPreConsultation.completedMsg}`;

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 animate-fade-in space-y-6">
      {/* Visual Confirmation Path with Ticks (Steps 1 & 2 Confirmed) */}
      <ConsultationProgressPath
        currentStep={3}
        completedSteps={[1, 2]}
        doctorName={doctorName}
        hospitalName={hospitalName}
        onStepClick={(step) => {
          if (step === 3 && onProceedToReports) {
            onProceedToReports();
          }
        }}
      />

      {/* Patient Reassurance Completion Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-emerald-100 shadow-lg shadow-emerald-500/5 space-y-6 text-center">
        {/* Big Green Success Badge */}
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50">
          <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
        </div>

        {/* Header & Reassuring Messages */}
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
            ✓ {t.aiPreConsultation.completedTitle}
          </h2>
          <p className="text-xs md:text-sm text-slate-600 max-w-md mx-auto leading-relaxed pt-1">
            {t.aiPreConsultation.completedMsg}
          </p>
        </div>

        {/* Audio Assistance Speaker */}
        <div className="flex justify-center">
          <VoiceButton
            textToSpeak={spokenAudioText}
            showListen={false}
            showSpeak={true}
            size="md"
          />
        </div>

        {/* Patient Details & Selected Doctor Context */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-2 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-semibold">{t.dashboard.patientId}:</span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {context.patientId}
            </span>
          </div>

          {(context.selectedDoctorName || context.selectedHospitalName) && (
            <div className="space-y-1.5 pt-1">
              {context.selectedHospitalName && (
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span className="font-bold">{hospitalName}</span>
                </div>
              )}
              {context.selectedDoctorName && (
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Stethoscope className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>
                    {t.appointment.doctorName}: <strong className="text-slate-900">{doctorName}</strong>
                    {context.selectedDoctorRoom && ` (${context.selectedDoctorRoom})`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Doctor-Only Privacy Notice */}
        <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200/70 flex items-start gap-2.5 text-left text-xs text-blue-900">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">{t.aiPreConsultation.doctorPrivacyNotice}</span>
          </div>
        </div>

        {/* EXACTLY TWO ACTIONS: [ Upload Report ] and [ Go Back ] */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onProceedToReports ? onProceedToReports : onDone}
            className="py-4 px-6 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-200 text-sm md:text-base flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
          >
            <FileText className="w-5 h-5 text-brand-100" />
            <span>{t.common.uploadReport}</span>
          </button>

          <button
            type="button"
            onClick={onDone}
            className="py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl border border-slate-300 text-sm md:text-base flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
            <span>{t.common.goBack}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
