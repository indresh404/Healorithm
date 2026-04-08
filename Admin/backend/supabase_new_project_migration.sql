-- ═══════════════════════════════════════════════════════════════════════════════
-- Healorithm Admin Backend — Migration for NEW Supabase project
-- Project: kjtxdsgvsmaatxvjyjiy.supabase.co
--
-- Run this in the Supabase SQL Editor:
--   https://supabase.com/dashboard/project/kjtxdsgvsmaatxvjyjiy/sql/new
--
-- This accounts for existing tables created by the User app + teammates:
--   ✓ users (exists, missing AI columns — adding them below)
--   ✓ vitals (exists with 'recorded_by' column, NOT 'worker_id')
--   ✓ admins (exists)
--   ✗ worker_assignments (missing — creating below)
--   ✗ prescriptions (missing — creating below)
--   ✗ visit_records (missing — creating below)
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─── 1. Add AI-required columns to existing `users` table ────────────────────

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS chronic_diseases      TEXT[]  DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS allergies             TEXT[]  DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS current_risk_score    FLOAT   DEFAULT 0,
    ADD COLUMN IF NOT EXISTS risk_level            TEXT    DEFAULT 'green',
    ADD COLUMN IF NOT EXISTS adherence_rate        FLOAT   DEFAULT 100,
    ADD COLUMN IF NOT EXISTS missed_follow_ups     INT     DEFAULT 0,
    ADD COLUMN IF NOT EXISTS emergency_flag        BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS last_visit_date       TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_worker_id        TEXT,
    ADD COLUMN IF NOT EXISTS next_visit_days       INT;


-- ─── 2. Create `worker_assignments` table ────────────────────────────────────

CREATE TABLE IF NOT EXISTS worker_assignments (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id         TEXT        UNIQUE NOT NULL,  -- admin UUID from `admins` table
    worker_name       TEXT,
    village           TEXT,
    assigned_patients UUID[]      DEFAULT '{}',     -- array of patient IDs from `users`
    last_sync         TIMESTAMPTZ,
    status            TEXT        DEFAULT 'active',
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_worker_assignments_worker_id ON worker_assignments (worker_id);


-- ─── 3. Create `prescriptions` table ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prescriptions (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id    TEXT,
    worker_id     TEXT,
    medicine_name TEXT        NOT NULL,
    dosage        TEXT,
    frequency     TEXT,
    duration_days INT,
    instructions  TEXT,
    status        TEXT        DEFAULT 'active',
    prescribed_at TIMESTAMPTZ DEFAULT now(),
    created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions (patient_id);


-- ─── 4. Create `visit_records` table ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS visit_records (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    worker_id      TEXT        NOT NULL,
    session_id     TEXT,
    started_at     TIMESTAMPTZ DEFAULT now(),
    ended_at       TIMESTAMPTZ,
    visit_type     TEXT        DEFAULT 'routine',
    notes          TEXT,
    follow_up_days INT,
    created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visit_records_patient_id ON visit_records (patient_id);


-- ─── 5. Disable RLS so the anon/publishable key can read & write ──────────────
-- The backend uses the publishable key (not service_role), so RLS must be off.

ALTER TABLE users                DISABLE ROW LEVEL SECURITY;
ALTER TABLE vitals               DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins               DISABLE ROW LEVEL SECURITY;
ALTER TABLE worker_assignments   DISABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions        DISABLE ROW LEVEL SECURITY;
ALTER TABLE visit_records        DISABLE ROW LEVEL SECURITY;


-- ─── 6. Seed worker_assignments for Divya (existing admin) ───────────────────
-- Assign all current patients to Divya.
-- Update this whenever new patients are added.

INSERT INTO worker_assignments (worker_id, worker_name, assigned_patients, village, status)
SELECT
    a.id::text,
    a.name,
    ARRAY(SELECT u.id FROM users u),  -- all patients
    'Zone 1',
    'active'
FROM admins a
WHERE a.name = 'Divya'
ON CONFLICT (worker_id) DO UPDATE
    SET assigned_patients = EXCLUDED.assigned_patients,
        updated_at        = now();
