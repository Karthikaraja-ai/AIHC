import os
import csv
import logging
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger("aihc.ai.adaptive")

DATASET_CSV_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "data",
    "AYUSH_Adaptive_PreConsultation_1875.csv"
)

# Canonical 20 Complaints in English
CANONICAL_COMPLAINTS = [
    "Back pain", "Constipation", "Cough", "Eye strain", "Fatigue",
    "Feverish feeling", "General body ache", "Headache", "Indigestion",
    "Joint pain", "Loss of appetite", "Mild abdominal discomfort",
    "Mild nasal congestion", "Mild nausea", "Mild throat discomfort",
    "Muscle soreness", "Neck pain", "Seasonal allergy symptoms",
    "Skin irritation", "Sleep difficulty"
]

# Multilingual keywords mapping to Canonical Complaints
COMPLAINT_KEYWORD_MAP = {
    "Headache": [
        "headache", "head ache", "migraine", "head throbbing", "forehead pain",
        "தலைவலி", "ஒற்றைத் தலைவலி", "தலையில் வலி",
        "सिरदर्द", "सिर में दर्द", "आधे सिर का दर्द"
    ],
    "Back pain": [
        "back pain", "lower back", "spine pain", "lumbago", "backache",
        "முதுகு வலி", "இடுப்பு வலி", "முதுகில் வலி",
        "कमर दर्द", "पीठ दर्द", "कमर में दर्द", "रीढ़ में दर्द"
    ],
    "Cough": [
        "cough", "coughing", "dry cough", "wet cough", "throat cough",
        "இருமல்", "வறட்டு இருமல்", "சளி இருமல்",
        "खांसी", "सुखी खांसी", "बलगम वाली खांसी"
    ],
    "Joint pain": [
        "joint pain", "knee pain", "arthritis", "joint stiffness", "swelling in joint",
        "மூட்டு வலி", "மூட்டுகளில் வலி", "முழங்கால் வலி",
        "जोड़ों का दर्द", "घुटनों का दर्द", "जोड़ में अकड़न"
    ],
    "Indigestion": [
        "indigestion", "gas", "bloating", "acid reflux", "heartburn", "gastric", "dyspepsia",
        "அஜீரணம்", "செரிமானமின்மை", "வாயுத் தொல்லை", "நெஞ்செரிச்சல்",
        "अपच", "गैस", "अफरा", "पेट फूलना", "खट्टी डकार"
    ],
    "Mild abdominal discomfort": [
        "stomach pain", "abdomen pain", "abdominal discomfort", "belly ache", "tummy",
        "வயிற்று வலி", "வயிற்றில் வலி", "வயிற்று அசௌகரியம்",
        "पेट दर्द", "पेट में मरोड़", "पेट में तकलीफ़"
    ],
    "Constipation": [
        "constipation", "hard stool", "irregular bowel", "bowel difficulty",
        "மலச்சிக்கல்", "மலம் கழிப்பதில் சிரமம்",
        "कब्ज", "मलत्याग में कठिनाई", "पेट साफ न होना"
    ],
    "Fatigue": [
        "fatigue", "tiredness", "exhaustion", "weakness", "lethargy", "loss of energy",
        "அசதி", "சோர்வு", "உடல் பலவீனம்", "களைப்பு",
        "थकान", "कमजोरी", "थकावट", "सुस्ती"
    ],
    "Feverish feeling": [
        "fever", "feverish", "high temperature", "chills", "body warm",
        "காய்ச்சல்", "உடல் சூடு", "குளிர் நடுக்கம்",
        "बुखार", "हरारत", "हल्का बुखार", "कंपकंपी"
    ],
    "Eye strain": [
        "eye strain", "eye pain", "tired eyes", "burning eyes", "blurred screen",
        "கண் சோர்வு", "கண் வலி", "கண் எரிச்சல்",
        "आंखों में थकान", "आंखों में दर्द", "आंखों में जलन"
    ],
    "Neck pain": [
        "neck pain", "stiff neck", "cervical", "neck soreness",
        "கழுத்து வலி", "கழுத்தில் பிடிப்பு",
        "गर्दन में दर्द", "गर्दन में अकड़न", "सर्वाइकल दर्द"
    ],
    "Skin irritation": [
        "skin irritation", "itching", "rash", "skin allergy", "dry skin",
        "தோல் அரிப்பு", "தோல் தடிப்பு", "தோலில் நமைச்சல்",
        "त्वचा में जलन", "खुजली", "दाद", "चकत्ते"
    ],
    "Sleep difficulty": [
        "sleep difficulty", "insomnia", "sleeplessness", "waking up", "poor sleep",
        "தூக்கமின்மை", "தூங்குவதில் சிரமம்", "இரவில் தூக்கம் வராமை",
        "अनिद्रा", "नींद न आना", "नींद में बेचैनी"
    ],
    "Mild nausea": [
        "nausea", "queasy", "vomiting feel", "sick to stomach",
        "குமட்டல்", "வாந்தி உணர்வு",
        "मतली", "जी मिचलाना", "उल्टी का अहसास"
    ],
    "Mild throat discomfort": [
        "throat discomfort", "sore throat", "scratchy throat", "throat irritation",
        "தொண்டை வலி", "தொண்டை எரிச்சல்", "தொண்டைக் கரகரப்பு",
        "गले में खराश", "गले में दर्द", "गले में खिंचाव"
    ],
    "Loss of appetite": [
        "loss of appetite", "not hungry", "reduced appetite", "don't want to eat",
        "பசியின்மை", "பசி எடுக்காமை", "உணவு உண்ண விருப்பமின்மை",
        "भूख न लगना", "अरुचि", "खाने का मन न करना"
    ],
    "Muscle soreness": [
        "muscle soreness", "muscle pain", "body ache", "myalgia", "muscle cramps",
        "தசை வலி", "உடல் தசை வலி", "தசைப்பிடிப்பு",
        "मांसपेशियों में दर्द", "मांसपेशी खिंचाव", "बदन टूटना"
    ],
    "Seasonal allergy symptoms": [
        "allergy", "sneezing", "runny nose", "dust allergy", "seasonal allergy",
        "ஒவ்வாமை", "தொடர் தும்மல்", "மூக்கில் நீர் வடிதல்",
        "एलर्जी", "छींकें", "मौसम की एलर्जी", "नाक बहना"
    ],
    "Mild nasal congestion": [
        "nasal congestion", "blocked nose", "stuffy nose", "sinus",
        "மூக்கடைப்பு", "மூக்கு அடைப்பு",
        "नाक बंद होना", "नाक में रुकावट", "सांस में रुकावट"
    ],
    "General body ache": [
        "general body ache", "whole body pain", "full body pain", "generalized ache",
        "முழு உடல் வலி", "உடல் முழுவதும் வலி",
        "पूरे शरीर में दर्द", "बदन दर्द"
    ]
}

