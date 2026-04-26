import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { OnboardingLayout } from './OnboardingLayout'
import { Button } from '@/components/ui/Button'
import type { DayOfWeek } from '@/types'

const DAYS: { id: DayOfWeek; key: string }[] = [
  { id: 'mon', key: 'onboarding.schedule.mon' },
  { id: 'tue', key: 'onboarding.schedule.tue' },
  { id: 'wed', key: 'onboarding.schedule.wed' },
  { id: 'thu', key: 'onboarding.schedule.thu' },
  { id: 'fri', key: 'onboarding.schedule.fri' },
  { id: 'sat', key: 'onboarding.schedule.sat' },
  { id: 'sun', key: 'onboarding.schedule.sun' },
]

interface ScheduleProps {
  daysPerWeek: number
  trainingDays: DayOfWeek[]
  onChange: (data: { daysPerWeek?: number; trainingDays?: DayOfWeek[] }) => void
  onNext: () => void
  onBack: () => void
}

export function Schedule({ daysPerWeek, trainingDays, onChange, onNext, onBack }: ScheduleProps) {
  const { t } = useTranslation()

  const toggleDay = (day: DayOfWeek) => {
    if (trainingDays.includes(day)) {
      if (trainingDays.length > 1) {
        onChange({ trainingDays: trainingDays.filter((d) => d !== day) })
      }
    } else if (trainingDays.length < daysPerWeek) {
      onChange({ trainingDays: [...trainingDays, day] })
    }
  }

  const setDaysPerWeek = (n: number) => {
    onChange({ daysPerWeek: n, trainingDays: trainingDays.slice(0, n) })
  }

  const canProceed = trainingDays.length === daysPerWeek

  return (
    <OnboardingLayout step={5} totalSteps={9} onBack={onBack}>
      <div className="flex flex-col gap-8 flex-1">
        <div>
          <h1 className="font-display text-4xl text-textPrimary tracking-wide mb-1">
            {t('onboarding.schedule.title')}
          </h1>
          <p className="text-textMuted text-sm">{t('onboarding.schedule.subtitle')}</p>
        </div>

        {/* Days per week selector */}
        <div className="flex gap-2">
          {[3, 4, 5, 6].map((n) => (
            <motion.button
              key={n}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDaysPerWeek(n)}
              className={`flex-1 py-4 rounded-2xl border text-center transition-all ${
                daysPerWeek === n
                  ? 'bg-secondary/20 border-secondary/60 text-accent'
                  : 'border-border text-textMuted hover:border-secondary/40'
              }`}
            >
              <div className="font-display text-3xl text-textPrimary">{n}</div>
              <div className="text-xs text-textMuted mt-0.5">{t('onboarding.schedule.days')}</div>
            </motion.button>
          ))}
        </div>

        {/* Day selector */}
        <div>
          <p className="text-sm text-textMuted mb-3">{t('onboarding.schedule.selectDays')}</p>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map((day) => {
              const isSelected = trainingDays.includes(day.id)
              const isDisabled = !isSelected && trainingDays.length >= daysPerWeek

              return (
                <motion.button
                  key={day.id}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => toggleDay(day.id)}
                  disabled={isDisabled}
                  className={`
                    px-4 py-3 rounded-xl border text-sm font-medium transition-all
                    ${isSelected
                      ? 'bg-accent text-bg border-accent'
                      : 'border-border text-textMuted hover:border-secondary/40'
                    }
                    ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}
                  `}
                >
                  {t(day.key)}
                </motion.button>
              )
            })}
          </div>
          <p className="text-xs text-textMuted mt-2">
            {trainingDays.length} / {daysPerWeek} selected
          </p>
        </div>

        <div className="flex-1" />
        <Button size="lg" fullWidth onClick={onNext} disabled={!canProceed}>
          {t('onboarding.next')}
        </Button>
      </div>
    </OnboardingLayout>
  )
}
