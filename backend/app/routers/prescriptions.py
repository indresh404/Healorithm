# backend/app/routers/prescriptions.py
from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])

@router.post("/confirm-generic")
def confirm_generic(payload: Dict[str, Any]):
    return {"status": "confirmed", "jan_aushadhi_savings_ratio": 0.85, "payload": payload}
