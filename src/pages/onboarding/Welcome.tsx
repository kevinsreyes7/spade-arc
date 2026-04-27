import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { useAuthContext } from '@/context/AuthContext'
import { useProfile } from '@/context/ProfileContext'
import { MatrixRain } from '@/components/MatrixRain'

export function Welcome() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { profile } = useProfile()

  if (user && profile?.onboarding_complete) {
    navigate('/home', { replace: true })
    return null
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between px-6 py-12 overflow-hidden" style={{ backgroundColor: '#0a0d1a' }}>
      {/* Cosmic nebula at 20% opacity — adds depth behind the rain */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.2,
        }}
      />
      <MatrixRain />

      {/* Top — brand */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center pt-8"
      >
        <motion.div
          animate={{ rotate: [0, 3, -3, 0], scale: [1, 1.04, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="text-7xl mb-6 filter drop-shadow-[0_0_30px_rgba(200,212,240,0.3)]"
        >
          ♠
        </motion.div>
        <h1 className="font-display text-6xl text-accent tracking-superwide text-center mb-1">
          SPADE ARC
        </h1>
        <p className="text-textMuted text-sm tracking-widest">{t('app.by')}</p>
      </motion.div>

      {/* Middle — tagline */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="relative z-10 text-center"
      >
        <h2 className="font-display text-4xl text-textPrimary tracking-wider mb-4">
          {t('onboarding.welcome.title')}
          <br />
          {t('onboarding.welcome.subtitle')}
        </h2>
        <p className="text-textMuted text-base leading-relaxed max-w-xs mx-auto">
          {t('onboarding.welcome.body')}
        </p>
      </motion.div>

      {/* Bottom — CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="relative z-10 flex flex-col items-center gap-4 w-full max-w-sm"
      >
        <Link to="/onboarding" className="w-full">
          <Button size="xl" fullWidth className="font-display text-2xl tracking-widest">
            {t('onboarding.getStarted')}
          </Button>
        </Link>
        <p className="text-textMuted text-sm">
          {t('onboarding.alreadyHaveAccount')}{' '}
          <Link to="/login" className="text-accent underline-offset-4 hover:underline">
            {t('onboarding.login')}
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
