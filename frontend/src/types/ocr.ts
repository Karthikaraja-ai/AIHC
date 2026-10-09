// Types for Uploaded Reports and OCR Information Extraction

export interface LabParameter {
  parameterName: string;
  measuredValue: string | number;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  severity: 'NORMAL' | 'HIGH' | 'CRITICAL_HIGH' | 'LOW' | 'CRITICAL_LOW';
}

export interface MedicalReport {
  id: string;
  patientId: string;
  reportTitle: string;
  reportDate: string;
  fileType: 'PDF' | 'JPG' | 'PNG';
  originalFileUrl: string;
  fileDataUri?: string;
  thumbnailUrl?: string;
  fileSizeBytes: number;
  uploadedAt: string;
  uploadedBy?: string;
  reportType?: string;
  ocrStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  confidenceScore?: number;
  isLowConfidence?: boolean;
  extractedRawText?: string;
  extractedParameters: LabParameter[];
  aiSummary?: {
    en: string;
    ta: string;
    hi: string;
  };
  criticalFindings: string[];
  observationsForDiscussion?: string[];
  keywords?: string[];
  doctorVerificationStatus: 'UNVERIFIED' | 'VERIFIED' | 'AMENDED';
  verifiedByDoctorName?: string;
  verifiedAt?: string;
  doctorReportedImpression?: string;
  disclaimer: string; // "AI-generated summary. Doctor verification required. Original document preserved."
}
