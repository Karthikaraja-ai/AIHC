// Multilingual AI Interpreter & Clinical Entity Extraction Service
// Robust Cross-Lingual Interpretation for English, Tamil (தமிழ்), Hindi (हिन्दी), Tanglish, and Hinglish.

import { MedicineSystem } from '../types';
import { StructuredInterpretation } from '../types/ai';

export interface DetectedLanguageInfo {
  language: 'en' | 'ta' | 'hi' | 'mixed';
  confidence: number;
  hasTamilScript: boolean;
  hasHindiScript: boolean;
  hasLatinScript: boolean;
}

export interface InterpretationResult {
  detectedLanguage: 'en' | 'ta' | 'hi' | 'mixed';
  structured: StructuredInterpretation;
  normalizedText: string;
}

class MultilingualInterpreter {
  // 1. Language Detection (Unicode Script & Phonetic Loan Words)
  public detectLanguage(text: string): DetectedLanguageInfo {
    if (!text || !text.trim()) {
      return { language: 'en', confidence: 1.0, hasTamilScript: false, hasHindiScript: false, hasLatinScript: false };
    }

    const trimmed = text.trim();
    const tamilRegex = /[\u0B80-\u0BFF]/g;
    const hindiRegex = /[\u0900-\u097F]/g;
    const latinRegex = /[a-zA-Z]/g;

    const tamilMatches = (trimmed.match(tamilRegex) || []).length;
    const hindiMatches = (trimmed.match(hindiRegex) || []).length;
    const latinMatches = (trimmed.match(latinRegex) || []).length;
    const totalScriptChars = tamilMatches + hindiMatches + latinMatches;

    const hasTamilScript = tamilMatches > 0;
    const hasHindiScript = hindiMatches > 0;
    const hasLatinScript = latinMatches > 0;

    // Check for Romanized Tanglish/Hinglish indicators
    const lower = trimmed.toLowerCase();
    const isTanglish =
      hasLatinScript &&
      (/\b(vayiru|vali|irukku|iruku|rendu|moonu|naal|naatkal|romba|kaichal|thalai|nenju|kudaichal|eriyuthu|erichal|sapta|sapadu)\b/i.test(
        lower
      ) ||
        /-aa\b|-la\b/i.test(lower));

    const isHinglish =
      hasLatinScript &&
      /\b(dard|pet|seene|chhati|bukhar|sir|sar|khansi|ulti|chakkar|din|hafte|mahina|bahut|zyada|jalan|marod|ho\s*raha|hai)\b/i.test(
        lower
      );

    if ((hasTamilScript && hasLatinScript) || (hasHindiScript && hasLatinScript) || isTanglish || isHinglish) {
      return {
        language: 'mixed',
        confidence: 0.92,
        hasTamilScript,
        hasHindiScript,
        hasLatinScript,
      };
    }

    if (hasTamilScript && tamilMatches >= hindiMatches && tamilMatches >= latinMatches) {
      return {
        language: 'ta',
        confidence: totalScriptChars > 0 ? tamilMatches / totalScriptChars : 0.95,
        hasTamilScript: true,
        hasHindiScript: false,
        hasLatinScript: false,
      };
    }

    if (hasHindiScript && hindiMatches >= tamilMatches && hindiMatches >= latinMatches) {
      return {
        language: 'hi',
        confidence: totalScriptChars > 0 ? hindiMatches / totalScriptChars : 0.95,
        hasTamilScript: false,
        hasHindiScript: true,
        hasLatinScript: false,
      };
    }

    return {
      language: 'en',
      confidence: totalScriptChars > 0 ? latinMatches / totalScriptChars : 0.9,
      hasTamilScript: false,
      hasHindiScript: false,
      hasLatinScript: true,
    };
  }

