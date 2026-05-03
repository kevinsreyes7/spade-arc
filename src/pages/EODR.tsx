import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/context/AuthContext'
import { useProfile } from '@/context/ProfileContext'
import { supabase } from '@/lib/supabase'
import { Layout } from '@/components/layout/Layout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getPhaseFromWeek } from '@/data/workouts'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcTargets(weightKg: number, phase: number) {
  const lbs = weightKg * 2.20462
  const isLeanBulk = phase <= 2
  const calories = Math.round(lbs * (isLeanBulk ? 17 : 14))
  const protein = Math.round(lbs)
  return { calories, protein }
}

const TATE_QUOTES = [
  "You are exactly where you deserve to be. Change your actions.",
  "The temporary pain of discipline is nothing compared to the permanent pain of regret.",
  "Do not tell people your plans. Show them your results.",
  "Comfort is the enemy of achievement. Get uncomfortable.",
  "Every action you take is either moving you toward the life you want or away from it.",
  "Winners focus on winning. Losers focus on winners.",
  "Your mind must be stronger than your feelings.",
  "Speed is extremely important. Do it now.",
  "The man who goes to the gym every single day regardless of how he feels will always beat the man who goes when he feels like it.",
  "You have to believe that you can achieve it before you can.",
]

// ─── Types ───────────────────────────────────────────────────────────────────

interface EODRData {
  workout: { workout_name: string; total_sets: number } | null
  morningDone: boolean
  eveningDone: boolean
  cardioType: string | null
  totalCalories: number
  totalProtein: number
  foodDescriptions: string[]
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EODR() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { profile } = useProfile()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<EODRData | null>(null)

  const quote = useMemo(() => TATE_QUOTES[Math.floor(Math.random() * TATE_QUOTES.length)], [])

