import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm text-textMuted font-medium tracking-wide">
          {label}
        </label>
      )}
      <input
        className={`
          w-full bg-bg border rounded-xl px-4 py-3
          text-textPrimary font-body placeholder:text-textMuted/50
          focus:outline-none focus:ring-1 focus:ring-secondary
          transition-colors duration-200
          ${error ? 'border-danger/60 focus:ring-danger/60' : 'border-border focus:border-secondary'}
          ${className}
        `}
        {...props}
      />
      {hint && !error && <p className="text-xs text-textMuted">{hint}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
