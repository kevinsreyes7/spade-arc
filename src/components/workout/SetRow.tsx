import { useState } from 'react'
import type { ActiveSet } from '@/types'
import { StarRating } from '@/components/ui/StarRating'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'

interface SetRowProps {
  set: ActiveSet
  unitLabel: string
  onChange: (updates: Partial<ActiveSet>) => void
  onComplete: () => void
  isTimeBased?: boolean
  previousSet?: { weight: number | null; reps: number | null } | null
}

export function SetRow({ set, unitLabel, onChange, onComplete, isTimeBased = false, previousSet }: SetRowProps) {
  const { t } = useTranslation()
  const [showNotes, setShowNotes] = useState(false)

  return (
    <motion.div
      layout
      className={`rounded-xl border transition-colors duration-200 ${
        set.completed
          ? 'bg-secondary/10 border-secondary/30'
          : 'bg-bg/50 border-border/50'
      }`}
    >
      <div className="flex items-center gap-2 p-3">
        {/* Set number */}
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-mono text-sm font-medium
          ${set.completed ? 'bg-accent text-bg' : 'bg-border/40 text-textMuted'}
        `}>
          {set.setNumber}
        </div>

        {/* Weight input */}
        <div className="flex-1 flex flex-col gap-0.5">
          <span className="text-[10px] text-textMuted uppercase tracking-widest">{t('workout.weight')} ({unitLabel})</span>
          <input
            type="number"
            inputMode="decimal"
            value={set.weight}
            onChange={(e) => onChange({ weight: e.target.value })}
            placeholder="0"
            className="bg-transparent text-textPrimary font-mono text-lg w-full focus:outline-none"
          />
        </div>

        {/* Reps input */}
        <div className="flex-1 flex flex-col gap-0.5">
          <span className="text-[10px] text-textMuted uppercase tracking-widest">
            {isTimeBased ? t('common.sec') : t('workout.reps')}
          </span>
          <input
            type="number"
            inputMode="numeric"
            value={set.reps}
            onChange={(e) => onChange({ reps: e.target.value })}
            placeholder="0"
            className="bg-transparent text-textPrimary font-mono text-lg w-full focus:outline-none"
          />
        </div>

        {/* Feel rating */}
        <div className="flex flex-col gap-0.5 items-center">
          <span className="text-[10px] text-textMuted uppercase tracking-widest">{t('workout.feel')}</span>
          <StarRating
            value={set.feelRating}
            onChange={(val) => onChange({ feelRating: val })}
            size={16}
          />
        </div>

        {/* Notes toggle */}
        <button
          type="button"
          onClick={() => setShowNotes((p) => !p)}
          className="p-1.5 text-textMuted hover:text-textPrimary transition-colors"
          aria-label="Toggle notes"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>

        {/* Complete button */}
        <button
          type="button"
          onClick={onComplete}
          className={`
            w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
            transition-all duration-200 active:scale-90
            ${set.completed
              ? 'bg-accent text-bg'
              : 'bg-transparent border-2 border-textMuted/40 text-textMuted hover:border-accent hover:text-accent'
            }
          `}
          aria-label={t('workout.tickSet')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>

      {/* Previous session hint */}
      {previousSet && previousSet.weight != null && (
        <p className="px-3 pb-1 text-[10px] font-mono text-textMuted/50">
          Last session: {previousSet.weight}{unitLabel} × {previousSet.reps ?? '—'}
        </p>
      )}

      <AnimatePresence>
        {showNotes && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden px-3 pb-3"
          >
            <textarea
              rows={2}
              placeholder={t('workout.notes')}
              value={set.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              className="w-full bg-bg/60 border border-border/50 rounded-lg px-3 py-2 text-sm text-textPrimary placeholder:text-textMuted/50 focus:outline-none focus:border-secondary resize-none"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
