import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface RestTimerProps {
  seconds: number
  onDone: () => void
  onSkip: () => void
  visible: boolean
}

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function RestTimer({ seconds, onDone, onSkip, visible }: RestTimerProps) {
  const { t } = useTranslation()
  const [timeLeft, setTimeLeft] = useState(seconds)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(seconds))
  const totalSeconds = seconds

  useEffect(() => {
    setTimeLeft(seconds)
    setEditValue(String(seconds))
  }, [seconds])

  useEffect(() => {
    if (!visible) return
    if (timeLeft <= 0) { onDone(); return }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(id)
  }, [timeLeft, visible, onDone])

  const handleEditSubmit = useCallback(() => {
    const val = parseInt(editValue, 10)
    if (!isNaN(val) && val > 0) setTimeLeft(val)
    setIsEditing(false)
  }, [editValue])

  const progress = timeLeft / totalSeconds
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress)

  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const timeStr = mins > 0
    ? `${mins}:${String(secs).padStart(2, '0')}`
    : String(secs)

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop z-40"
            onClick={onSkip}
          />

          {/* Timer panel */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl p-6"
            style={{ paddingBottom: 'max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom)))' }}
          >
            <div className="flex flex-col items-center gap-6">
              <div className="w-8 h-1 bg-border rounded-full" />

              <h3 className="font-display text-xl text-textMuted tracking-widest">
                {t('workout.restTimer')}
              </h3>

              {/* Ring + time */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 128 128">
                  {/* Track */}
                  <circle cx="64" cy="64" r={RADIUS} fill="none" stroke="#1e2d4a" strokeWidth="6" />
                  {/* Progress */}
                  <circle
                    cx="64"
                    cy="64"
                    r={RADIUS}
                    fill="none"
                    stroke="#c8d4f0"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={strokeDashoffset}
                    className="timer-ring transition-[stroke-dashoffset] duration-1000 linear"
                  />
                </svg>

                {isEditing ? (
                  <input
                    autoFocus
                    type="number"
                    inputMode="numeric"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleEditSubmit}
                    onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit()}
                    className="relative z-10 w-20 text-center bg-transparent text-textPrimary font-mono text-4xl font-medium focus:outline-none"
                  />
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="relative z-10 font-mono text-4xl font-medium text-textPrimary hover:text-accent transition-colors"
                  >
                    {timeStr}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4 w-full">
                <button
                  onClick={onSkip}
                  className="flex-1 py-3 rounded-xl border border-border text-textMuted hover:text-textPrimary hover:border-secondary transition-colors font-medium"
                >
                  {t('workout.skip')}
                </button>
                <button
                  onClick={onDone}
                  className="flex-1 py-3 rounded-xl bg-accent text-bg font-medium hover:bg-accent/90 active:scale-[0.98] transition-all"
                >
                  {t('workout.done')}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
