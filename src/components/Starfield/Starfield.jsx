// Full-screen canvas starfield animation
import { useEffect, useRef } from 'react'
import styles from './Starfield.module.css'

function Starfield() {
  const canvasRef = useRef(null)
  const starsRef = useRef([])
  const animationFrameRef = useRef(null)

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

    // Generate 180 stars with random properties
    const generateStars = () => {
      starsRef.current = []
      for (let i = 0; i < 180; i++) {
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.5, // 0.5 to 2px
          speed: Math.random() * 0.25 + 0.05 // 0.05 to 0.3
        })
      }
    }

    // Animation loop
    const animate = () => {
      // Clear canvas
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw stars
      starsRef.current.forEach(star => {
        // Move star upward
        star.y -= star.speed

        // Reset to bottom when it exits the top
        if (star.y < -star.radius) {
          star.y = canvas.height + star.radius
          star.x = Math.random() * canvas.width
        }

        // Draw star as white circle
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fill()
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
