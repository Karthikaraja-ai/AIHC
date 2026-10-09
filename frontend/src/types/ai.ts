// Types for AI Pre-Consultation, Body Map, and AYUSH Case-Taking

import { TriageLevel, MedicineSystem } from './index';

export type BodyRegionId = 
  | 'head'
  | 'eyes'
  | 'throat_neck'
  | 'chest'
  | 'upper_abdomen'
  | 'lower_abdomen'
  | 'pelvis_groin'
  | 'left_shoulder_arm'
  | 'right_shoulder_arm'
  | 'upper_back_spine'
  | 'lower_back'
  | 'left_leg_knee'
  | 'right_leg_knee'
  | 'feet';

export interface BodyMapSelection {
  regionId: BodyRegionId;
  regionName: string;
  side: 'FRONT' | 'BACK';
  painSeverity: number; // 1 to 10
  natureOfPain?: 'sharp' | 'dull' | 'burning' | 'throbbing' | 'cramping' | 'pressure';
}

export interface AYUSHCaseTaking {
  selectedSystem?: MedicineSystem;
  prakritiReported?: 'VATA' | 'PITTA' | 'KAPHA' | 'VATA_PITTA' | 'PITTA_KAPHA' | 'TRIDOSHA';
  // Siddha Mukkuttram
  siddhaDosha?: 'VALI_VATHAM' | 'AZHAL_PITHAM' | 'IYYAM_KABAM';
  // Unani Mizaj
  unaniMizaj?: 'DAMWI_SANGUINE' | 'BALGHAMI_PHLEGMATIC' | 'SAFRAWI_CHOLERIC' | 'SAUDAWI_MELANCHOLIC';
  
  // Ashtavidha Pariksha / Envagai Thervu (Patient & Staff reported)
  ashtavidhaPariksha?: {
    jihvaReported?: string; // Tongue: White coated (Ama), Red/cracked, Pale/smooth, Scalloped, Normal
    mutraReported?: string; // Urine: Pale clear, Dark yellow/burning, Turbid/cloudy, Frothy, Reddish
    malaReported?: string;  // Stool: Dry/constipated, Loose/burning, Sticky/mucus, Normal
    nadiReported?: string;  // Pulse: Sarpa (Snake), Manduka (Frog), Hamsa (Swan)
    shabdaReported?: string;// Voice: Feeble, Harsh, Clear
    sparshaReported?: string;// Skin: Dry/rough, Hot/burning, Cool/clammy, Oily
    drikReported?: string;  // Eyes: Yellow tinge, Redness, Pale, Clear
    akrutiReported?: string;// Habitus: Thin/lean, Muscular/moderate, Heavily built
  };
  agniStatus?: 'Sama (Balanced)' | 'Vishama (Irregular)' | 'Tikshna (Intense)' | 'Manda (Sluggish)';
  koshtaStatus?: 'Krura (Constipated)' | 'Mridu (Soft)' | 'Madhyama (Normal)';
}

export interface YogaAssessment {
  mobilityLimitation?: string;
  flexibilityStatus?: string;
  postureAndSittingHours?: string;
  breathingPattern?: string;
  stressAndRelaxation?: string;
  dailyRoutine?: string;
  previousInjuryOrContraindication?: string;
  exerciseHistory?: string;
}

export interface SiddhaAssessment {
  mukkuttramDominance?: 'Vali (Vatham)' | 'Azhal (Pitham)' | 'Iyyam (Kabam)' | 'Balanced';
  envagaiObservations?: {
    naa?: string;        // Tongue
    moothiram?: string;  // Urine
    malam?: string;      // Bowel
    niram?: string;      // Body color/complexion
    sparisam?: string;   // Skin texture/temperature
    vizhi?: string;      // Eyes
    mozhi?: string;      // Voice
  };
  unavuHabits?: string;  // Food habits
  seasonalInfluence?: string;
}

export interface UnaniAssessment {
  mizajTemperament?: 'Damwi (Sanguine)' | 'Balghami (Phlegmatic)' | 'Safrawi (Choleric)' | 'Saudawi (Melancholic)';
  hazmDigestion?: string;
  naumSleep?: string;
  baulUrineObservation?: string;
  barazStoolObservation?: string;
  taddbeerNeed?: string;
}

export interface AllopathySOCRATES {
  site?: string;
  onset?: string;
  character?: string;
  radiation?: string;
  associations?: string[];
  timingDuration?: string;
  exacerbatingFactors?: string;
  relievingFactors?: string;
  severityScore?: number;
  pastMedicalHistory?: string[];
  medicationHistory?: string[];
  allergyInformation?: string[];
}

