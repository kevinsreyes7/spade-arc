export const morningProtocol = [
  { id: 'cold_shower', icon: '❄️', titleKey: 'protocol.morning.cold_shower.title', descKey: 'protocol.morning.cold_shower.desc' },
  { id: 'sunlight', icon: '☀️', titleKey: 'protocol.morning.sunlight.title', descKey: 'protocol.morning.sunlight.desc' },
  { id: 'dead_hang_am', icon: '🏋️', titleKey: 'protocol.morning.dead_hang.title', descKey: 'protocol.morning.dead_hang.desc' },
  { id: 'cat_cow_am', icon: '🐱', titleKey: 'protocol.morning.cat_cow.title', descKey: 'protocol.morning.cat_cow.desc' },
  { id: 'childs_pose_am', icon: '🧘', titleKey: 'protocol.morning.childs_pose.title', descKey: 'protocol.morning.childs_pose.desc' },
  { id: 'hip_flexor_am', icon: '🦵', titleKey: 'protocol.morning.hip_flexor.title', descKey: 'protocol.morning.hip_flexor.desc' },
  { id: 'vacuum', icon: '💨', titleKey: 'protocol.morning.vacuum.title', descKey: 'protocol.morning.vacuum.desc' },
  { id: 'breakfast', icon: '🥚', titleKey: 'protocol.morning.breakfast.title', descKey: 'protocol.morning.breakfast.desc' },
]

export const nightProtocol = [
  { id: 'dead_hang_pm', icon: '🏋️', titleKey: 'protocol.night.dead_hang.title', descKey: 'protocol.night.dead_hang.desc' },
  { id: 'cat_cow_pm', icon: '🐱', titleKey: 'protocol.night.cat_cow.title', descKey: 'protocol.night.cat_cow.desc' },
  { id: 'childs_pose_pm', icon: '🧘', titleKey: 'protocol.night.childs_pose.title', descKey: 'protocol.night.childs_pose.desc' },
  { id: 'hip_flexor_pm', icon: '🦵', titleKey: 'protocol.night.hip_flexor.title', descKey: 'protocol.night.hip_flexor.desc' },
  { id: 'magnesium', icon: '💊', titleKey: 'protocol.night.magnesium.title', descKey: 'protocol.night.magnesium.desc' },
  { id: 'temperature', icon: '🌡️', titleKey: 'protocol.night.temperature.title', descKey: 'protocol.night.temperature.desc' },
  { id: 'no_screens', icon: '📵', titleKey: 'protocol.night.no_screens.title', descKey: 'protocol.night.no_screens.desc' },
  { id: 'casein', icon: '🍶', titleKey: 'protocol.night.casein.title', descKey: 'protocol.night.casein.desc' },
]

export const supplements = [
  { id: 'creatine', titleKey: 'supplements.creatine.title', descKey: 'supplements.creatine.desc', dose: '5g', timing: '' },
  { id: 'whey', titleKey: 'supplements.whey.title', descKey: 'supplements.whey.desc', dose: '', timing: '' },
  { id: 'vitamin_d', titleKey: 'supplements.vitamin_d.title', descKey: 'supplements.vitamin_d.desc', dose: '5000IU', timing: '' },
  { id: 'magnesium', titleKey: 'supplements.magnesium.title', descKey: 'supplements.magnesium.desc', dose: '400mg', timing: 'At night' },
  { id: 'omega3', titleKey: 'supplements.omega3.title', descKey: 'supplements.omega3.desc', dose: '2–3g', timing: '' },
  { id: 'zinc', titleKey: 'supplements.zinc.title', descKey: 'supplements.zinc.desc', dose: '30mg', timing: '' },
  { id: 'ashwagandha', titleKey: 'supplements.ashwagandha.title', descKey: 'supplements.ashwagandha.desc', dose: '600mg', timing: '' },
  { id: 'collagen', titleKey: 'supplements.collagen.title', descKey: 'supplements.collagen.desc', dose: '', timing: '30 min pre-training' },
]

export const warmupProtocols = [
  {
    id: 'upper',
    nameKey: 'warmup.upper.name',
    durationMins: 7,
    steps: [
      { id: 'bike_u', name: 'Bike or treadmill', duration: '3–5 min' },
      { id: 'arm_circles', name: 'Arm circles', duration: 'x20 forward + back' },
      { id: 'pull_aparts', name: 'Band pull-aparts', duration: 'x20' },
      { id: 'dead_hang_w', name: 'Dead hang', duration: '30 sec' },
      { id: 'face_pulls_w', name: 'Band face pulls', duration: 'x15' },
      { id: 'pushup_w', name: 'Push-up slow', duration: 'x15' },
      { id: 'shoulder_rot', name: 'Shoulder rotation with band', duration: 'x10' },
    ],
  },
  {
    id: 'lower',
    nameKey: 'warmup.lower.name',
    durationMins: 8,
    steps: [
      { id: 'bike_l', name: 'Bike or treadmill', duration: '3–5 min' },
      { id: 'hip_circles', name: 'Hip circles', duration: 'x10 each leg' },
      { id: 'bw_squat', name: 'Bodyweight squat slow', duration: 'x15' },
      { id: 'walking_lunge', name: 'Walking lunge', duration: 'x10 each' },
      { id: 'glute_bridge', name: 'Glute bridge', duration: 'x20' },
      { id: 'hip_flexor_w', name: 'Hip flexor lunge stretch', duration: '30 sec each' },
      { id: 'bw_rdl', name: 'Bodyweight RDL', duration: 'x10 slow' },
    ],
  },
  {
    id: 'full',
    nameKey: 'warmup.full.name',
    durationMins: 9,
    steps: [
      { id: 'bike_f', name: 'Bike or treadmill', duration: '3–5 min' },
      { id: 'pull_aparts_f', name: 'Band pull-aparts', duration: 'x20' },
      { id: 'hip_circles_f', name: 'Hip circles', duration: 'x10 each' },
      { id: 'dead_hang_f', name: 'Dead hang', duration: '30 sec' },
      { id: 'bw_squat_f', name: 'Bodyweight squat', duration: 'x15' },
      { id: 'pushup_f', name: 'Push-up', duration: 'x15' },
      { id: 'glute_bridge_f', name: 'Glute bridge', duration: 'x15' },
      { id: 'hip_flexor_f', name: 'Hip flexor stretch', duration: '30 sec each' },
    ],
  },
]

