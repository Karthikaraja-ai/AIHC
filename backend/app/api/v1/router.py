from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    patients,
    appointments,
    doctors,
    nurses,
    lab,
    prescriptions,
    reminders,
    ai,
    ocr,
    emergency,
    audit,
    preconsultation
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["appointments"])
api_router.include_router(doctors.router, prefix="/doctors", tags=["doctors"])
api_router.include_router(nurses.router, prefix="/nurses", tags=["nurses"])
api_router.include_router(lab.router, prefix="/lab", tags=["lab"])
api_router.include_router(prescriptions.router, prefix="/prescriptions", tags=["prescriptions"])
api_router.include_router(reminders.router, prefix="/reminders", tags=["reminders"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(ocr.router, prefix="/ocr", tags=["ocr"])
api_router.include_router(emergency.router, prefix="/emergency", tags=["emergency"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])
api_router.include_router(preconsultation.router, prefix="/preconsultation", tags=["preconsultation"])

