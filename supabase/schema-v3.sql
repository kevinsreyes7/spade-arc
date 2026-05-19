-- SPADE ARC v3 — Complete Database Schema
-- Run in Supabase SQL Editor > New query

-- ─── EXTENSIONS ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name                    TEXT NOT NULL DEFAULT '',
  age                     INTEGER,
  sex                     TEXT CHECK (sex IN ('male','female','other')),
  height_cm               NUMERIC,
  weight_kg               NUMERIC,
  fitness_level           TEXT CHECK (fitness_level IN ('beginner','intermediate','advanced','elite')),
  equipment               TEXT CHECK (equipment IN ('full_gym','full_gym_sprint','barbells_dumbbells','dumbbells_only','bodyweight')),
  goals                   TEXT[] DEFAULT '{}',
  training_days_per_week  INTEGER DEFAULT 4,
  training_days           TEXT[] DEFAULT '{}',
  physical_job            BOOLEAN DEFAULT FALSE,
  physical_job_days       TEXT[] DEFAULT '{}',
  sport_days              TEXT[] DEFAULT '{}',
  sport_name              TEXT DEFAULT '',
  current_week            INTEGER DEFAULT 1 CHECK (current_week BETWEEN 1 AND 20),
  unit_preference         TEXT DEFAULT 'metric' CHECK (unit_preference IN ('metric','imperial')),
  language                TEXT DEFAULT 'en' CHECK (language IN ('en','es')),
  trial_start             TIMESTAMPTZ DEFAULT NOW(),
  subscription_status     TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial','active','cancelled','expired')),
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  onboarding_complete     BOOLEAN DEFAULT FALSE,
  custom_schedule         JSONB,
  week_started_at         DATE,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ─── SCHEDULED SESSIONS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scheduled_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date            DATE NOT NULL,
  session_type    TEXT NOT NULL,
  custom_name     TEXT,
  workout_day_id  INTEGER,
  completed       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);
ALTER TABLE scheduled_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own scheduled_sessions" ON scheduled_sessions FOR ALL USING (auth.uid() = user_id);

-- ─── WORKOUT SESSIONS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workout_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  week_number      INTEGER CHECK (week_number BETWEEN 1 AND 20),
  phase            INTEGER CHECK (phase BETWEEN 1 AND 4),
  workout_day_id   INTEGER,
  workout_name     TEXT,
  completed_at     TIMESTAMPTZ,
  duration_minutes INTEGER,
  total_sets       INTEGER DEFAULT 0,
  ai_summary       TEXT,
  cardio_type      TEXT,
  warmup_id        TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own workout_sessions" ON workout_sessions FOR ALL USING (auth.uid() = user_id);

-- ─── EXERCISE LOGS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exercise_logs (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id             UUID NOT NULL REFERENCES workout_sessions ON DELETE CASCADE,
  user_id                UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  exercise_name          TEXT NOT NULL,
  original_exercise_name TEXT,
  set_number             INTEGER NOT NULL,
  weight                 NUMERIC,
  reps                   INTEGER,
  feel_rating            INTEGER CHECK (feel_rating BETWEEN 1 AND 5),
  notes                  TEXT DEFAULT '',
  completed              BOOLEAN DEFAULT FALSE,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own exercise_logs" ON exercise_logs FOR ALL USING (auth.uid() = user_id);

-- ─── BODY MEASUREMENTS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS body_measurements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  bodyweight  NUMERIC,
  waist       NUMERIC,
  chest       NUMERIC,
  arm_left    NUMERIC,
  arm_right   NUMERIC,
  quad_left   NUMERIC,
  quad_right  NUMERIC,
  calf_left   NUMERIC,
  calf_right  NUMERIC,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own body_measurements" ON body_measurements FOR ALL USING (auth.uid() = user_id);

-- ─── CARDIO LOGS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cardio_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  cardio_type      TEXT NOT NULL,
  duration_minutes INTEGER,
  steps            INTEGER,
  notes            TEXT DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE cardio_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cardio_logs" ON cardio_logs FOR ALL USING (auth.uid() = user_id);

-- ─── DECOMPRESSION LOGS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS decompression_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  type             TEXT NOT NULL CHECK (type IN ('morning','night')),
  items_completed  TEXT[] DEFAULT '{}',
  completed_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, type)
);
ALTER TABLE decompression_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own decompression_logs" ON decompression_logs FOR ALL USING (auth.uid() = user_id);

-- ─── SUPPLEMENT LOGS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supplement_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  supplement_id   TEXT NOT NULL,
  taken           BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, supplement_id)
);
ALTER TABLE supplement_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own supplement_logs" ON supplement_logs FOR ALL USING (auth.uid() = user_id);

