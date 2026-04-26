-- ═══════════════════════════════════════════
-- SPADE ARC — Seed Data
-- ═══════════════════════════════════════════

-- Weekly challenges — rotate through these
INSERT INTO weekly_challenges (week_start, title, description, target_sessions, target_cardio) VALUES
  ('2024-01-01', 'Foundation Week', 'Hit 4 training sessions this week. Build the habit before building the weight.', 4, 2),
  ('2024-01-08', 'Cardio Activation', 'Log 3 LISS incline walk sessions. Condition the aerobic base.', 3, 3),
  ('2024-01-15', 'Full Week', 'Complete every scheduled training day. No missed sessions.', 5, 2),
  ('2024-01-22', 'PR Week', 'Hit a personal record on at least one key lift and share it.', 4, 2),
  ('2024-01-29', 'Consistency Challenge', 'Train for 5 consecutive days. Discipline over motivation.', 5, 3),
  ('2024-02-05', 'Decompression Protocol', 'Complete the morning decompression routine every day this week.', 4, 2),
  ('2024-02-12', 'Leg Dominance', 'Complete both leg sessions this week. No skipping leg day.', 4, 2),
  ('2024-02-19', 'Volume Week', 'Log the most total sets of anyone this week.', 5, 2),
  ('2024-02-26', 'Mind-Muscle Focus', 'Rate every set with a feel score of 4 or 5 this week.', 4, 2),
  ('2024-03-04', 'Cardio Push', 'Complete 4 cardio sessions: 3 LISS + 1 HIIT.', 4, 4)
ON CONFLICT DO NOTHING;
