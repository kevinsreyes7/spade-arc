import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import i18n from '@/i18n'
import { useProfile } from '@/context/ProfileContext'
import { useAuthContext } from '@/context/AuthContext'
import { useSubscription } from '@/hooks/useSubscription'
import { Layout } from '@/components/layout/Layout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { redirectToPortal } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import { getPhaseFromWeek, getPhaseName } from '@/data/workouts'
import type { Equipment, Language, UnitPreference } from '@/types'

interface Stats {
  totalSessions: number | null
  currentStreak: number | null
  longestStreak: number | null
  heaviestSquat: number | null
  heaviestPullUp: number | null
  heaviestRDL: number | null
  heaviestBench: number | null
}

function calculateStreaks(dates: string[]): { current: number; longest: number } {
  if (!dates.length) return { current: 0, longest: 0 }
  const unique = [...new Set(dates)].sort()
  if (!unique.length) return { current: 0, longest: 0 }

  const todayStr = new Date().toISOString().split('T')[0]
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0]
  const latest = unique[unique.length - 1]

  let current = 0
  if (latest === todayStr || latest === yesterdayStr) {
    let check = latest
    for (let i = unique.length - 1; i >= 0; i--) {
      if (unique[i] === check) {
        current++
        const d = new Date(check + 'T00:00:00Z')
        d.setUTCDate(d.getUTCDate() - 1)
        check = d.toISOString().split('T')[0]
      } else if (unique[i] < check) {
        break
      }
    }
  }

  let longest = unique.length > 0 ? 1 : 0
  let cur = 1
  for (let i = 1; i < unique.length; i++) {
    const diffDays = Math.round(
      (new Date(unique[i] + 'T00:00:00Z').getTime() - new Date(unique[i - 1] + 'T00:00:00Z').getTime()) / 86400000
    )
    if (diffDays === 1) { cur++; if (cur > longest) longest = cur }
    else cur = 1
  }

  return { current, longest }
}

const EQUIPMENT_LABELS: Record<Equipment, string> = {
  full_gym: 'Full Gym',
  full_gym_sprint: 'Full Gym + Sprint Space',
  barbells_dumbbells: 'Barbells & Dumbbells',
  dumbbells_only: 'Dumbbells Only',
  bodyweight: 'Bodyweight Only',
}

const WEEKS = Array.from({ length: 20 }, (_, i) => i + 1)

