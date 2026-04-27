import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const tabs = [
  {
    to: '/home',
    labelKey: 'nav.home',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    to: '/schedule',
    labelKey: 'nav.train',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path d="M6 4v16M18 4v16M6 12h12M3 4h4M17 4h4M3 20h4M17 20h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/progress',
    labelKey: 'nav.progress',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    to: '/nutrition',
    labelKey: 'nav.nutrition',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path d="M18 8h1a4 4 0 010 8h-1" />
        <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
  },
  {
    to: '/library',
    labelKey: 'nav.library',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  },
]

export function BottomNav() {
  const { t } = useTranslation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 border-t border-border bottom-nav">
      <div className="flex">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors duration-200 ${
                isActive ? 'text-accent' : 'text-textMuted hover:text-textPrimary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <motion.div
                  animate={{ scale: isActive ? 1 : 0.9, y: isActive ? -1 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {tab.icon}
                </motion.div>
                <span className="text-[10px] font-medium tracking-wide">{t(tab.labelKey)}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-dot"
                    className="w-1 h-1 rounded-full bg-accent mt-0.5"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
