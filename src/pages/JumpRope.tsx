import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/context/AuthContext'
import { useProfile } from '@/context/ProfileContext'
import { Layout } from '@/components/layout/Layout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { jumpRopeProtocolByWeek } from '@/data/protocols'
import { supabase } from '@/lib/supabase'

type Stage = 'intro' | 'session' | 'done'

export function JumpRope() {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { profile } = useProfile()

  const currentWeek = profile?.current_week ?? 1
  const protocol = jumpRopeProtocolByWeek(currentWeek)

  const [stage, setStage] = useState<Stage>('intro')
  const [currentRound, setCurrentRound] = useState(1)
  const [roundState, setRoundState] = useState<'idle' | 'work' | 'rest'>('idle')
  const [countdown, setCountdown] = useState(0)
  const [saving, setSaving] = useState(false)
  const startTime = Date.now()

  useEffect(() => {
    if (roundState === 'idle') return
    if (countdown <= 0) {
      if (roundState === 'work') {
        if (currentRound >= protocol.rounds) {
          setRoundState('idle')
          return
        }
        setRoundState('rest')
        setCountdown(protocol.restSeconds)
      } else {
        setRoundState('idle')
        setCurrentRound((r) => r + 1)
      }
      return
    }
    const t = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(t)
  }, [roundState, countdown])

  const startRound = () => {
    setRoundState('work')
    setCountdown(protocol.workSeconds)
  }

  const saveSession = async () => {
    if (!user) return
    setSaving(true)
    const durationSecs = Math.round((Date.now() - startTime) / 1000)
    await supabase.from('jump_rope_logs').insert({
      user_id: user.id,
      date: new Date().toISOString().split('T')[0],
      week_number: currentWeek,
      rounds_completed: protocol.rounds,
      total_duration_minutes: Math.round(durationSecs / 60),
    })
    setSaving(false)
    setStage('done')
  }

  const mins = Math.floor(countdown / 60)
  const secs = countdown % 60
  const timeStr = mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : String(countdown)

  return (
    <Layout hideNav>
      <div className="px-4 pt-6 pb-8 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-4xl tracking-wide" style={{ color: '#a78bfa' }}>JUMP ROPE</h1>
            <p className="text-xs text-textMuted mt-0.5">Week {currentWeek} · {protocol.description}</p>
          </div>
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-textMuted hover:text-accent transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {stage === 'intro' && (
          <div className="space-y-4">
            <Card>
              <p className="text-xs text-textMuted tracking-widest uppercase mb-3">Today's Protocol</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-bg rounded-xl p-3 border border-border text-center">
                  <p className="font-mono text-2xl text-accent font-medium">{protocol.rounds}</p>
                  <p className="text-xs text-textMuted mt-0.5">Rounds</p>
                </div>
                <div className="bg-bg rounded-xl p-3 border border-border text-center">
                  <p className="font-mono text-2xl text-accent font-medium">{protocol.workSeconds}s</p>
                  <p className="text-xs text-textMuted mt-0.5">Work</p>
                </div>
                <div className="bg-bg rounded-xl p-3 border border-border text-center">
                  <p className="font-mono text-2xl text-accent font-medium">{protocol.restSeconds}s</p>
                  <p className="text-xs text-textMuted mt-0.5">Rest</p>
                </div>
                <div className="bg-bg rounded-xl p-3 border border-border text-center">
                  <p className="font-mono text-2xl text-accent font-medium">
                    {Math.round((protocol.rounds * (protocol.workSeconds + protocol.restSeconds)) / 60)}
                  </p>
                  <p className="text-xs text-textMuted mt-0.5">Minutes</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-sm text-textMuted italic">{protocol.description}</p>
              </div>
            </Card>
            <Button size="xl" fullWidth onClick={() => setStage('session')} className="font-display text-xl tracking-widest">
              BEGIN SESSION ♠
            </Button>
          </div>
        )}

        {stage === 'session' && (
          <div className="space-y-4">
            <Card className="text-center py-6">
              <p className="text-xs text-textMuted tracking-widest uppercase mb-2">
                Round {currentRound} of {protocol.rounds}
              </p>
              <div className="font-mono text-7xl font-medium mb-3" style={{ color: roundState === 'work' ? '#a78bfa' : roundState === 'rest' ? '#34d399' : '#c8d4f0' }}>
                {roundState === 'idle' ? '—' : timeStr}
              </div>
              <p className="text-textMuted text-sm capitalize">
                {roundState === 'idle' ? 'Ready for next round' : roundState === 'work' ? 'JUMP!' : 'Rest — breathe'}
              </p>
            </Card>

            {/* Progress dots */}
            <div className="flex gap-1.5 justify-center">
              {Array.from({ length: protocol.rounds }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i < currentRound - 1 ? 'bg-accent' : i === currentRound - 1 ? 'bg-accent/60 scale-125' : 'bg-border'
                  }`}
                />
              ))}
            </div>

            {roundState === 'idle' && (
              currentRound > protocol.rounds ? (
                <Button size="lg" fullWidth loading={saving} onClick={saveSession} className="font-display tracking-widest">
                  Complete Session ♠
                </Button>
              ) : (
                <Button size="lg" fullWidth onClick={startRound} className="font-display tracking-widest" style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.1))', borderColor: '#a78bfa50' }}>
                  Start Round {currentRound}
                </Button>
              )
            )}
          </div>
        )}

        {stage === 'done' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🪢</div>
            <h2 className="font-display text-4xl tracking-wide mb-2" style={{ color: '#a78bfa' }}>SESSION COMPLETE</h2>
            <p className="text-textMuted mb-2">{protocol.rounds} rounds finished</p>
            <p className="text-xs text-textMuted mb-8">{protocol.description}</p>
            <Button size="lg" onClick={() => navigate('/home')}>Back to Dashboard</Button>
          </div>
        )}
      </div>
    </Layout>
  )
}
