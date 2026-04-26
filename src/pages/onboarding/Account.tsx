import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { OnboardingLayout } from './OnboardingLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'

interface AccountProps {
  onNext: () => void
}

export function Account({ onNext }: AccountProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || password.length < 8) {
      setError(t('auth.error.weakPassword'))
      return
    }
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      if (authError.message.includes('already')) {
        setError(t('auth.error.emailInUse'))
      } else {
        setError(authError.message)
      }
      setLoading(false)
      return
    }

    // If email confirmation is enabled, session will be null — tell the user
    if (!data.session) {
      setError('Check your email to confirm your account, then log in.')
      setLoading(false)
      return
    }

    onNext()
  }

  return (
    <OnboardingLayout step={2} totalSteps={9} onBack={() => navigate('/')} showBack>
      <div className="flex flex-col gap-8 flex-1">
        <div>
          <div className="inline-flex items-center gap-2 bg-secondary/15 border border-secondary/25 rounded-full px-3 py-1 mb-4">
            <span className="text-xs text-highlight font-medium">{t('onboarding.account.trialBadge')}</span>
          </div>
          <h1 className="font-display text-4xl text-textPrimary tracking-wide">
            {t('onboarding.account.title')}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
          <Input
            label={t('onboarding.account.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            required
          />
          <Input
            label={t('onboarding.account.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={t('onboarding.account.passwordHint')}
            autoComplete="new-password"
            required
          />
          {error && <p className="text-danger text-sm">{error}</p>}

          <div className="flex-1" />

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={loading}
          >
            {loading ? t('onboarding.account.creating') : t('onboarding.account.create')}
          </Button>

          <p className="text-xs text-textMuted text-center">{t('onboarding.account.terms')}</p>
        </form>
      </div>
    </OnboardingLayout>
  )
}
