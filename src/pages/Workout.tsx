import { useState, useCallback, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useProfile } from '@/context/ProfileContext'
import { useAuthContext } from '@/context/AuthContext'
import { workouts, getPhaseFromWeek } from '@/data/workouts'
import type { ActiveExercise, ActiveSet, Phase } from '@/types'
import { ExerciseCard } from '@/components/workout/ExerciseCard'
import { RestTimer } from '@/components/workout/RestTimer'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { getPhaseName } from '@/data/workouts'
import { supabase } from '@/lib/supabase'

function buildActiveExercises(workoutDayId: number, phase: Phase): ActiveExercise[] {
  const day = workouts.find((w) => w.id === workoutDayId)
  if (!day) return []
  return day.exercises.map((ex) => {
    const phaseKey = `phase${phase}` as 'phase1' | 'phase2' | 'phase3' | 'phase4'
    const target = ex.phaseTargets[phaseKey]
    const sets: ActiveSet[] = Array.from({ length: target.sets }, (_, i) => ({
      setNumber: i + 1,
      weight: '',
      reps: '',
      feelRating: 0,
      notes: '',
      completed: false,
    }))
    return { exerciseId: ex.id, sets }
  })
}

export function Workout() {
  const { dayId } = useParams<{ dayId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuthContext()
  const { profile } = useProfile()

  const currentWeek = profile?.current_week ?? 1
  const phase = getPhaseFromWeek(currentWeek)
  const workoutDay = workouts.find((w) => w.id === parseInt(dayId ?? '1', 10))

  const [exercises, setExercises] = useState<ActiveExercise[]>(() =>
    buildActiveExercises(parseInt(dayId ?? '1', 10), phase)
  )
  const [restTimer, setRestTimer] = useState<{ visible: boolean; seconds: number }>({
    visible: false,
    seconds: 90,
  })
  const [isComplete, setIsComplete] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const startTime = useRef(Date.now())

  const unitLabel = profile?.unit_preference === 'imperial' ? t('common.lbs') : t('common.kg')

  // Create session on mount
  useEffect(() => {
    if (!user || !workoutDay) return
    supabase.from('workout_sessions').insert({
      user_id: user.id,
      date: new Date().toISOString().split('T')[0],
      week_number: currentWeek,
      phase,
      workout_day_id: workoutDay.id,
      workout_name: workoutDay.nameKey,
      total_sets: 0,
    }).select().single().then(({ data }) => {
      if (data) setSessionId(data.id)
    })
  }, [])

  const updateSet = useCallback((
    exIndex: number,
    setIndex: number,
    updates: Record<string, string | number | boolean>
  ) => {
    setExercises((prev) => {
      const next = [...prev]
      next[exIndex] = {
        ...next[exIndex],
        sets: next[exIndex].sets.map((s, i) =>
          i === setIndex ? { ...s, ...updates } : s
        ),
      }
      return next
    })
  }, [])

  const completeSet = useCallback((exIndex: number, setIndex: number) => {
    const ex = workoutDay?.exercises[exIndex]
    setExercises((prev) => {
      const next = [...prev]
      const wasCompleted = next[exIndex].sets[setIndex].completed
      next[exIndex] = {
        ...next[exIndex],
        sets: next[exIndex].sets.map((s, i) =>
          i === setIndex ? { ...s, completed: !wasCompleted } : s
        ),
      }
      return next
    })

    // Start rest timer
    if (ex && !exercises[exIndex].sets[setIndex].completed) {
      setRestTimer({ visible: true, seconds: ex.restSeconds })
    }
  }, [workoutDay, exercises])

  const substituteExercise = useCallback((exIndex: number, subIndex: number) => {
    const ex = workoutDay?.exercises[exIndex]
    if (!ex) return
    const sub = ex.substitutes[subIndex]
    setExercises((prev) => {
      const next = [...prev]
      next[exIndex] = { ...next[exIndex], substitutedWith: sub.nameKey }
      return next
    })
  }, [workoutDay])

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
  const completedSets = exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.completed).length, 0)
  const allDone = completedSets === totalSets && totalSets > 0

  const handleComplete = async () => {
    if (!user || !sessionId) return
    const duration = Math.round((Date.now() - startTime.current) / 60000)

    await supabase.from('workout_sessions').update({
      completed_at: new Date().toISOString(),
      duration_minutes: duration,
      total_sets: completedSets,
    }).eq('id', sessionId)

    // Log exercise sets
    const logs = exercises.flatMap((ae, exIdx) => {
      const ex = workoutDay?.exercises[exIdx]
      return ae.sets.map((s) => ({
        session_id: sessionId,
        exercise_name: ae.substitutedWith ?? ex?.nameKey ?? '',
        set_number: s.setNumber,
        weight: s.weight ? parseFloat(s.weight) : null,
        reps: s.reps ? parseInt(s.reps) : null,
        feel_rating: s.feelRating || null,
        notes: s.notes,
        completed: s.completed,
      }))
    })

    await supabase.from('exercise_logs').insert(logs)
    setIsComplete(true)
  }

  const handleExit = async (save: boolean) => {
    if (save && user && sessionId) {
      await supabase.from('workout_sessions').update({
        total_sets: completedSets,
      }).eq('id', sessionId)
    } else if (!save && sessionId) {
      await supabase.from('workout_sessions').delete().eq('id', sessionId)
    }
    navigate('/home')
  }

  if (!workoutDay) {
    return <div className="flex items-center justify-center min-h-screen bg-bg text-textMuted">Workout not found</div>
  }

  // Session summary screen
  if (isComplete) {
    const duration = Math.round((Date.now() - startTime.current) / 60000)
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center w-full max-w-sm"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="text-6xl mb-4"
          >
            ♠
          </motion.div>
          <h1 className="font-display text-4xl text-accent tracking-wider mb-2">
            {t('workout.summary.title')}
          </h1>
          <p className="text-textMuted mb-8">{t(workoutDay.nameKey)}</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="font-mono text-3xl text-textPrimary">{duration}</p>
              <p className="text-xs text-textMuted mt-1">{t('workout.summary.minutes')}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="font-mono text-3xl text-textPrimary">{completedSets}</p>
              <p className="text-xs text-textMuted mt-1">{t('workout.summary.totalSets')}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button size="lg" fullWidth variant="secondary">
              {t('workout.summary.sharePR')}
            </Button>
            <Button size="lg" fullWidth onClick={() => navigate('/home')}>
              {t('workout.summary.backHome')}
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Fixed header */}
      <div className="sticky top-0 z-30 bg-bg/95 border-b border-border backdrop-blur-sm px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowExitConfirm(true)}
            className="p-2 -ml-2 text-textMuted hover:text-textPrimary transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex flex-col items-center">
            <h1 className="font-display text-xl text-textPrimary tracking-wider">
              {t(workoutDay.nameKey)}
            </h1>
            <Badge variant="phase" size="sm">{getPhaseName(phase)}</Badge>
          </div>
          <div className="text-xs font-mono text-textMuted">
            {completedSets}/{totalSets}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent rounded-full"
            animate={{ width: `${totalSets > 0 ? (completedSets / totalSets) * 100 : 0}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <div className="px-4 py-4 pb-32 flex flex-col gap-4 max-w-lg mx-auto">
        {/* Session WHY */}
        <Card className="bg-secondary/8 border-secondary/20">
          <p className="text-xs text-textMuted uppercase tracking-widest mb-1">{t('workout.sessionWhy')}</p>
          <p className="text-sm text-textMuted leading-relaxed">{t(workoutDay.sessionWhyKey)}</p>
        </Card>

        {/* Phase note */}
        <Card className="bg-accent/5 border-accent/15">
          <p className="text-xs text-accent/60 uppercase tracking-widest mb-1">{t('workout.phaseNote')}</p>
          <p className="text-sm text-textMuted leading-relaxed">{t(workoutDay.phaseNoteKey)}</p>
        </Card>

        {/* Exercise cards */}
        {workoutDay.exercises.map((exercise, exIdx) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            activeExercise={exercises[exIdx]}
            phase={phase}
            unitLabel={unitLabel}
            onUpdateSet={(setIdx, updates) => updateSet(exIdx, setIdx, updates)}
            onCompleteSet={(setIdx) => completeSet(exIdx, setIdx)}
            onSubstitute={(subIdx) => substituteExercise(exIdx, subIdx)}
          />
        ))}
      </div>

      {/* Complete button */}
      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-4 right-4 z-40 max-w-lg mx-auto"
          >
            <Button size="xl" fullWidth onClick={handleComplete}
              className="font-display text-xl tracking-widest shadow-glow-accent">
              {t('workout.completeSession')} ♠
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rest Timer */}
      <RestTimer
        visible={restTimer.visible}
        seconds={restTimer.seconds}
        onDone={() => setRestTimer((p) => ({ ...p, visible: false }))}
        onSkip={() => setRestTimer((p) => ({ ...p, visible: false }))}
      />

      {/* Exit confirm */}
      <AnimatePresence>
        {showExitConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 backdrop z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-6 top-1/2 -translate-y-1/2 z-50 bg-card border border-border rounded-2xl p-6 max-w-sm mx-auto"
            >
              <h3 className="font-display text-2xl text-textPrimary tracking-wide mb-2">
                {t('workout.exitConfirm')}
              </h3>
              <p className="text-textMuted text-sm mb-5">
                {t('workout.setsComplete', { done: completedSets, total: totalSets })}
              </p>
              <div className="flex flex-col gap-2">
                <Button size="md" fullWidth onClick={() => handleExit(true)}>
                  {t('workout.exitSave')}
                </Button>
                <Button size="md" fullWidth variant="ghost" onClick={() => handleExit(false)}>
                  {t('workout.exitDiscard')}
                </Button>
                <Button size="md" fullWidth variant="ghost" onClick={() => setShowExitConfirm(false)}>
                  {t('workout.exitCancel')}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Missing import in Workout — add Card locally
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-card border border-border rounded-2xl p-4 ${className}`}>{children}</div>
}
