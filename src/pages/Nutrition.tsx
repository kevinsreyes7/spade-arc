import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useProfile } from '@/context/ProfileContext'
import { useAuthContext } from '@/context/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { Card } from '@/components/ui/Card'
import { getPhaseFromWeek, getPhaseName } from '@/data/workouts'
import { supabase } from '@/lib/supabase'

// ─── Helpers ────────────────────────────────────────────────────────────────

function getWeightLbs(weightKg: number): number {
  return weightKg * 2.20462
}

function calcTargets(weightKg: number, phase: number) {
  const lbs = getWeightLbs(weightKg)
  const isLeanBulk = phase <= 2
  const calories = Math.round(lbs * (isLeanBulk ? 17 : 14))
  const protein = Math.round(lbs)
  // Training day default: 35% C / 25% F of total cals
  const carbs = Math.round((calories * 0.35) / 4)
  const fat = Math.round((calories * 0.25) / 9)
  return { calories, protein, carbs, fat }
}

function carbCyclingMacros(calories: number, proteinPct: number, carbPct: number, fatPct: number) {
  return {
    protein: Math.round((calories * proteinPct) / 4),
    carbs: Math.round((calories * carbPct) / 4),
    fat: Math.round((calories * fatPct) / 9),
  }
}

// ─── Supplement list ─────────────────────────────────────────────────────────

const SUPPLEMENTS = [
  { key: 'creatine', label: 'Creatine Monohydrate 5g', timing: '' },
  { key: 'whey', label: 'Whey Protein', timing: '' },
  { key: 'vitamin_d', label: 'Vitamin D3 + K2', timing: '' },
  { key: 'magnesium', label: 'Magnesium Glycinate 400mg', timing: 'Take at night' },
  { key: 'omega3', label: 'Omega-3 2–3g', timing: '' },
]

// ─── Meal plans ──────────────────────────────────────────────────────────────

const MEAL_PLANS = {
  training: [
    { time: 'Breakfast', items: '4 eggs scrambled · oats · berries · black coffee' },
    { time: 'Snack', items: 'Greek yogurt · honey · almonds' },
    { time: 'Lunch', items: '200g chicken breast · white rice · broccoli · olive oil' },
    { time: 'Pre-Workout', items: 'Banana · protein shake' },
    { time: 'Post-Workout', items: '200g lean beef or chicken · sweet potato' },
    { time: 'Dinner', items: 'Salmon · quinoa · spinach salad' },
    { time: 'Before Bed', items: 'Cottage cheese · handful of walnuts' },
  ],
  rest: [
    { time: 'Breakfast', items: '3 eggs · avocado · whole grain toast' },
    { time: 'Snack', items: 'Apple · almond butter · protein shake' },
    { time: 'Lunch', items: '180g turkey · mixed salad · olive oil dressing' },
    { time: 'Dinner', items: '180g salmon · roasted vegetables · small portion rice' },
    { time: 'Before Bed', items: 'Greek yogurt · casein shake' },
  ],
  leg: [
    { time: 'Breakfast', items: '4 eggs · large bowl oats · banana · honey' },
    { time: 'Snack', items: 'Protein shake · rice cakes' },
    { time: 'Lunch', items: '220g chicken · large portion white rice · vegetables' },
    { time: 'Pre-Workout', items: '2 bananas · protein shake · coffee' },
    { time: 'Post-Workout', items: '250g lean beef · large sweet potato · broccoli' },
    { time: 'Dinner', items: 'Pasta · chicken · tomato sauce' },
    { time: 'Before Bed', items: 'Casein shake · cottage cheese' },
  ],
}

// ─── Timing guide ────────────────────────────────────────────────────────────

const TIMING = [
  {
    time: 'Morning',
    sub: 'Within 60 min of waking',
    desc: '40–50g protein',
    examples: 'Eggs · Greek yogurt · whey shake',
    icon: '☀️',
  },
  {
    time: 'Pre-Workout',
    sub: '60–90 min before',
    desc: 'Complex carbs + protein',
    examples: 'Oats + chicken · rice + eggs',
    icon: '⚡',
  },
  {
    time: 'Post-Workout',
    sub: 'Within 45 min',
    desc: 'Fast protein + simple carbs',
    examples: 'Whey + banana · rice + lean meat',
    icon: '🔥',
  },
  {
    time: 'Before Sleep',
    sub: 'Last meal of the day',
    desc: 'Slow-release protein',
    examples: 'Casein · Greek yogurt · cottage cheese',
    icon: '🌙',
  },
]

