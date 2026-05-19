import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

const tabs = [
  {
    to: '/home',
    label: 'Home',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.6} className="w-6 h-6">
        <path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" strokeLinejoin="round" />
        <path d="M9 22V12h6v10" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/train',
    label: 'Train',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-6 h-6">
        <path d="M6 4v16M18 4v16" strokeLinecap="round" />
        <path d="M6 12h12" strokeLinecap="round" />
        <path d="M3 6h3M18 6h3M3 18h3M18 18h3" strokeLinecap="round" />
        {active && <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />}
      </svg>
    ),
  },
  {
    to: '/progress',
    label: 'Progress',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-6 h-6">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
        {active && <circle cx="15" cy="21" r="1.5" fill="currentColor" stroke="none" />}
      </svg>
    ),
  },
  {
    to: '/nutrition',
    label: 'Nutrition',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-6 h-6">
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
        <path d="M12 6v6l4 2" strokeLinecap="round" />
        {active && <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />}
      </svg>
    ),
  },
  {
    to: '/library',
    label: 'Library',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-6 h-6">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" strokeLinecap="round" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        {active && <path d="M8 7h8M8 11h6M8 15h4" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />}
        {!active && <path d="M8 7h8M8 11h6M8 15h4" stroke="currentColor" strokeLinecap="round" />}
      </svg>
    ),
  },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 border-t border-border backdrop-blur-xl bottom-nav">
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
                  animate={{ scale: isActive ? 1.05 : 1, y: isActive ? -1 : 0 }}
                  transition={{ duration: 0.18, type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {tab.icon(isActive)}
                </motion.div>
                <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="w-1 h-1 rounded-full bg-accent"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
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