export function Profile() {
  const { t } = useTranslation()
  const { user, signOut } = useAuthContext()
  const { profile, update } = useProfile()
  const { isActive } = useSubscription()
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: profile?.name ?? '',
    age: String(profile?.age ?? ''),
    weight_kg: String(profile?.weight_kg ?? ''),
    height_cm: String(profile?.height_cm ?? ''),
  })
  const [saving, setSaving] = useState(false)
  const [restTimerEnabled, setRestTimerEnabled] = useState(
    () => localStorage.getItem('spade_arc_rest_timer') !== 'false'
  )
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    () => (typeof Notification !== 'undefined' ? Notification.permission : 'default')
  )
  const [stats, setStats] = useState<Stats>({
    totalSessions: null, currentStreak: null, longestStreak: null,
    heaviestSquat: null, heaviestPullUp: null, heaviestRDL: null, heaviestBench: null,
  })

  const unit = profile?.unit_preference === 'imperial' ? 'lbs' : 'kg'

  useEffect(() => {
    if (!user) return
    const loadStats = async () => {
      const { count } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)

      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('id, date')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)

      const dates = sessions?.map((s) => s.date) ?? []
      const { current, longest } = calculateStreaks(dates)
      const sessionIds = sessions?.map((s) => s.id) ?? []

      if (!sessionIds.length) {
        setStats({ totalSessions: count ?? 0, currentStreak: current, longestStreak: longest, heaviestSquat: null, heaviestPullUp: null, heaviestRDL: null, heaviestBench: null })
        return
      }

      const [squat, pullup, rdl, bench] = await Promise.all([
        supabase.from('exercise_logs').select('weight').eq('exercise_name', 'Barbell Back Squat').eq('completed', true).not('weight', 'is', null).in('session_id', sessionIds).order('weight', { ascending: false }).limit(1),
        supabase.from('exercise_logs').select('weight').eq('exercise_name', 'Weighted Pull-Up').eq('completed', true).not('weight', 'is', null).in('session_id', sessionIds).order('weight', { ascending: false }).limit(1),
        supabase.from('exercise_logs').select('weight').eq('exercise_name', 'Romanian Deadlift').eq('completed', true).not('weight', 'is', null).in('session_id', sessionIds).order('weight', { ascending: false }).limit(1),
        supabase.from('exercise_logs').select('weight').eq('exercise_name', 'Incline Barbell Press').eq('completed', true).not('weight', 'is', null).in('session_id', sessionIds).order('weight', { ascending: false }).limit(1),
      ])

      setStats({
        totalSessions: count ?? 0,
        currentStreak: current,
        longestStreak: longest,
        heaviestSquat: squat.data?.[0]?.weight ?? null,
        heaviestPullUp: pullup.data?.[0]?.weight ?? null,
        heaviestRDL: rdl.data?.[0]?.weight ?? null,
        heaviestBench: bench.data?.[0]?.weight ?? null,
      })
    }
    loadStats()
  }, [user])

  if (!profile) return null

  const handleSave = async () => {
    setSaving(true)
    await update({
      name: editData.name,
      age: parseInt(editData.age),
      weight_kg: parseFloat(editData.weight_kg),
      height_cm: parseFloat(editData.height_cm),
    })
    setSaving(false)
    setEditing(false)
  }

  const handleLanguageChange = async (lang: Language) => {
    i18n.changeLanguage(lang)
    await update({ language: lang })
  }

  const handleUnitChange = async (unit: UnitPreference) => {
    await update({ unit_preference: unit })
  }

  const handleWeekChange = async (week: number) => {
    await update({ current_week: week })
  }

  const handleManageSubscription = async () => {
    if (profile.stripe_customer_id) {
      await redirectToPortal(profile.stripe_customer_id)
    }
  }

  const handleRestTimerToggle = () => {
    const next = !restTimerEnabled
    setRestTimerEnabled(next)
    localStorage.setItem('spade_arc_rest_timer', next ? 'true' : 'false')
  }

  const handleRequestNotifications = async () => {
    if (typeof Notification === 'undefined') return
    const permission = await Notification.requestPermission()
    setNotifPermission(permission)
    if (permission === 'granted') {
      new Notification('SPADE ARC', {
        body: 'Notifications enabled. You\'ll get your daily EODR reminder.',
        icon: '/icons/icon-192.png',
      })
    }
  }

  return (
    <Layout>
      <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-4xl text-textPrimary tracking-wide">{t('profile.title')}</h1>
          <button
            onClick={() => setEditing((p) => !p)}
            className="text-sm text-secondary hover:text-accent transition-colors"
          >
            {editing ? t('common.cancel') : t('profile.editProfile')}
          </button>
        </div>

        {/* Avatar + name */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center">
                <span className="font-display text-3xl text-accent">
                  {profile.name?.charAt(0)?.toUpperCase() ?? '♠'}
                </span>
              </div>
              <div className="flex-1">
                {editing ? (
                  <Input
                    value={editData.name}
                    onChange={(e) => setEditData((p) => ({ ...p, name: e.target.value }))}
                  />
                ) : (
                  <p className="font-display text-2xl text-textPrimary tracking-wide">{profile.name}</p>
                )}
                <p className="text-sm text-textMuted">{user?.email}</p>
              </div>
            </div>

            {editing && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Input
                  label={`Age`}
                  type="number"
                  value={editData.age}
                  onChange={(e) => setEditData((p) => ({ ...p, age: e.target.value }))}
                />
                <Input
                  label={`Weight (${profile.unit_preference === 'imperial' ? 'lbs' : 'kg'})`}
                  type="number"
                  value={editData.weight_kg}
                  onChange={(e) => setEditData((p) => ({ ...p, weight_kg: e.target.value }))}
                />
              </div>
            )}

            {editing && (
              <Button size="md" fullWidth loading={saving} onClick={handleSave} className="mt-4">
                {t('profile.save')}
              </Button>
            )}
          </Card>
        </motion.div>

        {/* Current week */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="mb-4">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-textMuted uppercase tracking-widest">{t('profile.currentWeek')}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-accent">
                  {getPhaseFromWeek(profile.current_week)} · {getPhaseName(getPhaseFromWeek(profile.current_week))}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-textMuted mb-1">
                <span>Week {profile.current_week} of 20</span>
                <span>{Math.round((profile.current_week / 20) * 100)}% complete</span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${(profile.current_week / 20) * 100}%` }}
                />
              </div>
            </div>

            {/* Phase bands */}
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4].map((p) => {
                const currentPhase = getPhaseFromWeek(profile.current_week)
                return (
                  <div
                    key={p}
                    className={`flex-1 h-1.5 rounded-full ${p < currentPhase ? 'bg-accent' : p === currentPhase ? 'bg-accent/60' : 'bg-border'}`}
                  />
                )
              })}
            </div>

            {/* Advance to Next Week */}
            {profile.current_week < 20 && (
              <button
                onClick={() => {
                  if (window.confirm(`Advance to Week ${profile.current_week + 1}?`)) {
                    handleWeekChange(profile.current_week + 1)
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary/10 border border-secondary/30 text-secondary text-sm font-medium hover:bg-secondary/20 transition-all mb-3"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <polyline points="13 17 18 12 13 7" />
                  <polyline points="6 17 11 12 6 7" />
                </svg>
                Advance to Week {profile.current_week + 1}
              </button>
            )}

            {/* Manual week picker */}
            <p className="text-xs text-textMuted mb-2">Set week manually:</p>
            <div className="flex gap-1 flex-wrap">
              {WEEKS.map((w) => (
                <button
                  key={w}
                  onClick={() => handleWeekChange(w)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono transition-all ${
                    w === profile.current_week
                      ? 'bg-accent text-bg'
                      : w < (profile.current_week ?? 1)
                        ? 'bg-secondary/20 text-secondary'
                        : 'bg-border/30 text-textMuted hover:bg-border/50'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Preferences */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }} className="mb-4">
          <Card>
            {/* Units */}
            <div className="flex items-center justify-between py-2 border-b border-border">
              <p className="text-sm text-textPrimary">{t('profile.units')}</p>
              <div className="flex rounded-lg overflow-hidden border border-border">
                {(['metric', 'imperial'] as UnitPreference[]).map((u) => (
                  <button
                    key={u}
                    onClick={() => handleUnitChange(u)}
                    className={`px-3 py-1 text-xs transition-colors ${
                      profile.unit_preference === u
                        ? 'bg-secondary/20 text-accent'
                        : 'text-textMuted hover:text-textPrimary'
                    }`}
                  >
                    {u === 'metric' ? 'kg / cm' : 'lbs / ft'}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div className="flex items-center justify-between py-2 border-b border-border">
              <p className="text-sm text-textPrimary">{t('profile.language')}</p>
              <div className="flex rounded-lg overflow-hidden border border-border">
                {(['en', 'es'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={`px-3 py-1 text-xs transition-colors ${
                      profile.language === lang
                        ? 'bg-secondary/20 text-accent'
                        : 'text-textMuted hover:text-textPrimary'
                    }`}
                  >
                    {lang === 'en' ? 'English' : 'Español'}
                  </button>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div className="flex items-center justify-between py-2 border-b border-border">
              <p className="text-sm text-textPrimary">{t('profile.equipment')}</p>
              <p className="text-xs text-textMuted">
                {EQUIPMENT_LABELS[profile.equipment as Equipment] ?? profile.equipment}
              </p>
            </div>

            {/* Rest Timer */}
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <p className="text-sm text-textPrimary">Rest Timer</p>
                <p className="text-xs text-textMuted">Auto-start after each set</p>
              </div>
              <button
                onClick={handleRestTimerToggle}
                className={`w-11 h-6 rounded-full transition-colors ${restTimerEnabled ? 'bg-accent' : 'bg-border'}`}
              >
                <span
                  className={`block w-4 h-4 bg-white rounded-full shadow transition-transform ${restTimerEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-textPrimary">EODR & MA Notifications</p>
                <p className="text-xs text-textMuted">Daily report + morning analysis reminders</p>
              </div>
              {notifPermission === 'granted' ? (
                <span className="text-xs text-green-400 font-medium">Enabled</span>
              ) : (
                <button
                  onClick={handleRequestNotifications}
                  className="text-xs text-accent hover:text-accent/80 transition-colors font-medium"
                >
                  Enable
                </button>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="mb-4">
          <Card>
            <p className="text-xs text-textMuted uppercase tracking-widest mb-3">{t('profile.stats.title')}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: t('profile.stats.totalSessions'), val: stats.totalSessions !== null ? String(stats.totalSessions) : '—' },
                { label: t('profile.stats.currentStreak'), val: stats.currentStreak !== null ? `${stats.currentStreak}d` : '—' },
                { label: t('profile.stats.longestStreak'), val: stats.longestStreak !== null ? `${stats.longestStreak}d` : '—' },
                { label: t('profile.stats.heaviestSquat'), val: stats.heaviestSquat !== null ? `${stats.heaviestSquat}${unit}` : '—' },
                { label: t('profile.stats.heaviestPullUp'), val: stats.heaviestPullUp !== null ? `${stats.heaviestPullUp}${unit}` : '—' },
                { label: t('profile.stats.heaviestRDL'), val: stats.heaviestRDL !== null ? `${stats.heaviestRDL}${unit}` : '—' },
                { label: 'Incline Bench PR', val: stats.heaviestBench !== null ? `${stats.heaviestBench}${unit}` : '—' },
              ].map((s) => (
                <div key={s.label} className="bg-bg rounded-xl p-3">
                  <p className="font-mono text-xl text-accent">{s.val}</p>
                  <p className="text-xs text-textMuted mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Subscription */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="mb-4">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-textPrimary">{t('profile.subscription')}</p>
              <Badge variant="success">{t('profile.subscriptionActive')}</Badge>
            </div>
            {isActive && profile.stripe_customer_id && (
              <Button size="sm" variant="outline" onClick={handleManageSubscription}>
                {t('profile.manageSubscription')}
              </Button>
            )}
          </Card>
        </motion.div>

        {/* Creator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }} className="mb-5">
          <Card className="text-center">
            <span className="text-3xl">♠</span>
            <p className="text-xs text-textMuted mt-2 tracking-widest uppercase">{t('profile.creator')}</p>
          </Card>
        </motion.div>

        {/* Sign out */}
        <Button size="lg" fullWidth variant="ghost" onClick={signOut} className="text-danger hover:text-danger">
          {t('profile.signOut')}
        </Button>
      </div>
    </Layout>
  )
}
