import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuthContext } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { morningProtocol, nightProtocol } from '@/data/protocols'
import { Button } from '@/components/ui/Button'

interface DecompressionSheetProps {
  visible: boolean
  type: 'morning' | 'night'
  onClose: () => void
  onComplete: () => void
}

export function DecompressionSheet({ visible, type, onClose, onComplete }: DecompressionSheetProps) {
  const { t } = useTranslation()
  const { user } = useAuthContext()
  const items = type === 'morning' ? morningProtocol : nightProtocol
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleDone = async () => {
    if (!user) return
    setSaving(true)
    await supabase.from('decompression_logs').insert({
      user_id: user.id,
      date: new Date().toISOString().split('T')[0],
      type,
      items_completed: Array.from(checked),
      completed_at: new Date().toISOString(),
    })
    setSaving(false)
    onComplete()
    onClose()
  }

  const allChecked = checked.size === items.length
  const title = type === 'morning'
    ? t('protocol.morning.title')
    : t('protocol.night.title')

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl max-h-[90vh] flex flex-col"
            style={{ paddingBottom: 'max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom)))' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-4 pb-2 flex-shrink-0">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 pb-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl text-textPrimary tracking-wider">{title}</h2>
                  <p className="text-xs text-textMuted mt-0.5">
                    {checked.size} / {items.length} completed
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-secondary/15 flex items-center justify-center">
                  <span className="text-xl">{type === 'morning' ? '🌅' : '🌙'}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-1.5 bg-border rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  animate={{ width: `${(checked.size / items.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              <div className="flex flex-col gap-2">
                {items.map((item, i) => {
                  const isDone = checked.has(item.id)
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => toggle(item.id)}
                      className={`
                        flex items-start gap-3 p-4 rounded-2xl border text-left transition-all duration-200
                        ${isDone
                          ? 'bg-secondary/10 border-secondary/30'
                          : 'bg-bg/60 border-border/50 hover:border-secondary/30'
                        }
                      `}
                    >
                      {/* Checkbox */}
                      <div className={`
                        w-6 h-6 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all
                        ${isDone ? 'bg-accent border-accent' : 'border-textMuted/40'}
                      `}>
                        {isDone && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="#0a0d1a" strokeWidth={3} className="w-3.5 h-3.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg leading-none">{item.icon}</span>
                          <p className={`font-medium text-sm ${isDone ? 'text-textMuted line-through' : 'text-textPrimary'}`}>
                            {t(item.titleKey)}
                          </p>
                        </div>
                        <p className="text-xs text-textMuted mt-1 leading-relaxed">
                          {t(item.descKey)}
                        </p>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pt-3 flex-shrink-0">
              <Button
                size="lg"
                fullWidth
                loading={saving}
                onClick={handleDone}
                variant={allChecked ? 'primary' : 'outline'}
              >
                {allChecked ? `✓ Mark Complete` : `Mark Complete (${checked.size}/${items.length})`}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
