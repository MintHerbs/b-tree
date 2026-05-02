// Full-screen canvas starfield animation with occasional comets
import { useEffect, useRef } from 'react'
import styles from './Starfield.module.css'

function Starfield() {
  const canvasRef = useRef(null)
  const starsRef = useRef([])
  const cometsRef = useRef([])
  const animationFrameRef = useRef(null)
  const lastCometTimeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      
      // Regenerate stars on resize
      generateStars()
    }

    // Generate 126 stars (30% reduction from 180)
    const generateStars = () => {
      starsRef.current = []
      for (let i = 0; i < 126; i++) {
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.5, // 0.5 to 2px
          speed: Math.random() * 0.25 + 0.05 // 0.05 to 0.3
        })
      }
    }

    // Create a new comet
    const spawnComet = () => {
      const side = Math.floor(Math.random() * 4) // 0=top, 1=right, 2=bottom, 3=left
      let startX, startY, angle
      
      // Spawn from random edge
      switch(side) {
        case 0: // top
          startX = Math.random() * canvas.width
          startY = -20
          angle = Math.random() * Math.PI / 3 + Math.PI / 3 // 60° to 120°
          break
        case 1: // right
          startX = canvas.width + 20
          startY = Math.random() * canvas.height
          angle = Math.random() * Math.PI / 3 + 2 * Math.PI / 3 // 120° to 180°
          break
        case 2: // bottom
          startX = Math.random() * canvas.width
          startY = canvas.height + 20
          angle = Math.random() * Math.PI / 3 + 4 * Math.PI / 3 // 240° to 300°
          break
        default: // left
          startX = -20
          startY = Math.random() * canvas.height
          angle = Math.random() * Math.PI / 3 - Math.PI / 6 // -30° to 30°
          break
      }

      cometsRef.current.push({
        x: startX,
        y: startY,
        angle: angle,
        speed: Math.random() * 2.1 + 3.5, // 3.5 to 5.6 pixels per frame (30% slower)
        tailLength: Math.random() * 40 + 60, // 60 to 100px tail
        life: 1.0 // opacity/life
      })
    }

    // Animation loop
    const animate = (timestamp) => {
      // Clear canvas
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Spawn 1-2 comets every 10 seconds
      if (timestamp - lastCometTimeRef.current > 10000) { // Every 10 seconds
        const numComets = Math.random() < 0.5 ? 1 : 2 // 50% chance of 1 or 2 comets
        for (let i = 0; i < numComets; i++) {
          // Slight delay between multiple comets for variety
          setTimeout(() => spawnComet(), i * 500)
        }
        lastCometTimeRef.current = timestamp
      }

      // Update and draw stars
      starsRef.current.forEach(star => {
        // Move star upward
        star.y -= star.speed

        // Reset to bottom when it exits the top
        if (star.y < -star.radius) {
          star.y = canvas.height + star.radius
          star.x = Math.random() * canvas.width
        }

        // Draw star as white circle with 90% opacity
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // Update and draw comets
      cometsRef.current = cometsRef.current.filter(comet => {
        // Move comet
        comet.x += Math.cos(comet.angle) * comet.speed
        comet.y += Math.sin(comet.angle) * comet.speed
        
        // Fade out over distance
        comet.life -= 0.01

        // Remove if dead or off screen
        if (comet.life <= 0 || 
            comet.x < -100 || comet.x > canvas.width + 100 ||
            comet.y < -100 || comet.y > canvas.height + 100) {
          return false
        }

        // Draw comet tail (gradient from head to tail)
        const tailEndX = comet.x - Math.cos(comet.angle) * comet.tailLength
        const tailEndY = comet.y - Math.sin(comet.angle) * comet.tailLength

        const gradient = ctx.createLinearGradient(
          comet.x, comet.y,
          tailEndX, tailEndY
        )
        gradient.addColorStop(0, `rgba(255, 255, 255, ${comet.life})`)
        gradient.addColorStop(0.5, `rgba(200, 220, 255, ${comet.life * 0.5})`)
        gradient.addColorStop(1, 'rgba(150, 180, 255, 0)')

        ctx.strokeStyle = gradient
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(comet.x, comet.y)
        ctx.lineTo(tailEndX, tailEndY)
        ctx.stroke()

        // Draw comet head (bright white dot)
        ctx.fillStyle = `rgba(255, 255, 255, ${comet.life})`
        ctx.beginPath()
        ctx.arc(comet.x, comet.y, 2, 0, Math.PI * 2)
        ctx.fill()

        return true
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    // Initialize
    resizeCanvas()
    animate()

    // Handle window resize
    window.addEventListener('resize', resizeCanvas)

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return <canvas ref={canvasRef} className={styles.canvas} />
}

export default Starfield
