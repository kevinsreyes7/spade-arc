import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProfile } from '@/context/ProfileContext'
import { useAuthContext } from '@/context/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { getPhaseFromWeek, getPhaseName } from '@/data/workouts'
import { supabase } from '@/lib/supabase'
import type { FoodLog } from '@/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function getWeightLbs(weightKg: number): number {
  return weightKg * 2.20462
}

function calcTargets(weightKg: number, phase: number) {
  const lbs = getWeightLbs(weightKg)
  const isLeanBulk = phase <= 2
  const calories = Math.round(lbs * (isLeanBulk ? 17 : 14))
  const protein = Math.round(lbs)
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

// ─── Constants ───────────────────────────────────────────────────────────────

const SUPPLEMENTS = [
  { key: 'creatine', label: 'Creatine Monohydrate 5g', timing: '' },
  { key: 'whey', label: 'Whey Protein', timing: '' },
  { key: 'vitamin_d', label: 'Vitamin D3 + K2', timing: '' },
  { key: 'magnesium', label: 'Magnesium Glycinate 400mg', timing: 'Take at night' },
  { key: 'omega3', label: 'Omega-3 2–3g', timing: '' },
]

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

const TIMING = [
  { time: 'Morning', sub: 'Within 60 min of waking', desc: '40–50g protein', examples: 'Eggs · Greek yogurt · whey shake', icon: '☀️' },
  { time: 'Pre-Workout', sub: '60–90 min before', desc: 'Complex carbs + protein', examples: 'Oats + chicken · rice + eggs', icon: '⚡' },
  { time: 'Post-Workout', sub: 'Within 45 min', desc: 'Fast protein + simple carbs', examples: 'Whey + banana · rice + lean meat', icon: '🔥' },
  { time: 'Before Sleep', sub: 'Last meal of the day', desc: 'Slow-release protein', examples: 'Casein · Greek yogurt · cottage cheese', icon: '🌙' },
]

const MEAL_TYPES = ['Breakfast', 'Snack', 'Lunch', 'Pre-workout', 'Post-workout', 'Dinner', 'Before bed'] as const
type MealType = typeof MEAL_TYPES[number]
type MealTab = 'training' | 'rest' | 'leg'

interface FoodEntry {
  meal_type: MealType
  description: string
  calories: string
  protein: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Nutrition() {
  const { user } = useAuthContext()
  const { profile } = useProfile()
  const [mealTab, setMealTab] = useState<MealTab>('training')
  const [taken, setTaken] = useState<Set<string>>(new Set())
  const [suppLoading, setSuppLoading] = useState(false)

  // Food log state
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([])
  const [showFoodForm, setShowFoodForm] = useState(false)
  const [savingFood, setSavingFood] = useState(false)
  const [foodEntry, setFoodEntry] = useState<FoodEntry>({
    meal_type: 'Breakfast',
    description: '',
    calories: '',
    protein: '',
  })

  const week = profile?.current_week ?? 1
  const phase = getPhaseFromWeek(week)
  const weightKg = profile?.weight_kg ?? 80
  const targets = calcTargets(weightKg, phase)
  const calories = targets.calories

  const trainingMacros = carbCyclingMacros(calories, 0.4, 0.35, 0.25)
  const restMacros = carbCyclingMacros(calories, 0.4, 0.25, 0.35)
  const phaseName = getPhaseName(phase)

  const today = new Date().toISOString().split('T')[0]

  // Load supplements and food logs for today
  useEffect(() => {
    if (!user) return

    supabase.from('supplement_logs').select('supplement').eq('user_id', user.id).eq('date', today)
      .then(({ data }) => {
        if (data) setTaken(new Set(data.map((d: { supplement: string }) => d.supplement)))
      })

    supabase.from('food_logs').select('*').eq('user_id', user.id).eq('date', today)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setFoodLogs(data as FoodLog[])
      })
  }, [user])

  const toggleSupplement = async (key: string) => {
    if (!user || suppLoading) return
    setSuppLoading(true)
    if (taken.has(key)) {
      await supabase.from('supplement_logs').delete().eq('user_id', user.id).eq('date', today).eq('supplement', key)
      setTaken(prev => { const n = new Set(prev); n.delete(key); return n })
    } else {
      await supabase.from('supplement_logs').insert({ user_id: user.id, date: today, supplement: key })
      setTaken(prev => new Set([...prev, key]))
    }
    setSuppLoading(false)
  }

  const saveFoodLog = async () => {
    if (!user || !foodEntry.description.trim()) return
    setSavingFood(true)
    const { data } = await supabase.from('food_logs').insert({
      user_id: user.id,
      date: today,
      meal_type: foodEntry.meal_type,
      description: foodEntry.description.trim(),
      calories: foodEntry.calories ? parseInt(foodEntry.calories) : null,
      protein: foodEntry.protein ? parseFloat(foodEntry.protein) : null,
    }).select().single()
    if (data) setFoodLogs(prev => [...prev, data as FoodLog])
    setFoodEntry({ meal_type: 'Breakfast', description: '', calories: '', protein: '' })
    setShowFoodForm(false)
    setSavingFood(false)
  }

  const deleteFoodLog = async (id: string) => {
    await supabase.from('food_logs').delete().eq('id', id)
    setFoodLogs(prev => prev.filter(l => l.id !== id))
  }

  // Food totals
  const totalFoodCalories = foodLogs.reduce((s, l) => s + (l.calories ?? 0), 0)
  const totalFoodProtein = foodLogs.reduce((s, l) => s + (l.protein ?? 0), 0)

  // Group by meal type (only show types that have entries)
  const groupedLogs = MEAL_TYPES.reduce((acc, meal) => {
    const entries = foodLogs.filter(l => l.meal_type === meal)
    if (entries.length) acc[meal] = entries
    return acc
  }, {} as Record<string, FoodLog[]>)

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
              <motion.div key={item.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
                <Card className={item.accent ? 'border-accent/30' : ''}>
                  <p className="text-textMuted text-xs tracking-widest uppercase mb-1">{item.label}</p>
                  <p className={`font-display text-4xl ${item.accent ? 'text-accent' : 'text-textPrimary'}`}>{item.value}</p>
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

        {/* ── Food Diary ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-textMuted tracking-widest uppercase">Today's Food Log</p>
            <Button size="sm" variant="outline" onClick={() => setShowFoodForm((p) => !p)}>
              {showFoodForm ? 'Cancel' : '+ Log Food'}
            </Button>
          </div>

          {/* Log form */}
          <AnimatePresence>
            {showFoodForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-3"
              >
                <Card>
                  {/* Meal type selector */}
                  <p className="text-xs text-textMuted uppercase tracking-widest mb-2">Meal Type</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {MEAL_TYPES.map((mt) => (
                      <button
                        key={mt}
                        onClick={() => setFoodEntry((p) => ({ ...p, meal_type: mt }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          foodEntry.meal_type === mt
                            ? 'bg-accent/15 border-accent text-accent'
                            : 'border-border text-textMuted'
                        }`}
                      >
                        {mt}
                      </button>
                    ))}
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    <p className="text-xs text-textMuted uppercase tracking-widest mb-1.5">What did you eat?</p>
                    <textarea
                      rows={2}
                      placeholder="e.g. 200g chicken, white rice, broccoli..."
                      value={foodEntry.description}
                      onChange={(e) => setFoodEntry((p) => ({ ...p, description: e.target.value }))}
                      className="w-full bg-bg/60 border border-border/60 rounded-xl px-3 py-2.5 text-sm text-textPrimary placeholder:text-textMuted/40 focus:outline-none focus:border-accent resize-none"
                    />
                  </div>

                  {/* Optional macros */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <Input
                      label="Calories (optional)"
                      type="number"
                      inputMode="numeric"
                      placeholder="e.g. 450"
                      value={foodEntry.calories}
                      onChange={(e) => setFoodEntry((p) => ({ ...p, calories: e.target.value }))}
                    />
                    <Input
                      label="Protein g (optional)"
                      type="number"
                      inputMode="decimal"
                      placeholder="e.g. 42"
                      value={foodEntry.protein}
                      onChange={(e) => setFoodEntry((p) => ({ ...p, protein: e.target.value }))}
                    />
                  </div>

                  <Button size="md" fullWidth loading={savingFood} onClick={saveFoodLog}
                    disabled={!foodEntry.description.trim()}>
                    Save Entry
                  </Button>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Totals vs target */}
          {foodLogs.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Card className={totalFoodCalories >= targets.calories * 0.9 ? 'border-success/30' : 'border-border'}>
                <p className="text-[10px] text-textMuted uppercase tracking-widest mb-1">Calories Logged</p>
                <p className="font-mono text-xl text-textPrimary">{totalFoodCalories}</p>
                <p className="text-[10px] text-textMuted">/ {targets.calories} target</p>
                <div className="mt-2 h-1 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${Math.min((totalFoodCalories / targets.calories) * 100, 100)}%` }}
                  />
                </div>
              </Card>
              <Card className={totalFoodProtein >= targets.protein * 0.9 ? 'border-success/30' : 'border-border'}>
                <p className="text-[10px] text-textMuted uppercase tracking-widest mb-1">Protein Logged</p>
                <p className="font-mono text-xl text-textPrimary">{Math.round(totalFoodProtein)}g</p>
                <p className="text-[10px] text-textMuted">/ {targets.protein}g target</p>
                <div className="mt-2 h-1 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full transition-all"
                    style={{ width: `${Math.min((totalFoodProtein / targets.protein) * 100, 100)}%` }}
                  />
                </div>
              </Card>
            </div>
          )}

          {/* Today's logs grouped by meal type */}
          {foodLogs.length === 0 ? (
            <Card>
              <p className="text-textMuted text-sm text-center py-4">No food logged today. Tap "+ Log Food" to start.</p>
            </Card>
          ) : (
            <Card padding="none">
              {Object.entries(groupedLogs).map(([mealType, entries], gi) => (
                <div key={mealType} className={gi < Object.keys(groupedLogs).length - 1 ? 'border-b border-border' : ''}>
                  <p className="px-4 pt-3 pb-1 text-xs text-accent font-medium uppercase tracking-widest">{mealType}</p>
                  {entries.map((entry, ei) => (
                    <div
                      key={entry.id}
                      className={`flex items-start gap-3 px-4 py-2.5 ${ei < entries.length - 1 ? 'border-b border-border/40' : ''}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-textPrimary text-sm leading-snug">{entry.description}</p>
                        {(entry.calories != null || entry.protein != null) && (
                          <p className="text-xs text-textMuted/70 mt-0.5 font-mono">
                            {entry.calories != null ? `${entry.calories} kcal` : ''}
                            {entry.calories != null && entry.protein != null ? ' · ' : ''}
                            {entry.protein != null ? `${entry.protein}g protein` : ''}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteFoodLog(entry.id)}
                        className="text-textMuted/40 hover:text-danger transition-colors shrink-0 p-1"
                        aria-label="Delete entry"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </Card>
          )}
        </section>

        {/* ── Carb Cycling Guide ── */}
        <section>
          <p className="text-xs text-textMuted tracking-widest uppercase mb-3">Carb Cycling Guide</p>
          <div className="space-y-3">
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

            <Card className="border-phase4/30">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-phase4 text-sm font-medium">Leg Day</p>
                  <p className="text-textMuted text-xs">Highest carb day of the week</p>
                </div>
                <span className="text-lg">🦵</span>
              </div>
              <p className="text-textMuted text-sm leading-relaxed">
                Legs are your biggest muscle group and consume the most glycogen. Eating your highest carb intake on leg day fuels the session, accelerates recovery, and maximises the anabolic response. Add an extra 20–30g carbs above your normal training day target.
              </p>
            </Card>
          </div>
        </section>

        {/* ── Meal Timing Guide ── */}
        <section>
          <p className="text-xs text-textMuted tracking-widest uppercase mb-3">Meal Timing</p>
          <div className="space-y-2">
            {TIMING.map((item, i) => (
              <motion.div key={item.time} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                <Card>
                  <div className="flex gap-3 items-start">
                    <span className="text-2xl">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <p className="text-textPrimary text-sm font-medium">{item.time}</p>
                        <p className="text-textMuted text-xs">{item.sub}</p>
                      </div>
                      <p className="text-accent text-xs mt-0.5">{item.desc}</p>
                      <p className="text-textMuted text-xs mt-0.5">{item.examples}</p>
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
          <div className="flex gap-2 mb-4">
            {(['training', 'rest', 'leg'] as MealTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setMealTab(tab)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium tracking-wide transition-all duration-200 ${
                  mealTab === tab ? 'bg-accent text-bg' : 'bg-card border border-border text-textMuted'
                }`}
              >
                {tab === 'training' ? 'Training' : tab === 'rest' ? 'Rest' : 'Leg Day'}
              </button>
            ))}
          </div>
          <Card padding="none">
            {MEAL_PLANS[mealTab].map((meal, i) => (
              <div key={meal.time} className={`flex gap-3 px-4 py-3 ${i < MEAL_PLANS[mealTab].length - 1 ? 'border-b border-border' : ''}`}>
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
                    {supp.timing && <p className="text-textMuted text-xs mt-0.5">{supp.timing}</p>}
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
