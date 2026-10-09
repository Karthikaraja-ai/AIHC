import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { dpdpService } from '../../services/dpdpService';
import { storageService } from '../../services/storageService';
import { ocrService } from '../../services/ocrService';
import { Appointment, Prescription, MedicineReminder, PatientProfile } from '../../types';
import { MedicalReport } from '../../types/ocr';
import { LanguageModal } from '../../components/common/LanguageModal';
import { AccessibilityToolbar } from '../../components/common/AccessibilityToolbar';
import { NotificationCenter } from '../../components/common/NotificationCenter';
import { ConsultationProgressPath } from '../../components/common/ConsultationProgressPath';
import {
  Calendar,
  FileText,
  History,
  ShieldCheck,
  ArrowRight,
  Stethoscope,
  Pill,
  CheckCircle2,
  Lock,
  BellRing,
  AlertOctagon,
  PhoneCall,
  ChevronRight,
  X,
  Sparkles,
  Info,
  Clock,
  Building,
  Activity,
  Globe,
  Sliders,
  Monitor,
  UserCheck,
  LogOut,
  User,
  HeartPulse,
  Droplets,
  AlertTriangle,
  Edit3,
  RotateCcw,
  FastForward,
} from 'lucide-react';

interface PatientDashboardProps {
  onNavigate: (view: string) => void;
  onLogout?: () => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ onNavigate, onLogout }) => {
  const { language, t } = useTranslation();
  const { currentUser, logout, isKioskMode, setKioskMode } = useAuth();

  const patientId = currentUser.patientId || 'PAT-0001';
  const consent = dpdpService.getConsent(patientId);

  // Dynamic state from database
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [reminders, setReminders] = useState<MedicineReminder[]>([]);
  const [qaCount, setQaCount] = useState<number>(0);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);

  // Simple modal for Appointment Details & Health Card
  const [showApptDetailsModal, setShowApptDetailsModal] = useState(false);
  const [showHealthCardModal, setShowHealthCardModal] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isAccessOpen, setIsAccessOpen] = useState(false);

  useEffect(() => {
    const authAppts = storageService.getAuthorizedAppointments(currentUser);
    const authReps = ocrService.getReportsForPatient(patientId);
    const authRx = storageService.getPrescriptionsForPatient(patientId);
    const authReminders = storageService.getMedicineRemindersForPatient(patientId);
    const qaRecords = storageService.getQAPairsForPatient(patientId);
    const pat = storageService.getPatientById(patientId);

    setAppointments(authAppts);
    setReports(authReps);
    setPrescriptions(authRx);
    setReminders(authReminders);
    setQaCount(qaRecords.length);
    setPatientProfile(pat || null);
  }, [currentUser, patientId]);

  const emergencyAppointments = appointments.filter((a) => a.triagePriority === 'EMERGENCY');

  // ========================================================
  // EXACT PATIENT WORKFLOW DETERMINATION
  // 1. Pre-booking: No appointment booked yet
  // 2. Post-booking: Appointment booked, Pre-consultation pending
  // 3. Post-pre-consultation: Pre-consultation complete, waiting for doctor
  // 4. Post-consultation: Doctor consultation completed
  // ========================================================
  // Active appointments (exclude cancelled and archived completed cycles)
  const activeAppointments = appointments.filter((a) => a.status !== 'CANCELLED' && !a.isArchived);
  const hasActiveAppointment = activeAppointments.length > 0;
  const latestAppointment: Appointment | null = hasActiveAppointment ? activeAppointments[0] : null;

  const isPreConsultDone =
    hasActiveAppointment &&
    (latestAppointment?.preConsultationStatus === 'COMPLETED' ||
      qaCount > 0 ||
      storageService.getAuthorizedAISummaries(currentUser).length > 0);

  const isConsultDone = activeAppointments.some((a) => a.status === 'COMPLETED');
  const hasPrescription = prescriptions.length > 0;

  // Check if patient opted to skip report uploading (reports are optional)
  const isReportsSkipped = typeof window !== 'undefined' && localStorage.getItem(`aihc_reports_skipped_${patientId}`) === 'true';

  // Determine Current Stage
  type WorkflowStage = 'PRE_BOOKING' | 'POST_BOOKING_PRE_CONSULT' | 'WAITING_DOCTOR' | 'POST_CONSULT';
  let stage: WorkflowStage = 'PRE_BOOKING';

  if (!hasActiveAppointment) {
    stage = 'PRE_BOOKING';
  } else if (!isPreConsultDone) {
    stage = 'POST_BOOKING_PRE_CONSULT';
  } else if (!isConsultDone) {
    stage = 'WAITING_DOCTOR';
  } else {
    stage = 'POST_CONSULT';
  }

  // Consultation Steps with Ticks determination
  const completedSteps: number[] = [];
  if (hasActiveAppointment) completedSteps.push(1);
  if (isPreConsultDone) completedSteps.push(2);
  if (isPreConsultDone && (reports.length > 0 || isReportsSkipped || isConsultDone)) {
    completedSteps.push(3);
  }
  if (isConsultDone) completedSteps.push(4);

  let currentPathStep: 1 | 2 | 3 | 4 = 1;
  if (!hasActiveAppointment) currentPathStep = 1;
  else if (!isPreConsultDone) currentPathStep = 2;
  else if (reports.length === 0 && !isReportsSkipped && !isConsultDone) currentPathStep = 3;
  else currentPathStep = 4;

  // Reverse 4 steps back to starting (Step 1: Book Appointment) for a fresh consultation cycle
  const handleReverseToStarting = () => {
    storageService.archiveCompletedConsultationCycle(patientId);
    const updated = storageService.getAppointmentsForPatient(patientId);
    setAppointments(updated);
  };

  const handleStepClick = (step: number) => {
    if (step === 1) {
      if (completedSteps.length === 4) {
        if (window.confirm(language === 'ta'
          ? '4 படிகளும் முடிந்துவிட்டன. புதிய ஆலோசனையைத் தொடங்க செயல்முறையை மீட்டமைக்க விரும்புகிறீர்களா?'
          : language === 'hi'
          ? 'सभी 4 चरण पूरे हो चुके हैं। क्या आप नया परामर्श शुरू करने के लिए आरंभ पर वापस जाना चाहते हैं?'
          : 'All 4 steps are completed. Would you like to reverse to starting to begin a new consultation?')) {
          handleReverseToStarting();
          return;
        }
      }
      if (hasActiveAppointment) {
        setShowApptDetailsModal(true);
      } else {
        onNavigate('book-appointment');
      }
    } else if (step === 2) {
      if (hasActiveAppointment) {
        onNavigate('ai-pre-consultation');
      } else {
        onNavigate('book-appointment');
      }
    } else if (step === 3) {
      if (isPreConsultDone) {
        onNavigate('consultation-report-upload');
      } else {
        alert('Please complete Pre-Consultation first.');
      }
    } else if (step === 4) {
      if (isConsultDone) {
        onNavigate('reports');
      }
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-12 animate-fade-in max-w-4xl mx-auto px-4">
      {/* ======================================================== */}
      {/* TOP HEADER: BRAND, LANGUAGE, ACCESSIBILITY, KIOSK, NOTIFICATIONS, LOGOUT */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-brand-200 shrink-0">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-lg md:text-xl tracking-tight">AIHC</span>
              <span className="px-2 py-0.5 text-[10px] md:text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 rounded-full">
                DPDP & ABDM Compliant
              </span>
            </div>
            <p className="hidden md:block text-xs font-medium text-slate-500">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Language Switcher */}
          <button
            type="button"
            onClick={() => setIsLangOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all shadow-sm cursor-pointer"
            title="Change Language"
            aria-label="Change Language"
          >
            <Globe className="w-4 h-4 text-brand-600" />
            <span>{language === 'ta' ? 'தமிழ்' : language === 'hi' ? 'हिन्दी' : 'English'}</span>
          </button>

          {/* Accessibility Settings */}
          <button
            type="button"
            onClick={() => setIsAccessOpen(true)}
            className="p-2 md:px-3 md:py-2 flex items-center gap-1.5 text-xs md:text-sm font-medium rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all shadow-sm cursor-pointer"
            title={t.profile.accessibilitySettings}
            aria-label={t.profile.accessibilitySettings}
          >
            <Sliders className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">{t.profile.accessibilitySettings}</span>
          </button>

          {/* Kiosk Mode Toggle */}
          <button
            type="button"
            onClick={() => setKioskMode(!isKioskMode)}
            className={`p-2 md:px-3 md:py-2 flex items-center gap-1.5 text-xs md:text-sm font-medium rounded-xl border transition-all shadow-sm cursor-pointer ${
              isKioskMode
                ? 'bg-purple-600 text-white border-purple-700 font-semibold'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title={isKioskMode ? 'Exit Kiosk Mode' : 'Hospital Kiosk Mode'}
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden lg:inline">{isKioskMode ? 'Exit Kiosk' : 'Kiosk Mode'}</span>
          </button>

          {/* Work Completion Notifications & Intimations */}
          <NotificationCenter />

          {/* Authenticated User Identity */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-brand-50 text-brand-900 border border-brand-200 text-xs md:text-sm font-semibold">
            <UserCheck className="w-4 h-4 text-brand-600 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold leading-tight truncate max-w-[120px]">
                {currentUser.name}
              </span>
              <span className="font-mono text-[10px] text-brand-700 leading-tight">
                {patientId}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => {
              logout();
              if (onLogout) onLogout();
            }}
            className="p-2 md:px-3 md:py-2 rounded-xl text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all shadow-sm flex items-center gap-1.5 text-xs md:text-sm font-semibold cursor-pointer"
            title={t.profile.logoutBtn}
            aria-label={t.profile.logoutBtn}
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span className="hidden md:inline">{t.profile.logoutBtn}</span>
          </button>
        </div>
      </div>
      {/* ======================================================== */}
      {/* TOP HEADER: PATIENT WELCOME + ID + ABHA BADGE            */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-brand-700 via-indigo-700 to-purple-800 rounded-3xl p-6 md:p-8 text-white shadow-lg shadow-brand-500/10 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black">
                {t.dashboard.greeting}, {currentUser.name} 👋
              </h1>
              <p className="text-xs md:text-sm text-indigo-100 font-medium mt-0.5">
                {t.dashboard.welcomeSubtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Patient ID Pill */}
              <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-xl text-xs font-mono font-bold tracking-wider flex items-center gap-1.5 border border-white/20">
                <UserCheck className="w-3.5 h-3.5 text-indigo-200" />
                <span>{t.dashboard.patientId}: {patientId}</span>
              </span>

              {/* Attractive Smart Health Pass / Digital ID Badge (Replaces Nation Number) */}
              <button
                type="button"
                onClick={() => setShowHealthCardModal(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-emerald-400/25 hover:from-emerald-500/40 hover:to-teal-500/40 text-emerald-100 border border-emerald-300/40 backdrop-blur-md shadow-xs transition-all cursor-pointer group active:scale-95"
                title="Click to view Digital Health Pass Card"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-300 group-hover:rotate-12 transition-transform" />
                <span>{t.dashboard.smartHealthPass}</span>
                <span className="text-[10px] bg-emerald-400/25 text-emerald-100 px-1.5 py-0.5 rounded-md font-mono font-black border border-emerald-300/30">
                  {t.dashboard.verifiedBadge}
                </span>
              </button>

              {/* Patient Blood Group Pill */}
              {(patientProfile?.bloodGroup || 'B+') && (
                <span
                  className="px-2.5 py-1.5 bg-rose-500/25 text-rose-100 border border-rose-300/30 backdrop-blur-md rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs"
                  title="Recorded Blood Group"
                >
                  <Droplets className="w-3.5 h-3.5 text-rose-300" />
                  <span>{patientProfile?.bloodGroup || 'B+'}</span>
                </span>
              )}

              {/* OPD Queue Token Pill (if active appointment exists) */}
              {latestAppointment?.tokenNumber && (
                <span
                  className="px-2.5 py-1.5 bg-amber-400/25 text-amber-100 border border-amber-300/30 backdrop-blur-md rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs"
                  title="Active Consultation Token"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-amber-300" />
                  <span>Token: #{latestAppointment.tokenNumber}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* EMERGENCY ALERT BANNER (Only if emergency detected)     */}
      {/* ======================================================== */}
      {emergencyAppointments.length > 0 && (
        <div className="p-5 bg-red-600 text-white rounded-3xl shadow-xl border border-red-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-white text-red-600 rounded-2xl shadow-md shrink-0">
              <AlertOctagon className="w-6 h-6 stroke-[2.5] animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-sm uppercase tracking-wider">
                {t.emergency.alertTitle}
              </h4>
              <p className="text-xs text-red-100 font-medium leading-relaxed">
                {t.dashboard.emergencyBannerNotice}
              </p>
            </div>
          </div>

          <a
            href="tel:108"
            className="shrink-0 py-2.5 px-5 bg-white text-red-700 font-black rounded-xl text-xs shadow-md flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
          >
            <PhoneCall className="w-4 h-4" />
            <span>{t.dashboard.callEmergency}</span>
          </a>
        </div>
      )}

      {/* ======================================================== */}
      {/* CONSULTATION PROCESS PATH WITH TICKS                     */}
      {/* Visual process path confirming completed steps with ticks */}
      {/* ======================================================== */}
      <ConsultationProgressPath
        currentStep={currentPathStep}
        completedSteps={completedSteps}
        doctorName={latestAppointment?.doctorName}
        hospitalName={latestAppointment?.hospital}
        timeSlot={latestAppointment?.timeSlot}
        onStepClick={handleStepClick}
        onReverseToStarting={handleReverseToStarting}
        primaryActionLabel={
          currentPathStep === 1
            ? t.dashboard.heroBookBtn
            : currentPathStep === 2
            ? t.appointment.startPreConsultationNow
            : currentPathStep === 3
            ? (language === 'ta' ? 'மருத்துவ அறிக்கைகளை பதிவேற்றவும்' : language === 'hi' ? 'परामर्श रिपोर्ट अपलोड करें' : 'Upload Consultation Reports (Optional)')
            : (language === 'ta' ? 'மருந்துச்சீட்டைப் பார்க்கவும்' : language === 'hi' ? 'प्रिस्क्रिप्शन देखें' : t.common.viewRx)
        }
        onPrimaryAction={() => {
          if (currentPathStep === 1) onNavigate('book-appointment');
          else if (currentPathStep === 2) onNavigate('ai-pre-consultation');
          else if (currentPathStep === 3) onNavigate('consultation-report-upload');
          else onNavigate('reports');
        }}
        secondaryActionLabel={
          currentPathStep === 3
            ? (language === 'ta' ? '⏩ படியைத் தவிர்க்கவும் (விருப்பத்தேர்வு)' : language === 'hi' ? '⏩ चरण छोड़ें (वैकल्पिक)' : '⏩ Skip Step (Optional)')
            : latestAppointment && currentPathStep === 2
            ? t.dashboard.appointmentDetails
            : undefined
        }
        onSecondaryAction={
          currentPathStep === 3
            ? () => {
                try {
                  localStorage.setItem(`aihc_reports_skipped_${patientId}`, 'true');
                } catch (e) {}
                setAppointments([...appointments]);
              }
            : latestAppointment && currentPathStep === 2
            ? () => setShowApptDetailsModal(true)
            : undefined
        }
      />

      {/* 4-STEPS COMPLETED CONFIRMATION & REVERSE TO STARTING BANNER */}
      {completedSteps.length === 4 && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 rounded-3xl p-5 md:p-6 shadow-sm space-y-3 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-md shrink-0">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-slate-900 text-base">
                    {language === 'ta'
                      ? '✓ அனைத்து 4 படிகளும் வெற்றிகரமாக முடிக்கப்பட்டன!'
                      : language === 'hi'
                      ? '✓ सभी 4 चरण सफलतापूर्वक पूरे हो गए हैं!'
                      : '✓ All 4 Steps Successfully Completed!'}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    4/4 Verified
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {language === 'ta'
                    ? 'முன்பதிவு, ஆரம்பப் பரிசோதனை, அறிக்கைகள், மற்றும் மருத்துவர் ஆலோசனை அனைத்தும் நிறைவுற்றன. புதிய மருத்துவ ஆலோசனையைத் தொடங்க செயல்முறையை மீட்டமைக்கலாம்.'
                    : language === 'hi'
                    ? 'अपॉइंटमेंट, पूर्व-परामर्श, रिपोर्ट और डॉक्टर परामर्श सभी सफलतापूर्वक पूरे हो गए हैं। नया परामर्श चक्र शुरू करने के लिए रीसेट करें।'
                    : 'All consultation workflow steps completed. Reset workflow to start fresh consultation cycle.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReverseToStarting}
              className="self-start sm:self-auto py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>
                {language === 'ta'
                  ? 'புதிய சுழற்சியைத் தொடங்கு (Reset)'
                  : language === 'hi'
                  ? 'नया चक्र शुरू करें (Reset)'
                  : 'Start New Cycle (Reset)'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PERSONAL HEALTH RECORDS & TOOLS (Personal Collection)     */}
      {/* Strictly personal tools: Reports, Reminders, History     */}
      {/* Never displayed as workflow steps or with step numbers   */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-5">
        <div>
          <h3 className="text-lg md:text-xl font-black text-slate-900">
            {language === 'ta' ? 'தனிப்பட்ட மருத்துவ பதிவுகள்' : language === 'hi' ? 'व्यक्तिगत स्वास्थ्य रिकॉर्ड' : 'Personal Health Records'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'ta' ? 'உங்கள் மருத்துவ அறிக்கைகள், மருந்து நினைவூட்டல்கள் மற்றும் ஆலோசனை வரலாறு' : language === 'hi' ? 'अपनी चिकित्सा रिपोर्ट, दवा रिमाइंडर और परामर्श इतिहास देखें' : 'Access your personal medical reports, medicine reminders, and consultation history'}
          </p>
        </div>

        {/* PERSONAL COLLECTION CARDS LIST */}
        <div className="divide-y divide-slate-100">
          {/* 1. REPORTS (Personal medical reports vault) */}
          <div
            onClick={() => onNavigate('reports')}
            className="py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 px-3 rounded-2xl transition-colors group"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <h4 className="text-base font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                  {t.dashboard.reports}
                </h4>
                <p className="text-xs text-slate-400 truncate">
                  {reports.length > 0 ? `${reports.length} ${t.reports.reportsTab} • View, Upload, Download` : 'View, upload, and download your personal medical diagnostic reports'}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                {reports.length > 0 ? `${reports.length} Reports` : t.common.upload}
              </span>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>

          {/* 2. MEDICINE REMINDERS */}
          <div
            onClick={() => onNavigate('medicine-reminders')}
            className="py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 px-3 rounded-2xl transition-colors group"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <BellRing className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <h4 className="text-base font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                  {t.dashboard.medicineReminders}
                </h4>
                <p className="text-xs text-slate-400 truncate">
                  {reminders.length > 0 ? `${reminders.length} ${t.reminders.activeDoses}` : t.dashboard.medicineRemindersDesc}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                {reminders.length > 0 ? `${reminders.length}` : t.common.setNow}
              </span>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>

          {/* 3. CONSULTATION HISTORY */}
          <div
            onClick={() => onNavigate('consultation-history')}
            className="py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 px-3 rounded-2xl transition-colors group"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <History className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <h4 className="text-base font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                  {t.dashboard.consultationHistory}
                </h4>
                <p className="text-xs text-slate-400 truncate">
                  {t.dashboard.consultationHistoryDesc}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                {t.common.view}
              </span>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>

          {/* 4. PRESCRIPTIONS (Available when doctor has prescribed) */}
          {hasPrescription && (
            <div
              onClick={() => onNavigate('prescriptions')}
              className="py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 px-3 rounded-2xl transition-colors group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <Pill className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <h4 className="text-base font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                    {t.dashboard.prescriptions}
                  </h4>
                  <p className="text-xs text-slate-400 truncate">
                    {prescriptions.length} {t.reports.prescriptionsTab} available
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-teal-100 text-teal-800">
                  ✓ {prescriptions.length} Active
                </span>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* APPOINTMENT DETAILS MODAL                                */}
      {/* ======================================================== */}
      {showApptDetailsModal && latestAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {t.dashboard.appointmentDetails}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t.dashboard.patientId}: {patientId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowApptDetailsModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-bold uppercase">{t.appointment.doctorName}</span>
                  <span className="font-bold text-slate-900">{latestAppointment.doctorName}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-bold uppercase">{t.appointment.department}</span>
                  <span className="font-semibold text-slate-700">
                    {(latestAppointment.medicineSystem || 'AYURVEDA').replace('_', ' ')}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-bold uppercase">{t.appointment.dateTime}</span>
                  <span className="font-semibold text-slate-700">{latestAppointment.timeSlot}</span>
                </div>

                {latestAppointment.hospital && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-bold uppercase">{t.appointment.step1}</span>
                    <span className="font-semibold text-slate-700">{latestAppointment.hospital}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-xs text-slate-400 font-bold uppercase">{t.appointment.tokenNumber}</span>
                  <span className="font-mono font-black text-brand-700 text-base">{latestAppointment.tokenNumber}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowApptDetailsModal(false)}
                className="py-2.5 px-6 bg-slate-900 text-white font-bold rounded-xl text-xs"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Attractive Digital Smart Health Pass Modal */}
      {showHealthCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 space-y-6 shadow-2xl border border-slate-100 animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    {t.dashboard.healthCardTitle}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    AIHC Smart Patient Pass • Verified Active
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHealthCardModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Futuristic Holographic Smart Card */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 border-2 border-emerald-400/40 shadow-xl relative overflow-hidden space-y-4">
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

              {/* Card Header */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-400/20 border border-emerald-300/40 flex items-center justify-center font-black text-emerald-300 text-xs">
                    ✚
                  </div>
                  <span className="font-mono text-[11px] font-black tracking-widest text-emerald-300 uppercase">
                    AIHC SMART HEALTH PASS
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-300 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>VERIFIED</span>
                </div>
              </div>

              {/* Patient Identity */}
              <div className="relative z-10 flex items-center gap-3.5 pt-1">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 p-0.5 shadow-md shrink-0">
                  <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-xl font-black text-white">
                    {currentUser.name.charAt(0)}
                  </div>
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h4 className="font-black text-lg text-white truncate leading-tight">
                    {currentUser.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs font-mono text-indigo-200">
                    <span>{patientId}</span>
                    <span>•</span>
                    <span className="text-emerald-300 font-bold">{patientProfile?.sex || 'FEMALE'}, {patientProfile?.age || 44}y</span>
                  </div>
                </div>
              </div>

              {/* Card Details Grid */}
              <div className="relative z-10 grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
                <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 font-bold block">BLOOD GROUP</span>
                  <span className="font-mono font-black text-rose-300 text-sm flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5" />
                    <span>{patientProfile?.bloodGroup || 'B+'}</span>
                  </span>
                </div>

                <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 font-bold block">HEALTH CARE</span>
                  <span className="font-bold text-emerald-200 text-xs truncate block">
                    {patientProfile?.preferredMedicineSystem ? patientProfile.preferredMedicineSystem.replace('_', ' ') : 'Ayurveda & Integrative'}
                  </span>
                </div>
              </div>

              {/* Barcode Simulator */}
              <div className="relative z-10 pt-2 flex flex-col items-center gap-1">
                <div className="w-full h-7 bg-white/10 rounded-lg flex items-center justify-around px-2 py-1 tracking-widest text-slate-300 font-mono text-[9px] overflow-hidden">
                  ||| | |||| | ||||| || |||||| | |||| ||| |||| | ||
                </div>
                <span className="font-mono text-[10px] text-slate-400 tracking-widest">
                  PASS-ID: {patientId}-2026-ACTIVE
                </span>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowHealthCardModal(false)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Language & Accessibility Modals */}
      <LanguageModal isOpen={isLangOpen} onClose={() => setIsLangOpen(false)} />
      <AccessibilityToolbar isOpen={isAccessOpen} onClose={() => setIsAccessOpen(false)} />
    </div>
  );
};
