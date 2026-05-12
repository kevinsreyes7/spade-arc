-- SPADE ARC v2 — Additional Tables
-- Run this in Supabase SQL Editor

-- ─── CHECKLIST LOGS ─────────────────────────
CREATE TABLE IF NOT EXISTS checklist_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  item_id     TEXT NOT NULL,
  item_label  TEXT NOT NULL,
  completed   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, item_id)
);
ALTER TABLE checklist_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own checklist" ON checklist_logs FOR ALL USING (auth.uid() = user_id);

-- ─── JOURNAL ENTRIES ────────────────────────
CREATE TABLE IF NOT EXISTS journal_entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  executed         TEXT,
  avoided          TEXT,
  training_feeling TEXT,
  whoop_score      TEXT CHECK (whoop_score IN ('green','yellow','red')),
  tomorrow_focus   TEXT,
  tags             TEXT[] DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own journal" ON journal_entries FOR ALL USING (auth.uid() = user_id);

-- ─── MEASUREMENTS ───────────────────────────
CREATE TABLE IF NOT EXISTS measurements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_lbs      NUMERIC,
  height_cm       NUMERIC,
  neck_cm         NUMERIC,
  shoulders_cm    NUMERIC,
  chest_cm        NUMERIC,
  waist_cm        NUMERIC,
  hips_cm         NUMERIC,
  left_arm_cm     NUMERIC,
  right_arm_cm    NUMERIC,
  left_quad_cm    NUMERIC,
  right_quad_cm   NUMERIC,
  left_calf_cm    NUMERIC,
  right_calf_cm   NUMERIC,
  body_fat_pct    NUMERIC,
  whoop_age       NUMERIC,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own measurements" ON measurements FOR ALL USING (auth.uid() = user_id);

-- ─── WORKOUT LOGS ───────────────────────────
CREATE TABLE IF NOT EXISTS workout_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  phase           INTEGER CHECK (phase BETWEEN 1 AND 4),
  week            INTEGER CHECK (week BETWEEN 1 AND 20),
  day_name        TEXT,
  exercises       JSONB DEFAULT '[]',
  notes           TEXT,
  whoop_recovery  TEXT CHECK (whoop_recovery IN ('green','yellow','red')),
  session_rating    INTEGER CHECK (session_rating BETWEEN 1 AND 5),
  duration_minutes  INTEGER,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own workout_logs" ON workout_logs FOR ALL USING (auth.uid() = user_id);

-- ─── WHOOP LOGS ─────────────────────────────
CREATE TABLE IF NOT EXISTS whoop_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  recovery_score  INTEGER,
  recovery_color  TEXT CHECK (recovery_color IN ('green','yellow','red')),
  hrv             INTEGER,
  resting_hr      INTEGER,
  sleep_hours     NUMERIC,
  slow_wave_pct   NUMERIC,
  rem_pct         NUMERIC,
  strain_score    NUMERIC,
  whoop_age       NUMERIC,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);
ALTER TABLE whoop_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own whoop_logs" ON whoop_logs FOR ALL USING (auth.uid() = user_id);

-- ─── CHAT HISTORY ───────────────────────────
CREATE TABLE IF NOT EXISTS chat_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role        TEXT CHECK (role IN ('user','assistant')) NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own chat" ON chat_history FOR ALL USING (auth.uid() = user_id);

-- ─── UPDATE PROFILES TABLE ──────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whoop_age NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS biological_age NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS chronological_age INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_phase INTEGER DEFAULT 1 CHECK (current_phase BETWEEN 1 AND 4);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_week INTEGER DEFAULT 1 CHECK (current_week BETWEEN 1 AND 20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;
