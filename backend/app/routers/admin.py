# backend/app/routers/admin.py
from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/admin", tags=["Admin System"])

@router.get("/stats")
def get_system_stats():
    return {
        "active_workers": 14,
        "enrolled_patients": 420,
        "offline_deltas_synced_today": 89,
        "generic_cost_saved_inr": 24500
    }
