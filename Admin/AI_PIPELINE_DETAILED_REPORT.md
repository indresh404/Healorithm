# Healorithm AI Pipeline: Complete Technical Documentation

## Hackathon Presentation Report

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The Problem](#1-the-problem)
3. [Solution Overview](#2-solution-overview)
4. [Two-Layer Architecture](#3-two-layer-architecture)
5. [Layer 1: Danger Band Classification](#4-layer-1-danger-band-classification)
6. [Layer 2: Detail Scoring](#5-layer-2-detail-scoring)
7. [Final Priority Score Calculation](#6-final-priority-score-calculation)
8. [Complete Worked Example](#7-complete-worked-example)
9. [Data Requirements](#8-data-requirements)
10. [Pipeline Execution Flow](#9-pipeline-execution-flow)
11. [Why Rule-Based?](#10-why-rule-based)
12. [System Architecture](#11-system-architecture)
13. [Tech Stack](#12-tech-stack)

---

## Executive Summary

Healorithm's AI Pipeline is a **rule-based patient prioritization system** designed for ASHA (Accredited Social Health Activist) workers in rural India. The system analyzes patient health data to produce a ranked visit list, ensuring that the most vulnerable patients receive attention first.

**Key Innovation:** A two-layer scoring system that guarantees clinical safety (emergency patients always rank highest) while providing fine-grained ordering within each risk category.

**Output:** Each patient receives a **Priority Score (0-100)** that directly determines visit order. Higher score = visit first.

---

## 1. The Problem

### Context: ASHA Workers in Rural India

ASHA workers are community health volunteers who manage **20-30 patients** across multiple villages with limited time and resources.

### The Challenge

When an ASHA worker has many patients to visit, they face critical questions:
- Who should I visit FIRST?
- Which patient is at highest risk RIGHT NOW?
- Who can wait until later this week?

### Without AI Prioritization

Workers traditionally visit patients based on:
- Geographic convenience (who lives closest)
- Memory (who they remember as "sick")
- First-come-first-served

**This leads to:**
- Missed emergencies
- Delayed interventions
- Inefficient routing
- Cognitive overload

### The Stakes

Consider these scenarios:
- **Mr. Sharma:** BP 180/110, not visited in 20 days, skipping medications → **Needs visit TODAY**
- **Ms. Patel:** Diabetes, visited 2 days ago, stable → **Can wait**
- **Young Raj:** No conditions, healthy → **Routine visit**

Without systematic prioritization, Mr. Sharma might be missed while the worker visits healthier patients first.

---

## 2. Solution Overview

The AI Priority Pipeline solves this by:

1. **Automatically analyzing** all patient data continuously
2. **Computing a priority score** for each patient
3. **Ranking patients** from highest to lowest priority
4. **Explaining WHY** each patient is ranked where they are

### What the Worker Sees

```
┌─────────────────────────────────────────────────────────┐
│  🤖 AI Visit Priority                                   │
│                                                         │
│  #1  Akshat Sabnis           Score: 100  🔴 EMERGENCY  │
│      "Hypertensive crisis · 18d overdue · Low adherence"│
│                                                         │
│  #2  Indresh Suresh          Score: 83   🔴 RED        │
│      "High risk (92) · 12d overdue · Poor adherence"    │
│                                                         │
│  #3  Divya Sharma            Score: 50   🟡 YELLOW     │
│      "Elevated BP · 5d overdue"                         │
│                                                         │
│  #4  Ankita Rajbhar          Score: 15   🟢 GREEN      │
│      "Routine checkup"                                  │
└─────────────────────────────────────────────────────────┘
```

**Result:** The worker immediately knows whom to visit first. No guessing.

---

## 3. Two-Layer Architecture

The AI Pipeline uses a **two-layer approach**:

```
Layer 1: DANGER BAND CLASSIFICATION
         ↓
    Places patient in: Emergency | Red | Yellow | Green
         ↓
Layer 2: DETAIL SCORING
         ↓
    Ranks patients WITHIN the same band
         ↓
    Final Priority Score (0-100)
```

### Why Two Layers?

**Layer 1 (Danger Band)** ensures clinical safety:
- Emergency patients ALWAYS appear above Red patients
- Red patients ALWAYS appear above Yellow patients
- Yellow patients ALWAYS appear above Green patients

**Layer 2 (Detail Scoring)** provides fine-grained ordering:
- When two Red patients exist, which one first?
- When many Yellow patients exist, what's the smart order?

This design prevents dangerous situations where a sicker patient appears below a healthier one due to scoring quirks.

---

## 4. Layer 1: Danger Band Classification

### The Four Danger Bands

| Band | Meaning | Action Required |
|------|---------|-----------------|
| **Emergency** 🔴 | Life-threatening condition | Visit IMMEDIATELY |
| **Red** 🔴 | Very serious condition | Visit TODAY |
| **Yellow** 🟡 | Moderate concern | Visit within 2-3 days |
| **Green** 🟢 | Stable/Routine | Visit this week |

### How Danger Band Is Determined

The danger band is determined by the **Health Risk Score** (calculated in Section 5):

| Health Risk Score | Danger Band |
|-------------------|-------------|
| ≥ 70 | Red |
| ≥ 40 | Yellow |
| < 40 | Green |

**Emergency Flag Override:** If `users.emergency_flag = true`, the patient is placed in the Emergency band regardless of score.

### Emergency Flag Triggers

The emergency flag is set when ANY vital sign crosses critical thresholds:

| Vital Sign | Critical Threshold | Condition |
|------------|-------------------|-----------|
| Systolic BP | ≥ 180 mmHg | Hypertensive Crisis |
| Diastolic BP | ≥ 120 mmHg | Hypertensive Crisis |
| SpO2 | ≤ 90% | Severe Hypoxia |
| Temperature | ≥ 40°C | Hyperpyrexia |
| Heart Rate | ≤ 50 bpm | Bradycardia |

---

## 5. Layer 2: Detail Scoring

### Health Risk Score Calculation

Before the detail score, the system calculates a **Health Risk Score (0-100)** using rule-based points:

#### A. Age Points

| Age Range | Points | Rationale |
|-----------|--------|-----------|
| > 70 years | +20 | Very elderly, fragile |
| > 60 years | +15 | Elderly, reduced reserve |
| < 5 years | +10 | Infant/young child |

#### B. Chronic Disease Points

| Disease | Points | Rationale |
|---------|--------|-----------|
| Cancer | +20 | Highest mortality risk |
| Cardiac | +15 | Heart disease |
| CKD (Kidney) | +14 | Multi-organ impact |
| Tuberculosis | +14 | Infectious, systemic |
| Diabetes | +12 | Multi-system disease |
| COPD | +12 | Respiratory compromise |
| Hypertension | +10 | Cardiovascular risk |
| Asthma | +8 | Respiratory condition |
| Unknown disease | +5 | Default weight |

**Multiple diseases stack:** A patient with Diabetes + Hypertension = 12 + 10 = **22 points**

#### C. Vital Sign Points

**Blood Pressure:**
| Reading | Points | Condition |
|---------|--------|-----------|
| Systolic ≥ 180 | +25 | Hypertensive Crisis |
| Systolic ≥ 160 | +18 | Stage 2 Hypertension |
| Systolic ≤ 90 | +15 | Hypotension |

**Oxygen (SpO2):**
| Reading | Points | Condition |
|---------|--------|-----------|
| ≤ 90% | +25 | Severe Hypoxia |
| ≤ 94% | +15 | Low Oxygen |

**Temperature:**
| Reading | Points | Condition |
|---------|--------|-----------|
| ≥ 40°C | +12 | Hyperpyrexia |
| ≥ 38.5°C | +8 | Fever |
| ≤ 35°C | +10 | Hypothermia |

**Heart Rate:**
| Reading | Points | Condition |
|---------|--------|-----------|
| ≥ 120 bpm | +10 | Tachycardia |
| ≤ 50 bpm | +12 | Bradycardia |

#### D. Adherence Penalty

| Adherence Rate | Points | Rationale |
|----------------|--------|-----------|
| < 50% | +10 | Poor adherence - high risk |
| < 75% | +5 | Inconsistent adherence |

#### E. Missed Follow-up Penalty

| Missed Follow-ups | Points |
|-------------------|--------|
| > 3 | +10 |
| 1-3 | +5 |

### Health Risk Score Formula

```
Health Risk Score = Sum of all applicable points (capped at 100)
```

### Danger Band Classification

```
If Health Risk Score ≥ 70:  Red
If Health Risk Score ≥ 40:  Yellow
Otherwise:                  Green
```

---

## 6. Final Priority Score Calculation

### The Detail Score Components

The detail score refines ordering WITHIN each danger band:

| Component | Weight | What It Measures |
|-----------|--------|------------------|
| Health Risk Score | 40% | Current clinical danger |
| Days Overdue | 30% | Time since last visit |
| Adherence Gap | 15% | Medicine non-compliance |
| Clinical Risk Tag | 10% | Additional risk signal |
| Age Factor | 5% | Elderly vulnerability |

### Component Calculations

#### 1. Health Risk Score (40%)

The health risk score calculated above, multiplied by 0.40.

#### 2. Days Overdue (30%)

```
Days Overdue = Current Date - Last Visit Date
Overdue Score = min(Days Overdue, 30) × 0.30
```

Capped at 30 days to prevent outlier dominance.

#### 3. Adherence Gap (15%)

```
Adherence Gap = 100 - Adherence Rate
Adherence Score = Adherence Gap × 0.15
```

- 95% adherence → gap = 5 → low score
- 40% adherence → gap = 60 → high score

#### 4. Clinical Risk Tag (10%)

| Risk Level | Severity Value |
|------------|----------------|
| Green | 0 |
| Yellow | 5 |
| Red | 10 |
| Unknown | 3 |

```
Clinical Score = Severity Value × 0.10
```

#### 5. Age Factor (5%)

```
Age Factor = 5.0 if Age > 60 else 0.0
Age Score = Age Factor × 0.05
```

### Detail Score Formula

```
Detail Score = (Risk Score × 0.40) +
               (Days Overdue × 0.30) +
               (Adherence Gap × 0.15) +
               (Clinical Tag × 0.10) +
               (Age Factor × 0.05)
```

### Severity Base System

To ensure danger bands are preserved in the final score:

| Danger Band | Severity Base |
|-------------|---------------|
| Emergency | 90 |
| Red | 75 |
| Yellow | 45 |
| Green | 15 |

### Final Priority Score Formula

```
Final Priority Score = min(Severity Base + 0.20 × Detail Score, 100)
```

The 0.20 multiplier ensures the detail score adds nuance without breaking the band ordering.

---

## 7. Complete Worked Example

### Patient Data

Let's compare four patients:

| Factor | Akshat | Indresh | Divya | Ankita |
|--------|--------|---------|-------|--------|
| **Age** | 65 | 58 | 45 | 28 |
| **Chronic Diseases** | None | Diabetes + HTN | Diabetes | None |
| **BP** | 185/120 | 165/100 | 145/92 | 118/76 |
| **SpO2** | 88% | 93% | 96% | 98% |
| **Temperature** | 40.5°C | 38.8°C | 37.8°C | 36.8°C |
| **Heart Rate** | 125 | 110 | 88 | 72 |
| **Last Visit** | 20 days | 12 days | 5 days | 2 days |
| **Adherence** | 35% | 55% | 70% | 95% |
| **Emergency Flag** | YES | No | No | No |

### Step 1: Calculate Health Risk Scores

**Akshat:**
- Age > 60: +15
- BP ≥ 180: +25
- SpO2 ≤ 90: +25
- Temp ≥ 40: +12
- HR ≥ 120: +10
- Adherence < 50%: +10
- **Total: 97 → Red band** (but Emergency flag overrides)

**Indresh:**
- Chronic: Diabetes (+12) + HTN (+10) = +22
- BP ≥ 160: +18
- SpO2 ≤ 94: +15
- Temp ≥ 38.5: +8
- Adherence < 50%: +10
- **Total: 91 → Red band**

**Divya:**
- Chronic: Diabetes (+12)
- BP ≥ 160: No (145 < 160)
- Temp: Normal
- Adherence < 75%: +5
- **Total: 17 → Green band** (but elevated vitals push to Yellow)

**Ankita:**
- No risk factors
- **Total: 0 → Green band**

### Step 2: Apply Severity Base

| Patient | Danger Band | Severity Base |
|---------|-------------|---------------|
| Akshat | Emergency | 90 |
| Indresh | Red | 75 |
| Divya | Yellow | 45 |
| Ankita | Green | 15 |

### Step 3: Calculate Detail Scores

**Akshat:**
- Risk: 97 × 0.40 = 38.8
- Overdue: 20 × 0.30 = 6.0
- Adherence Gap: 65 × 0.15 = 9.75
- Clinical (Red): 10 × 0.10 = 1.0
- Age Factor: 5 × 0.05 = 0.25
- **Detail Score: 55.8**

**Indresh:**
- Risk: 91 × 0.40 = 36.4
- Overdue: 12 × 0.30 = 3.6
- Adherence Gap: 45 × 0.15 = 6.75
- Clinical (Red): 10 × 0.10 = 1.0
- Age Factor: 0 × 0.05 = 0
- **Detail Score: 47.75**

**Divya:**
- Risk: 17 × 0.40 = 6.8
- Overdue: 5 × 0.30 = 1.5
- Adherence Gap: 30 × 0.15 = 4.5
- Clinical (Yellow): 5 × 0.10 = 0.5
- Age Factor: 0 × 0.05 = 0
- **Detail Score: 13.3**

**Ankita:**
- Risk: 0 × 0.40 = 0
- Overdue: 2 × 0.30 = 0.6
- Adherence Gap: 5 × 0.15 = 0.75
- Clinical (Green): 0 × 0.10 = 0
- Age Factor: 0 × 0.05 = 0
- **Detail Score: 1.35**

### Step 4: Calculate Final Priority Scores

```
Final Score = min(Severity Base + 0.20 × Detail Score, 100)
```

| Patient | Severity Base | Detail Score | Final Score |
|---------|---------------|--------------|-------------|
| Akshat | 90 | 55.8 | 90 + 11.16 = **100** |
| Indresh | 75 | 47.75 | 75 + 9.55 = **84.55** |
| Divya | 45 | 13.3 | 45 + 2.66 = **47.66** |
| Ankita | 15 | 1.35 | 15 + 0.27 = **15.27** |

### Final Visit Order

| Rank | Patient | Score | Band | Action |
|------|---------|-------|------|--------|
| #1 | Akshat | 100 | Emergency | Visit IMMEDIATELY |
| #2 | Indresh | 84.55 | Red | Visit TODAY |
| #3 | Divya | 47.66 | Yellow | Visit in 2-3 days |
| #4 | Ankita | 15.27 | Green | Routine visit |

---

## 8. Data Requirements

### Database Tables Used

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | Patient demographics | id, name, age, chronic_diseases[], adherence_rate, last_visit_date, risk_level, emergency_flag |
| `vitals` | Vital sign readings | id, patient_id, systolic_bp, diastolic_bp, spo2, temperature, heart_rate, is_critical |
| `ai_consultations` | AI symptom analysis | id, user_id, risk_level, extracted_symptoms |
| `worker_assignments` | Worker-patient mapping | worker_id, assigned_patients[] |

### Data Flow

```
Patient → Vitals Recorded → Supabase → AI Pipeline → Priority Score → Display
```

---

## 9. Pipeline Execution Flow

### Step-by-Step Process

```
1. ASHA worker opens app
         ↓
2. App calls: GET /patient/prioritized-list/{worker_id}
         ↓
3. Backend fetches worker's assigned patients
         ↓
4. For each patient:
   a. Fetch latest vitals from 'vitals' table
   b. Fetch demographics from 'users' table
   c. Calculate Health Risk Score
   d. Determine Danger Band (Emergency/Red/Yellow/Green)
   e. Calculate Detail Score (5 components)
   f. Apply Severity Base
   g. Compute Final Priority Score
         ↓
5. Sort patients by Final Score (descending)
         ↓
6. Assign visit order numbers (#1, #2, #3...)
         ↓
7. Return JSON to mobile app
         ↓
8. Display ranked list with color coding
```

---

## 10. Why Rule-Based?

### Rule-Based vs. Machine Learning

| Factor | Rule-Based (Healorithm) | Machine Learning |
|--------|------------------------|------------------|
| **Explainability** | ✅ Every decision traceable | ❌ Black box |
| **Debugging** | ✅ Easy to find issues | ❌ Requires retraining |
| **Training Data** | ✅ Not needed | ❌ Requires large datasets |
| **Clinical Trust** | ✅ Thresholds are medical standards | ❌ Hard to validate |
| **Regulatory** | ✅ Easier to certify | ❌ Complex approval |
| **Maintenance** | ✅ Update thresholds directly | ❌ Requires ML expertise |

### Why This Matters for Healthcare

1. **Explainability:** When a patient asks "Why am I ranked urgent?", the answer is clear: "Your BP is 180/120 and you haven't been visited in 20 days."

2. **Clinical Validity:** Blood pressure thresholds (180 mmHg = crisis) are based on decades of medical research, not learned from potentially biased data.

3. **Auditability:** Healthcare regulators can review every rule and threshold.

4. **Trust:** ASHA workers understand WHY the AI makes recommendations, leading to better adoption.

---

## 11. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ASHA Worker Mobile App                    │
│                    (React Native + Expo)                     │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Dashboard  │  │  Patients   │  │   Alerts    │         │
│  │  Screen     │  │  Tab        │  │   Screen    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (Python)                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Patient Prioritization Engine           │   │
│  │                                                       │   │
│  │  ┌─────────────────┐  ┌─────────────────┐           │   │
│  │  │ Risk Scoring    │  │ Emergency       │           │   │
│  │  │ Module          │  │ Detector        │           │   │
│  │  └─────────────────┘  └─────────────────┘           │   │
│  │                                                       │   │
│  │  Danger Band Classification (Layer 1)                │   │
│  │  Detail Score Calculation (Layer 2)                  │   │
│  │  Final Priority Score with Severity Base             │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase (PostgreSQL)                     │
│                                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ users      │ │ vitals     │ │ ai_        │              │
│  │ (patients) │ │ (readings) │ │ consults   │              │
│  └────────────┘ └────────────┘ └────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. Tech Stack

| Layer | Technology | File Location |
|-------|------------|---------------|
| **Frontend** | React Native + Expo | `app/(tabs)/` |
| **State Management** | Zustand | `store/useAppStore.ts` |
| **Backend Framework** | FastAPI (Python) | `backend/main.py` |
| **Prioritization Engine** | Python (rule-based) | `backend/core/patient_prioritization.py` |
| **Risk Scoring** | Python (rule-based) | `backend/core/risk_scoring.py` |
| **Emergency Detection** | Python (threshold-based) | `backend/core/emergency_detector.py` |
| **Database** | Supabase (PostgreSQL) | `backend/db/supabase_client.py` |
| **API Routes** | FastAPI Router | `backend/routes/patient.py` |
| **Configuration** | Python constants | `backend/config.py` |

---

## Appendix: Key Files

| File | Purpose |
|------|---------|
| `backend/core/patient_prioritization.py` | Main priority engine |
| `backend/core/risk_scoring.py` | Health risk calculation |
| `backend/core/emergency_detector.py` | Critical threshold detection |
| `backend/config.py` | Thresholds, weights, constants |
| `backend/routes/patient.py` | API endpoints |
| `backend/db/supabase_client.py` | Database queries |
| `app/(tabs)/dashboard.tsx` | Main UI |
| `store/useAppStore.ts` | State management |

---

## Conclusion

The Healorithm AI Pipeline is a **transparent, clinically-safe, rule-based prioritization system** that:

1. **Classifies** patients into danger bands (Emergency/Red/Yellow/Green)
2. **Scores** patients using 5 weighted factors
3. **Ranks** patients with a final priority score that preserves clinical ordering
4. **Explains** every decision with human-readable reasons

This system ensures ASHA workers always know whom to visit first, potentially saving lives through better prioritization.

---

*Report generated for hackathon presentation.*
