import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface BulletFreezeProps {
  isVisible: boolean
  onComplete: () => void
}

const BULLET_COUNT = 10

const BULLET_SVG = (
  <svg viewBox="0 0 12 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3 h-8">
    <path d="M6 0C6 0 2 6 2 18C2 24 3.5 28 5 30L6 32L7 30C8.5 28 10 24 10 18C10 6 6 0 6 0Z" fill="#c8d4f0" opacity="0.9"/>
    <rect x="3" y="28" width="6" height="4" rx="1" fill="#7b9fd4" opacity="0.8"/>
    <path d="M6 0C6 0 2 6 2 18C2 24 3.5 28 5 30L6 32L7 30C8.5 28 10 24 10 18C10 6 6 0 6 0Z" fill="none" stroke="rgba(200,212,240,0.3)" strokeWidth="0.5"/>
  </svg>
)

export function BulletFreeze({ isVisible, onComplete }: BulletFreezeProps) {
  const [phase, setPhase] = useState<'fly' | 'freeze' | 'drop'>('fly')

  useEffect(() => {
    if (!isVisible) {
      setPhase('fly')
      return
    }
    const t1 = setTimeout(() => setPhase('freeze'), 400)
    const t2 = setTimeout(() => setPhase('drop'), 900)
    const t3 = setTimeout(() => onComplete(), 1400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [isVisible, onComplete])

  const bullets = Array.from({ length: BULLET_COUNT }, (_, i) => {
    const fromLeft = i % 2 === 0
    const yPos = 10 + (i * 7) % 80
    const xFreeze = 25 + (i * 5) % 55
    const rotation = fromLeft ? -15 + (i * 7) % 30 : 165 + (i * 7) % 30

    return { id: i, fromLeft, yPos, xFreeze, rotation }
  })

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {bullets.map((b) => (
            <motion.div
              key={b.id}
              className="absolute"
              style={{
                top: `${b.yPos}%`,
                left: phase === 'fly'
                  ? (b.fromLeft ? '-5%' : '105%')
                  : `${b.xFreeze}%`,
                rotate: b.rotation,
                filter: phase === 'freeze' ? 'drop-shadow(0 0 6px rgba(200,212,240,0.6))' : 'none',
              }}
              animate={
                phase === 'fly'
                  ? {
                      left: `${b.xFreeze}%`,
                      transition: { duration: 0.4, ease: [0.2, 0, 0.8, 1], delay: b.id * 0.02 },
                    }
                  : phase === 'freeze'
                  ? {
                      top: `${b.yPos}%`,
                      transition: { duration: 0, delay: 0 },
                    }
                  : {
                      top: '110%',
                      transition: { duration: 0.5, ease: [0.3, 0, 1, 0.6], delay: b.id * 0.03 },
                    }
              }
            >
              {BULLET_SVG}
            </motion.div>
          ))}
          {/* Blue glow overlay during freeze */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 50% 50%, rgba(74,111,165,0.08) 0%, transparent 70%)',
            }}
            animate={{ opacity: phase === 'freeze' ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
