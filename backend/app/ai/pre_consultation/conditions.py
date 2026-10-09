import json
import os
from typing import Optional, Set, Dict, Any, List

CONDITIONS_PATH = os.path.join(os.path.dirname(__file__), "conditions.json")
try:
    with open(CONDITIONS_PATH, "r", encoding="utf-8") as f:
        CONDITION_RULES: List[Dict[str, Any]] = json.load(f)
except Exception:
    CONDITION_RULES = []

def detect_condition_category(chief_complaint: Optional[str], body_selections: Optional[List[Dict[str, Any]]] = None) -> str:
    combined = (chief_complaint or "").lower()
    if body_selections:
        for b in body_selections:
            combined += " " + str(b.get("regionName", "")).lower()
            combined += " " + str(b.get("regionId", "")).lower()

    if any(kw in combined for kw in [
        "back", "spine", "lumbar", "thoracic", "cervical", "lumbago", "sciatica",
        "முதுகு", "முதுகுத்தண்டு", "இடுப்பு வலி",
        "पीठ", "कमर", "रीढ़"
    ]):
        return "BACK_PAIN"

    if any(kw in combined for kw in [
        "headache", "head ache", "migraine", "head heaviness", "forehead",
        "தலைவலி", "தலைக்கனம்", "ஒற்றைத் தலைவலி", "நெற்றி வலி",
        "सिर दर्द", "माइग्रेन", "माथे का दर्द", "सिर में भारीपन"
    ]):
        return "HEADACHE"

    if any(kw in combined for kw in [
        "stomach", "abdomen", "abdominal", "belly", "gastric", "acidity", "indigestion", "nausea",
        "வயிறு", "வயிற்று வலி", "செரியாமை", "நெஞ்செரிச்சல்",
        "पेट", "उदर", "गैस", "अपच", "एसिडिटी"
    ]):
        return "ABDOMINAL_PAIN"

    if any(kw in combined for kw in [
        "cough", "phlegm", "sputum", "breath", "wheez", "chest congestion",
        "இருமல்", "சளி", "கபம்", "மூச்சுத் திணறல்",
        "खांसी", "कफ", "बलगम", "सांस"
    ]):
        return "COUGH_RESPIRATORY"

    if any(kw in combined for kw in [
        "skin", "rash", "itching", "eczema", "allergy", "hives",
        "தோல்", "அரிப்பு", "தடிப்பு", "ஒவ்வாமை",
        "त्वचा", "खुजली", "चकत्ते", "एलर्जी"
    ]):
        return "SKIN_PROBLEM"

    if any(kw in combined for kw in [
        "chest", "angina",
        "மார்பு", "நெஞ்சு",
        "सीना", "छाती"
    ]):
        return "CHEST_PAIN"

    if any(kw in combined for kw in [
        "joint", "knee", "shoulder", "arthritis", "stiffness",
        "மூட்டு", "முழங்கால்", "வாத பிடிப்பு",
        "जोड़", "घुटना", "गठिया"
    ]):
        return "JOINTS_SPINE"

    if any(kw in combined for kw in [
        "fever", "chills", "high temperature",
        "காய்ச்சல்", "உடல் சூடு",
        "बुखार", "तापमान"
    ]):
        return "FEVER"

    return "GENERAL"

def get_next_condition_question(
    category: str,
    answered_question_ids: Set[str],
    skip_location_questions: bool = False
) -> Optional[Dict[str, Any]]:
    rule = next((r for r in CONDITION_RULES if r.get("category") == category), None)
    if not rule:
        return None

    for question in rule.get("questions", []):
        q_id = question.get("id")
        if q_id not in answered_question_ids:
            if skip_location_questions and (question.get("category") == "BODY_LOCATION" or "LOCATION" in q_id):
                continue
            return question

    return None
