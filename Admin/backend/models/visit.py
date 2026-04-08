# admin_backend/models/visit.py
# ─────────────────────────────────────────────────────────────────────────────
# Pydantic schemas for the complete Visit workflow:
#   Start Visit → Record Vitals → Record Symptoms → Add Prescription → End Visit
# ─────────────────────────────────────────────────────────────────────────────

from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class RiskLevel(str, Enum):
    green  = "green"
    yellow = "yellow"
    red    = "red"


class Severity(str, Enum):
    mild     = "mild"
    moderate = "moderate"
    severe   = "severe"


# ─── Start Visit ─────────────────────────────────────────────────────────────

class StartVisitRequest(BaseModel):
    worker_id:  str
    patient_id: str


class StartVisitResponse(BaseModel):
    success:       bool
    session_id:    str           # UUID for this visit session
    patient_name:  str
    patient_age:   Optional[int] = None
    emergency_flag: bool         = False
    started_at:    str


# ─── Record Vitals ────────────────────────────────────────────────────────────

class RecordVitalsRequest(BaseModel):
    session_id:   str
    patient_id:   str
    worker_id:    str
    systolic_bp:  int   = Field(..., ge=50,   le=300,   description="Systolic BP in mmHg")
    diastolic_bp: int   = Field(..., ge=30,   le=200,   description="Diastolic BP in mmHg")
    spo2:         float = Field(..., ge=50.0, le=100.0, description="Oxygen saturation %")
    temperature:  float = Field(..., ge=30.0, le=45.0,  description="Body temp in °C")
    heart_rate:   int   = Field(..., ge=20,   le=250,   description="Heart rate in bpm")
    notes:        Optional[str] = ""


class RecordVitalsResponse(BaseModel):
    success:             bool
    session_id:          str
    is_emergency:        bool
    emergency_details:   List[str] = []   # Which thresholds were crossed
    computed_risk_score: float
    computed_risk_level: str
    risk_factors:        List[str] = []
    error:               Optional[str] = None


# ─── Record Symptoms ──────────────────────────────────────────────────────────

class RecordSymptomsRequest(BaseModel):
    session_id: str
    patient_id: str
    symptoms:   List[str] = Field(..., min_length=1)
    severity:   Severity  = Severity.mild
    notes:      Optional[str] = ""


class RecordSymptomsResponse(BaseModel):
    success:           bool
    session_id:        str
    symptoms_recorded: List[str]
    severity:          Severity
    error:             Optional[str] = None


# ─── Add Prescription ─────────────────────────────────────────────────────────

class AddPrescriptionRequest(BaseModel):
    session_id:    str
    patient_id:    str
    worker_id:     str
    medicine_name: str
    dosage:        str
    frequency:     str              # "Once daily", "Twice daily", "As needed"
    meal_timing:   Optional[str]  = ""   # e.g. "Before food", "After food"
    duration_days: Optional[int]  = Field(None, ge=1, le=365)
    notes:         Optional[str]  = ""


class AddPrescriptionResponse(BaseModel):
    success:       bool
    session_id:    str
    medicine_name: str
    expires_at:    Optional[str] = None
    error:         Optional[str] = None


# ─── End Visit ────────────────────────────────────────────────────────────────

class EndVisitRequest(BaseModel):
    session_id:         str
    patient_id:         str
    worker_id:          str
    visit_type:         str           = "routine"  # "routine" | "emergency" | "follow_up"
    started_at:         str           = ""          # ISO timestamp from StartVisitResponse
    outcome_notes:      Optional[str] = ""
    follow_up_needed:   bool          = False
    follow_up_days:     Optional[int] = None
    emergency_resolved: bool          = False


class EndVisitResponse(BaseModel):
    success:          bool
    session_id:       str
    ended_at:         str
    follow_up_needed: bool
    follow_up_days:   Optional[int] = None
    error:            Optional[str] = None


# ─── Visit History ────────────────────────────────────────────────────────────

class VisitHistoryResponse(BaseModel):
    success:    bool
    patient_id: str
    records:    List[dict] = []
    total:      int        = 0
    error:      Optional[str] = None