  // 2. Extract Duration from English, Tamil, Hindi, Tanglish, Hinglish
  public extractDuration(text: string): string | undefined {
    const lower = text.toLowerCase();

    // 1 Day
    if (
      /\b(1\s*day|one\s*day|oru\s*naal|1\s*din|ek\s*din|kal\s*se|yesterday)\b/i.test(lower) ||
      /1\s*நாள்|ஒரு\s*நாள்|நேற்று|एक\s*दिन/i.test(lower)
    ) {
      return '1 day';
    }

    // 2 Days
    if (
      /\b(2\s*days|two\s*days|rendu\s*naal|2\s*din|do\s*din)\b/i.test(lower) ||
      /2\s*நாள்|இரண்டு\s*நாள்|ரெண்டு\s*நாள்|दो\s*दिन/i.test(lower)
    ) {
      return '2 days';
    }

    // 3 Days
    if (
      /\b(3\s*days|three\s*days|moonu\s*naal|3\s*din|teen\s*din)\b/i.test(lower) ||
      /3\s*நாள்|மூன்று\s*நாள்|மூணு\s*நாள்|3\s*நாட்களாக|மூன்று\s*நாட்களாக|तीन\s*दिन|3\s*दिन/i.test(lower)
    ) {
      return '3 days';
    }

    // 4-5 Days
    if (
      /\b(4\s*days|four\s*days|4\s*din|char\s*din)\b/i.test(lower) ||
      /4\s*நாள்|நான்கு\s*நாள்|चार\s*दिन|4\s*दिन/i.test(lower)
    ) {
      return '4 days';
    }
    if (
      /\b(5\s*days|five\s*days|5\s*din|panch\s*din)\b/i.test(lower) ||
      /5\s*நாள்|ஐந்து\s*நாள்|पाँच\s*दिन|5\s*दिन/i.test(lower)
    ) {
      return '5 days';
    }

    // Generic N Days regex
    const daysMatch = lower.match(/(\d+)\s*(days?|நாட்கள்?|நாள்|din|दिन)/i);
    if (daysMatch) {
      return `${daysMatch[1]} days`;
    }

    // 1 Week
    if (
      /\b(1\s*week|one\s*week|a\s*week|oru\s*vaaram|1\s*hafta|ek\s*hafta)\b/i.test(lower) ||
      /1\s*வாரம்|ஒரு\s*வாரம்|एक\s*हफ्ता/i.test(lower)
    ) {
      return '1 week';
    }

    // 2 Weeks
    if (
      /\b(2\s*weeks|two\s*weeks|rendu\s*vaaram|2\s*hafte|do\s*hafte)\b/i.test(lower) ||
      /2\s*வாரம்|இரண்டு\s*வாரம்|दो\s*हफ्ते/i.test(lower)
    ) {
      return '2 weeks';
    }

    // 1 Month
    if (
      /\b(1\s*month|one\s*month|a\s*month|oru\s*maasam|1\s*mahina|ek\s*mahina)\b/i.test(lower) ||
      /1\s*மாதம்|ஒரு\s*மாதம்|एक\s*महीना/i.test(lower)
    ) {
      return '1 month';
    }

    // Months generic
    const monthsMatch = lower.match(/(\d+)\s*(months?|மாதங்கள்?|மாதம்|maasam|mahine|महीने)/i);
    if (monthsMatch) {
      return `${monthsMatch[1]} months`;
    }

    return undefined;
  }

  // 3. Extract Anatomical Body Location
  public extractLocation(text: string): { regionId: string; regionName: string } | undefined {
    const lower = text.toLowerCase();

    // Upper Abdomen
    if (
      /\b(upper\s*abdomen|epigastric|mel\s*vayiru|oopri\s*pet)\b/i.test(lower) ||
      /மேல்\s*வயிறு|வயிற்றின்\s*மேல்|நெஞ்சுக்கு\s*கீழே|ऊपरी\s*पेट|पेट\s*का\s*ऊपरी|छाती\s*के\s*नीचे/i.test(lower)
    ) {
      return { regionId: 'upper_abdomen', regionName: 'Upper Abdomen (Epigastrium)' };
    }

    // Lower Abdomen
    if (
      /\b(lower\s*abdomen|adi\s*vayiru|keezh\s*vayiru|nichla\s*pet)\b/i.test(lower) ||
      /அடிவயிறு|கீழ்\s*வயிறு|நிச்சிலா|निचला\s*पेट|नाभि\s*के\s*नीचे/i.test(lower)
    ) {
      return { regionId: 'lower_abdomen', regionName: 'Lower Abdomen (Pelvis/Hypogastrium)' };
    }

    // Stomach / Abdomen general
    if (
      /\b(stomach|abdomen|belly|vayiru|vayithu|pet)\b/i.test(lower) ||
      /வயிறு|வயித்து|வயிற்று|पेट/i.test(lower)
    ) {
      return { regionId: 'upper_abdomen', regionName: 'Abdomen / Stomach' };
    }

    // Chest
    if (
      /\b(chest|nenju|marbu|chhati|seena)\b/i.test(lower) ||
      /மார்பு|நெஞ்சு|छाती|सीना|सीने/i.test(lower)
    ) {
      return { regionId: 'chest', regionName: 'Chest (Thorax)' };
    }

    // Head / Forehead
    if (
      /\b(head|forehead|thalai|netri|sir|sar|matha)\b/i.test(lower) ||
      /தலை|நெற்றி|सिर|सर|माथा/i.test(lower)
    ) {
      return { regionId: 'head', regionName: 'Head & Cranium' };
    }

    // Lower Back / Spine
    if (
      /\b(lower\s*back|back|spine|lumbar|muthugu|iduppu|kamar|peeth)\b/i.test(lower) ||
      /முதுகு|இடுப்பு|கீழ்\s*முதுகு|कमर|पीठ|रीढ़/i.test(lower)
    ) {
      return { regionId: 'lower_back', regionName: 'Lower Back & Lumbar Spine' };
    }

    // Knee / Leg
    if (
      /\b(knee|leg|muzhangal|kaal|ghutna|pair)\b/i.test(lower) ||
      /முழங்கால்|கால்|घुटना|पैर/i.test(lower)
    ) {
      return { regionId: 'left_leg_knee', regionName: 'Knee & Lower Limb' };
    }

    // Throat / Neck
    if (
      /\b(throat|neck|thonndai|kazhuthu|gala|gardan)\b/i.test(lower) ||
      /தொண்டை|கழுத்து|गला|गर्दन/i.test(lower)
    ) {
      return { regionId: 'throat_neck', regionName: 'Throat & Cervical Neck' };
    }

    return undefined;
  }

