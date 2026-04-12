# Healorithm Admin Backend — AI Agents Documentation

## Overview

The Healorithm Admin Backend uses multiple **AI agents** to intelligently manage patient workflows for ASHA field workers. These agents work together to:

1. **Prioritize** patient visits based on clinical urgency and adherence patterns
2. **Score** patient risk levels using real-time vital signs and medical history
3. **Detect** emergency conditions automatically
4. **Recommend** visit order to field workers based on AI-driven analysis

---

## 🤖 Architecture

```
Mobile App (Field Worker)
         ↓
    FastAPI Backend (Port 8000)
         ↓
    ┌────────────────────────────────────────┐
    │      AI Agent Pipeline                 │
    ├────────────────────────────────────────┤
    │  1. Emergency Detection Agent          │
    │  2. Risk Scoring Agent                 │
    │  3. Patient Prioritization Agent       │
    └────────────────────────────────────────┘
         ↓
    Supabase Database
         ├─ Users (patients)
         ├─ Vitals (readings)
         ├─ AI Consultations (symptoms)
         └─ Worker Assignments
```

---

## 1️⃣ Emergency Detection Agent

**Purpose:** Detect life-threatening conditions from vital signs in real-time

**Location:** `backend/core/emergency_detector.py`

**Algorithm:**

The agent monitors **5 vital parameters** and flags emergencies based on critical thresholds:

```python
CRITICAL THRESHOLDS:
- Systolic BP ≥ 180 mmHg       → Hypertensive Crisis
- Diastolic BP ≥ 120 mmHg      → Hypertensive Crisis
- SpO2 < 90%                   → Severe Hypoxia
- Temperature ≥ 40°C           → Hyperpyrexia (fever)
- Heart Rate > 120 bpm         → Tachycardia
- Heart Rate < 50 bpm          → Bradycardia
```

**Inputs:**
- Patient vitals (BP, SpO2, Temperature, Heart Rate)
- Chronic disease history
- Recent symptoms

**Outputs:**
```json
{
  "is_emergency": true,
  "emergency_flags": ["Hypertensive Crisis", "Critical SpO2"],
  "risk_level": "red",
  "severity_score": 95.0
}
```

**When Used:**
- Every time a field worker records vitals
- Automatically triggers urgent notifications to supervisors
- Marks patient as `emergency_flag = true` in database

---

## 2️⃣ Risk Scoring Agent

**Purpose:** Compute a holistic **risk score** (0-100) for each patient

**Location:** `backend/core/risk_scoring.py`

**Algorithm:**

Uses weighted formula combining **6 clinical factors**:

```
Risk Score = (
    Vitals Severity      × 30% +
    Chronic Disease Load × 25% +
    Adherence Gap        × 20% +
    Age Factor           × 15% +
    Symptom History      × 10%
)

Formula Details:
─────────────────────────────────────

1. VITALS SEVERITY (30%)
   - BP: Distance from normal (120/80)
   - SpO2: Deviation from 95-100%
   - Temperature: Deviation from 37°C
   - Heart Rate: Deviation from 60-100 bpm
   - Score: 0-40 points

2. CHRONIC DISEASE LOAD (25%)
   - No diseases: 0 points
   - 1 disease: 8 points
   - 2 diseases: 20 points
   - 3+ diseases: 35 points
   
   Weighted by severity:
   - Hypertension: 1.2x weight
   - Diabetes: 1.1x weight
   - Asthma: 0.9x weight

3. ADHERENCE GAP (20%)
   - Adherence Rate: 95% = 0 points
   - Adherence Rate: 50% = 15 points
   - Adherence Rate: 0% = 25 points

4. AGE FACTOR (15%)
   - Age < 30: 0 points
   - Age 30-60: 5 points
   - Age > 60: 15 points

5. SYMPTOM HISTORY (10%)
   - Recent severe symptoms: 8 points
   - Moderate symptoms: 5 points
   - Mild symptoms: 2 points
```

**Risk Level Classification:**

```
Score 0-35   → GREEN (Low Risk)
             → Routine checkup needed
             → Follow-up in 30 days

Score 36-69  → YELLOW (Medium Risk)
             → Monitor closely
             → Follow-up in 14 days

Score 70+    → RED (High Risk)
             → Urgent intervention
             → Follow-up in 7 days
```

