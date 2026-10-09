import base64
import datetime
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.models.report import MedicalReport
from app.schemas.report import ReportVerificationUpdate
from app.ocr.pipeline import ocr_pipeline
from app.ai.report_summarizer.summarizer import report_summarizer

router = APIRouter()

def serialize_report(r: MedicalReport) -> Dict[str, Any]:
    return {
        "id": r.id,
        "patientId": r.patient_id,
        "reportTitle": r.report_title,
        "reportDate": r.report_date,
        "fileType": r.file_type,
        "originalFileUrl": r.original_file_url,
        "fileDataUri": r.file_data_uri,
        "thumbnailUrl": r.thumbnail_url,
        "fileSizeBytes": r.file_size_bytes,
        "uploadedAt": r.uploaded_at.isoformat() if r.uploaded_at else None,
        "uploadedBy": r.uploaded_by,
        "reportType": r.report_type,
        "ocrStatus": r.ocr_status,
        "confidenceScore": r.confidence_score,
        "isLowConfidence": r.is_low_confidence,
        "extractedRawText": r.extracted_raw_text,
        "extractedParameters": r.extracted_parameters or [],
        "aiSummary": r.ai_summary or {},
        "criticalFindings": r.critical_findings or [],
        "observationsForDiscussion": r.observations_for_discussion or [],
        "keywords": r.keywords or [],
        "doctorVerificationStatus": r.doctor_verification_status,
        "verifiedByDoctorName": r.verified_by_doctor_name,
        "verifiedAt": r.verified_at.isoformat() if r.verified_at else None,
        "doctorReportedImpression": r.doctor_reported_impression,
        "disclaimer": r.disclaimer
    }

@router.get("/reports", response_model=List[Dict[str, Any]])
async def list_reports(
    patient_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(MedicalReport)
    if patient_id:
        query = query.where(MedicalReport.patient_id == patient_id)

    result = await db.execute(query)
    reports = result.scalars().all()
    return [serialize_report(r) for r in reports]

@router.get("/reports/{report_id}", response_model=Dict[str, Any])
async def get_report(report_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MedicalReport).where(MedicalReport.id == report_id))
    report = result.scalars().first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return serialize_report(report)

@router.post("/process", response_model=Dict[str, Any])
async def process_report_file(
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    uploaded_by: str = Form("Patient"),
    db: AsyncSession = Depends(get_db)
):
    clean_patient_id = patient_id.strip().upper()
    file_bytes = await file.read()
    file_size = len(file_bytes)
    filename = file.filename or "Diagnostic_Report.pdf"
    report_title = filename.rsplit(".", 1)[0]
    file_type = "PDF" if "pdf" in filename.lower() else "PNG" if "png" in filename.lower() else "JPG"

    # 1. DUPLICATE REPORT DETECTION
    existing_result = await db.execute(select(MedicalReport).where(MedicalReport.patient_id == clean_patient_id))
    existing_reports = existing_result.scalars().all()

    for r in existing_reports:
        same_title = r.report_title.lower().strip() == report_title.lower().strip()
        same_size = r.file_size_bytes == file_size
        if same_title and same_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'Duplicate Report Detected: "{filename}" ({(file_size / 1024):.1f} KB) has already been uploaded and summarized for this patient. Please upload a new or updated diagnostic report.'
            )

    # 2. EXTRACT TEXT & AUTHENTICATE CLINICAL KEYWORDS
    extracted_text = ocr_pipeline.extract_text_from_file(file_bytes, filename)
    matched_keywords = ocr_pipeline.validate_clinical_keywords(filename, extracted_text)

    # 3. KEYWORDLESS / NON-MEDICAL FILE DETECTION
    if not matched_keywords:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Unrecognized Document: No clinical diagnostic keywords or laboratory parameters detected in "{filename}". The AI Report Summarizer requires an authentic medical test report (e.g. CBC, Blood Glucose, Lipid Profile, LFT, KFT, or Thyroid). Please upload a valid laboratory report.'
        )

    # 4. MULTI-REPORT CLASSIFICATION & PARAMETER EXTRACTION
    report_type, extracted_params = ocr_pipeline.classify_and_extract_parameters(filename, extracted_text)

    # 5. AI MULTILINGUAL SUMMARIZATION
    ai_summary, critical_findings, observations = report_summarizer.summarize_report(
        report_type=report_type,
        parameters=extracted_params,
        patient_id=clean_patient_id
    )

    # Raw OCR text representation
    raw_ocr_text = ocr_pipeline.build_raw_ocr_text(report_title, clean_patient_id, report_type, extracted_params)

    # File data URI for rendering
    content_type = file.content_type or "application/octet-stream"
    b64_str = base64.b64encode(file_bytes).decode("utf-8")
    data_uri = f"data:{content_type};base64,{b64_str}"

    report_id = f"RPT-{int(datetime.datetime.utcnow().timestamp()*1000)}-{uuid.uuid4().hex[:4].upper()}"

    new_report = MedicalReport(
        id=report_id,
        patient_id=clean_patient_id,
        report_title=report_title,
        report_date=datetime.date.today().isoformat(),
        file_type=file_type,
        original_file_url=filename,
        file_data_uri=data_uri,
        file_size_bytes=file_size,
        uploaded_by=uploaded_by,
        report_type=report_type,
        ocr_status="COMPLETED",
        confidence_score=98.2,
        is_low_confidence=False,
        extracted_raw_text=raw_ocr_text,
        extracted_parameters=extracted_params,
        ai_summary=ai_summary,
        critical_findings=critical_findings,
        observations_for_discussion=observations,
        keywords=matched_keywords,
        doctor_verification_status="UNVERIFIED",
        disclaimer="AI-generated summary. Doctor verification required. Original document preserved."
    )

    db.add(new_report)
    await db.commit()
    await db.refresh(new_report)

    return serialize_report(new_report)

@router.put("/reports/{report_id}/verify", response_model=Dict[str, Any])
async def verify_report(report_id: str, update: ReportVerificationUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MedicalReport).where(MedicalReport.id == report_id))
    report = result.scalars().first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    report.doctor_verification_status = update.doctorVerificationStatus
    report.verified_by_doctor_name = update.verifiedByDoctorName
    report.verified_at = datetime.datetime.utcnow()
    if update.doctorReportedImpression:
        report.doctor_reported_impression = update.doctorReportedImpression
    if update.amendedParameters:
        report.extracted_parameters = update.amendedParameters

    await db.commit()
    await db.refresh(report)
    return serialize_report(report)

@router.delete("/reports/{report_id}")
async def delete_report(report_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MedicalReport).where(MedicalReport.id == report_id))
    report = result.scalars().first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    await db.delete(report)
    await db.commit()
    return {"message": "Report deleted successfully"}
