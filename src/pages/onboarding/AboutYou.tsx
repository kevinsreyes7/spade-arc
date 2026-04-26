import { useTranslation } from 'react-i18next'
import { OnboardingLayout } from './OnboardingLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Sex, UnitPreference } from '@/types'

interface AboutYouData {
  name: string
  age: string
  sex: Sex
  heightCm: string
  weightKg: string
  units: UnitPreference
}

interface AboutYouProps {
  data: AboutYouData
  onChange: (data: Partial<AboutYouData>) => void
  onNext: () => void
  onBack: () => void
}

export function AboutYou({ data, onChange, onNext, onBack }: AboutYouProps) {
  const { t } = useTranslation()

  const isMetric = data.units === 'metric'

  const heightLabel = isMetric ? t('common.cm') : t('common.ft')
  const weightLabel = isMetric ? t('common.kg') : t('common.lbs')

  const canProceed = data.name && data.age && data.sex && data.heightCm && data.weightKg

  return (
    <OnboardingLayout step={3} totalSteps={9} onBack={onBack}>
      <div className="flex flex-col gap-6 flex-1">
        <div>
          <h1 className="font-display text-4xl text-textPrimary tracking-wide mb-1">
            {t('onboarding.aboutYou.title')}
          </h1>
          <p className="text-textMuted text-sm">{t('onboarding.aboutYou.subtitle')}</p>
        </div>

        {/* Unit toggle */}
        <div className="flex rounded-xl overflow-hidden border border-border">
          {(['metric', 'imperial'] as UnitPreference[]).map((unit) => (
            <button
              key={unit}
              onClick={() => onChange({ units: unit })}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                data.units === unit
                  ? 'bg-secondary/20 text-accent'
                  : 'text-textMuted hover:text-textPrimary'
              }`}
            >
              {t(`onboarding.aboutYou.${unit}`)}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <Input
            label={t('onboarding.aboutYou.name')}
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            autoCapitalize="words"
          />
          <Input
            label={t('onboarding.aboutYou.age')}
            type="number"
            inputMode="numeric"
            value={data.age}
            onChange={(e) => onChange({ age: e.target.value })}
            min="13"
            max="80"
          />

          {/* Sex selector */}
          <div>
            <p className="text-sm text-textMuted font-medium tracking-wide mb-2">
              {t('onboarding.aboutYou.sex')}
            </p>
            <div className="flex gap-2">
              {(['male', 'female', 'other'] as Sex[]).map((s) => (
                <button
                  key={s}
                  onClick={() => onChange({ sex: s })}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${
                    data.sex === s
                      ? 'bg-secondary/20 border-secondary/50 text-accent'
                      : 'border-border text-textMuted hover:border-secondary/40'
                  }`}
                >
                  {t(`onboarding.aboutYou.${s}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                label={`${t('onboarding.aboutYou.height')} (${heightLabel})`}
                type="number"
                inputMode="decimal"
                value={data.heightCm}
                onChange={(e) => onChange({ heightCm: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <Input
                label={`${t('onboarding.aboutYou.weight')} (${weightLabel})`}
                type="number"
                inputMode="decimal"
                value={data.weightKg}
                onChange={(e) => onChange({ weightKg: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex-1" />
        <Button size="lg" fullWidth onClick={onNext} disabled={!canProceed}>
          {t('onboarding.next')}
        </Button>
      </div>
    </OnboardingLayout>
  )
}
