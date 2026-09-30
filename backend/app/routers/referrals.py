# backend/app/routers/referrals.py
from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter(prefix="/referrals", tags=["Referrals"])

@router.get("")
def list_referrals():
    return [
        {
            "id": "ref-01",
            "patient_id": "u-101",
            "patient_name": "Ramesh Kumar",
            "worker_name": "Lakshmi P.",
            "target_facility": "Adoni CHC",
            "priority": "Emergency",
            "specialty_required": "Cardiology / Emergency",
            "reason": "Severe acute chest pressure with elevated BP 168/102",
            "status": "pending",
            "created_at": "2026-09-30T07:15:00Z"
        }
    ]

@router.patch("/{referral_id}")
def update_referral(referral_id: str, body: Dict[str, Any]):
    return {"status": "updated", "referral_id": referral_id, "new_status": body.get("status")}
