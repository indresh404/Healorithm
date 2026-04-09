# Healorithm ASHA Worker Admin App

A React Native app for ASHA (Accredited Social Health Activists) field workers to manage patient visits and receive **AI-powered priority recommendations** about which patients need attention first.

---

## 🎯 The Big Picture

This app helps ASHA workers in rural India:
1. **See all assigned patients** in one place
2. **Get AI recommendations** on WHO to visit first based on health urgency
3. **Record vitals** (blood pressure, temperature, etc.) during visits
4. **Detect emergencies** when vital signs are dangerously high
5. **Stay offline-friendly** — works even without internet

---

## 🤖 AI Priority Pipeline: How It Works

### The Problem It Solves

Imagine you're an ASHA worker with 30 patients. You have limited time. Who do you visit first?
- Mr. Sharma just had extremely high blood pressure and hasn't been visited in 20 days?
- Ms. Patel has diabetes but was just visited 2 days ago?
- Young Raj has no serious conditions and takes medicines regularly?

**The AI Pipeline solves this** by automatically ranking patients so you always know WHO NEEDS YOU MOST.

---

### How The AI Scoring Works (In Simple Terms)

The system gives each patient a **Priority Score** (0-100) based on 5 factors. Think of it like a report card for urgency:

#### 1. **Health Risk Level** (40% weight) — THE MOST IMPORTANT
**What it measures:** How sick is the patient RIGHT NOW?

The system looks at the patient's latest vital signs:
- **Blood Pressure (BP):** Should be around 120/80. If it's 180/110 (dangerously high), risk goes up 🔴
- **Oxygen Level (SpO2):** Should be 95-100%. If it's 89% (low), risk goes up 🔴
- **Heart Rate:** Should be 60-100 bpm. If it's 130 bpm (too fast), risk goes up 🔴
- **Temperature:** Should be 98.6°F. If it's 103°F (fever), risk goes up 🔴

**Example:**
- Utkarsh: BP 178/108 + SpO2 91% = VERY HIGH RISK 🔴 → Score impact = HIGH
- Akshat: BP 118/76 + SpO2 98.5% = Normal = LOW RISK 🟢 → Score impact = LOW

---

#### 2. **Days Overdue** (30% weight) — HOW LONG SINCE LAST VISIT
**What it measures:** How many days have passed since we last checked on this patient?

- **0-3 days:** Recently visited, no urgency point
- **4-7 days:** Due for a visit soon
- **8+ days:** OVERDUE! This patient needs you now 🕐
- **Never visited (999+ days):** First visit needed! 🔴

**Why it matters:** Patients with chronic diseases need regular check-ins. If someone hasn't been seen in 3 weeks, their condition might have gotten worse.

**Example:**
- Utkarsh: 18 days overdue = HIGH urgency → Score impact = HIGH
- Akshat: 2 days since last visit = Routine → Score impact = LOW

---

#### 3. **Medicine Adherence** (15% weight) — IS THE PATIENT TAKING THEIR MEDICINES REGULARLY?
**What it measures:** What % of prescribed medicines has the patient actually taken?

- **0-40% taken:** Patient is skipping meds! Very risky ⚠️
- **41-70% taken:** Patient is sometimes forgetting (moderate)
- **71-100% taken:** Patient is responsible and consistent ✅

**Why it matters:** A diabetic patient who takes insulin daily is safer than one who forgets half the time.

**Example:**
- Utkarsh: 42% adherence (skipping meds often) = HIGH RISK → Score impact = HIGH
- Akshat: 94% adherence (very responsible) = LOW RISK → Score impact = LOW

---

#### 4. **Chronic Conditions** (10% weight) — WHAT DISEASES DOES THE PATIENT HAVE?
**What it measures:** Does the patient have long-term diseases?

- **No conditions:** Generally healthier 🟢
- **1 condition (e.g., diabetes):** Needs monitoring 🟡
- **2+ conditions (e.g., hypertension + diabetes):** High complexity 🔴

**Why it matters:** Someone with just high blood pressure is usually safer than someone with both hypertension AND diabetes.

---

#### 5. **Age Factor** (5% weight) — HOW OLD IS THE PATIENT?
**What it measures:** Subtle age-related risk (elderly people recover slower)

- Elderly (60+): Slightly higher priority ↑
- Young/Middle-aged: Normal priority
- Children: Generally lower priority (but clinical risk still dominates)

**Why it matters:** An 80-year-old with BP 180 is riskier than a 25-year-old with BP 180 because older people have weaker hearts.

---

### The Formula (In English, Not Math 🙅)

Here's how the AI combines everything:

```
PRIORITY SCORE = 
    (Health Risk × 40%) +
    (Days Overdue × 30%) +
    (Low Adherence × 15%) +
    (Chronic Conditions × 10%) +
    (Age Factor × 5%)
```

**Each factor gets a score 0-100, then multiplied by its weight, then added up.**

---

### Real Example: 3 Patients

Imagine these 3 are assigned to you:

#### 🥇 Utkarsh (VISIT FIRST - Priority #1)
- BP: 178/108 (Critical, should be ~120/80) 🔴
- SpO2: 91% (Low, should be 95-100%) 🔴
- Days overdue: 18 days (hasn't been checked in weeks) 📅
- Medicine adherence: 42% (skipping meds) ⚠️
- Conditions: Hypertension + Diabetes (2 diseases) 🔴
- Age: 62 (elderly) 👴

**AI says:** "URGENT - Utkarsh's blood pressure is dangerously high and may have a stroke. He's way overdue and not taking meds. Visit him TODAY!"
**Priority Score: ~85/100 🔴**

#### 🥈 Ankita (VISIT SECOND - Priority #2)
- BP: 148/94 (Elevated, not critical) 🟡
- SpO2: 96% (Normal)
- Days overdue: 9 days (a bit late, but not too bad)
- Medicine adherence: 68% (mostly takes meds)
- Conditions: Diabetes (1 disease)
- Age: 44 (middle-aged) 👩

**AI says:** "Monitor - Ankita's BP is higher than normal and she was due 2 days ago. Check on her condition."
**Priority Score: ~52/100 🟡**

#### 🥉 Akshat (VISIT THIRD - Priority #3)
- BP: 118/76 (Perfect) 🟢
- SpO2: 98.5% (Excellent)
- Days overdue: 2 days (just visited!) ✅
- Medicine adherence: 94% (very responsible) ✅
- Conditions: None (healthy) 🟢
- Age: 26 (young) 👨

**AI says:** "Routine - Akshat is healthy, visited recently, and taking meds. No urgency."
**Priority Score: ~12/100 🟢**

---

### Visual Color Coding

The AI uses traffic light colors for quick understanding:

| Color | Score | Meaning |
|-------|-------|---------|
| 🔴 RED | 70-100 | **URGENT** - Visit TODAY. Patient may have emergency. |
| 🟡 YELLOW | 40-69 | **SOON** - Visit within 2-3 days. Patient needs monitoring. |
| 🟢 GREEN | 0-39 | **ROUTINE** - Visit this week when you have time. |

---

## 🏗️ System Architecture

```
ASHA Worker App (React Native)
         ↓
   [Patients Screen]
   Shows AI Rankings
         ↓
     Backend API (Python/FastAPI)
         ↓
   AI Pipeline Engine
   (Scoring Algorithm)
         ↓
   Supabase Database
   (Patient Data + Vitals)
```

---

## 🚀 How To Test The AI Pipeline

### Step 1: Run Backend
```bash
cd d:\Healorithm\Admin\backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 2: Run Frontend
```bash
cd d:\Healorithm\Admin
npx expo start --web
```

### Step 3: Open Web App
Visit `http://localhost:8081` in your browser

### Step 4: Login
- Phone: `7559302315` (Divya, the ASHA worker)
- Password: (check Supabase admins table)

### Step 5: Seed Test Patients
Before you can see the AI rankings meaningfully, run the SQL seed file:
- Open Supabase SQL Editor
- Run: [Admin/backend/seed_test_patients.sql](Admin/backend/seed_test_patients.sql)
- This adds 3 test patients with different risk profiles

### Step 6: View Patients & AI Rankings
Go to **Patients** tab:
- You'll see **"🤖 AI Visit Priority"** section at the top
- It shows patients ranked 1, 2, 3...
- **#1 is who you should visit first**

---

## 📊 What Data Feeds The AI?

The AI needs this patient data to work:

| Data | Where Stored | Purpose |
|------|--------------|---------|
| Vital Signs (BP, SpO2, HR, Temp, etc.) | `vitals` table | Calculate health risk |
| Last Visit Date | `users.last_visit_date` | Calculate days overdue |
| Chronic Diseases | `users.chronic_diseases` | Calculate condition risk |
| Medicine Adherence % | `users.adherence_rate` | Identify non-compliant patients |
| Age | `users.age` | Adjust for elderly patients |

---

## 🔄 The AI Pipeline Steps (Behind The Scenes)

1. **Fetch Patient List** → Get all patients assigned to this ASHA worker
2. **Fetch Latest Vitals** → For each patient, get their most recent BP, SpO2, etc.
3. **Calculate Risk Scores** → Compare vitals to safe ranges
4. **Calculate Overdue Days** → How many days since last visit?
5. **Calculate Adherence Gap** → Is patient skipping medicines?
6. **Combine All Factors** → Using the formula above
7. **Sort By Priority** → Highest score = Visit first
8. **Return Ranked List** → Display to worker on screen

---

## ⚠️ Important: When AI Shows HIGH PRIORITY BUT You Know Patient Is Fine?

**This is GOOD!** It means:
- The patient might be doing well NOW, but had a serious event in the past
- We're being cautious — better to check and find them healthy than miss a real emergency
- The AI is conservative (safer than missing real problems)

**Real example:** Utkarsh might have recovered from his hypertensive crisis, but the AI still ranks him high because his LAST vitals were critical and he's not taking meds regularly → He could have another crisis any day.

---

## 🛠️ Tech Stack

- **Frontend:** React Native (Expo)
- **Backend:** FastAPI (Python)
- **Database:** Supabase (PostgreSQL)
- **AI/Scoring:** Custom Python algorithm (no ML needed — rule-based, fully transparent)

---

## 📝 Summary

The AI Priority Pipeline is **simple but powerful**:
- It looks at **5 key health factors**
- Gives each a **score**
- Combines them to rank patients
- Shows you **WHO NEEDS YOU MOST** 🎯

This saves lives by making sure urgent cases are never missed.
