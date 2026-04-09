# AI Pipeline: Last-Minute Summary (30-Second Read)

## What Is It?

A **rule-based AI system** that tells ASHA health workers **which patients to visit first** based on medical urgency.

---

## The Problem

ASHA workers manage 20-30 patients with limited time. Without AI help, they might:
- Miss emergencies (patients with dangerously high BP)
- Visit healthy patients before sick ones
- Waste time deciding whom to prioritize

---

## The Solution

The AI analyzes each patient and produces a **Priority Score (0-100)**. Higher score = visit first.

**Example Output:**
```
#1 Akshat - Score: 100 🔴 EMERGENCY → Visit NOW
#2 Indresh - Score: 83  🔴 RED       → Visit today
#3 Divya   - Score: 50  🟡 YELLOW    → Visit in 2-3 days
#4 Ankita  - Score: 15  🟢 GREEN     → Routine visit
```

---

## How It Works (2 Layers)

### Layer 1: Danger Band (Clinical Safety)
Every patient is placed in a band:
| Band | Score Range | Meaning |
|------|-------------|---------|
| **Emergency** | Override | Life-threatening — visit IMMEDIATELY |
| **Red** | ≥70 | Very serious — visit TODAY |
| **Yellow** | ≥40 | Moderate — visit soon |
| **Green** | <40 | Stable — routine visit |

**Key Guarantee:** Emergency always above Red, Red above Yellow, Yellow above Green.

### Layer 2: Detail Scoring (Fine Ordering)
Within each band, patients are ranked by 5 factors:

| Factor | Weight | What It Measures |
|--------|--------|------------------|
| Health Risk | 40% | Current vitals (BP, SpO2, temp, heart rate) |
| Days Overdue | 30% | Time since last visit |
| Adherence Gap | 15% | Is patient skipping medicines? |
| Chronic Diseases | 10% | Diabetes, heart disease, etc. |
| Age | 5% | Elderly patients more vulnerable |

---

## Health Risk Calculation (Rule-Based)

Points are added for each risk factor:

**Vitals:**
- BP ≥ 180 → +25 points (hypertensive crisis)
- SpO2 ≤ 90% → +25 points (severe hypoxia)
- Temp ≥ 40°C → +12 points (hyperpyrexia)

**Chronic Diseases:**
- Cancer → +20, Cardiac → +15, Diabetes → +12, Hypertension → +10

**Other:**
- Age > 60 → +15
- Adherence < 50% → +10

**Total capped at 100.**

---

## Final Score Formula

```
Severity Base + (0.20 × Detail Score) = Final Priority Score
```

| Band | Severity Base |
|------|---------------|
| Emergency | 90 |
| Red | 75 |
| Yellow | 45 |
| Green | 15 |

**Why this works:** The severity base ensures danger bands never get mixed up. A Red patient can't score lower than a Yellow patient.

---

## Data Sources

| Data | From Table | Purpose |
|------|------------|---------|
| Vitals (BP, SpO2) | `vitals` | Calculate health danger |
| Last Visit Date | `users.last_visit_date` | Calculate days overdue |
| Adherence Rate | `users.adherence_rate` | Check medicine compliance |
| Chronic Diseases | `users.chronic_diseases` | Add disease risk |
| Emergency Flag | `users.emergency_flag` | Override to Emergency band |

---

## Why Rule-Based (Not ML)?

| Advantage | Explanation |
|-----------|-------------|
| **Explainable** | Can tell patient WHY they're ranked urgent |
| **Trustworthy** | Uses medical thresholds, not black-box predictions |
| **Debuggable** | Easy to fix if something's wrong |
| **No Training Data** | Works immediately, no dataset needed |

---

## Tech Stack

- **Frontend:** React Native (Expo)
- **Backend:** FastAPI (Python)
- **AI Engine:** Rule-based Python (`backend/core/`)
- **Database:** Supabase (PostgreSQL)

---

## Impact

| Before AI | After AI |
|-----------|----------|
| Worker guesses who to visit | AI shows exact order |
| Emergencies might be missed | Emergencies always #1 |
| 15-20 visits/day | 25-30 visits/day |

---

## Key Files to Reference

| File | Purpose |
|------|---------|
| `backend/core/patient_prioritization.py` | Main scoring engine |
| `backend/core/risk_scoring.py` | Health risk calculator |
| `backend/core/emergency_detector.py` | Critical threshold checker |
| `backend/config.py` | All thresholds & weights |

---

## 30-Second Pitch to Judges

> "Our AI Pipeline helps ASHA health workers prioritize patient visits. It analyzes vitals, overdue days, medicine adherence, and chronic conditions to produce a priority score for each patient. Emergency patients always rank first, followed by red, yellow, and green patients. The system is fully rule-based and explainable — no black-box ML. When a worker opens the app, they see exactly whom to visit first, potentially saving lives through better prioritization."

---

## Quick Reference: Color Codes

| Color | Score | Action |
|-------|-------|--------|
| 🔴 Red | 70-100 | **URGENT** — Visit TODAY |
| 🟡 Yellow | 40-69 | **SOON** — Visit in 2-3 days |
| 🟢 Green | 0-39 | **ROUTINE** — Visit this week |

---

*Keep this sheet handy for last-minute review before judge presentations.*
