export type Phase = 1 | 2 | 3 | 4

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite'
export type Equipment = 'full_gym' | 'full_gym_sprint' | 'dumbbells_only' | 'barbells_dumbbells' | 'bodyweight'
export type SessionType = 'strength_a' | 'strength_b' | 'strength_c' | 'strength_d' | 'strength_e' | 'arms_core' | 'speed' | 'swimming' | 'jump_rope' | 'mobility' | 'rest' | 'active_recovery' | 'custom'
export type Sex = 'male' | 'female' | 'other'
export type UnitPreference = 'metric' | 'imperial'
export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'expired'
export type Language = 'en' | 'es'
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export interface Profile {
  id: string
  name: string
  age: number
  sex: Sex
  height_cm: number
  weight_kg: number
  fitness_level: FitnessLevel
  equipment: Equipment
  goals: string[]
  training_days_per_week: number
  training_days: DayOfWeek[]
  physical_job: boolean
  physical_job_days: DayOfWeek[]
  sport_days: DayOfWeek[]
  sport_name: string
  current_week: number
  unit_preference: UnitPreference
  language: Language
  trial_start: string
  subscription_status: SubscriptionStatus
  stripe_customer_id: string | null
  created_at: string
  onboarding_complete: boolean
  custom_schedule: Record<string, number | null> | null
  week_started_at: string | null
}

export interface WorkoutSession {
  id: string
  user_id: string
  date: string
  week_number: number
  phase: Phase
  workout_day_id: number
  workout_name: string
  completed_at: string | null
  duration_minutes: number | null
  total_sets: number
}

export interface ExerciseLog {
  id: string
  session_id: string
  exercise_name: string
  set_number: number
  weight: number | null
  reps: number | null
  feel_rating: number | null
  notes: string
  completed: boolean
}

export interface BodyMeasurement {
  id: string
  user_id: string
  date: string
  bodyweight: number | null
  waist: number | null
  chest: number | null
  arm_left: number | null
  arm_right: number | null
  quad_left: number | null
  quad_right: number | null
  calf_left: number | null
  calf_right: number | null
}

export interface FoodLog {
  id: string
  user_id: string
  date: string
  meal_type: string
  description: string
  calories: number | null
  protein: number | null
  created_at: string
}

export interface CardioLog {
  id: string
  user_id: string
  date: string
  cardio_type: string
  duration_minutes: number
  steps: number | null
  notes: string
}

export interface DecompressionLog {
  id: string
  user_id: string
  date: string
  type: 'morning' | 'night'
  items_completed: string[]
  completed_at: string
}

export interface PRShare {
  id: string
  user_id: string
  username: string
  exercise_name: string
  weight: number
  reps: number
  shared_at: string
}

export interface WeeklyChallenge {
  id: string
  week_start: string
  title: string
  description: string
  target_sessions: number
  target_cardio: number
}

// Workout data types
export interface PhaseTarget {
  sets: number
  repsMin: number
  repsMax: number
  isDropset?: boolean
  note?: string
}

export interface Substitute {
  nameKey: string
  explanationKey: string
}

export interface Exercise {
  id: string
  nameKey: string
  muscleTargetKey: string
  isKey: boolean
  phaseTargets: { phase1: PhaseTarget; phase2: PhaseTarget; phase3: PhaseTarget; phase4: PhaseTarget }
  restSeconds: number
  whyKey: string
  substitutes: Substitute[]
  isTimeBased?: boolean
}

export interface WorkoutDay {
  id: number
  nameKey: string
  sessionWhyKey: string
  phaseNoteKey: string
  exercises: Exercise[]
  everyOtherWeek?: boolean
}

// Active workout state
export interface ActiveSet {
  setNumber: number
  weight: string
  reps: string
  notes: string
  completed: boolean
}

export interface ActiveExercise {
  exerciseId: string
  sets: ActiveSet[]
  substitutedWith?: string
}

export interface ActiveWorkout {
  dayId: number
  sessionId: string | null
  startTime: Date
  exercises: ActiveExercise[]
  currentExerciseIndex: number
  isComplete: boolean
}

// Nutrition
export interface NutritionTargets {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface JournalEntry {
  id: string
  user_id: string
  date: string
  energy: number | null
  mood: number | null
  sleep_hours: number | null
  sleep_quality: number | null
  stress: number | null
  morning_weight: number | null
  water_litres: number | null
  protein_hit: boolean | null
  pain_notes: string
  one_win: string
  one_improve: string
  daily_intention: string
  free_write: string
  created_at: string
}

export interface SpeedLog {
  id: string
  user_id: string
  date: string
  week_number: number
  phase: Phase
  sprint_20m_times: number[]
  sprint_60m_times: number[]
  broad_jump_distances: number[]
  pro_agility_times: number[]
  t_drill_times: number[]
  notes: string
  completed_at: string
}

export interface SwimLog {
  id: string
  user_id: string
  date: string
  total_laps: number
  distance_metres: number
  duration_minutes: number
  sets_completed: string[]
  notes: string
  created_at: string
}

export interface JumpRopeLog {
  id: string
  user_id: string
  date: string
  week_number: number
  rounds_completed: number
  total_duration_minutes: number
  created_at: string
}

export interface ScheduledSession {
  id: string
  user_id: string
  date: string
  session_type: SessionType
  custom_name: string | null
  workout_day_id: number | null
  completed: boolean
  created_at: string
}

export interface SupplementLog {
  id: string
  user_id: string
  date: string
  supplement_id: string
  taken: boolean
  created_at: string
}

