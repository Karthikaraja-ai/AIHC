import datetime
from sqlalchemy import Column, String, DateTime, Text
from app.database.base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(64), primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    actor_id = Column(String(64), nullable=False, index=True)
    actor_role = Column(String(32), nullable=False)
    action = Column(String(64), nullable=False, index=True)
    resource_id = Column(String(64), nullable=False)
    details = Column(Text, nullable=False)
    ip_address = Column(String(64), nullable=True)
