// Generative AI Adaptive Question Engine for Digital Hospital Patient Pre-Consultation
// Supports 5 distinct medical frameworks: Ayurveda, Yoga, Siddha, Unani, and Allopathy (Modern Medicine)
// Features dynamic context memory, red-flag safety interception, variable stopping logic, and bilingual Tamil/English voice interaction.

import {
  AIQuestion,
  AIConsultationSummary,
  BodyMapSelection,
  AYUSHCaseTaking,
  YogaAssessment,
  SiddhaAssessment,
  UnaniAssessment,
  AllopathySOCRATES,
  StructuredInterpretation,
} from '../types/ai';
import { MedicineSystem } from '../types';
import { emergencyDetector } from './emergencyDetector';
import { storageService } from './storageService';
import { detectConditionCategory, getNextConditionQuestion } from './conditionQuestionEngine';

export interface AIConversationContext {
  patientId: string;
  patientName: string;
  consultationId?: string;
  medicineSystem: MedicineSystem;
  selectedHospitalId?: string;
  selectedHospitalName?: { en: string; ta: string; hi: string };
  selectedDoctorId?: string;
  selectedDoctorName?: { en: string; ta: string; hi: string };
  selectedDoctorQualification?: string;
  selectedDoctorRoom?: string;
  ageGroup: 'ADULT' | 'CHILD';
  age?: number;
  sex: 'MALE' | 'FEMALE' | 'OTHER';
  chiefComplaint: string;
  chiefComplaintLocalized?: { en: string; ta: string; hi: string };
  bodySelections: BodyMapSelection[];
  duration: string;
  severity: number;
  character?: string;
  triggers: string[];
  associatedSymptoms: string[];
  ayushAssessment: AYUSHCaseTaking;
  yogaAssessment?: YogaAssessment;
  siddhaAssessment?: SiddhaAssessment;
  unaniAssessment?: UnaniAssessment;
  allopathyAssessment?: AllopathySOCRATES;
  answers: Array<{
    questionId: string;
    questionText: string;
    englishQuestion?: string;
    tamilQuestion?: string;
    hindiQuestion?: string;
    answerText: string;
    answerLocalized?: { en: string; ta: string; hi: string };
    detectedLanguage?: 'en' | 'ta' | 'hi' | 'mixed';
    structuredInterpretation?: StructuredInterpretation;
  }>;
  redFlags: string[];
  contextTrail?: string[];
  isSufficient?: boolean;
  unansweredQuestions?: string[];
  isRoutineTest?: boolean;
  routineTestCategory?: string;
}

export interface AdaptiveEvaluationResult {
  nextQuestion: AIQuestion | null;
  isSufficient: boolean;
  progressPercent: number;
  contextTrail: string[];
  detectedRedFlags: string[];
}

class AIEngine {
  // Check red-flag keywords from user input
  public detectRedFlags(text: string): string[] {
    const lower = text.toLowerCase();
    const flags: string[] = [];

    if (
      lower.includes('chest pain') ||
      lower.includes('நெஞ்சு வலி') ||
      lower.includes('heart attack') ||
      lower.includes('left arm pain') ||
      lower.includes('सीने में दर्द')
    ) {
      flags.push('CRITICAL: Acute Chest Discomfort / Suspected Cardiac Event');
    }

    if (
      lower.includes('cannot breathe') ||
      lower.includes('severe breath') ||
      lower.includes('மூச்சுத் திணறல்') ||
      lower.includes('choking') ||
      lower.includes('सांस फूलना')
    ) {
      flags.push('CRITICAL: Acute Respiratory Distress');
    }

    if (
      lower.includes('paralysis') ||
      lower.includes('face droop') ||
      lower.includes('speech slur') ||
      lower.includes('stroke') ||
      lower.includes('பக்கவாதம்') ||
      lower.includes('लकवा')
    ) {
      flags.push('CRITICAL: Suspected Acute Stroke / Focal Neurological Deficit');
    }

    if (
      lower.includes('unconscious') ||
      lower.includes('fainted') ||
      lower.includes('blackout') ||
      lower.includes('மயக்கம்') ||
      lower.includes('बेहोश')
    ) {
      flags.push('CRITICAL: Syncope / Altered Sensorium');
    }

    if (
      lower.includes('heavy bleeding') ||
      lower.includes('severe bleeding') ||
      lower.includes('இரத்தப்போக்கு') ||
      lower.includes('खून बहना')
    ) {
      flags.push('CRITICAL: Severe Uncontrolled Hemorrhage');
    }

    return flags;
  }

  // Evaluate clinical sufficiency
  public evaluateSufficiency(context: AIConversationContext): { isSufficient: boolean; progressPercent: number } {
    const answeredCount = context.answers.length;
    let score = 0;

    if (context.chiefComplaint) score += 25;
    if (context.bodySelections.length > 0 || context.answers.some(a => a.questionId.includes('LOCATION'))) score += 25;
    if (context.character || context.answers.some(a => a.questionId.includes('CHARACTER') || a.questionId.includes('ONSET') || a.questionId.includes('RADIATION'))) score += 25;
    if (context.duration || answeredCount >= 3) score += 25;

    const progressPercent = Math.min(100, Math.max(20, Math.round((answeredCount / 4) * 100)));
    const isSufficient = (answeredCount >= 3 && Boolean(context.chiefComplaint)) || (Boolean(context.chiefComplaint) && this.getNextAdaptiveQuestion(context) === null);

    return { isSufficient, progressPercent };
  }

