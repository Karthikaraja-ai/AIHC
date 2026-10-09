from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class ReportVerificationUpdate(BaseModel):
    doctorVerificationStatus: str # UNVERIFIED, VERIFIED, AMENDED
    verifiedByDoctorName: str
    doctorReportedImpression: Optional[str] = None
    amendedParameters: Optional[List[Dict[str, Any]]] = None

class ReportSaveRequest(BaseModel):
    patientId: str
    reportTitle: str
    reportDate: str
    fileType: str
    originalFileUrl: str
    fileDataUri: Optional[str] = None
    fileSizeBytes: int
    reportType: Optional[str] = None
    extractedRawText: Optional[str] = None
    extractedParameters: List[Dict[str, Any]]
    aiSummary: Dict[str, str]
    criticalFindings: List[str]
    observationsForDiscussion: Optional[List[str]] = []
    keywords: Optional[List[str]] = []
