# backend/app/routers/doctor_requests.py
from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/doctor-requests", tags=["Doctor Requests"])

@router.get("")
def list_doctor_requests():
    return []

@router.post("")
def create_doctor_request(req: Dict[str, Any]):
    return {"status": "created", "request": req}
