# admin_backend/core/emergency_detector.py
# ─────────────────────────────────────────────────────────────────────────────
# Emergency Detection Engine
#
# Runs immediately after a worker records vitals.
# Compares each reading to the defined thresholds and returns:
#   • is_critical    — any single reading crosses a critical limit
#   • breach_details — list of human-readable descriptions of every breach
#
# Keeping this in its own module means the threshold logic can be updated
# independently of the route handlers.
# ─────────────────────────────────────────────────────────────────────────────

from dataclasses import dataclass, field
from config import THRESHOLDS


@dataclass
class EmergencyResult:
    is_critical:    bool             = False
    breach_details: list[str]        = field(default_factory=list)


def check_vitals_for_emergency(
    sys_bp:      int | None   = None,
    dia_bp:      int | None   = None,
    spo2:        float | None = None,
    temperature: float | None = None,
    heart_rate:  int | None   = None,
) -> EmergencyResult:
    """
    Evaluate a set of vitals readings against emergency thresholds.

    Returns an EmergencyResult with:
      is_critical    = True  if ANY reading crosses a critical limit
      breach_details = list of human-readable breach descriptions
    """
    result = EmergencyResult()

    # ── Blood Pressure ─────────────────────────────────────────────────────
    if sys_bp is not None:
        if sys_bp >= THRESHOLDS.SYSTOLIC_CRITICAL_HIGH:
            result.is_critical = True
            result.breach_details.append(
                f"Systolic BP {sys_bp} mmHg ≥ {THRESHOLDS.SYSTOLIC_CRITICAL_HIGH} "
                f"(Hypertensive Crisis — refer immediately)"
            )
        elif sys_bp >= THRESHOLDS.SYSTOLIC_HIGH:
            result.breach_details.append(
                f"Systolic BP {sys_bp} mmHg ≥ {THRESHOLDS.SYSTOLIC_HIGH} "
                f"(Stage 2 Hypertension — monitor closely)"
            )
        elif sys_bp <= THRESHOLDS.SYSTOLIC_LOW:
            result.is_critical = True
            result.breach_details.append(
                f"Systolic BP {sys_bp} mmHg ≤ {THRESHOLDS.SYSTOLIC_LOW} "
                f"(Hypotension — risk of shock)"
            )

    if dia_bp is not None and dia_bp >= THRESHOLDS.DIASTOLIC_CRITICAL_HIGH:
        result.is_critical = True
        result.breach_details.append(
            f"Diastolic BP {dia_bp} mmHg ≥ {THRESHOLDS.DIASTOLIC_CRITICAL_HIGH} "
            f"(Hypertensive Crisis)"
        )

    # ── SpO2 ──────────────────────────────────────────────────────────────
    if spo2 is not None:
        if spo2 <= THRESHOLDS.SPO2_CRITICAL:
            result.is_critical = True
            result.breach_details.append(
                f"SpO2 {spo2}% ≤ {THRESHOLDS.SPO2_CRITICAL}% "
                f"(Severe Hypoxia — oxygen needed urgently)"
            )
        elif spo2 <= THRESHOLDS.SPO2_LOW:
            result.breach_details.append(
                f"SpO2 {spo2}% ≤ {THRESHOLDS.SPO2_LOW}% "
                f"(Low Oxygen — monitor and assess)"
            )

    # ── Temperature ───────────────────────────────────────────────────────
    if temperature is not None:
        if temperature >= THRESHOLDS.TEMP_HIGH_FEVER:
            result.is_critical = True
            result.breach_details.append(
                f"Temperature {temperature}°C ≥ {THRESHOLDS.TEMP_HIGH_FEVER}°C "
                f"(Hyperpyrexia — risk of febrile seizure)"
            )
        elif temperature >= THRESHOLDS.TEMP_FEVER:
            result.breach_details.append(
                f"Temperature {temperature}°C ≥ {THRESHOLDS.TEMP_FEVER}°C (Fever)"
            )
        elif temperature <= THRESHOLDS.TEMP_HYPOTHERMIA:
            result.is_critical = True
            result.breach_details.append(
                f"Temperature {temperature}°C ≤ {THRESHOLDS.TEMP_HYPOTHERMIA}°C "
                f"(Hypothermia — warm patient and refer)"
            )

    # ── Heart Rate ────────────────────────────────────────────────────────
    if heart_rate is not None:
        if heart_rate >= THRESHOLDS.HR_TACHYCARDIA:
            result.breach_details.append(
                f"Heart rate {heart_rate} bpm ≥ {THRESHOLDS.HR_TACHYCARDIA} bpm (Tachycardia)"
            )
        elif heart_rate <= THRESHOLDS.HR_BRADYCARDIA:
            result.is_critical = True
            result.breach_details.append(
                f"Heart rate {heart_rate} bpm ≤ {THRESHOLDS.HR_BRADYCARDIA} bpm "
                f"(Bradycardia — risk of cardiac arrest)"
            )

    return result
