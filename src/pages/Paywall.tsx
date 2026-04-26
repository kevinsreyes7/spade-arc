import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useProfile } from '@/context/ProfileContext'
import { useSubscription } from '@/hooks/useSubscription'
import { Button } from '@/components/ui/Button'
import { redirectToCheckout } from '@/lib/stripe'

export function Paywall() {
  const { t } = useTranslation()
  const { profile } = useProfile()
  const { isCancelled } = useSubscription()
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      await redirectToCheckout(profile?.stripe_customer_id ?? undefined)
    } catch {
      setLoading(false)
    }
  }

  const features: string[] = t('paywall.features', { returnObjects: true }) as string[]

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="text-5xl mb-4"
          >
            ♠
          </motion.div>
          <h1 className="font-display text-4xl text-textPrimary tracking-wider mb-2">
            {isCancelled ? t('paywall.cancelled.title') : t('paywall.title')}
          </h1>
          <p className="text-textMuted">
            {isCancelled ? t('paywall.cancelled.body') : t('paywall.subtitle')}
          </p>
        </div>

        {/* Price card */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-end gap-1 justify-center mb-5">
            <span className="font-display text-6xl text-accent tracking-wide">{t('paywall.price')}</span>
            <span className="text-textMuted mb-2">{t('paywall.period')}</span>
          </div>

          <div className="flex flex-col gap-3">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#7b9fd4" strokeWidth={2.5} className="w-3 h-3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-sm text-textMuted">{feature}</p>
              </div>
            ))}
          </div>
        </div>

        <Button
          size="xl"
          fullWidth
          loading={loading}
          onClick={handleSubscribe}
          className="font-display text-xl tracking-widest mb-3"
        >
          {isCancelled ? t('paywall.cancelled.cta') : t('paywall.cta')}
        </Button>

        <p className="text-xs text-textMuted text-center">{t('paywall.guarantee')}</p>
      </motion.div>
    </div>
  )
}
