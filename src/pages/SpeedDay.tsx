import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthContext } from '@/context/AuthContext'
import { useProfile } from '@/context/ProfileContext'
import { Layout } from '@/components/layout/Layout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { speedDayProtocol } from '@/data/protocols'
import { getPhaseFromWeek } from '@/data/workouts'
import { supabase } from '@/lib/supabase'

type Phase = 'warmup' | 'acceleration' | 'velocity' | 'power' | 'agility' | 'done'

export function SpeedDay() {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { profile } = useProfile()

  const [phase, setPhase] = useState<Phase>('warmup')
  const [warmupChecked, setWarmupChecked] = useState<Record<string, boolean>>({})
  const [accelRep20m, setAccelRep20m] = useState(0)
  const [accelRep10m, setAccelRep10m] = useState(0)
  const [vel60mRep, setVel60mRep] = useState(0)
  const [vel40mRep, setVel40mRep] = useState(0)
  const [powerDone, setPowerDone] = useState<Record<string, boolean>>({})
  const [distInputs, setDistInputs] = useState<Record<string, string>>({})
  const [agilityTimes, setAgilityTimes] = useState<Record<string, string[]>>({})
  const [restTimer, setRestTimer] = useState<{ visible: boolean; seconds: number; label: string }>({ visible: false, seconds: 90, label: '' })
  const [saving, setSaving] = useState(false)

  const currentWeek = profile?.current_week ?? 1
  const phaseNum = getPhaseFromWeek(currentWeek)

  const warmupAll = speedDayProtocol.neuralWarmup.every((s) => warmupChecked[s.id])

  const startRest = (seconds: number, label: string) => {
    setRestTimer({ visible: true, seconds, label })
  }

  const saveSession = async () => {
    if (!user) return
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    const broadJumps = speedDayProtocol.explosivePower
      .filter((e) => e.inputType === 'distance')
      .map((e) => parseFloat(distInputs[e.id] || '0'))
    const agilityTss = speedDayProtocol.agility.flatMap((a) =>
      (agilityTimes[a.id] || []).map((t) => parseFloat(t || '0'))
    )
    await supabase.from('speed_logs').insert({
      user_id: user.id,
      date: today,
      week_number: currentWeek,
      phase: phaseNum,
      sprint_20m_times: [],
      sprint_60m_times: [],
      broad_jump_distances: broadJumps,
      pro_agility_times: agilityTss.slice(0, 6),
      t_drill_times: [],
      notes: '',
      completed_at: new Date().toISOString(),
    })
    setSaving(false)
    setPhase('done')
  }

  return (
    <Layout hideNav>
      <div className="px-4 pt-6 pb-8 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-4xl text-danger tracking-wide">SPEED DAY</h1>
            <p className="text-xs text-textMuted mt-0.5">Week {currentWeek} · Phase {phaseNum}</p>
          </div>
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-textMuted hover:text-accent transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Phase tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {(['warmup', 'acceleration', 'velocity', 'power', 'agility'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPhase(p)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                phase === p ? 'bg-danger/20 text-danger border border-danger/40' : 'text-textMuted border border-border'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Phase: Warmup */}
        {phase === 'warmup' && (
          <div className="space-y-3">
            <Card>
              <p className="text-xs text-textMuted tracking-widest uppercase mb-3">Phase 1 — Neural Warmup (15 min)</p>
              {speedDayProtocol.neuralWarmup.map((step) => (
                <button
                  key={step.id}
                  onClick={() => setWarmupChecked((p) => ({ ...p, [step.id]: !p[step.id] }))}
                  className={`w-full flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0 transition-all ${
                    warmupChecked[step.id] ? 'opacity-60' : ''
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    warmupChecked[step.id] ? 'bg-danger border-danger' : 'border-textMuted'
                  }`}>
                    {warmupChecked[step.id] && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-3 h-3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-sm ${warmupChecked[step.id] ? 'text-textMuted line-through' : 'text-textPrimary'}`}>{step.name}</p>
                    <p className="text-xs text-textMuted">{step.detail}</p>
                  </div>
                </button>
              ))}
            </Card>
            <Button size="lg" fullWidth disabled={!warmupAll} onClick={() => setPhase('acceleration')}>
              Start Acceleration Phase
            </Button>
          </div>
        )}

        {/* Phase: Acceleration */}
        {phase === 'acceleration' && (
          <div className="space-y-4">
            <Card>
              <p className="text-xs text-textMuted tracking-widest uppercase mb-3">Phase 2 — Acceleration (20 min)</p>

              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-textPrimary font-medium">20m Sprint (standing start)</p>
                  <span className="font-mono text-danger text-lg">{accelRep20m} / {speedDayProtocol.acceleration.sets20m.reps}</span>
                </div>
                <Button
                  size="md"
                  fullWidth
                  disabled={accelRep20m >= speedDayProtocol.acceleration.sets20m.reps}
                  onClick={() => {
                    if (accelRep20m < speedDayProtocol.acceleration.sets20m.reps) {
                      setAccelRep20m((n) => n + 1)
                      startRest(speedDayProtocol.acceleration.sets20m.restSeconds, '20m Rest')
                    }
                  }}
                >
                  {accelRep20m >= speedDayProtocol.acceleration.sets20m.reps ? 'Complete ✓' : '+ Rep Done'}
                </Button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-textPrimary font-medium">10m Sprint (push-up start)</p>
                  <span className="font-mono text-danger text-lg">{accelRep10m} / {speedDayProtocol.acceleration.sets10m.reps}</span>
                </div>
                <Button
                  size="md"
                  fullWidth
                  disabled={accelRep10m >= speedDayProtocol.acceleration.sets10m.reps}
                  onClick={() => {
                    if (accelRep10m < speedDayProtocol.acceleration.sets10m.reps) {
                      setAccelRep10m((n) => n + 1)
                      startRest(speedDayProtocol.acceleration.sets10m.restSeconds, '10m Rest')
                    }
                  }}
                >
                  {accelRep10m >= speedDayProtocol.acceleration.sets10m.reps ? 'Complete ✓' : '+ Rep Done'}
                </Button>
              </div>
            </Card>
            <Button variant="outline" fullWidth onClick={() => setPhase('velocity')}>
              Proceed to Max Velocity
            </Button>
          </div>
        )}

        {/* Phase: Max Velocity */}
        {phase === 'velocity' && (
          <div className="space-y-4">
            <Card>
              <p className="text-xs text-textMuted tracking-widest uppercase mb-3">Phase 3 — Max Velocity (15 min)</p>

              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-textPrimary font-medium">60m Sprint (95–100%)</p>
                  <span className="font-mono text-danger text-lg">{vel60mRep} / {speedDayProtocol.maxVelocity.sets60m.reps}</span>
                </div>
                <Button
                  size="md" fullWidth
                  disabled={vel60mRep >= speedDayProtocol.maxVelocity.sets60m.reps}
                  onClick={() => {
                    if (vel60mRep < speedDayProtocol.maxVelocity.sets60m.reps) {
                      setVel60mRep((n) => n + 1)
                      startRest(speedDayProtocol.maxVelocity.sets60m.restSeconds, '60m Rest (3 min)')
                    }
                  }}
                >
                  {vel60mRep >= speedDayProtocol.maxVelocity.sets60m.reps ? 'Complete ✓' : '+ Rep Done'}
                </Button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-textPrimary font-medium">40m Flying Sprint</p>
                  <span className="font-mono text-danger text-lg">{vel40mRep} / {speedDayProtocol.maxVelocity.sets40m.reps}</span>
                </div>
                <Button
                  size="md" fullWidth
                  disabled={vel40mRep >= speedDayProtocol.maxVelocity.sets40m.reps}
                  onClick={() => {
                    if (vel40mRep < speedDayProtocol.maxVelocity.sets40m.reps) {
                      setVel40mRep((n) => n + 1)
                      startRest(speedDayProtocol.maxVelocity.sets40m.restSeconds, '40m Rest (3 min)')
                    }
                  }}
                >
                  {vel40mRep >= speedDayProtocol.maxVelocity.sets40m.reps ? 'Complete ✓' : '+ Rep Done'}
                </Button>
              </div>
            </Card>
            <Button variant="outline" fullWidth onClick={() => setPhase('power')}>
              Proceed to Explosive Power
            </Button>
          </div>
        )}

        {/* Phase: Power */}
        {phase === 'power' && (
          <div className="space-y-3">
            <Card>
              <p className="text-xs text-textMuted tracking-widest uppercase mb-3">Phase 4 — Explosive Power (15 min)</p>
              {speedDayProtocol.explosivePower.map((ex) => (
                <div key={ex.id} className="mb-4 pb-4 border-b border-border/40 last:border-0 last:mb-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-textPrimary font-medium">
                      {ex.name}{ex.perLeg ? ' (each leg)' : ''}
                    </p>
                    <span className="text-xs text-textMuted">{ex.sets} × {ex.reps}</span>
                  </div>
                  {ex.inputType === 'distance' && (
                    <input
                      className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm text-textPrimary placeholder:text-textMuted mb-2 focus:border-accent/60 focus:outline-none"
                      placeholder="Best distance (m)"
                      value={distInputs[ex.id] || ''}
                      onChange={(e) => setDistInputs((p) => ({ ...p, [ex.id]: e.target.value }))}
                    />
                  )}
                  <Button
                    size="sm"
                    fullWidth
                    variant={powerDone[ex.id] ? 'outline' : 'primary'}
                    onClick={() => setPowerDone((p) => ({ ...p, [ex.id]: !p[ex.id] }))}
                  >
                    {powerDone[ex.id] ? 'Done ✓' : 'Mark Complete'}
                  </Button>
                </div>
              ))}
            </Card>
            <Button variant="outline" fullWidth onClick={() => setPhase('agility')}>
              Proceed to Agility
            </Button>
          </div>
        )}

        {/* Phase: Agility */}
        {phase === 'agility' && (
          <div className="space-y-3">
            <Card>
              <p className="text-xs text-textMuted tracking-widest uppercase mb-3">Phase 5 — Agility (10 min)</p>
              {speedDayProtocol.agility.map((drill) => (
                <div key={drill.id} className="mb-4 pb-4 border-b border-border/40 last:border-0 last:mb-0 last:pb-0">
                  <p className="text-sm text-textPrimary font-medium mb-2">{drill.name} — {drill.sets} reps</p>
                  <div className="space-y-1.5">
                    {Array.from({ length: drill.sets }, (_, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-textMuted w-10">Rep {i + 1}</span>
                        <input
                          className="flex-1 bg-bg border border-border rounded-xl px-3 py-1.5 text-sm text-textPrimary placeholder:text-textMuted focus:border-accent/60 focus:outline-none"
                          placeholder="Time (sec)"
                          value={agilityTimes[drill.id]?.[i] || ''}
                          onChange={(e) => {
                            const arr = [...(agilityTimes[drill.id] || [])]
                            arr[i] = e.target.value
                            setAgilityTimes((p) => ({ ...p, [drill.id]: arr }))
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Card>
            <Button size="lg" fullWidth loading={saving} onClick={saveSession}>
              Complete Speed Day ♠
            </Button>
          </div>
        )}

        {/* Done */}
        {phase === 'done' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚡</div>
            <h2 className="font-display text-4xl text-danger tracking-wide mb-2">SPEED DAY COMPLETE</h2>
            <p className="text-textMuted mb-8">Session saved. Rest well.</p>
            <Button size="lg" onClick={() => navigate('/home')}>Back to Dashboard</Button>
          </div>
        )}

        {/* Rest timer overlay */}
        <AnimatePresence>
          {restTimer.visible && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 backdrop" onClick={() => setRestTimer((p) => ({ ...p, visible: false }))} />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl p-6 text-center"
              >
                <p className="text-xs text-textMuted tracking-widest uppercase mb-2">{restTimer.label}</p>
                <RestCountdown
                  seconds={restTimer.seconds}
                  onDone={() => setRestTimer((p) => ({ ...p, visible: false }))}
                />
                <button
                  onClick={() => setRestTimer((p) => ({ ...p, visible: false }))}
                  className="mt-4 text-sm text-textMuted hover:text-accent transition-colors"
                >
                  Skip rest
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  )
}

function RestCountdown({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    if (remaining <= 0) { onDone(); return }
    const t = setInterval(() => setRemaining((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [remaining])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  return (
    <div className="font-mono text-6xl text-danger font-medium">
      {mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : remaining}
    </div>
  )
}
