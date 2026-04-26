import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(t('auth.error.invalidCredentials'))
      setLoading(false)
      return
    }

    navigate('/home')
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <span className="text-4xl">♠</span>
          <h1 className="font-display text-4xl text-textPrimary tracking-wider mt-3 mb-1">
            {t('auth.loginTitle')}
          </h1>
          <p className="text-textMuted text-sm">{t('app.name')}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label={t('auth.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && <p className="text-danger text-sm">{error}</p>}

          <Button type="submit" size="lg" fullWidth loading={loading}>
            {loading ? t('auth.loggingIn') : t('auth.login')}
          </Button>
        </form>

        <p className="text-center text-sm text-textMuted mt-5">
          {t('auth.noAccount')}{' '}
          <Link to="/" className="text-accent hover:underline underline-offset-4">
            {t('auth.signUp')}
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
