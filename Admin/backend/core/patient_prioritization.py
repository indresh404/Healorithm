# admin_backend/core/patient_prioritization.py
# ─────────────────────────────────────────────────────────────────────────────
# AI Patient Prioritization Agent
#
# Purpose
# ───────
# An ASHA field worker manages 20-30 patients per day. This agent computes a
# PRIORITY SCORE for each assigned patient and returns them sorted so the
# worker immediately knows who needs attention most urgently.
#
# Algorithm
# ─────────
# priority_score =
#     (risk_score     × WEIGHT_RISK)      +  40% — current health danger
#     (days_overdue   × WEIGHT_OVERDUE)   +  30% — how long since last visit
#     (adherence_gap  × WEIGHT_ADHERENCE) +  15% — low adherence = more urgent
#     (symptom_sev    × WEIGHT_SYMPTOM)   +  10% — recent complaint severity
#     (age_factor     × WEIGHT_AGE)           5% — slight elderly bias
#
# All inputs come from Supabase (existing tables the User app already writes to)
# ─────────────────────────────────────────────────────────────────────────────

from datetime import datetime, timezone
from config import PRIO_WEIGHTS, MAX_OVERDUE_DAYS_SCORE
from db import supabase_client as db
from core.risk_scoring import compute_risk_score


# ─── Symptom severity map ─────────────────────────────────────────────────────
_RISK_LEVEL_TO_SEVERITY = {
    "green":   0.0,
    "yellow":  5.0,
    "red":    10.0,
    "unknown": 3.0,
}


def _days_since(iso_date_str: str | None) -> int:
    """Return calendar days since a given UTC ISO-8601 timestamp. Never fails."""
    if not iso_date_str:
        return 999          # Never visited — treat as maximum overdue
    try:
        dt = datetime.fromisoformat(iso_date_str.replace("Z", "+00:00"))
        return max((datetime.now(timezone.utc) - dt).days, 0)
    except Exception:
        return 999


def _build_reason(
    risk_score:    float,
    days_overdue:  int,
    adherence:     float,
    ai_risk_level: str,
) -> str:
    """Compose a short human-readable reason string for the worker."""
    parts = []
    if risk_score >= 70:
        parts.append(f"High risk ({risk_score:.0f})")
    if days_overdue >= 999:
        parts.append("First visit")
    elif days_overdue > 7:
        parts.append(f"{days_overdue}d overdue")
    if adherence < 60:
        parts.append(f"Low adherence ({adherence:.0f}%)")
    if ai_risk_level == "red":
        parts.append("Critical AI symptoms")
    return " · ".join(parts) if parts else "Routine checkup"


# ─── Main public function ─────────────────────────────────────────────────────

def build_prioritized_list(worker_id: str, patient_ids: list) -> dict:
    """
    Entry point called by the route handler.

    Returns
    ───────
    {
      "success": bool,
      "worker_id": str,
      "total_patients": int,
      "generated_at": ISO timestamp,
      "prioritized_list": [
          {
            "visit_order": 1,
            "patient_id": "...",
            "name": "...",
            "phone": "...",
            "village": "...",
            "priority_score": 87.5,
            "risk_level": "red",
            "reason": "High risk (92) · 8d overdue · Low adherence (45%)",
            "days_overdue": 8,
            "adherence_rate": 45.0,
            "age": 67,
            "emergency_flag": true
          },
          ...
      ]
    }
    """
    if not patient_ids:
        return _empty_result(worker_id)

    # ── Batch fetch all patients in a single Supabase call ────────────────
    patients = db.fetch_patients_by_ids(patient_ids)
    if not patients:
        return _empty_result(worker_id)

    scored = []

    for p in patients:
        patient_id = p.get("id")

        # ── Per-patient data ────────────────────────────────────────────────
        adherence_rate  = float(p.get("adherence_rate") or 100.0)
        last_visit_str  = p.get("last_visit_date")
        days_overdue    = _days_since(last_visit_str)

        # Latest AI consultation risk level
        ai_risk_level   = db.fetch_latest_consultation_risk(patient_id)
        symptom_sev     = _RISK_LEVEL_TO_SEVERITY.get(ai_risk_level, 3.0)

        # Latest vitals for risk computing
        recent_vitals   = db.fetch_recent_vitals(patient_id, limit=1)
        latest_v        = recent_vitals[0] if recent_vitals else {}

        # Compute current risk score from all data
        risk_result = compute_risk_score(
            age               = int(p.get("age") or 0),
            chronic_diseases  = p.get("chronic_diseases") or [],
            sys_bp            = latest_v.get("systolic_bp"),
            dia_bp            = latest_v.get("diastolic_bp"),
            spo2              = latest_v.get("spo2"),
            temperature       = latest_v.get("temperature"),
            heart_rate        = latest_v.get("heart_rate"),
            adherence_rate    = adherence_rate,
        )

        risk_score = risk_result.score

        # ── Weighted scoring formula ─────────────────────────────────────────
        overdue_score  = min(days_overdue, MAX_OVERDUE_DAYS_SCORE)   # cap contribution
        adherence_gap  = max(100.0 - adherence_rate, 0.0)             # 0–100

        age_factor = 5.0 if int(p.get("age") or 0) > 60 else 0.0

        priority_score = (
            risk_score    * PRIO_WEIGHTS.RISK_SCORE    +
            overdue_score * PRIO_WEIGHTS.DAYS_OVERDUE  +
            adherence_gap * PRIO_WEIGHTS.ADHERENCE     +
            symptom_sev   * PRIO_WEIGHTS.SYMPTOM_SEV   +
            age_factor    * PRIO_WEIGHTS.AGE_FACTOR
        )

        reason = _build_reason(risk_score, days_overdue, adherence_rate, ai_risk_level)

        # Always use freshly computed risk level for consistency
        display_risk_level = risk_result.level

        scored.append({
            "patient_id":    str(patient_id),
            "name":          p.get("name", "Unknown"),
            "phone":         p.get("phone"),
            "village":       p.get("village"),
            "priority_score": round(priority_score, 1),
            "risk_level":    display_risk_level,
            "reason":        reason,
            "days_overdue":  days_overdue if days_overdue < 999 else 0,
            "adherence_rate": round(adherence_rate, 1),
            "age":           int(p.get("age") or 0),
            "emergency_flag": bool(p.get("emergency_flag", False)),
        })

    # Sort descending — highest priority first
    scored.sort(key=lambda x: x["priority_score"], reverse=True)

    # Attach visit order numbers (1, 2, 3…)
    for idx, item in enumerate(scored, start=1):
        item["visit_order"] = idx

    return {
        "success":          True,
        "worker_id":        worker_id,
        "total_patients":   len(scored),
        "generated_at":     datetime.utcnow().isoformat() + "Z",
        "prioritized_list": scored,
    }


def _empty_result(worker_id: str) -> dict:
    return {
        "success":          True,
        "worker_id":        worker_id,
        "total_patients":   0,
        "generated_at":     datetime.utcnow().isoformat() + "Z",
        "prioritized_list": [],
        "message":          "No patients assigned to this worker",
    }
