import React, { useState } from 'react';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { notificationService } from '../../services/notificationService';
import { directoryService } from '../../services/directoryService';
import { MedicineSystem, DoctorDirectoryEntry } from '../../types';
import { AIConversationContext, aiEngine } from '../../services/aiEngine';
import { AIQuestionScreen } from '../patient/AIQuestionScreen';
import { VoiceButton } from '../../components/common/VoiceButton';
import { TriageBadge } from '../../components/common/TriageBadge';
import { ocrService } from '../../services/ocrService';
import { MedicalReport } from '../../types/ocr';
import {
  Monitor,
  UserPlus,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Phone,
  User,
  Leaf,
  Compass,
  Activity,
  Heart,
  Stethoscope,
  MapPin,
  Clock,
  Printer,
  RotateCcw,
  ScanLine,
  FileCheck,
  AlertTriangle,
  Loader2,
  Check,
  Eye,
} from 'lucide-react';

type KioskStep =
  | 'WELCOME'
  | 'REGISTER'
  | 'SELECT_SYSTEM'
  | 'SELECT_DOCTOR'
  | 'SCAN_REPORTS'
  | 'PRE_CONSULT'
  | 'TOKEN_SUCCESS';

interface DocumentCategoryOption {
  id: string;
  name: { en: string; ta: string; hi: string };
  categoryKey: string;
  icon: string;
  desc: string;
}

const DOCUMENT_CATEGORIES: DocumentCategoryOption[] = [
  {
    id: 'CBC',
    name: { en: 'Blood Test / CBC Report', ta: 'இரத்தப் பரிசோதனை / CBC அறிக்கை', hi: 'रक्त परीक्षण / सीबीसी रिपोर्ट' },
    categoryKey: 'Hematology / Complete Blood Count (CBC) Panel',
    icon: '🩸',
    desc: 'Hemoglobin, WBC, Platelets, PCV, ESR',
  },
  {
    id: 'DIABETES',
    name: { en: 'Blood Sugar & HbA1c (Diabetes)', ta: 'இரத்த சர்க்கரை & HbA1c (நீரிழிவு)', hi: 'ब्लड शुगर एवं HbA1c (मधुमेह)' },
    categoryKey: 'Biochemistry / Diabetic Panel',
    icon: '🧪',
    desc: 'Fasting Sugar (FBS), PPBS, HbA1c Glycated',
  },
  {
    id: 'THYROID',
    name: { en: 'Thyroid Function (TFT)', ta: 'தைராய்டு பரிசோதனை (TFT)', hi: 'थायराइड फंक्शन टेस्ट (TFT)' },
    categoryKey: 'Thyroid Function Test (TFT)',
    icon: '🦋',
    desc: 'TSH, T3, T4, Free T4',
  },
  {
    id: 'LIPID',
    name: { en: 'Lipid & Cholesterol Profile', ta: 'கொழுப்பு பரிசோதனை (Lipid Profile)', hi: 'लिपिड प्रोफाइल (कोलेस्ट्रॉल)' },
    categoryKey: 'Lipid Profile / Cardiovascular Panel',
    icon: '🫀',
    desc: 'Total Cholesterol, Triglycerides, HDL, LDL',
  },
  {
    id: 'PRESCRIPTION',
    name: { en: 'Doctor Prescription / Clinical Slip', ta: 'மருத்துவர் மருந்து சீட்டு (Prescription)', hi: 'डॉक्टर का पर्चा / प्रिस्क्रिप्शन' },
    categoryKey: 'Doctor Written Prescription',
    icon: '💊',
    desc: 'Doctor notes, medication history, OPD slip',
  },
  {
    id: 'GENERAL_LAB',
    name: { en: 'General Diagnostic Lab Sheet', ta: 'பொது ஆய்வகப் பரிசோதனை தாள்', hi: 'सामान्य नैदानिक लैब रिपोर्ट' },
    categoryKey: 'Renal Function Test (RFT / KFT)',
    icon: '📋',
    desc: 'Kidney RFT, Liver LFT, Urine routine',
  },
];

