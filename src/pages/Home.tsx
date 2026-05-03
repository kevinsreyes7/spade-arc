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
import { getPhaseFromWeek, getPhaseName } from '@/data/workouts'
import { dailyQuotes } from '@/data/protocols'
import { getTodayWorkout, getNutritionTargets, buildWeekSchedule } from '@/hooks/useWorkoutSchedule'
import { supabase } from '@/lib/supabase'
import { MatrixRain } from '@/components/MatrixRain'

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
  }, [user, location.key])

  const todaySchedule = profile ? getTodayWorkout(profile, currentWeek) : null
  const isTrainingDay = todaySchedule?.type === 'workout'
  const nutrition = profile ? getNutritionTargets(profile, isTrainingDay, phase) : null

  const timeOfDay = (() => {
    const h = new Date().getHours()
    if (h < 12) return t('home.morning')
    if (h < 17) return t('home.afternoon')
    return t('home.evening')
  })()

  const dateStr = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <>
      {/* Subtle matrix rain — fixed behind all page content at very low opacity */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          opacity: 0.04,
          pointerEvents: 'none',
        }}
      >
        <MatrixRain />
      </div>

      <Layout>
      <div className="relative z-10 px-4 pt-6 pb-4 max-w-lg mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-textMuted text-sm">{dateStr}</p>
              <h1 className="font-display text-3xl text-textPrimary tracking-wide mt-0.5">
                {t('home.greeting', { timeOfDay, name: profile?.name ?? '' })}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end gap-1.5">
                <Badge variant="phase">{getPhaseName(phase)}</Badge>
                <span className="text-xs text-textMuted font-mono">
                  {t('home.week', { number: currentWeek })}
                </span>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-textMuted hover:text-accent transition-colors"
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
          {todaySchedule?.type === 'workout' && todaySchedule.workoutDayId ? (
            <Card
              hover
              glow
              onClick={() => navigate(`/workout/${todaySchedule.workoutDayId}`)}
              className="relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="phase">{t('home.todayWorkout')}</Badge>
                  <span className="text-xs text-textMuted">{t('home.tapToStart')}</span>
                </div>
                <h2 className="font-display text-3xl text-accent tracking-wide">
                  {t(todaySchedule.workoutNameKey ?? '')}
                </h2>
                <div className="mt-3 flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-textMuted">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    {phase <= 2 ? '60–75 min' : '70–85 min'}
                  </span>
                </div>
              </div>
              <Button size="md" fullWidth className="mt-4 font-display tracking-widest text-lg">
                {t('home.startWorkout')}
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
                  onClick={() => day.type === 'workout' && day.workoutDayId && navigate(`/workout/${day.workoutDayId}`)}
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
                      ? t(day.workoutNameKey ?? '')
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
    </Layout>
    </>
  )
}
