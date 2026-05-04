import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import AIStateContent from './AIStateContent'
import styles from './DynamicIsland.module.css'

export default function DynamicIsland({ 
  onlineCount, 
  isPlaying, 
  onPlayPause,
  aiState = 'idle',
  errorMessage = ''
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [state, setState] = useState('idle') // 'idle' | 'hover' | 'music'
  const pillRef = useRef(null)
  const previousAIStateRef = useRef('idle') // Store AI state before opening music

  useEffect(() => {
    // Entrance animation after 3 second delay
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  // Auto-reset error state after 3 seconds
  useEffect(() => {
    if (aiState === 'error') {
      const timer = setTimeout(() => {
        // Error state will be reset by parent component
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [aiState])

  useEffect(() => {
    // Close music player on outside click or Escape key
    const handleClickOutside = (e) => {
      if (state === 'music' && pillRef.current && !pillRef.current.contains(e.target)) {
        // Return to previous AI state if it was active, otherwise idle
        setState(previousAIStateRef.current !== 'idle' ? 'ai-active' : 'idle')
      }
    }

    const handleEscape = (e) => {
      if (state === 'music' && e.key === 'Escape') {
        // Return to previous AI state if it was active, otherwise idle
        setState(previousAIStateRef.current !== 'idle' ? 'ai-active' : 'idle')
      }
    }

    if (state === 'music') {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [state])

  const handleMouseEnter = () => {
    // Don't allow hover state when AI is active
    if (state === 'idle' && aiState === 'idle') {
      setState('hover')
    }
  }

  const handleMouseLeave = () => {
    // Only return to idle if not in music state
    if (state === 'hover') {
      setState('idle')
    }
  }

  const handleClick = () => {
    // Allow music state when AI is active OR when idle
    if (state !== 'music') {
      if (aiState !== 'idle') {
        // Store current AI state before opening music
        previousAIStateRef.current = aiState
      }
      setState('music')
    }
  }

  const handleMusicIconClick = (e) => {
    e.stopPropagation() // Prevent pill click
    // Store current AI state before opening music
    previousAIStateRef.current = aiState
    setState('music')
  }

  // Determine if we should show AI content (but not when music is open)
  const showAIContent = aiState !== 'idle' && state !== 'music'

  const handlePlayPauseClick = (e) => {
    e.stopPropagation() // Prevent pill click
    onPlayPause()
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.innerCenter}>
        <motion.div
          ref={pillRef}
          className={styles.pill}
          data-state={showAIContent ? aiState : state}
          layout
          style={{ borderRadius: 32 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 0.25 }}
          initial={{ opacity: 0, y: -24 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: -24 }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          <motion.div
            key={showAIContent ? aiState : state}
            initial={{ opacity: 0, scale: 0.9, filter: 'blur(5px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ type: 'spring', bounce: 0.5, delay: 0.05 }}
            className={styles.content}
            data-ai-state={aiState}
          >
            {/* AI States: observing, waiting, processing, thinking, generating, error */}
            {showAIContent && (
              <AIStateContent aiState={aiState} errorMessage={errorMessage} />
            )}

            {/* Normal states: only show when AI is idle */}
            {!showAIContent && (
              <>
                {/* Green dot - visible in idle and hover states only */}
                {state !== 'music' && <div className={styles.greenDot} />}

                {/* Hover state: "1 online" text */}
                {state === 'hover' && (
                  <span className={styles.onlineText}>
                    {onlineCount} online
                  </span>
                )}

                {/* Music state: full music player panel */}
                {state === 'music' && (
                  <div className={styles.musicPanel}>
                    {/* Album art */}
                    <div className={styles.albumArt}>
                      🌌
                    </div>

                    {/* Song info */}
                    <div className={styles.songInfo}>
                      <div className={styles.songTitle}>Starry Night Lofi</div>
                      <div className={styles.artistName}>mooner.dev</div>
                    </div>

                    {/* Music controls */}
                    <div className={styles.musicControls}>
                      <motion.button
                        className={styles.controlButton}
                        aria-label="Skip back"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                      >
                        <SkipBack size={16} />
                      </motion.button>

                      <motion.button
                        className={styles.controlButton}
                        onClick={handlePlayPauseClick}
                        aria-label={isPlaying ? 'Pause music' : 'Play music'}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                      >
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                      </motion.button>

                      <motion.button
                        className={styles.controlButton}
                        aria-label="Skip forward"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                      >
                        <SkipForward size={16} />
                      </motion.button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
