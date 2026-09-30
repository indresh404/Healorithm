# backend/app/db/models.py
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class PatientModel(BaseModel):
    id: str
    qr_id: str
    name: str
    age: int
    gender: str
    preferred_language: str = "en"
    phone: str
    village: str
    household_id: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    created_at: str
    updated_at: Optional[str] = None
    consent_status: str = "granted"

class VisitModel(BaseModel):
    id: str
    patient_id: str
    patient_name: str
    visit_date: str
    worker_id: str
    worker_name: str
    village: str
    report_type: str
    symptoms: List[str] = []
    affected_body_zones: List[str] = []
    vitals: Optional[Dict[str, Any]] = None
    sync_status: str = "synced"
    created_at: str

class ReferralModel(BaseModel):
    id: str
    patient_id: str
    patient_name: str
    worker_id: str
    worker_name: str
    target_facility: str
    priority: str
    specialty_required: str
    reason: str
    status: str = "pending"
    created_at: str
