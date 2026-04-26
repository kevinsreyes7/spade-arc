import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
}

export function Card({
  children,
  className = '',
  hover = false,
  glow = false,
  onClick,
  padding = 'md',
}: CardProps) {
  const base = `
    bg-card border border-border rounded-2xl
    ${paddings[padding]}
    ${hover ? 'card-hover cursor-pointer' : ''}
    ${glow ? 'shadow-glow' : ''}
    ${className}
  `

  if (onClick || hover) {
    return (
      <motion.div
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.1 }}
        onClick={onClick}
        className={base}
      >
        {children}
      </motion.div>
    )
  }

  return <div className={base}>{children}</div>
}
