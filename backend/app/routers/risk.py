# backend/app/routers/risk.py
from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/risk", tags=["Clinical Risk"])

@router.post("/evaluate")
def evaluate_risk(payload: Dict[str, Any]):
    return {
        "score": 82,
        "level": "Critical",
        "is_emergency": True,
        "emergency_reason": "Hypertensive crisis + suspected ACS symptoms",
        "factors": ["BP 168/102", "Angina pain"],
        "recommended_specialty": "Cardiology / Emergency"
    }
