-- ═══════════════════════════════════════════════════════════════════════════════
-- Seed 3 test patients for AI pipeline validation
-- Project: kjtxdsgvsmaatxvjyjiy.supabase.co
-- Run in: https://supabase.com/dashboard/project/kjtxdsgvsmaatxvjyjiy/sql/new
--
-- Patients (with different risk profiles to test AI ranking):
--   Utkarsh  — HIGH risk  (red)    : hypertension, low adherence, overdue
--   Ankita   — MEDIUM risk (yellow): diabetes, mild overdue
--   Akshat   — LOW risk   (green)  : healthy, recently visited
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Insert patients ───────────────────────────────────────────────────────

INSERT INTO users (
    id, name, age, gender, phone, password, preferred_language,
    latitude, longitude, qr_code,
    chronic_diseases, risk_level, current_risk_score,
    adherence_rate, missed_follow_ups, emergency_flag,
    last_visit_date, next_visit_days
) VALUES

-- Utkarsh: HIGH risk — elderly, hypertension + diabetes, long overdue, low adherence
(
    'aaaaaaaa-0001-0001-0001-000000000001',
    'Utkarsh', 62, 'Male', '9812345678', '123456', 'hi',
    19.0760, 72.8777, 'QR-UTKARSH-001',
    ARRAY['hypertension', 'diabetes'], 'red', 88.0,
    42.0, 3, true,
    NOW() - INTERVAL '18 days', 7
),

-- Ankita: MEDIUM risk — diabetes, visited 9 days ago, moderate adherence
(
    'aaaaaaaa-0002-0002-0002-000000000002',
    'Ankita', 44, 'Female', '9823456789', '123456', 'hi',
    19.0920, 72.8600, 'QR-ANKITA-002',
    ARRAY['diabetes'], 'yellow', 54.0,
    68.0, 1, false,
    NOW() - INTERVAL '9 days', 14
),

-- Akshat: LOW risk — young, no conditions, visited recently, good adherence
(
    'aaaaaaaa-0003-0003-0003-000000000003',
    'Akshat', 26, 'Male', '9834567890', '123456', 'en',
    19.1136, 72.8697, 'QR-AKSHAT-003',
    ARRAY[]::TEXT[], 'green', 12.0,
    94.0, 0, false,
    NOW() - INTERVAL '2 days', 30
)

ON CONFLICT (id) DO UPDATE SET
    name                = EXCLUDED.name,
    age                 = EXCLUDED.age,
    risk_level          = EXCLUDED.risk_level,
    current_risk_score  = EXCLUDED.current_risk_score,
    adherence_rate      = EXCLUDED.adherence_rate,
    missed_follow_ups   = EXCLUDED.missed_follow_ups,
    emergency_flag      = EXCLUDED.emergency_flag,
    last_visit_date     = EXCLUDED.last_visit_date;


-- ─── 2. Insert vitals for each patient ───────────────────────────────────────
-- Utkarsh: critical BP, low SpO2 → will score very high risk

INSERT INTO vitals (patient_id, systolic_bp, diastolic_bp, heart_rate, spo2, temperature, is_critical, notes, recorded_at)
VALUES
    ('aaaaaaaa-0001-0001-0001-000000000001', 178, 108, 112, 91.0, 37.4, true,  'Hypertensive crisis, low SpO2',    NOW() - INTERVAL '18 days'),
    ('aaaaaaaa-0001-0001-0001-000000000001', 165, 102, 105, 93.0, 37.1, true,  'Still elevated BP',                NOW() - INTERVAL '25 days');

-- Ankita: elevated BP + mild fever → yellow risk
INSERT INTO vitals (patient_id, systolic_bp, diastolic_bp, heart_rate, spo2, temperature, is_critical, notes, recorded_at)
VALUES
    ('aaaaaaaa-0002-0002-0002-000000000002', 148, 94,  88, 96.0, 38.4, false, 'Elevated BP, mild fever',          NOW() - INTERVAL '9 days'),
    ('aaaaaaaa-0002-0002-0002-000000000002', 142, 90,  82, 97.0, 37.6, false, 'Improving but still elevated',     NOW() - INTERVAL '23 days');

-- Akshat: normal vitals → green
INSERT INTO vitals (patient_id, systolic_bp, diastolic_bp, heart_rate, spo2, temperature, is_critical, notes, recorded_at)
VALUES
    ('aaaaaaaa-0003-0003-0003-000000000003', 118, 76,  72, 98.5, 36.7, false, 'All normal',                       NOW() - INTERVAL '2 days');


-- ─── 3. Add new patients to Divya's worker_assignments ───────────────────────

UPDATE worker_assignments
SET assigned_patients = array_cat(
    assigned_patients,
    ARRAY[
        'aaaaaaaa-0001-0001-0001-000000000001'::uuid,
        'aaaaaaaa-0002-0002-0002-000000000002'::uuid,
        'aaaaaaaa-0003-0003-0003-000000000003'::uuid
    ]
),
updated_at = NOW()
WHERE worker_name = 'Divya';