export interface AIQuestionOption {
  id: string;
  label: { en: string; ta: string; hi: string };
  subLabel?: { en: string; ta: string; hi: string };
  icon?: string;
  isEmergencyTrigger?: boolean;
  contextTag?: string;
}

export interface AIQuestion {
  id: string;
  questionNumber: number;
  totalEstimatedQuestions: number;
  category: 
    | 'MEDICINE_SYSTEM'
    | 'CHIEF_COMPLAINT'
    | 'BODY_LOCATION'
    | 'DURATION'
    | 'SEVERITY'
    | 'CHARACTER'
    | 'TRIGGERS'
    | 'ASSOCIATED'
    | 'AYUSH_JIHVA'
    | 'AYUSH_MUTRA'
    | 'AYUSH_MALA'
    | 'YOGA_POSTURE'
    | 'YOGA_BREATHING'
    | 'YOGA_CONTRAINDICATION'
    | 'SIDDHA_MUKKUTTRAM'
    | 'UNANI_MIZAJ'
    | 'HISTORY_CHECK'
    | 'RED_FLAG_CHECK';
  text: {
    en: string;
    ta: string;
    hi: string;
  };
  audioPromptText: {
    en: string;
    ta: string;
    hi: string;
  };
  inputType: 'CHOICE_CARDS' | 'BODY_MAP' | 'SEVERITY_SLIDER' | 'VOICE_OR_TEXT' | 'YES_NO';
  options?: AIQuestionOption[];
  requiresBodyMap?: boolean;
}

export interface AIAnswerRecord {
  questionId: string;
  questionText: string;
  answerText: string;
  answeredAt: string;
  inputMethod: 'VOICE' | 'TOUCH_SELECTION' | 'TEXT';
  detectedConfidence: number;
  tags?: string[];
}

export interface AIConsultationSummary {
  id: string;
  patientId: string;
  appointmentId?: string;
  createdAt: string;
  medicineSystem: MedicineSystem;
  hospitalName?: { en: string; ta: string; hi: string } | string;
  doctorName?: { en: string; ta: string; hi: string } | string;
  doctorRoom?: string;
  chiefComplaint: string;
  chiefComplaintLocalized?: { en: string; ta: string; hi: string };
  symptomsList: string[];
  duration: string;
  severity: number;
  bodyLocations: string[];
  associatedSymptoms: string[];
  ayushObservations?: AYUSHCaseTaking;
  yogaObservations?: YogaAssessment;
  siddhaObservations?: SiddhaAssessment;
  unaniObservations?: UnaniAssessment;
  allopathyObservations?: AllopathySOCRATES;
  detectedRedFlags: string[];
  recommendedTriage: TriageLevel;
  confidenceScore: number;
  unansweredQuestions?: string[];
  disclaimer: string;
  verifiedByDoctor?: string;
  doctorNotes?: string;
  qaRecords?: MultilingualQAPairRecord[];
}

export interface StructuredInterpretation {
  detectedEntity?: string;
  duration?: string;
  severity?: number;
  location?: string;
  painCharacter?: string;
  triggers?: string[];
  associatedSymptoms?: string[];
  ayushObservationKey?: string;
  ayushObservationValue?: string;
  clinicalNotes?: string;
  confidence: number;
}

export interface MultilingualQAPairRecord {
  id: string;
  patientId: string;
  consultationId: string;
  medicineSystem: MedicineSystem;
  questionId: string;
  questionCategory: string;
  originalQuestion: string; // Active presentation language question text
  englishQuestion: string;
  tamilQuestion: string;
  hindiQuestion: string;
  patientOriginalResponse: string;
  detectedResponseLanguage: 'en' | 'ta' | 'hi' | 'mixed';
  structuredInterpretation: StructuredInterpretation;
  timestamp: string;
  inputMethod: 'VOICE' | 'TOUCH_SELECTION' | 'TEXT';
}

export interface PreConsultationQuestionResponse {
  id: string;
  text: string;
  englishText?: string;
  tamilText?: string;
  hindiText?: string;
  questionType: string;
  inputType: string;
  options?: Array<{ id: string; label: string }> | string[];
  stepNumber: number;
  isEmergency: boolean;
  emergencyFlag: string;
}

export interface PreConsultationSessionResponse {
  sessionId: string;
  patientId: string;
  appointmentId?: string;
  language: string;
  medicalSystem: string;
  chiefComplaint: string;
  currentStep: number;
  status: string;
  isEmergency: boolean;
  emergencyFlag: string;
  emergencyReason?: string;
  isSufficient: boolean;
  progressPercent: number;
  nextQuestion?: PreConsultationQuestionResponse | null;
  summary?: string | null;
  qaHistory: Array<{
    step_number: number;
    question_id?: string;
    patient_answer: string;
  }>;
}