class AYUSHAdaptiveEngine:
    """
    Core AI Pre-Consultation Engine trained and structured on the 1,875-record
    AYUSH Adaptive Pre-Consultation Dataset.
    Enforces deterministic red-flag emergency detection, multi-stage adaptive
    question branching, AYUSH system contextualization, and multilingual summaries.
    """

    def __init__(self):
        self.records: List[Dict[str, Any]] = []
        self.by_id: Dict[str, Dict[str, Any]] = {}
        self.by_lang_sys_comp: Dict[Tuple[str, str, str], List[Dict[str, Any]]] = {}
        self._load_dataset()

    def _load_dataset(self):
        if not os.path.exists(DATASET_CSV_PATH):
            logger.warning(f"AYUSH dataset not found at {DATASET_CSV_PATH}")
            return

        try:
            with open(DATASET_CSV_PATH, "r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    rec = {
                        "id": row["id"].strip(),
                        "language": row["language"].strip(),
                        "medical_system": row["medical_system"].strip(),
                        "age": int(row["age"]) if row.get("age") and row["age"].strip().isdigit() else None,
                        "gender": row.get("gender", "").strip(),
                        "chief_complaint": row.get("chief_complaint", "").strip(),
                        "duration": row.get("duration", "").strip(),
                        "severity": row.get("severity", "").strip(),
                        "current_question": row.get("current_question", "").strip(),
                        "patient_answer": row.get("patient_answer", "").strip(),
                        "answer_category": row.get("answer_category", "initial").strip(),
                        "next_question": row.get("next_question", "").strip(),
                        "next_question_type": row.get("next_question_type", "duration").strip(),
                        "emergency_flag": row.get("emergency_flag", "No").strip(),
                        "pre_consultation_summary": row.get("pre_consultation_summary", "").strip()
                    }
                    self.records.append(rec)
                    self.by_id[rec["id"]] = rec

                    key = (rec["language"], rec["medical_system"], rec["chief_complaint"])
                    if key not in self.by_lang_sys_comp:
                        self.by_lang_sys_comp[key] = []
                    self.by_lang_sys_comp[key].append(rec)

            logger.info(f"Loaded {len(self.records)} records into AYUSHAdaptiveEngine.")
        except Exception as e:
            logger.error(f"Failed to load AYUSH dataset: {e}")

    def normalize_language(self, lang: Optional[str]) -> str:
        """Map language code or name to canonical 'English', 'Tamil', or 'Hindi'."""
        if not lang:
            return "English"
        l = lang.lower().strip()
        if "ta" in l or "tamil" in l or "தமிழ்" in l:
            return "Tamil"
        if "hi" in l or "hindi" in l or "हिंदी" in l or "हिन्दी" in l:
            return "Hindi"
        return "English"

    def normalize_medical_system(self, sys: Optional[str]) -> str:
        """Map medical system code to canonical AYUSH system name."""
        if not sys:
            return "Ayurveda"
        s = sys.upper().strip()
        if "AYURVEDA" in s or "AYUSH" in s:
            return "Ayurveda"
        if "SIDDHA" in s:
            return "Siddha"
        if "UNANI" in s:
            return "Unani"
        if "YOGA" in s or "NATUROPATHY" in s:
            return "Yoga & Naturopathy"
        if "HOMOEOPATHY" in s or "HOMEOPATHY" in s or "ALLOPATHY_HOMEOPATHY" in s:
            return "Homoeopathy"
        return "Ayurveda"

    def map_to_canonical_complaint(self, text: str) -> str:
        """Fuzzy match freeform patient text to one of the 20 canonical complaints."""
        if not text:
            return "General body ache"
        lower = text.lower().strip()

        for canonical, keywords in COMPLAINT_KEYWORD_MAP.items():
            for kw in keywords:
                if kw.lower() in lower:
                    return canonical

        # Fallback to general body ache
        return "General body ache"

    def detect_emergency(self, text: str, severity: Optional[str] = None) -> Tuple[bool, str, str]:
        """
        Deterministic red-flag safety check across English, Tamil, and Hindi.
        Returns: (is_emergency: bool, flag_status: str, reason: str)
        """
        lower = text.lower().strip()

        # Critical Cardiac Flags
        if any(w in lower for w in [
            'chest pain', 'heart attack', 'pain in left arm', 'crushing chest', 'chest pressure',
            'நெஞ்சு வலி', 'மாரடைப்பு', 'நெஞ்சில் அதிக வலி', 'மார்பு வலி', 'மார்பில் வலி', 'மார்பில் அழுத்தம்', 'மார்படைப்பு',
            'सीने में दर्द', 'दिल का दौरा', 'छाती में तेज दर्द', 'छाती में दर्द', 'छाती में दबाव', 'सीने में दबाव'
        ]):
            return True, "Review urgently", "CRITICAL: Acute Chest Discomfort / Suspected Cardiac Event"

        # Critical Respiratory Flags
        if any(w in lower for w in [
            'cannot breathe', 'severe breath', 'choking', 'struggling to breathe', 'shortness of breath', 'difficulty breathing',
            'மூச்சுத் திணறல்', 'மூச்சுத்திணறல்', 'மூச்சு திணறல்', 'மூச்சு விட முடியவில்லை', 'மூச்சு விட இயலவில்லை', 'மூச்சு வாங்குதல்',
            'सांस फूलना', 'सांस लेने में भारी तकलीफ़', 'सांस लेने में कठिनाई', 'सांस न आना', 'दम घुटना'
        ]):
            return True, "Review urgently", "CRITICAL: Acute Respiratory Distress"

        # Critical Stroke / Neurological Flags
        if any(w in lower for w in [
            'paralysis', 'face droop', 'speech slur', 'sudden weakness', 'sudden weakness in arm', 'slurred speech',
            'பக்கவாதம்', 'முகம் ஒருபக்கமாக இழுத்தல்', 'பேச்சு குழறுதல்', 'பேச முடியாமை', 'திடீர் பலவீனம்',
            'लकवा', 'मुंह टेढ़ा होना', 'आवाज लड़खड़ाना', 'बोल न पाना', 'एक तरफ कमजोरी'
        ]):
            return True, "Review urgently", "CRITICAL: Suspected Acute Stroke / Focal Neurological Deficit"

        # Critical Hemorrhage
        if any(w in lower for w in [
            'heavy bleeding', 'coughing blood', 'vomiting blood',
            'அதிக ரத்தப்போக்கு', 'ரத்த வாந்தி',
            'भारी रक्तस्राव', 'खून की उल्टी', 'खांसी में खून'
        ]):
            return True, "Review urgently", "CRITICAL: Severe Uncontrolled Hemorrhage"

        # Critical Syncope / Blackout
        if any(w in lower for w in [
            'unconscious', 'fainted', 'blackout', 'lost consciousness',
            'மயக்கம்', 'நினைவிழப்பு',
            'बेहोश', 'अचेत होना', 'चक्कर खाकर गिरना'
        ]):
            return True, "Review urgently", "CRITICAL: Syncope / Altered Sensorium"

        # Severe Pain with high urgency
        if severity and severity.lower() == 'severe':
            if any(w in lower for w in [
                'unbearable', 'worst pain', 'agony', 'excruciating',
                'தாங்க முடியாத வலி', 'கடும் வலி',
                'असहनीय दर्द', 'अत्यधिक तीव्र दर्द'
            ]):
                return True, "Needs clinician review", "URGENT: Severe unbearable pain requiring expedited clinical assessment"

        return False, "No", ""

    def get_first_question(
        self,
        language: str,
        medical_system: str,
        chief_complaint: str,
        age: Optional[int] = None,
        gender: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retrieves the initial onset & duration question from the 1,875 dataset
        specifically matching the patient's complaint and language.
        """
        canonical = self.map_to_canonical_complaint(chief_complaint)
        lang = self.normalize_language(language)
        sys = self.normalize_medical_system(medical_system)

        # Look up records matching (language, system, complaint)
        en_recs = self.by_lang_sys_comp.get(("English", sys, canonical), []) or [r for r in self.records if r["language"] == "English" and r["chief_complaint"] == canonical]
        ta_recs = self.by_lang_sys_comp.get(("Tamil", sys, canonical), []) or [r for r in self.records if r["language"] == "Tamil" and r["chief_complaint"] == canonical]
        hi_recs = self.by_lang_sys_comp.get(("Hindi", sys, canonical), []) or [r for r in self.records if r["language"] == "Hindi" and r["chief_complaint"] == canonical]

        en_q = en_recs[0]["current_question"] if en_recs else f"When did your {canonical.lower()} start?"
        ta_q = ta_recs[0]["current_question"] if ta_recs else f"உங்களுக்கு {canonical} எப்போது தொடங்கியது?"
        hi_q = hi_recs[0]["current_question"] if hi_recs else f"आपकी यह समस्या कब शुरू हुई?"

        current_q = ta_q if lang == "Tamil" else (hi_q if lang == "Hindi" else en_q)

        options = [
            {
                "id": "1_day",
                "label": "1 நாள் முன்பு (1 day ago)" if lang == "Tamil" else ("1 दिन पहले (1 day ago)" if lang == "Hindi" else "1 day ago"),
                "localizedLabel": {"en": "1 day ago", "ta": "1 நாள் முன்பு (1 day ago)", "hi": "1 दिन पहले (1 day ago)"}
            },
            {
                "id": "2_3_days",
                "label": "2-3 நாட்களாக (2-3 days)" if lang == "Tamil" else ("2-3 दिन से (2-3 days)" if lang == "Hindi" else "2 to 3 days ago"),
                "localizedLabel": {"en": "2 to 3 days ago", "ta": "2-3 நாட்களாக (2-3 days)", "hi": "2-3 दिन से (2-3 days)"}
            },
            {
                "id": "1_week",
                "label": "சுமார் 1 வாரம் (1 week)" if lang == "Tamil" else ("लगभग 1 सप्ताह (1 week)" if lang == "Hindi" else "About 1 week ago"),
                "localizedLabel": {"en": "About 1 week ago", "ta": "சுமார் 1 வாரம் (1 week)", "hi": "लगभग 1 सप्ताह (1 week)"}
            },
            {
                "id": "2_weeks",
                "label": "2 வாரங்களாக (2 weeks)" if lang == "Tamil" else ("2 सप्ताह से (2 weeks)" if lang == "Hindi" else "2 weeks ago"),
                "localizedLabel": {"en": "2 weeks ago", "ta": "2 வாரங்களாக (2 weeks)", "hi": "2 सप्ताह से (2 weeks)"}
            },
            {
                "id": "1_month",
                "label": "1 மாதம் (1 month)" if lang == "Tamil" else ("1 महीने से (1 month)" if lang == "Hindi" else "1 month ago"),
                "localizedLabel": {"en": "1 month ago", "ta": "1 மாதம் (1 month)", "hi": "1 महीने से (1 month)"}
            },
            {
                "id": "3_6_months",
                "label": "3 முதல் 6 மாதங்களாக (3-6 months)" if lang == "Tamil" else ("3 से 6 महीने से (3-6 months)" if lang == "Hindi" else "3 to 6 months ago"),
                "localizedLabel": {"en": "3 to 6 months ago", "ta": "3 முதல் 6 மாதங்களாக (3-6 months)", "hi": "3 से 6 महीने से (3-6 months)"}
            },
        ]

        return {
            "id": "Q_AYUSH_ONSET",
            "text": current_q,
            "englishText": en_q,
            "tamilText": ta_q,
            "hindiText": hi_q,
            "questionType": "duration",
            "inputType": "OPTIONS",
            "options": options,
            "stepNumber": 1,
            "canonicalComplaint": canonical,
            "language": lang,
            "medicalSystem": sys
        }

    def get_next_question(
        self,
        current_step: int,
        answers_history: List[Dict[str, Any]],
        patient_context: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Dynamically branches to the next question based on:
        - Current step in the adaptive sequence
        - Patient's previous answers (progression, worsening, relief)
        - Selected AYUSH medical system (Ayurveda, Siddha, Unani, Yoga & Naturopathy, Homoeopathy)
        - Patient language (English, Tamil, Hindi)
        """
        lang = self.normalize_language(patient_context.get("language"))
        sys = self.normalize_medical_system(patient_context.get("medicalSystem") or patient_context.get("medical_system"))
        chief_complaint = patient_context.get("chiefComplaint") or patient_context.get("chief_complaint", "")
        canonical = self.map_to_canonical_complaint(chief_complaint)

        last_answer = answers_history[-1]["patient_answer"] if answers_history else ""
        last_answer_lower = last_answer.lower()

        # Step 2: Progression / Evolution Question (from Dataset)
        if current_step == 1:
            en_recs = self.by_lang_sys_comp.get(("English", sys, canonical), []) or [r for r in self.records if r["language"] == "English" and r["chief_complaint"] == canonical]
            ta_recs = self.by_lang_sys_comp.get(("Tamil", sys, canonical), []) or [r for r in self.records if r["language"] == "Tamil" and r["chief_complaint"] == canonical]
            hi_recs = self.by_lang_sys_comp.get(("Hindi", sys, canonical), []) or [r for r in self.records if r["language"] == "Hindi" and r["chief_complaint"] == canonical]

            en_next = en_recs[0]["next_question"] if en_recs else f"Is the {canonical.lower()} getting better, staying the same, or getting worse?"
            ta_next = ta_recs[0]["next_question"] if ta_recs else f"இந்த {canonical} குறைகிறதா, மாறாமல் உள்ளதா அல்லது அதிகரிக்கிறதா?"
            hi_next = hi_recs[0]["next_question"] if hi_recs else f"क्या यह समस्या कम हो रही है, वैसी ही है या बढ़ रही है?"

            current_q = ta_next if lang == "Tamil" else (hi_next if lang == "Hindi" else en_next)

            options = [
                {
                    "id": "worse",
                    "label": "அதிகரிக்கிறது / தீவிரமாகிறது (Getting worse)" if lang == "Tamil" else ("बढ़ रही है / अधिक तकलीफ़ (Getting worse)" if lang == "Hindi" else "Getting worse (increasing discomfort)"),
                    "localizedLabel": {
                        "en": "Getting worse (increasing discomfort)",
                        "ta": "அதிகரிக்கிறது / தீவிரமாகிறது (Getting worse)",
                        "hi": "बढ़ रही है / अधिक तकलीफ़ (Getting worse)"
                    }
                },
                {
                    "id": "same",
                    "label": "மாற்றமில்லை / அதே நிலையில் உள்ளது (Unchanged)" if lang == "Tamil" else ("वैसी ही है / कोई बदलाव नहीं (Unchanged)" if lang == "Hindi" else "Staying the same (unchanged)"),
                    "localizedLabel": {
                        "en": "Staying the same (unchanged)",
                        "ta": "மாற்றமில்லை / அதே நிலையில் உள்ளது (Unchanged)",
                        "hi": "वैसी ही है / कोई बदलाव नहीं (Unchanged)"
                    }
                },
                {
                    "id": "improving",
                    "label": "குறைகிறது / குணமாகிறது (Improving)" if lang == "Tamil" else ("कम हो रही है / सुधार (Improving)" if lang == "Hindi" else "Getting better (improving)"),
                    "localizedLabel": {
                        "en": "Getting better (improving)",
                        "ta": "குறைகிறது / குணமாகிறது (Improving)",
                        "hi": "कम हो रही है / सुधार (Improving)"
                    }
                },
            ]

            return {
                "id": "Q_AYUSH_PROGRESSION",
                "text": current_q,
                "englishText": en_next,
                "tamilText": ta_next,
                "hindiText": hi_next,
                "questionType": "progression",
                "inputType": "OPTIONS",
                "options": options,
                "stepNumber": 2,
                "language": lang,
                "medicalSystem": sys
            }

        # Step 3: Associated Symptoms & Red-Flag Nuance (Branched from Step 2 answer)
        if current_step == 2:
            is_worsening = any(w in last_answer_lower for w in ["worse", "அதிகரிக்கிறது", "மோசமாகிறது", "बढ़", "severe"])

            if is_worsening:
                en_q = f"Since your {canonical.lower()} is worsening, are you experiencing associated fever, nausea, dizziness, or sharp radiating pain?"
                ta_q = f"{canonical} தீவிரமடைவதால், உங்களிடம் காய்ச்சல், வாந்தி, மயக்கம் அல்லது பிற கடுமையான அறிகுறிகள் உள்ளதா?"
                hi_q = f"{canonical} बढ़ने के साथ, क्या आपको बुखार, उल्टी, चक्कर या अन्य गंभीर लक्षण महसूस हो रहे हैं?"
                options = [
                    {
                        "id": "fever_nausea",
                        "label": "ஆம், காய்ச்சல் அல்லது குமட்டல்/வாந்தி உள்ளது" if lang == "Tamil" else ("हाँ, बुखार या मतली/उल्टी महसूस हो रही है" if lang == "Hindi" else "Yes, accompanied by fever or nausea"),
                        "localizedLabel": {
                            "en": "Yes, accompanied by fever or nausea",
                            "ta": "ஆம், காய்ச்சல் அல்லது குமட்டல்/வாந்தி உள்ளது",
                            "hi": "हाँ, बुखार या मतली/उल्टी महसूस हो रही है"
                        }
                    },
                    {
                        "id": "dizziness",
                        "label": "ஆம், தலைச்சுற்றல் அல்லது தீவிர பலவீனம் உள்ளது" if lang == "Tamil" else ("हाँ, चक्कर या अत्यधिक कमजोरी लग रही है" if lang == "Hindi" else "Yes, feeling dizzy or severely weak"),
                        "localizedLabel": {
                            "en": "Yes, feeling dizzy or severely weak",
                            "ta": "ஆம், தலைச்சுற்றல் அல்லது தீவிர பலவீனம் உள்ளது",
                            "hi": "हाँ, चक्कर या अत्यधिक कमजोरी लग रही है"
                        }
                    },
                    {
                        "id": "none_associated",
                        "label": "இல்லை, வேறு கடுமையான அறிகுறிகள் இல்லை" if lang == "Tamil" else ("नहीं, अन्य कोई गंभीर लक्षण नहीं हैं" if lang == "Hindi" else "No other severe associated symptoms"),
                        "localizedLabel": {
                            "en": "No other severe associated symptoms",
                            "ta": "இல்லை, வேறு கடுமையான அறிகுறிகள் இல்லை",
                            "hi": "नहीं, अन्य कोई गंभीर लक्षण नहीं हैं"
                        }
                    },
                ]
            else:
                en_q = f"What specific factors make your {canonical.lower()} feel better or worse?"
                ta_q = f"இந்த {canonical} எப்போது அதிகமாகிறது அல்லது எதைச் செய்யும்போது குணமாகிறது?"
                hi_q = f"यह तकलीफ़ किस समय या क्या करने पर बढ़ती या घटती है?"
                options = [
                    {
                        "id": "exertion",
                        "label": "உடல் உழைப்பு அல்லது நடக்கும்போது அதிகரிக்கிறது" if lang == "Tamil" else ("चलने-फिरने या काम करने पर बढ़ती है" if lang == "Hindi" else "Worse with movement or physical effort"),
                        "localizedLabel": {
                            "en": "Worse with movement or physical effort",
                            "ta": "உடல் உழைப்பு அல்லது நடக்கும்போது அதிகரிக்கிறது",
                            "hi": "चलने-फिरने या काम करने पर बढ़ती है"
                        }
                    },
                    {
                        "id": "food_time",
                        "label": "உணவுக்குப் பிறகு அல்லது காலையில் அதிகரிக்கிறது" if lang == "Tamil" else ("खाने के बाद या सुबह के समय बढ़ती है" if lang == "Hindi" else "Worse after food or specific timing"),
                        "localizedLabel": {
                            "en": "Worse after food or specific timing",
                            "ta": "உணவுக்குப் பிறகு அல்லது காலையில் அதிகரிக்கிறது",
                            "hi": "खाने के बाद या सुबह के समय बढ़ती है"
                        }
                    },
                    {
                        "id": "rest_relieves",
                        "label": "ஓய்வு எடுக்கும்போது குணமாகிறது" if lang == "Tamil" else ("विश्राम करने पर आराम मिलता है" if lang == "Hindi" else "Better with rest and quiet"),
                        "localizedLabel": {
                            "en": "Better with rest and quiet",
                            "ta": "ஓய்வு எடுக்கும்போது குணமாகிறது",
                            "hi": "विश्राम करने पर आराम मिलता है"
                        }
                    },
                    {
                        "id": "constant",
                        "label": "எப்போதும் சீராக உள்ளது" if lang == "Tamil" else ("लगातार एक जैसी बनी रहती है" if lang == "Hindi" else "Constant regardless of activity"),
                        "localizedLabel": {
                            "en": "Constant regardless of activity",
                            "ta": "எப்போதும் சீராக உள்ளது",
                            "hi": "लगातार एक जैसी बनी रहती है"
                        }
                    },
                ]

            return {
                "id": "Q_AYUSH_ASSOCIATED",
                "text": ta_q if lang == "Tamil" else (hi_q if lang == "Hindi" else en_q),
                "englishText": en_q,
                "tamilText": ta_q,
                "hindiText": hi_q,
                "questionType": "associated_factors",
                "inputType": "OPTIONS",
                "options": options,
                "stepNumber": 3,
                "language": lang,
                "medicalSystem": sys
            }

        # Step 4: Medical System Specific History Taking (Ayurveda, Siddha, Unani, Yoga & Naturopathy, Homoeopathy)
        if current_step == 3:
            if sys == "Ayurveda":
                en_q = "According to Ayurvedic clinical history, how would you describe your digestion (Agni) and bowel habits?"
                ta_q = "ஆயுர்வேத முறைப்படி, உங்கள் பசி, செரிமானம் (அக்னி) மற்றும் மலக்கட்டு நிலை எவ்வாறு உள்ளது?"
                hi_q = "आयुर्वेद के अनुसार, आपकी पाचन अग्नि, भूख एवं पेट साफ होने की स्थिति कैसी है?"
                options = [
                    {
                        "id": "good_agni",
                        "label": "சீரான பசி & இயல்பான செரிமானம்" if lang == "Tamil" else ("सामान्य भूख एवं नियमित पाचन" if lang == "Hindi" else "Balanced appetite and regular digestion"),
                        "localizedLabel": {
                            "en": "Balanced appetite and regular digestion",
                            "ta": "சீரான பசி & இயல்பான செரிமானம்",
                            "hi": "सामान्य भूख एवं नियमित पाचन"
                        }
                    },
                    {
                        "id": "vata_agni",
                        "label": "வாயு, வீக்கம் மற்றும் சீரற்ற பசி (வாத சமநிலையின்மை)" if lang == "Tamil" else ("गैस, पेट फूलना एवं अनियमित भूख (वात असंतुलन)" if lang == "Hindi" else "Irregular appetite with gas and bloating (Vata)"),
                        "localizedLabel": {
                            "en": "Irregular appetite with gas and bloating (Vata)",
                            "ta": "வாயு, வீக்கம் மற்றும் சீரற்ற பசி (வாத சமநிலையின்மை)",
                            "hi": "गैस, पेट फूलना एवं अनियमित भूख (वात असंतुलन)"
                        }
                    },
                    {
                        "id": "pitta_agni",
                        "label": "அதிக அமிலத்தன்மை, நெஞ்செரிச்சல் (பித்த வெப்பம்)" if lang == "Tamil" else ("खट्टी डकार, जलन एवं पित्त की अधिकता (पित्त प्रकोप)" if lang == "Hindi" else "Excessive acidity, burning or heat sensation (Pitta)"),
                        "localizedLabel": {
                            "en": "Excessive acidity, burning or heat sensation (Pitta)",
                            "ta": "அதிக அமிலத்தன்மை, நெஞ்செரிச்சல் (பித்த வெப்பம்)",
                            "hi": "खट्टी डकार, जलन एवं पित्त की अधिकता (पित्त प्रकोप)"
                        }
                    },
                    {
                        "id": "kapha_agni",
                        "label": "மந்தமான பசி, கனமான உணர்வு (கப மந்தம்)" if lang == "Tamil" else ("भूख की कमी, भारीपन एवं सुस्ती (कफ मंदाग्नि)" if lang == "Hindi" else "Sluggish digestion with heaviness after meals (Kapha)"),
                        "localizedLabel": {
                            "en": "Sluggish digestion with heaviness after meals (Kapha)",
                            "ta": "மந்தமான பசி, கனமான உணர்வு (கப மந்தம்)",
                            "hi": "भूख की कमी, भारीपन एवं सुस्ती (कफ मंदाग्नि)"
                        }
                    },
                ]

            elif sys == "Siddha":
                en_q = "In Siddha medicine, how would you describe your body heat, taste in mouth, and Mukkuttram balance?"
                ta_q = "சித்தா மருத்துவ முறைப்படி, உங்கள் உடல் சூடு, நாவின் சுவை மற்றும் நீர் வேட்கை நிலை எவ்வாறு உள்ளது?"
                hi_q = "सिद्ध चिकित्सा के अनुसार, आपके शरीर का ताप, प्यास एवं मुक्कुट्रम स्थिति कैसी है?"
                options = [
                    {
                        "id": "normal_mukkuttram",
                        "label": "இயல்பான உடல் சூடு மற்றும் தாகம்" if lang == "Tamil" else ("सामान्य शारीरिक ताप एवं प्यास" if lang == "Hindi" else "Normal body warmth and balanced hydration"),
                        "localizedLabel": {
                            "en": "Normal body warmth and balanced hydration",
                            "ta": "இயல்பான உடல் சூடு மற்றும் தாகம்",
                            "hi": "सामान्य शारीरिक ताप एवं प्यास"
                        }
                    },
                    {
                        "id": "azhal",
                        "label": "அதிக உடல் உஷ்ணம் / வாயில் கசப்பு சுவை (அழல் சமநிலையின்மை)" if lang == "Tamil" else ("शरीर में अधिक उष्णता एवं कड़वा स्वाद (अझल / पित्त)" if lang == "Hindi" else "Excessive body heat or bitter taste (Azhal / Pitta)"),
                        "localizedLabel": {
                            "en": "Excessive body heat or bitter taste (Azhal / Pitta)",
                            "ta": "அதிக உடல் உஷ்ணம் / வாயில் கசப்பு சுவை (அழல் சமநிலையின்மை)",
                            "hi": "शरीर में अधिक उष्णता एवं कड़वा स्वाद (अझल / पित्त)"
                        }
                    },
                    {
                        "id": "vali",
                        "label": "உடல் வறட்சி, மூட்டு இறுக்கம் அல்லது தசை வலி (வளி சமநிலையின்மை)" if lang == "Tamil" else ("शरीर में सूखापन, दर्द या जकड़न (वली / वात)" if lang == "Hindi" else "Dryness, joint stiffness or body ache (Vali / Vata)"),
                        "localizedLabel": {
                            "en": "Dryness, joint stiffness or body ache (Vali / Vata)",
                            "ta": "உடல் வறட்சி, மூட்டு இறுக்கம் அல்லது தசை வலி (வளி சமநிலையின்மை)",
                            "hi": "शरीर में सूखापन, दर्द या जकड़न (वली / वात)"
                        }
                    },
                    {
                        "id": "iyyam",
                        "label": "அதிக சளி, மார்பு பாரம் அல்லது குளிர்ச்சி (ஐய சமநிலையின்மை)" if lang == "Tamil" else ("कफ की अधिकता, भारीपन या शीतलता (अय्यम / कफ)" if lang == "Hindi" else "Excessive phlegm, heaviness or coldness (Iyyam / Kapha)"),
                        "localizedLabel": {
                            "en": "Excessive phlegm, heaviness or coldness (Iyyam / Kapha)",
                            "ta": "அதிக சளி, மார்பு பாரம் அல்லது குளிர்ச்சி (ஐய சமநிலையின்மை)",
                            "hi": "कफ की अधिकता, भारीपन या शीतलता (अय्यम / कफ)"
                        }
                    },
                ]

            elif sys == "Unani":
                en_q = "In Unani clinical history, what best reflects your Mizaj (temperament), thirst, and sleep rhythm?"
                ta_q = "யுனானி முறைப்படி, உங்கள் மிசாஜ் (உடலமைப்பு குணம்), தாகம் மற்றும் தூக்க நிலை எவ்வாறு உள்ளது?"
                hi_q = "यूनानी चिकित्सा के अनुसार, आपका मिज़ाज (शारीरिक प्रकृति), प्यास एवं नींद की स्थिति कैसी है?"
                options = [
                    {
                        "id": "equable_mizaj",
                        "label": "சீரான மிசாஜ் மற்றும் இயல்பான தாகம்" if lang == "Tamil" else ("संतुलित मिज़ाज एवं सामान्य प्यास" if lang == "Hindi" else "Equable temperament with moderate thirst and sound sleep"),
                        "localizedLabel": {
                            "en": "Equable temperament with moderate thirst and sound sleep",
                            "ta": "சீரான மிசாஜ் மற்றும் இயல்பான தாகம்",
                            "hi": "संतुलित मिज़ाज एवं सामान्य प्यास"
                        }
                    },
                    {
                        "id": "safra",
                        "label": "சூடான குணம், அதிக தாகம் மற்றும் அமைதியின்மை (சஃப்ரா)" if lang == "Tamil" else ("गर्म-खुश्क मिज़ाज, तेज प्यास एवं बेचैनी (सफ़रावी)" if lang == "Hindi" else "Hot & Dry temperament with intense thirst (Safra / Bilious)"),
                        "localizedLabel": {
                            "en": "Hot & Dry temperament with intense thirst (Safra / Bilious)",
                            "ta": "சூடான குணம், அதிக தாகம் மற்றும் அமைதியின்மை (சஃப்ரா)",
                            "hi": "गर्म-खुश्क मिज़ाज, तेज प्यास एवं बेचैनी (सफ़रावी)"
                        }
                    },
                    {
                        "id": "balgham",
                        "label": "குளிர் குணம், அதிக சளி மற்றும் தூக்கமின்மை (பல்கம்)" if lang == "Tamil" else ("सर्द-तर मिज़ाज, कफ एवं भारीपन (बलग़मी)" if lang == "Hindi" else "Cold & Moist temperament with excess phlegm (Balgham / Phlegmatic)"),
                        "localizedLabel": {
                            "en": "Cold & Moist temperament with excess phlegm (Balgham / Phlegmatic)",
                            "ta": "குளிர் குணம், அதிக சளி மற்றும் தூக்கமின்மை (பல்கம்)",
                            "hi": "सर्द-तर मिज़ाज, कफ एवं भारीपन (बलग़मी)"
                        }
                    },
                    {
                        "id": "sauda",
                        "label": "வறட்சி குணம், வாயு மற்றும் கவலை (சௌதா)" if lang == "Tamil" else ("सर्द-खुश्क मिज़ाज, गैस एवं अनिद्रा (सौदावी)" if lang == "Hindi" else "Cold & Dry temperament with disturbed sleep (Sauda / Melancholic)"),
                        "localizedLabel": {
                            "en": "Cold & Dry temperament with disturbed sleep (Sauda / Melancholic)",
                            "ta": "வறட்சி குணம், வாயு மற்றும் கவலை (சௌதா)",
                            "hi": "सर्द-खुश्क मिज़ाज, गैस एवं अनिद्रा (सौदावी)"
                        }
                    },
                ]

            elif sys == "Yoga & Naturopathy":
                en_q = "From a Naturopathic perspective, how are your daily hydration, lifestyle habits, and physical activity?"
                ta_q = "இயற்கை மருத்துவ முறைப்படி, உங்கள் தினசரி நீர் அருந்துதல், உடற்பயிற்சி மற்றும் வாழ்க்கை முறை எவ்வாறு உள்ளது?"
                hi_q = "प्राकृतिक चिकित्सा एवं योग के अनुसार, आपकी दिनचर्या, जल-सेवन एवं शारीरिक गतिविधि कैसी है?"
                options = [
                    {
                        "id": "healthy_habits",
                        "label": "போதுமான 2.5L+ தண்ணீர், சத்தான உணவு மற்றும் உடற்பயிற்சி" if lang == "Tamil" else ("पर्याप्त जल (2.5+ लीटर), नियमित व्यायाम एवं सात्विक आहार" if lang == "Hindi" else "Adequate 2.5L+ water, balanced diet, and regular exercise"),
                        "localizedLabel": {
                            "en": "Adequate 2.5L+ water, balanced diet, and regular exercise",
                            "ta": "போதுமான 2.5L+ தண்ணீர், சத்தான உணவு மற்றும் உடற்பயிற்சி",
                            "hi": "पर्याप्त जल (2.5+ लीटर), नियमित व्यायाम एवं सात्विक आहार"
                        }
                    },
                    {
                        "id": "sedentary",
                        "label": "அமர்ந்து வேலை செய்யும் பழக்கம், குறைந்த தண்ணீர் அருந்துதல்" if lang == "Tamil" else ("बैठकर काम करना एवं बहुत कम पानी पीना" if lang == "Hindi" else "Sedentary work with low fluid intake"),
                        "localizedLabel": {
                            "en": "Sedentary work with low fluid intake",
                            "ta": "அமர்ந்து வேலை செய்யும் பழக்கம், குறைந்த தண்ணீர் அருந்துதல்",
                            "hi": "बैठकर काम करना एवं बहुत कम पानी पीना"
                        }
                    },
                    {
                        "id": "high_stress",
                        "label": "அதிக மன அழுத்தம், தாமதமான உணவு மற்றும் தூக்கமின்மை" if lang == "Tamil" else ("अधिक मानसिक तनाव, असमय भोजन एवं अनिद्रा" if lang == "Hindi" else "High stress, erratic food timings, and poor sleep"),
                        "localizedLabel": {
                            "en": "High stress, erratic food timings, and poor sleep",
                            "ta": "அதிக மன அழுத்தம், தாமதமான உணவு மற்றும் தூக்கமின்மை",
                            "hi": "अधिक मानसिक तनाव, असमय भोजन एवं अनिद्रा"
                        }
                    },
                    {
                        "id": "fatigued",
                        "label": "சூரிய ஒளி குறைவு, உடல் சோர்வு மற்றும் குறைந்த சுறுசுறுப்பு" if lang == "Tamil" else ("धूप का अभाव, शारीरिक थकान एवं सुस्त दिनचर्या" if lang == "Hindi" else "Low sunlight exposure, physical fatigue, and low vitality"),
                        "localizedLabel": {
                            "en": "Low sunlight exposure, physical fatigue, and low vitality",
                            "ta": "சூரிய ஒளி குறைவு, உடல் சோர்வு மற்றும் குறைந்த சுறுசுறுப்பு",
                            "hi": "धूप का अभाव, शारीरिक थकान एवं सुस्त दिनचर्या"
                        }
                    },
                ]

            else:  # Homoeopathy
                en_q = "In Homoeopathic case-taking, under which specific conditions or modalities does your symptom worsen or improve?"
                ta_q = "ஹோமியோபதி முறைப்படி, உங்கள் உபாதை எந்த சூழ்நிலையில் அல்லது நேரத்தில் அதிகமாகிறது அல்லது குறைகிறது?"
                hi_q = "होम्योपैथी केस-टेकिंग के अनुसार, आपकी तकलीफ़ किस स्थिति या समय में घटती या बढ़ती है?"
                options = [
                    {
                        "id": "motion_aggravates",
                        "label": "அசைவினால் அதிகமாகிறது, முழு ஓய்வில் குணமாகிறது" if lang == "Tamil" else ("हिलने-डुलने से बढ़ती है, विश्राम से आराम मिलता है" if lang == "Hindi" else "Worse from motion, relieved by absolute rest"),
                        "localizedLabel": {
                            "en": "Worse from motion, relieved by absolute rest",
                            "ta": "அசைவினால் அதிகமாகிறது, முழு ஓய்வில் குணமாகிறது",
                            "hi": "हिलने-डुलने से बढ़ती है, विश्राम से आराम मिलता है"
                        }
                    },
                    {
                        "id": "rest_aggravates",
                        "label": "ஓய்வில் அதிகமாகிறது, மெதுவான அசைவில் குணமாகிறது" if lang == "Tamil" else ("विश्राम से बढ़ती है, धीरे-धीरे चलने पर आराम मिलता है" if lang == "Hindi" else "Worse at rest, relieved by gentle continuous movement"),
                        "localizedLabel": {
                            "en": "Worse at rest, relieved by gentle continuous movement",
                            "ta": "ஓய்வில் அதிகமாகிறது, மெதுவான அசைவில் குணமாகிறது",
                            "hi": "विश्राम से बढ़ती है, धीरे-धीरे चलने पर आराम मिलता है"
                        }
                    },
                    {
                        "id": "cold_aggravates",
                        "label": "குளிர்காற்றில் அதிகம், வெதுவெதுப்பான ஒத்தடத்தில் நலம்" if lang == "Tamil" else ("ठंड या ठंडी हवा से बढ़ती है, गर्म सेक से आराम" if lang == "Hindi" else "Worse from cold draft, relieved by heat and warmth"),
                        "localizedLabel": {
                            "en": "Worse from cold draft, relieved by heat and warmth",
                            "ta": "குளிர்காற்றில் அதிகம், வெதுவெதுப்பான ஒத்தடத்தில் நலம்",
                            "hi": "ठंड या ठंडी हवा से बढ़ती है, गर्म सेक से आराम"
                        }
                    },
                    {
                        "id": "heat_aggravates",
                        "label": "அறை வெப்பத்தில் அதிகம், திறந்தவெளி குளிர்ந்த காற்றில் நலம்" if lang == "Tamil" else ("गर्मी या बंद कमरे में बढ़ती है, खुली ताज़ा हवा में आराम" if lang == "Hindi" else "Worse from warmth or stuffy room, relieved in open fresh air"),
                        "localizedLabel": {
                            "en": "Worse from warmth or stuffy room, relieved in open fresh air",
                            "ta": "அறை வெப்பத்தில் அதிகம், திறந்தவெளி குளிர்ந்த காற்றில் நலம்",
                            "hi": "गर्मी या बंद कमरे में बढ़ती है, खुली ताज़ा हवा में आराम"
                        }
                    },
                ]

            current_q = ta_q if lang == "Tamil" else (hi_q if lang == "Hindi" else en_q)

            return {
                "id": "Q_AYUSH_FRAMEWORK_NUANCE",
                "text": current_q,
                "englishText": en_q,
                "tamilText": ta_q,
                "hindiText": hi_q,
                "questionType": "ayush_nuance",
                "inputType": "OPTIONS",
                "options": options,
                "stepNumber": 4,
                "language": lang,
                "medicalSystem": sys
            }

        # After step 4, enough information is collected
        return None

    def generate_summary(
        self,
        patient_context: Dict[str, Any],
        answers_history: List[Dict[str, Any]],
        emergency_flag: str = "No"
    ) -> str:
        """
        Generates a structured pre-consultation summary in the patient's language,
        adhering to the 1,875-dataset summary standard.
        """
        lang = self.normalize_language(patient_context.get("language"))
        sys = self.normalize_medical_system(patient_context.get("medicalSystem") or patient_context.get("medical_system"))
        chief_complaint = patient_context.get("chiefComplaint") or patient_context.get("chief_complaint", "Reported symptoms")
        canonical = self.map_to_canonical_complaint(chief_complaint)
        age = patient_context.get("age", 35) or 35
        gender = patient_context.get("gender", "Patient") or "Patient"

        duration = "several days"
        progression = "stable"
        ayush_notes = ""

        for a in answers_history:
            q_id = a.get("question_id", "")
            ans = a.get("patient_answer", "")
            if "ONSET" in q_id:
                duration = ans.split("(")[0].strip()
            elif "PROGRESSION" in q_id:
                progression = ans.split("(")[0].strip()
            elif "FRAMEWORK" in q_id:
                ayush_notes = ans.split("(")[0].strip()

        if lang == "Tamil":
            summary = (
                f"முன்-ஆலோசனை பதிவு. {age} வயது நோயாளி ({gender}) {duration} காலமாக "
                f"{canonical} கொண்டுள்ளார். நிலை: {progression}. "
                f"முறை: {sys}. மருத்துவ கவனிப்பு: {ayush_notes or 'பதிவு செய்யப்பட்டுள்ளது'}. "
                f"அவசர நிலை வகைப்பாடு: {emergency_flag}."
            )
        elif lang == "Hindi":
            summary = (
                f"पूर्व-परामर्श रिकॉर्ड। {age} वर्ष के रोगी ({gender}) को {duration} से "
                f"{canonical} है। स्थिति: {progression}। "
                f"प्रणाली: {sys}। स्वास्थ्य अवलोकन: {ayush_notes or 'दर्ज किया गया'}। "
                f"आपातकालीन स्थिति: {emergency_flag}।"
            )
        else:
            summary = (
                f"Pre-consultation record. Patient aged {age} ({gender}) reports "
                f"{canonical.lower()} for {duration}. Progression: {progression}. "
                f"System: {sys}. Clinical observation: {ayush_notes or 'Recorded'}. "
                f"Emergency status: {emergency_flag}."
            )

        return summary

ayush_adaptive_engine = AYUSHAdaptiveEngine()