**Example Calculation:**

```
Patient: Utkarsh (62-year-old with Hypertension & Diabetes)

Vitals Today:
- BP: 165/105 (elevated)
- SpO2: 94% (low)
- HR: 95 bpm (normal)
- Temp: 37.2°C (normal)

Calculation:
─────────────
Vitals Severity        = 28 × 0.30 = 8.4
Chronic Diseases       = 20 × 0.25 = 5.0
Adherence Gap (42%)    = 18 × 0.20 = 3.6
Age Factor (62 years)  = 15 × 0.15 = 2.25
Symptom History        = 5  × 0.10 = 0.5
─────────────────────────────────
TOTAL RISK SCORE       = 19.75 → GREEN

But with emergency flag:
If BP was 185/125 → SCORE = 92 → RED + EMERGENCY
```

**Inputs:**
- Age, gender, chronic diseases
- Current vitals
- Adherence rate (from prescription history)
- Recent consultation notes

**Outputs:**
```json
{
  "score": 75.3,
  "level": "red",
  "factors": {
    "vitals_severity": 32,
    "chronic_disease_load": 20,
    "adherence_gap": 15,
    "age_factor": 8,
    "symptom_history": 5
  }
}
```

**When Used:**
- When field worker records vitals
- Updated overtime as new data arrives
- Used by Prioritization Agent for ranking

---

## 3️⃣ Patient Prioritization Agent

**Purpose:** **AI-rank patients** to show field workers who to visit FIRST

**Location:** `backend/core/patient_prioritization.py`

**Algorithm:**

Combines risk scoring + adherence patterns + temporal urgency into a **visit priority list**

```
Priority Score = (
    Severity Base Score           +
    (Risk Score × 40%)            +
    (Days Overdue × 30%)          +
    (Adherence Gap × 15%)         +
    (Symptom Severity × 10%)      +
    (Age Factor × 5%)
) × Severity Multiplier
```

**Severity Base Scores:**

```
GREEN patients:    15.0 base
YELLOW patients:   45.0 base
RED patients:      75.0 base
EMERGENCY patients: 90.0 base

Example:
─────────
RED patient with high adherence gap:
75.0 + (75×0.4) + (10×0.3) + (40×0.15) + (5×0.1) + (5×0.05)
= 75 + 30 + 3 + 6 + 0.5 + 0.25
= 114.75 → Display as 100.0 (capped)
```

**Final Ranking Logic:**

```
1. Sort by Priority Score (highest first)
2. Within same score band, use:
   - Is Emergency? (Yes = higher)
   - Risk Level (Red > Yellow > Green)
   - Days Overdue (more overdue = higher priority)

Result: Prioritized list with visit order #1, #2, #3…
```

**Example Output:**

```json
{
  "worker_id": "2b4085d2-4c8a-4a3d-94d7-cf315afaf51f",
  "total_patients": 4,
  "prioritized_list": [
    {
      "visit_order": 1,
      "patient_id": "98967108-4ebe-4897-a936-11226b093f57",
      "name": "Akshat Sabnis",
      "priority_score": 100.0,
      "risk_level": "red",
      "reason": "High risk (100) · 13d overdue · Low adherence (35%) · Red clinical flag",
      "days_overdue": 13,
      "adherence_rate": 35.0,
      "age": 20,
      "emergency_flag": true
    },
    {
      "visit_order": 2,
      "patient_id": "87cb4f7a-00fe-4ba6-8190-1f33d8250a78",
      "name": "Indresh Suresh",
      "priority_score": 83.4,
      "risk_level": "red",
      "reason": "High risk (75) · 17d overdue · Red clinical flag",
      "days_overdue": 17,
      "adherence_rate": 62.0,
      "age": 54,
      "emergency_flag": false
    }
  ]
}
```

**Inputs Required:**
- All assigned patients for the worker
- Patient demographics (age, chronic diseases)
- Latest vitals reading
- Adherence rate (% of prescribed medicines taken)
- Last visit date
- Recent AI consultation risk level

