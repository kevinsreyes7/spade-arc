import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'phase' | 'key' | 'success' | 'muted' | 'accent'
  size?: 'sm' | 'md'
  className?: string
}

const variants = {
  phase: 'bg-secondary/20 text-highlight border border-secondary/30',
  key: 'bg-danger/15 text-danger border border-danger/30 font-mono tracking-widest',
  success: 'bg-success/15 text-success border border-success/30',
  muted: 'bg-border/40 text-textMuted border border-border/20',
  accent: 'bg-accent/10 text-accent border border-accent/20',
}

const sizes = {
  sm: 'text-xs px-2 py-0.5 rounded-md',
  md: 'text-sm px-2.5 py-1 rounded-lg',
}

export function Badge({ children, variant = 'muted', size = 'sm', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center font-medium ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  )
}
