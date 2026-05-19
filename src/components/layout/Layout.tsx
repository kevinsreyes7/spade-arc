import { useState, useCallback, type ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { MatrixRain } from '@/components/MatrixRain'
import { BulletFreeze } from '@/components/BulletFreeze'

interface LayoutProps {
  children: ReactNode
  hideNav?: boolean
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
}

export function Layout({ children, hideNav = false }: LayoutProps) {
  const location = useLocation()
  const [freeze, setFreeze] = useState(false)
  const [prevKey, setPrevKey] = useState(location.pathname)
  const [displayKey, setDisplayKey] = useState(location.pathname)

  const handleNavigate = useCallback(() => {
    if (location.pathname !== prevKey) {
      setFreeze(true)
      setPrevKey(location.pathname)
    }
  }, [location.pathname, prevKey])

  // Trigger bullet freeze on route change
  if (location.pathname !== prevKey && !freeze) {
    setFreeze(true)
    setPrevKey(location.pathname)
  }

  const handleFreezeComplete = useCallback(() => {
    setFreeze(false)
    setDisplayKey(location.pathname)
  }, [location.pathname])

  return (
    <div className="relative flex flex-col min-h-screen bg-bg overflow-hidden">
      {/* Subtle matrix rain on all authenticated pages */}
      <div style={{ position: 'fixed', inset: 0, opacity: 0.04, pointerEvents: 'none', zIndex: 0 }}>
        <MatrixRain />
      </div>

      <BulletFreeze isVisible={freeze} onComplete={handleFreezeComplete} />

      <AnimatePresence mode="wait">
        <motion.main
          key={displayKey}
          variants={pageVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={`relative z-10 flex-1 overflow-y-auto ${hideNav ? '' : 'pb-24'}`}
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
          onClick={handleNavigate}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      {!hideNav && <BottomNav />}
    </div>
  )
}
