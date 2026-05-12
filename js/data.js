// ═══════════════════════════════════════════
// SPADE ARC — Hardcoded Program Data
// ═══════════════════════════════════════════

const PHASE_TEXT = {
  1: 'Phase I — Foundation: 10–15 reps · 3–4 sets · 60–90s rest. Use weights where last 2 reps are hard but form stays perfect. This phase builds motor patterns and base mass.',
  2: 'Phase II — Development: 7–10 reps · 4 sets · 90–120s rest. Heavier loads. Bridge between hypertrophy and strength. Mind-muscle connection at heavier weights.',
  3: 'Phase III — Strength: 3–6 reps · 5 sets · 2–3 min rest. Low reps, heavy load on compounds. Neural efficiency. Begin lean cut.',
  4: 'Phase IV — Peak & Cut: 8–12 reps · Drop sets, rest-pause, supersets. Maximum fat loss phase.',
};

const CHECKLIST_ITEMS = [
  { id: 'cold_shower',    label: 'Cold shower · 3–5 minutes' },
  { id: 'sunlight',       label: 'Sunlight · 10–15 minutes outdoors' },
  { id: 'jump_rope',      label: 'Jump rope · 5–10 minutes' },
  { id: 'decompression_am', label: 'Spinal decompression AM stack' },
  { id: 'vacuum',         label: 'Vacuum breathing · 5 sets' },
  { id: 'training',       label: 'Training session completed and logged' },
  { id: 'protein',        label: 'Protein target hit · 1g per lb bodyweight' },
  { id: 'steps',          label: '8,000–12,000 steps' },
  { id: 'decompression_pm', label: 'Spinal decompression PM stack' },
  { id: 'night_protocol', label: 'Night protocol executed' },
  { id: 'journal',        label: 'Journal entry written' },
  { id: 'sleep_target',   label: 'Sleep 8–9 hours target set' },
];

const KEY_EXERCISES = [
  'Barbell Back Squat',
  'Romanian Deadlift',
  'Weighted Pull-Up',
  'Incline Barbell Press',
  'Seated DB Overhead Press',
  'Barbell Hip Thrust',
];

