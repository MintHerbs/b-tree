// Animated text component that scrambles characters on view transitions
import { useEffect, useRef, useState } from 'react'
import styles from './ScrambleText.module.css'

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')

function scrambleText(original) {
  if (!original || typeof original !== 'string') {
    return ''
  }
  return original
    .split('')
    .map((char) =>
      char === ' '
        ? ' '
        : CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]
    )
    .join('')
}

function clearTimers(intervalRef, timeoutRef) {
  if (intervalRef.current) {
    clearInterval(intervalRef.current)
  }
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current)
  }
}

export default function ScrambleText({
  children,
  className = '',
  duration = 500,
  speed = 80,
  triggerKey = null,
  skipInitialAnimation = false
}) {
  const [display, setDisplay] = useState(children)
  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false)
  const [isInitialMount, setIsInitialMount] = useState(true)
  const timeoutRef = useRef(null)
  const intervalRef = useRef(null)

  // Respect user's motion preferences
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setShouldReduceMotion(motionQuery.matches)

    const handleMotionChange = (e) => {
      setShouldReduceMotion(e.matches)
    }

    motionQuery.addEventListener('change', handleMotionChange)

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange)
    }
  }, [])

  // Trigger scramble animation on view transitions
  useEffect(() => {
    // Skip animation on initial mount if requested
    if (skipInitialAnimation && isInitialMount) {
      setIsInitialMount(false)
      setDisplay(children)
      return
    }

    // Mark that we've passed initial mount
    if (isInitialMount) {
      setIsInitialMount(false)
    }

    if (shouldReduceMotion) {
      setDisplay(children)
      return
    }

    if (!children || typeof children !== 'string') {
      setDisplay(children)
      return
    }

    // Clear any existing timers
    clearTimers(intervalRef, timeoutRef)

    // Start animation
    setIsAnimating(true)

    // Start scrambling
    intervalRef.current = setInterval(() => {
      setDisplay(() => scrambleText(children))
    }, speed)

    // Stop after duration and show final text
    timeoutRef.current = setTimeout(() => {
      clearTimers(intervalRef, timeoutRef)
      setDisplay(children)
      setIsAnimating(false)
    }, duration)

    return () => {
      clearTimers(intervalRef, timeoutRef)
      setIsAnimating(false)
    }
  }, [children, duration, speed, shouldReduceMotion, triggerKey, skipInitialAnimation, isInitialMount])

  return (
    <span 
      className={`${styles.scrambleText} ${isAnimating ? styles.animating : ''} ${className}`}
    >
      {display}
    </span>
  )
}
