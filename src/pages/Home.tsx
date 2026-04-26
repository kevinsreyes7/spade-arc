import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { morningProtocol, dailyQuotes } from '@/data/protocols'
import { getTodayWorkout, getNutritionTargets } from '@/hooks/useWorkoutSchedule'
import { supabase } from '@/lib/supabase'

export function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { profile } = useProfile()
  const [streak, setStreak] = useState(0)
  const [totalSessions, setTotalSessions] = useState(0)
  const [decompressionDone, setDecompressionDone] = useState(false)
  const [showDecompression, setShowDecompression] = useState(false)
  const quote = dailyQuotes[new Date().getDate() % dailyQuotes.length]

  const currentWeek = profile?.current_week ?? 1
  const phase = getPhaseFromWeek(currentWeek)

  useEffect(() => {
    if (!user) return
    // Load streak and session count
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

    // Check decompression
    supabase.from('decompression_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)
      .eq('type', 'morning')
      .then(({ data }) => {
        if (data && data.length > 0) setDecompressionDone(true)
      })
  }, [user])

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
    <Layout>
      <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-textMuted text-sm">{dateStr}</p>
              <h1 className="font-display text-3xl text-textPrimary tracking-wide mt-0.5">
                {t('home.greeting', { timeOfDay, name: profile?.name ?? '' })}
              </h1>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Badge variant="phase">{getPhaseName(phase)}</Badge>
              <span className="text-xs text-textMuted font-mono">
                {t('home.week', { number: currentWeek })}
              </span>
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

        {/* Morning decompression */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <Card hover={!decompressionDone} onClick={!decompressionDone ? () => setShowDecompression(true) : undefined}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌅</span>
                <div>
                  <p className="text-textPrimary font-medium text-sm">{t('home.decompression')}</p>
                  <p className="text-xs text-textMuted">
                    {morningProtocol.length} steps · 15 min
                  </p>
                </div>
              </div>
              {decompressionDone ? (
                <Badge variant="success">✓ {t('home.decompressionComplete')}</Badge>
              ) : (
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setShowDecompression(true) }}>
                  {t('home.decompressionStart')}
                </Button>
              )}
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
        onComplete={() => setDecompressionDone(true)}
      />
    </Layout>
  )
}
