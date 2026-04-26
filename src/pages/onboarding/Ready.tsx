import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { getPhaseName } from '@/data/workouts'
import type { DayOfWeek } from '@/types'

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
}

interface ReadyProps {
  name: string
  trainingDays: DayOfWeek[]
  onEnter: () => void
  loading?: boolean
  error?: string
}

export function Ready({ name, trainingDays, onEnter, loading = false, error }: ReadyProps) {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-between px-6 py-12 overflow-hidden">
      {/* Animated spade */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="text-6xl filter drop-shadow-[0_0_30px_rgba(200,212,240,0.4)]"
      >
        ♠
      </motion.div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center"
      >
        <h1 className="font-display text-5xl text-textPrimary tracking-wider mb-2">
          {t('onboarding.ready.title')}
        </h1>
        <p className="text-textMuted mb-8">
          {t('onboarding.ready.subtitle')}
        </p>

        {/* Program card */}
        <div className="bg-card border border-border rounded-2xl p-5 text-left max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="phase">{getPhaseName(1)}</Badge>
            <span className="text-xs text-textMuted font-mono">{t('onboarding.ready.weeks')}</span>
          </div>

          <p className="text-textPrimary font-medium mb-1">{name}</p>
          <p className="text-xs text-textMuted mb-4">{t('onboarding.ready.phase')}</p>

          <div>
            <p className="text-xs text-textMuted tracking-widest uppercase mb-2">
              {t('onboarding.ready.yourDays')}
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {trainingDays.map((d) => (
                <span key={d} className="px-2.5 py-1 bg-secondary/15 border border-secondary/25 rounded-lg text-xs text-highlight font-medium">
                  {DAY_LABELS[d]}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-textMuted">{t('onboarding.ready.programBy')}</p>
          </div>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-sm"
      >
        <Button size="xl" fullWidth loading={loading} onClick={onEnter}
          className="font-display text-2xl tracking-widest">
          {t('onboarding.ready.goToDashboard')}
        </Button>
        {error && (
          <p className="text-danger text-sm text-center mt-2 px-2">{error}</p>
        )}
      </motion.div>
    </div>
  )
}
