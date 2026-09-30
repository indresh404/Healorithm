# backend/app/routers/agent.py
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..db.models import CareTaskModel, AuditLogModel

router = APIRouter(prefix="/agent", tags=["Care Coordination Agent"])

@router.get("/tasks")
def list_agent_tasks(db: Session = Depends(get_db)):
    tasks = db.query(CareTaskModel).order_by(CareTaskModel.created_at.desc()).all()
    return [
        {
            "id": t.id,
            "patient_id": t.patient_id,
            "user_id": t.patient_id,
            "patient_name": t.patient_name,
            "village": t.village,
            "priority": t.priority,
            "missing_data_fields": t.missing_data_fields or [],
            "reason": t.reason,
            "recommended_action": t.recommended_action,
            "action_proposed": t.recommended_action,
            "assigned_worker": t.assigned_worker,
            "status": t.status,
            "created_at": t.created_at
        }
        for t in tasks
    ]

@router.post("/tasks/{task_id}/dispatch")
def dispatch_task(task_id: str, action: Dict[str, Any], db: Session = Depends(get_db)):
    t = db.query(CareTaskModel).filter(CareTaskModel.id == task_id).first()
    if t:
        t.status = "dispatched"
        db.commit()
    return {"status": "dispatched", "task_id": task_id}