**Outputs:**
- Numbered list showing visit priority
- Risk level and score for each patient
- Human-readable reason for ranking
- Emergency flags

**When Called:**
- Every time field worker opens "Patients" tab
- Can be manually refreshed
- Backend recalculates every 30 seconds for online workers

---

## 🔄 Data Flow Example

**Scenario:** Field worker logs in and opens Patients tab

```
1. APP REQUEST
   GET /api/admin/patient/prioritized-list/{worker_id}
        ↓
2. BACKEND FETCHES DATA
   - Load worker's assigned patients from worker_assignments table
   - For each patient:
     a) Fetch latest vitals
     b) Fetch chronic diseases
     c) Fetch adherence rate
     d) Calculate days since last visit
        ↓
3. EMERGENCY DETECTION AGENT
   - Check each patient's vitals against critical thresholds
   - Mark emergency_flag if any critical reading
        ↓
4. RISK SCORING AGENT
   - Calculate risk score (0-100) for each patient
   - Classify as GREEN / YELLOW / RED
        ↓
5. PRIORITIZATION AGENT
   - Build priority matrix using scores + adherence + recency
   - Sort patients by priority score
   - Assign visit_order: 1, 2, 3…
   - Generate human-readable reason strings
        ↓
6. RESPONSE TO APP
   {
     "success": true,
     "prioritized_list": [
       { "visit_order": 1, "name": "Urgent Patient", … },
       { "visit_order": 2, "name": "Follow-up Patient", … }
     ]
   }
   ↓
7. APP DISPLAYS
   - Shows prioritized list in horizontal scroll
   - Green dot = online, Red dot = offline
   - Worker sees #1 patient first
```

---

## 📊 Configuration & Weights

**Edit these in:** `backend/config.py`

```python
# Prioritization weights (sum = 1.0)
PRIO_WEIGHTS = {
    'RISK_SCORE': 0.40,      # Current health danger
    'DAYS_OVERDUE': 0.30,    # How long since last visit
    'ADHERENCE': 0.15,       # Medicine adherence gap
    'SYMPTOM_SEV': 0.10,     # Recent symptom severity
    'AGE_FACTOR': 0.05       # Elderly bias
}

# Risk thresholds
RISK_LEVEL_RED = 70      # score >= 70 → RED
RISK_LEVEL_YELLOW = 40   # score >= 40 → YELLOW

# Max days to count for overdue scoring
MAX_OVERDUE_DAYS = 30    # Cap at 30 days (prevents outlier dominance)

# Vital sign thresholds
THRESHOLDS = {
    'SYSTOLIC_CRITICAL': 180,    # Emergency border
    'SYSTOLIC_HIGH': 160,        # Stage 2 hypertension
    'SPO2_CRITICAL': 90.0,       # Severe hypoxia
    'TEMP_FEVER': 38.5,          # Fever threshold
    'HR_TACHYCARDIA': 120
}
```

---

## 🧠 AI Decision Logic Example

**Patient: Divya (19 years old, slight hypertension history)**

```
Data:
├─ Latest Vitals: BP 140/90, SpO2 97%, HR 82, Temp 36.8
├─ Chronic Diseases: None
├─ Adherence Rate: 74%
├─ Last Visit: 10 days ago
├─ Recent Symptoms: None
└─ Emergency Flag: False

AGENT 1: Emergency Detection
─────────────────────────────
✓ BP 140/90 < 180/120 (not critical)
✓ SpO2 97% > 90% (good)
✓ HR 82 is normal
✓ Temp 36.8°C is normal
Result: NOT AN EMERGENCY

AGENT 2: Risk Scoring
──────────────────────
Vitals Severity = 18 × 0.30 = 5.4
Chronic Diseases = 0 × 0.25 = 0
Adherence Gap = 26 × 0.20 = 5.2
Age Factor (19) = 0 × 0.15 = 0
Symptom History = 0 × 0.10 = 0
────────────────────────────────
RISK SCORE = 10.6 → GREEN

AGENT 3: Prioritization
────────────────────────
Base Score (GREEN) = 15.0
Detail Score = (10.6×0.4) + (10×0.3) + (26×0.15) + (0×0.1) + (0×0.05)
            = 4.24 + 3 + 3.9 + 0 + 0 = 11.14
Final = 15.0 + (11.14 × 0.20) = 17.2

PRIORITY RANKING: #4 (Low priority - routine checkup)
REASON: "Routine checkup"

Decision: Show patient as last in visit list (green badge)
```

