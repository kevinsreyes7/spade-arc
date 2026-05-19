import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { getPhaseName } from '@/data/workouts'
import type { DayOfWeek } from '@/types'

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
}

interface ReadyProps {
  name: string
  trainingDays: DayOfWeek[]
  weightKg: number
  units: 'metric' | 'imperial'
  onEnter: () => void
  loading?: boolean
  error?: string
}

function calcNutrition(weightKg: number) {
  const lbs = weightKg * 2.20462
  const calories = Math.round(lbs * 17)
  const protein = Math.round(lbs)
  return { calories, protein }
}

export function Ready({ name, trainingDays, weightKg, units, onEnter, loading = false, error }: ReadyProps) {
  const { calories, protein } = calcNutrition(weightKg || 80)
  const weightDisplay = units === 'imperial'
    ? `${Math.round(weightKg * 2.20462)} lbs`
    : `${Math.round(weightKg)} kg`

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-between px-6 py-10 overflow-hidden">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="text-6xl filter drop-shadow-[0_0_30px_rgba(200,212,240,0.4)]"
      >
        ♠
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center w-full max-w-sm"
      >
        <h1 className="font-display text-5xl text-textPrimary tracking-wider mb-1">
          YOUR ARC STARTS NOW
        </h1>
        <p className="text-textMuted text-sm mb-8">Program overview below. You can adjust anything in Profile.</p>

        <div className="bg-card border border-border rounded-2xl p-5 text-left space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="phase">{getPhaseName(1)}</Badge>
            <span className="text-xs text-textMuted font-mono">20 Weeks</span>
          </div>

          <div>
            <p className="font-display text-xl text-accent tracking-wide">{name}</p>
            <p className="text-xs text-textMuted mt-0.5">Phase I — Foundation: Mind & Muscle</p>
          </div>

          <div>
            <p className="text-xs text-textMuted tracking-widest uppercase mb-2">Training Days</p>
            <div className="flex gap-1.5 flex-wrap">
              {trainingDays.map((d) => (
                <span key={d} className="px-2.5 py-1 bg-secondary/15 border border-secondary/25 rounded-lg text-xs text-highlight font-medium">
                  {DAY_LABELS[d]}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs text-textMuted tracking-widest uppercase mb-3">Your Daily Targets</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg rounded-xl p-3 border border-border">
                <p className="font-mono text-accent text-xl font-medium">{calories}</p>
                <p className="text-xs text-textMuted mt-0.5">Calories</p>
              </div>
              <div className="bg-bg rounded-xl p-3 border border-border">
                <p className="font-mono text-accent text-xl font-medium">{protein}g</p>
                <p className="text-xs text-textMuted mt-0.5">Protein</p>
              </div>
            </div>
            <p className="text-xs text-textMuted mt-2">Based on {weightDisplay} — Phase I lean bulk targets</p>
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-xs text-textMuted">Program by Sazyi Rey</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-sm"
      >
        <Button size="xl" fullWidth loading={loading} onClick={onEnter}
          className="font-display text-2xl tracking-widest">
          ENTER THE ARC
        </Button>
        {error && (
          <p className="text-danger text-sm text-center mt-2 px-2">{error}</p>
        )}
      </motion.div>
    </div>
  )
}
