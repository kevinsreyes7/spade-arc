import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useProfile } from '@/context/ProfileContext'
import { useAuthContext } from '@/context/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DecompressionSheet } from '@/components/DecompressionSheet'
import { SessionPickerSheet } from '@/components/SessionPickerSheet'
import { getPhaseFromWeek, getPhaseName } from '@/data/workouts'
import { dailyQuotes } from '@/data/protocols'
import { getTodayWorkout, getNutritionTargets, buildWeekSchedule } from '@/hooks/useWorkoutSchedule'
import { supabase } from '@/lib/supabase'

// ── Morning Analysis hook ────────────────────────────────────────────────────

function useMorningAnalysis(userId: string | undefined, profileName: string, currentWeek: number, todayPlan: string) {
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const isMorning = (() => { const h = new Date().getHours(); return h >= 6 && h < 11 })()
  const cacheKey = `spade_arc_ma_${new Date().toISOString().split('T')[0]}`

  useEffect(() => {
    if (!userId || !isMorning || dismissed) return
    const cached = localStorage.getItem(cacheKey)
    if (cached) { setAnalysis(cached); return }

    const generate = async () => {
      setLoading(true)
      try {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const { data: sessions } = await supabase
          .from('workout_sessions')
          .select('workout_name, total_sets, date')
          .eq('user_id', userId)
          .not('completed_at', 'is', null)
          .order('date', { ascending: false })
          .limit(3)

        const recentWorkouts = (sessions ?? [])
          .map((s) => `${s.date}: ${s.workout_name} (${s.total_sets} sets)`)
          .join(', ') || 'No recent sessions'

        const lastDate = sessions?.[0]?.date
        const daysSinceLastWorkout = lastDate
          ? Math.round((Date.now() - new Date(lastDate + 'T00:00:00').getTime()) / 86400000)
          : null

        const { data } = await supabase.functions.invoke('ai-analysis', {
          body: { type: 'morning', data: { profileName, currentWeek, recentWorkouts, todayPlan, daysSinceLastWorkout } },
        })
        if (data?.analysis) {
          setAnalysis(data.analysis)
          localStorage.setItem(cacheKey, data.analysis)
        }
      } catch { /* AI optional */ }
      setLoading(false)
    }

    generate()
  }, [userId, isMorning])

  return { analysis, loading, isMorning, dismissed, dismiss: () => setDismissed(true) }
}

const WEEK_ICONS = { workout: '🏋️', rest: '😴', sport: '⚽', cardio: '🏃' }

