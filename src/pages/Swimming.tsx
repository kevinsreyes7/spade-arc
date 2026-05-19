import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/context/AuthContext'
import { useProfile } from '@/context/ProfileContext'
import { Layout } from '@/components/layout/Layout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { swimmingProtocol } from '@/data/protocols'
import { supabase } from '@/lib/supabase'

export function Swimming() {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { profile } = useProfile()
  const currentWeek = profile?.current_week ?? 1

  const [completed, setCompleted] = useState<Record<string, boolean>>({})
  const [totalLaps, setTotalLaps] = useState('')
  const [distance, setDistance] = useState('')
  const [notes, setNotes] = useState('')
  const [started, setStarted] = useState(false)
  const [startTime] = useState(Date.now())
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)

  const allDone = swimmingProtocol.every((s) => completed[s.id])

  const saveSession = async () => {
    if (!user) return
    setSaving(true)
    const duration = Math.round((Date.now() - startTime) / 60000)
    await supabase.from('swim_logs').insert({
      user_id: user.id,
      date: new Date().toISOString().split('T')[0],
      total_laps: parseInt(totalLaps) || 0,
      distance_metres: parseInt(distance) || 0,
      duration_minutes: duration,
      sets_completed: Object.keys(completed).filter((k) => completed[k]),
      notes,
    })
    setSaving(false)
    setDone(true)
  }

  if (done) {
    return (
      <Layout hideNav>
        <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
          <div className="text-6xl mb-4">🏊</div>
          <h2 className="font-display text-4xl text-accent tracking-wide mb-2">SESSION COMPLETE</h2>
          <p className="text-textMuted mb-8">Swim saved. Recovery locked in.</p>
          <Button size="lg" onClick={() => navigate('/home')}>Back to Dashboard</Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout hideNav>
      <div className="px-4 pt-6 pb-8 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-4xl tracking-wide" style={{ color: '#2dd4bf' }}>SWIMMING</h1>
            <p className="text-xs text-textMuted mt-0.5">Week {currentWeek} · Recovery Conditioning</p>
          </div>
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-textMuted hover:text-accent transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!started ? (
          <div className="space-y-4">
            <Card>
              <p className="text-xs text-textMuted tracking-widest uppercase mb-3">Today's Protocol</p>
              {swimmingProtocol.map((set) => (
                <div key={set.id} className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-mono text-accent" style={{ backgroundColor: 'rgba(45,212,191,0.15)', border: '1px solid rgba(45,212,191,0.3)' }}>
                    {set.laps}
                  </div>
                  <div>
                    <p className="text-sm text-textPrimary font-medium">{set.name}</p>
                    <p className="text-xs text-textMuted">{set.detail}</p>
                  </div>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-textMuted">
                <span>Total laps: ~{swimmingProtocol.reduce((a, s) => a + s.laps, 0)}</span>
                <span>~700m total</span>
              </div>
            </Card>
            <Button size="xl" fullWidth onClick={() => setStarted(true)} className="font-display text-xl tracking-widest" style={{ borderColor: '#2dd4bf40' }}>
              START SESSION ♠
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Card>
              <p className="text-xs text-textMuted tracking-widest uppercase mb-3">Track Each Set</p>
              {swimmingProtocol.map((set) => (
                <button
                  key={set.id}
                  onClick={() => setCompleted((p) => ({ ...p, [set.id]: !p[set.id] }))}
                  className={`w-full flex items-center gap-3 py-3 border-b border-border/40 last:border-0 text-left transition-all ${
                    completed[set.id] ? 'opacity-60' : ''
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    completed[set.id] ? 'border-none' : 'border-textMuted'
                  }`} style={completed[set.id] ? { backgroundColor: '#2dd4bf' } : {}}>
                    {completed[set.id] && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-3 h-3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${completed[set.id] ? 'text-textMuted line-through' : 'text-textPrimary'}`}>{set.name}</p>
                    <p className="text-xs text-textMuted">{set.detail}</p>
                  </div>
                  <span className="text-xs text-textMuted">{set.laps} laps</span>
                </button>
              ))}
            </Card>

            <Card>
              <p className="text-xs text-textMuted tracking-widest uppercase mb-3">Log Session</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-textMuted block mb-1">Total laps</label>
                  <input
                    className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-textPrimary placeholder:text-textMuted focus:border-accent/60 focus:outline-none"
                    placeholder="22"
                    value={totalLaps}
                    onChange={(e) => setTotalLaps(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-textMuted block mb-1">Distance (m)</label>
                  <input
                    className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-textPrimary placeholder:text-textMuted focus:border-accent/60 focus:outline-none"
                    placeholder="700"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                  />
                </div>
              </div>
              <textarea
                className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-textPrimary placeholder:text-textMuted focus:border-accent/60 focus:outline-none resize-none"
                placeholder="Notes (optional)"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Card>

            <Button size="lg" fullWidth loading={saving} disabled={!allDone && !totalLaps} onClick={saveSession} className="font-display tracking-widest">
              Complete Session ♠
            </Button>
          </div>
        )}
      </div>
    </Layout>
  )
}
