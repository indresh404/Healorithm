# Healorithm ASHA Worker Admin App

This app helps ASHA workers decide whom to visit first.

It shows:
- all assigned patients
- each patient's latest health status
- a clear visit order decided by the AI priority pipeline
- emergency cases that need immediate attention

The goal is simple: if a worker has many patients and limited time, the app should make it obvious who needs attention first.

---

## What This App Does

This app is built for ASHA workers in the field.

It helps them:
1. see all assigned patients in one place
2. scan or open a patient profile quickly
3. record vitals such as blood pressure, oxygen, heart rate, and temperature
4. mark emergency cases when vitals are dangerous
5. get a ranked visit list from the AI priority pipeline

---

## Big Idea

An ASHA worker may have many patients.

Some may be stable.
Some may be overdue for a visit.
Some may be skipping medicines.
Some may be in danger right now.

The app should not leave the worker guessing.

The AI priority pipeline reads patient data, studies the latest vitals and follow-up status, and returns a visit list from highest priority to lowest priority.

The app is designed so that:
- emergency patients are always shown first
- very risky patients are always shown above moderate or stable patients
- if two patients are in the same risk band, the app still decides which one should be visited first

---

## How The AI Priority Pipeline Works

The pipeline works in two layers.

### Layer 1: Decide the patient's danger band

The system first looks at how serious the patient's condition is.

Each patient falls into one of these bands:
- **Emergency**: highest urgency, must be visited first
- **Red**: very serious, but not marked as emergency
- **Yellow**: moderate concern, should be visited soon
- **Green**: stable or routine case

This removes ambiguity.

That means:
- an emergency patient will always appear above everyone else
- a red patient will always appear above yellow and green patients
- a yellow patient will always appear above green patients

So even before the fine-grained scoring starts, the order is already clinically safe.

### Layer 2: Rank patients inside the same band

Once the patient is placed in a danger band, the system uses a detailed score to decide the order inside that band.

This is useful when:
- there are two red patients and the worker must choose one first
- there are many yellow patients and the worker wants the smartest order
- stable patients still need a reasonable routine order

---

## Inputs Used By The AI

The current backend uses these inputs.

### 1. Latest vitals

Taken from the `vitals` table.

The app looks at the latest readings for:
- systolic blood pressure
- diastolic blood pressure
- oxygen level (`SpO2`)
- heart rate
- temperature

These vitals are used to calculate the patient's health risk score.

### 2. Last visit date

Taken from `users.last_visit_date`.

This tells the system how many days have passed since the last visit.

More overdue patients get more priority.

### 3. Medicine adherence

Taken from `users.adherence_rate`.

If the patient is missing medicines often, priority goes up.

### 4. Chronic diseases

Taken from `users.chronic_diseases`.

Patients with long-term diseases are given more risk points.

### 5. Age

Taken from `users.age`.

Older patients get a small extra push because they may be more fragile.

### 6. Emergency flag

Taken from `users.emergency_flag`.

If this is `true`, the patient is treated as the top category.

### 7. Clinical risk tag

Taken from `users.risk_level`.

This gives a small extra push in the detailed score.

---

## Step 1: How Health Risk Is Calculated

Before the app decides visit order, it first calculates a health risk score from available patient data.

This risk score is built from several rule-based checks.

These rules are fixed and easy to explain. There is no black-box machine learning here.

### Age points

- Age above 70: `+20`
- Age above 60: `+15`
- Age below 5: `+10`

### Chronic disease points

These are the disease weights currently used by the backend:

| Disease | Points |
|---------|--------|
| Diabetes | 12 |
| Hypertension | 10 |
| Asthma | 8 |
| Cardiac | 15 |
| COPD | 12 |
| CKD | 14 |
| Tuberculosis | 14 |
| Cancer | 20 |
| Any unknown disease | 5 |

If a patient has more than one chronic disease, the points are added.

### Vital sign rules

#### Blood pressure

- Systolic BP `>= 180`: `+25`
- Systolic BP `>= 160`: `+18`
- Systolic BP `<= 90`: `+15`

#### Oxygen (`SpO2`)

- `SpO2 <= 90`: `+25`
- `SpO2 <= 94`: `+15`

#### Temperature

- Temperature `>= 40.0 C`: `+12`
- Temperature `>= 38.5 C`: `+8`
- Temperature `<= 35.0 C`: `+10`

#### Heart rate

