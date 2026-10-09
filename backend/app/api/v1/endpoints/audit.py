import uuid
import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database.session import get_db
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogCreate

router = APIRouter()

def serialize_audit(log: AuditLog) -> Dict[str, Any]:
    return {
        "id": log.id,
        "timestamp": log.timestamp.isoformat() if log.timestamp else None,
        "actorId": log.actor_id,
        "actorRole": log.actor_role,
        "action": log.action,
        "resourceId": log.resource_id,
        "details": log.details,
        "ipAddress": log.ip_address
    }

@router.get("/logs", response_model=List[Dict[str, Any]])
async def list_audit_logs(
    actor_id: Optional[str] = Query(None),
    resource_id: Optional[str] = Query(None),
    limit: int = Query(50),
    db: AsyncSession = Depends(get_db)
):
    query = select(AuditLog).order_by(desc(AuditLog.timestamp)).limit(limit)
    if actor_id:
        query = query.where(AuditLog.actor_id == actor_id)
    if resource_id:
        query = query.where(AuditLog.resource_id == resource_id)

    result = await db.execute(query)
    logs = result.scalars().all()
    return [serialize_audit(l) for l in logs]

@router.post("/logs", response_model=Dict[str, Any])
async def create_audit_log(req: AuditLogCreate, request: Request, db: AsyncSession = Depends(get_db)):
    log_id = f"AUD-{int(datetime.datetime.utcnow().timestamp()*1000)}-{uuid.uuid4().hex[:4].upper()}"
    client_ip = req.ipAddress or request.client.host if request.client else "127.0.0.1"

    new_log = AuditLog(
        id=log_id,
        actor_id=req.actorId,
        actor_role=req.actorRole,
        action=req.action,
        resource_id=req.resourceId,
        details=req.details,
        ip_address=client_ip
    )
    db.add(new_log)
    await db.commit()
    await db.refresh(new_log)
    return serialize_audit(new_log)
