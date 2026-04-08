# admin_backend/routes/visit.py
# ─────────────────────────────────────────────────────────────────────────────
# Full door-step visit lifecycle for ASHA field workers
#
#  POST  /visit/start                  — begin a new visit session
#  POST  /visit/record-vitals          — save measured vitals + emergency check
#  POST  /visit/record-symptoms        — log symptom discussion
#  POST  /visit/add-prescription       — add a new medicine instruction
#  POST  /visit/end                    — close the visit, update patient record
#  GET   /visit/history/{patient_id}   — past visit records for a patient
# ─────────────────────────────────────────────────────────────────────────────

import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, status

from db import supabase_client as db
from core.emergency_detector import check_vitals_for_emergency
from core.risk_scoring import compute_risk_score
from models.visit import (
    StartVisitRequest,
    StartVisitResponse,
    RecordVitalsRequest,
    RecordVitalsResponse,
    RecordSymptomsRequest,
    RecordSymptomsResponse,
    AddPrescriptionRequest,
    AddPrescriptionResponse,
    EndVisitRequest,
    EndVisitResponse,
    VisitHistoryResponse,
)

logger = logging.getLogger("admin.visit")
router = APIRouter(tags=["Visit"])


# ─────────────────────────────────────────────────────────────────────────────
# Helper: require patient or 404
# ─────────────────────────────────────────────────────────────────────────────
def _require_patient(patient_id: str) -> dict:
    patient = db.fetch_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{patient_id}' not found",
        )
    return patient


