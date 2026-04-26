import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/context/AuthContext'
import { useProfile } from '@/context/ProfileContext'
import { supabase } from '@/lib/supabase'
import type { DayOfWeek, Equipment, FitnessLevel, Sex, UnitPreference } from '@/types'
import { Account } from './Account'
import { AboutYou } from './AboutYou'
import { Goals } from './Goals'
import { Schedule } from './Schedule'
import { GymEquipment } from './GymEquipment'
import { FitnessLevel as FitnessLevelStep } from './FitnessLevel'
import { PhysicalLife } from './PhysicalLife'
import { Ready } from './Ready'

interface OnboardingState {
  name: string
  age: string
  sex: Sex | ''
  heightCm: string
  weightKg: string
  units: UnitPreference
  goals: string[]
  daysPerWeek: number
  trainingDays: DayOfWeek[]
  equipment: Equipment | ''
  fitnessLevel: FitnessLevel | ''
  physicalJob: boolean
  physicalJobDays: DayOfWeek[]
  hasSport: boolean
  sportDays: DayOfWeek[]
  sportName: string
}

type Step = 'account' | 'about' | 'goals' | 'schedule' | 'gym' | 'level' | 'physical' | 'ready'
const STEPS: Step[] = ['account', 'about', 'goals', 'schedule', 'gym', 'level', 'physical', 'ready']

export function OnboardingFlow() {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [step, setStep] = useState<Step>('account')
  const { refresh } = useProfile()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // If user already has an account (e.g. page refresh mid-onboarding),
  // skip the account creation step
  useEffect(() => {
    if (user && step === 'account') {
      setStep('about')
    }
  }, [user, step])
  const [state, setState] = useState<OnboardingState>({
    name: '', age: '', sex: '', heightCm: '', weightKg: '',
    units: 'metric', goals: [], daysPerWeek: 4, trainingDays: [],
    equipment: '', fitnessLevel: '', physicalJob: false,
    physicalJobDays: [], hasSport: false, sportDays: [], sportName: '',
  })

  const update = (updates: Partial<OnboardingState>) =>
    setState((s) => ({ ...s, ...updates }))

  const next = () => {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
  }

  const back = () => {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
    else navigate('/')
  }

  const handleEnter = async () => {
    if (!user) {
      setSaveError('No user session found. Please sign out and try again.')
      return
    }
    setSaving(true)
    setSaveError('')

    const heightCm = state.units === 'metric'
      ? parseFloat(state.heightCm)
      : parseFloat(state.heightCm) * 30.48

    const weightKg = state.units === 'metric'
      ? parseFloat(state.weightKg)
      : parseFloat(state.weightKg) / 2.20462

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      name: state.name,
      age: parseInt(state.age),
      sex: state.sex,
      height_cm: heightCm,
      weight_kg: weightKg,
      unit_preference: state.units,
      goals: state.goals,
      training_days_per_week: state.daysPerWeek,
      training_days: state.trainingDays,
      equipment: state.equipment,
      fitness_level: state.fitnessLevel,
      physical_job: state.physicalJob,
      physical_job_days: state.physicalJobDays,
      sport_days: state.sportDays,
      sport_name: state.sportName,
      current_week: 1,
      language: 'en',
      trial_start: new Date().toISOString(),
      subscription_status: 'trial',
      onboarding_complete: true,
    })

    if (error) {
      console.error('Profile save error:', error)
      setSaveError(`Failed to save profile: ${error.message}`)
      setSaving(false)
      return
    }

    // Refresh ProfileContext so AuthGuard sees onboarding_complete = true
    await refresh()
    setSaving(false)
    navigate('/home')
  }

  // Step-based account (special — uses its own next)
  if (step === 'account') {
    return <Account onNext={next} />
  }

  if (step === 'about') {
    return (
      <AboutYou
        data={{
          name: state.name, age: state.age, sex: state.sex as Sex,
          heightCm: state.heightCm, weightKg: state.weightKg, units: state.units,
        }}
        onChange={update}
        onNext={next}
        onBack={back}
      />
    )
  }

  if (step === 'goals') {
    return <Goals selected={state.goals} onChange={(goals) => update({ goals })} onNext={next} onBack={back} />
  }

  if (step === 'schedule') {
    return (
      <Schedule
        daysPerWeek={state.daysPerWeek}
        trainingDays={state.trainingDays}
        onChange={update}
        onNext={next}
        onBack={back}
      />
    )
  }

  if (step === 'gym') {
    return (
      <GymEquipment
        selected={state.equipment}
        onChange={(equipment) => update({ equipment })}
        onNext={next}
        onBack={back}
      />
    )
  }

  if (step === 'level') {
    return (
      <FitnessLevelStep
        selected={state.fitnessLevel}
        onChange={(fitnessLevel) => update({ fitnessLevel })}
        onNext={next}
        onBack={back}
      />
    )
  }

  if (step === 'physical') {
    return (
      <PhysicalLife
        data={{
          physicalJob: state.physicalJob,
          physicalJobDays: state.physicalJobDays,
          hasSport: state.hasSport,
          sportDays: state.sportDays,
          sportName: state.sportName,
        }}
        onChange={update}
        onNext={next}
        onBack={back}
      />
    )
  }

  return (
    <Ready
      name={state.name}
      trainingDays={state.trainingDays}
      onEnter={handleEnter}
      loading={saving}
      error={saveError}
    />
  )
}
