from typing import Optional
from pydantic import BaseModel

class AuditLogCreate(BaseModel):
    actorId: str
    actorRole: str
    action: str
    resourceId: str
    details: str
    ipAddress: Optional[str] = None