# ─────────────────────────────────────────────────────────────────────────────
# POST /visit/start
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/visit/start",
    response_model=StartVisitResponse,
    summary="Begin a new visit session",
    description=(
        "Call once when the ASHA worker arrives at a patient's home. "
        "Returns a session_id that must be included in all subsequent "
        "/visit/* calls to tie them to this visit."
    ),
)
def start_visit(body: StartVisitRequest):
    logger.info(f"Visit start — patient={body.patient_id}, worker={body.worker_id}")

    patient = _require_patient(body.patient_id)

    session_id = str(uuid.uuid4())
    started_at = datetime.now(timezone.utc).isoformat()

    logger.info(f"Session created — session_id={session_id}")

    return StartVisitResponse(
        success=True,
        session_id=session_id,
        patient_name=patient.get("name", "Unknown"),
        patient_age=patient.get("age"),
        emergency_flag=patient.get("emergency_flag", False),
        started_at=started_at,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /visit/record-vitals
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/visit/record-vitals",
    response_model=RecordVitalsResponse,
    summary="Record patient vitals and run emergency detection",
    description=(
        "Saves the vitals measured during the visit (BP, SpO2, HR, temperature). "
        "Immediately runs the emergency detector — if a critical threshold is breached "
        "`is_emergency=True` is returned and the patient's emergency_flag is set in DB. "
        "A new risk score is computed and persisted."
    ),
)
def record_vitals(body: RecordVitalsRequest):
    logger.info(
        f"Vitals record — patient={body.patient_id}, session={body.session_id}"
    )

    patient = _require_patient(body.patient_id)

    # 1. Emergency detection
    emergency = check_vitals_for_emergency(
        sys_bp     = body.systolic_bp,
        dia_bp     = body.diastolic_bp,
        spo2       = body.spo2,
        heart_rate = body.heart_rate,
        temperature= body.temperature,
    )

    if emergency.is_critical:
        db.update_patient_emergency_flag(body.patient_id, True)
        logger.warning(
            f"EMERGENCY flagged — patient={body.patient_id}, "
            f"breaches={emergency.breach_details}"
        )

    # 2. Risk scoring (refreshed with new vitals)
    risk = compute_risk_score(
        age              = patient.get("age", 0),
        chronic_diseases = patient.get("chronic_diseases") or [],
        sys_bp           = body.systolic_bp,
        dia_bp           = body.diastolic_bp,
        spo2             = body.spo2,
        heart_rate       = body.heart_rate,
        temperature      = body.temperature,
        adherence_rate   = patient.get("adherence_rate", 100.0),
        missed_followups = patient.get("missed_follow_ups", 0),
        recent_symptoms  = [],   # no new symptoms yet at vitals-recording stage
    )

    # 3. Persist vitals row (schema uses `recorded_by` for worker UUID, no session_id column)
    vitals_row = {
        "patient_id":   body.patient_id,
        "recorded_by":  body.worker_id,
        "systolic_bp":  body.systolic_bp,
        "diastolic_bp": body.diastolic_bp,
        "spo2":         body.spo2,
        "heart_rate":   body.heart_rate,
        "temperature":  body.temperature,
        "recorded_at":  datetime.now(timezone.utc).isoformat(),
    }
    db.insert_vitals(vitals_row)

    # 4. Update patient risk in DB
    db.update_patient_risk(
        patient_id     = body.patient_id,
        risk_score     = risk.score,
        risk_level     = risk.level,
    )

    logger.info(
        f"Vitals saved — risk_score={risk.score}, level={risk.level}, "
        f"emergency={emergency.is_critical}"
    )

    return RecordVitalsResponse(
        success=True,
        session_id=body.session_id,
        is_emergency=emergency.is_critical,
        emergency_details=emergency.breach_details,
        computed_risk_score=risk.score,
        computed_risk_level=risk.level,
        risk_factors=risk.risk_factors,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /visit/record-symptoms
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/visit/record-symptoms",
    response_model=RecordSymptomsResponse,
    summary="Log symptom discussion for this visit",
    description=(
        "Records symptoms the patient reported during the visit. "
        "Stores them in the ai_consultations table so the AI history is consistent "
        "with records from the User app. "
        "Updates latest_symptom_severity on the patient profile."
    ),
)
def record_symptoms(body: RecordSymptomsRequest):
    logger.info(
        f"Symptom record — patient={body.patient_id}, session={body.session_id}, "
        f"symptoms={body.symptoms}"
    )

    _require_patient(body.patient_id)

    consultation_row = {
        "user_id":            body.patient_id,
        "session_id":         body.session_id,
        "message_type":       "worker_observation",
        "user_message":       f"Field worker observation: {', '.join(body.symptoms)}",
        "ai_response":        body.notes or "",
        "extracted_symptoms": body.symptoms,
        "risk_level":         body.severity.value,
        "analysis_summary":   body.notes or f"Observed by ASHA worker. Severity: {body.severity.value}",
        "was_offline":        False,
        "created_at":         datetime.now(timezone.utc).isoformat(),
    }
    db.insert_symptom_consultation(consultation_row)

    logger.info(f"Symptom consultation saved — severity={body.severity}")

    return RecordSymptomsResponse(
        success=True,
        session_id=body.session_id,
        symptoms_recorded=body.symptoms,
        severity=body.severity,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /visit/add-prescription
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/visit/add-prescription",
    response_model=AddPrescriptionResponse,
    summary="Add a new medicine prescription",
    description=(
        "Saves a new prescription issued during the visit. "
        "`duration_days` is used to auto-calculate the expiry date. "
        "Prescriptions are readable by both the Admin and User apps."
    ),
)
def add_prescription(body: AddPrescriptionRequest):
    logger.info(
        f"Prescription — patient={body.patient_id}, medicine={body.medicine_name}"
    )

    _require_patient(body.patient_id)

    now       = datetime.now(timezone.utc)
    expires_at: Optional[str] = None
    if body.duration_days:
        expires_at = (now + timedelta(days=body.duration_days)).isoformat()

    prescription_row = {
        "user_id":       body.patient_id,
        "session_id":    body.session_id,
        "worker_id":     body.worker_id,
        "medicine_name": body.medicine_name,
        "dosage":        body.dosage,
        "frequency":     body.frequency,
        "meal_timing":   body.meal_timing,
        "duration_days": body.duration_days,
        "expires_at":    expires_at,
        "issued_at":     now.isoformat(),
        "notes":         body.notes,
    }
    db.insert_prescription(prescription_row)

    logger.info(f"Prescription saved — expires={expires_at}")

    return AddPrescriptionResponse(
        success=True,
        session_id=body.session_id,
        medicine_name=body.medicine_name,
        expires_at=expires_at,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /visit/end
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/visit/end",
    response_model=EndVisitResponse,
    summary="Close the visit session",
    description=(
        "Must be called when the field worker leaves. "
        "Creates a permanent visit_records entry, updates the patient's "
        "last_visit_date and last_worker_id, clears emergency_flag if resolved, "
        "and updates the worker's last_sync timestamp."
    ),
)
def end_visit(body: EndVisitRequest):
    logger.info(
        f"Visit end — patient={body.patient_id}, session={body.session_id}, "
        f"worker={body.worker_id}"
    )

    _require_patient(body.patient_id)

    ended_at = datetime.now(timezone.utc).isoformat()

    visit_record = {
        "patient_id":       body.patient_id,
        "worker_id":        body.worker_id,
        "session_id":       body.session_id,
        "visit_type":       body.visit_type,
        "started_at":       body.started_at,
        "ended_at":         ended_at,
        "outcome_notes":    body.outcome_notes,
        "follow_up_needed": body.follow_up_needed,
        "follow_up_days":   body.follow_up_days,
    }
    db.insert_visit_record(visit_record)

    # Update patient profile
    db.update_patient_post_visit(
        patient_id     = body.patient_id,
        worker_id      = body.worker_id,
        follow_up_days = body.follow_up_days,
    )

    # If worker marked emergency resolved, clear the flag
    if body.emergency_resolved:
        db.update_patient_emergency_flag(body.patient_id, False)
        logger.info(f"Emergency flag cleared — patient={body.patient_id}")

    # Mark worker sync time
    db.update_worker_last_sync(body.worker_id)

    logger.info(f"Visit closed — session={body.session_id}")

    return EndVisitResponse(
        success=True,
        session_id=body.session_id,
        ended_at=ended_at,
        follow_up_needed=body.follow_up_needed,
        follow_up_days=body.follow_up_days,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /visit/history/{patient_id}
# ─────────────────────────────────────────────────────────────────────────────
@router.get(
    "/visit/history/{patient_id}",
    response_model=VisitHistoryResponse,
    summary="Get past visit records for a patient",
    description="Returns the last 10 visit records for a given patient, newest first.",
)
def get_visit_history(patient_id: str):
    logger.info(f"Visit history request — patient={patient_id}")

    _require_patient(patient_id)
    records = db.fetch_visit_history(patient_id, limit=10)

    return VisitHistoryResponse(
        success=True,
        patient_id=patient_id,
        records=records,
        total=len(records),
    )
