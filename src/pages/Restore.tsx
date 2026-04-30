import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthContext } from '@/context/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DecompressionSheet } from '@/components/DecompressionSheet'
import { supabase } from '@/lib/supabase'

export function Restore() {
  const { user } = useAuthContext()
  const location = useLocation()

  const [morningDone, setMorningDone] = useState(false)
  const [nightDone, setNightDone] = useState(false)
  const [streak, setStreak] = useState(0)
  const [showSheet, setShowSheet] = useState<'morning' | 'night' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    setLoading(true)

    supabase
      .from('decompression_logs')
      .select('date, type')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .then(({ data }) => {
        if (!data) { setLoading(false); return }

        // Today's status
        const todayLogs = data.filter((l) => l.date === today)
        setMorningDone(todayLogs.some((l) => l.type === 'morning'))
        setNightDone(todayLogs.some((l) => l.type === 'night'))

        // Consecutive days where BOTH morning and night are completed
        const byDate: Record<string, Set<string>> = {}
        data.forEach((log) => {
          if (!byDate[log.date]) byDate[log.date] = new Set()
          byDate[log.date].add(log.type)
        })

        let s = 0
        const check = new Date()
        while (true) {
          const dateStr = check.toISOString().split('T')[0]
          const types = byDate[dateStr]
          if (!types || !types.has('morning') || !types.has('night')) break
          s++
          check.setDate(check.getDate() - 1)
        }
        setStreak(s)
        setLoading(false)
      })
  }, [user, location.key])

  const handleComplete = (type: 'morning' | 'night') => {
    if (type === 'morning') setMorningDone(true)
    if (type === 'night') setNightDone(true)
    // Recalculate streak optimistically
    if (
      (type === 'morning' && nightDone) ||
      (type === 'night' && morningDone)
    ) {
      setStreak((s) => s + 1)
    }
    setShowSheet(null)
  }

  return (
    <Layout>
      <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="font-display text-4xl text-accent tracking-widest">RESTORE</h1>
          <p className="text-textMuted text-sm mt-0.5">Daily decompression protocols</p>
        </motion.div>

        {/* Streak card */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-5">
          <Card className="text-center py-6">
            <p className="text-6xl mb-2">🔥</p>
            {loading ? (
              <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
            ) : (
              <>
                <p className="font-display text-6xl text-accent tracking-wider">{streak}</p>
                <p className="text-textMuted text-sm mt-1">
                  {streak === 1 ? 'day streak' : 'day streak'}
                </p>
                <p className="text-xs text-textMuted/60 mt-2">
                  Consecutive days with both morning &amp; night completed
                </p>
              </>
            )}
          </Card>
        </motion.div>

        {/* Today's status */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-5">
          <p className="text-xs text-textMuted uppercase tracking-widest mb-3">Today</p>
          <div className="flex flex-col gap-3">

            {/* Morning */}
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌅</span>
                  <div>
                    <p className="text-textPrimary font-medium text-sm">Morning Protocol</p>
                    <p className="text-xs text-textMuted">8 steps · 15 min</p>
                  </div>
                </div>
                {morningDone ? (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-success flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#0a0d1a" strokeWidth={3} className="w-4 h-4">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="text-xs text-success font-medium">Done</span>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setShowSheet('morning')}>
                    Start
                  </Button>
                )}
              </div>
            </Card>

            {/* Night */}
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌙</span>
                  <div>
                    <p className="text-textPrimary font-medium text-sm">Night Protocol</p>
                    <p className="text-xs text-textMuted">8 steps · 15 min</p>
                  </div>
                </div>
                {nightDone ? (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-success flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#0a0d1a" strokeWidth={3} className="w-4 h-4">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="text-xs text-success font-medium">Done</span>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setShowSheet('night')}>
                    Start
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Why section */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="bg-secondary/5 border-secondary/20">
            <p className="text-xs text-textMuted uppercase tracking-widest mb-2">Why Decompress</p>
            <p className="text-sm text-textMuted leading-relaxed">
              Daily spinal decompression counters the compressive load from heavy lifting and long sitting.
              The dead hang, hip flexor work, and breathwork done consistently rebuild posture, reduce
              injury risk, and improve recovery — making every training session more effective.
            </p>
          </Card>
        </motion.div>
      </div>

      <DecompressionSheet
        visible={showSheet === 'morning'}
        type="morning"
        onClose={() => setShowSheet(null)}
        onComplete={() => handleComplete('morning')}
      />
      <DecompressionSheet
        visible={showSheet === 'night'}
        type="night"
        onClose={() => setShowSheet(null)}
        onComplete={() => handleComplete('night')}
      />
    </Layout>
  )
}
