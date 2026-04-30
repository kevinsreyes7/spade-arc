-- ═══════════════════════════════════════════
-- SPADE ARC — Supabase Database Schema
-- ═══════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ───────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name                 TEXT,
  age                  INTEGER,
  sex                  TEXT CHECK (sex IN ('male', 'female', 'other')),
  height_cm            NUMERIC,
  weight_kg            NUMERIC,
  fitness_level        TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  equipment            TEXT CHECK (equipment IN ('full_gym', 'dumbbells_only', 'barbells_dumbbells', 'bodyweight')),
  goals                TEXT[],
  training_days_per_week INTEGER DEFAULT 4,
  training_days        TEXT[],
  physical_job         BOOLEAN DEFAULT FALSE,
  physical_job_days    TEXT[],
  sport_days           TEXT[],
  sport_name           TEXT DEFAULT '',
  current_week         INTEGER DEFAULT 1,
  unit_preference      TEXT DEFAULT 'metric' CHECK (unit_preference IN ('metric', 'imperial')),
  language             TEXT DEFAULT 'en' CHECK (language IN ('en', 'es')),
  trial_start          TIMESTAMPTZ DEFAULT NOW(),
  subscription_status  TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired')),
  stripe_customer_id   TEXT,
  onboarding_complete  BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ─── WORKOUT SESSIONS ───────────────────────
CREATE TABLE IF NOT EXISTS workout_sessions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date             DATE NOT NULL,
  week_number      INTEGER NOT NULL,
  phase            INTEGER NOT NULL,
  workout_day_id   INTEGER NOT NULL,
  workout_name     TEXT NOT NULL,
  completed_at     TIMESTAMPTZ,
  duration_minutes INTEGER,
  total_sets       INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sessions" ON workout_sessions FOR ALL USING (auth.uid() = user_id);

-- ─── EXERCISE LOGS ──────────────────────────
CREATE TABLE IF NOT EXISTS exercise_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    UUID NOT NULL REFERENCES workout_sessions ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  set_number    INTEGER NOT NULL,
  weight        NUMERIC,
  reps          INTEGER,
  feel_rating   INTEGER CHECK (feel_rating BETWEEN 1 AND 5),
  notes         TEXT DEFAULT '',
  completed     BOOLEAN DEFAULT FALSE
);

ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own exercise logs"
  ON exercise_logs FOR ALL
  USING (session_id IN (SELECT id FROM workout_sessions WHERE user_id = auth.uid()));

-- ─── BODY MEASUREMENTS ──────────────────────
CREATE TABLE IF NOT EXISTS body_measurements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date        DATE NOT NULL,
  bodyweight  NUMERIC,
  waist       NUMERIC,
  chest       NUMERIC,
  arm_left    NUMERIC,
  arm_right   NUMERIC,
  quad_left   NUMERIC,
  quad_right  NUMERIC,
  calf_left   NUMERIC,
  calf_right  NUMERIC
);

ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own measurements" ON body_measurements FOR ALL USING (auth.uid() = user_id);

-- ─── CARDIO LOGS ────────────────────────────
CREATE TABLE IF NOT EXISTS cardio_logs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date             DATE NOT NULL,
  cardio_type      TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  steps            INTEGER,
  notes            TEXT DEFAULT ''
);

ALTER TABLE cardio_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cardio logs" ON cardio_logs FOR ALL USING (auth.uid() = user_id);

-- ─── DECOMPRESSION LOGS ─────────────────────
CREATE TABLE IF NOT EXISTS decompression_logs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date             DATE NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('morning', 'night')),
  items_completed  JSONB DEFAULT '[]',
  completed_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE decompression_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own decompression logs" ON decompression_logs FOR ALL USING (auth.uid() = user_id);

-- ─── SUPPLEMENT LOGS ────────────────────────
-- One row per supplement per day; unique constraint enables easy toggle (insert / delete).
CREATE TABLE IF NOT EXISTS supplement_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date        DATE NOT NULL,
  supplement  TEXT NOT NULL,
  taken_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT supplement_logs_unique UNIQUE (user_id, date, supplement)
);

ALTER TABLE supplement_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own supplement logs" ON supplement_logs FOR ALL USING (auth.uid() = user_id);

-- ─── PR SHARES ──────────────────────────────
CREATE TABLE IF NOT EXISTS pr_shares (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  username      TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  weight        NUMERIC NOT NULL,
  reps          INTEGER NOT NULL,
  shared_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pr_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "PR shares are publicly readable" ON pr_shares FOR SELECT USING (TRUE);
CREATE POLICY "Users can insert own PR shares" ON pr_shares FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own PR shares" ON pr_shares FOR DELETE USING (auth.uid() = user_id);

-- ─── WEEKLY CHALLENGES ──────────────────────
CREATE TABLE IF NOT EXISTS weekly_challenges (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_start       DATE NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  target_sessions  INTEGER NOT NULL DEFAULT 4,
  target_cardio    INTEGER NOT NULL DEFAULT 3
);

ALTER TABLE weekly_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Weekly challenges are publicly readable" ON weekly_challenges FOR SELECT USING (TRUE);

-- ─── CHALLENGE COMPLETIONS ──────────────────
CREATE TABLE IF NOT EXISTS challenge_completions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES weekly_challenges ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, challenge_id)
);

ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own completions" ON challenge_completions FOR ALL USING (auth.uid() = user_id);

-- ─── LEADERBOARD FUNCTION ───────────────────
CREATE OR REPLACE FUNCTION get_leaderboard(week_start DATE)
RETURNS TABLE(username TEXT, session_count BIGINT, rank BIGINT, is_me BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH counts AS (
    SELECT
      ws.user_id,
      COUNT(*) AS sessions
    FROM workout_sessions ws
    WHERE ws.date >= week_start
      AND ws.completed_at IS NOT NULL
    GROUP BY ws.user_id
  ),
  ranked AS (
    SELECT
      c.user_id,
      p.name AS uname,
      c.sessions,
      ROW_NUMBER() OVER (ORDER BY c.sessions DESC) AS rnk
    FROM counts c
    JOIN profiles p ON p.id = c.user_id
  )
  SELECT
    r.uname AS username,
    r.sessions AS session_count,
    r.rnk AS rank,
    (r.user_id = auth.uid()) AS is_me
  FROM ranked r
  ORDER BY r.rnk
  LIMIT 20;
END;
$$;

-- ─── FOOD LOGS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS food_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date        DATE NOT NULL,
  meal_type   TEXT NOT NULL,
  description TEXT NOT NULL,
  calories    INTEGER,
  protein     NUMERIC,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own food logs" ON food_logs FOR ALL USING (auth.uid() = user_id);

-- ─── INDEXES ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON workout_sessions (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_session ON exercise_logs (session_id);
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_date ON body_measurements (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_pr_shares_shared_at ON pr_shares (shared_at DESC);
CREATE INDEX IF NOT EXISTS idx_decompression_logs_user_date ON decompression_logs (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON food_logs (user_id, date DESC);
