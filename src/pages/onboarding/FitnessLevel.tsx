import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { OnboardingLayout } from './OnboardingLayout'
import { Button } from '@/components/ui/Button'
import type { FitnessLevel as FitnessLevelType } from '@/types'

const LEVELS: { id: FitnessLevelType; icon: string; titleKey: string; descKey: string; color: string }[] = [
  { id: 'beginner', icon: '🌱', titleKey: 'onboarding.level.beginner', descKey: 'onboarding.level.beginnerDesc', color: 'phase-1' },
  { id: 'intermediate', icon: '🔥', titleKey: 'onboarding.level.intermediate', descKey: 'onboarding.level.intermediateDesc', color: 'phase-2' },
  { id: 'advanced', icon: '⚡', titleKey: 'onboarding.level.advanced', descKey: 'onboarding.level.advancedDesc', color: 'phase-3' },
  { id: 'elite', icon: '♠', titleKey: 'onboarding.level.elite', descKey: 'onboarding.level.eliteDesc', color: 'phase-3' },
]

interface FitnessLevelProps {
  selected: FitnessLevelType | ''
  onChange: (level: FitnessLevelType) => void
  onNext: () => void
  onBack: () => void
}

export function FitnessLevel({ selected, onChange, onNext, onBack }: FitnessLevelProps) {
  const { t } = useTranslation()

  return (
    <OnboardingLayout step={7} totalSteps={9} onBack={onBack}>
      <div className="flex flex-col gap-6 flex-1">
        <div>
          <h1 className="font-display text-4xl text-textPrimary tracking-wide mb-1">
            {t('onboarding.level.title')}
          </h1>
          <p className="text-textMuted text-sm">{t('onboarding.level.subtitle')}</p>
        </div>

        <div className="flex flex-col gap-4">
          {LEVELS.map((level, i) => (
            <motion.button
              key={level.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onChange(level.id)}
              className={`
                p-5 rounded-2xl border text-left transition-all duration-200
                ${selected === level.id
                  ? 'bg-secondary/20 border-secondary/60'
                  : 'bg-card border-border hover:border-secondary/40'
                }
              `}
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">{level.icon}</span>
                <div>
                  <p className={`font-display text-2xl tracking-wide ${selected === level.id ? 'text-accent' : 'text-textPrimary'}`}>
                    {t(level.titleKey)}
                  </p>
                  <p className="text-sm text-textMuted mt-0.5">{t(level.descKey)}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="flex-1" />
        <Button size="lg" fullWidth onClick={onNext} disabled={!selected}>
          {t('onboarding.next')}
        </Button>
      </div>
    </OnboardingLayout>
  )
}