  // 4. Extract Pain Character / Sensation
  public extractPainCharacter(text: string): string | undefined {
    const lower = text.toLowerCase();

    // Burning / Acidity
    if (
      /\b(burning|acidic|heartburn|eriyuthu|erichal|kanthal|tezaab|jalan)\b/i.test(lower) ||
      /எரியுது|எரிச்சல்|காந்தல்|நெஞ்செரிச்சல்|जलन|जल\s*रहा|तेजाब/i.test(lower)
    ) {
      return 'burning';
    }

    // Cramping / Colicky
    if (
      /\b(cramping|cramp|colic|spasmodic|kudaichal|murukuthu|pidippu|marod|ainthan)\b/i.test(lower) ||
      /குடைச்சல்|முறுக்குது|பிடிப்பு|மரோட்|मरोड़|ऐंठन/i.test(lower)
    ) {
      return 'cramping';
    }

    // Throbbing / Pulsating
    if (
      /\b(throbbing|pulsating|beating|thudikkum|thudikuthu|dhadak)\b/i.test(lower) ||
      /துடிக்கும்|துடிக்குது|धड़कता|धुकधुक/i.test(lower)
    ) {
      return 'throbbing';
    }

    // Sharp / Stabbing / Piercing
    if (
      /\b(sharp|stabbing|piercing|kuthuthu|kuthuvathu|chubh|teekha\s*dard)\b/i.test(lower) ||
      /குத்துவது|குத்துது|ஊசி\s*குத்துவது|चुभने|तीखा\s*दर्द/i.test(lower)
    ) {
      return 'sharp';
    }

    // Dull / Heaviness / Pressure
    if (
      /\b(dull|heavy|heaviness|pressure|kanama|baram|bhaari)\b/i.test(lower) ||
      /மந்தமான|பாரமாக|கனமாக|भारीपन|हल्का\s*दर्द|दबाव/i.test(lower)
    ) {
      return 'dull';
    }

    return undefined;
  }

  // 5. Extract Severity Score (1-10)
  public extractSeverity(text: string): number | undefined {
    const lower = text.toLowerCase();

    // Direct number matching
    const numMatch = lower.match(/\b(10|[1-9])(\s*\/\s*10|\s*out\s*of\s*10|\s*level)?\b/);
    if (numMatch && !/(\d+)\s*(days?|weeks?|months?|din|naal)/i.test(lower)) {
      const val = parseInt(numMatch[1], 10);
      if (val >= 1 && val <= 10) return val;
    }

    // Extreme / Severe
    if (
      /\b(severe|unbearable|extreme|worst|romba\s*athigam|bahut\s*zyada)\b/i.test(lower) ||
      /தாங்க\s*முடியாத|கடுமையான|ரொம்ப\s*அதிகம்|அதிக\s*வலி|असहनीय|बहुत\s*ज्यादा|तीव्र/i.test(lower)
    ) {
      return 9;
    }

    // Moderate
    if (
      /\b(moderate|medium|tolerable|sumaraana|theek\s*thaak)\b/i.test(lower) ||
      /நடுத்தர|சுமாரான|தாங்கக்கூடிய|मध्यम|सहने\s*लायक/i.test(lower)
    ) {
      return 5;
    }

    // Mild
    if (
      /\b(mild|light|slight|konjam|lesaana|kam|thoda)\b/i.test(lower) ||
      /லேசான|கொஞ்சம்|லேசா|हल्का|थोड़ा|कम/i.test(lower)
    ) {
      return 2;
    }

    return undefined;
  }

