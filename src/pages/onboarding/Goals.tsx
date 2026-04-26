import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { OnboardingLayout } from './OnboardingLayout'
import { Button } from '@/components/ui/Button'

const GOALS = [
  { id: 'posture', icon: '🧍', titleKey: 'onboarding.goals.posture', descKey: 'onboarding.goals.postureDesc' },
  { id: 'back', icon: '🔱', titleKey: 'onboarding.goals.back', descKey: 'onboarding.goals.backDesc' },
  { id: 'sixpack', icon: '⚡', titleKey: 'onboarding.goals.sixpack', descKey: 'onboarding.goals.sixpackDesc' },
  { id: 'waist', icon: '〰️', titleKey: 'onboarding.goals.waist', descKey: 'onboarding.goals.waistDesc' },
  { id: 'arms', icon: '💪', titleKey: 'onboarding.goals.arms', descKey: 'onboarding.goals.armsDesc' },
  { id: 'legs', icon: '🦵', titleKey: 'onboarding.goals.legs', descKey: 'onboarding.goals.legsDesc' },
]

interface GoalsProps {
  selected: string[]
  onChange: (goals: string[]) => void
  onNext: () => void
  onBack: () => void
}

export function Goals({ selected, onChange, onNext, onBack }: GoalsProps) {
  const { t } = useTranslation()

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((g) => g !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <OnboardingLayout step={4} totalSteps={9} onBack={onBack}>
      <div className="flex flex-col gap-6 flex-1">
        <div>
          <h1 className="font-display text-4xl text-textPrimary tracking-wide mb-1">
            {t('onboarding.goals.title')}
          </h1>
          <p className="text-textMuted text-sm">Choose your goals. Select as many as you want.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {GOALS.map((goal, i) => {
            const isSelected = selected.includes(goal.id)
            const isDisabled = false

            return (
              <motion.button
                key={goal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => toggle(goal.id)}
                disabled={isDisabled}
                className={`
                  text-left p-4 rounded-2xl border transition-all duration-200
                  ${isSelected
                    ? 'bg-secondary/20 border-secondary/60 shadow-glow'
                    : 'bg-card border-border hover:border-secondary/40'
                  }
                  ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
                `}
              >
                <div className="text-2xl mb-2">{goal.icon}</div>
                <p className={`font-medium text-sm ${isSelected ? 'text-accent' : 'text-textPrimary'}`}>
                  {t(goal.titleKey)}
                </p>
                <p className="text-xs text-textMuted mt-0.5">{t(goal.descKey)}</p>
                {isSelected && (
                  <div className="mt-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#0a0d1a" strokeWidth={3} className="w-3 h-3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>

        <div className="flex-1" />
        <Button size="lg" fullWidth onClick={onNext} disabled={selected.length === 0}>
          {t('onboarding.next')}
        </Button>
      </div>
    </OnboardingLayout>
  )
}
