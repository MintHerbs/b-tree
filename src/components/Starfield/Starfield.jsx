// Full-screen canvas starfield animation with occasional comets
// Optimised: batched star draws, 60fps cap, Page Visibility API pause
import { useEffect, useRef } from 'react'
import styles from './Starfield.module.css'

function Starfield({ opacity = 1.0 }) {
  const canvasRef = useRef(null)
  const starsRef = useRef([])
  const cometsRef = useRef([])
  const animationFrameRef = useRef(null)
  const lastCometTimeRef = useRef(0)
  const lastFrameTimeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // alpha: false tells the browser the canvas is fully opaque — faster compositing
    const ctx = canvas.getContext('2d', { alpha: false })

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      generateStars()
    }

    const generateStars = () => {
      starsRef.current = Array.from({ length: 126 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.25 + 0.05,
      }))
    }

    const spawnComet = () => {
      const side = Math.floor(Math.random() * 4)
      let startX, startY, angle

      switch (side) {
        case 0: // top
          startX = Math.random() * canvas.width
          startY = -20
          angle = Math.random() * Math.PI / 3 + Math.PI / 3
          break
        case 1: // right
          startX = canvas.width + 20
          startY = Math.random() * canvas.height
          angle = Math.random() * Math.PI / 3 + 2 * Math.PI / 3
          break
        case 2: // bottom
          startX = Math.random() * canvas.width
          startY = canvas.height + 20
          angle = Math.random() * Math.PI / 3 + 4 * Math.PI / 3
          break
        default: // left
          startX = -20
          startY = Math.random() * canvas.height
          angle = Math.random() * Math.PI / 3 - Math.PI / 6
          break
      }

      cometsRef.current.push({
        x: startX,
        y: startY,
        angle,
        speed: Math.random() * 2.1 + 3.5,
        tailLength: Math.random() * 40 + 60,
        life: 1.0,
      })
    }

    const animate = (timestamp) => {
      animationFrameRef.current = requestAnimationFrame(animate)

      // Cap at 60fps — skip frame if less than 16ms has passed
      const delta = timestamp - lastFrameTimeRef.current
      if (delta < 16) return
      lastFrameTimeRef.current = timestamp

      // Clear canvas
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Spawn comets every 10 seconds
      if (timestamp - lastCometTimeRef.current > 10000) {
        const numComets = Math.random() < 0.5 ? 1 : 2
        spawnComet()
        // Use rAF-based delay instead of setTimeout to avoid tab-switch queuing
        if (numComets === 2) {
          const delayStart = timestamp
          const spawnSecond = (t) => {
            if (t - delayStart >= 500) { spawnComet(); return }
            requestAnimationFrame(spawnSecond)
          }
          requestAnimationFrame(spawnSecond)
        }
        lastCometTimeRef.current = timestamp
      }

      // ── Stars: batched into a single fill call ─────────────────────────
      // All stars share the same colour so we can draw one path and fill once
      ctx.fillStyle = `rgba(255,255,255,${0.9 * opacity})`
      ctx.beginPath()
      starsRef.current.forEach(star => {
        star.y -= star.speed
        if (star.y < -star.radius) {
          star.y = canvas.height + star.radius
          star.x = Math.random() * canvas.width
        }
        // moveTo before arc prevents the browser drawing connecting lines
        ctx.moveTo(star.x + star.radius, star.y)
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
      })
      ctx.fill()

      // ── Comets ─────────────────────────────────────────────────────────
      cometsRef.current = cometsRef.current.filter(comet => {
        comet.x += Math.cos(comet.angle) * comet.speed
        comet.y += Math.sin(comet.angle) * comet.speed
        comet.life -= 0.012

        if (
          comet.life <= 0 ||
          comet.x < -100 || comet.x > canvas.width + 100 ||
          comet.y < -100 || comet.y > canvas.height + 100
        ) return false

        const tailEndX = comet.x - Math.cos(comet.angle) * comet.tailLength
        const tailEndY = comet.y - Math.sin(comet.angle) * comet.tailLength

        const gradient = ctx.createLinearGradient(comet.x, comet.y, tailEndX, tailEndY)
        gradient.addColorStop(0, `rgba(255,255,255,${comet.life * opacity})`)
        gradient.addColorStop(0.5, `rgba(200,220,255,${comet.life * 0.5 * opacity})`)
        gradient.addColorStop(1, 'rgba(150,180,255,0)')

        ctx.strokeStyle = gradient
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(comet.x, comet.y)
        ctx.lineTo(tailEndX, tailEndY)
        ctx.stroke()

        // Comet head
        ctx.fillStyle = `rgba(255,255,255,${comet.life * opacity})`
        ctx.beginPath()
        ctx.arc(comet.x, comet.y, 2, 0, Math.PI * 2)
        ctx.fill()

        return true
      })
    }

    // ── Page Visibility API ─────────────────────────────────────────────
    // Pauses rAF when tab is hidden, resets timers on return so there's
    // no comet burst or accumulated star backlog when switching back
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
      } else {
        const now = performance.now()
        lastCometTimeRef.current = now  // reset — no comet burst on return
        lastFrameTimeRef.current = now
        animationFrameRef.current = requestAnimationFrame(animate)
      }
    }

    resizeCanvas()
    animationFrameRef.current = requestAnimationFrame(animate)
    window.addEventListener('resize', resizeCanvas)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [opacity])

  return <canvas ref={canvasRef} className={styles.canvas} />
}

export default Starfield
