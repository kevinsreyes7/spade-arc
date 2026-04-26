import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useAuthContext } from '@/context/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import type { PRShare, WeeklyChallenge } from '@/types'

interface LeaderboardEntry {
  username: string
  session_count: number
  rank: number
  is_me: boolean
}

export function Community() {
  const { t } = useTranslation()
  const { user } = useAuthContext()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [prFeed, setPrFeed] = useState<PRShare[]>([])
  const [challenge, setChallenge] = useState<WeeklyChallenge | null>(null)
  const [mySessionsThisWeek, setMySessionsThisWeek] = useState(0)

  useEffect(() => {
    if (!user) return

    const weekStart = getWeekStart()

    // Leaderboard — count sessions per user this month
    supabase.rpc('get_leaderboard', { week_start: weekStart })
      .then(({ data }) => {
        if (data) setLeaderboard(data as LeaderboardEntry[])
      })

    // PR feed
    supabase.from('pr_shares')
      .select('*')
      .gte('shared_at', weekStart)
      .order('shared_at', { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setPrFeed(data as PRShare[]) })

    // Weekly challenge
    supabase.from('weekly_challenges')
      .select('*')
      .lte('week_start', weekStart)
      .order('week_start', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => { if (data) setChallenge(data as WeeklyChallenge) })

    // My sessions this week
    supabase.from('workout_sessions')
      .select('id')
      .eq('user_id', user.id)
      .gte('date', weekStart)
      .not('completed_at', 'is', null)
      .then(({ data }) => { if (data) setMySessionsThisWeek(data.length) })
  }, [user])

  return (
    <Layout>
      <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
        <h1 className="font-display text-4xl text-textPrimary tracking-wide mb-6">
          {t('community.title')}
        </h1>

        {/* Weekly challenge */}
        {challenge && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
            <Card className="bg-secondary/8 border-secondary/25">
              <div className="flex items-start justify-between mb-2">
                <Badge variant="phase">⚡ {t('community.challenge')}</Badge>
                <span className="text-xs font-mono text-textMuted">
                  {mySessionsThisWeek}/{challenge.target_sessions}
                </span>
              </div>
              <h3 className="text-textPrimary font-medium mb-1">{challenge.title}</h3>
              <p className="text-sm text-textMuted">{challenge.description}</p>
              <div className="mt-3 h-1.5 bg-border rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  animate={{ width: `${Math.min(100, (mySessionsThisWeek / challenge.target_sessions) * 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-xs text-textMuted mt-1">
                {t('community.challengeProgress', {
                  done: mySessionsThisWeek,
                  target: challenge.target_sessions,
                })}
              </p>
            </Card>
          </motion.div>
        )}

        {/* Leaderboard */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mb-5">
          <h2 className="text-textPrimary font-medium mb-3">{t('community.leaderboard')}</h2>
          <Card padding="none">
            {leaderboard.length === 0 ? (
              <div className="p-4">
                <p className="text-textMuted text-sm text-center">
                  Complete sessions to appear here.
                </p>
              </div>
            ) : (
              leaderboard.slice(0, 10).map((entry, i) => (
                <div
                  key={entry.username}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 ${
                    entry.is_me ? 'bg-secondary/8' : ''
                  }`}
                >
                  <span className={`font-mono text-sm w-6 text-center ${
                    i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-textMuted'
                  }`}>
                    {i === 0 ? '♠' : t('community.rank', { number: i + 1 })}
                  </span>
                  <span className={`flex-1 text-sm ${entry.is_me ? 'text-accent font-medium' : 'text-textPrimary'}`}>
                    {entry.username}
                    {entry.is_me && <span className="text-xs text-textMuted ml-1">({t('community.yourRank')})</span>}
                  </span>
                  <span className="text-xs text-textMuted font-mono">
                    {t('community.sessions', { count: entry.session_count })}
                  </span>
                </div>
              ))
            )}
          </Card>
        </motion.div>

        {/* PR Feed */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <h2 className="text-textPrimary font-medium mb-3">{t('community.prFeed')}</h2>
          {prFeed.length === 0 ? (
            <Card><p className="text-textMuted text-sm text-center py-4">{t('community.noShares')}</p></Card>
          ) : (
            <div className="flex flex-col gap-3">
              {prFeed.map((pr, i) => (
                <motion.div
                  key={pr.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-accent font-medium text-sm">@{pr.username}</span>
                          <Badge variant="key" size="sm">PR</Badge>
                        </div>
                        <p className="text-textPrimary text-sm">{pr.exercise_name}</p>
                        <p className="text-xs text-textMuted mt-0.5">
                          {new Date(pr.shared_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-2xl text-accent">{pr.weight}</p>
                        <p className="text-xs text-textMuted">× {pr.reps} reps</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  )
}

function getWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}
