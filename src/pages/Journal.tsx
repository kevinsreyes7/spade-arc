import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthContext } from '@/context/AuthContext'
import { useProfile } from '@/context/ProfileContext'
import { Layout } from '@/components/layout/Layout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import type { JournalEntry } from '@/types'

type View = 'today' | 'history'

const RATING_LABELS: Record<number, string> = { 1: 'Very Low', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Very High' }

function RatingPicker({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`flex-1 py-2 rounded-xl border text-xs font-mono font-medium transition-all ${
            value === n ? 'bg-secondary/20 border-accent/60 text-accent' : 'border-border text-textMuted hover:border-secondary/40'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

export function Journal() {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { profile } = useProfile()

  const [view, setView] = useState<View>('today')
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const unit = profile?.unit_preference === 'imperial' ? 'lbs' : 'kg'

  const [form, setForm] = useState<Partial<JournalEntry>>({
    energy: null,
    mood: null,
    sleep_hours: null,
    sleep_quality: null,
    stress: null,
    morning_weight: null,
    water_litres: null,
    protein_hit: null,
    pain_notes: '',
    one_win: '',
    one_improve: '',
    daily_intention: '',
    free_write: '',
  })

  useEffect(() => {
    if (!user) return
    supabase
      .from('journal_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setForm(data as JournalEntry)
      })
  }, [user, today])

  useEffect(() => {
    if (view !== 'history' || !user) return
    setLoadingHistory(true)
    supabase
      .from('journal_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setEntries((data ?? []) as JournalEntry[])
        setLoadingHistory(false)
      })
  }, [view, user])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    await supabase.from('journal_logs').upsert({
      ...form,
      user_id: user.id,
      date: today,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const set = (key: keyof JournalEntry, value: JournalEntry[keyof JournalEntry]) =>
    setForm((p) => ({ ...p, [key]: value }))

  return (
    <Layout hideNav>
      <div className="px-4 pt-6 pb-8 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-4xl text-textPrimary tracking-wide">JOURNAL</h1>
            <p className="text-xs text-textMuted mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
              {(['today', 'history'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    view === v ? 'bg-secondary/20 text-accent' : 'text-textMuted'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-textMuted hover:text-accent transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {view === 'today' ? (
          <div className="space-y-4">
            <Card>
              <p className="text-xs text-textMuted tracking-widest uppercase mb-4">Daily Check-In</p>
              <div className="space-y-4">
                {[
                  { key: 'energy' as const, label: 'Energy', emoji: '⚡' },
                  { key: 'mood' as const, label: 'Mood', emoji: '🧠' },
                  { key: 'sleep_quality' as const, label: 'Sleep Quality', emoji: '😴' },
                  { key: 'stress' as const, label: 'Stress (1=low)', emoji: '🌡️' },
                ].map(({ key, label, emoji }) => (
                  <div key={key}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">{emoji}</span>
                      <p className="text-sm text-textPrimary">{label}</p>
                      {form[key] && (
                        <span className="text-xs text-textMuted ml-auto">{RATING_LABELS[form[key] as number]}</span>
                      )}
                    </div>
                    <RatingPicker value={form[key] as number | null} onChange={(v) => set(key, v)} />
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <p className="text-xs text-textMuted tracking-widest uppercase mb-3">Metrics</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-textMuted block mb-1">Sleep hours</label>
                  <input
                    type="number" step="0.5"
                    className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-textPrimary placeholder:text-textMuted focus:border-accent/60 focus:outline-none"
                    placeholder="7.5"
                    value={form.sleep_hours ?? ''}
                    onChange={(e) => set('sleep_hours', parseFloat(e.target.value) || null)}
                  />
                </div>
                <div>
                  <label className="text-xs text-textMuted block mb-1">Morning weight ({unit})</label>
                  <input
                    type="number"
                    className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-textPrimary placeholder:text-textMuted focus:border-accent/60 focus:outline-none"
                    placeholder="80"
                    value={form.morning_weight ?? ''}
                    onChange={(e) => set('morning_weight', parseFloat(e.target.value) || null)}
                  />
                </div>
                <div>
                  <label className="text-xs text-textMuted block mb-1">Water (litres)</label>
                  <input
                    type="number" step="0.25"
                    className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-textPrimary placeholder:text-textMuted focus:border-accent/60 focus:outline-none"
                    placeholder="3"
                    value={form.water_litres ?? ''}
                    onChange={(e) => set('water_litres', parseFloat(e.target.value) || null)}
                  />
                </div>
                <div>
                  <label className="text-xs text-textMuted block mb-1">Protein target hit?</label>
                  <div className="flex gap-2 mt-1">
                    {([true, false] as const).map((v) => (
                      <button
                        key={String(v)}
                        onClick={() => set('protein_hit', v)}
                        className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${
                          form.protein_hit === v ? 'bg-secondary/20 border-accent/60 text-accent' : 'border-border text-textMuted'
                        }`}
                      >
                        {v ? 'Yes' : 'No'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <p className="text-xs text-textMuted tracking-widest uppercase mb-3">Reflection</p>
              <div className="space-y-3">
                {[
                  { key: 'daily_intention' as const, label: 'Daily intention', placeholder: 'What is your focus today?' },
                  { key: 'one_win' as const, label: 'One thing done well', placeholder: 'What are you proud of today?' },
                  { key: 'one_improve' as const, label: 'One thing to improve', placeholder: 'What could be better tomorrow?' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs text-textMuted block mb-1">{label}</label>
                    <input
                      className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-textPrimary placeholder:text-textMuted focus:border-accent/60 focus:outline-none"
                      placeholder={placeholder}
                      value={form[key] ?? ''}
                      onChange={(e) => set(key, e.target.value)}
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-textMuted block mb-1">Pain / soreness notes</label>
                  <input
                    className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-textPrimary placeholder:text-textMuted focus:border-accent/60 focus:outline-none"
                    placeholder="Any pain or soreness to note?"
                    value={form.pain_notes ?? ''}
                    onChange={(e) => set('pain_notes', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-textMuted block mb-1">Free write</label>
                  <textarea
                    className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-textPrimary placeholder:text-textMuted focus:border-accent/60 focus:outline-none resize-none"
                    placeholder="Anything else on your mind..."
                    rows={3}
                    value={form.free_write ?? ''}
                    onChange={(e) => set('free_write', e.target.value)}
                  />
                </div>
              </div>
            </Card>

            <Button
              size="lg" fullWidth loading={saving}
              onClick={handleSave}
              className={saved ? '!bg-success/20 !border-success/60 !text-success' : ''}
            >
              {saved ? 'Saved ✓' : 'Save Journal Entry'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {loadingHistory ? (
              <div className="space-y-3">
                {[1,2,3].map((i) => <div key={i} className="h-16 rounded-2xl shimmer" />)}
              </div>
            ) : entries.length === 0 ? (
              <Card className="text-center py-10">
                <p className="font-display text-3xl text-textMuted/40 mb-2">—</p>
                <p className="text-textMuted text-sm">Your arc starts here</p>
                <p className="text-xs text-textMuted/60 mt-1">Log your first entry to begin</p>
              </Card>
            ) : (
              entries.map((entry) => (
                <motion.div key={entry.id} layout>
                  <Card
                    hover
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-textPrimary font-medium">{entry.date}</p>
                        <div className="flex gap-2 mt-1">
                          {entry.energy && <span className="text-xs text-textMuted">⚡{entry.energy}</span>}
                          {entry.mood && <span className="text-xs text-textMuted">🧠{entry.mood}</span>}
                          {entry.sleep_quality && <span className="text-xs text-textMuted">😴{entry.sleep_quality}</span>}
                        </div>
                      </div>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-4 h-4 text-textMuted transition-transform ${expandedId === entry.id ? 'rotate-180' : ''}`}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                    <AnimatePresence>
                      {expandedId === entry.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="mt-3 pt-3 border-t border-border space-y-2">
                            {entry.daily_intention && <p className="text-xs text-textMuted">🎯 {entry.daily_intention}</p>}
                            {entry.one_win && <p className="text-xs text-textMuted">✓ {entry.one_win}</p>}
                            {entry.one_improve && <p className="text-xs text-textMuted">↑ {entry.one_improve}</p>}
                            {entry.free_write && <p className="text-xs text-textMuted italic">{entry.free_write}</p>}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
