# admin_backend/config.py
# ─────────────────────────────────────────────────────────────────────────────
# Central configuration for the Admin Backend
# All secrets, thresholds, constants live here
# ─────────────────────────────────────────────────────────────────────────────

from dataclasses import dataclass

# ─── Supabase ─────────────────────────────────────────────────────────────────
# Same Supabase project already used by the User app
SUPABASE_URL     = "https://kjtxdsgvsmaatxvjyjiy.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_0Ll21kpoogWZshjctcsetg_0ZTLCCdB"

# ─── Server ───────────────────────────────────────────────────────────────────
ADMIN_API_HOST = "0.0.0.0"
ADMIN_API_PORT = 8000

# ─── Tables (Supabase) ────────────────────────────────────────────────────────
TABLE_USERS              = "users"           # Existing — patients
TABLE_AI_CONSULTATIONS   = "ai_consultations" # Existing — AI chat records from User app
TABLE_USER_AI_SUMMARIES  = "user_ai_summaries"# Existing — AI session summaries
TABLE_VITALS             = "vitals"           # New — vitals recorded by field workers
TABLE_PRESCRIPTIONS      = "prescriptions"    # New — prescriptions written by workers
TABLE_VISIT_RECORDS      = "visit_records"    # New — worker visit logs
TABLE_WORKER_ASSIGNMENTS = "worker_assignments" # New — worker ↔ patient mapping
TABLE_WORKERS            = "worker"           # New — ASHA worker login credentials

# ─── Vital Threshold Definitions ─────────────────────────────────────────────
# If any reading crosses these limits, the patient is flagged as an emergency
@dataclass(frozen=True)
class VitalThresholds:
    # Blood Pressure (mmHg)
    SYSTOLIC_CRITICAL_HIGH  : int   = 180    # Hypertensive crisis
    SYSTOLIC_HIGH           : int   = 160    # Stage 2 hypertension
    SYSTOLIC_LOW            : int   = 90     # Hypotension
    DIASTOLIC_CRITICAL_HIGH : int   = 120
    DIASTOLIC_HIGH          : int   = 100

    # SpO2 (%)
    SPO2_CRITICAL           : float = 90.0   # Severe hypoxia → emergency
    SPO2_LOW                : float = 94.0   # Monitor closely

    # Temperature (°C)
    TEMP_HIGH_FEVER         : float = 40.0   # Hyperpyrexia
    TEMP_FEVER              : float = 38.5   # Fever
    TEMP_HYPOTHERMIA        : float = 35.0   # Hypothermia

    # Heart Rate (bpm)
    HR_TACHYCARDIA          : int   = 120
    HR_BRADYCARDIA          : int   = 50

THRESHOLDS = VitalThresholds()

# ─── AI Prioritization Weights ────────────────────────────────────────────────
@dataclass(frozen=True)
class PrioritizationWeights:
    RISK_SCORE    : float = 0.40   # Current computed risk score dominates
    DAYS_OVERDUE  : float = 0.30   # Days since last worker visit
    ADHERENCE     : float = 0.15   # Medicine adherence (lower = higher priority)
    SYMPTOM_SEV   : float = 0.10   # Severity of most recent reported symptoms
    AGE_FACTOR    : float = 0.05   # Elderly bias

PRIO_WEIGHTS = PrioritizationWeights()

# How many days max to count for the overdue score (prevents outlier dominance)
MAX_OVERDUE_DAYS_SCORE = 30

# ─── Risk Score Thresholds (for level classification) ─────────────────────────
RISK_LEVEL_RED    = 70   # score >= 70  → red (high)
RISK_LEVEL_YELLOW = 40   # score >= 40  → yellow (medium)
# score < 40 → green (low)
