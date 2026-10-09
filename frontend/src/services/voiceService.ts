import { LanguageCode } from '../types';
import { multilingualInterpreter } from './multilingualInterpreter';

export interface RecognizedSpeechResult {
  rawTranscript: string;
  normalizedText: string;
  detectedLanguage: 'en' | 'ta' | 'hi' | 'mixed';
  matchedMedicalKeywords: string[];
  confidence: number;
}

// Accent & Colloquial / Regional phrase mapping
const REGIONAL_PHRASE_DICTIONARY: Record<string, { standard: string; enTag: string }> = {
  // Tamil / Tanglish phrases
  "vayiru vali": { standard: "வயிற்று வலி", enTag: "Stomach pain / Abdominal pain" },
  "vayithu vali": { standard: "வயிற்று வலி", enTag: "Stomach pain / Abdominal pain" },
  "nenju vali": { standard: "நெஞ்சு வலி", enTag: "Chest pain (RED FLAG)" },
  "kaichal": { standard: "காய்ச்சல்", enTag: "Fever" },
  "thalai vali": { standard: "தலைவலி", enTag: "Headache" },
  "moochu thinaral": { standard: "மூச்சுத் திணறல்", enTag: "Breathing difficulty / Dyspnea" },
  "irumal": { standard: "இருமல்", enTag: "Cough" },
  "sali": { standard: "சளி", enTag: "Cold / Phlegm" },
  "kaal vali": { standard: "கால் வலி", enTag: "Leg pain" },
  "kai vali": { standard: "கை வலி", enTag: "Arm pain" },
  "muthugu vali": { standard: "முதுகு வலி", enTag: "Back pain" },
  "mayakkam": { standard: "மயக்கம்", enTag: "Dizziness / Vertigo" },
  "vomiting": { standard: "வாந்தி", enTag: "Vomiting" },
  "vaanthi": { standard: "வாந்தி", enTag: "Vomiting" },
  "bhedi": { standard: "வயிற்றுப்போக்கு", enTag: "Diarrhea" },
  "pasikavillai": { standard: "பசியின்மை", enTag: "Loss of appetite" },

  // Hindi / Hinglish phrases
  "pet dard": { standard: "पेट दर्द", enTag: "Stomach pain / Abdominal pain" },
  "pet me dard": { standard: "पेट में दर्द", enTag: "Stomach pain / Abdominal pain" },
  "seene me dard": { standard: "सीने में दर्द", enTag: "Chest pain (RED FLAG)" },
  "chhati me dard": { standard: "छाती में दर्द", enTag: "Chest pain (RED FLAG)" },
  "bukhar": { standard: "बुखार", enTag: "Fever" },
  "sir dard": { standard: "सिर दर्द", enTag: "Headache" },
  "sar dard": { standard: "सर दर्द", enTag: "Headache" },
  "khansi": { standard: "खांसी", enTag: "Cough" },
  "sans lene me takleef": { standard: "सांस लेने में तकलीफ", enTag: "Breathing difficulty" },
  "sans phool rahi hai": { standard: "सांस फूलना", enTag: "Shortness of breath" },
  "chakkar": { standard: "चक्कर आना", enTag: "Dizziness" },
  "ulti": { standard: "उल्टी", enTag: "Vomiting" },
  "dast": { standard: "दस्त", enTag: "Diarrhea" },
  "kamar dard": { standard: "कमर दर्द", enTag: "Back pain" },
  "badan dard": { standard: "बदन दर्द", enTag: "Body ache" },
};

class VoiceService {
  private isSpeaking: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private activeRecognition: any = null;

  // Text to Speech (TTS)
  public speak(text: string, lang: LanguageCode = 'en', rate: number = 0.9): Promise<void> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        console.warn('SpeechSynthesis is not supported in this browser.');
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;
      this.isSpeaking = true;

      // Locale mapping
      if (lang === 'ta') {
        utterance.lang = 'ta-IN';
      } else if (lang === 'hi') {
        utterance.lang = 'hi-IN';
      } else {
        utterance.lang = 'en-IN';
      }

