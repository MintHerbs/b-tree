// React hook for playing through animation steps with timing control
// Manages: current step index, play/pause state, speed, navigation

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Custom hook for managing animation playback
 * @param {Array} steps - Array of animation step objects
 * @returns {Object} - Playback state and controls
 */
export function useAnimationPlayer(steps = []) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1) // 0.5x to 2x
  const intervalRef = useRef(null)

  // Base delay in milliseconds (will be divided by speed)
  const baseDelay = 1000

  // Reset to first step when steps array changes
  useEffect(() => {
    setCurrentStepIndex(0)
    setIsPlaying(false)
  }, [steps])

  // Play animation
  const play = useCallback(() => {
    if (steps.length === 0) return
    setIsPlaying(true)
  }, [steps.length])

  // Pause animation
  const pause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])

  // Go to next step
  const next = useCallback(() => {
    setCurrentStepIndex(prev => {
      const nextIndex = Math.min(steps.length - 1, prev + 1)
      // Pause if we reached the end
      if (nextIndex === steps.length - 1) {
        setIsPlaying(false)
      }
      return nextIndex
    })
  }, [steps.length])

  // Go to previous step
  const prev = useCallback(() => {
    setCurrentStepIndex(prev => Math.max(0, prev - 1))
  }, [])

  // Go to specific step
  const goToStep = useCallback((index) => {
    const clampedIndex = Math.max(0, Math.min(steps.length - 1, index))
    setCurrentStepIndex(clampedIndex)
    
    // Pause if we're at the end
    if (clampedIndex === steps.length - 1) {
      setIsPlaying(false)
    }
  }, [steps.length])

  // Update speed
  const updateSpeed = useCallback((newSpeed) => {
    setSpeed(Math.max(0.5, Math.min(2, newSpeed)))
  }, [])

  // Reset to beginning
  const reset = useCallback(() => {
    setCurrentStepIndex(0)
    setIsPlaying(false)
  }, [])

  // Auto-play effect
  useEffect(() => {
    if (isPlaying && steps.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentStepIndex(prev => {
          // If we're at the last step, stop playing
          if (prev >= steps.length - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, baseDelay / speed)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, speed, steps.length])

  // Get current step
  const currentStep = steps[currentStepIndex] || null

  // Computed properties
  const isAtStart = currentStepIndex === 0
  const isAtEnd = steps.length === 0 || currentStepIndex >= steps.length - 1
  const hasSteps = steps.length > 0
  const totalSteps = steps.length

  return {
    // State
    currentStepIndex,
    currentStep,
    isPlaying,
    speed,
    isAtStart,
    isAtEnd,
    hasSteps,
    totalSteps,
    
    // Controls
    play,
    pause,
    togglePlayPause,
    next,
    prev,
    goToStep,
    updateSpeed,
    reset
  }
}
