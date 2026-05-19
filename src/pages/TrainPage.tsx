import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useProfile } from '@/context/ProfileContext'
import { useAuthContext } from '@/context/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { getPhaseFromWeek, getPhaseName } from '@/data/workouts'
import { supabase } from '@/lib/supabase'
import type { SessionType } from '@/types'

type ViewTab = 'today' | 'calendar'

interface ScheduledSession {
  date: string
  session_type: SessionType
  workout_day_id: number | null
  custom_name: string | null
  completed: boolean
}

const SESSION_COLORS: Record<SessionType, string> = {
  strength_a: '#c8d4f0',
  strength_b: '#c8d4f0',
  strength_c: '#c8d4f0',
  strength_d: '#c8d4f0',
  strength_e: '#c8d4f0',
  arms_core: '#c8d4f0',
  speed: '#c0392b',
  swimming: '#2dd4bf',
  jump_rope: '#a78bfa',
  mobility: '#34d399',
  rest: '#374151',
  active_recovery: '#4a5568',
  custom: '#c9a84c',
}

const SESSION_LABELS: Record<SessionType, string> = {
  strength_a: 'Strength A — Back & Biceps',
  strength_b: 'Strength B — Chest & Triceps',
  strength_c: 'Strength C — Legs Quads',
  strength_d: 'Strength D — Legs Hamstrings',
  strength_e: 'Strength E — Shoulders & Back',
  arms_core: 'Arms & Core',
  speed: 'Speed Day',
  swimming: 'Swimming',
  jump_rope: 'Jump Rope',
  mobility: 'Mobility & Athleticism',
  rest: 'Rest Day',
  active_recovery: 'Active Recovery',
  custom: 'Custom',
}

const SESSION_ROUTES: Partial<Record<SessionType, string>> = {
  strength_a: '/workout/1',
  strength_b: '/workout/2',
  strength_c: '/workout/3',
  strength_d: '/workout/4',
  strength_e: '/workout/5',
  arms_core: '/workout/6',
  speed: '/speed-day',
  swimming: '/swimming',
  jump_rope: '/jump-rope',
}

const ALL_SESSION_TYPES: SessionType[] = [
  'strength_a', 'strength_b', 'strength_c', 'strength_d', 'strength_e',
  'arms_core', 'speed', 'swimming', 'jump_rope', 'mobility', 'rest', 'active_recovery', 'custom',
]

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function getMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const days: (Date | null)[] = []
  for (let i = 0; i < first.getDay(); i++) days.push(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
  return days
}

