from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class NextQuestionRequest(BaseModel):
    patientId: str
    medicineSystem: str
    currentQuestionIndex: int
    answersSoFar: List[Dict[str, Any]]
    bodySelections: Optional[List[Dict[str, Any]]] = []

class AnswerSubmissionRequest(BaseModel):
    patientId: str
    consultationId: str
    medicineSystem: str
    questionId: str
    questionCategory: str
    originalQuestion: str
    englishQuestion: str
    tamilQuestion: str
    hindiQuestion: str
    patientOriginalResponse: str
    inputMethod: Optional[str] = "TOUCH_SELECTION" # VOICE, TOUCH_SELECTION, TEXT

class SummaryGenerateRequest(BaseModel):
    patientId: str
    appointmentId: Optional[str] = None
    medicineSystem: str
    answers: List[Dict[str, Any]]
    bodySelections: Optional[List[Dict[str, Any]]] = []
    preferredLanguage: Optional[str] = "en"
