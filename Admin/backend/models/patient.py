# admin_backend/models/patient.py
# ─────────────────────────────────────────────────────────────────────────────
# Pydantic schemas for Patient-related requests and responses.
# All shapes are strict so the API contract is explicit and self-documenting.
# ─────────────────────────────────────────────────────────────────────────────

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ─── Individual sub-models ────────────────────────────────────────────────────

class VitalSnapshot(BaseModel):
    id:          str
    sys_bp:      Optional[int]   = None
    dia_bp:      Optional[int]   = None
    spo2:        Optional[float] = None
    temperature: Optional[float] = None
    heart_rate:  Optional[int]   = None
    is_critical: bool            = False
    notes:       Optional[str]   = None
    created_at:  Optional[str]   = None


class ConsultationSnapshot(BaseModel):
    id:                 str
    message_type:       Optional[str]  = None   # 'text', 'voice', 'worker_entry'
    user_message:       Optional[str]  = None
    extracted_symptoms: Optional[list] = []
    risk_level:         Optional[str]  = "green"
    analysis_summary:   Optional[str]  = None
    created_at:         Optional[str]  = None


class PrescriptionSnapshot(BaseModel):
    id:            str
    medicine_name: Optional[str] = None
    dosage:        Optional[str] = None
    frequency:     Optional[str] = None
    duration_days: Optional[int] = None
    is_active:     bool          = True
    expires_at:    Optional[str] = None
    created_at:    Optional[str] = None


# ─── Response: /patient/scan/{qr_code} ───────────────────────────────────────

class PatientProfileResponse(BaseModel):
    success:              bool
    patient: Optional[dict]   = None       # Core patient info
    recent_vitals:        list = []
    recent_consultations: list = []
    active_prescriptions: list = []
    last_visit_date:      Optional[str]  = None
    days_since_visit:     Optional[int]  = None
    error:                Optional[str]  = None


# ─── Response: /patient/prioritized-list/{worker_id} ─────────────────────────

class PrioritizedPatient(BaseModel):
    visit_order:    int
    patient_id:     str
    name:           str
    phone:          Optional[str]  = None
    village:        Optional[str]  = None
    priority_score: float
    risk_level:     str            = "green"   # 'green' | 'yellow' | 'red'
    reason:         str
    days_overdue:   int
    adherence_rate: float
    age:            Optional[int]  = None
    emergency_flag: bool           = False


class PrioritizedListResponse(BaseModel):
    success:          bool
    worker_id:        str
    total_patients:   int
    prioritized_list: list[PrioritizedPatient] = []
    generated_at:     str
    error:            Optional[str] = None