  // Generative AI Adaptive Question Selection Engine
  public getNextAdaptiveQuestion(context: AIConversationContext): AIQuestion | null {
    const answeredIds = new Set(context.answers.map(a => a.questionId));
    const complaint = (context.chiefComplaint || '').toLowerCase();
    const system = context.medicineSystem || 'AYURVEDA';

    // 1. If Chief Complaint not answered -> Ask Chief Complaint
    if (!context.chiefComplaint && !answeredIds.has('Q_CHIEF_COMPLAINT')) {
      return {
        id: 'Q_CHIEF_COMPLAINT',
        questionNumber: context.answers.length + 1,
        totalEstimatedQuestions: 5,
        category: 'CHIEF_COMPLAINT',
        text: {
          en: 'What is your main health problem or chief complaint today?',
          ta: 'இன்று நீங்கள் மருத்துவமனைக்கு வந்ததற்கான முதன்மை உடல் உபாதை என்ன?',
          hi: 'आज आपकी मुख्य स्वास्थ्य समस्या या लक्षण क्या है?',
        },
        audioPromptText: {
          en: 'Please select your main health problem or tap the microphone to speak naturally.',
          ta: 'தயவுசெய்து உங்கள் முக்கிய பிரச்சனையைத் தேர்ந்தெடுக்கவும் அல்லது மைக்ரோஃபோனில் பேசவும்.',
          hi: 'कृपया अपनी मुख्य समस्या चुनें या बोलकर बताएं।',
        },
        inputType: 'CHOICE_CARDS',
        options: [
          {
            id: 'stomach_pain',
            label: { en: 'Stomach Pain / Gastric Acidity', ta: 'வயிற்று வலி / நெஞ்செரிச்சல் / அஜீரணம்', hi: 'पेट दर्द / एसिडिटी / गैस' },
            subLabel: { en: 'Abdominal pain, burning, gas, or nausea', ta: 'வயிற்று எரிச்சல், உப்புசம் அல்லது செரியாமை', hi: 'पेट में जलन, भारीपन या अपच' },
            icon: 'Activity',
            contextTag: 'digestion',
          },
          {
            id: 'joints_spine',
            label: { en: 'Back Ache / Joint Pain / Stiffness', ta: 'முதுகு வலி / மூட்டு வலி / வாத பிடிப்பு', hi: 'पीठ दर्द / जोड़ों में दर्द व अकड़न' },
            subLabel: { en: 'Spine, knees, neck, or muscular pain', ta: 'முதுகுத்தண்டு, முழங்கால் அல்லது தசை வலி', hi: 'रीढ़ की हड्डी, घुटने या मांसपेशियों का दर्द' },
            icon: 'User',
            contextTag: 'musculoskeletal',
          },
          {
            id: 'fever_warmth',
            label: { en: 'Fever, Chills & Body Warmth', ta: 'காய்ச்சல், நடுக்கம் & உடல் உஷ்ணம்', hi: 'बुखार, कंपकंपी एवं शारीरिक गर्माहट' },
            subLabel: { en: 'High temperature, fatigue, or body ache', ta: 'அதிக உடல் சூடு, அசதி அல்லது உடல் வலி', hi: 'तेज बुखार, बदन दर्द या कमजोरी' },
            icon: 'Thermometer',
            contextTag: 'infection',
          },
          {
            id: 'cough_breathing',
            label: { en: 'Cough, Phlegm & Breathlessness', ta: 'இருமல், கபம் & மூச்சுத் திணறல்', hi: 'खांसी, कफ एवं सांस फूलना' },
            subLabel: { en: 'Respiratory congestion or chest tightness', ta: 'மார்பு சளி அல்லது மூச்சு இழுப்பு', hi: 'सीने में जकड़न या बलगम' },
            icon: 'Wind',
            contextTag: 'respiratory',
          },
          {
            id: 'headache_migraine',
            label: { en: 'Headache & Head Heaviness', ta: 'தலைவலி & தலைக்கனம் (ஒற்றைத் தலைவலி)', hi: 'सिर दर्द एवं सिर में भारीपन' },
            subLabel: { en: 'Throbbing ache, forehead tension, or migraine', ta: 'துடிக்கும் தலைவலி அல்லது நெற்றி வலி', hi: 'माइग्रेन या माथे का तेज दर्द' },
            icon: 'Brain',
            contextTag: 'headache',
          },
          {
            id: 'skin_allergy',
            label: { en: 'Skin Itching, Rashes or Eczema', ta: 'தோல் அரிப்பு, தடிப்பு & ஒவ்வாமை', hi: 'त्वचा में खुजली, चकत्ते एवं एलर्जी' },
            subLabel: { en: 'Redness, patches, or dryness', ta: 'சிவப்பு தடிப்புகள் அல்லது வறண்ட தோல்', hi: 'लाल चकत्ते या अत्यधिक रूखापन' },
            icon: 'AlertCircle',
            contextTag: 'dermatology',
          },
          {
            id: 'chest_pain_emergency',
            label: { en: 'Chest Pain or Squeezing Pressure', ta: 'மார்பு வலி அல்லது அழுத்தும் பாரம்', hi: 'सीने में गंभीर दर्द या दबाव' },
            subLabel: { en: 'Tightness, radiating to left arm or jaw', ta: 'இடது கை அல்லது தாடைக்கு பரவும் வலி', hi: 'बाएं हाथ या जबड़े तक फैलता दर्द' },
            icon: 'Heart',
            isEmergencyTrigger: true,
            contextTag: 'cardiac_emergency',
          },
          {
            id: 'other_complaint',
            label: { en: 'Other Health Concern (Speak or Type)', ta: 'வேறு உடல் பிரச்சனை (பேசலாம்/எழுதலாம்)', hi: 'अन्य स्वास्थ्य समस्या (बोलें या लिखें)' },
            subLabel: { en: 'Tap to explain in your own words', ta: 'உங்கள் சொந்த வார்த்தைகளில் விவரிக்கலாம்', hi: 'अपने शब्दों में विस्तार से बताएं' },
            icon: 'HelpCircle',
            contextTag: 'general',
          },
        ],
      };
    }

    // 2. CONDITION-SPECIFIC DYNAMIC QUESTION ROUTING (Back Pain, Headache, Abdominal Pain, Cough, Skin, Joints)
    const conditionCategory = detectConditionCategory(context.chiefComplaint, context.bodySelections);
    if (conditionCategory !== 'GENERAL') {
      // Redundancy check: If complaint already explicitly contains location or body map was selected, skip location question
      const hasLocationAlready =
        Boolean(context.bodySelections && context.bodySelections.length > 0) ||
        complaint.includes('lower back') ||
        complaint.includes('கீழ் முதுகு') ||
        complaint.includes('कमर') ||
        complaint.includes('upper back') ||
        complaint.includes('forehead') ||
        complaint.includes('நெற்றி') ||
        complaint.includes('माथा') ||
        complaint.includes('upper abdomen') ||
        complaint.includes('lower abdomen');

      let candidateQ = getNextConditionQuestion(conditionCategory, answeredIds, hasLocationAlready);

      if (candidateQ && (candidateQ.category === 'BODY_LOCATION' || candidateQ.id.includes('LOCATION')) && hasLocationAlready) {
        answeredIds.add(candidateQ.id);
        candidateQ = getNextConditionQuestion(conditionCategory, answeredIds, hasLocationAlready);
      }

      if (candidateQ) {
        return {
          ...candidateQ,
          questionNumber: context.answers.length + 1,
        };
      }

      // If condition-specific questions are completed:
      // Only ask duration if not yet known and answered count < 4
      if (!context.duration && !answeredIds.has('Q_DURATION_SEVERITY') && context.answers.length < 4) {
        return {
          id: 'Q_DURATION_SEVERITY',
          questionNumber: context.answers.length + 1,
          totalEstimatedQuestions: 4,
          category: 'SEVERITY',
          text: {
            en: 'How long have you had this problem, and how intense is the pain right now? (1 to 10):',
            ta: 'இந்த உபாதை எத்தனை நாட்களாக உள்ளது? தற்போதைய வலியின் தீவிரம் எவ்வளவு? (1 முதல் 10 வரை):',
            hi: 'यह समस्या कितने समय से है, और वर्तमान में दर्द की तीव्रता कितनी है? (1 से 10):',
          },
          audioPromptText: {
            en: 'Rate your pain severity on the slider from 1 to 10.',
            ta: 'வலியின் அளவை 1 முதல் 10 வரை தேர்ந்தெடுக்கவும்.',
            hi: 'दर्द की तीव्रता 1 से 10 तक चुनें।',
          },
          inputType: 'SEVERITY_SLIDER',
        };
      }

      // Sufficient clinical details collected for this condition!
      return null;
    }

    // The pain/discomfort location is identified directly using the Body Map on Screen 1.
    // The separate question "Where is the pain?" has been removed as per workflow requirements.
    // The body-map feature itself remains fully active and used to identify the pain/discomfort location.

    // 3. CHARACTER / NATURE OF SYMPTOM
    if (!context.character && !answeredIds.has('Q_CHARACTER')) {
      if (complaint.includes('stomach') || complaint.includes('வயிற்று') || complaint.includes('gastric')) {
        return {
          id: 'Q_CHARACTER_STOMACH',
          questionNumber: context.answers.length + 1,
          totalEstimatedQuestions: 5,
          category: 'CHARACTER',
          text: {
            en: 'What does the stomach pain feel like? (Character of pain):',
            ta: 'வயிற்று வலியின் தன்மை எவ்வாறு உள்ளது? (எரிச்சல், குடைச்சல், குத்துதல்):',
            hi: 'पेट दर्द किस प्रकार का महसूस होता है? (जलन, ऐंठन, चुभन):',
          },
          audioPromptText: {
            en: 'Is the pain burning, cramping, sharp stabbing, or a dull continuous ache?',
            ta: 'வலி எரியும் தன்மையா, பிடித்து இழுக்கும் குடைச்சலா, அல்லது மந்தமான வலியா?',
            hi: 'क्या दर्द जलन जैसा है, ऐंठन है, या हल्का लगातार दर्द है?',
          },
          inputType: 'CHOICE_CARDS',
          options: [
            {
              id: 'burning_acidic',
              label: { en: 'Burning / Acidic sensation (Pitta / Heat)', ta: 'எரியும் தன்மை / நெஞ்செரிச்சல் (பித்த உஷ்ணம்)', hi: 'जलन युक्त / एसिडिटी (पित्त प्रकोप)' },
              subLabel: { en: 'Feels like fire or burning in the stomach', ta: 'வயிற்றில் தீ எரியும் உணர்வு', hi: 'पेट में जलन का अहसास' },
              icon: 'Thermometer',
              contextTag: 'burning',
            },
            {
              id: 'cramping_colicky',
              label: { en: 'Cramping / Twisting spasms (Vata / Gas)', ta: 'பிடித்து இழுக்கும் குடைச்சல் / முறுக்கும் வலி (வாதம்)', hi: 'ऐंठन / मरोड़ वाला दर्द (वात विकार)' },
              subLabel: { en: 'Comes in waves with gas bloating', ta: 'அலை போல வந்து போகும் வாய்வு வலி', hi: 'रुक-रुक कर उठने वाला दर्द' },
              icon: 'Activity',
              contextTag: 'cramping',
            },
            {
              id: 'dull_heavy_ache',
              label: { en: 'Dull, Heavy & Constant Pressure (Kapha)', ta: 'மந்தமான கனத்த வலி / பாரம் (கபம்)', hi: 'धीमा लगातार भारीपन (कफ विकार)' },
              subLabel: { en: 'Fullness and heaviness without sharp pain', ta: 'வயிற்று பாரம் மற்றும் அஜீரணம்', hi: 'पेट भरा-भरा एवं भारी लगना' },
              icon: 'Compass',
              contextTag: 'dull_heavy',
            },
            {
              id: 'sharp_stabbing',
              label: { en: 'Sharp, Stabbing or Piercing Pain', ta: 'கூர்மையான குத்தும் வலி', hi: 'तेज चुभने वाला दर्द' },
              subLabel: { en: 'Sudden intense pain localized to one spot', ta: 'ஒரே இடத்தில் திடீரென குத்தும் தீவிர வலி', hi: 'एक जगह तेज चुभन' },
              icon: 'AlertCircle',
              contextTag: 'sharp',
            },
          ],
        };
      }

      if (complaint.includes('joint') || complaint.includes('back') || complaint.includes('முதுகு') || complaint.includes('மூட்டு')) {
        return {
          id: 'Q_CHARACTER_JOINTS',
          questionNumber: context.answers.length + 1,
          totalEstimatedQuestions: 5,
          category: 'CHARACTER',
          text: {
            en: 'How would you describe the joint or back discomfort?',
            ta: 'மூட்டு அல்லது முதுகு வலியின் தன்மையை எவ்வாறு விவரிப்பீர்கள்?',
            hi: 'जोड़ों या पीठ के दर्द का प्रकार कैसा है?',
          },
          audioPromptText: {
            en: 'Is there morning stiffness, sharp shooting pain, swelling, or continuous ache?',
            ta: 'காலை நேர விரைப்பு உள்ளதா, அல்லது இழுக்கும் வலியா?',
            hi: 'क्या सुबह अकड़न होती है, या खिंचाव वाला दर्द है?',
          },
          inputType: 'CHOICE_CARDS',
          options: [
            {
              id: 'morning_stiffness',
              label: { en: 'Severe Morning Stiffness (Takes 30+ mins to ease)', ta: 'காலை நேர மூட்டு விரைப்பு (நடமாட சிரமம்)', hi: 'सुबह उठने पर जोड़ों में तेज अकड़न' },
              subLabel: { en: 'Difficulty bending or moving after waking up', ta: 'எழுந்தவுடன் அசைக்க முடியாத இறுக்கம்', hi: 'सुबह हिलने-डुलने में परेशानी' },
              icon: 'Clock',
            },
            {
              id: 'shooting_radiating',
              label: { en: 'Shooting or Radiating Nerve Pain down the leg/arm', ta: 'கால் அல்லது கை வரை பாயும் நரம்பு வலி', hi: 'पैर या हाथ में नीचे तक खिंचने वाला दर्द' },
              subLabel: { en: 'Sciatica or nerve compression pattern', ta: 'சயாட்டிகா நரம்பு வலி போன்ற உணர்வு', hi: 'साइटिका जैसा नस का खिंचाव' },
              icon: 'Activity',
            },
            {
              id: 'swelling_warmth',
              label: { en: 'Visible Swelling, Warmth & Tenderness', ta: 'வீக்கம், சூடு மற்றும் தொட்டால் வலி', hi: 'सूजन, गर्माहट एवं छूने पर दर्द' },
              subLabel: { en: 'Inflammatory joint presentation', ta: 'மூட்டில் நீர் கோர்த்தல் மற்றும் அழற்சி', hi: 'जोड़ में सूजन एवं लालिमा' },
              icon: 'Thermometer',
            },
            {
              id: 'continuous_dull_ache',
              label: { en: 'Dull Continuous Ache (Worse after fatigue)', ta: 'தொடர்ச்சியான மந்தமான வலி (அசதியில் கூடும்)', hi: 'लगातार बना रहने वाला धीमा दर्द' },
              subLabel: { en: 'Wear and tear or postural muscle strain', ta: 'தசை சோர்வு அல்லது தேய்மானம்', hi: 'मांसपेशियों का तनाव व थकान' },
              icon: 'User',
            },
          ],
        };
      }
    }

    // 4. DURATION & SEVERITY SLIDER
    if (!context.duration && !answeredIds.has('Q_DURATION_SEVERITY')) {
      return {
        id: 'Q_DURATION_SEVERITY',
        questionNumber: context.answers.length + 1,
        totalEstimatedQuestions: 5,
        category: 'SEVERITY',
        text: {
          en: 'How long have you had this problem, and how intense is the pain right now? (1 to 10):',
          ta: 'இந்த உபாதை எத்தனை நாட்களாக உள்ளது? தற்போதைய வலியின் தீவிரம் எவ்வளவு? (1 முதல் 10 வரை):',
          hi: 'यह समस्या कितने समय से है, और वर्तमान में दर्द की तीव्रता कितनी है? (1 से 10):',
        },
        audioPromptText: {
          en: 'Rate your pain severity on the slider from 1 to 10.',
          ta: 'ஸ்லைடர் மூலம் வலியின் அளவை 1 முதல் 10 வரை தேர்ந்தெடுக்கவும்.',
          hi: 'स्लाइडर से दर्द की तीव्रता 1 से 10 तक चुनें।',
        },
        inputType: 'SEVERITY_SLIDER',
      };
    }

    // 5. SYSTEM-SPECIFIC ADAPTIVE CLINICAL BRANCHING

    // === AYURVEDA BRANCHING ===
    if (system === 'AYURVEDA') {
      // If digestive/stomach complaint: Ask food relationship (Ahara/Agni)
      if (
        (complaint.includes('stomach') || complaint.includes('acidity') || complaint.includes('வயிற்று')) &&
        !answeredIds.has('Q_AYU_FOOD_RELATION')
      ) {
        return {
          id: 'Q_AYU_FOOD_RELATION',
          questionNumber: context.answers.length + 1,
          totalEstimatedQuestions: 6,
          category: 'TRIGGERS',
          text: {
            en: 'Does your stomach discomfort become worse after eating spicy, sour, or oily foods?',
            ta: 'காரம், புளிப்பு அல்லது எண்ணெய் பலகாரங்கள் சாப்பிட்ட பிறகு உங்கள் வயிற்று வலி அல்லது எரிச்சல் அதிகமாகிறதா?',
            hi: 'क्या तीखा, खट्टा या तला-भुना खाना खाने के बाद पेट दर्द या जलन बढ़ जाती है?',
          },
          audioPromptText: {
            en: 'Does the burning become worse after spicy, sour, or fried food?',
            ta: 'காரமான அல்லது புளிப்பான உணவு உண்ட பின் வலி அதிகமாகிறதா?',
            hi: 'क्या मिर्च-मसालेदार या खट्टे खाने से परेशानी बढ़ती है?',
          },
          inputType: 'CHOICE_CARDS',
          options: [
            {
              id: 'worse_after_spicy_sour',
              label: { en: 'Yes, significantly worse after spicy / sour food', ta: 'ஆம், காரம்/புளிப்பு சாப்பிட்டவுடன் மிக அதிகமாகிறது', hi: 'हां, तीखे या खट्टे भोजन के बाद काफी बढ़ जाता है' },
              subLabel: { en: 'Suggests high Pitta aggravation and gastric mucosal irritation', ta: 'பித்த அதிகரிப்பு மற்றும் அமிலத்தன்மை அறிகுறி', hi: 'पित्त वृद्धि एवं एसिडिटी का लक्षण' },
              icon: 'Thermometer',
            },
            {
              id: 'worse_on_empty_stomach',
              label: { en: 'Worse when stomach is empty, relieved after meals', ta: 'வெறும் வயிற்றில் அதிகமாகிறது, உணவு உண்ட பின் குறைகிறது', hi: 'खाली पेट ज्यादा होता है, खाने पर आराम मिलता है' },
              subLabel: { en: 'Classic Parinama Shula (hyperacidity / ulcer sign)', ta: 'பரிணாம சூலை (அமில புண் அறிகுறி)', hi: 'अम्लपित्त / अल्सर का लक्षण' },
              icon: 'Clock',
            },
            {
              id: 'worse_immediately_after_eating',
              label: { en: 'Worse immediately after any meal (Heavy stomach / Ama)', ta: 'எந்த உணவு உண்டாலும் உடனே வயிறு கனத்து வலிக்கிறது', hi: 'कुछ भी खाने के तुरंत बाद पेट भारी होकर दर्द होता है' },
              subLabel: { en: 'Indicates sluggish digestive fire (Manda Agni & Ama accumulation)', ta: 'அக்னி மந்தம் மற்றும் ஆம நச்சுத்தன்மை', hi: 'अग्निमांद्य एवं आम संचय का संकेत' },
              icon: 'Activity',
            },
            {
              id: 'no_food_relation',
              label: { en: 'No noticeable connection with food habits', ta: 'உணவுக்கும் இந்த வலிக்கும் தொடர்பில்லை', hi: 'भोजन से कोई विशेष संबंध नहीं' },
              subLabel: { en: 'Continuous or non-dietary trigger', ta: 'தொடர்ச்சியான அசௌகரியம்', hi: 'लगातार बना रहने वाला दर्द' },
              icon: 'Compass',
            },
          ],
        };
      }

      // Ashtavidha Jihva (Tongue assessment)
      if (!answeredIds.has('Q_AYU_JIHVA')) {
        return {
          id: 'Q_AYU_JIHVA',
          questionNumber: context.answers.length + 1,
          totalEstimatedQuestions: 6,
          category: 'AYUSH_JIHVA',
          text: {
            en: 'Ayurvedic Tongue Examination (Jihva Pariksha): How does your tongue appear in the morning?',
            ta: 'ஆயுர்வேத நாக்கு பரிசோதனை (ஜிஹ்வா பரீட்சை): காலையில் உங்கள் நாக்கில் வெள்ளை படிவு உள்ளதா?',
            hi: 'आयुर्वेदिक जिह्वा परीक्षा: सुबह आपकी जीभ पर कैसी परत या रंग दिखता है?',
          },
          audioPromptText: {
            en: 'Is your tongue coated with a thick white layer, reddish with burning, or clean pink?',
            ta: 'நாக்கில் தடிமனான வெள்ளை படிவு உள்ளதா, அல்லது சிவந்து எரிகிறதா?',
            hi: 'क्या जीभ पर सफेद परत है, या जीभ लाल होकर जलती है?',
          },
          inputType: 'CHOICE_CARDS',
          options: [
            {
              id: 'thick_white_ama',
              label: { en: 'Thick White Coating (Ama / Sluggish Digestion)', ta: 'தடிமனான வெள்ளை படிவு (ஆமம் / அக்னி மந்தம்)', hi: 'मोटी सफेद परत (आम संचय / अपच)' },
              subLabel: { en: 'Sticky white coating indicates metabolic endotoxins (Ama)', ta: 'செரிமான நச்சுக்கள் மற்றும் கப படிவு', hi: 'आमाशय में अपच एवं कफ का संकेत' },
              icon: 'Activity',
            },
            {
              id: 'red_dry_pitta',
              label: { en: 'Red, Dry or Cracked with Burning Sensation', ta: 'சிவந்து வறண்ட அல்லது எரியும் நாக்கு (பித்தம்)', hi: 'लाल, सूखी या जलन वाली जीभ (पित्त)' },
              subLabel: { en: 'Excessive internal heat (Ushnata) and Pitta aggravation', ta: 'உடல் உஷ்ணம் மற்றும் பித்த அதிகரிப்பு', hi: 'अत्यधिक शारीरिक गर्मी एवं पित्त' },
              icon: 'Thermometer',
            },
            {
              id: 'pale_scalloped_vata_kapha',
              label: { en: 'Pale with Teeth Marks on Edges (Low Vitality)', ta: 'வெளிறிய, பற்கள் பதிந்த நாக்கு (பலவீனம்)', hi: 'फीकी एवं किनारों पर दांतों के निशान (कमजोरी)' },
              subLabel: { en: 'Indicates poor absorption or low Ojas vitality', ta: 'உணவு சத்து உறிஞ்சாமை அல்லது சோகை', hi: 'पोषक तत्वों की कमी या वात-कफ' },
              icon: 'User',
            },
            {
              id: 'clean_moist_sama',
              label: { en: 'Clean, Pink and Moist (Balanced / Sama)', ta: 'சுத்தமான, இளஞ்சிவப்பு & ஈரப்பதம் (சம நிலை)', hi: 'साफ, गुलाबी एवं नम (संतुलित / सम)' },
              subLabel: { en: 'Healthy digestive fire and dosha balance', ta: 'சீரான ஆரோக்கிய நிலை', hi: 'संतुलित त्रिदोष' },
              icon: 'Check',
            },
          ],
        };
      }

      // Ashtavidha Mala (Bowel / Digestion status)
      if (!answeredIds.has('Q_AYU_MALA')) {
        return {
          id: 'Q_AYU_MALA',
          questionNumber: context.answers.length + 1,
          totalEstimatedQuestions: 6,
          category: 'AYUSH_MALA',
          text: {
            en: 'Ayurvedic Bowel Assessment (Mala / Koshta Pariksha): What is the regular nature of your bowel movements?',
            ta: 'மலப் பரிசோதனை (கோஷ்ட பரீட்சை): உங்கள் மலம் கழிக்கும் பழக்கம் எவ்வாறு உள்ளது?',
            hi: 'आयुर्वेदिक कोष्ठ एवं मल परीक्षा: आपका पेट साफ होने का क्रम कैसा रहता है?',
          },
          audioPromptText: {
            en: 'Describe your bowel habit: Hard dry stools, loose with burning, sticky with mucus, or regular?',
            ta: 'மலச்சிக்கலா, இளகிய மலமா, அல்லது வழக்கமானதா?',
            hi: 'क्या कब्ज रहता है, दस्त/जलन होती है, या पेट नियमित साफ होता है?',
          },
          inputType: 'CHOICE_CARDS',
          options: [
            {
              id: 'dry_constipated_vata',
              label: { en: 'Hard, Dry & Constipated (Vata / Krura Koshta)', ta: 'வறண்ட கடின மலச்சிக்கல் (வாத ஆதிக்கம்)', hi: 'कब्ज, सूखा एवं सख्त मल (क्रूर कोष्ठ / वात)' },
              subLabel: { en: 'Irregular bowel habit with dryness in colon', ta: 'குடலில் வாத உலர்ச்சி அதிகரிப்பு', hi: 'आंतों में रूखापन एवं अनियमितता' },
              icon: 'Activity',
            },
            {
              id: 'loose_burning_pitta',
              label: { en: 'Loose, Frequent or Burning (Pitta / Mridu Koshta)', ta: 'இளகிய மலம், உடனடி அவசரம் அல்லது எரிச்சல் (பித்தம்)', hi: 'पतला शौच, बार-बार जाना या जलन (मृदु कोष्ठ / पित्त)' },
              subLabel: { en: 'Accelerated digestion with excess Pitta heat', ta: 'அதிக பித்த உஷ்ணம் மற்றும் விரைவு வெளியேற்றம்', hi: 'पित्त की गर्मी एवं तीव्र गति' },
              icon: 'Thermometer',
            },
            {
              id: 'sticky_mucus_ama',
              label: { en: 'Sticky with Mucus (Ama / Kapha Dominance)', ta: 'பிசுபிசுப்பு / சளி சேர்ந்த மலம் (ஆம நச்சு)', hi: 'चिपचिपा या बलगम युक्त मल (आम दोष)' },
              subLabel: { en: 'Sinks in water and leaves feeling of incomplete evacuation', ta: 'முழுமையாக வெளியேறாத மந்த உணர்வு', hi: 'पेट पूरी तरह साफ न होने का अहसास' },
              icon: 'AlertCircle',
            },
            {
              id: 'regular_easy_sama',
              label: { en: 'Regular, Formed & Easy Evacuation (Madhyama)', ta: 'சீரான, எளிதான மலம் கழித்தல் (மத்தியம கோஷ்டம்)', hi: 'नियमित, बंधा हुआ एवं सहज निष्कासन (मध्यम कोष्ठ)' },
              subLabel: { en: 'Balanced digestion and healthy gut motility', ta: 'ஆரோக்கியமான செரிமானம்', hi: 'उचित पाचन एवं स्वास्थ्य' },
              icon: 'Check',
            },
          ],
        };
      }
    }

    // === YOGA & NATUROPATHY BRANCHING ===
    if (system === 'YOGA_NATUROPATHY') {
      // Sitting hours & postural load
      if (!answeredIds.has('Q_YOGA_POSTURE_SITTING')) {
        return {
          id: 'Q_YOGA_POSTURE_SITTING',
          questionNumber: context.answers.length + 1,
          totalEstimatedQuestions: 6,
          category: 'YOGA_POSTURE',
          text: {
            en: 'How many hours do you spend sitting continuously each day, and does rest or movement ease the discomfort?',
            ta: 'தினசரி தொடர்ச்சியாக எத்தனை மணி நேரம் அமர்ந்திருக்கிறீர்கள்? அசைவு அல்லது ஓய்வு உங்கள் வலியை குறைக்கிறதா?',
            hi: 'आप प्रतिदिन लगातार कितने घंटे बैठकर काम करते हैं, और क्या हिलने-डुलने या आराम से दर्द घटता है?',
          },
          audioPromptText: {
            en: 'How many hours do you sit each day, and does posture affect your symptoms?',
            ta: 'தினமும் எத்தனை மணி நேரம் உட்கார்ந்து வேலை செய்கிறீர்கள்?',
            hi: 'दिन में कितने घंटे बैठते हैं, क्या बैठने से दर्द बढ़ता है?',
          },
          inputType: 'CHOICE_CARDS',
          options: [
            {
              id: 'sitting_over_6_hours_worse',
              label: { en: 'Sit 6+ hours daily; pain gets much worse after sitting', ta: 'தினசரி 6+ மணி நேரம் அமர்கிறேன்; அமர்ந்தால் வலி கூடுகிறது', hi: 'रोज 6+ घंटे बैठते हैं; बैठने से दर्द काफी बढ़ता है' },
              subLabel: { en: 'Suggests postural ligamentous strain or disc compression', ta: 'தவறான அமரும் நிலையால் ஏற்படும் தசை இறுக்கம்', hi: 'गलत बैठने की मुद्रा से खिंचाव' },
              icon: 'Clock',
            },
            {
              id: 'worse_on_standing_bending',
              label: { en: 'Worse during forward bending or prolonged standing', ta: 'குனியும் போது அல்லது நீண்ட நேரம் நிற்கும் போது கூடுகிறது', hi: 'आगे झुकने या देर तक खड़े रहने पर बढ़ता है' },
              subLabel: { en: 'Flexion sensitivity or lumbar spine overload', ta: 'இடுப்பு தண்டுவடத்தில் ஏற்படும் அதிக அழுத்தம்', hi: 'कमर की रीढ़ पर अत्यधिक दबाव' },
              icon: 'Activity',
            },
            {
              id: 'movement_stretching_relieves',
              label: { en: 'Gentle walking and stretching clearly relieves the stiffness', ta: 'லேசான நடைபயிற்சி மற்றும் நீட்சியால் வலி குறைகிறது', hi: 'हल्के टहलने या स्ट्रेचिंग से आराम मिलता है' },
              subLabel: { en: 'Indicates mechanical myofascial stiffness rather than acute disc prolapse', ta: 'தசை இறுக்கம் குறைந்து ரத்த ஓட்டம் சீராகிறது', hi: 'रक्त संचार बढ़ने से मांसपेशियों को राहत' },
              icon: 'Check',
            },
            {
              id: 'sitting_independent',
              label: { en: 'Discomfort is constant regardless of sitting posture', ta: 'அமரும் நிலைக்கும் இந்த வலிக்கும் தொடர்பில்லை', hi: 'बैठने या मुद्रा से कोई संबंध नहीं, दर्द लगातार है' },
              subLabel: { en: 'Independent of postural mechanics', ta: 'தொடர்ச்சியான உடல் அசௌகரியம்', hi: 'मुद्रा से स्वतंत्र परेशानी' },
              icon: 'Compass',
            },
          ],
        };
      }

      // Breathing pattern & chest mobility
      if (!answeredIds.has('Q_YOGA_BREATHING')) {
        return {
          id: 'Q_YOGA_BREATHING',
          questionNumber: context.answers.length + 1,
          totalEstimatedQuestions: 6,
          category: 'YOGA_BREATHING',
          text: {
            en: 'How is your natural breathing pattern throughout the day?',
            ta: 'உங்கள் இயல்பான மூச்சு விடும் முறை எவ்வாறு உள்ளது? (பிராணாயாம மதிப்பீடு):',
            hi: 'दिनभर आपकी सांस लेने की सामान्य स्थिति कैसी रहती है? (प्राणायाम मूल्यांकन):',
          },
          audioPromptText: {
            en: 'Is your breathing deep and relaxed, or shallow, rapid, or restricted?',
            ta: 'ஆழமான அமைதியான மூச்சா, அல்லது மேலோட்டமான விரைவு மூச்சா?',
            hi: 'क्या सांस गहरी और शांत है, या उथली और तेज चलती है?',
          },
          inputType: 'CHOICE_CARDS',
          options: [
            {
              id: 'shallow_chest_stress',
              label: { en: 'Shallow, rapid chest breathing with mental stress', ta: 'மேலோட்டமான விரைவு மூச்சு & மன அழுத்தம்', hi: 'उथली एवं तेज सांस, मानसिक तनाव के साथ' },
              subLabel: { en: 'Sympathetic nervous dominance (Prana imbalance)', ta: 'மன அழுத்தம் மற்றும் பதற்றத்தால் ஏற்படும் மேலோட்ட மூச்சு', hi: 'तनाव से होने वाली तेज सांस' },
              icon: 'Wind',
            },
            {
              id: 'shortness_on_mild_effort',
              label: { en: 'Breathlessness on climbing stairs or mild exertion', ta: 'படியேறும் போது அல்லது லேசான நடையில் மூச்சு வாங்குதல்', hi: 'सीढ़ियां चढ़ने या हल्के काम में सांस फूलना' },
              subLabel: { en: 'Reduced lung capacity or low endurance', ta: 'நுரையீரல் திறன் குறைவு அல்லது சோர்வு', hi: 'कम स्टैमिना या फेफड़ों की क्षमता में कमी' },
              icon: 'Activity',
            },
            {
              id: 'deep_calm_regular',
              label: { en: 'Deep, steady diaphragmatic abdominal breathing', ta: 'ஆழமான, சீரான அடிவயிற்று மூச்சு (அமைதி)', hi: 'गहरी, स्थिर एवं शांत पेट से सांस (संतुलित)' },
              subLabel: { en: 'Optimal parasympathetic tone and lung expansion', ta: 'ஆரோக்கியமான சுவாச நிலை', hi: 'उत्तम श्वसन स्वास्थ्य' },
              icon: 'Check',
            },
          ],
        };
      }

      // Contraindications & previous injuries
      if (!answeredIds.has('Q_YOGA_CONTRAINDICATIONS')) {
        return {
          id: 'Q_YOGA_CONTRAINDICATIONS',
          questionNumber: context.answers.length + 1,
          totalEstimatedQuestions: 6,
          category: 'YOGA_CONTRAINDICATION',
          text: {
            en: 'Safety Check: Have you had any past injuries, surgeries, spine issues, or high blood pressure?',
            ta: 'பாதுகாப்பு சரிபார்ப்பு: முந்தைய தண்டுவட காயம், அறுவை சிகிச்சை, அல்லது உயர் ரத்த அழுத்தம் உள்ளதா?',
            hi: 'सुरक्षा जांच: क्या आपको पहले कोई रीढ़ की चोट, सर्जरी, हर्निया या उच्च रक्तचाप की समस्या रही है?',
          },
          audioPromptText: {
            en: 'Do you have any spine injury, previous surgery, hernia, or high blood pressure?',
            ta: 'முந்தைய தண்டுவட காயம், அறுவை சிகிச்சை அல்லது உயர் ரத்த அழுத்தம் உள்ளதா?',
            hi: 'क्या पहले कोई चोट, सर्जरी या बीपी की समस्या रही है?',
          },
          inputType: 'CHOICE_CARDS',
          options: [
            {
              id: 'spine_disc_injury',
              label: { en: 'Previous spine disc prolapse / slip disc / neck injury', ta: 'தண்டுவட டிஸ்க் விலகல் / கழுத்து அல்லது முதுகு காயம்', hi: 'रीढ़ की डिस्क की समस्या / स्लिप डिस्क / गर्दन की चोट' },
              subLabel: { en: 'Important: Forward bending and intense spinal twists are contraindicated', ta: 'முக்கியம்: தீவிர குனிதல் மற்றும் முறுக்குதல் தவிர்க்கப்பட வேண்டும்', hi: 'आगे झुकने एवं मरोड़ने वाले आसन वर्जित' },
              icon: 'AlertCircle',
            },
            {
              id: 'hypertension_cardiac',
              label: { en: 'High Blood Pressure (BP) or Heart condition', ta: 'உயர் ரத்த அழுத்தம் (BP) அல்லது இதய நோய்', hi: 'उच्च रक्तचाप (हाई बीपी) या हृदय रोग' },
              subLabel: { en: 'Inverted postures (Sirshasana) and breath retention are contraindicated', ta: 'தலைகீழ் ஆசனங்கள் மற்றும் மூச்சை அடக்குதல் கூடாது', hi: 'शीर्षासन एवं सांस रोकना वर्जित' },
              icon: 'Heart',
            },
            {
              id: 'recent_abdominal_surgery',
              label: { en: 'Recent surgery, hernia, or abdominal weakness', ta: 'சமீபத்திய அறுவை சிகிச்சை அல்லது குடலிறக்கம் (ஹெர்னியா)', hi: 'हाल ही में कोई सर्जरी, हर्निया या कमजोरी' },
              subLabel: { en: 'Abdominal compression postures must be avoided', ta: 'வயிற்றை அழுத்தும் பயிற்சிகள் தவிர்க்கப்பட வேண்டும்', hi: 'पेट दबाने वाले अभ्यास वर्जित' },
              icon: 'Compass',
            },
            {
              id: 'none_safe_to_practice',
              label: { en: 'None of the above (No major medical restrictions)', ta: 'மேற்கூறிய எதுவும் இல்லை (உடல் ரீதியான தடைகள் இல்லை)', hi: 'उपरोक्त में से कोई नहीं (कोई गंभीर रुकावट नहीं)' },
              subLabel: { en: 'Safe for guided therapeutic movement evaluation', ta: 'ஆரோக்கிய வழிகாட்டுதல் பயிற்சிகளுக்கு உகந்தது', hi: 'सुरक्षित अभ्यास के लिए उपयुक्त' },
              icon: 'Check',
            },
          ],
        };
      }
    }

    // === SIDDHA BRANCHING ===
    if (system === 'SIDDHA') {
      // Mukkuttram evaluation (Vali, Azhal, Iyyam)
      if (!answeredIds.has('Q_SIDDHA_MUKKUTTRAM')) {
        return {
          id: 'Q_SIDDHA_MUKKUTTRAM',
          questionNumber: context.answers.length + 1,
          totalEstimatedQuestions: 6,
          category: 'SIDDHA_MUKKUTTRAM',
          text: {
            en: 'Siddha Clinical Assessment (முக்குற்ற ஆய்வு - வாதம், பித்தம், கபம்): Which of these bodily sensations do you experience most?',
            ta: 'சித்த மருத்துவ முக்குற்ற ஆய்வு: உங்கள் உடலில் பின்வருவனவற்றில் எந்த உணர்வு அதிகமாக உள்ளது?',
            hi: 'सिद्ध मुक्कुट्रम परीक्षा (वात, पित्त, कफ): आपके शरीर में कौन से लक्षण अधिक महसूस होते हैं?',
          },
          audioPromptText: {
            en: 'Which sensation is strongest: Body stiffness and dryness, intense burning and acid heat, or heaviness and phlegm?',
            ta: 'உடலில் வாத பிடிப்பா, பித்த உஷ்ணமா, அல்லது கப சளியா?',
            hi: 'शरीर में खिंचाव व रूखापन है, पित्त की गर्मी-जलन है, या कफ-भारीपन?',
          },
          inputType: 'CHOICE_CARDS',
          options: [
            {
              id: 'azhal_pitham',
              label: { en: 'Azhal / Pitham (Internal burning, bitter mouth, extreme thirst)', ta: 'அழல் / பித்தம் (உள் உஷ்ணம், வாய்க்கசப்பு, அதிக தாகம், நெஞ்செரிச்சல்)', hi: 'अझल / पित्त (अंदरूनी जलन, मुंह कड़वा, अत्यधिक प्यास, एसिडिटी)' },
              subLabel: { en: 'Dominance of Azhal Kutram (Heat / Fire element)', ta: 'தீ தத்துவ அதிகரிப்பு மற்றும் பித்த ஏற்றம்', hi: 'पित्त दोष की अधिकता' },
              icon: 'Thermometer',
            },
            {
              id: 'vali_vatham',
              label: { en: 'Vali / Vatham (Dry skin, wandering body aches, constipation)', ta: 'வளி / வாதம் (உடல் உலர்ச்சி, மூட்டு பிடிப்பு, நகரும் வலி, மலச்சிக்கல்)', hi: 'वली / वात (रूखापन, जोड़ों में अकड़न, बदलता हुआ दर्द, कब्ज)' },
              subLabel: { en: 'Dominance of Vali Kutram (Air / Wind element)', ta: 'காற்று தத்துவ ஏற்றம் மற்றும் வாத நோய் நாடல்', hi: 'वात दोष का प्रकोप' },
              icon: 'Activity',
            },
            {
              id: 'iyyam_kabam',
              label: { en: 'Iyyam / Kabam (Heavy head, thick phlegm, coldness, sweet taste)', ta: 'ஐயம் / கபம் (தலைக்கனம், சளி இருமல், மந்தம், குளிர்ந்த உடல்)', hi: 'अय्यम / कफ (सिर में भारीपन, कफ-बलगम, ठंडक, सुस्ती)' },
              subLabel: { en: 'Dominance of Iyyam Kutram (Water & Earth elements)', ta: 'நீர் மற்றும் நில தத்துவ கப ஏற்றம்', hi: 'कफ दोष की अधिकता' },
              icon: 'Wind',
            },
          ],
        };
      }

      // Envagai Thervu: Naa (Tongue) & Moothiram (Urine)
      if (!answeredIds.has('Q_SIDDHA_ENVAGAI')) {
        return {
          id: 'Q_SIDDHA_ENVAGAI',
          questionNumber: context.answers.length + 1,
          totalEstimatedQuestions: 6,
          category: 'AYUSH_MUTRA',
          text: {
            en: 'Siddha Envagai Thervu (எண்வகைத் தேர்வு - நா, மூத்திரம்): How is your urine and tongue sensation?',
            ta: 'எண்வகைத் தேர்வு (நா மற்றும் மூத்திரம்): சிறுநீர் கழிக்கும் நிலை மற்றும் நாக்கின் சுவை எவ்வாறு உள்ளது?',
            hi: 'सिद्ध एनवागई थेरवु: पेशाब का रंग और जीभ का स्वाद कैसा रहता है?',
          },
          audioPromptText: {
            en: 'Is your urine deep yellow with burning, or clear, or with foam?',
            ta: 'சிறுநீர் அதிக மஞ்சள் மற்றும் எரிச்சலா, அல்லது இயல்பானதா?',
            hi: 'क्या पेशाब तेज पीला और जलन वाला है, या सामान्य है?',
          },
          inputType: 'CHOICE_CARDS',
          options: [
            {
              id: 'azhal_urine_yellow_burning',
              label: { en: 'Deep yellow or red with burning sensation during urination', ta: 'அடர் மஞ்சள் அல்லது எரிச்சலுடன் சிறுநீர் வெளியேறுதல் (அழல் நீர்)', hi: 'तेज पीला या जलन के साथ पेशाब (पित्त जनित)' },
              subLabel: { en: 'Indicates Azhal (Pitham) aggravation in urinary tract', ta: 'உடல் உஷ்ணம் மற்றும் பித்த நீர் பெருக்கம்', hi: 'शरीर में गर्मी की अधिकता' },
              icon: 'Thermometer',
            },
            {
              id: 'clear_pale_normal',
              label: { en: 'Clear or pale straw color with painless flow', ta: 'தெளிவான வெளிர் நிறம், வலியற்ற இயல்பான சிறுநீர்', hi: 'साफ हल्का पीला, बिना किसी दर्द या जलन के' },
              subLabel: { en: 'Normal hydration and doshic equilibrium', ta: 'சீரான நீர் சமநிலை', hi: 'उचित जल संतुलन' },
              icon: 'Check',
            },
            {
              id: 'turbid_cloudy_frothy',
              label: { en: 'Cloudy, turbid, or frothy with heaviness', ta: 'மங்கலான அல்லது நுரைத்த சிறுநீர் (கப நீர்)', hi: 'धुंधला या झागदार पेशाब' },
              subLabel: { en: 'May indicate Iyyam (Kapha) or urinary irritation', ta: 'சிறுநீர்ப் பாதை அழற்சி அல்லது கப அதிகரிப்பு', hi: 'संभावित संक्रमण या कफ' },
              icon: 'AlertCircle',
            },
          ],
        };
      }
    }

    // === UNANI BRANCHING ===
    if (system === 'UNANI') {
      // Mizaj (Temperament) assessment
      if (!answeredIds.has('Q_UNANI_MIZAJ')) {
        return {
          id: 'Q_UNANI_MIZAJ',
          questionNumber: context.answers.length + 1,
          totalEstimatedQuestions: 6,
          category: 'UNANI_MIZAJ',
          text: {
            en: 'Unani Clinical Assessment (Tashkhees-e-Mizaj / मिज़ाज): What is your general body temperament and reaction to weather/food?',
            ta: 'யுனானி மிசாஜ் உடலமைப்பு ஆய்வு: உங்கள் உடலின் இயல்பு மற்றும் வெப்பநிலை சகிப்புத்தன்மை எவ்வாறு உள்ளது?',
            hi: 'यूनानी मिज़ाज परीक्षा: आपके शरीर की सामान्य प्रकृति और मौसम/खान-पान पर प्रतिक्रिया कैसी है?',
          },
          audioPromptText: {
            en: 'Do you feel excessively hot, cold-intolerant, sluggish, or restless?',
            ta: 'உடல் எப்போது உஷ்ணமாக உணர்கிறதா, அல்லது குளிர் தாங்க முடியாதா?',
            hi: 'क्या शरीर हमेशा गर्म रहता है, ठंड बर्दाश्त नहीं होती, या भारीपन रहता है?',
          },
          inputType: 'CHOICE_CARDS',
          options: [
            {
              id: 'mizaj_har_safrawi',
              label: { en: 'Hot & Dry Temperament (Safrawi / Warm body, dry mouth, irritabile)', ta: 'வெப்பம் & உலர்ச்சி (சப்ராவீ - உடல் சூடு, வறண்ட வாய், எளிதில் கோபம்)', hi: 'गर्म एवं खुश्क मिज़ाज (सफरावी - शरीर गर्म, मुंह सूखा, तेज गुस्सा)' },
              subLabel: { en: 'Yellow bile dominance, intolerant to summer heat and spicy foods', ta: 'வெயில் மற்றும் கார உணவு தாங்க இயலாமை', hi: 'गर्मी और तीखे खाने से परेशानी' },
              icon: 'Thermometer',
            },
            {
              id: 'mizaj_barid_balghami',
              label: { en: 'Cold & Moist Temperament (Balghami / Intolerant to cold, sluggish digestion, excess saliva)', ta: 'குளிர்ச்சி & ஈரப்பதம் (பல்கமீ - குளிர் தாங்காத தன்மை, மந்த செரிமானம்)', hi: 'ठंडा एवं तर मिज़ाज (बलमी - ठंड बर्दाश्त न होना, सुस्त पाचन, भारीपन)' },
              subLabel: { en: 'Phlegm dominance, worse in winter and cold weather', ta: 'குளிர்காலத்தில் அதிகரிக்கும் உபாதைகள்', hi: 'सर्दियों में बढ़ने वाली परेशानी' },
              icon: 'Wind',
            },
            {
              id: 'mizaj_motadil',
              label: { en: 'Balanced Temperament (Mo\'tadil / Normal temperature & appetite)', ta: 'சமநிலையான உடலமைப்பு (மோததில் - இயல்பான பசி & தூக்கம்)', hi: 'संतुलित मिज़ाज (मोअतदिल - सामान्य तापमान, भूख एवं नींद)' },
              subLabel: { en: 'Equilibrium of bodily humors (Akhlaat)', ta: 'சீரான நல்வாழ்வு நிலை', hi: 'चारों अखलात का संतुलन' },
              icon: 'Check',
            },
          ],
        };
      }

      // Digestion (Hazm) & Sleep (Naum)
      if (!answeredIds.has('Q_UNANI_DIGESTION_SLEEP')) {
        return {
          id: 'Q_UNANI_DIGESTION_SLEEP',
          questionNumber: context.answers.length + 1,
          totalEstimatedQuestions: 6,
          category: 'TRIGGERS',
          text: {
            en: 'How is your digestion (Hazm) and restful sleep (Naum)?',
            ta: 'உங்கள் ஜீரண சக்தி (ஹஸ்ம்) மற்றும் நிம்மதியான தூக்கம் (நவ்ம்) எவ்வாறு உள்ளது?',
            hi: 'आपका पाचन (हज्म) और रात की नींद (नौम) कैसी रहती है?',
          },
          audioPromptText: {
            en: 'Do you experience belching, heaviness after meals, or disturbed sleep?',
            ta: 'உணவுக்குப் பின் ஏப்பம், செரியாமை அல்லது தூக்கமின்மை உள்ளதா?',
            hi: 'क्या खाने के बाद खट्टी डकारें, भारीपन या नींद की कमी है?',
          },
          inputType: 'CHOICE_CARDS',
          options: [
            {
              id: 'hazm_weak_bloating',
              label: { en: 'Weak digestion with sour belching, gas and bloating', ta: 'புளித்த ஏப்பம், வயிற்று உப்புசம் மற்றும் செரிமானக் குறைபாடு', hi: 'कमजोर पाचन, खट्टी डकारें एवं पेट फूलना' },
              subLabel: { en: 'Indicates Su-e-Hazm (gastric functional dyspepsia)', ta: 'செரிமான சுரப்பிகள் மந்த நிலை', hi: 'आमाशय की कमजोरी का संकेत' },
              icon: 'Activity',
            },
            {
              id: 'disturbed_insomnia',
              label: { en: 'Restless, interrupted sleep with mental anxiety', ta: 'தடைபடும் தூக்கம் மற்றும் மன அமைதியின்மை', hi: 'टूटी-फूटी नींद एवं मानसिक बेचैनी' },
              subLabel: { en: 'Affects bodily recuperation and Tabiyat', ta: 'உடல் புத்துணர்ச்சி தடைபடுதல்', hi: 'मानसिक तनाव का असर' },
              icon: 'Brain',
            },
            {
              id: 'hazm_normal_sound_sleep',
              label: { en: 'Good appetite, smooth digestion and deep sound sleep', ta: 'நல்ல பசி, சீரான செரிமானம் மற்றும் ஆழ்ந்த அமைதியான தூக்கம்', hi: 'अच्छी भूख, सहज पाचन एवं गहरी शांत नींद' },
              subLabel: { en: 'Healthy vital forces (Quwa)', ta: 'ஆரோக்கியமான வாழ்க்கை முறை', hi: 'उत्तम शारीरिक शक्ति' },
              icon: 'Check',
            },
          ],
        };
      }
    }

    // === ALLOPATHY (MODERN MEDICINE) BRANCHING ===
    if (system === 'ALLOPATHY_HOMEOPATHY') {
      // Onset & Radiation
      if (!answeredIds.has('Q_ALLO_ONSET_RADIATION')) {
        return {
          id: 'Q_ALLO_ONSET_RADIATION',
          questionNumber: context.answers.length + 1,
          totalEstimatedQuestions: 6,
          category: 'CHARACTER',
          text: {
            en: 'How did this symptom start, and does the pain radiate or travel anywhere else?',
            ta: 'இந்த அறிகுறி எவ்வாறு தொடங்கியது? வலி உடலின் வேறு பகுதிக்கு பரவுகிறதா?',
            hi: 'यह लक्षण कैसे शुरू हुआ, और क्या दर्द शरीर में कहीं और भी फैलता है?',
          },
          audioPromptText: {
            en: 'Did the pain start suddenly or gradually, and does it spread to your back, shoulder, or legs?',
            ta: 'வலி திடீரென வந்ததா, அல்லது மெதுவாக ஆரம்பித்ததா? வேறு பகுதிக்கு பரவுகிறதா?',
            hi: 'क्या दर्द अचानक शुरू हुआ या धीरे-धीरे, और क्या यह पीठ या हाथ-पैर में फैलता है?',
          },
          inputType: 'CHOICE_CARDS',
          options: [
            {
              id: 'sudden_sharp_onset',
              label: { en: 'Started suddenly (within minutes or hours) with severe intensity', ta: 'திடீரென தீவிரமாகத் தொடங்கியது (சில மணி நேரங்களுக்குள்)', hi: 'अचानक तेज तीव्रता के साथ शुरू हुआ' },
              subLabel: { en: 'Acute onset pattern requiring careful clinical evaluation', ta: 'உடனடி மருத்துவ கவனிப்பு தேவைப்படலாம்', hi: 'तीव्र शुरुआत' },
              icon: 'Clock',
            },
            {
              id: 'gradual_progressive',
              label: { en: 'Started gradually over days/weeks and slowly worsened', ta: 'நாட்கள் அல்லது வாரங்களில் படிப்படியாக அதிகரித்தது', hi: 'दिनों या हफ्तों में धीरे-धीरे बढ़ा' },
              subLabel: { en: 'Subacute or chronic progression pattern', ta: 'நீண்டகாலமாக மெல்ல வளர்ந்த பிரச்சனை', hi: 'लंबे समय से धीरे-धीरे बढ़ती समस्या' },
              icon: 'Compass',
            },
            {
              id: 'radiates_to_back_shoulder',
              label: { en: 'Pain radiates through to the back, shoulder blade, or arm', ta: 'முதுகு அல்லது தோள்பட்டை வரை பரவுகிறது', hi: 'दर्द पीठ या कंधे तक फैलता है' },
              subLabel: { en: 'Referred pain pathway (gallbladder/pancreas/cardiac)', ta: 'உடலின் பிற பகுதிக்கு பரவும் வலி', hi: 'अन्य अंगों में फैलता दर्द' },
              icon: 'Activity',
            },
            {
              id: 'localized_no_radiation',
              label: { en: 'Stays strictly localized in one spot with no spread', ta: 'ஒரே இடத்தில் மட்டுமே உள்ளது, எங்கும் பரவவில்லை', hi: 'केवल एक जगह सीमित है, फैलता नहीं' },
              subLabel: { en: 'Focal anatomical origin', ta: 'குறிப்பிட்ட பகுதியில் மட்டும்', hi: 'एक ही स्थान पर' },
              icon: 'Check',
            },
          ],
        };
      }

      // Associated systemic symptoms
      if (!answeredIds.has('Q_ALLO_ASSOCIATED')) {
        return {
          id: 'Q_ALLO_ASSOCIATED',
          questionNumber: context.answers.length + 1,
          totalEstimatedQuestions: 6,
          category: 'ASSOCIATED',
          text: {
            en: 'Are you experiencing any accompanying symptoms like fever, vomiting, dizziness, or sweating?',
            ta: 'காய்ச்சல், வாந்தி, மயக்கம் அல்லது அதிக வியர்வை போன்ற பிற அறிகுறிகள் உள்ளதா?',
            hi: 'क्या आपको बुखार, उल्टी, चक्कर या पसीना आने जैसे अन्य लक्षण भी हैं?',
          },
          audioPromptText: {
            en: 'Do you have accompanying nausea, fever, dizziness, or cold sweating?',
            ta: 'வாந்தி, காய்ச்சல், மயக்கம் அல்லது வியர்வை உள்ளதா?',
            hi: 'क्या उल्टी, बुखार, चक्कर या पसीना आ रहा है?',
          },
          inputType: 'CHOICE_CARDS',
          options: [
            {
              id: 'nausea_vomiting',
              label: { en: 'Nausea or Repeated Vomiting', ta: 'குமட்டல் அல்லது தொடர் வாந்தி', hi: 'जी मिचलाना या लगातार उल्टी होना' },
              subLabel: { en: 'Risk of dehydration and electrolyte imbalance', ta: 'நீரிழப்பு மற்றும் உடல் சோர்வு அபாயம்', hi: 'शरीर में पानी की कमी का खतरा' },
              icon: 'Activity',
            },
            {
              id: 'fever_with_chills',
              label: { en: 'High Fever accompanied by Shivering / Chills', ta: 'நடுக்கத்துடன் கூடிய தீவிர காய்ச்சல்', hi: 'कंपकंपी के साथ तेज बुखार' },
              subLabel: { en: 'Suggests systemic inflammatory or infective focus', ta: 'தொற்று அல்லது அழற்சி அறிகுறி', hi: 'संक्रमण का संकेत' },
              icon: 'Thermometer',
            },
            {
              id: 'cold_sweating_dizziness',
              label: { en: 'Cold Sweating, Lightheadedness or Palpitations', ta: 'குளிர்ந்த வியர்வை, தலைசுற்றல் அல்லது படபடப்பு', hi: 'ठंडा पसीना, चक्कर आना या धड़कन तेज होना' },
              subLabel: { en: 'Potential hemodynamic instability — clinical priority', ta: 'உடனடி மருத்துவ கவனிப்பு தேவைப்படலாம்', hi: 'महत्वपूर्ण लक्षण' },
              icon: 'AlertCircle',
              isEmergencyTrigger: true,
            },
            {
              id: 'none_isolated',
              label: { en: 'None of the above (Isolated symptom only)', ta: 'மேற்கூறிய எதுவும் இல்லை (தனித்த அறிகுறி மட்டும்)', hi: 'इनमें से कोई नहीं (केवल मुख्य लक्षण है)' },
              subLabel: { en: 'No obvious acute systemic compromise', ta: 'வேறு தீவிர அறிகுறிகள் இல்லை', hi: 'अन्य कोई गंभीर लक्षण नहीं' },
              icon: 'Check',
            },
          ],
        };
      }

      // Past history & medications check
      if (!answeredIds.has('Q_ALLO_PAST_HISTORY')) {
        return {
          id: 'Q_ALLO_PAST_HISTORY',
          questionNumber: context.answers.length + 1,
          totalEstimatedQuestions: 6,
          category: 'HISTORY_CHECK',
          text: {
            en: 'Do you have any existing medical conditions or ongoing regular medications?',
            ta: 'நீரிழிவு, ரத்த அழுத்தம் போன்ற முந்தைய நோய்களோ அல்லது வழக்கமாக உட்கொள்ளும் மருந்துகளோ உள்ளதா?',
            hi: 'क्या आपको पहले से डायबिटीज, बीपी जैसी कोई बीमारी है या नियमित दवाएं ले रहे हैं?',
          },
          audioPromptText: {
            en: 'Do you have existing diabetes, hypertension, asthma, or regular medications?',
            ta: 'சர்க்கரை நோய், ரத்த அழுத்தம் அல்லது வழக்கமான மருந்துகள் உள்ளதா?',
            hi: 'क्या आपको डायबिटीज, बीपी, दमा या नियमित दवाएं चल रही हैं?',
          },
          inputType: 'CHOICE_CARDS',
          options: [
            {
              id: 'diabetes_hypertension',
              label: { en: 'Diabetes Mellitus or Hypertension (High BP)', ta: 'சர்க்கரை நோய் அல்லது உயர் ரத்த அழுத்தம் (BP)', hi: 'डायबिटीज (शुगर) या हाई बीपी' },
              subLabel: { en: 'Key cardiovascular and metabolic co-morbidities', ta: 'வளர்சிதை மாற்ற மற்றும் இதய நோய் வரலாறு', hi: 'महत्वपूर्ण सह-रुग्णता' },
              icon: 'Heart',
            },
            {
              id: 'asthma_allergy',
              label: { en: 'Asthma, Wheezing or Drug Allergies', ta: 'ஆஸ்துமா, மூச்சு இழுப்பு அல்லது மருந்து ஒவ்வாமை', hi: 'दमा (अस्थमा), एलर्जी या दवा से रिएक्शन' },
              subLabel: { en: 'Crucial for medication safety and prescribing', ta: 'மருந்துகள் பரிந்துரைக்கும் முன் கவனிக்கப்பட வேண்டியது', hi: 'दवा सुरक्षा के लिए आवश्यक' },
              icon: 'Wind',
            },
            {
              id: 'taking_blood_thinners_painkillers',
              label: { en: 'Regularly taking Painkillers, Steroids, or Blood Thinners', ta: 'வலி நிவாரணிகள் அல்லது ரத்தம் நீர்க்கும் மருந்துகள் உட்கொள்கிறேன்', hi: 'नियमित पेनकिलर, स्टेरॉयड या खून पतला करने वाली दवाएं' },
              subLabel: { en: 'May contribute to stomach irritation or bleeding risk', ta: 'வயிற்று புண் அல்லது ரத்தப்போக்கு அபாயம்', hi: 'पेट में जलन या अल्सर का जोखिम' },
              icon: 'Compass',
            },
            {
              id: 'no_prior_illness',
              label: { en: 'No known previous illnesses or long-term medications', ta: 'முந்தைய நோய்களோ அல்லது வழக்கமான மருந்துகளோ இல்லை', hi: 'पहले से कोई बीमारी या नियमित दवा नहीं' },
              subLabel: { en: 'Previously healthy baseline', ta: 'வழக்கமான நல்ல ஆரோக்கிய நிலை', hi: 'सामान्य स्वस्थ इतिहास' },
              icon: 'Check',
            },
          ],
        };
      }
    }

    // 6. FINAL OPEN INTIMATION / ADDITIONAL DETAILS
    if (!answeredIds.has('Q_ADDITIONAL_FINAL') && context.answers.length >= 4) {
      return {
        id: 'Q_ADDITIONAL_FINAL',
        questionNumber: context.answers.length + 1,
        totalEstimatedQuestions: context.answers.length + 1,
        category: 'ASSOCIATED',
        text: {
          en: 'Is there anything else you would like your consulting doctor to know? (Speak or type):',
          ta: 'மருத்துவரிடம் தெரிவிக்க விரும்பும் வேறு ஏதேனும் விவரங்கள் அல்லது குறிப்புகள் உள்ளதா? (பேசலாம் அல்லது எழுதலாம்):',
          hi: 'क्या डॉक्टर को बताने के लिए कोई अन्य महत्वपूर्ण बात या लक्षण है? (बोलें या लिखें):',
        },
        audioPromptText: {
          en: 'Is there anything else you want your doctor to know before we complete the summary?',
          ta: 'சுருக்கம் தயாரிக்கும் முன் மருத்துவரிடம் கூற வேறு விவரங்கள் உள்ளதா?',
          hi: 'डॉक्टर को बताने के लिए कोई अन्य बात है तो बताएं।',
        },
        inputType: 'VOICE_OR_TEXT',
      };
    }

    // All relevant questions covered
    return null;
  }