export const cooldownSteps = [
  { id: 'easy_bike', name: 'Easy bike', duration: '3 min' },
  { id: 'dead_hang_c', name: 'Dead hang', duration: '45 sec × 2' },
  { id: 'hip_flexor_c', name: 'Hip flexor lunge stretch', duration: '45 sec each side' },
  { id: 'doorway_chest', name: 'Doorway chest stretch', duration: '30 sec each side' },
  { id: 'childs_pose_c', name: "Child's pose", duration: '45 sec' },
  { id: 'cat_cow_c', name: 'Cat-cow', duration: 'x10 slow' },
]

export const speedDayProtocol = {
  neuralWarmup: [
    { id: 'easy_jog', name: 'Easy jog', detail: '400m' },
    { id: 'a_skips', name: 'A-Skips', detail: '20m' },
    { id: 'b_skips', name: 'B-Skips', detail: '20m' },
    { id: 'high_knees', name: 'High Knees', detail: '20m' },
    { id: 'butt_kicks', name: 'Butt Kicks', detail: '20m' },
    { id: 'lat_shuffle', name: 'Lateral Shuffle', detail: '10m each direction' },
    { id: 'jump_rope_warm', name: 'Jump Rope', detail: '3 min easy' },
    { id: 'buildup_runs', name: '3 × 30m Build-Up Runs', detail: '60% → 80% → 95%' },
  ],
  acceleration: {
    sets20m: { reps: 10, restSeconds: 90, label: '20m sprint (standing start)' },
    sets10m: { reps: 6, restSeconds: 60, label: '10m sprint (push-up start)' },
  },
  maxVelocity: {
    sets60m: { reps: 4, restSeconds: 180, label: '60m at 95–100% max' },
    sets40m: { reps: 3, restSeconds: 180, label: '40m flying sprint' },
  },
  explosivePower: [
    { id: 'box_jump', name: 'Box Jump', sets: 4, reps: 5, inputType: 'none' as const },
    { id: 'broad_jump', name: 'Broad Jump', sets: 3, reps: 3, inputType: 'distance' as const },
    { id: 'single_leg_hop', name: 'Single-Leg Hop', sets: 3, reps: 5, inputType: 'none' as const, perLeg: true },
    { id: 'med_ball_slam', name: 'Med Ball Slam', sets: 3, reps: 8, inputType: 'none' as const },
  ],
  agility: [
    { id: 'pro_agility', name: 'Pro Agility (5-10-5)', sets: 6, inputType: 'time' as const },
    { id: 't_drill', name: 'T-Drill', sets: 4, inputType: 'time' as const },
    { id: 'cone_weave', name: 'Cone Weave', sets: 6, inputType: 'time' as const },
  ],
}

export const jumpRopeProtocolByWeek = (week: number): { rounds: number; workSeconds: number; restSeconds: number; description: string } => {
  if (week <= 4) return { rounds: 5, workSeconds: 60, restSeconds: 60, description: 'Basic rhythm — single unders' }
  if (week <= 8) return { rounds: 6, workSeconds: 60, restSeconds: 45, description: 'Speed variations — alternating feet' }
  if (week <= 12) return { rounds: 7, workSeconds: 45, restSeconds: 30, description: 'Double unders — attempt every round' }
  return { rounds: 8, workSeconds: 30, restSeconds: 20, description: 'HIIT — max effort bursts' }
}

export const swimmingProtocol = [
  { id: 'warmup_swim', name: '200m Warmup', detail: 'Easy freestyle — build pace', laps: 4 },
  { id: 'freestyle_50', name: '4 × 50m Freestyle', detail: 'Moderate effort — 30s rest between', laps: 8 },
  { id: 'backstroke_25', name: '4 × 25m Backstroke', detail: 'Focus on form — 20s rest', laps: 4 },
  { id: 'freestyle_100', name: '2 × 100m Freestyle', detail: 'Strong effort — 60s rest', laps: 4 },
  { id: 'cooldown_swim', name: '100m Cooldown', detail: 'Easy pace, any stroke', laps: 2 },
]

export const dailyQuotes = [
  'The physique is built in the dark, before the world wakes up.',
  'Discipline is choosing between what you want now and what you want most.',
  'You do not rise to the level of your goals. You fall to the level of your systems.',
  'The body achieves what the mind believes.',
  'Every rep is a vote for who you are becoming.',
  'Pain is temporary. The physique is permanent.',
  'No mirror reflects hard work.',
  'The arc is long. Stay the course.',
  'Standards are permanent. Motivation is temporary.',
  'Build in silence. Let the physique speak.',
  'Rest is part of the program. Recovery is progress.',
  'The V-taper is earned set by set.',
  'Wide back. Tiny waist. That is the mission.',
  'You are either building or decaying. There is no pause.',
  'Champions train. Everyone else exercises.',
  'The body you want is on the other side of the discomfort you avoid.',
  'Iron forges iron. Consistency forges physiques.',
  'Your only competition is who you were yesterday.',
  'No shortcuts. Just standards.',
  'Elite is a standard, not a destination.',
]
