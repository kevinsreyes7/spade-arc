import type { DayOfWeek, Profile } from '@/types'
import { workouts } from '@/data/workouts'

const DAY_ORDER: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
}

export interface ScheduleDay {
  dayOfWeek: DayOfWeek
  label: string
  type: 'workout' | 'rest' | 'sport' | 'cardio'
  workoutDayId?: number
  workoutNameKey?: string
  isToday: boolean
  isCompleted?: boolean
}

function getTodayDow(): DayOfWeek {
  const idx = new Date().getDay() // 0=Sun
  const map: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  return map[idx]
}

export function buildWeekSchedule(profile: Profile, currentWeek: number): ScheduleDay[] {
  const todayDow = getTodayDow()
  const trainingDays = profile.training_days ?? []
  const sportDays = profile.sport_days ?? []
  const isEvenWeek = currentWeek % 2 === 0

  // Sort training days in calendar order
  const sortedTraining = [...trainingDays].sort(
    (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)
  )

  // Map workout IDs to training days
  const workoutAssignments: Record<DayOfWeek, number> = {} as Record<DayOfWeek, number>
  sortedTraining.forEach((dow, i) => {
    const maxWorkoutDay = Math.min(sortedTraining.length, workouts.length - 1)
    const workoutId = i + 1
    if (workoutId <= maxWorkoutDay) {
      workoutAssignments[dow] = workoutId
    }
    // Day 6 assignment on odd weeks for 6-day programmes
    if (sortedTraining.length === 6 && workoutId === 6 && isEvenWeek) {
      // Even weeks: skip day 6, make it rest
      delete workoutAssignments[dow]
    }
  })

  return DAY_ORDER.map((dow) => {
    const isSportDay = sportDays.includes(dow)
    const workoutDayId = workoutAssignments[dow]
    const isTraining = workoutDayId !== undefined
    const workout = isTraining ? workouts.find((w) => w.id === workoutDayId) : undefined

    let type: ScheduleDay['type'] = 'rest'
    if (isTraining) type = 'workout'
    else if (isSportDay) type = 'sport'

    return {
      dayOfWeek: dow,
      label: DAY_LABELS[dow],
      type,
      workoutDayId: workout?.id,
      workoutNameKey: workout?.nameKey,
      isToday: dow === todayDow,
    }
  })
}

export function getTodayWorkout(profile: Profile, currentWeek: number) {
  const schedule = buildWeekSchedule(profile, currentWeek)
  return schedule.find((d) => d.isToday)
}

export function getNutritionTargets(profile: Profile, isTrainingDay: boolean, phase: number) {
  const weightLbs = profile.unit_preference === 'imperial'
    ? profile.weight_kg
    : profile.weight_kg * 2.20462

  const isLeanBulk = phase <= 2
  const calMultiplierMin = isLeanBulk ? 16 : 13
  const calMultiplierMax = isLeanBulk ? 18 : 15
  const calories = Math.round(weightLbs * ((calMultiplierMin + calMultiplierMax) / 2))

  const protein = Math.round(weightLbs)

  let carbRatio: number
  let fatRatio: number

  if (isTrainingDay) {
    carbRatio = 0.35
    fatRatio = 0.25
  } else {
    carbRatio = 0.25
    fatRatio = 0.35
  }

  const nonProteinCals = calories - Math.round(protein * 4)
  const carbs = Math.round((nonProteinCals * carbRatio) / 4)
  const fat = Math.round((nonProteinCals * fatRatio) / 9)

  return { calories, protein, carbs, fat }
}