  // 6. Extract Triggers & Dietary Associations
  public extractTriggers(text: string): string[] {
    const lower = text.toLowerCase();
    const triggers: string[] = [];

    // Spicy / Sour Foods (Pitta trigger)
    if (
      /\b(spicy|sour|chili|oily|deep\s*fried|kaaram|pulippu|teekha|khatta)\b/i.test(lower) ||
      /காரமான|கார|புளிப்பு|எண்ணெய்|வறுத்த|तीखा|खट्टा|तला\s*भुना|मसालेदार/i.test(lower)
    ) {
      triggers.push('worse_after_spicy_sour');
    }

    // Empty Stomach / Hunger
    if (
      /\b(empty\s*stomach|hungry|hunger|fasting|pasi|pattini|bhookh|khali\s*pet)\b/i.test(lower) ||
      /சாப்பிடாமல்|பசி|பட்டினி|வெறும்\s*வயிறு|खाली\s*पेट|भूख/i.test(lower)
    ) {
      triggers.push('worse_on_empty_stomach');
    }

    // Movement / Exertion / Walking
    if (
      /\b(walking|moving|movement|exertion|bending|nadanthal|kuninthal|chalne\s*se)\b/i.test(lower) ||
      /நடந்தால்|குனிந்தால்|வேலை\s*செய்தால்|அசைத்தால்|चलने\s*से|झुकने\s*से|मेहनत/i.test(lower)
    ) {
      triggers.push('worse_with_movement');
    }

    // After Meals / Eating
    if (
      /\b(after\s*eating|after\s*food|after\s*meals|sapta\s*aprom|khane\s*ke\s*baad)\b/i.test(lower) ||
      /சாப்பிட்ட\s*பிறகு|உணவுக்கு\s*பின்|खाने\s*के\s*बाद|भोजन\s*के\s*बाद/i.test(lower)
    ) {
      triggers.push('worse_after_eating');
    }

    return triggers;
  }

