import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { Exercise, ActiveExercise, Phase } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { SetRow } from './SetRow'
import { SubstituteSheet } from './SubstituteSheet'

interface ExerciseCardProps {
  exercise: Exercise
  activeExercise: ActiveExercise
  phase: Phase
  unitLabel: string
  onUpdateSet: (setIndex: number, updates: Record<string, string | number | boolean>) => void
  onCompleteSet: (setIndex: number) => void
  onSubstitute: (substituteIndex: number) => void
  isActive?: boolean
  previousSets?: Array<{ weight: number | null; reps: number | null } | null>
}

export function ExerciseCard({
  exercise,
  activeExercise,
  phase,
  unitLabel,
  onUpdateSet,
  onCompleteSet,
  onSubstitute,
  isActive = true,
  previousSets,
}: ExerciseCardProps) {
  const { t } = useTranslation()
  const [showWhy, setShowWhy] = useState(false)
  const [showSubs, setShowSubs] = useState(false)

  const phaseKey = `phase${phase}` as 'phase1' | 'phase2' | 'phase3' | 'phase4'
  const target = exercise.phaseTargets[phaseKey]

  const setsLabel = exercise.isTimeBased
    ? `${target.sets} × ${target.repsMin}–${target.repsMax}s`
    : `${target.sets} × ${target.repsMin}${target.repsMax !== target.repsMin ? `–${target.repsMax}` : ''}`

  const completedSets = activeExercise.sets.filter((s) => s.completed).length
  const allComplete = completedSets === activeExercise.sets.length

  const displayName = activeExercise.substitutedWith
    ? t(activeExercise.substitutedWith)
    : t(exercise.nameKey)

  return (
    <>
      <motion.div
        layout
        className={`bg-card border rounded-2xl overflow-hidden transition-all duration-300 ${
          exercise.isKey ? 'border-danger/30' : 'border-border'
        } ${allComplete ? 'opacity-70' : ''}`}
      >
        {/* Header */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {exercise.isKey && (
                  <Badge variant="key" size="sm">♠ {t('workout.key')}</Badge>
                )}
                {activeExercise.substitutedWith && (
                  <Badge variant="accent" size="sm">Substituted</Badge>
                )}
              </div>
              <h3 className="text-textPrimary font-medium text-lg leading-tight">{displayName}</h3>
              <p className="text-sm text-textMuted mt-0.5">{t(exercise.muscleTargetKey)}</p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="font-mono text-sm text-highlight bg-secondary/10 px-2 py-1 rounded-lg">
                {setsLabel}
              </span>
              {target.isDropset && (
                <Badge variant="accent" size="sm">{t('workout.dropset')}</Badge>
              )}
              <span className="text-xs text-textMuted">
                {t('workout.restSeconds', { seconds: exercise.restSeconds })}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-accent rounded-full"
                animate={{ width: `${(completedSets / activeExercise.sets.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-xs font-mono text-textMuted">
              {completedSets}/{activeExercise.sets.length}
            </span>
          </div>

          {/* Actions row */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setShowWhy((p) => !p)}
              className="flex items-center gap-1.5 text-xs text-textMuted hover:text-accent transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {t('workout.whyThisExercise')}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className={`w-3 h-3 transition-transform ${showWhy ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {exercise.substitutes.length > 0 && (
              <button
                onClick={() => setShowSubs(true)}
                className="ml-auto flex items-center gap-1.5 text-xs text-secondary hover:text-highlight transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 014-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 01-4 4H3" />
                </svg>
                {t('workout.substitute')}
              </button>
            )}
          </div>

          {/* WHY expandable */}
          <AnimatePresence>
            {showWhy && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-3 bg-secondary/8 border border-secondary/20 rounded-xl">
                  <p className="text-sm text-textMuted leading-relaxed">{t(exercise.whyKey)}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Set rows */}
        {isActive && (
          <div className="px-4 pb-4 flex flex-col gap-2">
            {activeExercise.sets.map((set, i) => (
              <SetRow
                key={i}
                set={set}
                unitLabel={unitLabel}
                isTimeBased={exercise.isTimeBased}
                onChange={(updates) => onUpdateSet(i, updates as Record<string, string | number | boolean>)}
                onComplete={() => onCompleteSet(i)}
                previousSet={previousSets?.[i] ?? null}
              />
            ))}
          </div>
        )}
      </motion.div>

      <SubstituteSheet
        visible={showSubs}
        substitutes={exercise.substitutes}
        onSelect={(idx) => {
          onSubstitute(idx)
        }}
        onClose={() => setShowSubs(false)}
      />
    </>
  )
}
