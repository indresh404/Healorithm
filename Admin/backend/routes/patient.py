# admin_backend/routes/patient.py
# ─────────────────────────────────────────────────────────────────────────────
# Patient-level endpoints used by field workers (admins)
#
#  GET  /patient/scan/{qr_code}
#       Worker scans a patient's QR card → returns full profile
#
#  GET  /patient/prioritized-list/{worker_id}
#       Returns the worker's patient list sorted by AI priority score
# ─────────────────────────────────────────────────────────────────────────────

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status

from db import supabase_client as db
from core.patient_prioritization import build_prioritized_list
from core.risk_scoring import compute_risk_score
from models.patient import PatientProfileResponse, PrioritizedListResponse

logger = logging.getLogger("admin.patient")
router = APIRouter(tags=["Patient"])


# ─────────────────────────────────────────────────────────────────────────────
# GET /patient/scan/{qr_code}
# ─────────────────────────────────────────────────────────────────────────────
@router.get(
    "/patient/scan/{qr_code}",
    response_model=PatientProfileResponse,
    summary="Scan patient QR code",
    description=(
        "Called when the field worker scans a patient's QR card. "
        "Returns the complete patient profile along with the last 5 vitals readings, "
        "last 3 AI consultation records, and all active prescriptions."
    ),
)
def scan_patient_qr(qr_code: str):
    logger.info(f"QR scan request — qr_code={qr_code}")

    patient = db.fetch_patient_by_qr(qr_code)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No patient found with QR code '{qr_code}'",
        )

    patient_id = patient["id"]

    # Parallel-style fetches (Supabase client is sync; good enough for small payloads)
    recent_vitals        = db.fetch_recent_vitals(patient_id, limit=5)
    recent_consultations = db.fetch_recent_consultations(patient_id, limit=3)
    active_prescriptions = db.fetch_active_prescriptions(patient_id)

    # Compute days since last visit
    last_visit_str  = patient.get("last_visit_date")
    days_since_visit = None
    if last_visit_str:
        try:
            lv = datetime.fromisoformat(last_visit_str.replace("Z", "+00:00"))
            days_since_visit = max((datetime.now(timezone.utc) - lv).days, 0)
        except Exception:
            pass

    logger.info(
        f"Profile fetched — patient={patient.get('name')}, "
        f"vitals={len(recent_vitals)}, consults={len(recent_consultations)}, "
        f"prescriptions={len(active_prescriptions)}"
    )

    return PatientProfileResponse(
        success=True,
        patient={
            "id":                 patient.get("id"),
            "name":               patient.get("name"),
            "age":                patient.get("age"),
            "gender":             patient.get("gender"),
            "phone":              patient.get("phone"),
            "village":            patient.get("village"),
            "chronic_diseases":   patient.get("chronic_diseases") or [],
            "allergies":          patient.get("allergies") or [],
            "current_risk_score": patient.get("current_risk_score"),
            "risk_level":         patient.get("risk_level"),
            "adherence_rate":     patient.get("adherence_rate"),
            "emergency_flag":     patient.get("emergency_flag", False),
        },
        recent_vitals=recent_vitals,
        recent_consultations=recent_consultations,
        active_prescriptions=active_prescriptions,
        last_visit_date=last_visit_str,
        days_since_visit=days_since_visit,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /patient/prioritized-list/{worker_id}
# ─────────────────────────────────────────────────────────────────────────────
@router.get(
    "/patient/prioritized-list/{worker_id}",
    response_model=PrioritizedListResponse,
    summary="AI-prioritized patient visit list",
    description=(
        "Returns the worker's assigned patients sorted by an AI priority score. "
        "Score combines current risk level, days since last visit, medicine adherence, "
        "recent symptom severity, and age. "
        "Patient #1 should be visited first."
    ),
)
def get_prioritized_patients(worker_id: str):
    logger.info(f"Prioritization request — worker_id={worker_id}")

    assignment = db.fetch_worker_assignment(worker_id)
    if assignment is None:
        # worker_assignments table may not exist yet, or worker has no row;
        # fall back to ALL patients so the app still shows data.
        logger.warning(f"No assignment found for '{worker_id}' — falling back to all patients")
        assigned_ids = db.fetch_all_patient_ids()
    else:
        assigned_ids = assignment.get("assigned_patients") or []
    logger.info(f"Worker {worker_id} has {len(assigned_ids)} assigned patients")

    result = build_prioritized_list(worker_id, assigned_ids)

    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("error", "Prioritization failed"),
        )

    db.update_worker_last_sync(worker_id)

    return PrioritizedListResponse(
        success=True,
        worker_id=worker_id,
        total_patients=result["total_patients"],
        prioritized_list=result["prioritized_list"],
        generated_at=result["generated_at"],
    )
