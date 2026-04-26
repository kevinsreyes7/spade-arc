import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { Substitute } from '@/types'

interface SubstituteSheetProps {
  visible: boolean
  substitutes: Substitute[]
  onSelect: (index: number) => void
  onClose: () => void
}

export function SubstituteSheet({ visible, substitutes, onSelect, onClose }: SubstituteSheetProps) {
  const { t } = useTranslation()

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
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl"
            style={{ paddingBottom: 'max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom)))' }}
          >
            <div className="p-6">
              <div className="w-8 h-1 bg-border rounded-full mx-auto mb-6" />
              <h3 className="font-display text-2xl text-textPrimary tracking-wider mb-4">
                {t('workout.substituteTitle')}
              </h3>
              <div className="flex flex-col gap-3">
                {substitutes.map((sub, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { onSelect(i); onClose() }}
                    className="w-full text-left bg-bg border border-border rounded-xl p-4 hover:border-secondary active:scale-[0.99] transition-all duration-150 card-hover"
                  >
                    <p className="text-textPrimary font-medium mb-1">{t(sub.nameKey)}</p>
                    <p className="text-sm text-textMuted leading-relaxed">{t(sub.explanationKey)}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs text-accent">
                      {t('workout.substituteSelect')}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