const WORKOUTS = {
  mon: {
    title: 'Monday — Back Width + Rear Chain',
    focus: 'Lats · Rear Delts · Mid Traps · V-Taper Foundation',
    note: 'Gym-only movements. All corrective work done at home morning/night.',
    exercises: [
      { name: 'Weighted Pull-Up', key: true, sets: 4, reps: '10–12', rest: '90s', notes: 'Full dead hang. Depress scapula at top.' },
      { name: 'Cable Straight-Arm Pulldown', key: false, sets: 3, reps: '12–15', rest: '60s', notes: 'Rope or bar. Full lat stretch.' },
      { name: 'Chest-Supported T-Bar Row', key: true, sets: 4, reps: '12', rest: '75s', notes: 'Elbows flared 45°. 1-sec squeeze at top.' },
      { name: 'Face Pulls (cable, rope)', key: false, sets: 4, reps: '15–20', rest: '60s', notes: 'Pull to nose height. Externally rotate.' },
      { name: 'Single-Arm Cable Row (low)', key: false, sets: 3, reps: '12–15', rest: '75s', notes: 'Lean away. Max stretch at bottom.' },
      { name: 'Cable Rear Delt Row (wide grip)', key: false, sets: 3, reps: '15', rest: '60s', notes: 'Elbows flared high.' },
    ]
  },
  tue: {
    title: 'Tuesday — Legs Quad Dominant',
    focus: 'Quads · Glutes · Calves · Core',
    note: 'Highest carb day of the week. Fuel this session properly.',
    exercises: [
      { name: 'Barbell Back Squat', key: true, sets: 4, reps: '12–15', rest: '90s', notes: 'High bar, upright torso. Full depth. Knees out.' },
      { name: 'Hack Squat Machine', key: false, sets: 4, reps: '12–15', rest: '75s', notes: 'Feet low and narrow for quad emphasis.' },
      { name: 'Bulgarian Split Squat', key: true, sets: 3, reps: '12 each', rest: '75s', notes: 'Upright torso. Quad focus.' },
      { name: 'Leg Extension (slow eccentric)', key: false, sets: 4, reps: '12–15', rest: '60s', notes: '3-sec lowering. Peak contraction at top.' },
      { name: 'Standing Calf Raise (heavy)', key: false, sets: 4, reps: '12–15', rest: '75s', notes: 'Full stretch at bottom. 1-sec pause at top.' },
      { name: 'Ab Wheel Rollout', key: false, sets: 3, reps: '10–12', rest: '75s', notes: 'Spine neutral. No hip sag.' },
    ]
  },
  wed: {
    title: 'Wednesday — Chest + Arms',
    focus: 'Upper Chest · Triceps · Biceps',
    note: 'No oblique work ever. No woodchops, no weighted side bends.',
    exercises: [
      { name: 'Incline Barbell Press', key: true, sets: 4, reps: '10–12', rest: '90s', notes: '30–45° incline. Touch bar to upper chest.' },
      { name: 'Incline DB Fly', key: false, sets: 3, reps: '12–15', rest: '60s', notes: 'Wide arc. Feel the stretch at bottom.' },
      { name: 'Cable Crossover (high-to-low)', key: false, sets: 3, reps: '12–15', rest: '60s', notes: 'Squeeze at bottom. Lean slightly forward.' },
      { name: 'Close-Grip Bench Press', key: false, ss: true, sets: 3, reps: '10–12', rest: '—', notes: 'Superset with next. Elbows tucked.' },
      { name: 'Overhead Cable Tricep Ext.', key: false, ss: true, sets: 3, reps: '12–15', rest: '90s', notes: 'Full overhead stretch.' },
      { name: 'Incline DB Curl', key: false, ss: true, sets: 3, reps: '12', rest: '—', notes: 'Superset with next. Arm behind body.' },
      { name: 'Hammer Curl', key: false, ss: true, sets: 3, reps: '12', rest: '90s', notes: 'Neutral grip. Slow eccentric.' },
    ]
  },
  thu: {
    title: 'Thursday — Rest / Swim Day',
    focus: 'Active Recovery · Spinal Decompression · Swimming',
    note: 'This is not a wasted day. Recovery is when you grow.',
    rest: true,
    activities: [
      { icon: '🏊', text: 'Swimming session 30–45 minutes' },
      { icon: '🌅', text: 'Full AM spinal decompression stack' },
      { icon: '🌙', text: 'Full PM spinal decompression stack' },
      { icon: '👣', text: '8,000–12,000 steps daily walk' },
      { icon: '🧖', text: 'Sauna if available · 15–20 minutes' },
      { icon: '🥶', text: 'Contrast therapy hot/cold alternating' },
      { icon: '💨', text: 'Vacuum breathing · 5 sets morning' },
      { icon: '📓', text: 'Journal entry — review week progress' },
      { icon: '📊', text: 'WHOOP review — check recovery trend' },
    ]
  },
  fri: {
    title: 'Friday — Legs Posterior Chain',
    focus: 'Hamstrings · Glutes · Calves',
    note: 'Second highest carb day. Full recovery from Tuesday required.',
    exercises: [
      { name: 'Romanian Deadlift', key: true, sets: 4, reps: '10–12', rest: '90s', notes: 'Bar close to legs. Deep hinge. Long stretch.' },
      { name: 'Leg Curl Unilateral (lying)', key: false, sets: 4, reps: '12–15 each', rest: '60s', notes: 'Plantarflex at peak. Slow lower.' },
      { name: 'Barbell Hip Thrust', key: true, sets: 4, reps: '12–15', rest: '75s', notes: 'Full lockout. Ribs down. 1-sec pause at top.' },
      { name: 'Good Morning (moderate)', key: false, sets: 3, reps: '12', rest: '75s', notes: 'Spine neutral. Controlled.' },
      { name: 'Seated Calf Raise', key: false, sets: 4, reps: '15–20', rest: '60s', notes: 'Full stretch at bottom. Slow tempo.' },
      { name: 'Hanging Leg Raise', key: false, sets: 3, reps: '12–15', rest: '60s', notes: 'Posterior pelvic tilt at top. No swing.' },
    ]
  },
  sat: {
    title: 'Saturday — Shoulders + Back Thickness',
    focus: 'Delts · Traps · Rows',
    note: 'Shoulder width creates the V-taper from the top.',
    exercises: [
      { name: 'Seated DB Overhead Press', key: true, sets: 4, reps: '10–12', rest: '90s', notes: 'Press in front of face. No lower back arch.' },
      { name: 'Cable Lateral Raise (unilateral)', key: false, sets: 4, reps: '12–15', rest: '60s', notes: 'Cable behind body. Slight lean. Pure tension.' },
      { name: 'Barbell Row (overhand, 45°)', key: false, sets: 4, reps: '10–12', rest: '90s', notes: 'Pull to lower chest. Squeeze mid-back.' },
      { name: 'Meadows Row', key: false, sets: 3, reps: '12 each', rest: '75s', notes: 'High elbow. Pull toward hip.' },
      { name: 'Rear Delt Cable Fly', key: false, sets: 4, reps: '15', rest: '60s', notes: 'Cables crossed. Straight arms.' },
      { name: 'DB Shrug (neutral grip)', key: false, sets: 4, reps: '12–15', rest: '60s', notes: 'Hold 1 sec at top. Don\'t roll shoulders.' },
      { name: 'Weighted Plank', key: false, sets: 3, reps: '35–45s', rest: '60s', notes: 'Plate on back. Ribs in. Spine rigid.' },
    ]
  },
  sun: {
    title: 'Sunday — Arms + Abs (Biweekly)',
    focus: 'Arms · Core · Vacuum',
    note: 'Every other week. On off weeks — full rest or swim only.',
    exercises: [
      { name: 'EZ-Bar Preacher Curl', key: false, sets: 3, reps: '12–15', rest: '75s', notes: 'Full extension. No momentum.' },
      { name: 'Cable Curl (low, supinated)', key: false, sets: 3, reps: '12–15', rest: '60s', notes: 'Pinkies up at top. Peak squeeze.' },
      { name: 'Skull Crusher (EZ-bar)', key: false, sets: 3, reps: '12–15', rest: '75s', notes: 'Lower to forehead. Elbows fixed.' },
      { name: 'Cable Pushdown (rope)', key: false, sets: 3, reps: '15', rest: '60s', notes: 'Spread rope at bottom. Full lockout.' },
      { name: 'Cable Crunch (kneeling)', key: false, sets: 4, reps: '12–15', rest: '60s', notes: 'Round spine. Ribs to hips.' },
      { name: 'Hanging Leg Raise', key: false, sets: 3, reps: '12–15', rest: '60s', notes: 'Posterior pelvic tilt. Controlled.' },
    ]
  },
};

