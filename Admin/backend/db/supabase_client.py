# admin_backend/db/supabase_client.py
# ─────────────────────────────────────────────────────────────────────────────
# Supabase singleton client
# One client instance shared across the entire backend.
# All raw DB queries live in this file — routes never touch Supabase directly.
# ─────────────────────────────────────────────────────────────────────────────

from supabase import create_client, Client
from config import (
    SUPABASE_URL, SUPABASE_ANON_KEY,
    TABLE_USERS, TABLE_AI_CONSULTATIONS,
    TABLE_VITALS, TABLE_PRESCRIPTIONS,
    TABLE_VISIT_RECORDS, TABLE_WORKER_ASSIGNMENTS, TABLE_ADMINS,
)
from datetime import datetime
import traceback

# ─── Singleton init ───────────────────────────────────────────────────────────
_client: Client = None

def get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    return _client

def test_connection() -> bool:
    try:
        get_client().table(TABLE_USERS).select("id").limit(1).execute()
        return True
    except Exception:
        return False


# ═══════════════════════════════════════════════════════════════════════════════
# PATIENT QUERIES  (reads from the existing `users` table)
# ═══════════════════════════════════════════════════════════════════════════════

def fetch_patient_by_qr(qr_code: str) -> dict | None:
    """Find a patient row by their unique QR code."""
    res = get_client().table(TABLE_USERS)\
        .select("*")\
        .eq("qr_code", qr_code)\
        .limit(1)\
        .execute()
    return res.data[0] if res.data else None


def fetch_patient_by_id(patient_id) -> dict | None:
    res = get_client().table(TABLE_USERS)\
        .select("*")\
        .eq("id", patient_id)\
        .limit(1)\
        .execute()
    return res.data[0] if res.data else None


def fetch_patients_by_ids(patient_ids: list) -> list:
    """Batch fetch multiple patients."""
    if not patient_ids:
        return []
    res = get_client().table(TABLE_USERS)\
        .select("*")\
        .in_("id", patient_ids)\
        .execute()
    return res.data or []


def update_patient_risk(patient_id, risk_score: float, risk_level: str):
    get_client().table(TABLE_USERS).update({
        "current_risk_score": risk_score,
        "risk_level": risk_level,
    }).eq("id", patient_id).execute()


def update_patient_emergency_flag(patient_id, emergency: bool):
    get_client().table(TABLE_USERS).update({
        "emergency_flag": emergency,
        "current_risk_score": 90.0 if emergency else None,
        "risk_level": "red" if emergency else "yellow",
    }).eq("id", patient_id).execute()


def update_patient_post_visit(patient_id, worker_id: str, follow_up_days: int | None = None):
    """Mark the patient as visited: update last_visit_date, last_worker_id, next_visit_days."""
    payload = {
        "last_visit_date": datetime.utcnow().isoformat(),
        "last_worker_id":  str(worker_id),
    }
    if follow_up_days is not None:
        payload["next_visit_days"] = follow_up_days
    get_client().table(TABLE_USERS).update(payload).eq("id", patient_id).execute()


# ═══════════════════════════════════════════════════════════════════════════════
# VITALS QUERIES
# ═══════════════════════════════════════════════════════════════════════════════

def insert_vitals(vitals_row: dict) -> dict:
    res = get_client().table(TABLE_VITALS).insert(vitals_row).execute()
    return res.data[0] if res.data else {}


def fetch_recent_vitals(patient_id, limit: int = 5) -> list:
    res = get_client().table(TABLE_VITALS)\
        .select("*")\
        .eq("patient_id", patient_id)\
        .order("created_at", desc=True)\
        .limit(limit)\
        .execute()
    return res.data or []


# ═══════════════════════════════════════════════════════════════════════════════
# AI CONSULTATIONS  (reads from the existing `ai_consultations` table)
# ═══════════════════════════════════════════════════════════════════════════════

