import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface OnboardingLayoutProps {
  children: ReactNode
  step: number
  totalSteps: number
  onBack?: () => void
  showBack?: boolean
}

export function OnboardingLayout({
  children,
  step,
  totalSteps,
  onBack,
  showBack = true,
}: OnboardingLayoutProps) {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Progress bar */}
      <div className="h-0.5 bg-border">
        <motion.div
          className="h-full bg-accent"
          animate={{ width: `${(step / totalSteps) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        {showBack && onBack ? (
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-textMuted hover:text-textPrimary transition-colors"
            aria-label={t('onboarding.back')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        ) : (
          <div className="w-10" />
        )}
        <span className="text-xs text-textMuted font-medium tracking-wider">
          {t('onboarding.step', { current: step, total: totalSteps })}
        </span>
        <div className="w-10" />
      </div>

      {/* Content */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex-1 flex flex-col px-5 pt-4 pb-8"
      >
        {children}
      </motion.div>
    </div>
  )
}
