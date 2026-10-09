import uuid
import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.models.clinical import LabSample
from app.schemas.clinical import LabSampleCreate, LabSampleUpdate

router = APIRouter()

def serialize_sample(s: LabSample) -> Dict[str, Any]:
    return {
        "sampleId": s.sample_id,
        "patientId": s.patient_id,
        "patientName": s.patient_name,
        "testName": s.test_name,
        "sampleType": s.sample_type,
        "department": s.department,
        "status": s.status,
        "receivedAt": s.received_at.isoformat() if s.received_at else None,
        "completedAt": s.completed_at.isoformat() if s.completed_at else None,
        "technicianName": s.technician_name,
        "reportUrl": s.report_url,
        "summaryFindings": s.summary_findings
    }

@router.get("/samples", response_model=List[Dict[str, Any]])
async def list_samples(
    patient_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(LabSample)
    if patient_id:
        query = query.where(LabSample.patient_id == patient_id)
    if status:
        query = query.where(LabSample.status == status)

    result = await db.execute(query)
    samples = result.scalars().all()
    return [serialize_sample(s) for s in samples]

@router.post("/samples", response_model=Dict[str, Any])
async def register_sample(req: LabSampleCreate, db: AsyncSession = Depends(get_db)):
    sample_id = req.sampleId or f"SMP-{int(datetime.datetime.utcnow().timestamp()*1000)%100000:05d}"
    new_sample = LabSample(
        sample_id=sample_id,
        patient_id=req.patientId,
        patient_name=req.patientName,
        test_name=req.testName,
        sample_type=req.sampleType,
        department=req.department,
        status=req.status or "COLLECTED",
        technician_name=req.technicianName,
        report_url=req.reportUrl,
        summary_findings=req.summaryFindings
    )
    db.add(new_sample)
    await db.commit()
    await db.refresh(new_sample)
    return serialize_sample(new_sample)

@router.put("/samples/{sample_id}", response_model=Dict[str, Any])
async def update_sample(sample_id: str, update: LabSampleUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LabSample).where(LabSample.sample_id == sample_id))
    sample = result.scalars().first()
    if not sample:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sample not found")

    if update.status is not None:
        sample.status = update.status
        if update.status == "COMPLETED" and not sample.completed_at:
            sample.completed_at = datetime.datetime.utcnow()
    if update.technicianName is not None:
        sample.technician_name = update.technicianName
    if update.reportUrl is not None:
        sample.report_url = update.reportUrl
    if update.summaryFindings is not None:
        sample.summary_findings = update.summaryFindings

    await db.commit()
    await db.refresh(sample)
    return serialize_sample(sample)
