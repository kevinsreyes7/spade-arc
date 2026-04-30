import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
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

// ─── Types ───────────────────────────────────────────────────────────────────

type WorkoutStep = 'training' | 'cardio' | 'done'

const CARDIO_OPTIONS = ['LISS Incline Walk', 'HIIT Sprints', 'Daily Walk', 'Assault Bike', 'Other']

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

const STORAGE_KEY_PREFIX = 'spade_arc_workout_'

// ─── Component ───────────────────────────────────────────────────────────────

export function Workout() {
  const { dayId } = useParams<{ dayId: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { user } = useAuthContext()
  const { profile } = useProfile()

  // Always resolve exercise names in English so Supabase queries are consistent
  const tEn = useMemo(() => i18n.getFixedT('en'), [i18n])

  const currentWeek = profile?.current_week ?? 1
  const phase = getPhaseFromWeek(currentWeek)
  const workoutDay = workouts.find((w) => w.id === parseInt(dayId ?? '1', 10))

  const storageKey = STORAGE_KEY_PREFIX + dayId
  const today = new Date().toISOString().split('T')[0]

  // ── Core workout state ───────────────────────────────────────────────────
  const [exercises, setExercises] = useState<ActiveExercise[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
      if (saved?.exercises?.length && saved.date === today) return saved.exercises
    } catch {}
    return buildActiveExercises(parseInt(dayId ?? '1', 10), phase)
  })
  const [restTimer, setRestTimer] = useState<{ visible: boolean; seconds: number }>({ visible: false, seconds: 90 })
  const [step, setStep] = useState<WorkoutStep>('training')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // ── Previous session weights ─────────────────────────────────────────────
  const [previousSets, setPreviousSets] = useState<
    Record<string, Array<{ weight: number | null; reps: number | null }>>
  >({})

  // ── Cardio prompt state ──────────────────────────────────────────────────
  const [selectedCardio, setSelectedCardio] = useState<string | null>(null)
  const [cardioOther, setCardioOther] = useState('')
  const [savingCardio, setSavingCardio] = useState(false)

  const startTime = useRef(Date.now())
  const pausedDuration = useRef(0)
  const pausedSince = useRef<number | null>(null)
  const exercisesRef = useRef(exercises)
  const sessionIdRef = useRef<string | null>(null)

  const unitLabel = profile?.unit_preference === 'imperial' ? t('common.lbs') : t('common.kg')

  // Keep refs in sync
  useEffect(() => { exercisesRef.current = exercises }, [exercises])
  useEffect(() => { sessionIdRef.current = sessionId }, [sessionId])

  // ── Create/restore session ───────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
      if (saved?.sessionId && saved.date === today) {
        setSessionId(saved.sessionId)
        if (saved.startTime) startTime.current = saved.startTime
        return
      }
    } catch {}

    if (!user || !workoutDay) return
    supabase.from('workout_sessions').insert({
      user_id: user.id,
      date: today,
      week_number: currentWeek,
      phase,
      workout_day_id: workoutDay.id,
      workout_name: workoutDay.nameKey,
      total_sets: 0,
    }).select().single().then(({ data }) => {
      if (data) setSessionId(data.id)
    })
  }, [])

  // ── Fetch previous session weights ───────────────────────────────────────
  useEffect(() => {
    if (!user || !workoutDay) return
    supabase
      .from('workout_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('workout_day_id', workoutDay.id)
      .not('completed_at', 'is', null)
      .order('date', { ascending: false })
      .limit(1)
      .then(async ({ data: sessions }) => {
        if (!sessions?.length) return
        const { data: logs } = await supabase
          .from('exercise_logs')
          .select('exercise_name, set_number, weight, reps')
          .eq('session_id', sessions[0].id)
          .eq('completed', true)
          .order('set_number', { ascending: true })
        if (!logs) return

        const map: Record<string, Array<{ weight: number | null; reps: number | null }>> = {}
        logs.forEach((log: { exercise_name: string; set_number: number; weight: number | null; reps: number | null }) => {
          if (!map[log.exercise_name]) map[log.exercise_name] = []
          map[log.exercise_name][log.set_number - 1] = { weight: log.weight, reps: log.reps }
        })
        setPreviousSets(map)
      })
  }, [user, workoutDay])

  // ── Pre-fill weights from previous session once loaded ───────────────────
  useEffect(() => {
    if (Object.keys(previousSets).length === 0 || !workoutDay) return
    setExercises((prev) =>
      prev.map((ae, exIdx) => {
        const ex = workoutDay.exercises[exIdx]
        if (!ex) return ae
        // Match by English name (new format) or nameKey (old format)
        const exNameEn = tEn(ex.nameKey)
        const prevData = previousSets[exNameEn] ?? previousSets[ex.nameKey]
        if (!prevData) return ae
        return {
          ...ae,
          sets: ae.sets.map((s, si) => {
            const p = prevData[si]
            if (!p || s.weight !== '') return s // don't overwrite if user already entered something
            return { ...s, weight: p.weight != null ? String(p.weight) : '' }
          }),
        }
      })
    )
  }, [previousSets]) // eslint-disable-line

  // ── Persist to localStorage on change ───────────────────────────────────
  useEffect(() => {
    if (step !== 'training') return
    localStorage.setItem(storageKey, JSON.stringify({
      date: today,
      sessionId,
      startTime: startTime.current,
      exercises,
    }))
  }, [exercises, sessionId, step])

  // ── Force-save on tab hide ───────────────────────────────────────────────
  useEffect(() => {
    const saveNow = () => {
      if (document.hidden && step === 'training') {
        localStorage.setItem(storageKey, JSON.stringify({
          date: today,
          sessionId: sessionIdRef.current,
          startTime: startTime.current,
          exercises: exercisesRef.current,
        }))
      }
    }
    document.addEventListener('visibilitychange', saveNow)
    return () => document.removeEventListener('visibilitychange', saveNow)
  }, [step])

  // ── Live timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (isPaused || step !== 'training') return
    const interval = setInterval(() => {
      const paused = pausedDuration.current + (pausedSince.current ? Date.now() - pausedSince.current : 0)
      setElapsedSeconds(Math.floor((Date.now() - startTime.current - paused) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [isPaused, step])

  const handlePauseResume = () => {
    if (isPaused) {
      if (pausedSince.current !== null) {
        pausedDuration.current += Date.now() - pausedSince.current
        pausedSince.current = null
      }
      setIsPaused(false)
    } else {
      pausedSince.current = Date.now()
      setIsPaused(true)
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const updateSet = useCallback((
    exIndex: number,
    setIndex: number,
    updates: Record<string, string | number | boolean>
  ) => {
    setExercises((prev) => {
      const next = [...prev]
      next[exIndex] = {
        ...next[exIndex],
        sets: next[exIndex].sets.map((s, i) => i === setIndex ? { ...s, ...updates } : s),
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

  // ── Save workout ─────────────────────────────────────────────────────────
  const handleComplete = async () => {
    if (!user || !workoutDay) return
    const totalPaused = pausedDuration.current + (pausedSince.current ? Date.now() - pausedSince.current : 0)
    const duration = Math.round((Date.now() - startTime.current - totalPaused) / 60000)

    let sid = sessionId
    if (!sid) {
      const { data } = await supabase.from('workout_sessions').insert({
        user_id: user.id,
        date: today,
        week_number: currentWeek,
        phase,
        workout_day_id: workoutDay.id,
        workout_name: workoutDay.nameKey,
        total_sets: 0,
      }).select().single()
      if (!data) return
      sid = data.id
    }

    await supabase.from('workout_sessions').update({
      completed_at: new Date().toISOString(),
      duration_minutes: duration,
      total_sets: completedSets,
    }).eq('id', sid)

    // Store English exercise names so Progress queries work regardless of user language
    const logs = exercises.flatMap((ae, exIdx) => {
      const ex = workoutDay.exercises[exIdx]
      const exerciseName = ae.substitutedWith
        ? tEn(ae.substitutedWith)
        : tEn(ex?.nameKey ?? '')
      return ae.sets.map((s) => ({
        session_id: sid,
        exercise_name: exerciseName,
        set_number: s.setNumber,
        weight: s.weight ? parseFloat(s.weight) : null,
        reps: s.reps ? parseInt(s.reps) : null,
        feel_rating: s.feelRating || null,
        notes: s.notes,
        completed: s.completed,
      }))
    })

    await supabase.from('exercise_logs').insert(logs)
    localStorage.removeItem(storageKey)
    setStep('cardio')
  }

  // ── Log cardio then move to summary ─────────────────────────────────────
  const handleCardioLog = async () => {
    if (!user || !selectedCardio) return
    setSavingCardio(true)
    const cardioType = selectedCardio === 'Other' ? (cardioOther.trim() || 'Other') : selectedCardio
    await supabase.from('cardio_logs').insert({
      user_id: user.id,
      date: today,
      cardio_type: cardioType,
      duration_minutes: 0,
    })
    setSavingCardio(false)
    setStep('done')
  }

  const handleExit = async (save: boolean) => {
    if (save && user && sessionId) {
      await supabase.from('workout_sessions').update({ total_sets: completedSets }).eq('id', sessionId)
    } else {
      if (sessionId) {
        await supabase.from('workout_sessions').delete().eq('id', sessionId)
      }
      localStorage.removeItem(storageKey)
    }
    navigate('/home')
  }

  if (!workoutDay) {
    return <div className="flex items-center justify-center min-h-screen bg-bg text-textMuted">Workout not found</div>
  }

  // ── Cardio prompt screen ─────────────────────────────────────────────────
  if (step === 'cardio') {
    return (
      <div className="min-h-screen bg-bg flex flex-col px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-10">
            <div className="text-5xl mb-4">🏃</div>
            <h2 className="font-display text-3xl text-textPrimary tracking-wide mb-2">
              Did you do cardio today?
            </h2>
            <p className="text-textMuted text-sm">Log it to track your conditioning work</p>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            {CARDIO_OPTIONS.map((opt) => (
              <motion.button
                key={opt}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCardio(opt)}
                className={`px-5 py-4 rounded-2xl border text-left font-medium transition-all ${
                  selectedCardio === opt
                    ? 'bg-accent/15 border-accent text-accent'
                    : 'bg-card border-border text-textPrimary'
                }`}
              >
                {opt}
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {selectedCardio === 'Other' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-6"
              >
                <input
                  value={cardioOther}
                  onChange={(e) => setCardioOther(e.target.value)}
                  placeholder="Describe your cardio..."
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-textPrimary placeholder:text-textMuted/50 focus:outline-none focus:border-accent"
                  autoFocus
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              fullWidth
              loading={savingCardio}
              disabled={!selectedCardio || (selectedCardio === 'Other' && !cardioOther.trim())}
              onClick={handleCardioLog}
              className="font-display tracking-widest"
            >
              Log Cardio ♠
            </Button>
            <Button size="lg" fullWidth variant="ghost" onClick={() => setStep('done')}>
              Skip — No Cardio Today
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Session summary screen ───────────────────────────────────────────────
  if (step === 'done') {
    const duration = Math.round(elapsedSeconds / 60)
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

  // ── Main workout screen ──────────────────────────────────────────────────
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
          <div className="flex items-center gap-1.5">
            <span className={`font-mono text-sm ${isPaused ? 'text-accent/60' : 'text-textMuted'}`}>
              {formatTime(elapsedSeconds)}
            </span>
            <button
              onClick={handlePauseResume}
              className="p-1.5 text-textMuted hover:text-textPrimary transition-colors"
              aria-label={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-accent rounded-full"
              animate={{ width: `${totalSets > 0 ? (completedSets / totalSets) * 100 : 0}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <span className="text-xs font-mono text-textMuted shrink-0">{completedSets}/{totalSets}</span>
        </div>
        {isPaused && (
          <p className="text-center text-xs text-accent/60 tracking-widest mt-1">PAUSED</p>
        )}
      </div>

      <div className="px-4 py-4 pb-32 flex flex-col gap-4 max-w-lg mx-auto">
        <Card className="bg-secondary/8 border-secondary/20">
          <p className="text-xs text-textMuted uppercase tracking-widest mb-1">{t('workout.sessionWhy')}</p>
          <p className="text-sm text-textMuted leading-relaxed">{t(workoutDay.sessionWhyKey)}</p>
        </Card>

        <Card className="bg-accent/5 border-accent/15">
          <p className="text-xs text-accent/60 uppercase tracking-widest mb-1">{t('workout.phaseNote')}</p>
          <p className="text-sm text-textMuted leading-relaxed">{t(workoutDay.phaseNoteKey)}</p>
        </Card>

        {workoutDay.exercises.map((exercise, exIdx) => {
          const exNameEn = tEn(exercise.nameKey)
          const prevSets = previousSets[exNameEn] ?? previousSets[exercise.nameKey] ?? []
          return (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              activeExercise={exercises[exIdx]}
              phase={phase}
              unitLabel={unitLabel}
              onUpdateSet={(setIdx, updates) => updateSet(exIdx, setIdx, updates)}
              onCompleteSet={(setIdx) => completeSet(exIdx, setIdx)}
              onSubstitute={(subIdx) => substituteExercise(exIdx, subIdx)}
              previousSets={prevSets}
            />
          )
        })}
      </div>

      {/* Complete button */}
      <AnimatePresence>
        {completedSets > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-4 right-4 z-40 max-w-lg mx-auto"
          >
            <Button size="xl" fullWidth onClick={handleComplete}
              className="font-display text-xl tracking-widest shadow-glow-accent">
              {allDone ? `${t('workout.completeSession')} ♠` : `Finish Workout · ${completedSets} sets`}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

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

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-card border border-border rounded-2xl p-4 ${className}`}>{children}</div>
}
