# backend/app/routers/patients.py
from fastapi import APIRouter
from typing import List
from ..db.models import PatientModel
from ..db.seed import INITIAL_DEMO_PATIENTS

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.get("", response_model=List[PatientModel])
def list_patients():
    return INITIAL_DEMO_PATIENTS

@router.get("/{patient_id}")
def get_patient(patient_id: str):
    for p in INITIAL_DEMO_PATIENTS:
        if p["id"] == patient_id:
            return p
    return INITIAL_DEMO_PATIENTS[0]
