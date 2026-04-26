import { useState } from 'react'
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
import type { Equipment, Language, UnitPreference } from '@/types'

const EQUIPMENT_LABELS: Record<Equipment, string> = {
  full_gym: 'Full Gym',
  barbells_dumbbells: 'Barbells & Dumbbells',
  dumbbells_only: 'Dumbbells Only',
  bodyweight: 'Bodyweight Only',
}

const WEEKS = Array.from({ length: 20 }, (_, i) => i + 1)

export function Profile() {
  const { t } = useTranslation()
  const { user, signOut } = useAuthContext()
  const { profile, update } = useProfile()
  const { status, trialDaysLeft, isActive } = useSubscription()
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: profile?.name ?? '',
    age: String(profile?.age ?? ''),
    weight_kg: String(profile?.weight_kg ?? ''),
    height_cm: String(profile?.height_cm ?? ''),
  })
  const [saving, setSaving] = useState(false)

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
            <p className="text-xs text-textMuted uppercase tracking-widest mb-3">{t('profile.currentWeek')}</p>
            <p className="text-textPrimary font-medium mb-2">
              {t('profile.weekOf20', { week: profile.current_week })}
            </p>
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
            <div className="flex items-center justify-between py-2">
              <p className="text-sm text-textPrimary">{t('profile.equipment')}</p>
              <p className="text-xs text-textMuted">
                {EQUIPMENT_LABELS[profile.equipment as Equipment] ?? profile.equipment}
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="mb-4">
          <Card>
            <p className="text-xs text-textMuted uppercase tracking-widest mb-3">{t('profile.stats.title')}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: t('profile.stats.totalSessions'), val: '—' },
                { label: t('profile.stats.currentStreak'), val: '—' },
                { label: t('profile.stats.longestStreak'), val: '—' },
                { label: t('profile.stats.heaviestSquat'), val: '—' },
                { label: t('profile.stats.heaviestPullUp'), val: '—' },
                { label: t('profile.stats.heaviestRDL'), val: '—' },
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
              {isActive ? (
                <Badge variant="success">{t('profile.subscriptionActive')}</Badge>
              ) : status === 'trial' ? (
                <Badge variant="phase">{t('profile.subscriptionTrial')} · {trialDaysLeft}d left</Badge>
              ) : (
                <Badge variant="muted">{t('profile.subscriptionCancelled')}</Badge>
              )}
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