---

## 🚨 Emergency Example

**Patient: Utkarsh (62 years old, hypertension + diabetes)**

```
Data:
├─ Latest Vitals: BP 185/125, SpO2 88%, HR 110, Temp 38.2
├─ Chronic Diseases: [Hypertension, Diabetes]
├─ Adherence Rate: 42%
├─ Last Visit: 18 days ago
├─ Recent Symptoms: Headache (severe rating)
└─ Emergency Flag: Already set

AGENT 1: Emergency Detection
────────────────────────────
✗ BP 185/125 >= 180/120 → HYPERTENSIVE CRISIS
✗ SpO2 88% < 90% → SEVERE HYPOXIA
✗ HR 110 > 100 (borderline)
✓ Temp 38.2°C is elevated but < 40

Result: IS AN EMERGENCY
Flags: ["Hypertensive Crisis", "Severe Hypoxia"]

AGENT 2: Risk Scoring
──────────────────────
Vitals Severity = 39 × 0.30 = 11.7
Chronic Diseases = 20 × 0.25 = 5.0
Adherence Gap = 58 × 0.20 = 11.6
Age Factor (62) = 15 × 0.15 = 2.25
Symptom History = 8 × 0.10 = 0.8
────────────────────────────────
RISK SCORE = 31.35 → YELLOW (but will be RED due to emergency)

AGENT 3: Prioritization
────────────────────────
Base Score (EMERGENCY) = 90.0
Detail Score = 31.35 × 0.20 = 6.27
Final = 90.0 + 6.27 = 96.27 → Display as 100.0

PRIORITY RANKING: #1 (TOP PRIORITY - VISIT FIRST)
REASON: "High risk (100) · 18d overdue · Low adherence (42%) · Red clinical flag"

Decision: Show patient as FIRST in visit list (🚨 emergency badge)
System Action: Notify supervisor immediately
```

---

## 🔧 Extending the Agents

To add new factors to prioritization:

**File:** `backend/core/patient_prioritization.py`

```python
# Add new weight in config.py
PRIO_WEIGHTS.NEW_FACTOR = 0.05

# Update _compute_priority_score() function
new_factor_score = 10.0  # Your calculation

final_score = (
    risk_score * PRIO_WEIGHTS.RISK_SCORE +
    overdue_score * PRIO_WEIGHTS.DAYS_OVERDUE +
    adherence_gap * PRIO_WEIGHTS.ADHERENCE +
    symptom_sev * PRIO_WEIGHTS.SYMPTOM_SEV +
    age_factor * PRIO_WEIGHTS.AGE_FACTOR +
    new_factor_score * PRIO_WEIGHTS.NEW_FACTOR  # ADD HERE
)
```

---

## 📈 Monitoring & Debugging

**Check agent output via debug endpoint:**

```bash
curl http://localhost:8000/api/admin/debug/status
```

**Check worker assignment:**

```bash
curl http://localhost:8000/api/admin/debug/worker/{worker_id}
```

**View logs:**

```bash
# Terminal running backend shows:
2026-04-11 04:27:45  INFO  admin.patient — Prioritization request — worker_id=xxx
2026-04-11 04:27:45  INFO  admin.patient — Worker xxx has 4 assigned patients
```

---

## 📝 Summary

| Agent | Purpose | Input | Output | Threshold |
|-------|---------|-------|--------|-----------|
| **Emergency Detection** | Detect life-threatening conditions | Vitals | emergency_flag | Critical (180/120 BP, <90% SpO2) |
| **Risk Scoring** | Compute holistic risk (0-100) | Demographics + Vitals + History | risk_score + risk_level | RED: 70+, YELLOW: 40-69, GREEN: <40 |
| **Prioritization** | Rank patients for visit order | Risk + Adherence + Recency | visit_order + priority_score | Higher score = visit sooner |

---

**Backend is now ready for field workers!** 🎯
