# backend/app/routers/conflicts.py
from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/conflicts", tags=["Conflicts"])

@router.get("")
def list_conflicts():
    return []

@router.post("/{conflict_id}/resolve")
def resolve_conflict(conflict_id: str, resolution: Dict[str, Any]):
    return {"status": "resolved", "conflict_id": conflict_id}