export function TrainPage() {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { profile } = useProfile()

  const [tab, setTab] = useState<ViewTab>('today')
  const [sessions, setSessions] = useState<Record<string, ScheduledSession>>({})
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set())
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [showAssign, setShowAssign] = useState<string | null>(null)
  const [assignType, setAssignType] = useState<SessionType>('strength_a')
  const [customName, setCustomName] = useState('')
  const [saving, setSaving] = useState(false)

  const currentWeek = profile?.current_week ?? 1
  const phase = getPhaseFromWeek(currentWeek)
  const today = todayStr()

  useEffect(() => {
    if (!user) return
    const year = calendarDate.getFullYear()
    const month = calendarDate.getMonth()
    const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const end = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`

    supabase
      .from('scheduled_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', end)
      .then(({ data }) => {
        if (!data) return
        const map: Record<string, ScheduledSession> = {}
        data.forEach((s: ScheduledSession) => { map[s.date] = s })
        setSessions(map)
      })

    supabase
      .from('workout_sessions')
      .select('date')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .gte('date', start)
      .lte('date', end)
      .then(({ data }) => {
        if (!data) return
        setCompletedDates(new Set(data.map((s: { date: string }) => s.date)))
      })
  }, [user, calendarDate])

  const todaySession = sessions[today]
  const todayRoute = todaySession ? SESSION_ROUTES[todaySession.session_type] : null

  const handleAssign = async () => {
    if (!user || !showAssign) return
    setSaving(true)
    await supabase.from('scheduled_sessions').upsert({
      user_id: user.id,
      date: showAssign,
      session_type: assignType,
      custom_name: assignType === 'custom' ? customName : null,
      workout_day_id: null,
      completed: false,
    })
    setSessions((prev) => ({
      ...prev,
      [showAssign]: {
        date: showAssign,
        session_type: assignType,
        custom_name: assignType === 'custom' ? customName : null,
        workout_day_id: null,
        completed: false,
      },
    }))
    setSaving(false)
    setShowAssign(null)
  }

  const year = calendarDate.getFullYear()
  const month = calendarDate.getMonth()
  const monthDays = getMonthDays(year, month)
  const monthName = calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <Layout>
      <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-4xl text-textPrimary tracking-wide">TRAIN</h1>
            <p className="text-xs text-textMuted mt-0.5">
              <Badge variant="phase" className="mr-1">{getPhaseName(phase)}</Badge>
              Week {currentWeek} of 20
            </p>
          </div>
          <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
            {(['today', 'calendar'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setTab(v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${
                  tab === v ? 'bg-secondary/20 text-accent' : 'text-textMuted'
                }`}
              >
                {v === 'today' ? 'Today' : 'Calendar'}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'today' ? (
            <motion.div key="today" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              {todaySession ? (
                <div className="space-y-4">
                  <Card className="relative overflow-hidden" hover>
                    <div
                      className="absolute inset-0 pointer-events-none opacity-10 rounded-2xl"
                      style={{ backgroundColor: SESSION_COLORS[todaySession.session_type] }}
                    />
                    <div className="relative">
                      <p className="text-xs text-textMuted tracking-widest uppercase mb-2">Today's Session</p>
                      <h2 className="font-display text-3xl tracking-wide mb-1" style={{ color: SESSION_COLORS[todaySession.session_type] }}>
                        {todaySession.session_type === 'custom'
                          ? todaySession.custom_name || 'Custom'
                          : SESSION_LABELS[todaySession.session_type]}
                      </h2>
                      {completedDates.has(today) ? (
                        <Badge variant="success">Completed</Badge>
                      ) : (
                        <Badge variant="muted">Scheduled</Badge>
                      )}
                    </div>
                    {todayRoute && !completedDates.has(today) && (
                      <Button size="lg" fullWidth className="mt-4 font-display tracking-widest text-lg" onClick={() => navigate(todayRoute)}>
                        START SESSION ♠
                      </Button>
                    )}
                  </Card>

                  <button
                    onClick={() => setShowAssign(today)}
                    className="w-full text-sm text-textMuted text-center py-2 hover:text-accent transition-colors"
                  >
                    Change today's session
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Card className="text-center py-8">
                    <p className="font-display text-4xl text-textMuted tracking-widest mb-2">—</p>
                    <p className="text-textMuted text-sm mb-1">No session scheduled for today</p>
                    <p className="text-xs text-textMuted/60">Your arc starts here</p>
                  </Card>
                  <p className="text-sm text-textPrimary font-medium px-1">Start any session now</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_SESSION_TYPES.filter((t) => SESSION_ROUTES[t]).map((type) => (
                      <button
                        key={type}
                        onClick={() => navigate(SESSION_ROUTES[type]!)}
                        className="flex items-center gap-2 p-3 rounded-xl border border-border bg-card hover:border-accent/40 transition-all text-left"
                      >
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: SESSION_COLORS[type] }} />
                        <span className="text-xs text-textMuted leading-tight">{SESSION_LABELS[type]}</span>
                      </button>
                    ))}
                  </div>
                  <Button variant="outline" fullWidth onClick={() => setShowAssign(today)}>
                    Schedule for today
                  </Button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="calendar" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              {/* Month nav */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-textMuted hover:text-accent transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <p className="font-display text-xl text-textPrimary tracking-wide">{monthName}</p>
                <button
                  onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-textMuted hover:text-accent transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="text-center text-xs text-textMuted py-1">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((date, i) => {
                  if (!date) return <div key={`empty-${i}`} />
                  const dStr = date.toISOString().split('T')[0]
                  const session = sessions[dStr]
                  const isToday = dStr === today
                  const isCompleted = completedDates.has(dStr)
                  const color = session ? SESSION_COLORS[session.session_type] : null

                  return (
                    <button
                      key={dStr}
                      onClick={() => setShowAssign(dStr)}
                      className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all relative ${
                        isToday ? 'ring-1 ring-accent' : ''
                      } ${session ? 'bg-card border' : 'hover:bg-card/50'}`}
                      style={session ? { borderColor: `${color}50` } : {}}
                    >
                      <span className={`text-xs font-mono ${isToday ? 'text-accent font-medium' : 'text-textMuted'}`}>
                        {date.getDate()}
                      </span>
                      {session && (
                        <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ backgroundColor: color! }} />
                      )}
                      {isCompleted && (
                        <div className="absolute top-0.5 right-0.5">
                          <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                            <circle cx="6" cy="6" r="5" fill="#27ae60" />
                            <polyline points="3.5 6 5 7.5 8.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-2">
                {['strength_a', 'speed', 'swimming', 'jump_rope', 'mobility', 'rest', 'custom'].map((type) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SESSION_COLORS[type as SessionType] }} />
                    <span className="text-[10px] text-textMuted capitalize">
                      {type === 'strength_a' ? 'Strength' : SESSION_LABELS[type as SessionType]}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assign session sheet */}
        <AnimatePresence>
          {showAssign && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 backdrop"
                onClick={() => setShowAssign(null)}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl p-5 pb-safe max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="font-medium text-textPrimary">Assign Session — {showAssign}</p>
                  <button onClick={() => setShowAssign(null)} className="text-textMuted hover:text-accent">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-1.5 mb-4">
                  {ALL_SESSION_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setAssignType(type)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        assignType === type ? 'border-accent/60 bg-secondary/10' : 'border-border hover:border-border/70'
                      }`}
                    >
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: SESSION_COLORS[type] }} />
                      <span className={`text-sm ${assignType === type ? 'text-accent' : 'text-textMuted'}`}>
                        {SESSION_LABELS[type]}
                      </span>
                      {assignType === type && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 ml-auto text-accent">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>

                {assignType === 'custom' && (
                  <input
                    className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-textPrimary placeholder:text-textMuted mb-4 focus:border-accent/60 focus:outline-none"
                    placeholder="Session name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                )}

                <Button size="lg" fullWidth loading={saving} onClick={handleAssign}>
                  Assign Session
                </Button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  )
}
