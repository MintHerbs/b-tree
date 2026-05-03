import { useState, useEffect } from 'react'
import styles from './DynamicIsland.module.css'

export default function DynamicIsland({ onlineCount, isPlaying, onPlayPause }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showHint, setShowHint] = useState(true)

  useEffect(() => {
    // Entrance animation after 3 second delay
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const handlePlayPauseClick = () => {
    onPlayPause()
    setShowHint(false)
  }

  return (
    <div
      className={`${styles.pill} ${isVisible ? styles.visible : ''} ${isHovered ? styles.expanded : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Collapsed state: just the green dot */}
      <div className={styles.greenDot} />

      {/* Expanded state content */}
      {isHovered && (
        <div className={`${styles.content} ${isHovered ? styles.visible : ''}`}>
          <div className={styles.leftSection}>
            <span className={styles.onlineText}>{onlineCount} online</span>
          </div>

          <div className={styles.divider} />

          <div className={styles.rightSection}>
            <button
              className={styles.playButton}
              onClick={handlePlayPauseClick}
              aria-label={isPlaying ? 'Pause music' : 'Play music'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            {showHint && <span className={styles.hint}>click to control</span>}
          </div>
        </div>
      )}
    </div>
  )
}
