import { useTranslation } from 'react-i18next'
import { OnboardingLayout } from './OnboardingLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { DayOfWeek } from '@/types'

const DAYS: { id: DayOfWeek; labelKey: string }[] = [
  { id: 'mon', labelKey: 'onboarding.schedule.mon' },
  { id: 'tue', labelKey: 'onboarding.schedule.tue' },
  { id: 'wed', labelKey: 'onboarding.schedule.wed' },
  { id: 'thu', labelKey: 'onboarding.schedule.thu' },
  { id: 'fri', labelKey: 'onboarding.schedule.fri' },
  { id: 'sat', labelKey: 'onboarding.schedule.sat' },
  { id: 'sun', labelKey: 'onboarding.schedule.sun' },
]

function DayPicker({ selected, onChange }: { selected: DayOfWeek[]; onChange: (days: DayOfWeek[]) => void }) {
  const { t } = useTranslation()
  const toggle = (d: DayOfWeek) =>
    onChange(selected.includes(d) ? selected.filter((x) => x !== d) : [...selected, d])

  return (
    <div className="flex gap-1.5 flex-wrap">
      {DAYS.map((d) => (
        <button
          key={d.id}
          onClick={() => toggle(d.id)}
          className={`px-3 py-2 rounded-lg text-sm border transition-all ${
            selected.includes(d.id)
              ? 'bg-secondary/20 border-secondary/50 text-accent'
              : 'border-border text-textMuted hover:border-secondary/30'
          }`}
        >
          {t(d.labelKey)}
        </button>
      ))}
    </div>
  )
}

interface PhysicalLifeData {
  physicalJob: boolean
  physicalJobDays: DayOfWeek[]
  hasSport: boolean
  sportDays: DayOfWeek[]
  sportName: string
}

interface PhysicalLifeProps {
  data: PhysicalLifeData
  onChange: (updates: Partial<PhysicalLifeData>) => void
  onNext: () => void
  onBack: () => void
}

export function PhysicalLife({ data, onChange, onNext, onBack }: PhysicalLifeProps) {
  const { t } = useTranslation()

  return (
    <OnboardingLayout step={8} totalSteps={9} onBack={onBack}>
      <div className="flex flex-col gap-8 flex-1">
        <div>
          <h1 className="font-display text-4xl text-textPrimary tracking-wide mb-1">
            {t('onboarding.physicalLife.title')}
          </h1>
          <p className="text-textMuted text-sm">{t('onboarding.physicalLife.subtitle')}</p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Physical job */}
          <div className="flex flex-col gap-3">
            <p className="text-textPrimary font-medium">{t('onboarding.physicalLife.physicalJob')}</p>
            <div className="flex gap-3">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  onClick={() => onChange({ physicalJob: val })}
                  className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                    data.physicalJob === val
                      ? 'bg-secondary/20 border-secondary/50 text-accent'
                      : 'border-border text-textMuted hover:border-secondary/30'
                  }`}
                >
                  {t(val ? 'onboarding.physicalLife.yes' : 'onboarding.physicalLife.no')}
                </button>
              ))}
            </div>
            {data.physicalJob && (
              <div>
                <p className="text-sm text-textMuted mb-2">{t('onboarding.physicalLife.physicalJobDays')}</p>
                <DayPicker selected={data.physicalJobDays} onChange={(days) => onChange({ physicalJobDays: days })} />
              </div>
            )}
          </div>

          {/* Sport / activity */}
          <div className="flex flex-col gap-3">
            <p className="text-textPrimary font-medium">{t('onboarding.physicalLife.hasSport')}</p>
            <div className="flex gap-3">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  onClick={() => onChange({ hasSport: val })}
                  className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                    data.hasSport === val
                      ? 'bg-secondary/20 border-secondary/50 text-accent'
                      : 'border-border text-textMuted hover:border-secondary/30'
                  }`}
                >
                  {t(val ? 'onboarding.physicalLife.yes' : 'onboarding.physicalLife.no')}
                </button>
              ))}
            </div>
            {data.hasSport && (
              <div className="flex flex-col gap-3">
                <Input
                  label={t('onboarding.physicalLife.sportName')}
                  value={data.sportName}
                  onChange={(e) => onChange({ sportName: e.target.value })}
                  placeholder="e.g. Basketball, Football"
                />
                <div>
                  <p className="text-sm text-textMuted mb-2">{t('onboarding.physicalLife.sportDays')}</p>
                  <DayPicker selected={data.sportDays} onChange={(days) => onChange({ sportDays: days })} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1" />
        <Button size="lg" fullWidth onClick={onNext}>
          {t('onboarding.next')}
        </Button>
      </div>
    </OnboardingLayout>
  )
}
