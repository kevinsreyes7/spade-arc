import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { useProfile } from '@/context/ProfileContext'
import { useAuthContext } from '@/context/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { getPhaseFromWeek } from '@/data/workouts'
import { supabase } from '@/lib/supabase'
import type { BodyMeasurement } from '@/types'

const MEASUREMENT_FIELDS = [
  'bodyweight', 'waist', 'chest', 'arm_left', 'arm_right',
  'quad_left', 'quad_right', 'calf_left', 'calf_right',
] as const

const KEY_LIFTS = [
  { key: 'Weighted Pull-Up', label: 'Pull-Up' },
  { key: 'Barbell Back Squat', label: 'Squat' },
  { key: 'Romanian Deadlift', label: 'RDL' },
  { key: 'Incline Barbell Press', label: 'Incline Press' },
  { key: 'Barbell Hip Thrust', label: 'Hip Thrust' },
]

interface LiftData { date: string; weight: number }

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 text-sm">
        <p className="text-textMuted">{label}</p>
        <p className="text-accent font-mono font-medium">{payload[0].value}kg</p>
      </div>
    )
  }
  return null
}

export function Progress() {
  const { t } = useTranslation()
  const { user } = useAuthContext()
  const { profile } = useProfile()
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([])
  const [liftData, setLiftData] = useState<Record<string, LiftData[]>>({})
  const [showLogForm, setShowLogForm] = useState(false)
  const [logValues, setLogValues] = useState<Record<string, string>>({})
  const [selectedLift, setSelectedLift] = useState(KEY_LIFTS[0].key)
  const [saving, setSaving] = useState(false)

  const currentWeek = profile?.current_week ?? 1
  const phase = getPhaseFromWeek(currentWeek)
  const unit = profile?.unit_preference === 'imperial' ? t('common.lbs') : t('common.kg')

  useEffect(() => {
    if (!user) return
    supabase.from('body_measurements').select('*').eq('user_id', user.id)
      .order('date', { ascending: true })
      .then(({ data }) => { if (data) setMeasurements(data as BodyMeasurement[]) })

    // Two-step query: get session IDs for this user, then get lift data
    const loadLifts = async () => {
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('id, date')
        .eq('user_id', user.id)

      if (!sessions?.length) { setLiftData({}); return }

      const sessionIds = sessions.map((s) => s.id)
      const sessionDateMap: Record<string, string> = {}
      sessions.forEach((s) => { sessionDateMap[s.id] = s.date })

      const results = await Promise.all(KEY_LIFTS.map(async (lift) => {
        const { data: logs } = await supabase
          .from('exercise_logs')
          .select('weight, session_id')
          .eq('exercise_name', lift.key)
          .eq('completed', true)
          .not('weight', 'is', null)
          .in('session_id', sessionIds)

        const byDate: Record<string, number> = {}
        ;(logs ?? []).forEach((d: { weight: number; session_id: string }) => {
          const date = sessionDateMap[d.session_id]
          if (!date) return
          if (!byDate[date] || d.weight > byDate[date]) byDate[date] = d.weight
        })

        return {
          key: lift.key,
          data: Object.entries(byDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, weight]) => ({ date, weight })),
        }
      }))

      const map: Record<string, LiftData[]> = {}
      results.forEach((r) => { map[r.key] = r.data })
      setLiftData(map)
    }

    loadLifts()
  }, [user])

  const saveMeasurements = async () => {
    if (!user) return
    setSaving(true)
    const entry: Record<string, number | string | null> = {
      user_id: user.id,
      date: new Date().toISOString().split('T')[0],
    }
    MEASUREMENT_FIELDS.forEach((f) => {
      entry[f] = logValues[f] ? parseFloat(logValues[f]) : null
    })
    await supabase.from('body_measurements').insert(entry)
    const { data } = await supabase.from('body_measurements').select('*')
      .eq('user_id', user.id).order('date', { ascending: true })
    if (data) setMeasurements(data as BodyMeasurement[])
    setShowLogForm(false)
    setLogValues({})
    setSaving(false)
  }

  const latest = measurements[measurements.length - 1]
  const chartData = measurements.map((m) => ({
    date: m.date.slice(5),
    weight: m.bodyweight,
    waist: m.waist,
    chest: m.chest,
  }))

  const selectedLiftData = liftData[selectedLift] ?? []
  const liftChartData = selectedLiftData.map((d) => ({
    date: d.date.slice(5),
    weight: d.weight,
  }))
  const liftPR = selectedLiftData.reduce((max, d) => d.weight > max ? d.weight : max, 0)

  return (
    <Layout>
      <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-4xl text-textPrimary tracking-wide">{t('progress.title')}</h1>
          <Badge variant="phase">Phase {phase}</Badge>
        </div>

        {/* 20-week timeline */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <Card>
            <p className="text-xs text-textMuted uppercase tracking-widest mb-3">{t('progress.timeline')}</p>
            <div className="flex gap-0.5 mb-1">
              {Array.from({ length: 20 }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-2 rounded-sm transition-colors ${
                    i < currentWeek ? 'bg-accent' : 'bg-border'
                  } ${i + 1 === currentWeek ? 'ring-1 ring-accent ring-offset-1 ring-offset-card' : ''}`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-textMuted mt-1">
              <span>Phase I</span><span>Phase II</span><span>Phase III</span><span>Phase IV</span>
            </div>
            <p className="text-xs text-accent font-mono mt-2">
              {t('progress.currentWeek', { number: currentWeek })} / 20
            </p>
          </Card>
        </motion.div>

        {/* Body measurements */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-textPrimary font-medium">{t('progress.measurements')}</h2>
            <Button size="sm" variant="outline" onClick={() => setShowLogForm((p) => !p)}>
              {t('progress.addMeasurement')}
            </Button>
          </div>

          {showLogForm && (
            <Card className="mb-3">
              <div className="grid grid-cols-2 gap-3 mb-4">
                {MEASUREMENT_FIELDS.map((f) => (
                  <Input
                    key={f}
                    label={`${t(`progress.${f.replace('_left', 'Left').replace('_right', 'Right')}`)} (${unit})`}
                    type="number"
                    inputMode="decimal"
                    value={logValues[f] ?? ''}
                    onChange={(e) => setLogValues((p) => ({ ...p, [f]: e.target.value }))}
                  />
                ))}
              </div>
              <Button size="md" fullWidth loading={saving} onClick={saveMeasurements}>
                {t('progress.save')}
              </Button>
            </Card>
          )}

          {latest ? (
            <Card>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: t('progress.bodyweight'), val: latest.bodyweight },
                  { label: t('progress.waist'), val: latest.waist },
                  { label: t('progress.chest'), val: latest.chest },
                  { label: t('progress.armLeft'), val: latest.arm_left },
                  { label: t('progress.armRight'), val: latest.arm_right },
                  { label: t('progress.quadLeft'), val: latest.quad_left },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <p className="font-mono text-lg text-textPrimary">
                      {item.val ?? '—'}
                    </p>
                    <p className="text-xs text-textMuted">{item.label}</p>
                  </div>
                ))}
              </div>
              {chartData.length > 1 && (
                <div className="mt-4 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                      <XAxis dataKey="date" tick={{ fill: '#4a5568', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#4a5568', fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="weight" stroke="#c8d4f0" strokeWidth={2} dot={{ fill: '#c8d4f0', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          ) : (
            <Card><p className="text-textMuted text-sm text-center py-4">{t('progress.noData')}</p></Card>
          )}
        </motion.div>

        {/* Key lifts */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="mb-5">
          <h2 className="text-textPrimary font-medium mb-3">{t('progress.keyLifts')}</h2>
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            {KEY_LIFTS.map((lift) => (
              <button
                key={lift.key}
                onClick={() => setSelectedLift(lift.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all ${
                  selectedLift === lift.key
                    ? 'bg-secondary/20 border-secondary/50 text-accent'
                    : 'border-border text-textMuted'
                }`}
              >
                {lift.label}
              </button>
            ))}
          </div>

          <Card>
            {liftChartData.length > 1 ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-textMuted">{KEY_LIFTS.find((l) => l.key === selectedLift)?.label}</p>
                  <div className="text-right">
                    <p className="text-xs text-textMuted">{t('progress.personalRecords')}</p>
                    <p className="font-mono text-accent">{liftPR}{unit}</p>
                  </div>
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={liftChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                      <XAxis dataKey="date" tick={{ fill: '#4a5568', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#4a5568', fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="weight" stroke="#7b9fd4" strokeWidth={2} dot={{ fill: '#7b9fd4', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <p className="text-textMuted text-sm text-center py-4">{t('progress.noData')}</p>
            )}
          </Card>
        </motion.div>
      </div>
    </Layout>
  )
}
