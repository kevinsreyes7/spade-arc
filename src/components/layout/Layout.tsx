import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'

interface LayoutProps {
  children: ReactNode
  hideNav?: boolean
}

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
}

export function Layout({ children, hideNav = false }: LayoutProps) {
  const location = useLocation()

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={`flex-1 overflow-y-auto ${hideNav ? '' : 'pb-24'}`}
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      {!hideNav && <BottomNav />}
    </div>
  )
}
