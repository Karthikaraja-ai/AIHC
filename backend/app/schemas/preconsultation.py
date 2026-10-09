from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class PreConsultationStartRequest(BaseModel):
    patientId: str = Field(..., description="Unique Patient ID e.g. PAT-0001")
    appointmentId: Optional[str] = Field(None, description="Optional booked appointment ID")
    language: str = Field("English", description="Patient selected language: English, Tamil, or Hindi")
    medicalSystem: str = Field("Ayurveda", description="AYUSH medical system: Ayurveda, Siddha, Unani, Yoga & Naturopathy, Homoeopathy")
    chiefComplaint: str = Field(..., description="Patient reported health issue or symptom")
    age: Optional[int] = Field(None, description="Patient age")
    gender: Optional[str] = Field(None, description="Patient gender: Male, Female, or Other")
    severity: Optional[str] = Field("Moderate", description="Symptom severity: Mild, Moderate, or Severe")
    duration: Optional[str] = Field(None, description="Reported duration if known")
    bodySelections: Optional[List[Dict[str, Any]]] = Field(None, description="Body map selected areas")

class PreConsultationAnswerRequest(BaseModel):
    sessionId: str = Field(..., description="Active pre-consultation session ID")
    questionId: Optional[str] = Field(None, description="ID of question being answered")
    patientAnswer: str = Field(..., description="Patient response text")
    answerCategory: Optional[str] = Field("patient_response", description="Category of answer")
    inputMethod: Optional[str] = Field("TEXT", description="VOICE, TOUCH_SELECTION, or TEXT")

class PreConsultationQuestionResponse(BaseModel):
    id: str
    text: str
    englishText: Optional[str] = None
    tamilText: Optional[str] = None
    hindiText: Optional[str] = None
    questionType: str = "duration"
    inputType: str = "OPTIONS"
    options: Optional[List[Dict[str, Any]]] = None
    stepNumber: int = 1
    isEmergency: bool = False
    emergencyFlag: str = "No"

class PreConsultationSessionResponse(BaseModel):
    sessionId: str
    patientId: str
    appointmentId: Optional[str] = None
    language: str
    medicalSystem: str
    chiefComplaint: Optional[str] = None
    currentStep: int = 1
    status: str = "IN_PROGRESS"
    isEmergency: bool = False
    emergencyFlag: str = "No"
    emergencyReason: Optional[str] = None
    isSufficient: bool = False
    progressPercent: int = 25
    nextQuestion: Optional[PreConsultationQuestionResponse] = None
    summary: Optional[str] = None
    qaHistory: Optional[List[Dict[str, Any]]] = None
