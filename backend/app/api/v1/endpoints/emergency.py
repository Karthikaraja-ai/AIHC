import uuid
import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.models.emergency import EmergencyAlert
from app.schemas.emergency import EmergencyAlertCreate, EmergencyAlertStatusUpdate

router = APIRouter()

def serialize_alert(a: EmergencyAlert) -> Dict[str, Any]:
    return {
        "id": a.id,
        "patientId": a.patient_id,
        "patientName": a.patient_name,
        "symptomSummary": a.symptom_summary,
        "detectedAt": a.detected_at.isoformat() if a.detected_at else None,
        "triageLevel": a.triage_level,
        "status": a.status,
        "acknowledgedBy": a.acknowledged_by,
        "vitalsAlert": a.vitals_alert
    }

@router.get("/alerts", response_model=List[Dict[str, Any]])
async def list_emergency_alerts(
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(EmergencyAlert)
    if status:
        query = query.where(EmergencyAlert.status == status)

    result = await db.execute(query)
    alerts = result.scalars().all()
    return [serialize_alert(a) for a in alerts]

@router.post("/trigger", response_model=Dict[str, Any])
async def trigger_emergency(req: EmergencyAlertCreate, db: AsyncSession = Depends(get_db)):
    alert_id = f"EMG-{int(datetime.datetime.utcnow().timestamp()*1000)}-{uuid.uuid4().hex[:4].upper()}"
    new_alert = EmergencyAlert(
        id=alert_id,
        patient_id=req.patientId,
        patient_name=req.patientName,
        symptom_summary=req.symptomSummary,
        triage_level=req.triageLevel or "EMERGENCY",
        status="ACTIVE",
        vitals_alert=req.vitalsAlert
    )
    db.add(new_alert)
    await db.commit()
    await db.refresh(new_alert)
    return serialize_alert(new_alert)

@router.put("/alerts/{alert_id}/acknowledge", response_model=Dict[str, Any])
async def acknowledge_emergency(alert_id: str, update: EmergencyAlertStatusUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EmergencyAlert).where(EmergencyAlert.id == alert_id))
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    alert.status = update.status
    if update.acknowledgedBy:
        alert.acknowledged_by = update.acknowledgedBy

    await db.commit()
    await db.refresh(alert)
    return serialize_alert(alert)