  // 7. Extract AYUSH Specialized Pariksha Observations
  public extractAyushObservations(text: string, system: MedicineSystem): { key?: string; value?: string } {
    const lower = text.toLowerCase();

    // Tongue / Jihva / நா / जीभ
    if (
      /\b(white\s*coat|coated\s*tongue|vellai|safed\s*parat)\b/i.test(lower) ||
      /வெள்ளை\s*படிவு|மாவு|சளி\s*படிந்த|வெள்ளையா|सफेद\s*परत|मैली\s*जीभ/i.test(lower)
    ) {
      return {
        key: 'jihvaReported',
        value: 'White coated (Ama / Samata)',
      };
    }
    if (
      /\b(red\s*tongue|cracked|laal\s*jeebh)\b/i.test(lower) ||
      /சிவப்பான\s*நா|சிகப்பு|சிவப்பு|लाल\s*जीभ|दरारें/i.test(lower)
    ) {
      return {
        key: 'jihvaReported',
        value: 'Red & cracked (Tikshna Pitta)',
      };
    }

    // Bowel / Mala / மலம் / शौच
    if (
      /\b(constipat|hard\s*stool|dry\s*stool|malasikkal|kabz|sakht)\b/i.test(lower) ||
      /மலச்சிக்கல்|இறுகிய\s*மலம்|கெட்டியா|காய்ந்து|कब्ज|कठोर\s*मल|सूखा\s*मल/i.test(lower)
    ) {
      return {
        key: 'malaReported',
        value: 'Krura Koshta (Dry & Constipated - Vata Dominance)',
      };
    }
    if (
      /\b(loose\s*stool|diarrhea|vayitrupokku|dast)\b/i.test(lower) ||
      /வயிற்றுப்போக்கு|நீர்த்த\s*மலம்|தண்ணியா|दस्त|पतला\s*शौच/i.test(lower)
    ) {
      return {
        key: 'malaReported',
        value: 'Mridu Koshta (Loose & Burning - Pitta Dominance)',
      };
    }

    // Urine / Mutra / சிறுநீர் / पेशाब
    if (
      /\b(burning\s*urine|dark\s*yellow|manjal|peela\s*peshab)\b/i.test(lower) ||
      /சிறுநீர்\s*எரிச்சல்|மஞ்சள்\s*நிற|அடர்\s*மஞ்சள்|पेशाब\s*में\s*जलन|पीला\s*पेशाब/i.test(lower)
    ) {
      return {
        key: 'mutraReported',
        value: 'Mutra Daha (Burning & Dark - High Pitta / Ushna)',
      };
    }

    // Siddha Mukkuttram
    if (system === 'SIDDHA') {
      if (/\b(azhal|pitham|heat|bile)\b/i.test(lower) || /பித்தம்|அழல்/i.test(lower)) {
        return { key: 'mukkuttramDominance', value: 'Azhal (Pitham)' };
      }
      if (/\b(vali|vatham|wind|dryness|pain)\b/i.test(lower) || /வாதம்|வளி/i.test(lower)) {
        return { key: 'mukkuttramDominance', value: 'Vali (Vatham)' };
      }
      if (/\b(iyyam|kabam|phlegm|cold)\b/i.test(lower) || /கபம்|ஐயம்/i.test(lower)) {
        return { key: 'mukkuttramDominance', value: 'Iyyam (Kabam)' };
      }
    }

    // Unani Mizaj
    if (system === 'UNANI') {
      if (/\b(safrawi|choleric|yellow\s*bile)\b/i.test(lower) || /गर्मी/i.test(lower)) {
        return { key: 'mizajTemperament', value: 'Safrawi (Choleric - Hot & Dry)' };
      }
      if (/\b(balghami|phlegmatic|cold)\b/i.test(lower) || /कफ/i.test(lower)) {
        return { key: 'mizajTemperament', value: 'Balghami (Phlegmatic - Cold & Moist)' };
      }
      if (/\b(damwi|sanguine|blood)\b/i.test(lower) || /रक्त/i.test(lower)) {
        return { key: 'mizajTemperament', value: 'Damwi (Sanguine - Hot & Moist)' };
      }
      if (/\b(saudawi|melancholic|black\s*bile)\b/i.test(lower) || /उदासी/i.test(lower)) {
        return { key: 'mizajTemperament', value: 'Saudawi (Melancholic - Cold & Dry)' };
      }
    }

    return {};
  }

  // 8. Main Comprehensive Extraction Method
  public interpretResponse(
    text: string,
    currentQuestionId: string,
    system: MedicineSystem = 'AYURVEDA'
  ): InterpretationResult {
    const langInfo = this.detectLanguage(text);
    const duration = this.extractDuration(text);
    const locationInfo = this.extractLocation(text);
    const painCharacter = this.extractPainCharacter(text);
    const severity = this.extractSeverity(text);
    const triggers = this.extractTriggers(text);
    const ayush = this.extractAyushObservations(text, system);

    // Build notes summarizing the extracted clinical signals
    const notesArr: string[] = [];
    if (duration) notesArr.push(`Duration: ${duration}`);
    if (locationInfo) notesArr.push(`Location: ${locationInfo.regionName}`);
    if (painCharacter) notesArr.push(`Pain Character: ${painCharacter}`);
    if (severity) notesArr.push(`Severity: ${severity}/10`);
    if (triggers.length > 0) notesArr.push(`Triggers: ${triggers.join(', ')}`);
    if (ayush.key && ayush.value) notesArr.push(`AYUSH Assessment: ${ayush.key} = ${ayush.value}`);

    const structured: StructuredInterpretation = {
      detectedEntity: locationInfo?.regionName || painCharacter || duration || undefined,
      duration,
      severity,
      location: locationInfo?.regionId,
      painCharacter,
      triggers: triggers.length > 0 ? triggers : undefined,
      ayushObservationKey: ayush.key,
      ayushObservationValue: ayush.value,
      clinicalNotes: notesArr.length > 0 ? notesArr.join(' • ') : undefined,
      confidence: 0.9,
    };

    return {
      detectedLanguage: langInfo.language,
      structured,
      normalizedText: text.trim(),
    };
  }
}

export const multilingualInterpreter = new MultilingualInterpreter();
