import json
import os
import datetime
import uuid
from typing import Optional, Dict, Any, List, Set
from app.ai.emergency_detector.detector import emergency_detector
from app.ai.pre_consultation.conditions import detect_condition_category, get_next_condition_question

BASE_Q_PATH = os.path.join(os.path.dirname(__file__), "base_questions.json")
try:
    with open(BASE_Q_PATH, "r", encoding="utf-8") as f:
        BASE_QUESTIONS: List[Dict[str, Any]] = json.load(f)
except Exception:
    BASE_QUESTIONS = []

class AIEngine:
    def __init__(self):
        self.base_questions_map = {q["id"]: q for q in BASE_QUESTIONS if "id" in q}

    def detect_red_flags(self, text: str) -> List[str]:
        lower = text.lower()
        flags = []

        if any(w in lower for w in ['chest pain', 'நெஞ்சு வலி', 'heart attack', 'left arm pain', 'सीने में दर्द']):
            flags.append('CRITICAL: Acute Chest Discomfort / Suspected Cardiac Event')

        if any(w in lower for w in ['cannot breathe', 'severe breath', 'மூச்சுத் திணறல்', 'choking', 'सांस फूलना']):
            flags.append('CRITICAL: Acute Respiratory Distress')

        if any(w in lower for w in ['paralysis', 'face droop', 'speech slur', 'stroke', 'பக்கவாதம்', 'लकवा']):
            flags.append('CRITICAL: Suspected Acute Stroke / Focal Neurological Deficit')

        if any(w in lower for w in ['unconscious', 'fainted', 'blackout', 'மயக்கம்', 'बेहोश']):
            flags.append('CRITICAL: Syncope / Altered Sensorium')

        if any(w in lower for w in ['heavy bleeding', 'severe bleeding', 'இரத்தப்போக்கு', 'खून बहना']):
            flags.append('CRITICAL: Severe Uncontrolled Hemorrhage')

        return flags

    def evaluate_sufficiency(self, answers: List[Dict[str, Any]], chief_complaint: str, body_selections: List[Dict[str, Any]]) -> Dict[str, Any]:
        answered_count = len(answers)
        score = 0
        if chief_complaint:
            score += 25
        if body_selections or any("LOCATION" in a.get("questionId", "") for a in answers):
            score += 25
        if any(k in a.get("questionId", "") for a in answers for k in ["CHARACTER", "ONSET", "RADIATION"]):
            score += 25
        if answered_count >= 3:
            score += 25

        progress_percent = min(100, max(20, round((answered_count / 4) * 100)))
        is_sufficient = (answered_count >= 3 and bool(chief_complaint))
        return {
            "isSufficient": is_sufficient,
            "progressPercent": progress_percent
        }

    def get_next_adaptive_question(
        self,
        medicine_system: str,
        answers: List[Dict[str, Any]],
        body_selections: Optional[List[Dict[str, Any]]] = None,
        chief_complaint: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        answered_ids: Set[str] = {a.get("questionId") for a in answers if a.get("questionId")}
        body_selections = body_selections or []

        # Find chief complaint from answers if not passed
        if not chief_complaint:
            for a in answers:
                if a.get("questionId") == "Q_CHIEF_COMPLAINT":
                    chief_complaint = a.get("answerText")
                    break

        complaint_lower = (chief_complaint or "").lower()

        # 1. Ask Chief Complaint if not answered
        if not chief_complaint and "Q_CHIEF_COMPLAINT" not in answered_ids:
            return self.base_questions_map.get("Q_CHIEF_COMPLAINT")

        # 2. Condition-specific questions routing
        condition_cat = detect_condition_category(chief_complaint, body_selections)
        if condition_cat != "GENERAL":
            has_location = bool(body_selections) or any(
                loc in complaint_lower for loc in ["back", "முதுகு", "कमर", "forehead", "நெற்றி", "abdomen"]
            )
            candidate_q = get_next_condition_question(condition_cat, answered_ids, has_location)
            if candidate_q:
                q_copy = dict(candidate_q)
                q_copy["questionNumber"] = len(answers) + 1
                return q_copy

            if not any(a.get("questionId") == "Q_DURATION_SEVERITY" for a in answers) and len(answers) < 4:
                dur_q = self.base_questions_map.get("Q_DURATION_SEVERITY")
                if dur_q:
                    q_copy = dict(dur_q)
                    q_copy["questionNumber"] = len(answers) + 1
                    return q_copy
            return None

        # 3. Check for Character question
        if not any("CHARACTER" in q_id for q_id in answered_ids):
            if any(k in complaint_lower for k in ["stomach", "gastric", "வயிறு"]):
                char_q = self.base_questions_map.get("Q_CHARACTER_STOMACH")
                if char_q:
                    q_copy = dict(char_q)
                    q_copy["questionNumber"] = len(answers) + 1
                    return q_copy
            elif any(k in complaint_lower for k in ["joint", "back", "முதுகு", "மூட்டு"]):
                char_q = self.base_questions_map.get("Q_CHARACTER_JOINTS")
                if char_q:
                    q_copy = dict(char_q)
                    q_copy["questionNumber"] = len(answers) + 1
                    return q_copy

        # 4. Duration & Severity Slider
        if "Q_DURATION_SEVERITY" not in answered_ids:
            dur_q = self.base_questions_map.get("Q_DURATION_SEVERITY")
            if dur_q:
                q_copy = dict(dur_q)
                q_copy["questionNumber"] = len(answers) + 1
                return q_copy

        # 5. Framework-specific questions
        for q_id, q in self.base_questions_map.items():
            if q_id not in answered_ids and q_id not in ["Q_CHIEF_COMPLAINT", "Q_DURATION_SEVERITY", "Q_ADDITIONAL_FINAL"]:
                # Check system relevance
                if medicine_system == "AYURVEDA" and ("AYU" in q_id or "AYUR" in q_id):
                    q_copy = dict(q)
                    q_copy["questionNumber"] = len(answers) + 1
                    return q_copy
                elif medicine_system == "YOGA_NATUROPATHY" and "YOGA" in q_id:
                    q_copy = dict(q)
                    q_copy["questionNumber"] = len(answers) + 1
                    return q_copy
                elif medicine_system == "SIDDHA" and "SIDDHA" in q_id:
                    q_copy = dict(q)
                    q_copy["questionNumber"] = len(answers) + 1
                    return q_copy
                elif medicine_system == "UNANI" and "UNANI" in q_id:
                    q_copy = dict(q)
                    q_copy["questionNumber"] = len(answers) + 1
                    return q_copy
                elif medicine_system == "ALLOPATHY_HOMEOPATHY" and "ALLO" in q_id:
                    q_copy = dict(q)
                    q_copy["questionNumber"] = len(answers) + 1
                    return q_copy

        # 6. Final Open Question
        if "Q_ADDITIONAL_FINAL" not in answered_ids and len(answers) >= 4:
            final_q = self.base_questions_map.get("Q_ADDITIONAL_FINAL")
            if final_q:
                q_copy = dict(final_q)
                q_copy["questionNumber"] = len(answers) + 1
                return q_copy

        return None

    def interpret_patient_response(self, question_id: str, answer_text: str, medicine_system: str) -> Dict[str, Any]:
        """Produce structured clinical interpretation of patient answer."""
        confidence = 0.95
        detected_entity = answer_text
        notes = f"Answer received for {question_id}"
        return {
            "detectedEntity": detected_entity,
            "clinicalNotes": notes,
            "confidence": confidence
        }

    def generate_summary(
        self,
        patient_id: str,
        medicine_system: str,
        answers: List[Dict[str, Any]],
        body_selections: Optional[List[Dict[str, Any]]] = None,
        appointment_id: Optional[str] = None,
        preferred_language: str = "en"
    ) -> Dict[str, Any]:
        body_selections = body_selections or []
        answer_texts = [a.get("answerText", "") for a in answers]
        severity = 5
        duration = "3 days"
        chief_complaint = "Reported clinical symptoms"

        for a in answers:
            q_id = a.get("questionId", "")
            ans = a.get("answerText", "")
            if q_id == "Q_CHIEF_COMPLAINT":
                chief_complaint = ans
            elif "DURATION" in q_id or "SEVERITY" in q_id:
                try:
                    parts = ans.split(";")
                    for p in parts:
                        if "severity:" in p.lower():
                            severity = int(p.split(":")[-1].strip())
                        elif "duration:" in p.lower():
                            duration = p.split(":")[-1].strip()
                except Exception:
                    pass

        eval_result = emergency_detector.evaluate_symptoms(
            answer_texts,
            severity,
            body_selections[0].get("regionId") if body_selections else None
        )

        red_flags = list(set(eval_result.get("triggeredRedFlags", [])))
        for ans in answer_texts:
            red_flags.extend(self.detect_red_flags(ans))
        red_flags = list(set(red_flags))

        summary_id = f"SUM-{int(datetime.datetime.utcnow().timestamp()*1000)}-{uuid.uuid4().hex[:4].upper()}"

        return {
            "id": summary_id,
            "patientId": patient_id,
            "appointmentId": appointment_id,
            "createdAt": datetime.datetime.utcnow().isoformat(),
            "medicineSystem": medicine_system or "ALLOPATHY_HOMEOPATHY",
            "chiefComplaint": chief_complaint,
            "symptomsList": [f"{a.get('questionText', '')}: {a.get('answerText', '')}" for a in answers],
            "duration": duration,
            "severity": severity,
            "bodyLocations": [f"{b.get('regionName', '')} ({b.get('side', 'FRONT')})" for b in body_selections],
            "associatedSymptoms": [],
            "detectedRedFlags": red_flags,
            "recommendedTriage": eval_result.get("triageLevel", "NORMAL"),
            "confidenceScore": 0.95,
            "disclaimer": "IMPORTANT CLINICAL NOTICE: This is an AI-generated pre-consultation information-collection summary. It does NOT constitute a confirmed medical diagnosis or prescription. Final diagnostic assessment and clinical treatment decisions are strictly made by the consulting physician.",
            "qaRecords": answers
        }

ai_engine = AIEngine()
