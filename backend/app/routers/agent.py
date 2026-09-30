# backend/app/routers/agent.py
from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/agent", tags=["Care Coordination Agent"])

@router.get("/tasks")
def list_agent_tasks():
    return [
        {
            "id": "task-01",
            "title": "Emergency Dispatch Coordination",
            "patient_name": "Ramesh Kumar",
            "village": "Adoni",
            "priority": "Critical",
            "action_proposed": "108 Ambulance alert to Adoni CHC Emergency",
            "status": "pending_doctor_approval"
        }
    ]

@router.post("/tasks/{task_id}/dispatch")
def dispatch_task(task_id: str, action: Dict[str, Any]):
    return {"status": "dispatched", "task_id": task_id}
