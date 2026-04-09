-- Demo data for existing patients in the live `users` table.
-- Purpose: create a hard-to-rank visit list so the AI pipeline can justify
-- why a specific patient should be visited first.
--
-- This script intentionally changes ONLY fields used by the Admin AI pipeline:
--   users.chronic_diseases
--   users.current_risk_score
--   users.risk_level
--   users.adherence_rate
--   users.missed_follow_ups
--   users.emergency_flag
--   users.last_visit_date
--   users.next_visit_days
--   vitals.* (latest vitals row per patient)
--
-- Identity fields such as name, age, gender, phone, language, QR, latitude,
-- longitude are left untouched.
--
-- Important: chronic disease values are capitalized to match the weights in
-- backend/core/risk_scoring.py.

BEGIN;

CREATE TEMP TABLE demo_users_tmp AS
SELECT *
FROM (
    VALUES
        (
            '1acc9069-e921-4122-937a-193ae4948c72'::uuid,
            ARRAY['Asthma']::text[],
            49.0::float,
            'yellow'::text,
            74.0::float,
            1,
            false,
            NOW() - INTERVAL '9 days',
            5
        ),
        (
            '1bdc2884-12fa-4add-9c7b-98666e51e4d7'::uuid,
            ARRAY[]::text[],
            8.0::float,
            'green'::text,
            95.0::float,
            0,
            false,
            NOW() - INTERVAL '2 days',
            14
        ),
        (
            '87cb4f7a-00fe-4ba6-8190-1f33d8250a78'::uuid,
            ARRAY['Cardiac', 'CKD']::text[],
            75.0::float,
            'red'::text,
            62.0::float,
            2,
            false,
            NOW() - INTERVAL '16 days',
            3
        ),
        (
            '98967108-4ebe-4897-a936-11226b093f57'::uuid,
            ARRAY['Cardiac', 'Hypertension']::text[],
            100.0::float,
            'red'::text,
            35.0::float,
            3,
            true,
            NOW() - INTERVAL '12 days',
            2
        )
) AS t(
    user_id,
    chronic_diseases,
    current_risk_score,
    risk_level,
    adherence_rate,
    missed_follow_ups,
    emergency_flag,
    last_visit_date,
    next_visit_days
);

CREATE TEMP TABLE demo_vitals_tmp AS
SELECT *
FROM (
    VALUES
        (
            '1acc9069-e921-4122-937a-193ae4948c72'::uuid,
            161,
            100,
            122,
            95.0::float,
            38.6::float,
            false,
            '[AI DEMO] Clear yellow case: elevated BP, fever, tachycardia, moderate overdue',
            NOW() - INTERVAL '9 days'
        ),
        (
            '1bdc2884-12fa-4add-9c7b-98666e51e4d7'::uuid,
            122,
            80,
            78,
            98.0::float,
            36.8::float,
            false,
            '[AI DEMO] Clear green case: stable vitals, recent visit, high adherence',
            NOW() - INTERVAL '2 days'
        ),
        (
            '87cb4f7a-00fe-4ba6-8190-1f33d8250a78'::uuid,
            165,
            102,
            110,
            92.0::float,
            38.8::float,
            false,
            '[AI DEMO] Clear red case: serious vitals plus chronic disease load',
            NOW() - INTERVAL '16 days'
        ),
        (
            '98967108-4ebe-4897-a936-11226b093f57'::uuid,
            186,
            122,
            128,
            89.0::float,
            40.2::float,
            true,
            '[AI DEMO] Clear emergency case: hypertensive crisis with hypoxia and fever',
            NOW() - INTERVAL '12 days'
        )
) AS t(
    patient_id,
    systolic_bp,
    diastolic_bp,
    heart_rate,
    spo2,
    temperature,
    is_critical,
    notes,
    recorded_at
);

UPDATE users AS u
SET chronic_diseases   = d.chronic_diseases,
    current_risk_score = d.current_risk_score,
    risk_level         = d.risk_level,
    adherence_rate     = d.adherence_rate,
    missed_follow_ups  = d.missed_follow_ups,
    emergency_flag     = d.emergency_flag,
    last_visit_date    = d.last_visit_date,
    next_visit_days    = d.next_visit_days
FROM demo_users_tmp AS d
WHERE u.id = d.user_id;

DELETE FROM vitals
WHERE patient_id IN (SELECT user_id FROM demo_users_tmp)
  AND notes LIKE '[AI DEMO] %';

INSERT INTO vitals (
    patient_id,
    systolic_bp,
    diastolic_bp,
    heart_rate,
    spo2,
    temperature,
    is_critical,
    notes,
    recorded_at
)
SELECT
    patient_id,
    systolic_bp,
    diastolic_bp,
    heart_rate,
    spo2,
    temperature,
    is_critical,
    notes,
    recorded_at
FROM demo_vitals_tmp;

DROP TABLE demo_vitals_tmp;
DROP TABLE demo_users_tmp;

COMMIT;

-- Expected ranking from backend/core/patient_prioritization.py with this demo data:
--   1. Akshat Sabnis   (~100.0, emergency red)
--   2. Indresh Suresh  (~83.3, non-emergency red)
--   3. Divya sharma    (~50.3, yellow)
--   4. Ankita Rajbhar  (~15.3, green)
--
-- Why this is a good demo:
--   - Every patient sits in a visibly different tier, so the ranking is trivial to justify.
--   - Akshat is the emergency case, Indresh is serious but not emergency, Divya is moderate, Ankita is routine.
--   - The displayed score is far apart, so judges will not see any ambiguity in ordering.

-- Optional check after running the script:
-- SELECT id, name, risk_level, current_risk_score, adherence_rate, last_visit_date, chronic_diseases
-- FROM users
-- WHERE id IN (
--     '1acc9069-e921-4122-937a-193ae4948c72',
--     '1bdc2884-12fa-4add-9c7b-98666e51e4d7',
--     '87cb4f7a-00fe-4ba6-8190-1f33d8250a78',
--     '98967108-4ebe-4897-a936-11226b093f57'
-- )
-- ORDER BY name;