      utterance.rate = rate; // Slightly slower for low-literacy clarity
      utterance.pitch = 1.0;

      // Select matching voice if available, prioritizing Indian regional locales
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice =
        voices.find(v => v.lang.replace('_', '-').toLowerCase() === utterance.lang.toLowerCase()) ||
        voices.find(v => v.lang.toLowerCase().startsWith(utterance.lang.substring(0, 2).toLowerCase())) ||
        voices.find(v => v.lang.toLowerCase().includes('in'));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onend = () => {
        this.isSpeaking = false;
        resolve();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  public stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
    }
  }

  public stopListening() {
    if (this.activeRecognition) {
      try {
        this.activeRecognition.abort();
      } catch (e) {
        // ignore
      }
      this.activeRecognition = null;
    }
  }

  // Automatic Speech Recognition (ASR)
  public startListening(
    lang: LanguageCode,
    onResult: (result: RecognizedSpeechResult) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ): () => void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError('Browser Speech Recognition not supported. Falling back to simulated input.');
      onEnd();
      return () => {};
    }

    const recognition = new SpeechRecognition();
    this.activeRecognition = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    if (lang === 'ta') {
      recognition.lang = 'ta-IN';
    } else if (lang === 'hi') {
      recognition.lang = 'hi-IN';
    } else {
      recognition.lang = 'en-IN';
    }

    recognition.onresult = (event: any) => {
      const rawTranscript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence || 0.85;
      const detected = multilingualInterpreter.detectLanguage(rawTranscript);
      const normalized = this.normalizeSpeechInput(
        rawTranscript,
        detected.language === 'mixed' ? lang : (detected.language as LanguageCode)
      );

      onResult({
        rawTranscript,
        normalizedText: normalized.text,
        detectedLanguage: detected.language,
        matchedMedicalKeywords: normalized.matchedKeywords,
        confidence,
      });
    };

    recognition.onerror = (event: any) => {
      onError(event.error || 'Speech recognition error');
    };

    recognition.onend = () => {
      onEnd();
    };

    try {
      recognition.start();
    } catch (e) {
      onError('Could not start microphone');
      onEnd();
    }

    return () => {
      try {
        recognition.abort();
      } catch (e) {}
    };
  }

  // Normalize speech, accents, code-switching, and Tanglish/Hinglish
  public normalizeSpeechInput(raw: string, currentLang: LanguageCode): { text: string; matchedKeywords: string[] } {
    const lower = raw.trim().toLowerCase();
    const matchedKeywords: string[] = [];
    let normalized = raw;

    // Check regional dictionary
    for (const [key, val] of Object.entries(REGIONAL_PHRASE_DICTIONARY)) {
      if (lower.includes(key)) {
        matchedKeywords.push(val.enTag);
        if (currentLang === 'en') {
          normalized = `${normalized} (${val.enTag})`;
        } else if (currentLang === 'ta' && val.standard) {
          normalized = val.standard;
        } else if (currentLang === 'hi' && val.standard) {
          normalized = val.standard;
        }
      }
    }

    // Direct English terms
    if (lower.includes('chest pain') || lower.includes('heart') || lower.includes('nenju') || lower.includes('chhati')) {
      matchedKeywords.push('Chest pain (RED FLAG)');
    }
    if (lower.includes('breath') || lower.includes('moochu') || lower.includes('sans')) {
      matchedKeywords.push('Breathing difficulty');
    }
    if (lower.includes('fever') || lower.includes('kaichal') || lower.includes('bukhar')) {
      matchedKeywords.push('Fever');
    }
    if (lower.includes('stomach') || lower.includes('vayiru') || lower.includes('pet')) {
      matchedKeywords.push('Stomach pain');
    }
    if (lower.includes('headache') || lower.includes('thalai') || lower.includes('sir dard')) {
      matchedKeywords.push('Headache');
    }

    return {
      text: normalized,
      matchedKeywords: Array.from(new Set(matchedKeywords)),
    };
  }
}

export const voiceService = new VoiceService();
