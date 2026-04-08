-- ═══════════════════════════════════════════════════════════════════════════════
-- Healorithm Admin Backend — Supabase table migrations
--
-- Run these in the Supabase SQL Editor (https://app.supabase.com).
-- The `users` and `ai_consultations` tables already exist from the User app.
-- This script ONLY adds new columns + creates the four new tables.
--
-- Safe to run multiple times (uses IF NOT EXISTS / IF NOT EXISTS guards).
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─── 1. Extend existing `users` table with Admin-required columns ────────────
-- The `users` table is the patient registry. Add fields the Admin backend needs.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS qr_code              TEXT UNIQUE,          -- QR code on patient's card
    ADD COLUMN IF NOT EXISTS chronic_diseases      TEXT[]  DEFAULT '{}', -- e.g. ['diabetes','hypertension']
    ADD COLUMN IF NOT EXISTS allergies             TEXT[]  DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS current_risk_score    FLOAT   DEFAULT 0,
    ADD COLUMN IF NOT EXISTS risk_level            TEXT    DEFAULT 'green' CHECK (risk_level IN ('green','yellow','red')),
    ADD COLUMN IF NOT EXISTS adherence_rate        FLOAT   DEFAULT 100,   -- 0–100
    ADD COLUMN IF NOT EXISTS missed_follow_ups     INT     DEFAULT 0,
    ADD COLUMN IF NOT EXISTS emergency_flag        BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS last_visit_date       TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_worker_id        TEXT,
    ADD COLUMN IF NOT EXISTS next_visit_days       INT;                   -- follow-up interval in days


-- ─── 2. Create `vitals` table ────────────────────────────────────────────────
-- Each row is one set of vitals measurements taken during a worker visit.

CREATE TABLE IF NOT EXISTS vitals (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id    TEXT        NOT NULL,         -- visit session UUID
    worker_id     TEXT        NOT NULL,
    systolic_bp   INT,                          -- mmHg
    diastolic_bp  INT,                          -- mmHg
    spo2          FLOAT,                        -- %
    heart_rate    INT,                          -- bpm
    temperature   FLOAT,                        -- °C
    is_critical   BOOLEAN     DEFAULT false,
    notes         TEXT,
    recorded_at   TIMESTAMPTZ DEFAULT now(),
    created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vitals_patient_id  ON vitals (patient_id);
CREATE INDEX IF NOT EXISTS idx_vitals_recorded_at ON vitals (recorded_at DESC);


-- ─── 3. Create `prescriptions` table ─────────────────────────────────────────
-- Medicines prescribed by field workers (or doctors via admin app).

CREATE TABLE IF NOT EXISTS prescriptions (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id    TEXT,
    worker_id     TEXT,
    medicine_name TEXT        NOT NULL,
    dosage        TEXT        NOT NULL,    -- e.g. "500mg"
    frequency     TEXT        NOT NULL,    -- e.g. "Twice daily"
    meal_timing   TEXT,                   -- e.g. "After food"
    duration_days INT,
    is_active     BOOLEAN     DEFAULT true,
    expires_at    TIMESTAMPTZ,
    notes         TEXT,
    issued_at     TIMESTAMPTZ DEFAULT now(),
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- Ensure admin-required columns exist even if the table was created earlier
ALTER TABLE prescriptions
    ADD COLUMN IF NOT EXISTS session_id    TEXT,
    ADD COLUMN IF NOT EXISTS worker_id     TEXT,
    ADD COLUMN IF NOT EXISTS meal_timing   TEXT,
    ADD COLUMN IF NOT EXISTS is_active     BOOLEAN     DEFAULT true,
    ADD COLUMN IF NOT EXISTS expires_at    TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS notes         TEXT,
    ADD COLUMN IF NOT EXISTS issued_at     TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON prescriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_active  ON prescriptions (user_id, is_active);


-- ─── 4. Create `visit_records` table ─────────────────────────────────────────
-- Permanent log of every completed worker visit.

CREATE TABLE IF NOT EXISTS visit_records (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    worker_id        TEXT        NOT NULL,
    session_id       TEXT        UNIQUE NOT NULL,
    visit_type       TEXT        DEFAULT 'routine' CHECK (visit_type IN ('routine','emergency','follow_up')),
    started_at       TIMESTAMPTZ,
    ended_at         TIMESTAMPTZ DEFAULT now(),
    outcome_notes    TEXT,
    follow_up_needed BOOLEAN     DEFAULT false,
    follow_up_days   INT,
    created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visit_records_patient_id ON visit_records (patient_id);
CREATE INDEX IF NOT EXISTS idx_visit_records_ended_at   ON visit_records (ended_at DESC);


-- ─── 5. Create `worker_assignments` table ────────────────────────────────────
-- Maps an ASHA worker to their assigned patients + tracks last sync.

CREATE TABLE IF NOT EXISTS worker_assignments (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id         TEXT        UNIQUE NOT NULL,  -- matches user auth id or employee id
    worker_name       TEXT,
    village           TEXT,
    assigned_patients UUID[]      DEFAULT '{}',     -- array of patient user IDs
    last_sync         TIMESTAMPTZ,
    status            TEXT        DEFAULT 'active' CHECK (status IN ('active','inactive')),
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_worker_assignments_worker_id ON worker_assignments (worker_id);


-- ─── 6. Enable Row-Level Security (RLS) ──────────────────────────────────────
-- Turn on RLS for new tables. Add policies as needed for your auth model.

ALTER TABLE vitals               ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_records        ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_assignments   ENABLE ROW LEVEL SECURITY;

-- Quick policy: allow service_role (used by the Python backend) full access.
-- In production, add more granular policies for anon/authenticated roles.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'vitals' AND policyname = 'service_role_all_vitals'
    ) THEN
        CREATE POLICY "service_role_all_vitals"
            ON vitals FOR ALL TO service_role USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'prescriptions' AND policyname = 'service_role_all_prescriptions'
    ) THEN
        CREATE POLICY "service_role_all_prescriptions"
            ON prescriptions FOR ALL TO service_role USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'visit_records' AND policyname = 'service_role_all_visit_records'
    ) THEN
        CREATE POLICY "service_role_all_visit_records"
            ON visit_records FOR ALL TO service_role USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'worker_assignments' AND policyname = 'service_role_all_worker_assignments'
    ) THEN
        CREATE POLICY "service_role_all_worker_assignments"
            ON worker_assignments FOR ALL TO service_role USING (true);
    END IF;
END $$;