export const KioskPatientJourney: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();
  const { setKioskMode, loginAsPatient } = useAuth();

  const [kioskStep, setKioskStep] = useState<KioskStep>('WELCOME');
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [registeredId, setRegisteredId] = useState('AIHC-7X9P26');
  const [scannedReports, setScannedReports] = useState<MedicalReport[]>([]);

  // Physical Scanner Bed States
  const [selectedDocCategory, setSelectedDocCategory] = useState<string>('CBC');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStepText, setScanStepText] = useState('');
  const [previewModalReport, setPreviewModalReport] = useState<MedicalReport | null>(null);

  // Consultation state
  const [selectedSystem, setSelectedSystem] = useState<MedicineSystem>('AYURVEDA');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorDirectoryEntry | null>(null);
  const [completedSummary, setCompletedSummary] = useState<any>(null);
  const [issuedTokenNumber, setIssuedTokenNumber] = useState<number>(25);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !phone.trim()) return;

    // Smart Kiosk Registration: Only Name & Mobile number required
    const profile = storageService.registerPatient({
      fullName: patientName.trim(),
      phone: phone.trim(),
      age: 30,
      sex: 'FEMALE',
      ageGroup: 'ADULT',
    });
    setRegisteredId(profile.patientId);
    loginAsPatient(profile.patientId);
    setKioskStep('SELECT_SYSTEM');
  };

  const handleSystemSelect = (system: MedicineSystem) => {
    setSelectedSystem(system);
    setKioskStep('SELECT_DOCTOR');
  };

  const handleDoctorSelect = (doctor: DoctorDirectoryEntry) => {
    setSelectedDoctor(doctor);
    // Proceed to Physical Report Scanner step after selecting doctor
    setKioskStep('SCAN_REPORTS');
  };

  // Physical Flatbed Scanner Action
  const handlePerformPhysicalScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(15);
    setScanStepText('Optical sensors detecting paper document on scanner glass bed...');

    const timer1 = setTimeout(() => {
      setScanProgress(45);
      setScanStepText('Aligning document edges • Scanning 300 DPI high-resolution optical image...');
    }, 700);

    const timer2 = setTimeout(() => {
      setScanProgress(80);
      setScanStepText('Analyzing test parameters & clinical values...');
    }, 1500);

    const timer3 = setTimeout(() => {
      setScanProgress(100);
      setScanStepText('Digitization complete! Clinical summary generated & attached to doctor case.');

      const catObj = DOCUMENT_CATEGORIES.find((c) => c.id === selectedDocCategory) || DOCUMENT_CATEGORIES[0];
      const title = catObj.name[language] || catObj.name.en;
      const report = ocrService.scanPhysicalDocument(catObj.categoryKey, registeredId, title);

      setScannedReports((prev) => [report, ...prev]);
      setIsScanning(false);
    }, 2200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  };

  const handleDirectTokenIssue = () => {
    const tokenNum = Math.floor(Math.random() * 40) + 15;
    setIssuedTokenNumber(tokenNum);

    // Book appointment in storage
    storageService.bookAppointment({
      patientId: registeredId,
      patientName: patientName || 'Kiosk Patient',
      hospital: 'AIHC Central Hospital (Self-Service Kiosk Terminal)',
      department: selectedDoctor?.department.en || selectedSystem,
      doctorId: selectedDoctor?.id || 'DOC-K1',
      doctorName: selectedDoctor?.name.en || 'Consulting Doctor',
      medicineSystem: selectedSystem,
      date: new Date().toISOString().split('T')[0],
      timeSlot: 'Immediate OPD Queue',
    });

    // Intimate completion to all roles
    notificationService.intimatePreConsultationCompleted({
      patientId: registeredId,
      patientName: patientName || 'Kiosk Patient',
      triageLevel: scannedReports.some((r) => r.criticalFindings.length > 0) ? 'PRIORITY' : 'NORMAL',
      medicineSystem: selectedSystem,
    });

    setKioskStep('TOKEN_SUCCESS');
  };

  const handlePreConsultComplete = (ctx: AIConversationContext) => {
    const summary = aiEngine.generateSummary(ctx);
    setCompletedSummary(summary);
    storageService.saveAISummary(summary);

    const tokenNum = Math.floor(Math.random() * 40) + 15;
    setIssuedTokenNumber(tokenNum);

    // Book appointment in storage
    storageService.bookAppointment({
      patientId: registeredId,
      patientName: ctx.patientName || patientName || 'Kiosk Patient',
      hospital: 'AIHC Central Hospital (Self-Service Kiosk Terminal)',
      department: selectedDoctor?.department.en || selectedSystem,
      doctorId: selectedDoctor?.id || 'DOC-K1',
      doctorName: selectedDoctor?.name.en || 'Consulting Doctor',
      medicineSystem: selectedSystem,
      date: new Date().toISOString().split('T')[0],
      timeSlot: 'Immediate OPD Queue',
    });

    // Intimate completion to all roles
    notificationService.intimatePreConsultationCompleted({
      patientId: registeredId,
      patientName: ctx.patientName || patientName || 'Kiosk Patient',
      triageLevel: summary.recommendedTriage,
      medicineSystem: selectedSystem,
    });

    setKioskStep('TOKEN_SUCCESS');
  };

  const medicineOptions: Array<{
    id: MedicineSystem;
    title: { en: string; ta: string; hi: string };
    desc: { en: string; ta: string; hi: string };
    icon: any;
    color: string;
  }> = [
    {
      id: 'AYURVEDA',
      title: { en: 'Ayurveda', ta: 'ஆயுர்வேதம்', hi: 'आयुर्वेद' },
      desc: {
        en: 'Tridosha balance, Panchakarma detox & herbal medicine',
        ta: 'திரிதோஷ சமநிலை, பஞ்சகர்மா நச்சுநீக்கம் & மூலிகை மருத்துவம்',
        hi: 'त्रिदोष संतुलन, पंचकर्म विषहरण एवं हर्बल चिकित्सा',
      },
      icon: Leaf,
      color: 'from-emerald-600 to-teal-700',
    },
    {
      id: 'UNANI',
      title: { en: 'Unani', ta: 'யுனானி', hi: 'यूनानी' },
      desc: {
        en: 'Mizaj temperament balance, Ilaj-bit-Tadbeer & Hijama',
        ta: 'மிசாஜ் உடலமைப்பு சமநிலை, இலாஜ்-பித்-தத்பீர் & ஹிஜாமா',
        hi: 'मिज़ाज संतुलन, इलाज-बित-तदबीर एवं हिजामा',
      },
      icon: Compass,
      color: 'from-amber-600 to-orange-700',
    },
    {
      id: 'SIDDHA',
      title: { en: 'Siddha', ta: 'சித்தா', hi: 'सिद्ध' },
      desc: {
        en: 'Mukkuttram harmony, Envagai Thervu & Varmam care',
        ta: 'முக்குற்றம் சமநிலை, எண்வகைத் தேர்வு & வர்ம சிகிச்சை',
        hi: 'முக்குற்றம் संतुलन, என்வாகஈ தேரவு एवं வர்மம் கேயர்',
      },
      icon: Sparkles,
      color: 'from-purple-600 to-indigo-700',
    },
    {
      id: 'YOGA_NATUROPATHY',
      title: { en: 'Yuva (Yoga & Naturopathy)', ta: 'யோகா & இயற்கை மருத்துவம் (Yuva)', hi: 'योग एवं प्राकृतिक चिकित्सा (Yuva)' },
      desc: {
        en: 'Panchamahabhuta elements, Prana breathing & lifestyle diet',
        ta: 'பஞ்சபூத கூறுகள், பிராணாயாமம் & இயற்கை உணவு முறை',
        hi: 'पंचमहाभूत तत्व, प्राणायाम एवं प्राकृतिक आहार',
      },
      icon: Activity,
      color: 'from-sky-600 to-blue-700',
    },
    {
      id: 'ALLOPATHY_HOMEOPATHY',
      title: { en: 'Hollopathy (Allopathy & Modern OPD)', ta: 'அலோபதி & நவீன மருத்துவம் (Modern OPD)', hi: 'एलोपैथी एवं आधुनिक चिकित्सा (Allopathy)' },
      desc: {
        en: 'Modern clinical investigations, acute care & outpatient OPD',
        ta: 'நவீன மருத்துவ அறிவியல், துல்லிய பரிசோதனை & தீவிர பிரிவு',
        hi: 'प्रमाण-आधारित आधुनिक नैदानिक जांच एवं ओपीडी',
      },
      icon: Heart,
      color: 'from-rose-600 to-pink-700',
    },
  ];

  const doctorsInDepartment = directoryService.getDoctorsBySystem(selectedSystem);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 text-white p-4 md:p-8 flex flex-col justify-between select-none">
      {/* Kiosk Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-3.5 bg-white/10 rounded-2xl backdrop-blur-md">
            <Monitor className="w-8 h-8 text-brand-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">{t.kiosk.banner}</h1>
            <p className="text-xs text-purple-200">
              Hospital Smart Kiosk • Touch OPD Registration &amp; Physical Document Scanner Bed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="inline-flex p-1 bg-white/10 rounded-2xl backdrop-blur-md">
            <button
              type="button"
              onClick={() => setLanguage('ta')}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                language === 'ta' ? 'bg-brand-600 text-white shadow-md' : 'text-purple-200'
              }`}
            >
              தமிழ்
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                language === 'en' ? 'bg-brand-600 text-white shadow-md' : 'text-purple-200'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                language === 'hi' ? 'bg-brand-600 text-white shadow-md' : 'text-purple-200'
              }`}
            >
              हिन्दी
            </button>
          </div>

          <button
            type="button"
            onClick={() => setKioskMode(false)}
            className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-purple-200"
          >
            Exit Kiosk
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="my-auto py-6 max-w-5xl mx-auto w-full">
        {/* STEP 1: WELCOME SCREEN (NO OPD CHECK-IN WITH PATIENT ID) */}
        {kioskStep === 'WELCOME' && (
          <div className="text-center space-y-8 animate-fade-in max-w-3xl mx-auto">
            <div className="space-y-3">
              <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Self-Service Hospital Touch Terminal
              </span>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">
                {t.splash.welcome}
              </h2>
              <p className="text-base md:text-lg text-purple-200 font-medium max-w-xl mx-auto">
                Touch below to quickly register with your name &amp; phone number, or place your paper test reports on the scanner.
              </p>
            </div>

            <div className="flex justify-center">
              <VoiceButton
                textToSpeak={`${t.splash.welcome}. Please touch Register for OPD consultation or Place Paper Reports on Scanner.`}
                showSpeak={false}
                size="lg"
                className="bg-white/10 p-2 rounded-2xl"
              />
            </div>

            {/* Oversized Touch Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <button
                type="button"
                onClick={() => setKioskStep('REGISTER')}
                className="p-8 rounded-3xl bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-700 hover:from-brand-500 hover:to-indigo-500 border border-white/20 shadow-2xl transition-all flex flex-col items-center justify-center gap-4 active:scale-95 group text-center min-h-[220px]"
              >
                <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <UserPlus className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">{t.kiosk.quickRegister}</h3>
                  <p className="text-xs text-purple-200 mt-1 font-medium">
                    Only Patient Name &amp; 10-Digit Mobile Number • Fast Token
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setKioskStep('SCAN_REPORTS')}
                className="p-8 rounded-3xl bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-700 hover:from-teal-500 hover:to-emerald-500 border border-white/20 shadow-2xl transition-all flex flex-col items-center justify-center gap-4 active:scale-95 group text-center min-h-[220px]"
              >
                <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <ScanLine className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">Document Scanner Bed</h3>
                  <p className="text-xs text-teal-100 mt-1 font-medium">
                    Place paper report or prescription on scanner glass bed
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: REGISTRATION (ONLY PATIENT NAME AND NUMBER) */}
        {kioskStep === 'REGISTER' && (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 max-w-lg mx-auto space-y-6 animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <button onClick={() => setKioskStep('WELCOME')} className="p-2 text-purple-300 hover:text-white">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="text-center">
                <h3 className="text-xl font-bold">{t.auth.patientRegistration}</h3>
                <p className="text-xs text-purple-200">Only Name &amp; Mobile Number required</p>
              </div>
              <VoiceButton textToSpeak="Please enter your full name and 10-digit mobile number." showSpeak={false} size="sm" />
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-purple-200 flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-300" />
                  <span>{t.auth.fullName} *</span>
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-purple-300 text-lg font-bold outline-none focus:border-brand-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-purple-200 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand-300" />
                  <span>{t.auth.phone} *</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit mobile number"
                  className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-purple-300 text-lg font-bold outline-none focus:border-brand-400"
                />
              </div>

              <button
                type="submit"
                disabled={!patientName.trim() || phone.trim().length < 10}
                className={`w-full py-4 font-black text-lg rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 ${
                  patientName.trim() && phone.trim().length >= 10
                    ? 'bg-brand-600 hover:bg-brand-500 text-white'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
              >
                <span>Continue to Appointment Booking</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: SELECT SYSTEM OF MEDICINE */}
        {kioskStep === 'SELECT_SYSTEM' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setKioskStep('WELCOME')}
                  className="p-2 text-purple-300 hover:text-white rounded-full hover:bg-white/10"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h3 className="text-2xl font-black">{t.kiosk.selectSystem}</h3>
                  <p className="text-sm text-purple-200">{t.medicineSystems.subtitle}</p>
                </div>
              </div>

              <VoiceButton
                textToSpeak={`${t.kiosk.selectSystem}. ${t.medicineSystems.subtitle}. Touch any medicine system to proceed.`}
                showSpeak={false}
                size="md"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {medicineOptions.map((opt) => {
                const Icon = opt.icon;
                const title = opt.title[language] || opt.title.en;
                const desc = opt.desc[language] || opt.desc.en;

                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSystemSelect(opt.id)}
                    className="p-6 rounded-3xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-brand-400 shadow-xl transition-all cursor-pointer flex flex-col justify-between gap-4 group active:scale-95"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${opt.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <VoiceButton textToSpeak={`${title}. ${desc}`} showSpeak={false} size="sm" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xl font-black">{title}</h4>
                      <p className="text-xs text-purple-200 font-medium leading-relaxed">{desc}</p>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <span className="py-2 px-4 rounded-xl bg-white/15 group-hover:bg-brand-500 font-bold text-xs flex items-center gap-1.5 transition-colors">
                        <span>Select Department</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: LIST DOCTORS IN DEPARTMENT */}
        {kioskStep === 'SELECT_DOCTOR' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setKioskStep('SELECT_SYSTEM')}
                  className="p-2 text-purple-300 hover:text-white rounded-full hover:bg-white/10"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black">{t.kiosk.selectDoctor}</h3>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-brand-500 text-white">
                      {selectedSystem.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-purple-200">{t.doctorSelect.kioskSubtitle}</p>
                </div>
              </div>

              <VoiceButton
                textToSpeak={`${t.kiosk.selectDoctor}. ${t.doctorSelect.kioskSubtitle}. Touch a doctor card to select consultation.`}
                showSpeak={false}
                size="md"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctorsInDepartment.map((doctor) => {
                const docName = doctor.name[language] || doctor.name.en;
                const dept = doctor.department[language] || doctor.department.en;
                const exp = doctor.experience[language] || doctor.experience.en;

                return (
                  <div
                    key={doctor.id}
                    onClick={() => handleDoctorSelect(doctor)}
                    className="p-6 rounded-3xl bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-brand-400 shadow-xl transition-all cursor-pointer flex flex-col justify-between gap-4 group active:scale-95"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center shrink-0 shadow-lg text-white">
                          <Stethoscope className="w-8 h-8" />
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-white">{docName}</h4>
                          <span className="text-xs font-extrabold text-brand-300">{doctor.qualification}</span>
                          <p className="text-xs text-purple-200 mt-1">{dept}</p>
                        </div>
                      </div>

                      <div onClick={(e) => e.stopPropagation()}>
                        <VoiceButton
                          textToSpeak={`${docName}, ${doctor.qualification}. ${dept}. ${doctor.roomNumber}. ${exp}.`}
                          showSpeak={false}
                          size="sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 p-3 bg-black/20 rounded-2xl text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          {doctor.roomNumber}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                          {t.doctorSelect.availableNow}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-purple-200 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {doctor.timings}
                        </span>
                        <span className="font-mono font-bold text-white">
                          {t.doctorSelect.currentToken}: #{doctor.currentToken}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="w-full py-3.5 bg-brand-600 group-hover:bg-brand-500 font-black rounded-2xl shadow-lg transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <span>Select Doctor &amp; Open Scanner</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: PHYSICAL HARDWARE SCANNER BED AREA (NO FILE UPLOAD) */}
        {kioskStep === 'SCAN_REPORTS' && (
          <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => (selectedDoctor ? setKioskStep('SELECT_DOCTOR') : setKioskStep('WELCOME'))}
                  className="p-2 text-purple-300 hover:text-white rounded-full hover:bg-white/10"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black">Document Scanner Glass Bed</h3>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-white flex items-center gap-1 shadow-md">
                      <ScanLine className="w-3.5 h-3.5" />
                      <span>Optical Sensor Active</span>
                    </span>
                  </div>
                  <p className="text-sm text-purple-200">
                    Place physical paper reports face down on the glass scanner bed below, then touch the Scan button.
                    {selectedDoctor ? ` Reports will be summarized for ${selectedDoctor.name[language] || selectedDoctor.name.en}.` : ''}
                  </p>
                </div>
              </div>

              <VoiceButton
                textToSpeak="Place your paper report or prescription on the scanner glass area, then touch the Scan button. The summary will be immediately sent to your doctor."
                showSpeak={false}
                size="md"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Physical Scanner Glass Bed Graphic & Action */}
              <div className="lg:col-span-7 space-y-4">
                {/* 1. Document Category Selection (Represents the physical paper placed on the bed) */}
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/20 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-200 block">
                    1. Select Document Placed on Scanner Bed:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DOCUMENT_CATEGORIES.map((cat) => {
                      const isSelected = selectedDocCategory === cat.id;
                      const title = cat.name[language] || cat.name.en;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          disabled={isScanning}
                          onClick={() => setSelectedDocCategory(cat.id)}
                          className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1 active:scale-95 ${
                            isSelected
                              ? 'bg-gradient-to-br from-brand-600 to-indigo-600 border-white text-white shadow-lg'
                              : 'bg-white/5 border-white/15 text-purple-200 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-lg">{cat.icon}</span>
                          <span className="text-xs font-bold leading-tight">{title}</span>
                          <span className="text-[10px] text-purple-300/80 truncate">{cat.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Visual Scanner Glass Bed */}
                <div className="relative rounded-3xl overflow-hidden border-4 border-slate-700 bg-slate-950 p-6 shadow-2xl min-h-[300px] flex flex-col justify-between">
                  {/* Glass Bed Reflections */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 pointer-events-none" />

                  {/* Corner Alignment Guides */}
                  <div className="absolute top-3 left-3 text-cyan-400 font-mono text-xl select-none">┌</div>
                  <div className="absolute top-3 right-3 text-cyan-400 font-mono text-xl select-none">┐</div>
                  <div className="absolute bottom-3 left-3 text-cyan-400 font-mono text-xl select-none">└</div>
                  <div className="absolute bottom-3 right-3 text-cyan-400 font-mono text-xl select-none">┘</div>

                  {/* Laser Beam Animation during Scanning */}
                  {isScanning && (
                    <div className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee] animate-pulse z-20 top-1/2 -translate-y-1/2" />
                  )}

                  {/* Glass Bed Header Status */}
                  <div className="flex items-center justify-between text-xs z-10">
                    <span className="font-mono text-cyan-300 flex items-center gap-1.5 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                      OPTICAL FLATBED 300 DPI
                    </span>
                    <span className="text-purple-300 font-mono text-[11px]">
                      PATIENT: {registeredId}
                    </span>
                  </div>

                  {/* Center Paper Placement Visual Target */}
                  <div className="my-6 border-2 border-dashed border-cyan-500/40 rounded-2xl p-6 bg-cyan-950/20 text-center space-y-2 z-10">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center mx-auto shadow-inner">
                      <ScanLine className={`w-6 h-6 ${isScanning ? 'animate-spin' : ''}`} />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-black text-white tracking-wide uppercase">
                        {isScanning ? 'Document Optical Scan in Progress...' : 'Scanner Glass Surface'}
                      </h4>
                      <p className="text-xs text-cyan-200/80">
                        {isScanning
                          ? scanStepText
                          : 'Place Paper Report / Prescription Face Down Against Glass Bed'}
                      </p>
                    </div>

                    {isScanning && (
                      <div className="w-full max-w-xs mx-auto bg-slate-800 rounded-full h-2.5 overflow-hidden mt-3 border border-cyan-500/30">
                        <div
                          className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-2.5 rounded-full transition-all duration-300 shadow-[0_0_10px_#38bdf8]"
                          style={{ width: `${scanProgress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* 3. Big Touch Scan Button */}
                  <div className="z-10">
                    <button
                      type="button"
                      disabled={isScanning}
                      onClick={handlePerformPhysicalScan}
                      className={`w-full py-4 font-black text-base rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 ${
                        isScanning
                          ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 cursor-wait'
                          : 'bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 shadow-cyan-500/30 font-black cursor-pointer'
                      }`}
                    >
                      {isScanning ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin text-cyan-300" />
                          <span>Scanning Paper Document... ({scanProgress}%)</span>
                        </>
                      ) : (
                        <>
                          <ScanLine className="w-6 h-6 text-slate-950" />
                          <span>TOUCH HERE TO SCAN PLACED REPORT</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Scanned Reports, Summary Preview & Doctor OPD Routing */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      <span>Scanned Documents ({scannedReports.length})</span>
                    </h4>
                    {scannedReports.length > 0 && (
                      <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        Ready for Doctor View
                      </span>
                    )}
                  </div>

                  {scannedReports.length === 0 ? (
                    <div className="p-8 text-center text-purple-300 bg-white/5 rounded-2xl border border-dashed border-white/15 space-y-2">
                      <ScanLine className="w-10 h-10 text-purple-300/50 mx-auto" />
                      <p className="text-sm font-bold text-white">No reports scanned yet.</p>
                      <p className="text-xs text-purple-300/80">
                        Place your paper sheet on the glass bed and touch the Scan button, or skip directly to consultation.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {scannedReports.map((report) => (
                        <div
                          key={report.id}
                          className="p-3.5 bg-white/10 rounded-2xl border border-emerald-500/40 text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black text-white text-sm truncate max-w-[180px]">
                              {report.reportTitle}
                            </span>
                            <span className="text-[10px] text-emerald-300 font-bold bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                              ✓ {report.extractedParameters.length} Params Extracted
                            </span>
                          </div>

                          <p className="text-[11px] text-purple-200">
                            {report.reportType} • {report.reportDate}
                          </p>

                          {/* Critical / Flagged findings alert */}
                          {report.criticalFindings.length > 0 && (
                            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                              <span className="text-[10px] font-black text-amber-300 flex items-center gap-1 uppercase">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Doctor Alert Flags:</span>
                              </span>
                              {report.criticalFindings.map((cf, idx) => (
                                <p key={idx} className="text-[11px] text-amber-200 font-semibold leading-tight">
                                  • {cf}
                                </p>
                              ))}
                            </div>
                          )}

                          {/* Action to view scanned paper document */}
                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={() => setPreviewModalReport(report)}
                              className="text-[11px] text-cyan-300 hover:text-cyan-200 font-bold flex items-center gap-1 underline"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Scanned Paper Document</span>
                            </button>
                            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Attached to Doctor OPD
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Direct Actions to Complete Consultation */}
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedDoctor) {
                        setKioskStep('PRE_CONSULT');
                      } else {
                        setKioskStep('SELECT_SYSTEM');
                      }
                    }}
                    className="w-full py-4 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>
                      {selectedDoctor ? 'Proceed to Pre-Consultation' : 'Proceed to Doctor Selection'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {selectedDoctor && (
                    <button
                      type="button"
                      onClick={handleDirectTokenIssue}
                      className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/20 shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Printer className="w-4 h-4 text-brand-300" />
                      <span>Get Instant OPD Token Slip (With Attached Reports)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: KIOSK PRE-CONSULTATION */}
        {kioskStep === 'PRE_CONSULT' && selectedDoctor && (
          <div className="bg-white rounded-3xl text-slate-900 p-2 md:p-6 shadow-2xl animate-fade-in">
            <AIQuestionScreen
              initialMedicineSystem={selectedSystem}
              initialDoctor={selectedDoctor}
              onComplete={handlePreConsultComplete}
              onDirectReportScan={(ctx) => {
                handlePreConsultComplete(ctx);
              }}
              onCancel={() => setKioskStep('SCAN_REPORTS')}
            />
          </div>
        )}

        {/* STEP 7: TOKEN ISSUED & CASE FILED (SUCCESS) */}
        {kioskStep === 'TOKEN_SUCCESS' && (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/20 max-w-xl mx-auto text-center space-y-6 animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                Hospital OPD Registration Token
              </span>
              <div className="text-6xl font-black text-amber-300 font-mono tracking-tight">
                #{issuedTokenNumber}
              </div>
              <p className="text-sm text-purple-200">
                Patient ID: <span className="font-mono font-bold text-white text-base">{registeredId}</span>
              </p>
            </div>

            {/* Doctor & Room Assignment Ticket */}
            <div className="p-5 bg-white/10 rounded-2xl border border-white/20 text-left space-y-2 text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-purple-300">Assigned Doctor:</span>
                <span className="font-bold text-white">
                  {selectedDoctor?.name[language] || selectedDoctor?.name.en}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-purple-300">Department:</span>
                <span className="font-bold text-white">{selectedSystem.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-purple-300">Consultation Room:</span>
                <span className="font-bold text-amber-300">{selectedDoctor?.roomNumber}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-purple-300">Clinical Triage:</span>
                <TriageBadge level={completedSummary?.recommendedTriage || 'PRIORITY'} size="sm" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-300">Attached Reports:</span>
                <span className="font-bold text-emerald-300 flex items-center gap-1">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>
                    {scannedReports.length > 0
                      ? `${scannedReports.length} Scanned Paper Document(s) Attached for Doctor`
                      : 'No paper reports scanned'}
                  </span>
                </span>
              </div>
            </div>

            <VoiceButton
              textToSpeak={`Token number ${issuedTokenNumber} confirmed. Please proceed to ${selectedDoctor?.roomNumber} to meet Doctor ${selectedDoctor?.name[language] || selectedDoctor?.name.en}. Your scanned paper reports are attached to your file.`}
              showSpeak={true}
              size="md"
              className="mx-auto"
            />

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-brand-500 hover:from-purple-600 hover:to-brand-600 text-white font-black text-lg rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Printer className="w-6 h-6" />
                <span>Print Physical OPD Token Slip</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setKioskStep('WELCOME');
                  setPatientName('');
                  setPhone('');
                  setScannedReports([]);
                }}
                className="py-3 px-6 rounded-xl text-xs font-semibold text-purple-300 hover:text-white flex items-center justify-center gap-1.5 mx-auto"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Finish &amp; Return to Kiosk Home</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scanned Document Preview Modal */}
      {previewModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-white/20 rounded-3xl max-w-2xl w-full p-6 text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-lg font-black">{previewModalReport.reportTitle}</h3>
                <p className="text-xs text-purple-300">
                  Scanned on Kiosk Optical Glass Bed • {previewModalReport.reportDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalReport(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200"
              >
                ✕
              </button>
            </div>

            {/* Document Image */}
            {previewModalReport.fileDataUri && (
              <div className="bg-white rounded-2xl p-2 border border-slate-200 overflow-hidden shadow-inner flex justify-center">
                <img
                  src={previewModalReport.fileDataUri}
                  alt={previewModalReport.reportTitle}
                  className="max-h-[60vh] object-contain rounded-xl"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => setPreviewModalReport(null)}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 font-bold rounded-2xl"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Kiosk Footer */}
      <div className="pt-4 border-t border-white/10 text-center text-xs text-purple-300 flex flex-wrap justify-between items-center gap-2">
        <span>AIHC Self-Service Terminal • Optical Glass Bed Document Scanner • Connected to Hospital OPD</span>
        <span>For Emergency Assistance, please press the Red Call Button or dial 108</span>
      </div>
    </div>
  );
};
