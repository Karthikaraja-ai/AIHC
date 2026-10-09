// Emergency & Red-Flag Symptom Detector with Triage Calculation
// Clinical decision-support: AI does NOT make the final medical diagnosis; alerts are for triage notification.

import { EmergencyAlert, TriageLevel } from '../types';

export interface EmergencyEvaluationResult {
  isEmergency: boolean;
  isUrgent: boolean;
  triageLevel: TriageLevel;
  triggeredRedFlags: string[];
  immediateAdviceEn: string;
  immediateAdviceTa: string;
  immediateAdviceHi: string;
}

// Red flag definitions
const RED_FLAG_KEYWORDS = [
  {
    category: 'CARDIAC',
    keywords: ['chest pain', 'heart pain', 'nenju vali', 'seene me dard', 'chhati me dard', 'left arm pain', 'radiating pain', 'crushing chest'],
    message: 'Potential acute coronary symptom / severe chest distress',
  },
  {
    category: 'RESPIRATORY',
    keywords: ['cannot breathe', 'severe breathing difficulty', 'moochu thinaral', 'sans lene me takleef', 'choking', 'gasping'],
    message: 'Severe respiratory compromise / acute dyspnea',
  },
  {
    category: 'NEUROLOGICAL',
    keywords: ['unconscious', 'fainted', 'mayakkam', 'seizure', 'fits', 'slurred speech', 'facial droop', 'sudden weakness', 'stroke'],
    message: 'Acute neurological red-flag / altered sensorium',
  },
  {
    category: 'HEMORRHAGE',
    keywords: ['severe bleeding', 'vomiting blood', 'blood in stool', 'heavy hemorrhage', 'uncontrolled bleeding'],
    message: 'Severe active hemorrhage',
  },
  {
    category: 'ANAPHYLAXIS',
    keywords: ['throat swelling', 'allergic reaction', 'lip swelling', 'severe rash with breathing problem'],
    message: 'Potential anaphylactic / severe allergic reaction',
  },
];

class EmergencyDetector {
  public evaluateSymptoms(
    answers: string[],
    painScore: number,
    selectedRegion?: string,
    ageGroup?: 'ADULT' | 'CHILD'
  ): EmergencyEvaluationResult {
    const combinedText = answers.join(' ').toLowerCase();
    const triggeredRedFlags: string[] = [];

    // Check keyword triggers
    for (const rule of RED_FLAG_KEYWORDS) {
      for (const kw of rule.keywords) {
        if (combinedText.includes(kw)) {
          triggeredRedFlags.push(rule.message);
          break;
        }
      }
    }

    // High pain severity checks
    if (painScore >= 9) {
      triggeredRedFlags.push(`Extreme pain level (${painScore}/10) reported`);
    }

    // Chest location with pain score >= 7
    if ((selectedRegion === 'chest' || combinedText.includes('chest')) && painScore >= 7) {
      if (!triggeredRedFlags.some(f => f.includes('coronary'))) {
        triggeredRedFlags.push('High intensity thoracic/chest discomfort');
      }
    }

    // Pediatric caution
    if (ageGroup === 'CHILD' && painScore >= 8) {
      triggeredRedFlags.push('High severity pediatric distress');
    }

    const isEmergency = triggeredRedFlags.length > 0 && (
      combinedText.includes('chest') ||
      combinedText.includes('breath') ||
      combinedText.includes('unconscious') ||
      combinedText.includes('seizure') ||
      combinedText.includes('bleeding') ||
      painScore === 10
    );

    const isUrgent = !isEmergency && (triggeredRedFlags.length > 0 || painScore >= 7);

    let triageLevel: TriageLevel = 'NORMAL';
    if (isEmergency) {
      triageLevel = 'EMERGENCY';
    } else if (isUrgent) {
      triageLevel = 'URGENT';
    } else if (painScore >= 4 || answers.length > 3) {
      triageLevel = 'PRIORITY';
    } else {
      triageLevel = 'NORMAL';
    }

    return {
      isEmergency,
      isUrgent,
      triageLevel,
      triggeredRedFlags: Array.from(new Set(triggeredRedFlags)),
      immediateAdviceEn: isEmergency
        ? 'High priority alert: Please alert clinical staff or proceed immediately to Emergency Ward. A doctor has been notified.'
        : 'Please continue answering pre-consultation questions.',
      immediateAdviceTa: isEmergency
        ? 'முக்கிய அவசர எச்சரிக்கை: தயவுசெய்து அவசர சிகிச்சை பிரிவுக்கு உடனடியாக செல்லவும். மருத்துவருக்கு தகவல் தெரிவிக்கப்பட்டுள்ளது.'
        : 'தயவுசெய்து தொடர்ந்து கேள்விகளுக்கு பதிலளிக்கவும்.',
      immediateAdviceHi: isEmergency
        ? 'उच्च प्राथमिकता चेतावनी: कृपया तुरंत आपातकालीन वार्ड में जाएं या स्टाफ को सूचित करें। डॉक्टर को सूचना दे दी गई है।'
        : 'कृपया आगे के सवालों के जवाब देना जारी रखें।',
    };
  }

  // Create an Emergency Alert entity for Doctor/Nurse notifications
  public createEmergencyAlert(
    patientId: string,
    patientName: string,
    symptomSummary: string,
    triageLevel: 'EMERGENCY' | 'URGENT' = 'EMERGENCY'
  ): EmergencyAlert {
    const alert: EmergencyAlert = {
      id: `EMG-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      patientId,
      patientName,
      symptomSummary,
      detectedAt: new Date().toISOString(),
      triageLevel,
      status: 'ACTIVE',
    };

    // Store in active emergency alerts list
    try {
      const existing = this.getActiveAlerts();
      existing.unshift(alert);
      localStorage.setItem('aihc_active_emergencies', JSON.stringify(existing));
    } catch (e) {}

    return alert;
  }

  public getActiveAlerts(): EmergencyAlert[] {
    try {
      const raw = localStorage.getItem('aihc_active_emergencies');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  public acknowledgeAlert(alertId: string, staffName: string): void {
    const alerts = this.getActiveAlerts();
    const target = alerts.find(a => a.id === alertId);
    if (target) {
      target.status = 'ACKNOWLEDGED';
      target.acknowledgedBy = staffName;
      localStorage.setItem('aihc_active_emergencies', JSON.stringify(alerts));
    }
  }
}

export const emergencyDetector = new EmergencyDetector();