export function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthContext()
  const { profile } = useProfile()
  const [streak, setStreak] = useState(0)
  const [totalSessions, setTotalSessions] = useState(0)
  const [morningDone, setMorningDone] = useState(false)
  const [nightDone, setNightDone] = useState(false)
  const [showDecompression, setShowDecompression] = useState(false)
  const [showNightDecompression, setShowNightDecompression] = useState(false)
  const [showSessionPicker, setShowSessionPicker] = useState(false)
  const quote = dailyQuotes[new Date().getDate() % dailyQuotes.length]

  const currentWeek = profile?.current_week ?? 1
  const phase = getPhaseFromWeek(currentWeek)

  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    supabase.from('workout_sessions')
      .select('id, date, completed_at')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('date', { ascending: false })
      .then(({ data }) => {
        if (!data) return
        setTotalSessions(data.length)

        // Calculate streak
        let s = 0
        const dateSet = new Set(data.map((d) => d.date))
        let check = new Date()
        while (dateSet.has(check.toISOString().split('T')[0])) {
          s++
          check.setDate(check.getDate() - 1)
        }
        setStreak(s)
      })

    // Check both decompression types
    supabase.from('decompression_logs')
      .select('type')
      .eq('user_id', user.id)
      .eq('date', today)
      .then(({ data }) => {
        if (!data) return
        setMorningDone(data.some((d) => d.type === 'morning'))
        setNightDone(data.some((d) => d.type === 'night'))
      })

    // Schedule local notifications if permission granted
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const now = new Date()
      const timers: number[] = []

      // EODR reminder at 9 PM
      const eodrTime = new Date(); eodrTime.setHours(21, 0, 0, 0)
      const msUntilEODR = eodrTime.getTime() - now.getTime()
      const eodrKey = `spade_arc_eodr_notif_${today}`
      if (msUntilEODR > 0 && !localStorage.getItem(eodrKey)) {
        timers.push(window.setTimeout(() => {
          new Notification('SPADE ARC — End of Day', {
            body: 'Time to review your day. Log your EODR now.',
            icon: '/icons/icon-192.png',
          })
          localStorage.setItem(eodrKey, '1')
        }, msUntilEODR))
      }

      // Morning Analysis reminder at 7 AM
      const maTime = new Date(); maTime.setHours(7, 0, 0, 0)
      const msUntilMA = maTime.getTime() - now.getTime()
      const maKey = `spade_arc_ma_notif_${today}`
      if (msUntilMA > 0 && !localStorage.getItem(maKey)) {
        timers.push(window.setTimeout(() => {
          new Notification('SPADE ARC — Good Morning', {
            body: 'Your Morning Analysis is ready. Check your daily briefing.',
            icon: '/icons/icon-192.png',
          })
          localStorage.setItem(maKey, '1')
        }, msUntilMA))
      }

      return () => timers.forEach(clearTimeout)
    }
  }, [user, location.key])

  const todaySchedule = profile ? getTodayWorkout(profile, currentWeek) : null
  const isTrainingDay = todaySchedule?.type === 'workout'
  const nutrition = profile ? getNutritionTargets(profile, isTrainingDay, phase) : null

  const todayPlanLabel = isTrainingDay ? 'Training day' : todaySchedule?.type === 'rest' ? 'Rest day' : 'Active recovery'
  const ma = useMorningAnalysis(user?.id, profile?.name ?? '', currentWeek, todayPlanLabel)

  const handleTodayWorkoutTap = () => {
    if (todaySchedule?.workoutDayId != null) {
      navigate(`/workout/${todaySchedule.workoutDayId}`)
    } else {
      setShowSessionPicker(true)
    }
  }

  const timeOfDay = (() => {
    const h = new Date().getHours()
    if (h < 12) return t('home.morning')
    if (h < 17) return t('home.afternoon')
    return t('home.evening')
  })()

  const dateStr = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <>
      <Layout>
      <div className="relative z-10 px-4 pt-6 pb-4 max-w-lg mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-start justify-between">
            {/* Left: journal + greeting */}
            <div className="flex items-start gap-3">
              <button
                onClick={() => navigate('/journal')}
                className="mt-1 w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-textMuted hover:text-accent transition-colors"
                aria-label="Journal"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5">
                  <rect x="4" y="2" width="16" height="20" rx="2" />
                  <path d="M8 7h8M8 11h8M8 15h5" strokeLinecap="round" />
                </svg>
              </button>
              <div>
                <p className="text-textMuted text-xs">{dateStr}</p>
                <h1 className="font-display text-3xl text-textPrimary tracking-wide mt-0.5">
                  {t('home.greeting', { timeOfDay, name: profile?.name ?? '' })}
                </h1>
              </div>
            </div>
            {/* Right: phase badge + avatar */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end gap-1.5">
                <Badge variant="phase">{getPhaseName(phase)}</Badge>
                <span className="text-xs text-textMuted font-mono">
                  Wk {currentWeek} / 20
                </span>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="w-9 h-9 rounded-full bg-secondary/20 border border-secondary/40 flex items-center justify-center text-accent hover:bg-secondary/30 transition-colors"
                aria-label="Profile"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Morning Analysis */}
        {ma.isMorning && !ma.dismissed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Card className="border-secondary/30 bg-secondary/5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌅</span>
                  <p className="text-xs text-secondary uppercase tracking-widest font-medium">Morning Analysis</p>
                </div>
                <button onClick={ma.dismiss} className="text-textMuted/60 hover:text-textMuted transition-colors -mt-0.5">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </button>
              </div>
              {ma.loading ? (
                <div className="flex items-center gap-2 py-1">
                  <div className="w-3.5 h-3.5 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
                  <p className="text-textMuted text-xs">Generating your briefing...</p>
                </div>
              ) : ma.analysis ? (
                <p className="text-textPrimary text-sm leading-relaxed whitespace-pre-line">{ma.analysis}</p>
              ) : null}
            </Card>
          </motion.div>
        )}

        {/* Streak + Today row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="flex flex-col items-center py-3" padding="none">
              <span className="text-2xl">🔥</span>
              <span className="font-mono text-2xl font-medium text-textPrimary mt-1">{streak}</span>
              <span className="text-xs text-textMuted">{t('home.streak')}</span>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08 }}
          >
            <Card className="flex flex-col items-center py-3" padding="none">
              <span className="text-2xl">📅</span>
              <span className="font-mono text-2xl font-medium text-textPrimary mt-1">{totalSessions}</span>
              <span className="text-xs text-textMuted">{t('home.totalSessions')}</span>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.11 }}
          >
            <Card className="flex flex-col items-center py-3" padding="none">
              <span className="text-2xl">📊</span>
              <span className="font-mono text-2xl font-medium text-textPrimary mt-1">{currentWeek}</span>
              <span className="text-xs text-textMuted">{t('home.totalWeeks')}</span>
            </Card>
          </motion.div>
        </div>

        {/* View Daily Report */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13 }}
          className="mb-4"
        >
          <button
            onClick={() => navigate('/eodr')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-card border border-border hover:border-accent/40 hover:bg-accent/5 transition-all duration-200 group"
          >
            <div className="flex items-center gap-2.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 text-accent/70">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <line x1="9" y1="12" x2="15" y2="12" />
                <line x1="9" y1="16" x2="13" y2="16" />
              </svg>
              <span className="text-sm text-textMuted group-hover:text-textPrimary transition-colors">View Daily Report</span>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-textMuted/40 group-hover:text-accent/60 transition-colors">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </motion.div>

        {/* Today's workout card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-4"
        >
          {todaySchedule?.type === 'workout' ? (
            <Card
              hover
              glow
              onClick={handleTodayWorkoutTap}
              className="relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="phase">{t('home.todayWorkout')}</Badge>
                  <span className="text-xs text-textMuted">
                    {todaySchedule.workoutDayId != null ? 'Assigned' : 'Tap to choose'}
                  </span>
                </div>
                <h2 className="font-display text-3xl text-accent tracking-wide">
                  {todaySchedule.workoutDayId != null && todaySchedule.workoutNameKey
                    ? t(todaySchedule.workoutNameKey)
                    : 'Ready to Train'}
                </h2>
                <p className="text-sm text-textMuted mt-1">
                  {todaySchedule.workoutDayId != null
                    ? 'Tap to start your assigned workout.'
                    : 'Pick the session that fits your day.'}
                </p>
              </div>
              <Button size="md" fullWidth className="mt-4 font-display tracking-widest text-lg">
                {todaySchedule.workoutDayId != null ? 'Start Workout ♠' : 'Choose Session'}
              </Button>
            </Card>
          ) : (
            <Card>
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {todaySchedule?.type === 'sport' ? '⚽' : todaySchedule?.type === 'cardio' ? '🏃' : '😴'}
                </span>
                <div>
                  <p className="text-textPrimary font-medium">
                    {todaySchedule?.type === 'sport'
                      ? t('home.sportDay')
                      : todaySchedule?.type === 'cardio'
                        ? t('home.cardioDay')
                        : t('home.restDay')}
                  </p>
                  <p className="text-sm text-textMuted">Recovery is progress.</p>
                </div>
              </div>
            </Card>
          )}
        </motion.div>

        {/* This Week */}
        {profile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mb-4"
          >
            <p className="text-xs text-textMuted tracking-widest uppercase mb-2">This Week</p>
            <Card padding="none">
              {buildWeekSchedule(profile, currentWeek).map((day, i, arr) => (
                <div
                  key={day.dayOfWeek}
                  onClick={() => {
                    if (day.type !== 'workout') return
                    if (day.workoutDayId != null) navigate(`/workout/${day.workoutDayId}`)
                    else setShowSessionPicker(true)
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-colors duration-150 ${
                    i < arr.length - 1 ? 'border-b border-border' : ''
                  } ${day.type === 'workout' ? 'cursor-pointer hover:bg-secondary/5' : ''} ${
                    day.isToday ? 'bg-secondary/8' : ''
                  }`}
                >
                  <span className={`text-xs font-mono w-7 ${day.isToday ? 'text-accent font-medium' : 'text-textMuted'}`}>
                    {day.dayOfWeek.substring(0, 3).toUpperCase()}
                  </span>
                  <span className="text-base">{WEEK_ICONS[day.type]}</span>
                  <span className={`text-sm flex-1 ${day.isToday ? 'text-accent' : 'text-textMuted'}`}>
                    {day.type === 'workout'
                      ? day.workoutNameKey ? t(day.workoutNameKey) : 'Training'
                      : day.type === 'sport'
                        ? `Sport · ${profile.sport_name || ''}`
                        : day.type === 'cardio'
                          ? 'Cardio'
                          : 'Rest'}
                  </span>
                  {day.isToday && <span className="text-[10px] text-accent font-mono tracking-wider">TODAY</span>}
                  {day.type === 'workout' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-textMuted">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </div>
              ))}
            </Card>
          </motion.div>
        )}

        {/* Decompression — morning + night status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <Card hover onClick={() => navigate('/restore')}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌿</span>
                <p className="text-textPrimary font-medium text-sm">{t('home.decompression')}</p>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-textMuted">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* Morning */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (!morningDone) setShowDecompression(true)
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-sm ${
                  morningDone
                    ? 'bg-success/10 border-success/30 text-success'
                    : 'border-border text-textMuted hover:border-accent'
                }`}
              >
                <span>🌅</span>
                <span className="text-xs font-medium">Morning</span>
                {morningDone && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 ml-auto">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
              {/* Night */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (!nightDone) setShowNightDecompression(true)
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-sm ${
                  nightDone
                    ? 'bg-success/10 border-success/30 text-success'
                    : 'border-border text-textMuted hover:border-accent'
                }`}
              >
                <span>🌙</span>
                <span className="text-xs font-medium">Night</span>
                {nightDone && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 ml-auto">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            </div>
          </Card>
        </motion.div>

        {/* Nutrition targets */}
        {nutrition && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-4"
          >
            <Card>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-textPrimary">{t('home.nutrition')}</p>
                <Badge variant="muted">{isTrainingDay ? t('home.trainingDay') : t('home.restDay')}</Badge>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: t('home.calories'), val: nutrition.calories, unit: '' },
                  { label: t('home.protein'), val: nutrition.protein, unit: 'g' },
                  { label: t('home.carbs'), val: nutrition.carbs, unit: 'g' },
                  { label: t('home.fat'), val: nutrition.fat, unit: 'g' },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center">
                    <span className="font-mono text-xl font-medium text-accent">
                      {item.val}
                      <span className="text-xs text-textMuted">{item.unit}</span>
                    </span>
                    <span className="text-xs text-textMuted text-center">{item.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Community shortcut */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="mb-4"
        >
          <button
            onClick={() => navigate('/community')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-card border border-border hover:border-accent/40 hover:bg-accent/5 transition-all duration-200 group"
          >
            <div className="flex items-center gap-2.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 text-accent/70">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
              <span className="text-sm text-textMuted group-hover:text-textPrimary transition-colors">Leaderboard &amp; PR Feed</span>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-textMuted/40 group-hover:text-accent/60 transition-colors">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </motion.div>

        {/* Daily quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent/30 rounded-l-2xl" />
            <div className="pl-3">
              <p className="text-xs text-textMuted uppercase tracking-widest mb-2">{t('home.quote')}</p>
              <p className="text-textMuted text-sm italic leading-relaxed">"{quote}"</p>
            </div>
          </Card>
        </motion.div>
      </div>

      <DecompressionSheet
        visible={showDecompression}
        type="morning"
        onClose={() => setShowDecompression(false)}
        onComplete={() => setMorningDone(true)}
      />
      <DecompressionSheet
        visible={showNightDecompression}
        type="night"
        onClose={() => setShowNightDecompression(false)}
        onComplete={() => setNightDone(true)}
      />
      <SessionPickerSheet
        visible={showSessionPicker}
        currentWeek={currentWeek}
        onClose={() => setShowSessionPicker(false)}
      />
    </Layout>
    </>
  )
}
