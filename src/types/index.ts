export type Phase = 1 | 2 | 3 | 4

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced'
export type Equipment = 'full_gym' | 'dumbbells_only' | 'barbells_dumbbells' | 'bodyweight'
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
  feelRating: number
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
