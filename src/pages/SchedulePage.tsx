import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useProfile } from '@/context/ProfileContext'
import { Layout } from '@/components/layout/Layout'
import { Badge } from '@/components/ui/Badge'
import { buildWeekSchedule } from '@/hooks/useWorkoutSchedule'
import { getPhaseFromWeek, getPhaseName } from '@/data/workouts'

const TYPE_COLORS = {
  workout: 'bg-secondary/20 border-secondary/40 text-accent',
  rest: 'bg-border/20 border-border/30 text-textMuted',
  sport: 'bg-success/10 border-success/30 text-success',
  cardio: 'bg-highlight/10 border-highlight/30 text-highlight',
}

const TYPE_ICONS = { workout: '🏋️', rest: '😴', sport: '⚽', cardio: '🏃' }

export function SchedulePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { profile } = useProfile()

  if (!profile) return null

  const currentWeek = profile.current_week ?? 1
  const phase = getPhaseFromWeek(currentWeek)
  const schedule = buildWeekSchedule(profile, currentWeek)

  return (
    <Layout>
      <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
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

        {/* Week grid */}
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
                {/* Day indicator */}
                <div className="flex flex-col items-center w-10 flex-shrink-0">
                  <span className="text-xs text-textMuted uppercase tracking-wider">
                    {day.dayOfWeek.substring(0, 3)}
                  </span>
                  {day.isToday && (
                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1" />
                  )}
                </div>

                {/* Type icon */}
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0
                  ${TYPE_COLORS[day.type]}
                `}>
                  {TYPE_ICONS[day.type]}
                </div>

                {/* Info */}
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

                {/* Arrow for workout days */}
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
                <div
                  key={p}
                  className={`flex-1 h-2 rounded-full ${p <= phase ? 'bg-accent' : 'bg-border'}`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-textMuted">
              {['I', 'II', 'III', 'IV'].map((l, i) => (
                <span key={l} className={i + 1 === phase ? 'text-accent font-medium' : ''}>
                  Phase {l}
                </span>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-textMuted">
              <span>Wk 1</span>
              <span className="text-accent font-mono">Wk {currentWeek}</span>
              <span>Wk 20</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