type MealTab = 'training' | 'rest' | 'leg'

// ─── Component ───────────────────────────────────────────────────────────────

export function Nutrition() {
  const { user } = useAuthContext()
  const { profile } = useProfile()
  const [mealTab, setMealTab] = useState<MealTab>('training')
  const [taken, setTaken] = useState<Set<string>>(new Set())
  const [suppLoading, setSuppLoading] = useState(false)

  const week = profile?.current_week ?? 1
  const phase = getPhaseFromWeek(week)
  const weightKg = profile?.weight_kg ?? 80
  const targets = calcTargets(weightKg, phase)
  const calories = targets.calories

  const trainingMacros = carbCyclingMacros(calories, 0.4, 0.35, 0.25)
  const restMacros = carbCyclingMacros(calories, 0.4, 0.25, 0.35)

  // Load today's supplement logs
  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    supabase
      .from('supplement_logs')
      .select('supplement')
      .eq('user_id', user.id)
      .eq('date', today)
      .then(({ data }) => {
        if (data) setTaken(new Set(data.map((d: { supplement: string }) => d.supplement)))
      })
  }, [user])

  const toggleSupplement = async (key: string) => {
    if (!user || suppLoading) return
    setSuppLoading(true)
    const today = new Date().toISOString().split('T')[0]
    if (taken.has(key)) {
      await supabase
        .from('supplement_logs')
        .delete()
        .eq('user_id', user.id)
        .eq('date', today)
        .eq('supplement', key)
      setTaken(prev => { const n = new Set(prev); n.delete(key); return n })
    } else {
      await supabase
        .from('supplement_logs')
        .insert({ user_id: user.id, date: today, supplement: key })
      setTaken(prev => new Set([...prev, key]))
    }
    setSuppLoading(false)
  }

  const phaseName = getPhaseName(phase)

  return (
    <Layout>
      <div className="px-4 pt-6 pb-4 space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-display text-4xl text-accent tracking-widest">NUTRITION</h1>
          <p className="text-textMuted text-sm mt-0.5">{phaseName} · Week {week}</p>
        </motion.div>

        {/* ── Daily Targets ── */}
        <section>
          <p className="text-xs text-textMuted tracking-widest uppercase mb-3">Daily Targets</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Calories', value: targets.calories, unit: 'kcal', accent: true },
              { label: 'Protein', value: targets.protein, unit: 'g', accent: false },
              { label: 'Carbs', value: targets.carbs, unit: 'g', accent: false },
              { label: 'Fats', value: targets.fat, unit: 'g', accent: false },
            ].map((item) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
              >
                <Card className={item.accent ? 'border-accent/30' : ''}>
                  <p className="text-textMuted text-xs tracking-widest uppercase mb-1">{item.label}</p>
                  <p className={`font-display text-4xl ${item.accent ? 'text-accent' : 'text-textPrimary'}`}>
                    {item.value}
                  </p>
                  <p className="text-textMuted text-xs">{item.unit}</p>
                </Card>
              </motion.div>
            ))}
          </div>
          <p className="text-textMuted text-xs mt-2 leading-relaxed">
            {phase <= 2
              ? `Phase I–II lean bulk: ${Math.round(getWeightLbs(weightKg))} lbs × 16–18 = ${targets.calories} kcal`
              : `Phase III–IV cut: ${Math.round(getWeightLbs(weightKg))} lbs × 13–15 = ${targets.calories} kcal`}
            {' '}· Protein minimum: {targets.protein}g
          </p>
        </section>

        {/* ── Carb Cycling Guide ── */}
        <section>
          <p className="text-xs text-textMuted tracking-widest uppercase mb-3">Carb Cycling Guide</p>
          <div className="space-y-3">

            {/* Training day */}
            <Card className="border-secondary/30">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-accent text-sm font-medium">Training Day</p>
                  <p className="text-textMuted text-xs">Highest carbs · 40/35/25</p>
                </div>
                <span className="text-lg">💪</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { n: 'Protein', v: trainingMacros.protein, pct: '40%' },
                  { n: 'Carbs', v: trainingMacros.carbs, pct: '35%' },
                  { n: 'Fats', v: trainingMacros.fat, pct: '25%' },
                ].map(m => (
                  <div key={m.n} className="bg-bg rounded-xl p-2 text-center">
                    <p className="text-textMuted text-[10px] uppercase tracking-wider">{m.n}</p>
                    <p className="text-textPrimary text-lg font-display">{m.v}g</p>
                    <p className="text-textMuted text-[10px]">{m.pct}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Rest day */}
            <Card className="border-border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-textPrimary text-sm font-medium">Rest Day</p>
                  <p className="text-textMuted text-xs">Low carbs · 40/25/35</p>
                </div>
                <span className="text-lg">🌿</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { n: 'Protein', v: restMacros.protein, pct: '40%' },
                  { n: 'Carbs', v: restMacros.carbs, pct: '25%' },
                  { n: 'Fats', v: restMacros.fat, pct: '35%' },
                ].map(m => (
                  <div key={m.n} className="bg-bg rounded-xl p-2 text-center">
                    <p className="text-textMuted text-[10px] uppercase tracking-wider">{m.n}</p>
                    <p className="text-textPrimary text-lg font-display">{m.v}g</p>
                    <p className="text-textMuted text-[10px]">{m.pct}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Leg day */}
            <Card className="border-phase4/30">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-phase4 text-sm font-medium">Leg Day</p>
                  <p className="text-textMuted text-xs">Highest carb day of the week</p>
                </div>
                <span className="text-lg">🦵</span>
              </div>
              <p className="text-textMuted text-sm leading-relaxed">
                Legs are your biggest muscle group and consume the most glycogen. Eating your highest carb intake on leg day fuels the session, accelerates recovery, and maximises the anabolic response to the heaviest volume of the week. Add an extra 20–30g carbs above your normal training day target.
              </p>
            </Card>
          </div>
        </section>

        {/* ── Meal Timing Guide ── */}
        <section>
          <p className="text-xs text-textMuted tracking-widest uppercase mb-3">Meal Timing</p>
          <div className="space-y-2">
            {TIMING.map((t, i) => (
              <motion.div
                key={t.time}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Card>
                  <div className="flex gap-3 items-start">
                    <span className="text-2xl">{t.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <p className="text-textPrimary text-sm font-medium">{t.time}</p>
                        <p className="text-textMuted text-xs">{t.sub}</p>
                      </div>
                      <p className="text-accent text-xs mt-0.5">{t.desc}</p>
                      <p className="text-textMuted text-xs mt-0.5">{t.examples}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Meal Plan Suggestions ── */}
        <section>
          <p className="text-xs text-textMuted tracking-widest uppercase mb-3">Meal Plan Suggestions</p>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {(['training', 'rest', 'leg'] as MealTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setMealTab(tab)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium tracking-wide transition-all duration-200 ${
                  mealTab === tab
                    ? 'bg-accent text-bg'
                    : 'bg-card border border-border text-textMuted'
                }`}
              >
                {tab === 'training' ? 'Training' : tab === 'rest' ? 'Rest' : 'Leg Day'}
              </button>
            ))}
          </div>

          <Card padding="none">
            {MEAL_PLANS[mealTab].map((meal, i) => (
              <div
                key={meal.time}
                className={`flex gap-3 px-4 py-3 ${i < MEAL_PLANS[mealTab].length - 1 ? 'border-b border-border' : ''}`}
              >
                <span className="text-accent text-xs font-medium w-24 shrink-0 pt-0.5">{meal.time}</span>
                <p className="text-textMuted text-sm leading-relaxed">{meal.items}</p>
              </div>
            ))}
          </Card>
        </section>

        {/* ── Supplement Checklist ── */}
        <section className="pb-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-textMuted tracking-widest uppercase">Supplements</p>
            <p className="text-textMuted text-xs">Resets midnight</p>
          </div>
          <Card padding="none">
            {SUPPLEMENTS.map((supp, i) => {
              const isTaken = taken.has(supp.key)
              return (
                <motion.button
                  key={supp.key}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleSupplement(supp.key)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 transition-colors duration-200 ${
                    i < SUPPLEMENTS.length - 1 ? 'border-b border-border' : ''
                  } ${isTaken ? 'bg-success/5' : ''}`}
                >
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                    isTaken ? 'bg-success border-success' : 'border-border'
                  }`}>
                    {isTaken && (
                      <svg viewBox="0 0 12 10" fill="none" className="w-3 h-3">
                        <path d="M1 5l3.5 3.5L11 1" stroke="#0a0d1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-medium transition-colors duration-200 ${isTaken ? 'text-success' : 'text-textPrimary'}`}>
                      {supp.label}
                    </p>
                    {supp.timing && (
                      <p className="text-textMuted text-xs mt-0.5">{supp.timing}</p>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </Card>
          <p className="text-textMuted text-xs mt-2 text-center">
            {taken.size} / {SUPPLEMENTS.length} taken today
          </p>
        </section>

      </div>
    </Layout>
  )
}
