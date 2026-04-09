# admin_backend/core/risk_scoring.py
# ─────────────────────────────────────────────────────────────────────────────
# Rule-based Risk Scoring Engine  (0 – 100)
#
# Used by:
#   • Patient prioritization agent  — to rank who to visit first
#   • Vitals recording              — to compute & persist updated risk score
#
# Design goals:
#   • Fully deterministic and explainable (no black-box ML)
#   • Works offline — no external API calls
#   • Output is (score, level, list-of-reasons) so the UI can explain to workers
# ─────────────────────────────────────────────────────────────────────────────

from dataclasses import dataclass
from config import THRESHOLDS, RISK_LEVEL_RED, RISK_LEVEL_YELLOW


@dataclass
class RiskResult:
    score:        float       # 0 – 100
    level:        str         # 'green' | 'yellow' | 'red'
    risk_factors: list[str]   # Human-readable reasons


def compute_risk_score(
    age:               int            = 0,
    chronic_diseases:  list[str]      = None,
    sys_bp:            int | None     = None,
    dia_bp:            int | None     = None,
    spo2:              float | None   = None,
    temperature:       float | None   = None,
    heart_rate:        int | None     = None,
    adherence_rate:    float          = 100.0,   # 0–100 %
    missed_followups:  int            = 0,
    recent_symptoms:   list[str]      = None,
) -> RiskResult:
    """
    Compute a patient's risk score from all available data.

    Score composition
    ─────────────────
    Age-based risk        →  up to 20 pts
    Chronic disease risk  →  up to 25 pts
    Vital breaches        →  up to 35 pts
    Adherence penalty     →  up to 10 pts
    Missed follow-ups     →  up to 10 pts
    Symptom severity      →  variable (capped at 20 pts)

    Total capped at 100.
    """

    chronic_diseases = chronic_diseases or []
    recent_symptoms  = recent_symptoms  or []
    score            = 0.0
    reasons: list[str] = []

    # ── 1. Age ─────────────────────────────────────────────────────────────
    if age > 70:
        score += 20
        reasons.append(f"Age {age} — elderly patient")
    elif age > 60:
        score += 15
        reasons.append(f"Age {age} — senior patient")
    elif age < 5:
        score += 10
        reasons.append("Age < 5 — infant/young child")

    # ── 2. Chronic Diseases ────────────────────────────────────────────────
    disease_weights = {
        "Diabetes":      12,
        "Hypertension":  10,
        "Asthma":         8,
        "Cardiac":       15,
        "COPD":          12,
        "CKD":           14,
        "Tuberculosis":  14,
        "Cancer":        20,
    }
    for disease in chronic_diseases:
        weight = disease_weights.get(disease, 5)
        score += weight
        reasons.append(f"Chronic: {disease} (+{weight})")

    # ── 3. Vital Threshold Breaches ────────────────────────────────────────
    if sys_bp is not None:
        if sys_bp >= THRESHOLDS.SYSTOLIC_CRITICAL_HIGH:
            score += 25
            reasons.append(f"Critical BP — {sys_bp}/{dia_bp} mmHg (Hypertensive crisis)")
        elif sys_bp >= THRESHOLDS.SYSTOLIC_HIGH:
            score += 18
            reasons.append(f"Elevated BP — {sys_bp}/{dia_bp} mmHg")
        elif sys_bp <= THRESHOLDS.SYSTOLIC_LOW:
            score += 15
            reasons.append(f"Low BP — {sys_bp} mmHg (Hypotension)")

    if spo2 is not None:
        if spo2 <= THRESHOLDS.SPO2_CRITICAL:
            score += 25
            reasons.append(f"Critical SpO2 — {spo2}% (Severe hypoxia)")
        elif spo2 <= THRESHOLDS.SPO2_LOW:
            score += 15
            reasons.append(f"Low SpO2 — {spo2}%")

    if temperature is not None:
        if temperature >= THRESHOLDS.TEMP_HIGH_FEVER:
            score += 12
            reasons.append(f"High fever — {temperature}°C")
        elif temperature >= THRESHOLDS.TEMP_FEVER:
            score += 8
            reasons.append(f"Fever — {temperature}°C")
        elif temperature <= THRESHOLDS.TEMP_HYPOTHERMIA:
            score += 10
            reasons.append(f"Hypothermia — {temperature}°C")

    if heart_rate is not None:
        if heart_rate >= THRESHOLDS.HR_TACHYCARDIA:
            score += 10
            reasons.append(f"Tachycardia — {heart_rate} bpm")
        elif heart_rate <= THRESHOLDS.HR_BRADYCARDIA:
            score += 12
            reasons.append(f"Bradycardia — {heart_rate} bpm")

    # ── 4. Adherence Penalty ───────────────────────────────────────────────
    if adherence_rate < 50:
        score += 10
        reasons.append(f"Poor adherence — {adherence_rate:.0f}%")
    elif adherence_rate < 75:
        score += 5
        reasons.append(f"Below-average adherence — {adherence_rate:.0f}%")

    # ── 5. Missed Follow-ups ───────────────────────────────────────────────
    if missed_followups > 3:
        score += 10
        reasons.append(f"Missed {missed_followups} follow-up visits")
    elif missed_followups > 0:
        score += 5
        reasons.append(f"Missed {missed_followups} follow-up(s)")

    # ── 6. Symptom Severity ────────────────────────────────────────────────
    critical_keywords = {"chest pain", "unconscious", "seizure", "severe bleeding", "stroke"}
    moderate_keywords = {"severe", "unbearable", "can't breathe", "paralysis"}

    symptom_pts = 0
    for s in recent_symptoms:
        lower = s.lower()
        if any(kw in lower for kw in critical_keywords):
            symptom_pts = max(symptom_pts, 20)
            reasons.append(f"Critical symptom: {s}")
        elif any(kw in lower for kw in moderate_keywords):
            symptom_pts = max(symptom_pts, 12)
            reasons.append(f"Severe symptom: {s}")
    score += symptom_pts

    # ── Cap & classify ─────────────────────────────────────────────────────
    score = min(round(score, 1), 100.0)
    level = (
        "red"    if score >= RISK_LEVEL_RED    else
        "yellow" if score >= RISK_LEVEL_YELLOW else
        "green"
    )

    return RiskResult(score=score, level=level, risk_factors=reasons)
