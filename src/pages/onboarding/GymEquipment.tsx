import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { OnboardingLayout } from './OnboardingLayout'
import { Button } from '@/components/ui/Button'
import type { Equipment } from '@/types'

const OPTIONS: { id: Equipment; icon: string; titleKey: string; descKey: string }[] = [
  { id: 'full_gym', icon: '🏋️', titleKey: 'onboarding.gym.fullGym', descKey: 'onboarding.gym.fullGymDesc' },
  { id: 'full_gym_sprint', icon: '⚡', titleKey: 'onboarding.gym.fullGymSprint', descKey: 'onboarding.gym.fullGymSprintDesc' },
  { id: 'barbells_dumbbells', icon: '🔩', titleKey: 'onboarding.gym.barbellsDumbbells', descKey: 'onboarding.gym.barbellsDumbbellsDesc' },
  { id: 'bodyweight', icon: '🧘', titleKey: 'onboarding.gym.bodyweight', descKey: 'onboarding.gym.bodyweightDesc' },
]

interface GymEquipmentProps {
  selected: Equipment | ''
  onChange: (equipment: Equipment) => void
  onNext: () => void
  onBack: () => void
}

export function GymEquipment({ selected, onChange, onNext, onBack }: GymEquipmentProps) {
  const { t } = useTranslation()

  return (
    <OnboardingLayout step={6} totalSteps={9} onBack={onBack}>
      <div className="flex flex-col gap-6 flex-1">
        <div>
          <h1 className="font-display text-4xl text-textPrimary tracking-wide mb-1">
            {t('onboarding.gym.title')}
          </h1>
          <p className="text-textMuted text-sm">{t('onboarding.gym.subtitle')}</p>
        </div>

        <div className="flex flex-col gap-3">
          {OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => onChange(opt.id)}
              className={`
                flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200
                ${selected === opt.id
                  ? 'bg-secondary/20 border-secondary/60 shadow-glow'
                  : 'bg-card border-border hover:border-secondary/40'
                }
              `}
            >
              <span className="text-3xl">{opt.icon}</span>
              <div className="flex-1">
                <p className={`font-medium ${selected === opt.id ? 'text-accent' : 'text-textPrimary'}`}>
                  {t(opt.titleKey)}
                </p>
                <p className="text-sm text-textMuted">{t(opt.descKey)}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${
                selected === opt.id ? 'bg-accent border-accent' : 'border-textMuted'
              }`}>
                {selected === opt.id && (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#0a0d1a" strokeWidth={3} className="w-3 h-3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
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
