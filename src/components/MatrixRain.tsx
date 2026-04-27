import { useEffect, useRef } from 'react'

// 70% spades, 30% digits
function randomChar(): string {
  return Math.random() < 0.7 ? '♠' : String(Math.floor(Math.random() * 10))
}

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const FS = 14

    const setup = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    setup()

    // Seed drops spread across full visible height so rain is
    // immediately visible on mount.
    const makeDrops = () => {
      const cols = Math.floor(canvas.width / FS) + 1
      return Array.from({ length: cols }, () =>
        Math.floor(Math.random() * (canvas.height / FS))
      )
    }

    let drops = makeDrops()

    const handleResize = () => {
      setup()
      drops = makeDrops()
    }
    window.addEventListener('resize', handleResize)

    // Solid initial fill so characters appear immediately without fading in.
    ctx.fillStyle = '#0a0d1a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    let last = 0
    const INTERVAL = 55 // ~18fps — medium speed

    const draw = (t: number) => {
      animId = requestAnimationFrame(draw)
      if (t - last < INTERVAL) return
      last = t

      // Semi-transparent overlay creates the trailing fade.
      // Lower value = longer, more visible trail (0.08 → fades to 0.15 over ~30 frames).
      ctx.fillStyle = 'rgba(10,13,26,0.08)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = `${FS}px "DM Mono", monospace`
      ctx.textBaseline = 'top'

      for (let i = 0; i < drops.length; i++) {
        const x = i * FS
        const y = drops[i] * FS

        // Head character — full brightness with glow
        ctx.shadowBlur = 12
        ctx.shadowColor = 'rgba(200,212,240,0.9)'
        ctx.fillStyle = 'rgba(200,212,240,0.9)'
        ctx.fillText(randomChar(), x, y)
        ctx.shadowBlur = 0

        drops[i]++

        if (drops[i] * FS > canvas.height + FS * 5 && Math.random() > 0.95) {
          drops[i] = Math.floor(Math.random() * -30)
        }
      }
    }

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        display: 'block',
      }}
    />
  )
}