const WEEK_SCHEDULE = [
  { week: 1,  phase: 1, focus: 'Foundation',  reps: '10–15', note: 'Learn movements' },
  { week: 2,  phase: 1, focus: 'Foundation',  reps: '10–15', note: 'Add load progressively' },
  { week: 3,  phase: 1, focus: 'Foundation',  reps: '10–15', note: 'Volume building' },
  { week: 4,  phase: 1, focus: 'Foundation',  reps: '10–15', note: 'Push intensity' },
  { week: 5,  phase: 1, focus: 'DELOAD',      reps: '10–15', note: '40% volume cut', deload: true },
  { week: 6,  phase: 2, focus: 'Development', reps: '7–10',  note: 'Heavier loads begin' },
  { week: 7,  phase: 2, focus: 'Development', reps: '7–10',  note: 'Mind-muscle at weight' },
  { week: 8,  phase: 2, focus: 'Development', reps: '7–10',  note: '1× HIIT added' },
  { week: 9,  phase: 2, focus: 'Development', reps: '7–10',  note: 'Max volume push' },
  { week: 10, phase: 2, focus: 'DELOAD',      reps: '7–10',  note: '40% volume cut', deload: true },
  { week: 11, phase: 3, focus: 'Strength',    reps: '3–6',   note: 'Heavy compounds begin' },
  { week: 12, phase: 3, focus: 'Strength',    reps: '3–6',   note: 'Begin deficit eating' },
  { week: 13, phase: 3, focus: 'Strength',    reps: '3–6',   note: 'Neural efficiency focus' },
  { week: 14, phase: 3, focus: 'Strength',    reps: '3–6',   note: '2× HIIT added' },
  { week: 15, phase: 3, focus: 'DELOAD',      reps: '3–6',   note: '40% volume cut', deload: true },
  { week: 16, phase: 4, focus: 'Peak & Cut',  reps: '8–12',  note: 'Drop sets introduced' },
  { week: 17, phase: 4, focus: 'Peak & Cut',  reps: '8–12',  note: 'Rest-pause sets' },
  { week: 18, phase: 4, focus: 'Peak & Cut',  reps: '8–12',  note: 'Supersets everywhere' },
  { week: 19, phase: 4, focus: 'Peak & Cut',  reps: '8–12',  note: 'Max fat loss push' },
  { week: 20, phase: 4, focus: 'PEAK',        reps: '8–12',  note: 'Final form. Apex.', peak: true },
];

const PHASE_COLORS = { 1: '#4a6fa5', 2: '#7b9fd4', 3: '#c8d4f0', 4: '#f0c040' };
const PHASE_NAMES  = { 1: 'Foundation', 2: 'Development', 3: 'Strength', 4: 'Peak & Cut' };