  // Generate structured summary with system-specific observations
  public generateSummary(context: AIConversationContext): AIConsultationSummary {
    const evalResult = emergencyDetector.evaluateSymptoms(
      context.answers.map(a => a.answerText),
      context.severity || 5,
      context.bodySelections[0]?.regionId,
      context.ageGroup
    );

    const redFlags = Array.from(new Set([...context.redFlags, ...evalResult.triggeredRedFlags]));

    // Populate system-specific findings from answers
    const answersText = context.answers.map(a => a.answerText).join(' ');

    let yogaObs: YogaAssessment | undefined = undefined;
    if (context.medicineSystem === 'YOGA_NATUROPATHY') {
      const postureAns = context.answers.find(a => a.questionId.includes('POSTURE'))?.answerText;
      const breathAns = context.answers.find(a => a.questionId.includes('BREATHING'))?.answerText;
      const contraAns = context.answers.find(a => a.questionId.includes('CONTRAINDICATIONS'))?.answerText;
      yogaObs = {
        postureAndSittingHours: postureAns || 'Evaluated in session',
        breathingPattern: breathAns || 'Diaphragmatic assessment logged',
        previousInjuryOrContraindication: contraAns || 'None reported',
        mobilityLimitation: context.bodySelections.map(b => b.regionName).join(', ') || 'Mild stiffness',
      };
    }

    let siddhaObs: SiddhaAssessment | undefined = undefined;
    if (context.medicineSystem === 'SIDDHA') {
      const mukAns = context.answers.find(a => a.questionId.includes('MUKKUTTRAM'))?.answerText || '';
      const envAns = context.answers.find(a => a.questionId.includes('ENVAGAI'))?.answerText || '';
      siddhaObs = {
        mukkuttramDominance: mukAns.includes('Azhal') ? 'Azhal (Pitham)' : mukAns.includes('Vali') ? 'Vali (Vatham)' : 'Iyyam (Kabam)',
        envagaiObservations: {
          moothiram: envAns || 'Examined in session',
          naa: context.ayushAssessment?.ashtavidhaPariksha?.jihvaReported || 'Reported',
          malam: context.ayushAssessment?.ashtavidhaPariksha?.malaReported || 'Reported',
        },
      };
    }

    let unaniObs: UnaniAssessment | undefined = undefined;
    if (context.medicineSystem === 'UNANI') {
      const mizajAns = context.answers.find(a => a.questionId.includes('MIZAJ'))?.answerText || '';
      const digAns = context.answers.find(a => a.questionId.includes('DIGESTION'))?.answerText || '';
      unaniObs = {
        mizajTemperament: mizajAns.includes('Safrawi') ? 'Safrawi (Choleric)' : mizajAns.includes('Balghami') ? 'Balghami (Phlegmatic)' : 'Damwi (Sanguine)',
        hazmDigestion: digAns || 'Reported in assessment',
        naumSleep: answersText.includes('sleep') ? 'Evaluated' : 'Normal',
      };
    }

    let alloObs: AllopathySOCRATES | undefined = undefined;
    if (context.medicineSystem === 'ALLOPATHY_HOMEOPATHY') {
      const onsetAns = context.answers.find(a => a.questionId.includes('ONSET'))?.answerText;
      const assocAns = context.answers.find(a => a.questionId.includes('ASSOCIATED'))?.answerText;
      const histAns = context.answers.find(a => a.questionId.includes('PAST_HISTORY'))?.answerText;
      alloObs = {
        site: context.bodySelections.map(b => b.regionName).join(', ') || 'Abdomen / Generalized',
        onset: onsetAns || 'Reported by patient',
        character: context.character || 'Assessed in interview',
        timingDuration: context.duration || 'Reported in session',
        associations: assocAns ? [assocAns] : [],
        pastMedicalHistory: histAns ? [histAns] : [],
      };
    }

    return {
      id: `SUM-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      patientId: context.patientId,
      createdAt: new Date().toISOString(),
      medicineSystem: context.medicineSystem || 'AYURVEDA',
      hospitalName: context.selectedHospitalName,
      doctorName: context.selectedDoctorName,
      doctorRoom: context.selectedDoctorRoom,
      chiefComplaint: context.chiefComplaint || 'Reported symptoms under review',
      chiefComplaintLocalized: context.chiefComplaintLocalized,
      symptomsList: context.answers.map(a => `${a.questionText}: ${a.answerText}`).filter(Boolean),
      duration: context.duration || 'As reported',
      severity: context.severity || 5,
      bodyLocations: context.bodySelections.map(b => `${b.regionName} (${b.side})`),
      associatedSymptoms: context.associatedSymptoms,
      ayushObservations: context.ayushAssessment,
      yogaObservations: yogaObs,
      siddhaObservations: siddhaObs,
      unaniObservations: unaniObs,
      allopathyObservations: alloObs,
      detectedRedFlags: redFlags,
      recommendedTriage: evalResult.triageLevel,
      confidenceScore: 0.95,
      unansweredQuestions: context.unansweredQuestions || [],
      disclaimer:
        'IMPORTANT CLINICAL NOTICE: This is an AI-generated pre-consultation information-collection summary. It does NOT constitute a confirmed medical diagnosis or prescription. Final diagnostic assessment and clinical treatment decisions are strictly made by the consulting physician.',
    };
  }
}

export const aiEngine = new AIEngine();
