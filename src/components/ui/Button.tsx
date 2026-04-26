import { motion } from 'framer-motion'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  children: ReactNode
  fullWidth?: boolean
}

const variants = {
  primary: 'bg-accent text-bg font-medium hover:bg-accent/90 active:scale-[0.98]',
  secondary: 'bg-secondary/20 text-accent border border-secondary/40 hover:bg-secondary/30',
  ghost: 'bg-transparent text-textMuted hover:text-textPrimary hover:bg-white/5',
  danger: 'bg-danger text-white hover:bg-danger/90',
  outline: 'bg-transparent border border-border text-textPrimary hover:border-secondary',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-base rounded-xl',
  lg: 'px-6 py-3.5 text-lg rounded-xl',
  xl: 'px-8 py-4 text-xl rounded-2xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
      disabled={disabled || loading}
      className={`
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        font-body font-medium tracking-wide
        transition-all duration-200
        disabled:opacity-40 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${className}
      `}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {children}
        </span>
      ) : children}
    </motion.button>
  )
}