  const weightKg = profile?.weight_kg ?? 80
  const week = profile?.current_week ?? 1
  const phase = getPhaseFromWeek(week)
  const targets = calcTargets(weightKg, phase)

  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]

    const load = async () => {
      const [sessions, decomp, cardio, foodLogs] = await Promise.all([
        supabase
          .from('workout_sessions')
          .select('workout_name, total_sets')
          .eq('user_id', user.id)
          .eq('date', today)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(1),
        supabase
          .from('decompression_logs')
          .select('type')
          .eq('user_id', user.id)
          .eq('date', today),
        supabase
          .from('cardio_logs')
          .select('cardio_type')
          .eq('user_id', user.id)
          .eq('date', today)
          .limit(1),
        supabase
          .from('food_logs')
          .select('description, calories, protein')
          .eq('user_id', user.id)
          .eq('date', today),
      ])

      const workout = sessions.data?.[0] ?? null
      const decompTypes = new Set((decomp.data ?? []).map((d: { type: string }) => d.type))
      const cardioLog = cardio.data?.[0] ?? null
      const foods = foodLogs.data ?? []

      setData({
        workout,
        morningDone: decompTypes.has('morning'),
        eveningDone: decompTypes.has('night'),
        cardioType: cardioLog?.cardio_type ?? null,
        totalCalories: foods.reduce((s: number, f: { calories?: number | null }) => s + (f.calories ?? 0), 0),
        totalProtein: foods.reduce((s: number, f: { protein?: number | null }) => s + (f.protein ?? 0), 0),
        foodDescriptions: foods.map((f: { description: string }) => f.description).slice(0, 5),
      })
      setLoading(false)
    }

    load()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  const proteinHit = data ? data.totalProtein >= targets.protein * 0.9 : false

  const proteinMessage = proteinHit
    ? "Protein target hit — muscle protein synthesis is running. Recovery is optimised."
    : "Protein target missed — muscle breakdown risk is higher overnight. Have casein or Greek yogurt now."

  const Check = () => (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-green-400 shrink-0">
      <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  const X = () => (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-red-400/70 shrink-0">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  )

  return (
    <Layout>
      <div className="px-4 pt-6 pb-8 max-w-lg mx-auto space-y-4">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">♠</span>
            <p className="text-xs text-textMuted tracking-widest uppercase">End of Day Report</p>
          </div>
          <h1 className="font-display text-4xl text-accent tracking-widest">EODR</h1>
          <p className="text-textMuted text-sm mt-0.5">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </motion.div>

        {/* Workout */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <Card>
            <p className="text-xs text-textMuted uppercase tracking-widest mb-2">Workout</p>
            {data?.workout ? (
              <div className="flex items-start gap-3">
                <Check />
                <div>
                  <p className="text-textPrimary font-medium">{t(data.workout.workout_name)}</p>
                  <p className="text-textMuted text-sm">{data.workout.total_sets} sets completed</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-textMuted text-lg">🌿</span>
                <p className="text-textMuted">Rest day</p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Decompression */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}>
          <Card>
            <p className="text-xs text-textMuted uppercase tracking-widest mb-3">Decompression</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {data?.morningDone ? <Check /> : <X />}
                <p className={`text-sm ${data?.morningDone ? 'text-textPrimary' : 'text-textMuted'}`}>
                  Morning — {data?.morningDone ? 'Done' : 'Not done'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {data?.eveningDone ? <Check /> : <X />}
                <p className={`text-sm ${data?.eveningDone ? 'text-textPrimary' : 'text-textMuted'}`}>
                  Evening — {data?.eveningDone ? 'Done' : 'Not done'}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Cardio */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <Card>
            <p className="text-xs text-textMuted uppercase tracking-widest mb-2">Cardio</p>
            {data?.cardioType ? (
              <div className="flex items-center gap-3">
                <Check />
                <p className="text-textPrimary text-sm">{data.cardioType}</p>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <X />
                <p className="text-textMuted text-sm">No cardio today</p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Nutrition */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <Card>
            <p className="text-xs text-textMuted uppercase tracking-widest mb-3">Nutrition</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-[10px] text-textMuted uppercase tracking-wider mb-1">Calories</p>
                <p className="font-mono text-xl text-textPrimary">{data?.totalCalories ?? 0}</p>
                <p className="text-[10px] text-textMuted">/ {targets.calories} target</p>
                <div className="mt-1.5 h-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(((data?.totalCalories ?? 0) / targets.calories) * 100, 100)}%` }} />
                </div>
              </div>
              <div>
                <p className="text-[10px] text-textMuted uppercase tracking-wider mb-1">Protein</p>
                <p className={`font-mono text-xl ${proteinHit ? 'text-green-400' : 'text-textPrimary'}`}>{Math.round(data?.totalProtein ?? 0)}g</p>
                <p className="text-[10px] text-textMuted">/ {targets.protein}g target</p>
                <div className="mt-1.5 h-1 bg-border rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${proteinHit ? 'bg-green-400' : 'bg-secondary'}`} style={{ width: `${Math.min(((data?.totalProtein ?? 0) / targets.protein) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
            {(data?.foodDescriptions.length ?? 0) > 0 && (
              <div className="border-t border-border pt-3">
                <p className="text-[10px] text-textMuted uppercase tracking-wider mb-2">Logged today</p>
                {data!.foodDescriptions.map((desc, i) => (
                  <p key={i} className="text-textMuted text-xs leading-relaxed">· {desc}</p>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Protein message */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <Card className={proteinHit ? 'border-green-400/30 bg-green-400/5' : 'border-orange-400/30 bg-orange-400/5'}>
            <div className="flex gap-3">
              <span className="text-xl">{proteinHit ? '💪' : '⚠️'}</span>
              <p className="text-sm text-textPrimary leading-relaxed">{proteinMessage}</p>
            </div>
          </Card>
        </motion.div>

        {/* Tate quote */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
          <Card className="border-accent/20 bg-accent/5">
            <p className="text-xs text-accent uppercase tracking-widest mb-2">Daily Mindset</p>
            <p className="text-textPrimary text-sm leading-relaxed italic">"{quote}"</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32 }}>
          <Button size="lg" fullWidth onClick={() => navigate('/home')}>
            Back to Home
          </Button>
        </motion.div>

      </div>
    </Layout>
  )
}
