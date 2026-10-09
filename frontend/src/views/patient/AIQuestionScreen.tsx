import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { aiEngine, AIConversationContext } from '../../services/aiEngine';
import { voiceService } from '../../services/voiceService';
import { storageService } from '../../services/storageService';
import { notificationService } from '../../services/notificationService';
import { multilingualInterpreter } from '../../services/multilingualInterpreter';
import { BodyMap } from '../../components/bodyMap/BodyMap';
import { ReportUploader } from '../../components/ocr/ReportUploader';
import { VoiceButton } from '../../components/common/VoiceButton';
import { BodyMapSelection, MultilingualQAPairRecord, PreConsultationQuestionResponse, PreConsultationSessionResponse } from '../../types/ai';
import { MedicalReport } from '../../types/ocr';
import { ocrService } from '../../services/ocrService';
import { apiService } from '../../services/apiService';
import { MedicineSystem, Hospital, DoctorDirectoryEntry } from '../../types';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  AlertOctagon,
  Heart,
  Thermometer,
  Activity,
  Wind,
  Brain,
  User,
  AlertCircle,
  Compass,
  HelpCircle,
  Leaf,
  Building2,
  Stethoscope,
  Clock,
  Globe,
  MapPin,
  CheckCircle2,
  Check,
  Edit3,
  Calendar,
  Plus,
  Minus,
  FileText,
  UploadCloud,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';

interface AIQuestionScreenProps {
  initialMedicineSystem?: MedicineSystem;
  initialHospital?: Hospital;
  initialDoctor?: DoctorDirectoryEntry;
  consultationId?: string;
  onComplete: (context: AIConversationContext) => void;
  onDirectReportScan?: (context: AIConversationContext) => void;
  onCancel: () => void;
}

type PreConsultFlowStep = 'VISIT_PURPOSE' | 'EXPLAIN_CONDITION' | 'BODY_MAP' | 'QUESTIONS';

