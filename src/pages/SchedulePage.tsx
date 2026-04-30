import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useProfile } from '@/context/ProfileContext'
import { useAuthContext } from '@/context/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { buildWeekSchedule } from '@/hooks/useWorkoutSchedule'
import { getPhaseFromWeek, getPhaseName, workouts } from '@/data/workouts'
import { supabase } from '@/lib/supabase'
import type { WorkoutSession, ExerciseLog } from '@/types'

const TYPE_COLORS = {
  workout: 'bg-secondary/20 border-secondary/40 text-accent',
  rest: 'bg-border/20 border-border/30 text-textMuted',
  sport: 'bg-success/10 border-success/30 text-success',
  cardio: 'bg-highlight/10 border-highlight/30 text-highlight',
}

const TYPE_ICONS = { workout: '🏋️', rest: '😴', sport: '⚽', cardio: '🏃' }

type Tab = 'schedule' | 'history'

export function SchedulePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { profile } = useProfile()

  const [tab, setTab] = useState<Tab>('schedule')
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sessionLogs, setSessionLogs] = useState<Record<string, ExerciseLog[]>>({})
  const [loadingLogs, setLoadingLogs] = useState<Record<string, boolean>>({})

  const unit = profile?.unit_preference === 'imperial' ? 'lbs' : 'kg'

  // Load history when tab switches to history
  useEffect(() => {
    if (tab !== 'history' || !user) return
    setLoadingHistory(true)
    supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('date', { ascending: false })
      .then(({ data }) => {
        setSessions((data as WorkoutSession[]) ?? [])
        setLoadingHistory(false)
      })
  }, [tab, user])

  const toggleExpand = async (sessionId: string) => {
    if (expandedId === sessionId) {
      setExpandedId(null)
      return
    }
    setExpandedId(sessionId)
    if (sessionLogs[sessionId]) return
    setLoadingLogs((prev) => ({ ...prev, [sessionId]: true }))
    const { data } = await supabase
      .from('exercise_logs')
      .select('*')
      .eq('session_id', sessionId)
      .order('set_number', { ascending: true })
    if (data) {
      setSessionLogs((prev) => ({ ...prev, [sessionId]: data as ExerciseLog[] }))
    }
    setLoadingLogs((prev) => ({ ...prev, [sessionId]: false }))
  }

  if (!profile) return null

  const currentWeek = profile.current_week ?? 1
  const phase = getPhaseFromWeek(currentWeek)
  const schedule = buildWeekSchedule(profile, currentWeek)

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })

  const getMuscleGroups = (workoutDayId: number) => {
    const day = workouts.find((w) => w.id === workoutDayId)
    if (!day) return ''
    return day.exercises
      .filter((ex) => ex.isKey)
      .map((ex) => t(ex.muscleTargetKey))
      .join(' · ')
  }

  return (
    <Layout>
      <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display text-4xl text-textPrimary tracking-wide">
              {t('schedule.title')}
            </h1>
            <p className="text-textMuted text-sm">
              {t('schedule.week', { number: currentWeek })} · {getPhaseName(phase)}
            </p>
          </div>
          <Badge variant="phase">{t('schedule.phase', { number: phase })}</Badge>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-5">
          {(['schedule', 'history'] as Tab[]).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 ${
                tab === tabKey
                  ? 'bg-accent text-bg'
                  : 'bg-card border border-border text-textMuted'
              }`}
            >
              {tabKey === 'schedule' ? 'Schedule' : 'History'}
            </button>
          ))}
        </div>

        {/* ── Schedule tab ── */}
        {tab === 'schedule' && (
          <>
            <div className="flex flex-col gap-3">
              {schedule.map((day, i) => (
                <motion.div
                  key={day.dayOfWeek}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div
                    className={`
                      flex items-center gap-4 p-4 rounded-2xl border transition-all
                      ${day.isToday ? 'border-secondary/60 bg-secondary/10' : 'border-border bg-card'}
                      ${day.type === 'workout' ? 'cursor-pointer hover:border-secondary/50' : ''}
                    `}
                    onClick={() => day.type === 'workout' && day.workoutDayId && navigate(`/workout/${day.workoutDayId}`)}
                  >
                    <div className="flex flex-col items-center w-10 flex-shrink-0">
                      <span className="text-xs text-textMuted uppercase tracking-wider">
                        {day.dayOfWeek.substring(0, 3)}
                      </span>
                      {day.isToday && <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1" />}
                    </div>

                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${TYPE_COLORS[day.type]}`}>
                      {TYPE_ICONS[day.type]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${day.isToday ? 'text-accent' : 'text-textPrimary'}`}>
                        {day.isToday && (
                          <span className="text-xs text-accent font-mono mr-1">[{t('schedule.today')}]</span>
                        )}
                        {day.type === 'workout'
                          ? t(day.workoutNameKey ?? '')
                          : day.type === 'sport'
                            ? `${t('schedule.sport')} · ${profile.sport_name || ''}`
                            : day.type === 'cardio'
                              ? t('schedule.cardio')
                              : t('schedule.rest')}
                      </p>
                      {day.isCompleted && (
                        <Badge variant="success" size="sm">✓ {t('schedule.completed')}</Badge>
                      )}
                    </div>

                    {day.type === 'workout' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                        className="w-4 h-4 text-textMuted flex-shrink-0">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Phase timeline */}
            <div className="mt-6">
              <p className="text-xs text-textMuted uppercase tracking-widest mb-3">{t('progress.timeline')}</p>
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4].map((p) => (
                    <div key={p} className={`flex-1 h-2 rounded-full ${p <= phase ? 'bg-accent' : 'bg-border'}`} />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-textMuted">
                  {['I', 'II', 'III', 'IV'].map((l, i) => (
                    <span key={l} className={i + 1 === phase ? 'text-accent font-medium' : ''}>Phase {l}</span>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-xs text-textMuted">
                  <span>Wk 1</span>
                  <span className="text-accent font-mono">Wk {currentWeek}</span>
                  <span>Wk 20</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── History tab ── */}
        {tab === 'history' && (
          <div className="flex flex-col gap-3">
            {loadingHistory ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <Card>
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">📋</p>
                  <p className="text-textPrimary font-medium mb-1">No sessions yet</p>
                  <p className="text-textMuted text-sm">Complete your first workout to see history here</p>
                </div>
              </Card>
            ) : (
              sessions.map((session, i) => {
                const isExpanded = expandedId === session.id
                const logs = sessionLogs[session.id] ?? []
                const muscles = getMuscleGroups(session.workout_day_id)

                // Group logs by exercise name
                const byExercise: Record<string, ExerciseLog[]> = {}
                logs.forEach((log) => {
                  if (!byExercise[log.exercise_name]) byExercise[log.exercise_name] = []
                  byExercise[log.exercise_name].push(log)
                })

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <div
                      className="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer"
                      onClick={() => toggleExpand(session.id)}
                    >
                      {/* Session header */}
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-textMuted font-mono mb-1">{formatDate(session.date)}</p>
                            <p className="text-textPrimary font-medium text-base leading-tight">
                              {t(session.workout_name)}
                            </p>
                            {muscles && (
                              <p className="text-xs text-textMuted mt-0.5">{muscles}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 ml-3 shrink-0">
                            <div className="text-right">
                              <p className="font-mono text-lg text-accent">{session.total_sets}</p>
                              <p className="text-[10px] text-textMuted">sets</p>
                            </div>
                            {session.duration_minutes && (
                              <div className="text-right">
                                <p className="font-mono text-lg text-textPrimary">{session.duration_minutes}</p>
                                <p className="text-[10px] text-textMuted">min</p>
                              </div>
                            )}
                            <svg
                              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                              className={`w-4 h-4 text-textMuted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Expanded exercise logs */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-border px-4 pb-4 pt-3">
                              {loadingLogs[session.id] ? (
                                <div className="flex justify-center py-4">
                                  <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                                </div>
                              ) : Object.keys(byExercise).length === 0 ? (
                                <p className="text-textMuted text-sm text-center py-2">No sets logged</p>
                              ) : (
                                <div className="flex flex-col gap-4">
                                  {Object.entries(byExercise).map(([name, sets]) => (
                                    <div key={name}>
                                      <p className="text-textPrimary text-sm font-medium mb-2">{name}</p>
                                      <div className="flex flex-col gap-1">
                                        {sets.map((s) => (
                                          <div key={s.set_number} className="flex items-center gap-3 text-xs text-textMuted font-mono">
                                            <span className="w-10 text-textMuted/60">Set {s.set_number}</span>
                                            <span className={s.weight ? 'text-accent' : 'text-textMuted/40'}>
                                              {s.weight != null ? `${s.weight}${unit}` : '—'}
                                            </span>
                                            <span className="text-textMuted/60">×</span>
                                            <span className={s.reps ? 'text-textPrimary' : 'text-textMuted/40'}>
                                              {s.reps != null ? `${s.reps} reps` : '—'}
                                            </span>
                                            {s.feel_rating != null && s.feel_rating > 0 && (
                                              <span className="text-textMuted/50">{'★'.repeat(s.feel_rating)}</span>
                                            )}
                                            {!s.completed && (
                                              <span className="text-textMuted/40 italic">skipped</span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
