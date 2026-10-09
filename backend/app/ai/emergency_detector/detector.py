from typing import List, Optional, Dict, Any
import datetime
import uuid

RED_FLAG_KEYWORDS = [
    {
        "category": "CARDIAC",
        "keywords": ["chest pain", "heart pain", "nenju vali", "seene me dard", "chhati me dard", "left arm pain", "radiating pain", "crushing chest"],
        "message": "Potential acute coronary symptom / severe chest distress",
    },
    {
        "category": "RESPIRATORY",
        "keywords": ["cannot breathe", "severe breathing difficulty", "moochu thinaral", "sans lene me takleef", "choking", "gasping"],
        "message": "Severe respiratory compromise / acute dyspnea",
    },
    {
        "category": "NEUROLOGICAL",
        "keywords": ["unconscious", "fainted", "mayakkam", "seizure", "fits", "slurred speech", "facial droop", "sudden weakness", "stroke"],
        "message": "Acute neurological red-flag / altered sensorium",
    },
    {
        "category": "HEMORRHAGE",
        "keywords": ["severe bleeding", "vomiting blood", "blood in stool", "heavy hemorrhage", "uncontrolled bleeding"],
        "message": "Severe active hemorrhage",
    },
    {
        "category": "ANAPHYLAXIS",
        "keywords": ["throat swelling", "allergic reaction", "lip swelling", "severe rash with breathing problem"],
        "message": "Potential anaphylactic / severe allergic reaction",
    },
]

class EmergencyDetector:
    def evaluate_symptoms(
        self,
        answers: List[str],
        pain_score: int,
        selected_region: Optional[str] = None,
        age_group: str = "ADULT"
    ) -> Dict[str, Any]:
        combined_text = " ".join(answers).lower()
        triggered_red_flags: List[str] = []

        # Check keyword triggers
        for rule in RED_FLAG_KEYWORDS:
            for kw in rule["keywords"]:
                if kw in combined_text:
                    triggered_red_flags.append(rule["message"])
                    break

        # High pain severity checks
        if pain_score >= 9:
            triggered_red_flags.append(f"Extreme pain level ({pain_score}/10) reported")

        # Chest location with pain score >= 7
        if (selected_region == "chest" or "chest" in combined_text) and pain_score >= 7:
            if not any("coronary" in f for f in triggered_red_flags):
                triggered_red_flags.append("High intensity thoracic/chest discomfort")

        # Pediatric caution
        if age_group == "CHILD" and pain_score >= 8:
            triggered_red_flags.append("High severity pediatric distress")

        is_emergency = len(triggered_red_flags) > 0 and (
            "chest" in combined_text or
            "breath" in combined_text or
            "unconscious" in combined_text or
            "seizure" in combined_text or
            "bleeding" in combined_text or
            pain_score == 10
        )

        is_urgent = not is_emergency and (len(triggered_red_flags) > 0 or pain_score >= 7)

        if is_emergency:
            triage_level = "EMERGENCY"
        elif is_urgent:
            triage_level = "URGENT"
        elif pain_score >= 4 or len(answers) > 3:
            triage_level = "PRIORITY"
        else:
            triage_level = "NORMAL"

        return {
            "isEmergency": is_emergency,
            "isUrgent": is_urgent,
            "triageLevel": triage_level,
            "triggeredRedFlags": list(set(triggered_red_flags)),
            "immediateAdviceEn": "High priority alert: Please alert clinical staff or proceed immediately to Emergency Ward. A doctor has been notified." if is_emergency else "Please continue answering pre-consultation questions.",
            "immediateAdviceTa": "முக்கிய அவசர எச்சரிக்கை: தயவுசெய்து அவசர சிகிச்சை பிரிவுக்கு உடனடியாக செல்லவும். மருத்துவருக்கு தகவல் தெரிவிக்கப்பட்டுள்ளது." if is_emergency else "தயவுசெய்து தொடர்ந்து கேள்விகளுக்கு பதிலளிக்கவும்.",
            "immediateAdviceHi": "उच्च प्राथमिकता चेतावनी: कृपया तुरंत आपातकालीन वार्ड में जाएं या स्टाफ को सूचित करें। डॉक्टर को सूचना दे दी गई है।" if is_emergency else "कृपया आगे के सवालों के जवाब देना जारी रखें。",
        }

    def create_emergency_alert(
        self,
        patient_id: str,
        patient_name: str,
        symptom_summary: str,
        triage_level: str = "EMERGENCY",
        vitals_alert: Optional[str] = None
    ) -> Dict[str, Any]:
        return {
            "id": f"EMG-{int(datetime.datetime.utcnow().timestamp()*1000)}-{uuid.uuid4().hex[:4].upper()}",
            "patientId": patient_id,
            "patientName": patient_name,
            "symptomSummary": symptom_summary,
            "detectedAt": datetime.datetime.utcnow().isoformat(),
            "triageLevel": triage_level,
            "status": "ACTIVE",
            "vitalsAlert": vitals_alert
        }

emergency_detector = EmergencyDetector()