def fetch_recent_consultations(patient_id, limit: int = 5) -> list:
    res = get_client().table(TABLE_AI_CONSULTATIONS)\
        .select("*")\
        .eq("user_id", patient_id)\
        .order("created_at", desc=True)\
        .limit(limit)\
        .execute()
    return res.data or []


def fetch_latest_consultation_risk(patient_id) -> str:
    """Return the risk_level from the users table (ai_consultations uses integer FK, not UUID)."""
    try:
        res = get_client().table(TABLE_USERS)\
            .select("risk_level")\
            .eq("id", patient_id)\
            .limit(1)\
            .execute()
        if res.data:
            return res.data[0].get("risk_level") or "green"
    except Exception:
        pass
    return "green"


def insert_symptom_consultation(record: dict) -> dict:
    """Insert a worker-entered symptom log into ai_consultations."""
    res = get_client().table(TABLE_AI_CONSULTATIONS).insert(record).execute()
    return res.data[0] if res.data else {}


# ═══════════════════════════════════════════════════════════════════════════════
# PRESCRIPTION QUERIES
# ═══════════════════════════════════════════════════════════════════════════════

def insert_prescription(row: dict) -> dict:
    res = get_client().table(TABLE_PRESCRIPTIONS).insert(row).execute()
    return res.data[0] if res.data else {}


def fetch_active_prescriptions(patient_id) -> list:
    res = get_client().table(TABLE_PRESCRIPTIONS)\
        .select("*")\
        .eq("patient_id", patient_id)\
        .eq("status", "active")\
        .execute()
    return res.data or []


# ═══════════════════════════════════════════════════════════════════════════════
# VISIT RECORD QUERIES
# ═══════════════════════════════════════════════════════════════════════════════

def insert_visit_record(row: dict) -> dict:
    res = get_client().table(TABLE_VISIT_RECORDS).insert(row).execute()
    return res.data[0] if res.data else {}


def fetch_visit_history(patient_id, limit: int = 10) -> list:
    res = get_client().table(TABLE_VISIT_RECORDS)\
        .select("*")\
        .eq("patient_id", patient_id)\
        .order("visit_date", desc=True)\
        .limit(limit)\
        .execute()
    return res.data or []


# ═══════════════════════════════════════════════════════════════════════════════
# WORKER ASSIGNMENT QUERIES
# ═══════════════════════════════════════════════════════════════════════════════

def fetch_worker_assignment(worker_id: str) -> dict | None:
    try:
        res = get_client().table(TABLE_WORKER_ASSIGNMENTS)\
            .select("*")\
            .eq("worker_id", worker_id)\
            .limit(1)\
            .execute()
        return res.data[0] if res.data else None
    except Exception:
        return None  # Table may not exist yet — caller will fall back to all patients


def fetch_all_patient_ids() -> list[str]:
    """Return IDs of all patients (used when worker_assignments is not set up)."""
    try:
        res = get_client().table(TABLE_USERS).select("id").execute()
        return [row["id"] for row in (res.data or [])]
    except Exception:
        return []


def update_worker_last_sync(worker_id: str):
    try:
        get_client().table(TABLE_WORKER_ASSIGNMENTS).update({
            "last_sync": datetime.utcnow().isoformat(),
            "status": "active",
        }).eq("worker_id", worker_id).execute()
    except Exception:
        pass  # Table may not exist yet — non-critical


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN (WORKER LOGIN) QUERIES
# ═══════════════════════════════════════════════════════════════════════════════

def fetch_admin_by_phone(phone: str) -> dict | None:
    """Look up an admin/worker by phone for login."""
    # Try multiple phone formats (with/without country code)
    candidates = [phone]
    digits = ''.join(c for c in phone if c.isdigit())
    if len(digits) == 10:
        candidates += [digits, f'91{digits}', f'+91{digits}']
    elif len(digits) > 10:
        candidates += [digits, digits[-10:], f'+{digits}']
    res = get_client().table(TABLE_ADMINS)\
        .select("*")\
        .in_("phone", candidates)\
        .limit(1)\
        .execute()
    return res.data[0] if res.data else None