- Heart rate `>= 120`: `+10`
- Heart rate `<= 50`: `+12`

### Adherence penalty

- Adherence below `50%`: `+10`
- Adherence below `75%`: `+5`

### Missed follow-up penalty

- More than 3 missed follow-ups: `+10`
- 1 to 3 missed follow-ups: `+5`

### Final health risk band

After all health risk points are added, the score is capped at `100`.

Then the patient is classified as:
- **Red** if score is `70` or more
- **Yellow** if score is `40` or more
- **Green** if score is below `40`

This health risk band is the first important signal in the visit order.

---

## Step 2: How The Detailed Visit Score Is Calculated

After the health risk band is known, the app creates a smaller detail score.

This detail score answers the question:

"Inside the same risk band, who should be visited first?"

The detail score uses these weights:

- Health risk score: `40%`
- Days overdue: `30%`
- Adherence gap: `15%`
- Clinical risk tag: `10%`
- Age factor: `5%`

### What these mean in simple words

#### Health risk score — 40%

This is the strongest part of the detail score.

If a patient has dangerous vitals or many disease points, this pushes them upward.

#### Days overdue — 30%

This rewards regular follow-up.

The longer a patient has gone without a visit, the higher the score.

The backend caps overdue contribution at `30 days` so the score does not become unreasonable.

#### Adherence gap — 15%

The system does not reward adherence directly. It looks at the **gap**.

Example:
- if adherence is `95%`, gap is `5`
- if adherence is `60%`, gap is `40`
- if adherence is `35%`, gap is `65`

So lower adherence means higher urgency.

#### Clinical risk tag — 10%

The backend gives a small extra signal from `users.risk_level`:

- green -> `0`
- yellow -> `5`
- red -> `10`
- unknown -> `3`

This is a small helper signal. It does not overpower the main health risk or emergency logic.

#### Age factor — 5%

If age is above 60, a small extra value is added.

This is only a tie-breaker level signal.

### Detail score formula

$$
\\text{detail score} =
(\text{risk score} \times 0.40)
+ (\text{days overdue} \times 0.30)
+ (\text{adherence gap} \times 0.15)
+ (\text{clinical tag severity} \times 0.10)
+ (\text{age factor} \times 0.05)
$$

---

## Step 3: How The Final Priority Score Is Calculated

This is the score shown on the patient card.

The current system uses a **severity base** so the displayed score always respects the clinical priority band.

### Severity base values

- Emergency patient: `90`
- Red patient: `75`
- Yellow patient: `45`
- Green patient: `15`

Then the detailed score is added in a smaller way:

$$
\\text{final priority score} =
\min(\text{severity base} + 0.20 \times \text{detail score}, 100)
$$

This design has one very important benefit:

- emergency scores stay above red
- red scores stay above yellow
- yellow scores stay above green

So the number shown on the UI and the order shown on the UI cannot fight each other.

---

## Why This New Scoring Is Better For Demos

Earlier, one patient could have a higher raw detail score but still appear lower because of danger band rules.

That confused people.

Now the score itself includes the severity band.

So if the app shows:
- Akshat = `100`
- Indresh = `83`
- Divya = `50`
- Ankita = `15`

the meaning is immediately clear:
- Akshat is emergency
- Indresh is serious but not emergency
- Divya is moderate
- Ankita is routine

This is easier to defend in front of judges, teammates, and anyone testing the system.

---

## Simple Worked Example

Imagine these four patients exist at the same time:

### 1. Akshat Sabnis

- hypertensive crisis
- oxygen very low
- very high fever
- heart rate very high
- emergency flag is true

He becomes an **emergency red** patient.

His score starts from `90`, then the detail score pushes him close to `100`.

### 2. Indresh Suresh

- serious vitals
- strong chronic disease burden
- overdue
- poor enough adherence to matter
- not marked emergency

He becomes a **red** patient.

His score starts from `75`, then the detail score pushes him into the `80s`.

### 3. Divya Sharma

- moderate elevated BP
- some fever
- somewhat overdue
- moderate adherence issues

She becomes a **yellow** patient.

Her score starts from `45`, then the detail score pushes her into the `50s`.

### 4. Ankita Rajbhar

- stable vitals
- recent visit
- strong adherence
- no meaningful chronic burden in demo mode

She becomes a **green** patient.

Her score starts from `15`, and only moves a little.

This makes the visit order obvious.

---

## Current Demo Dataset Used In This Repo

The repo includes a demo SQL file:

[Admin/backend/demo_priority_update_existing_users.sql](Admin/backend/demo_priority_update_existing_users.sql)

This file updates the existing users in the live database and sets up a very clear ranking:

1. Akshat Sabnis -> emergency red
2. Indresh Suresh -> red
3. Divya sharma -> yellow
4. Ankita Rajbhar -> green

This demo was intentionally chosen to avoid any ambiguity.

---

## Visual Meaning On The Patients Screen

On the Patients tab, each card shows:

- the visit order number (`#1`, `#2`, and so on)
- the patient name
- a short reason
- overdue days
- medicine adherence
- final priority score
- emergency badge if present

### Color meaning

| Color | Meaning |
|-------|---------|
| Red | Serious or emergency case |
| Yellow | Moderate case |
| Green | Stable routine case |

### Score meaning

The displayed score is **visit priority**, not just sickness.

That means it answers:

"Whom should I visit first?"

not only:

"Who looks medically sick?"

---

## Exact Sort Rule Used By The Backend

After scores are created, the backend sorts patients from highest score to lowest score.

If two patients somehow land on the same final score, the backend then prefers:
1. emergency patient first
2. higher risk band first

In normal demo use, the final score itself should already separate the order clearly.

---

## Data Needed For The AI To Work

| Data | Where Stored | Why It Matters |
|------|--------------|----------------|
| Latest vitals | `vitals` | Main source of clinical danger |
| Last visit date | `users.last_visit_date` | Finds overdue patients |
| Adherence rate | `users.adherence_rate` | Finds medicine gaps |
| Chronic diseases | `users.chronic_diseases` | Adds long-term risk |
| Age | `users.age` | Gives a small elderly push |
| Risk level | `users.risk_level` | Provides a small extra band signal |
| Emergency flag | `users.emergency_flag` | Pushes emergency cases to the top |
| Missed follow-ups | `users.missed_follow_ups` | Adds extra risk when follow-up is being missed |

---

## AI Pipeline Steps Behind The Scenes

1. fetch the worker's patient list
2. fetch the latest vitals for each patient
3. calculate health risk from vitals, age, diseases, and adherence
4. convert health risk into a risk band: red, yellow, or green
5. measure how overdue the patient is
6. calculate adherence gap
7. calculate the detail score
8. apply a severity base using emergency/red/yellow/green band
9. create the final priority score
10. sort patients from highest score to lowest score
11. return the ranked list to the app

---

## Why The System Is Rule-Based

This project does not use black-box machine learning for visit priority.

It uses plain rules.

That makes it easier to:
- explain the order
- defend the result in a review or demo
- tune the scoring if the team wants different behavior later
- debug wrong rankings quickly

This is especially useful in health workflows, where the team must understand why a patient was placed first.

---

## How To Test The Admin App

### Step 1: Run the backend

```bash
cd d:\Healorithm\Admin\backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 2: Run the frontend

```bash
cd d:\Healorithm\Admin
npx expo start --web
```

### Step 3: Open the web app

Visit `http://localhost:8081`

### Step 4: Login

- Phone: `7559302315`
- Password: check the `admins` table in Supabase

### Step 5: Load the clear demo dataset

Open Supabase SQL Editor and run:

[Admin/backend/demo_priority_update_existing_users.sql](Admin/backend/demo_priority_update_existing_users.sql)

This will set up the easiest possible ranking to understand.

### Step 6: Open the Patients tab

You should see the AI Visit Priority section with a clear order.

Expected demo order:
1. Akshat Sabnis
2. Indresh Suresh
3. Divya sharma
4. Ankita Rajbhar

---

## System Architecture

```text
ASHA Worker Admin App (React Native / Expo)
            ↓
      Patients Screen
            ↓
   FastAPI Admin Backend
            ↓
  Priority Scoring Engine
            ↓
 Supabase (users + vitals)
```

---

## Tech Stack

- Frontend: React Native with Expo
- Backend: FastAPI in Python
- Database: Supabase PostgreSQL
- Prioritization: custom rule-based scoring engine

---

## Summary

The Admin AI Priority Pipeline now works like this:

1. measure current health danger
2. place the patient in emergency, red, yellow, or green band
3. use overdue days, adherence, and other signals to refine the order
4. produce a final score that matches the order shown on screen

So the app gives a visit list that is:
- easy to understand
- easy to explain
- safe for demos
- practical for field workers

That is the main reason for the new scoring design.
