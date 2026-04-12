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
# 1. Severity-weighted priority score:
#    emergency and red-risk patients receive a strong base bonus so their
#    displayed score always stays above lower-risk tiers.
# 2. Within the same severity band, use weighted clinical priority:
#       (risk_score     × WEIGHT_RISK)      +  40% — current health danger
#       (days_overdue   × WEIGHT_OVERDUE)   +  30% — how long since last visit
#       (adherence_gap  × WEIGHT_ADHERENCE) +  15% — low adherence = more urgent
#       (symptom_sev    × WEIGHT_SYMPTOM)   +  10% — recent complaint severity
#       (age_factor     × WEIGHT_AGE)           5% — slight elderly bias
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

_RISK_LEVEL_SORT_ORDER = {
    "green":  0,
    "yellow": 1,
    "red":    2,
}

_SEVERITY_BASE_SCORE = {
    "green":  15.0,
    "yellow": 45.0,
    "red":    75.0,
}

_EMERGENCY_BASE_SCORE = 90.0
_DETAIL_SCORE_SCALE = 0.20


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
    risk_score:       float,
    days_overdue:     int,
    adherence:        float,
    symptom_risk_tag: str,
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
    if symptom_risk_tag == "red":
        parts.append("Red clinical flag")
    return " · ".join(parts) if parts else "Routine checkup"


def _sort_key(item: dict) -> tuple:
    """Sort by final priority score and use severity as deterministic tie-breakers."""
    return (
        item["priority_score"],
        1 if item["emergency_flag"] else 0,
        _RISK_LEVEL_SORT_ORDER.get(item["risk_level"], 0),
    )


def _compute_priority_score(
    risk_score: float,
    overdue_score: int,
    adherence_gap: float,
    symptom_sev: float,
    age_factor: float,
    risk_level: str,
    emergency_flag: bool,
) -> float:
    """Return a displayable score whose ordering matches the visit order."""
    detail_score = (
        risk_score    * PRIO_WEIGHTS.RISK_SCORE    +
        overdue_score * PRIO_WEIGHTS.DAYS_OVERDUE  +
        adherence_gap * PRIO_WEIGHTS.ADHERENCE     +
        symptom_sev   * PRIO_WEIGHTS.SYMPTOM_SEV   +
        age_factor    * PRIO_WEIGHTS.AGE_FACTOR
    )

    severity_base = _EMERGENCY_BASE_SCORE if emergency_flag else _SEVERITY_BASE_SCORE.get(risk_level, 15.0)
    final_score = severity_base + (detail_score * _DETAIL_SCORE_SCALE)
    return round(min(final_score, 100.0), 1)


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

    # ── Batch fetch everything in 2 Supabase calls (avoids N+1 slowness) ──
    patients = db.fetch_patients_by_ids(patient_ids)
    if not patients:
        return _empty_result(worker_id)

    all_ids = [p["id"] for p in patients]
    latest_vitals_map = db.fetch_latest_vitals_for_patients(all_ids)  # { patient_id -> row }

    # risk_level already sits on the users row — no extra query needed per patient
    _NORMALISE = {
        "low": "green", "moderate": "yellow", "medium": "yellow",
        "high": "red", "critical": "red",
        "green": "green", "yellow": "yellow", "red": "red",
    }

    scored = []

    for p in patients:
        patient_id = p.get("id")

        adherence_rate = float(p.get("adherence_rate") or 100.0)
        last_visit_str = p.get("last_visit_date")
        days_overdue   = _days_since(last_visit_str)

        # Risk tag from users row — already normalised
        raw_risk = (p.get("risk_level") or "").strip().lower()
        symptom_risk_tag = _NORMALISE.get(raw_risk, "green")
        symptom_sev      = _RISK_LEVEL_TO_SEVERITY.get(symptom_risk_tag, 3.0)

        # Latest vitals from batch map
        latest_v = latest_vitals_map.get(str(patient_id)) or {}

        risk_result = compute_risk_score(
            age              = int(p.get("age") or 0),
            chronic_diseases = p.get("chronic_diseases") or [],
            sys_bp           = latest_v.get("systolic_bp"),
            dia_bp           = latest_v.get("diastolic_bp"),
            spo2             = latest_v.get("spo2"),
            temperature      = latest_v.get("temperature"),
            heart_rate       = latest_v.get("heart_rate"),
            adherence_rate   = adherence_rate,
        )

        risk_score     = risk_result.score
        overdue_score  = min(days_overdue, MAX_OVERDUE_DAYS_SCORE)
        adherence_gap  = max(100.0 - adherence_rate, 0.0)
        age_factor     = 5.0 if int(p.get("age") or 0) > 60 else 0.0

        display_risk_level = risk_result.level
        emergency_flag     = bool(p.get("emergency_flag", False))

        priority_score = _compute_priority_score(
            risk_score=risk_score,
            overdue_score=overdue_score,
            adherence_gap=adherence_gap,
            symptom_sev=symptom_sev,
            age_factor=age_factor,
            risk_level=display_risk_level,
            emergency_flag=emergency_flag,
        )

        reason = _build_reason(risk_score, days_overdue, adherence_rate, symptom_risk_tag)

        scored.append({
            "patient_id":     str(patient_id),
            "name":           p.get("name", "Unknown"),
            "phone":          p.get("phone"),
            "village":        p.get("village"),
            "priority_score": priority_score,
            "risk_level":     display_risk_level,
            "reason":         reason,
            "days_overdue":   days_overdue,
            "adherence_rate": round(adherence_rate, 1),
            "age":            int(p.get("age") or 0),
            "emergency_flag": emergency_flag,
        })

    # Sort descending — displayed score now already includes severity weighting
    scored.sort(key=_sort_key, reverse=True)

    # Attach visit order numbers (1, 2, 3…)
    for idx, item in enumerate(scored, start=1):
        item["visit_order"] = idx

    return {
        "success":          True,
        "worker_id":        worker_id,
        "total_patients":   len(scored),
        "generated_at":     datetime.now(timezone.utc).isoformat(),
        "prioritized_list": scored,
    }


def _empty_result(worker_id: str) -> dict:
    return {
        "success":          True,
        "worker_id":        worker_id,
        "total_patients":   0,
        "generated_at":     datetime.now(timezone.utc).isoformat(),
        "prioritized_list": [],
        "message":          "No patients assigned to this worker",
    }