export const AIQuestionScreen: React.FC<AIQuestionScreenProps> = ({
  initialMedicineSystem = 'AYURVEDA',
  initialHospital,
  initialDoctor,
  consultationId: propConsultationId,
  onComplete,
  onDirectReportScan,
  onCancel,
}) => {
  const { language, setLanguage, t } = useTranslation();
  const { autoSpeakPrompts, speechRateMultiplier } = useAccessibility();
  const { triggerEmergency } = useEmergency();
  const { currentUser } = useAuth();

  const [consultationId] = useState<string>(
    () => propConsultationId || `CNS-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
  );

  // Workflow step state:
  // Step 1: EXPLAIN_CONDITION (Patient describes health condition in own words)
  // Step 2: ASK_AGE (Patient provides age immediately after describing condition)
  // Step 3: BODY_MAP (Body map shown to select affected area)
  // Step 4+: QUESTIONS (Relevant adaptive questions informing AI by selected body location & age)
  const [flowStep, setFlowStep] = useState<PreConsultFlowStep>('VISIT_PURPOSE');
  const [isRoutineTest, setIsRoutineTest] = useState<boolean>(false);
  const [selectedRoutineTest, setSelectedRoutineTest] = useState<string>('');
  const [patientAge, setPatientAge] = useState<number>(() => {
    if (currentUser?.age && typeof currentUser.age === 'number') return currentUser.age;
    const patId = currentUser?.patientId;
    if (patId) {
      const pat = storageService.getPatientById(patId);
      if (pat?.age) return pat.age;
    }
    return 30;
  });
  const [ageInputError, setAgeInputError] = useState<string>('');

  // Existing or Already Uploaded Reports for Routine Checkup Patients
  const [patientReports, setPatientReports] = useState<MedicalReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>('');

  useEffect(() => {
    const patId = currentUser?.patientId || 'PAT-0001';
    const rep1 = storageService.getReportsForPatient(patId);
    const rep2 = ocrService.getReportsForPatient(patId, true);
    const map = new Map<string, MedicalReport>();
    [...rep1, ...rep2].forEach((r) => {
      if (r && r.id) map.set(r.id, r);
    });
    const list = Array.from(map.values());
    setPatientReports(list);
    if (list.length > 0 && !selectedReportId) {
      setSelectedReportId(list[0].id);
    }
  }, [currentUser]);

  const handleReportProcessedInBodyMap = (newReport: MedicalReport) => {
    storageService.saveMedicalReport(newReport);
    ocrService.saveReport(newReport);
    setPatientReports((prev) => [newReport, ...prev.filter((r) => r.id !== newReport.id)]);
    setSelectedReportId(newReport.id);
  };

  const handleDeleteReport = (reportId: string) => {
    storageService.deleteMedicalReport(reportId);
    ocrService.deleteReport(reportId);
    setPatientReports((prev) => prev.filter((r) => r.id !== reportId));
    if (selectedReportId === reportId) {
      setSelectedReportId('');
    }
  };

  const handleCheckupReportFinish = () => {
    voiceService.stopSpeaking();
    voiceService.stopListening();

    const selectedReport = patientReports.find((r) => r.id === selectedReportId);
    const routineName = selectedRoutineTest || 'Routine Test Checkup';

    const summary = aiEngine.generateSummary(context);
    summary.chiefComplaint = `Regular Routine Test Checkup: ${routineName}`;
    summary.recommendedTriage = 'NORMAL';
    summary.symptomsList = [
      `Primary Purpose: Routine Chronic Disease / Lab Test Monitoring (${routineName})`,
      `Patient Age: ${context.age || patientAge} years`,
      selectedReport
        ? `Attached Report: ${selectedReport.reportTitle} (${selectedReport.reportDate}) - ${selectedReport.extractedParameters?.length || 0} lab values evaluated`
        : `Attached Report: Patient has medical reports on file for consultation`,
    ];
    storageService.saveAISummary(summary);

    const appointments = storageService.getAppointmentsForPatient(context.patientId);
    if (appointments.length > 0) {
      storageService.updateAppointmentPreConsultation(appointments[0].id, 'COMPLETED', 'NORMAL');
    }

    notificationService.intimatePreConsultationCompleted({
      patientId: context.patientId,
      patientName: context.patientName,
      triageLevel: 'NORMAL',
      medicineSystem: context.medicineSystem,
    });

    onComplete(context);
  };

  const [context, setContext] = useState<AIConversationContext>(() => {
    const regAge = currentUser?.age || (currentUser?.patientId ? storageService.getPatientById(currentUser.patientId)?.age : undefined) || 30;
    const regSex = currentUser?.sex || (currentUser?.patientId ? storageService.getPatientById(currentUser.patientId)?.sex : undefined) || 'FEMALE';
    return {
      patientId: currentUser.patientId || 'PAT-0001',
      patientName: currentUser.name,
      consultationId,
      medicineSystem: initialMedicineSystem,
      selectedHospitalId: initialHospital?.id,
      selectedHospitalName: initialHospital?.name,
      selectedDoctorId: initialDoctor?.id,
      selectedDoctorName: initialDoctor?.name,
      selectedDoctorQualification: initialDoctor?.qualification,
      selectedDoctorRoom: initialDoctor?.roomNumber,
      age: regAge,
      ageGroup: regAge < 18 ? 'CHILD' : 'ADULT',
      sex: regSex as any,
      chiefComplaint: '',
      bodySelections: [],
      duration: '',
      severity: 5,
      triggers: [],
      associatedSymptoms: [],
      ayushAssessment: {},
      answers: [],
      redFlags: [],
    };
  });

  // Current answer state for active step
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [selectedOptionText, setSelectedOptionText] = useState<string>('');
  const [selectedOptionLocalized, setSelectedOptionLocalized] = useState<{ en: string; ta: string; hi: string } | null>(null);
  const [typedAnswer, setTypedAnswer] = useState<string>('');

  // Selected Region in Step 2 Body Map
  const [selectedRegionName, setSelectedRegionName] = useState<string>('');

  // Emergency state
  const [detectedEmergency, setDetectedEmergency] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // AYUSH 1,875 Dataset Adaptive Session state
  const [ayushSession, setAyushSession] = useState<PreConsultationSessionResponse | null>(null);
  const [adaptiveQuestion, setAdaptiveQuestion] = useState<PreConsultationQuestionResponse | null>(null);

  // Generative AI Adaptive Question determination
  const currentQuestion = flowStep === 'QUESTIONS' ? aiEngine.getNextAdaptiveQuestion(context) : null;
  const { progressPercent } = aiEngine.evaluateSufficiency(context);

  // Ensure background speech is stopped when component mounts/unmounts
  useEffect(() => {
    voiceService.stopSpeaking();
    voiceService.stopListening();
    return () => {
      voiceService.stopSpeaking();
      voiceService.stopListening();
    };
  }, []);

  // If in QUESTIONS phase and no more questions needed, complete automatically
  useEffect(() => {
    if (flowStep === 'QUESTIONS' && !currentQuestion && !adaptiveQuestion && context.answers.length > 0) {
      onComplete(context);
    }
  }, [flowStep, currentQuestion, adaptiveQuestion]);

  const handleAdaptiveOptionClick = (optId: string, optLocalized: any, optLabel: string) => {
    const locObj = optLocalized || { en: optLabel, ta: optLabel, hi: optLabel };
    handleOptionSelect({
      id: optId,
      label: locObj,
    });
    setTimeout(() => {
      saveAnswerAndProceed(optLabel, 'TOUCH_SELECTION');
    }, 280);
  };

  const handleClientOptionClick = (opt: any) => {
    handleOptionSelect(opt);
    setTimeout(() => {
      const text = opt.label[language] || opt.label.en;
      saveAnswerAndProceed(text, 'TOUCH_SELECTION');
    }, 280);
  };

  const handleOptionSelect = (opt: {
    id: string;
    label: { en: string; ta: string; hi: string };
    subLabel?: { en: string; ta: string; hi: string };
    isEmergencyTrigger?: boolean;
  }) => {
    const text = opt.label[language] || opt.label.en;
    setSelectedOptionId(opt.id);
    setSelectedOptionText(text);
    setTypedAnswer(text);
    setSelectedOptionLocalized(opt.label);

    if (opt.isEmergencyTrigger) {
      setDetectedEmergency(text);
      triggerEmergency(
        context.patientId,
        context.patientName,
        `Emergency symptom reported: ${text}`
      );
    }
  };

  // Synchronize selected option label if language switches during question
  useEffect(() => {
    if (selectedOptionLocalized && selectedOptionId) {
      const translated = selectedOptionLocalized[language] || selectedOptionLocalized.en;
      if (translated) {
        setSelectedOptionText(translated);
        setTypedAnswer(translated);
      }
    }
  }, [language]);

  // Dynamic question translation helper
  const getActiveQuestionText = () => {
    if (adaptiveQuestion) {
      if (language === 'ta' && adaptiveQuestion.tamilText) return adaptiveQuestion.tamilText;
      if (language === 'hi' && adaptiveQuestion.hindiText) return adaptiveQuestion.hindiText;
      if (language === 'en' && adaptiveQuestion.englishText) return adaptiveQuestion.englishText;
      return adaptiveQuestion.text;
    }
    return currentQuestion?.text[language] || currentQuestion?.text.en || '';
  };

  // Routine / Regular Test options (Sugar, Blood Pressure, Thyroid, etc.)
  const routineTestOptions = [
    {
      id: 'sugar_diabetes',
      icon: 'Activity',
      badge: '🩸 DIABETES / SUGAR',
      title: {
        en: 'Blood Sugar / Diabetes Test',
        ta: 'ரத்த சர்க்கரை / நீரிழிவு பரிசோதனை',
        hi: 'ब्लड शुगर / मधुमेह टेस्ट',
      },
      desc: {
        en: 'Fasting Blood Glucose, Post-Prandial, or HbA1c checkup',
        ta: 'பாஸ்டிங் சர்க்கரை, பிபி அல்லது HbA1c ஆய்வு',
        hi: 'फास्टिंग ब्लड ग्लूकोज, पीपी या एचबीए1सी जांच',
      },
    },
    {
      id: 'blood_pressure',
      icon: 'Heart',
      badge: '🫀 BP / HYPERTENSION',
      title: {
        en: 'Blood Pressure (BP / Hypertension)',
        ta: 'ரத்த அழுத்தம் (BP / உயர் ரத்த அழுத்தம்)',
        hi: 'ब्लड प्रेशर (बीपी / उच्च रक्तचाप)',
      },
      desc: {
        en: 'Routine arterial pressure, pulse rate & cardiovascular check',
        ta: 'வழக்கமான ரத்த அழுத்த அளவு மற்றும் நாடித்துடிப்பு ஆய்வு',
        hi: 'नियमित बीपी एवं हृदय गति निगरानी',
      },
    },
    {
      id: 'thyroid_tft',
      icon: 'Sparkles',
      badge: '🦋 THYROID (TFT)',
      title: {
        en: 'Thyroid Function Test (TSH / T3 / T4)',
        ta: 'தைராய்டு பரிசோதனை (TSH / T3 / T4)',
        hi: 'थायराइड टेस्ट (टीशएच / टी3 / टी4)',
      },
      desc: {
        en: 'Thyroid hormonal evaluation and dosage monitoring',
        ta: 'தைராய்டு ஹார்மோன் அளவு மற்றும் மருந்து அளவு மதிப்பாய்வு',
        hi: 'थायराइड हार्मोनल स्तर एवं दवा की समीक्षा',
      },
    },
    {
      id: 'lipid_cholesterol',
      icon: 'Thermometer',
      badge: '🧪 LIPID / CHOLESTEROL',
      title: {
        en: 'Cholesterol / Lipid Profile',
        ta: 'கொலஸ்ட்ரால் / கொழுப்பு அளவு பரிசோதனை',
        hi: 'कोलेस्ट्रॉल / लिपिड प्रोफाइल जांच',
      },
      desc: {
        en: 'Total Cholesterol, Triglycerides, HDL & LDL review',
        ta: 'முழு கொழுப்பு, ட்ரைகிளிசரைடு மற்றும் எச்.டி.எல் ஆய்வு',
        hi: 'कोलेस्ट्रॉल, ट्राइग्लिसराइड एवं एचडीएल-एलडीएल जांच',
      },
    },
    {
      id: 'cbc_blood_count',
      icon: 'Activity',
      badge: '🔬 CBC / BLOOD TEST',
      title: {
        en: 'Complete Blood Count (CBC) / Routine Lab',
        ta: 'ரத்த அணுக்கள் பரிசோதனை (CBC / ஆய்வகம்)',
        hi: 'सीबीसी / रूटीन रक्त एवं लैब टेस्ट',
      },
      desc: {
        en: 'Hemoglobin, WBC, Platelets, or routine blood test',
        ta: 'ஹீமோகுளோபின், வெள்ளை அணுக்கள், அல்லது சிறுநீர் பரிசோதனை',
        hi: 'हीमोग्लोबिन, डब्ल्यूबीसी, प्लेटलेट्स या मूत्र जांच',
      },
    },
    {
      id: 'general_checkup',
      icon: 'Compass',
      badge: '📋 GENERAL CHECKUP',
      title: {
        en: 'General Routine Health Checkup',
        ta: 'பொதுவான வழக்கமான உடல் பரிசோதனை',
        hi: 'सामान्य नियमित स्वास्थ्य चेकअप',
      },
      desc: {
        en: 'Periodic preventive wellness screening & follow-up test',
        ta: 'காலமுறை நல்வாழ்வுப் பரிசோதனை மற்றும் மறுபரிசீலனை',
        hi: 'आवधिक स्वास्थ्य परीक्षण एवं अनुवर्ती परामर्श',
      },
    },
  ];

  const handleRoutineTestSelect = (testTitle: string) => {
    setIsRoutineTest(true);
    setSelectedRoutineTest(testTitle);

    const routineName =
      testTitle === 'DIABETES'
        ? 'Diabetes / Blood Sugar Test (ரத்த சர்க்கரை பரிசோதனை / शुगर टेस्ट)'
        : testTitle === 'BP'
        ? 'Blood Pressure / Hypertension Check (ரத்த அழுத்தம் / बीपी जांच)'
        : testTitle === 'THYROID'
        ? 'Thyroid Profile (தைராய்டு பரிசோதனை / थायराइड जांच)'
        : testTitle === 'LIPID'
        ? 'Lipid Profile / Cholesterol (கொலஸ்ட்ரால் / लिपिड प्रोफाइल)'
        : testTitle === 'CBC'
        ? 'Complete Blood Count (முழு ரத்த பரிசோதனை / सीबीसी)'
        : testTitle === 'OTHER_TEST'
        ? 'Routine Laboratory Checkup (வழக்கமான ஆய்வக பரிசோதனை / रूटीन टेस्ट)'
        : testTitle;

    const registeredAge = context.age || patientAge || 30;

    const interpretationPurpose = multilingualInterpreter.interpretResponse(
      routineName,
      'Q_VISIT_PURPOSE',
      context.medicineSystem
    );
    const interpretationAge = multilingualInterpreter.interpretResponse(
      `${registeredAge} years`,
      'Q_PATIENT_AGE',
      context.medicineSystem
    );

    const updatedContext: AIConversationContext = {
      ...context,
      age: registeredAge,
      ageGroup: registeredAge < 18 ? 'CHILD' : 'ADULT',
      isRoutineTest: true,
      routineTestCategory: testTitle,
      chiefComplaint: `Routine Checkup: ${routineName}`,
      chiefComplaintLocalized: {
        en: `Regular Health Test Checkup: ${testTitle}`,
        ta: `வழக்கமான பரிசோதனை: ${testTitle}`,
        hi: `नियमित स्वास्थ्य जांच: ${testTitle}`,
      },
      answers: [
        {
          questionId: 'Q_VISIT_PURPOSE',
          questionText: 'Primary Purpose of Medical Visit',
          englishQuestion: 'Primary Purpose of Medical Visit: Regular Test Checkup',
          tamilQuestion: 'மருத்துவ வருகையின் காரணம்: வழக்கமான பரிசோதனை',
          hindiQuestion: 'परामर्श का मुख्य कारण: नियमित स्वास्थ्य जांच',
          answerText: routineName,
          answerLocalized: { en: routineName, ta: routineName, hi: routineName },
          detectedLanguage: language,
          structuredInterpretation: interpretationPurpose.structured,
        },
        {
          questionId: 'Q_PATIENT_AGE',
          questionText: 'Patient Age',
          englishQuestion: 'Patient Age (From Profile)',
          tamilQuestion: 'நோயாளியின் வயது (பதிவிலிருந்து)',
          hindiQuestion: 'रोगी की आयु (प्रोफाइल से)',
          answerText: `${registeredAge} years`,
          answerLocalized: { en: `${registeredAge} years`, ta: `${registeredAge} வயது`, hi: `${registeredAge} वर्ष` },
          detectedLanguage: language,
          structuredInterpretation: interpretationAge.structured,
        },
      ],
    };

    setContext(updatedContext);

    // Save QA records using registered profile age without asking the patient again
    storageService.saveQAPair({
      id: `QA-${Date.now()}-PURPOSE`,
      patientId: context.patientId,
      consultationId: context.consultationId || consultationId,
      medicineSystem: context.medicineSystem,
      questionId: 'Q_VISIT_PURPOSE',
      questionCategory: 'CHIEF_COMPLAINT',
      originalQuestion: 'Primary Purpose of Consultation',
      englishQuestion: 'Primary Purpose of Medical Visit',
      tamilQuestion: 'வருகையின் முதன்மைக் காரணம்',
      hindiQuestion: 'परामर्श का मुख्य कारण',
      patientOriginalResponse: routineName,
      detectedResponseLanguage: language,
      structuredInterpretation: interpretationPurpose.structured,
      timestamp: new Date().toISOString(),
      inputMethod: 'TOUCH_SELECTION',
    });

    storageService.saveQAPair({
      id: `QA-${Date.now()}-AGE`,
      patientId: context.patientId,
      consultationId: context.consultationId || consultationId,
      medicineSystem: context.medicineSystem,
      questionId: 'Q_PATIENT_AGE',
      questionCategory: 'AGE',
      originalQuestion: 'Patient Age (From Profile)',
      englishQuestion: 'Patient Age (From Profile)',
      tamilQuestion: 'நோயாளியின் வயது (பதிவிலிருந்து)',
      hindiQuestion: 'रोगी की आयु (प्रोफाइल से)',
      patientOriginalResponse: `${registeredAge} years`,
      detectedResponseLanguage: language,
      structuredInterpretation: interpretationAge.structured,
      timestamp: new Date().toISOString(),
      inputMethod: 'TOUCH_SELECTION',
    });

    // Advance directly to the report upload & review step (replaces Body Map for checkup patients)
    setTimeout(() => {
      setFlowStep('BODY_MAP');
    }, 250);
  };

  const handleNewIllnessSelect = () => {
    setIsRoutineTest(false);
    setSelectedRoutineTest('');
    setContext(prev => ({
      ...prev,
      isRoutineTest: false,
      routineTestCategory: undefined,
    }));
    setFlowStep('EXPLAIN_CONDITION');
  };

  // 9 Simple Large Body Regions
  const bodyRegionsList = [
    { id: 'head', name: t.aiPreConsultation.bodyRegions.head, icon: 'Brain' },
    { id: 'neck', name: t.aiPreConsultation.bodyRegions.neck, icon: 'User' },
    { id: 'chest', name: t.aiPreConsultation.bodyRegions.chest, icon: 'Heart' },
    { id: 'abdomen', name: t.aiPreConsultation.bodyRegions.abdomen, icon: 'Activity' },
    { id: 'back', name: t.aiPreConsultation.bodyRegions.back, icon: 'Compass' },
    { id: 'arm', name: t.aiPreConsultation.bodyRegions.arm, icon: 'User' },
    { id: 'hand', name: t.aiPreConsultation.bodyRegions.hand, icon: 'Activity' },
    { id: 'leg', name: t.aiPreConsultation.bodyRegions.leg, icon: 'User' },
    { id: 'foot', name: t.aiPreConsultation.bodyRegions.foot, icon: 'Compass' },
  ];

  // Handler for Region Selection in Step 3 Body Map
  const handleRegionSelect = (regionName: string, regionId: string) => {
    setSelectedRegionName(regionName);
    const bodySel: BodyMapSelection = {
      regionId: regionId as any,
      regionName,
      side: 'FRONT',
      painSeverity: context.severity || 5,
    };
    setContext(prev => ({
      ...prev,
      bodySelections: [bodySel],
    }));
  };

  // Step 1: Submit Condition Description -> Move directly to Body Map (Registered Age reused)
  const handleStep1ConditionSubmit = () => {
    const text = typedAnswer.trim() || t.aiPreConsultation.quickComplaints.other;
    if (!text) return;

    voiceService.stopSpeaking();
    voiceService.stopListening();

    const flags = aiEngine.detectRedFlags(text);
    if (flags.length > 0) {
      setDetectedEmergency(flags.join(', '));
      triggerEmergency(context.patientId, context.patientName, `Emergency symptom: ${flags.join(', ')}`);
    }

    // Save chief complaint to context
    setContext(prev => ({
      ...prev,
      chiefComplaint: text,
      chiefComplaintLocalized: { en: text, ta: text, hi: text },
      redFlags: Array.from(new Set([...prev.redFlags, ...flags])),
    }));

    // Advance directly to Body Map without asking age again
    setFlowStep('BODY_MAP');
  };

  // Step 2: Submit Body Map -> Move to Step 3 Adaptive Questions
  const handleStep2BodyMapSubmit = async () => {
    // If no body region selected, pick default abdomen or general
    const defaultRegion = bodyRegionsList[3]; // Abdomen
    const finalSelections: BodyMapSelection[] =
      context.bodySelections.length > 0
        ? context.bodySelections
        : [
            {
              regionId: defaultRegion.id as any,
              regionName: defaultRegion.name,
              side: 'FRONT',
              painSeverity: context.severity || 5,
            },
          ];

    voiceService.stopSpeaking();
    voiceService.stopListening();

    const complaintText = context.chiefComplaint || typedAnswer.trim() || t.aiPreConsultation.quickComplaints.other;

    const interpretation = multilingualInterpreter.interpretResponse(
      complaintText,
      'Q_CHIEF_COMPLAINT',
      context.medicineSystem
    );

    const qaRecord: MultilingualQAPairRecord = {
      id: `QA-${Date.now()}-01`,
      patientId: context.patientId,
      consultationId: context.consultationId || consultationId,
      medicineSystem: context.medicineSystem,
      questionId: 'Q_CHIEF_COMPLAINT',
      questionCategory: 'CHIEF_COMPLAINT',
      originalQuestion: t.aiPreConsultation.tellUsProblem,
      englishQuestion: 'Please tell us what problem you are experiencing.',
      tamilQuestion: 'உங்களுக்கு உள்ள பிரச்சனையைத் தயவுசெய்து கூறவும்.',
      hindiQuestion: 'कृपया बताएं कि உங்களுக்கு என்ன பிரச்சனை உள்ளது.',
      patientOriginalResponse: complaintText,
      detectedResponseLanguage: interpretation.detectedLanguage,
      structuredInterpretation: interpretation.structured,
      timestamp: new Date().toISOString(),
      inputMethod: 'TEXT',
    };
    storageService.saveQAPair(qaRecord);

    const updatedContext: AIConversationContext = {
      ...context,
      bodySelections: finalSelections,
      chiefComplaint: complaintText,
      chiefComplaintLocalized: { en: complaintText, ta: complaintText, hi: complaintText },
      answers: [
        {
          questionId: 'Q_CHIEF_COMPLAINT',
          questionText: t.aiPreConsultation.tellUsProblem,
          englishQuestion: 'Please tell us what problem you are experiencing.',
          tamilQuestion: 'உங்களுக்கு உள்ள பிரச்சனையைத் தயவுசெய்து கூறவும்.',
          hindiQuestion: 'कृपया बताएं कि உங்களுக்கு என்ன பிரச்சனை உள்ளது.',
          answerText: complaintText,
          answerLocalized: { en: complaintText, ta: complaintText, hi: complaintText },
          detectedLanguage: interpretation.detectedLanguage,
          structuredInterpretation: interpretation.structured,
        },
      ],
    };

    if (interpretation.structured.duration) {
      updatedContext.duration = interpretation.structured.duration;
    }

    setContext(updatedContext);
    setTypedAnswer('');
    setSelectedOptionId('');
    setSelectedOptionText('');

    // Advance to Step 3: Adaptive AI Questions
    setFlowStep('QUESTIONS');

    // Initiate AYUSH Adaptive Pre-Consultation Session with Backend Engine
    const langParam = language === 'ta' ? 'Tamil' : language === 'hi' ? 'Hindi' : 'English';
    let sysParam = 'Ayurveda';
    if (context.medicineSystem === 'SIDDHA') sysParam = 'Siddha';
    else if (context.medicineSystem === 'UNANI') sysParam = 'Unani';
    else if (context.medicineSystem === 'YOGA_NATUROPATHY') sysParam = 'Yoga & Naturopathy';
    else if (context.medicineSystem === 'HOMOEOPATHY' || context.medicineSystem === 'ALLOPATHY_HOMEOPATHY') sysParam = 'Homoeopathy';

    try {
      const startRes = await apiService.startPreConsultation({
        patientId: context.patientId,
        appointmentId: context.consultationId,
        language: langParam,
        medicalSystem: sysParam,
        chiefComplaint: complaintText,
        age: context.age || patientAge || 30,
        gender: context.sex === 'MALE' ? 'Male' : context.sex === 'FEMALE' ? 'Female' : 'Other',
        severity: (context.severity || 5) >= 7 ? 'Severe' : (context.severity || 5) >= 4 ? 'Moderate' : 'Mild',
        duration: context.duration || '3 days',
        bodySelections: finalSelections,
      });

      if (startRes.isEmergency) {
        setDetectedEmergency(startRes.emergencyReason || 'Emergency condition detected');
        triggerEmergency(context.patientId, context.patientName, startRes.emergencyReason || 'Emergency detected');
      }

      setAyushSession(startRes);
      if (startRes.nextQuestion) {
        setAdaptiveQuestion(startRes.nextQuestion);
      }
    } catch (err) {
      console.warn('AYUSH adaptive start preconsultation fallback to client engine:', err);
    }
  };

  // Step 4+: Submit Adaptive Question Answer
  const saveAnswerAndProceed = async (
    customAnswer?: string,
    inputMethod: 'VOICE' | 'TOUCH_SELECTION' | 'TEXT' = selectedOptionId ? 'TOUCH_SELECTION' : 'TEXT'
  ) => {
    if (isSubmitting) return;

    const activeQ = adaptiveQuestion || currentQuestion;
    if (!activeQ) {
      onComplete(context);
      return;
    }

    // Determine candidate answer
    let answer = (customAnswer || selectedOptionText || typedAnswer || '').trim();

    // If answer is empty, intelligently select first option or sensible default
    if (!answer && currentQuestion?.inputType !== 'BODY_MAP') {
      if (adaptiveQuestion?.options && adaptiveQuestion.options.length > 0) {
        const firstOpt: any = adaptiveQuestion.options[0];
        const optLocalized = typeof firstOpt === 'object' && firstOpt?.localizedLabel
          ? firstOpt.localizedLabel
          : (typeof firstOpt === 'object' && typeof firstOpt?.label === 'object' ? firstOpt.label : null);
        answer = optLocalized
          ? (optLocalized[language] || optLocalized.en || optLocalized.ta || optLocalized.hi)
          : (typeof firstOpt === 'object' ? (firstOpt.label || firstOpt.id) : String(firstOpt));
      } else if (currentQuestion?.options && currentQuestion.options.length > 0) {
        const firstOpt = currentQuestion.options[0];
        answer = firstOpt.label[language] || firstOpt.label.en;
      } else if (currentQuestion?.inputType === 'SEVERITY_SLIDER') {
        answer = `${context.severity || 5} / 10`;
      } else {
        answer = language === 'ta'
          ? 'இயல்பான நிலை / தனித்த அறிகுறிகள் இல்லை'
          : language === 'hi'
          ? 'सामान्य स्थिति / कोई विशेष लक्षण नहीं'
          : 'Normal / No specific symptoms';
      }
    }

    setIsSubmitting(true);
    voiceService.stopSpeaking();
    voiceService.stopListening();

    const localized = selectedOptionLocalized || {
      en: answer,
      ta: answer,
      hi: answer,
    };

    const currentQId = adaptiveQuestion?.id || currentQuestion?.id || `Q_${context.answers.length + 1}`;
    const questionText = getActiveQuestionText() || adaptiveQuestion?.text || (currentQuestion ? (currentQuestion.text[language] || currentQuestion.text.en) : 'Question');

    const interpretation = multilingualInterpreter.interpretResponse(
      answer,
      currentQId,
      context.medicineSystem
    );

    const flags = aiEngine.detectRedFlags(answer);
    if (flags.length > 0) {
      setDetectedEmergency(flags.join(', '));
      triggerEmergency(context.patientId, context.patientName, `Emergency symptom: ${flags.join(', ')}`);
    }

    const qaRecord: MultilingualQAPairRecord = {
      id: `QA-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      patientId: context.patientId,
      consultationId: context.consultationId || consultationId,
      medicineSystem: context.medicineSystem,
      questionId: currentQId,
      questionCategory: adaptiveQuestion?.questionType || currentQuestion?.category || 'CLINICAL',
      originalQuestion: questionText,
      englishQuestion: adaptiveQuestion?.englishText || (currentQuestion ? currentQuestion.text.en : questionText),
      tamilQuestion: adaptiveQuestion?.tamilText || (currentQuestion ? currentQuestion.text.ta : questionText),
      hindiQuestion: adaptiveQuestion?.hindiText || (currentQuestion ? currentQuestion.text.hi : questionText),
      patientOriginalResponse: answer,
      detectedResponseLanguage: interpretation.detectedLanguage,
      structuredInterpretation: interpretation.structured,
      timestamp: new Date().toISOString(),
      inputMethod,
    };
    storageService.saveQAPair(qaRecord);

    const updatedContext: AIConversationContext = {
      ...context,
      answers: [
        ...context.answers,
        {
          questionId: currentQId,
          questionText,
          englishQuestion: qaRecord.englishQuestion,
          tamilQuestion: qaRecord.tamilQuestion,
          hindiQuestion: qaRecord.hindiQuestion,
          answerText: answer || context.bodySelections.map(b => b.regionName).join(', '),
          answerLocalized: localized,
          detectedLanguage: interpretation.detectedLanguage,
          structuredInterpretation: interpretation.structured,
        },
      ],
      redFlags: Array.from(new Set([...context.redFlags, ...flags])),
    };

    if (interpretation.structured.duration) {
      updatedContext.duration = interpretation.structured.duration;
    }
    if (interpretation.structured.painCharacter) {
      updatedContext.character = interpretation.structured.painCharacter;
    }
    if (interpretation.structured.severity) {
      updatedContext.severity = interpretation.structured.severity;
    }

    setContext(updatedContext);

    // Reset step inputs
    setSelectedOptionId('');
    setSelectedOptionText('');
    setSelectedOptionLocalized(null);
    setTypedAnswer('');

    const currentStepNum = adaptiveQuestion?.stepNumber || (context.answers.length + 1);
    const isLastQuestion = currentStepNum >= 4 || updatedContext.answers.length >= 4 || context.answers.length >= 3;

    // If backend AYUSH session is active, submit answer to backend adaptive engine
    if (ayushSession) {
      try {
        const ansRes = await apiService.answerPreConsultation({
          sessionId: ayushSession.sessionId,
          questionId: currentQId,
          patientAnswer: answer,
          answerCategory: 'patient_response',
        });

        if (ansRes.isEmergency) {
          setDetectedEmergency(ansRes.emergencyReason || 'Emergency symptom detected');
          triggerEmergency(context.patientId, context.patientName, ansRes.emergencyReason || 'Emergency detected');
          setIsSubmitting(false);
          return;
        }

        setAyushSession(ansRes);

        if (isLastQuestion || ansRes.isSufficient || !ansRes.nextQuestion) {
          setAdaptiveQuestion(null);
          setIsSubmitting(false);
          onComplete(updatedContext);
          return;
        } else {
          setAdaptiveQuestion(ansRes.nextQuestion);
          setIsSubmitting(false);
          return;
        }
      } catch (err) {
        console.warn('Backend adaptive answer warning, continuing with client flow:', err);
      }
    }

    // Direct completion if last question
    if (isLastQuestion) {
      setAdaptiveQuestion(null);
      setIsSubmitting(false);
      onComplete(updatedContext);
      return;
    }

    // Fallback path
    const nextQ = aiEngine.getNextAdaptiveQuestion(updatedContext);
    if (!nextQ || updatedContext.answers.length >= 4) {
      setAdaptiveQuestion(null);
      setIsSubmitting(false);
      onComplete(updatedContext);
    } else {
      setAdaptiveQuestion(null);
      setIsSubmitting(false);
    }
  };

  // Back Button Navigation
  const handleBack = () => {
    if (flowStep === 'VISIT_PURPOSE') {
      onCancel();
    } else if (flowStep === 'EXPLAIN_CONDITION') {
      setFlowStep('VISIT_PURPOSE');
    } else if (flowStep === 'BODY_MAP') {
      if (isRoutineTest) {
        setFlowStep('VISIT_PURPOSE');
      } else {
        setFlowStep('EXPLAIN_CONDITION');
      }
    } else if (flowStep === 'QUESTIONS') {
      if (context.answers.length > 1) {
        // Pop last question
        const newAnswers = [...context.answers];
        newAnswers.pop();
        setContext(prev => ({
          ...prev,
          answers: newAnswers,
        }));
      } else {
        // Return to Body Map selection
        const newAnswers = [...context.answers];
        newAnswers.pop();
        setContext(prev => ({
          ...prev,
          answers: newAnswers,
        }));
        setFlowStep('BODY_MAP');
      }
    }
  };

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Heart': return Heart;
      case 'Thermometer': return Thermometer;
      case 'Activity': return Activity;
      case 'Wind': return Wind;
      case 'Brain': return Brain;
      case 'User': return User;
      case 'AlertCircle': return AlertCircle;
      case 'Compass': return Compass;
      case 'Leaf': return Leaf;
      case 'Sparkles': return Sparkles;
      case 'Clock': return Clock;
      default: return HelpCircle;
    }
  };

  const doctorDisplayName = context.selectedDoctorName
    ? (context.selectedDoctorName[language] || context.selectedDoctorName.en)
    : undefined;

  const hospitalDisplayName = context.selectedHospitalName
    ? (context.selectedHospitalName[language] || context.selectedHospitalName.en)
    : undefined;

  // Calculate visual progress across all stages
  const getOverallProgress = () => {
    if (flowStep === 'VISIT_PURPOSE') return 15;
    if (flowStep === 'EXPLAIN_CONDITION') return 35;
    if (flowStep === 'BODY_MAP') return isRoutineTest ? 85 : 60;
    return Math.max(70, progressPercent);
  };

  const currentStepNum = adaptiveQuestion?.stepNumber || (context.answers.length + 1);
  const isLastQuestion = currentStepNum >= 4 || context.answers.length >= 3;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 animate-fade-in space-y-6">
      {/* Top Bar: Doctor info, Language Switcher, Back Button */}
      <div className="bg-white rounded-3xl p-4 md:p-6 border border-slate-100 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <span className="text-xs md:text-sm font-extrabold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>{language === 'ta' ? 'ஆரம்பப் பரிசோதனை' : language === 'hi' ? 'पूर्व-परामर्श' : 'Pre-Consultation'}</span>
            </span>
          </div>

          {/* In-Session Single Language Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5 hidden sm:inline" />
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${
                language === 'en' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('ta')}
              className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${
                language === 'ta' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              தமிழ்
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${
                language === 'hi' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>

        {/* Selected Clinical Facility & Doctor */}
        {(hospitalDisplayName || doctorDisplayName) && (
          <div className="flex flex-wrap items-center gap-3 p-2.5 bg-slate-50 rounded-2xl text-xs text-slate-600 border border-slate-100">
            {hospitalDisplayName && (
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Building2 className="w-3.5 h-3.5 text-brand-600" />
                <span className="truncate max-w-[220px]">{hospitalDisplayName}</span>
              </div>
            )}
            {doctorDisplayName && (
              <div className="flex items-center gap-1.5 font-bold text-brand-700">
                <Stethoscope className="w-3.5 h-3.5 text-brand-600" />
                <span>{doctorDisplayName}</span>
                {context.selectedDoctorRoom && (
                  <span className="text-[11px] text-slate-500 font-normal">({context.selectedDoctorRoom})</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Multi-Step Progress Bar */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-[11px] font-bold text-slate-400 px-1">
            <span>
              {flowStep === 'VISIT_PURPOSE' && (language === 'ta' ? '1. வருகையின் நோக்கம்' : language === 'hi' ? '1. परामर्श का उद्देश्य' : '1. Purpose of Visit')}
              {flowStep === 'EXPLAIN_CONDITION' && (language === 'ta' ? '2. உடல்நிலை விளக்கம்' : language === 'hi' ? '2. स्वास्थ्य विवरण' : '2. Explain Health Condition')}
              {flowStep === 'BODY_MAP' && (isRoutineTest
                ? (language === 'ta' ? '2. மருத்துவ அறிக்கைகள்' : language === 'hi' ? '2. रिपोर्ट अपलोड एवं समीक्षा' : '2. Medical Reports')
                : (language === 'ta' ? '3. பாதிக்கப்பட்ட பகுதி' : language === 'hi' ? '3. प्रभावित भाग' : '3. Select Affected Body Area'))}
              {flowStep === 'QUESTIONS' && (language === 'ta' ? '4. மருத்துவக் கேள்விகள்' : language === 'hi' ? '4. स्वास्थ्य प्रश्न' : '4. Health Questions')}
            </span>
            <span>{getOverallProgress()}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-brand-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getOverallProgress()}%` }}
            />
          </div>
        </div>
      </div>

      {/* EMERGENCY BANNER IF DETECTED */}
      {detectedEmergency && (
        <div className="p-5 bg-red-600 text-white rounded-3xl shadow-xl border border-red-400 flex items-start gap-3.5 animate-bounce-short">
          <div className="p-2.5 bg-white text-red-600 rounded-2xl shadow-md shrink-0">
            <AlertOctagon className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm uppercase tracking-wider">
              {t.emergency.alertTitle}
            </h4>
            <p className="text-xs text-red-100 leading-relaxed font-medium">
              {t.emergency.patientMessage}
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 1: VISIT PURPOSE - ROUTINE TEST VS NEW ILLNESS      */}
      {/* ======================================================== */}
      {flowStep === 'VISIT_PURPOSE' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-black uppercase tracking-wider">
                {language === 'ta' ? 'படி 1: வருகையின் நோக்கம்' : language === 'hi' ? 'चरण 1: परामर्श का उद्देश्य' : 'Step 1: Reason for Medical Visit'}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-purple-700 hidden sm:inline">
                  {language === 'ta' ? '🔊 கேட்க (Voice)' : language === 'hi' ? '🔊 सुनें (Voice)' : '🔊 Listen (Voice)'}
                </span>
                <VoiceButton
                  textToSpeak={
                    language === 'ta'
                      ? 'உங்கள் மருத்துவ வருகையின் காரணம் என்ன? சர்க்கரை, ரத்த அழுத்தம் போன்ற வழக்கமான பரிசோதனையா அல்லது புதிய உடல் உபாதையா?'
                      : language === 'hi'
                      ? 'आज आपके चिकित्सा परामर्श का क्या कारण है? शुगर, बीपी जैसी नियमित जांच या कोई नई बीमारी?'
                      : 'What is the primary purpose of your medical visit? Regular test checkup or new illness?'
                  }
                  showListen={true}
                  showSpeak={false}
                  size="sm"
                />
              </div>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-snug">
              {language === 'ta'
                ? 'உங்கள் மருத்துவ வருகையின் முதன்மைக் காரணம் என்ன?'
                : language === 'hi'
                ? 'आज आपके परामर्श का मुख्य उद्देश्य क्या है?'
                : 'What is the primary purpose of your medical visit?'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {language === 'ta'
                ? 'வழக்கமான பரிசோதனைக்கு (சர்க்கரை, ரத்த அழுத்தம்...) குறைந்த கேள்விகளுடன் நேரடியாக அறிக்கை ஸ்கேனருக்கு செல்லலாம்.'
                : language === 'hi'
                ? 'नियमित जांच के लिए कम प्रश्न पूछकर सीधे रिपोर्ट स्कैनर पर भेजा जाएगा।'
                : 'Choose a routine test checkup to fast-track directly to the Report Scanner, or select New Illness for a full consultation.'}
            </p>
          </div>

          {/* Option A: Routine Tests Grid (Highlighted) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black">⚡ FAST-TRACK</span>
                <h3 className="text-sm font-extrabold text-slate-800">
                  {language === 'ta' ? 'வழக்கமான ஆய்வகப் பரிசோதனை (சர்க்கரை, பிபி, முதலியன)' : language === 'hi' ? 'नियमित लैब टेस्ट (शुगर, बीपी, आदि)' : 'Regular Test / Routine Disease Checkup'}
                </h3>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 hidden sm:inline">
                {language === 'ta' ? 'வயது மட்டும் ➔ அறிக்கை ஸ்கேன்' : language === 'hi' ? 'केवल आयु ➔ रिपोर्ट स्कैन' : 'Age only ➔ Report Scan'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {routineTestOptions.map((opt) => {
                const IconComponent = getIcon(opt.icon);
                const titleText = opt.title[language] || opt.title.en;
                const descText = opt.desc[language] || opt.desc.en;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleRoutineTestSelect(titleText)}
                    className="p-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all group flex flex-col justify-between shadow-xs hover:shadow-md cursor-pointer bg-white"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-wider text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                          {opt.badge}
                        </span>
                        <IconComponent className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-950">
                        {titleText}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-700">
                        {descText}
                      </p>
                    </div>
                    <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
                      <span>{language === 'ta' ? 'பரிசோதனை தேர்வு' : language === 'hi' ? 'जांच चुनें' : 'Select Checkup'}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Option B: New Illness / Health Problem */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleNewIllnessSelect}
              className="w-full p-5 rounded-2xl border-2 border-purple-200 hover:border-purple-600 bg-gradient-to-r from-purple-50/60 to-brand-50/60 hover:from-purple-100/80 hover:to-brand-100/80 text-left transition-all shadow-xs hover:shadow-md flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black tracking-wider text-purple-800 bg-purple-200/70 px-2 py-0.5 rounded-md uppercase">
                      {language === 'ta' ? 'புதிய உடல் பிரச்சனை' : language === 'hi' ? 'नई बीमारी' : 'New Illness / Symptoms'}
                    </span>
                  </div>
                  <h4 className="font-black text-base text-slate-900 group-hover:text-purple-950">
                    {language === 'ta'
                      ? 'புதிய நோய் / அறிகுறிகள் (முழு பரிசோதனை முறை)'
                      : language === 'hi'
                      ? 'नई बीमारी / लक्षण (संपूर्ण परामर्श प्रक्रिया)'
                      : 'New Illness / Symptoms (Full Clinical Case-Taking)'}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {language === 'ta'
                      ? 'காய்ச்சல், தலைவலி, மூட்டு வலி அல்லது பிற அறிகுறிகளை விளக்கி உடற்பகுதி வரைபடம் மூலம் பதிவு செய்ய.'
                      : language === 'hi'
                      ? 'बुखार, सिरदर्द, जोड़ों का दर्द या अन्य नए लक्षणों का संपूर्ण विवरण दर्ज करने के लिए।'
                      : 'I have fever, pain, injury, or newly developed health symptoms needing comprehensive AYUSH evaluation.'}
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-purple-600 group-hover:bg-purple-700 text-white rounded-xl text-xs font-black shrink-0 transition-colors shadow-sm">
                <span>{language === 'ta' ? 'தொடரவும்' : language === 'hi' ? 'आगे बढ़ें' : 'Start Intake'}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 2: PATIENT EXPLAINS CONDITION IN OWN WORDS          */}
      {/* ======================================================== */}
      {flowStep === 'EXPLAIN_CONDITION' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-black uppercase tracking-wider">
                Step 1 of 3: Describe Condition
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-purple-700 hidden sm:inline">
                  {language === 'ta' ? '🔊 கேட்க (Voice)' : language === 'hi' ? '🔊 सुनें (Voice)' : '🔊 Listen (Voice)'}
                </span>
                <VoiceButton
                  textToSpeak={`${t.aiPreConsultation.tellUsProblem}. ${t.aiPreConsultation.introSubtitle}`}
                  showListen={true}
                  showSpeak={false}
                  size="sm"
                />
              </div>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-snug">
              {t.aiPreConsultation.tellUsProblem}
            </h2>
            <p className="text-xs text-slate-500">
              {t.aiPreConsultation.introSubtitle}
            </p>
          </div>

          {/* Condition Description Text Area & Voice Input */}
          <div className="space-y-3">
            <div className="relative">
              <textarea
                rows={4}
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                placeholder={t.aiPreConsultation.describeConditionPlaceholder}
                className="w-full p-4 pr-14 rounded-2xl border border-slate-200 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 text-sm font-medium transition-all"
              />
              <div className="absolute right-3 bottom-3">
                <VoiceButton
                  showSpeak={true}
                  showListen={false}
                  size="md"
                  onSpeechResult={(res) => {
                    const text = res.rawTranscript || res.normalizedText;
                    if (text) {
                      setTypedAnswer(prev => prev ? `${prev} ${text}` : text);
                    }
                  }}
                />
              </div>
            </div>

            {/* Quick Condition Chips for Easy Tap */}
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">
                Quick Selection (or type above):
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: t.aiPreConsultation.quickComplaints.headache, id: 'headache' },
                  { label: t.aiPreConsultation.quickComplaints.stomachPain, id: 'stomach' },
                  { label: t.aiPreConsultation.quickComplaints.skinItching, id: 'skin' },
                  { label: t.aiPreConsultation.quickComplaints.cough, id: 'cough' },
                  { label: t.aiPreConsultation.quickComplaints.backPain, id: 'back' },
                  { label: t.aiPreConsultation.quickComplaints.fever, id: 'fever' },
                  { label: t.aiPreConsultation.quickComplaints.chestPain, id: 'chest' },
                  { label: t.aiPreConsultation.quickComplaints.other, id: 'other' },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setTypedAnswer(chip.label)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      typedAnswer === chip.label
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50 hover:border-purple-300'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Continue Button to Step 2 Body Map */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="py-3 px-6 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all text-xs active:scale-95 cursor-pointer"
            >
              {t.common.back}
            </button>

            <button
              type="button"
              disabled={!typedAnswer.trim()}
              onClick={handleStep1ConditionSubmit}
              className="py-3.5 px-8 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-black rounded-2xl shadow-lg shadow-brand-200 transition-all flex items-center gap-2 text-sm active:scale-95 cursor-pointer"
            >
              <span>{language === 'ta' ? 'உடல் வரைபடத்திற்குச் செல்லவும்' : language === 'hi' ? 'बॉडी मैप पर आगे बढ़ें' : 'Continue to Body Map'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 2: FOR ROUTINE TEST: UPLOAD & REVIEW REPORTS       */}
      {/* (Replaces Body Map for checkup selected patients)        */}
      {/* ======================================================== */}
      {flowStep === 'BODY_MAP' && isRoutineTest && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6 animate-fade-in">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black uppercase tracking-wider">
                {language === 'ta' ? 'படி 2: மருத்துவ அறிக்கைகள்' : language === 'hi' ? 'चरण 2: मेडिकल रिपोर्ट' : 'Step 2: Medical Test Reports'}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-emerald-700 hidden sm:inline">
                  {language === 'ta' ? '🔊 கேட்க (Voice)' : language === 'hi' ? '🔊 सुनें (Voice)' : '🔊 Listen (Voice)'}
                </span>
                <VoiceButton
                  textToSpeak={
                    language === 'ta'
                      ? 'உங்கள் வழக்கமான பரிசோதனைக்கு முந்தைய அறிக்கைகளைத் தேர்ந்தெடுக்கவும் அல்லது புதிய அறிக்கையை ஸ்கேன் செய்யவும்.'
                      : language === 'hi'
                      ? 'अपनी नियमित जांच के लिए पूर्व रिपोर्ट चुनें अथवा नई रिपोर्ट स्कैन करें।'
                      : 'Review your existing medical reports on file or scan a new report for your doctor consultation.'
                  }
                  showListen={true}
                  showSpeak={false}
                  size="sm"
                />
              </div>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-snug flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-600" />
              <span>
                {language === 'ta'
                  ? `வழக்கமான பரிசோதனை: அறிக்கைகள் (${selectedRoutineTest || 'பரிசோதனை'})`
                  : language === 'hi'
                  ? `नियमित जांच रिपोर्ट: ${selectedRoutineTest || 'परीक्षण'}`
                  : `Routine Checkup Reports: ${selectedRoutineTest || 'Lab Checkup'}`}
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {language === 'ta'
                ? 'உங்கள் மருத்துவரிடம் ஆலோசனை செய்ய ஏற்கனவே உள்ள அறிக்கையைத் தேர்ந்தெடுக்கலாம் அல்லது கேமரா / கோப்பு மூலம் புதிய அறிக்கையைப் பதிவேற்றலாம்.'
                : language === 'hi'
                ? 'परामर्श के लिए मौजूदा रिपोर्ट चुनें अथवा अपने कैमरे या फ़ाइल से नई रिपोर्ट अपलोड करें।'
                : 'Select an existing report on file or scan/upload a new report using your camera or files so your consulting doctor can review it.'}
            </p>
          </div>

          {/* Condition & Age Recap */}
          <div className="flex flex-wrap items-center gap-2">
            {context.chiefComplaint && (
              <div className="p-2.5 px-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <span className="font-bold">{language === 'ta' ? 'பரிசோதனை:' : language === 'hi' ? 'जांच:' : 'Checkup:'}</span>
                <span className="font-medium truncate max-w-xs">{context.chiefComplaint}</span>
              </div>
            )}
            <div className="p-2.5 px-3.5 bg-brand-50 rounded-xl border border-brand-100 text-xs text-brand-900 flex items-center gap-1.5 font-bold">
              <Calendar className="w-3.5 h-3.5 text-brand-600" />
              <span>{language === 'ta' ? `வயது: ${context.age || patientAge}` : language === 'hi' ? `आयु: ${context.age || patientAge}` : `Age: ${context.age || patientAge} yrs`}</span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION A: EXISTING OR ALREADY UPLOADED REPORTS         */}
          {/* ======================================================== */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  {language === 'ta'
                    ? `கோப்பில் உள்ள ஏற்கனவே பதிவேற்றப்பட்ட அறிக்கைகள் (${patientReports.length})`
                    : language === 'hi'
                    ? `मौजूदा / पूर्व अपलोड की गई रिपोर्ट (${patientReports.length})`
                    : `Existing & Already Uploaded Reports on File (${patientReports.length})`}
                </h3>
              </div>
              <span className="text-[11px] text-brand-700 font-bold bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                {language === 'ta' ? 'தேர்ந்தெடுக்க தட்டவும்' : language === 'hi' ? 'चुनने हेतु टैप करें' : 'Tap to Attach'}
              </span>
            </div>

            {patientReports.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">
                  {language === 'ta' ? 'முந்தைய அறிக்கைகள் எதுவும் இல்லை.' : language === 'hi' ? 'कोई पूर्व रिपोर्ट नहीं मिली।' : 'No previous reports found on file.'}
                </p>
                <p>
                  {language === 'ta' ? 'கீழே உள்ள கேமரா அல்லது விரைவு ஸ்கேனர் மூலம் புதிய அறிக்கையைப் பதிவேற்றவும்.' : language === 'hi' ? 'कृपया नीचे दिए गए स्कैनर से नई रिपोर्ट जोड़ें।' : 'Please use the camera or quick routine test scanner below to scan your checkup report.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {patientReports.map((report) => {
                  const isSelected = selectedReportId === report.id;

                  return (
                    <div
                      key={report.id}
                      onClick={() => setSelectedReportId(report.id)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-left space-y-2.5 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-200'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black text-slate-900">
                              {report.reportTitle}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                              {report.fileType || 'PDF'}
                            </span>
                            {report.doctorVerificationStatus === 'VERIFIED' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                {report.verifiedByDoctorName || 'Verified by Doctor'}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                                Ready for OPD Review
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Report Date: <strong>{report.reportDate || (report.uploadedAt ? new Date(report.uploadedAt).toLocaleDateString() : 'Recent')}</strong> • Ref: <code>{report.id}</code>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isSelected ? (
                            <>
                              <div className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{language === 'ta' ? 'இணைக்கப்பட்டது' : language === 'hi' ? 'संलग्न' : 'Attached'}</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedReportId('');
                                }}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                title="Remove attachment from this consultation"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>{language === 'ta' ? 'நீக்கு' : language === 'hi' ? 'हटाएं' : 'Detach'}</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReportId(report.id);
                              }}
                              className="px-3 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 hover:border-emerald-300 border border-transparent rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              {language === 'ta' ? 'இணைக்க' : language === 'hi' ? 'चुनें' : 'Attach'}
                            </button>
                          )}

                          {/* Delete Report from System */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteReport(report.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                            title={language === 'ta' ? 'அறிக்கையை நீக்கு' : language === 'hi' ? 'रिपोर्ट हटाएं' : 'Delete / Remove Report'}
                            aria-label="Delete report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Extracted Parameter Pills */}
                      {report.extractedParameters && report.extractedParameters.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {report.extractedParameters.slice(0, 5).map((param, idx) => (
                            <span
                              key={idx}
                              className={`text-[11px] px-2 py-0.5 rounded-lg font-medium border flex items-center gap-1 ${
                                param.isAbnormal
                                  ? 'bg-red-50 text-red-700 border-red-200 font-bold'
                                  : 'bg-slate-50 text-slate-700 border-slate-200'
                              }`}
                            >
                              <span>{param.parameterName}:</span>
                              <strong className={param.isAbnormal ? 'text-red-800' : 'text-slate-900'}>
                                {param.measuredValue} {param.unit}
                              </strong>
                              {param.isAbnormal && (
                                <span className="text-[9px] px-1 bg-red-200 text-red-900 rounded font-black">
                                  {param.severity || 'ABNORMAL'}
                                </span>
                              )}
                            </span>
                          ))}
                          {report.extractedParameters.length > 5 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{report.extractedParameters.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* SECTION B: UPLOAD / SCAN NEW REPORT (Camera & 1-Tap)     */}
          {/* ======================================================== */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  {language === 'ta'
                    ? 'அல்லது புதிய அறிக்கையை ஸ்கேன் / பதிவேற்றவும்'
                    : language === 'hi'
                    ? 'अथवा नई रिपोर्ट स्कैन / अपलोड करें'
                    : 'Or Scan / Upload a New Report on this Device'}
                </h3>
              </div>
            </div>

            <ReportUploader
              patientId={context.patientId}
              onReportProcessed={handleReportProcessedInBodyMap}
              defaultRoutineCategory={selectedRoutineTest}
            />
          </div>

          {/* Navigation & Completion Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="py-3 px-6 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all text-xs active:scale-95 cursor-pointer"
            >
              {t.common.back}
            </button>

            <button
              type="button"
              onClick={handleCheckupReportFinish}
              className="py-3.5 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 text-sm active:scale-95 cursor-pointer"
            >
              <span>
                {language === 'ta'
                  ? 'முடிந்தது & மருத்துவரிடம் ஆலோசனைக்குச் செல் ➔'
                  : language === 'hi'
                  ? 'पूर्ण & डॉक्टर परामर्श पर आगे बढ़ें ➔'
                  : 'Complete & Proceed to Doctor Consultation ➔'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 3: FOR NEW ILLNESS: ANATOMICAL HUMAN BODY MAP      */}
      {/* ======================================================== */}
      {flowStep === 'BODY_MAP' && !isRoutineTest && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-black uppercase tracking-wider">
                {language === 'ta' ? 'படி 3 / 4: பாதிக்கப்பட்ட பகுதி' : language === 'hi' ? 'चरण 3 / 4: प्रभावित भाग' : 'Step 3 of 4: Affected Body Area'}
              </span>
              <VoiceButton
                textToSpeak={`${t.aiPreConsultation.whereIsProblem}. ${t.aiPreConsultation.bodyMapHelp}`}
                showListen={false}
                showSpeak={true}
                size="sm"
              />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-snug flex items-center gap-2">
              <MapPin className="w-6 h-6 text-purple-600" />
              <span>{t.aiPreConsultation.whereIsProblem}</span>
            </h2>
            <p className="text-xs text-slate-500">
              {t.aiPreConsultation.bodyMapHelp}
            </p>
          </div>

          {/* Condition & Age Recap */}
          <div className="flex flex-wrap items-center gap-2">
            {context.chiefComplaint && (
              <div className="p-2.5 px-3.5 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-900 flex items-center gap-2">
                <span className="font-bold">{language === 'ta' ? 'உடல்நிலை:' : language === 'hi' ? 'तकलीफ़:' : 'Condition:'}</span>
                <span className="font-medium truncate max-w-xs">{context.chiefComplaint}</span>
              </div>
            )}
            <div className="p-2.5 px-3.5 bg-brand-50 rounded-xl border border-brand-100 text-xs text-brand-900 flex items-center gap-1.5 font-bold">
              <Calendar className="w-3.5 h-3.5 text-brand-600" />
              <span>{language === 'ta' ? `வயது: ${context.age || patientAge}` : language === 'hi' ? `आयु: ${context.age || patientAge}` : `Age: ${context.age || patientAge} yrs`}</span>
            </div>
          </div>

          {/* Interactive Detailed Body Map Canvas */}
          <div className="pt-2 border-t border-slate-100">
            <BodyMap
              initialAgeGroup={context.ageGroup}
              initialSex={context.sex as 'MALE' | 'FEMALE'}
              selectedSelections={context.bodySelections}
              onSelectionChange={(selections: BodyMapSelection[]) => {
                if (selections.length > 0) {
                  setSelectedRegionName(selections[0].regionName);
                  setContext(prev => ({
                    ...prev,
                    bodySelections: selections,
                  }));
                }
              }}
            />
          </div>

          {/* Selection indicator */}
          {context.bodySelections.length > 0 && (
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Selected Location: <strong>{context.bodySelections.map(b => b.regionName).join(', ')}</strong>
              </span>
            </div>
          )}

          {/* Navigation */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="py-3 px-6 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all text-xs active:scale-95 cursor-pointer"
            >
              {t.common.back}
            </button>

            <button
              type="button"
              disabled={context.bodySelections.length === 0 && !selectedRegionName}
              onClick={handleStep2BodyMapSubmit}
              className="py-3.5 px-8 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-black rounded-2xl shadow-lg shadow-brand-200 transition-all flex items-center gap-2 text-sm active:scale-95 cursor-pointer"
            >
              <span>Continue to Pre-Consultation Questions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 4+: ADAPTIVE CLINICAL AI QUESTIONS                  */}
      {/* (Informed by condition, age & body location;             */}
      {/*  dynamic multi-language question and audio switching)    */}
      {/* ======================================================== */}
      {flowStep === 'QUESTIONS' && (adaptiveQuestion || currentQuestion) && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
          {/* Question Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-black uppercase tracking-wider">
                {language === 'ta'
                  ? `கேள்வி ${Math.min(4, currentStepNum)} / 4`
                  : language === 'hi'
                  ? `प्रश्न ${Math.min(4, currentStepNum)} / 4`
                  : `Question ${Math.min(4, currentStepNum)} of 4`}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-purple-700 hidden sm:inline">
                  {language === 'ta' ? '🔊 கேட்க (Voice)' : language === 'hi' ? '🔊 सुनें (Voice)' : '🔊 Listen (Voice)'}
                </span>
                <VoiceButton
                  textToSpeak={getActiveQuestionText()}
                  showListen={true}
                  showSpeak={false}
                  size="sm"
                />
              </div>
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-snug">
                {getActiveQuestionText()}
              </h2>
            </div>
          </div>

          {/* Universal Typing Option & Voice-to-Speech / Speech-to-Text for AI Pre-Consultation Questions */}
          <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-brand-600" />
                <span>
                  {language === 'ta'
                    ? 'பதிலை தட்டச்சு செய்யவும் அல்லது பேசவும் (Type or Voice):'
                    : language === 'hi'
                    ? 'उत्तर टाइप करें या बोलें (Type or Voice):'
                    : 'Type Your Answer or Speak with Voice:'}
                </span>
              </label>

              <div className="flex items-center gap-1">
                <VoiceButton
                  showSpeak={true}
                  showListen={false}
                  size="sm"
                  onSpeechResult={(res) => {
                    const text = res.rawTranscript || res.normalizedText;
                    if (text) {
                      setTypedAnswer(text);
                      setSelectedOptionText(text);
                      setSelectedOptionId('');
                      setSelectedOptionLocalized({ en: text, ta: text, hi: text });
                    }
                  }}
                />
                <span className="text-[11px] text-brand-700 font-bold hidden sm:inline">
                  {language === 'ta' ? 'பேச்சு-உரை (Speech to Text)' : language === 'hi' ? 'बोलकर लिखें' : 'Voice Typing'}
                </span>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                value={typedAnswer}
                onChange={(e) => {
                  const val = e.target.value;
                  setTypedAnswer(val);
                  setSelectedOptionText(val);
                  setSelectedOptionLocalized({ en: val, ta: val, hi: val });
                }}
                placeholder={
                  language === 'ta'
                    ? 'உங்கள் பதிலை இங்கே தட்டச்சு செய்யவும் அல்லது கீழே தேர்ந்தெடுக்கவும்...'
                    : language === 'hi'
                    ? 'यहाँ अपना उत्तर टाइप करें या नीचे एक विकल्प चुनें...'
                    : 'Type your answer here or select an option below...'
                }
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 font-medium transition-all bg-white"
              />
            </div>

            {selectedOptionText && (
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <span>
                  {language === 'ta' ? 'தேர்ந்தெடுக்கப்பட்ட பதில்:' : language === 'hi' ? 'चयनित उत्तर:' : 'Selected Response:'}{' '}
                  <strong>{selectedOptionText}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOptionId('');
                    setSelectedOptionText('');
                    setSelectedOptionLocalized(null);
                    setTypedAnswer('');
                  }}
                  className="text-slate-400 hover:text-red-600 text-[11px] font-bold cursor-pointer"
                >
                  ✕ {language === 'ta' ? 'அழி' : language === 'hi' ? 'ஹடாएं' : 'Clear'}
                </button>
              </div>
            )}
          </div>

          {/* ADAPTIVE DATASET CHOICE CARDS */}
          {adaptiveQuestion && adaptiveQuestion.options && adaptiveQuestion.options.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500">
                {language === 'ta' ? 'அல்லது விரைவு தேர்வை அழுத்தவும்:' : language === 'hi' ? 'या नीचे एक विकल्प चुनें:' : 'Or tap a choice below:'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {adaptiveQuestion.options.map((opt: any, idx: number) => {
                  const optId = typeof opt === 'object' ? (opt.id || `opt_${idx}`) : `opt_${idx}`;
                  const optLocalized = typeof opt === 'object' && opt.localizedLabel
                    ? opt.localizedLabel
                    : (typeof opt === 'object' && typeof opt.label === 'object' ? opt.label : null);
                  const optLabel = optLocalized
                    ? (optLocalized[language] || optLocalized.en || optLocalized.ta || optLocalized.hi)
                    : (typeof opt === 'object' ? (opt.label || opt.id) : String(opt));
                  const isSelected = selectedOptionId === optId || typedAnswer === optLabel;

                  return (
                    <div
                      key={optId}
                      onClick={() => handleAdaptiveOptionClick(optId, optLocalized, optLabel)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/90 shadow-md ring-2 ring-brand-200'
                          : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`p-2.5 rounded-xl shadow-sm shrink-0 ${isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-slate-900 block leading-snug">
                            {optLabel}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="p-1 rounded-full bg-brand-600 text-white shadow-sm shrink-0">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CLIENT-SIDE FALLBACK CHOICE CARDS (Single Language Only) */}
          {!adaptiveQuestion && currentQuestion && currentQuestion.inputType === 'CHOICE_CARDS' && currentQuestion.options && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500">
                {language === 'ta' ? 'அல்லது விரைவு தேர்வை அழுத்தவும்:' : language === 'hi' ? 'या नीचे ஒரு विकल्प चुनें:' : 'Or tap a choice below:'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQuestion.options.map((opt) => {
                  const isSelected = selectedOptionId === opt.id || typedAnswer === (opt.label[language] || opt.label.en);
                  const IconComp = getIcon(opt.icon);
                  const label = opt.label[language] || opt.label.en;
                  const subLabel = opt.subLabel ? (opt.subLabel[language] || opt.subLabel.en) : undefined;

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleClientOptionClick(opt)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/90 shadow-md ring-2 ring-brand-200'
                          : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`p-2.5 rounded-xl shadow-sm shrink-0 ${isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-slate-900 block leading-snug">
                            {label}
                          </span>
                          {subLabel && (
                            <span className="text-[11px] text-slate-500 font-medium block mt-0.5 leading-tight">
                              {subLabel}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="p-1 rounded-full bg-brand-600 text-white shadow-sm shrink-0">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SEVERITY SLIDER */}
          {!adaptiveQuestion && currentQuestion?.inputType === 'SEVERITY_SLIDER' && (
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4 text-center">
              <span className="text-3xl font-black text-brand-600">
                {context.severity} / 10
              </span>
              <input
                type="range"
                min="1"
                max="10"
                value={context.severity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setContext(prev => ({ ...prev, severity: val }));
                  const scoreText = `${val} / 10`;
                  setSelectedOptionText(scoreText);
                  setTypedAnswer(scoreText);
                  setSelectedOptionLocalized({
                    en: `Pain severity: ${val}/10`,
                    ta: `வலியின் தீவிரம்: ${val}/10`,
                    hi: `दर्द की तीव्रता: ${val}/10`,
                  });
                }}
                className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
              <div className="flex justify-between text-xs font-bold text-slate-400 px-1">
                <span>{t.aiPreConsultation.severityMild} (1)</span>
                <span>{t.aiPreConsultation.severityModerate} (5)</span>
                <span>{t.aiPreConsultation.severitySevere} (10)</span>
              </div>
            </div>
          )}

          {/* Non-Diagnostic Disclaimer */}
          <p className="text-[11px] text-slate-400 italic">
            ℹ️ {t.aiPreConsultation.disclaimer}
          </p>

          {/* Bottom Navigation */}
          <div className="flex flex-wrap items-center justify-between pt-6 border-t border-slate-100 gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleBack}
              className="py-3 px-6 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all text-xs active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {t.common.back}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => saveAnswerAndProceed()}
              className={`py-3.5 px-8 font-black rounded-2xl shadow-lg transition-all text-sm flex items-center gap-2 active:scale-95 cursor-pointer ${
                isLastQuestion
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-200'
                  : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>
                    {isLastQuestion
                      ? (language === 'ta' ? 'முடிவடைகிறது...' : language === 'hi' ? 'पूर्ण हो रहा है...' : 'Completing Pre-Consultation...')
                      : (language === 'ta' ? 'செயலாக்குகிறது...' : language === 'hi' ? 'प्रक्रिया चल रही है...' : 'Processing...')}
                  </span>
                </>
              ) : isLastQuestion ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                  <span>
                    {language === 'ta'
                      ? '✓ ஆலோசனையை முடிக்கவும்'
                      : language === 'hi'
                      ? '✓ पूर्व-परामर्श पूर्ण करें'
                      : '✓ Complete Pre-Consultation'}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>
                  <span>{t.common.next}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