-- ─── FOOD LOGS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS food_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type   TEXT NOT NULL,
  description TEXT NOT NULL,
  calories    NUMERIC,
  protein     NUMERIC,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own food_logs" ON food_logs FOR ALL USING (auth.uid() = user_id);

-- ─── SPEED LOGS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS speed_logs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date                  DATE NOT NULL DEFAULT CURRENT_DATE,
  week_number           INTEGER,
  phase                 INTEGER,
  sprint_20m_times      NUMERIC[] DEFAULT '{}',
  sprint_60m_times      NUMERIC[] DEFAULT '{}',
  broad_jump_distances  NUMERIC[] DEFAULT '{}',
  pro_agility_times     NUMERIC[] DEFAULT '{}',
  t_drill_times         NUMERIC[] DEFAULT '{}',
  notes                 TEXT DEFAULT '',
  completed_at          TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE speed_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own speed_logs" ON speed_logs FOR ALL USING (auth.uid() = user_id);

-- ─── SWIM LOGS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS swim_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  total_laps       INTEGER DEFAULT 0,
  distance_metres  INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  sets_completed   TEXT[] DEFAULT '{}',
  notes            TEXT DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE swim_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own swim_logs" ON swim_logs FOR ALL USING (auth.uid() = user_id);

-- ─── JUMP ROPE LOGS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jump_rope_logs (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date                   DATE NOT NULL DEFAULT CURRENT_DATE,
  week_number            INTEGER,
  rounds_completed       INTEGER DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE jump_rope_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own jump_rope_logs" ON jump_rope_logs FOR ALL USING (auth.uid() = user_id);

-- ─── JOURNAL LOGS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journal_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date              DATE NOT NULL DEFAULT CURRENT_DATE,
  energy            INTEGER CHECK (energy BETWEEN 1 AND 5),
  mood              INTEGER CHECK (mood BETWEEN 1 AND 5),
  sleep_hours       NUMERIC,
  sleep_quality     INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  stress            INTEGER CHECK (stress BETWEEN 1 AND 5),
  morning_weight    NUMERIC,
  water_litres      NUMERIC,
  protein_hit       BOOLEAN,
  pain_notes        TEXT DEFAULT '',
  one_win           TEXT DEFAULT '',
  one_improve       TEXT DEFAULT '',
  daily_intention   TEXT DEFAULT '',
  free_write        TEXT DEFAULT '',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);
ALTER TABLE journal_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own journal_logs" ON journal_logs FOR ALL USING (auth.uid() = user_id);

-- ─── PUSH SUBSCRIPTIONS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh      TEXT NOT NULL,
  auth_key    TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own push_subscriptions" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- ─── PR SHARES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pr_shares (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  username       TEXT NOT NULL,
  exercise_name  TEXT NOT NULL,
  weight         NUMERIC NOT NULL,
  reps           INTEGER NOT NULL,
  shared_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pr_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "PR shares are public read" ON pr_shares FOR SELECT USING (true);
CREATE POLICY "Users insert own PR shares" ON pr_shares FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own PR shares" ON pr_shares FOR DELETE USING (auth.uid() = user_id);

-- ─── WEEKLY CHALLENGES ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_challenges (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start       DATE NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  description      TEXT,
  target_sessions  INTEGER DEFAULT 5,
  target_cardio    INTEGER DEFAULT 3,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE weekly_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Weekly challenges are public read" ON weekly_challenges FOR SELECT USING (true);

-- ─── LEADERBOARD FUNCTION ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_leaderboard(week_start DATE)
RETURNS TABLE(username TEXT, session_count BIGINT, rank BIGINT, is_me BOOLEAN)
LANGUAGE sql SECURITY DEFINER AS $$
  WITH counts AS (
    SELECT
      p.name AS username,
      ws.user_id,
      COUNT(ws.id) AS session_count
    FROM workout_sessions ws
    JOIN profiles p ON p.id = ws.user_id
    WHERE ws.completed_at IS NOT NULL
      AND ws.date >= week_start
    GROUP BY p.name, ws.user_id
  )
  SELECT
    c.username,
    c.session_count,
    RANK() OVER (ORDER BY c.session_count DESC) AS rank,
    c.user_id = auth.uid() AS is_me
  FROM counts c
  ORDER BY rank
  LIMIT 50;
$$;

-- ─── SEED WEEKLY CHALLENGE ───────────────────────────────────────────────────
INSERT INTO weekly_challenges (week_start, title, description, target_sessions, target_cardio)
VALUES (
  date_trunc('week', CURRENT_DATE)::DATE,
  '5 Sessions This Week',
  'Hit 5 training sessions this week. Strength, speed, or conditioning — all count.',
  5, 3
) ON CONFLICT (week_start) DO NOTHING;
