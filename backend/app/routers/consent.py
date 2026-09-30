# backend/app/routers/consent.py
from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/consent", tags=["Consent"])

@router.post("/record")
def record_consent(payload: Dict[str, Any]):
    return {"status": "recorded", "patient_id": payload.get("patient_id"), "consent_status": payload.get("status")}
