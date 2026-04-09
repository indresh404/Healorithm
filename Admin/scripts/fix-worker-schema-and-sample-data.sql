-- Fix schema references from `admins` to `worker` and seed working demo data.
-- Safe to run multiple times.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.worker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone_no text NOT NULL UNIQUE,
  password text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Ensure minimum worker seed so admin app login works against worker table.
INSERT INTO public.worker (id, name, phone_no, password)
VALUES
  ('bbbbbbbb-1111-1111-1111-111111111111', 'Divya', '9898989898', '123456')
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  phone_no = EXCLUDED.phone_no,
  password = EXCLUDED.password;

-- Move FK references from admins -> worker where needed.
ALTER TABLE public.vitals DROP CONSTRAINT IF EXISTS vitals_recorded_by_fkey;
ALTER TABLE public.medical_records DROP CONSTRAINT IF EXISTS medical_records_recorded_by_fkey;
ALTER TABLE public.prescriptions DROP CONSTRAINT IF EXISTS prescriptions_prescribed_by_fkey;

ALTER TABLE public.vitals
  ADD CONSTRAINT vitals_recorded_by_fkey
  FOREIGN KEY (recorded_by) REFERENCES public.worker(id);

ALTER TABLE public.medical_records
  ADD CONSTRAINT medical_records_recorded_by_fkey
  FOREIGN KEY (recorded_by) REFERENCES public.worker(id);

ALTER TABLE public.prescriptions
  ADD CONSTRAINT prescriptions_prescribed_by_fkey
  FOREIGN KEY (prescribed_by) REFERENCES public.worker(id);

-- Ensure assignment row exists for worker login/AI prioritization.
INSERT INTO public.worker_assignments (worker_id, worker_name, village, assigned_patients, status)
SELECT
  w.id::text,
  w.name,
  'Zone 1',
  COALESCE((SELECT array_agg(u.id) FROM public.users u), '{}'::uuid[]),
  'active'
FROM public.worker w
WHERE w.id = 'bbbbbbbb-1111-1111-1111-111111111111'
ON CONFLICT (worker_id) DO UPDATE
SET
  worker_name = EXCLUDED.worker_name,
  village = EXCLUDED.village,
  assigned_patients = EXCLUDED.assigned_patients,
  status = EXCLUDED.status,
  updated_at = now();

-- Seed a few patients for dashboard charts and visit flow.
INSERT INTO public.users (
  id, name, age, gender, phone, password, preferred_language,
  latitude, longitude, qr_code, chronic_diseases, allergies,
  current_risk_score, risk_level, adherence_rate, missed_follow_ups,
  emergency_flag, last_visit_date, last_worker_id, next_visit_days
)
VALUES
(
  'aaaaaaaa-0001-0001-0001-000000000001',
  'Utkarsh', 62, 'Male', '9812345678', '123456', 'hi',
  19.0760, 72.8777, 'QR-UTKARSH-001',
  ARRAY['hypertension', 'diabetes'], ARRAY['penicillin'],
  88, 'red', 42, 3,
  true, now() - interval '18 days', 'bbbbbbbb-1111-1111-1111-111111111111', 7
),
(
  'aaaaaaaa-0002-0002-0002-000000000002',
  'Ankita', 44, 'Female', '9823456789', '123456', 'hi',
  19.0920, 72.8600, 'QR-ANKITA-002',
  ARRAY['diabetes'], ARRAY[]::text[],
  54, 'yellow', 68, 1,
  false, now() - interval '9 days', 'bbbbbbbb-1111-1111-1111-111111111111', 14
),
(
  'aaaaaaaa-0003-0003-0003-000000000003',
  'Akshat', 26, 'Male', '9834567890', '123456', 'en',
  19.1136, 72.8697, 'QR-AKSHAT-003',
  ARRAY[]::text[], ARRAY[]::text[],
  12, 'green', 94, 0,
  false, now() - interval '2 days', 'bbbbbbbb-1111-1111-1111-111111111111', 30
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  age = EXCLUDED.age,
  gender = EXCLUDED.gender,
  phone = EXCLUDED.phone,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  qr_code = EXCLUDED.qr_code,
  chronic_diseases = EXCLUDED.chronic_diseases,
  allergies = EXCLUDED.allergies,
  current_risk_score = EXCLUDED.current_risk_score,
  risk_level = EXCLUDED.risk_level,
  adherence_rate = EXCLUDED.adherence_rate,
  missed_follow_ups = EXCLUDED.missed_follow_ups,
  emergency_flag = EXCLUDED.emergency_flag,
  last_visit_date = EXCLUDED.last_visit_date,
  last_worker_id = EXCLUDED.last_worker_id,
  next_visit_days = EXCLUDED.next_visit_days,
  updated_at = now();

COMMIT;
