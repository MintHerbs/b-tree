// Bottom control bar - play/pause/next/prev buttons, speed slider, step counter
import styles from './StepControls.module.css'

function StepControls({ player }) {
  const {
    currentStepIndex,
    currentStep,
    isPlaying,
    speed,
    isAtStart,
    isAtEnd,
    hasSteps,
    totalSteps,
    togglePlayPause,
    next,
    prev,
    updateSpeed
  } = player

  const stepDescription = currentStep?.description || 'Ready to visualize'

  const handleSpeedChange = (e) => {
    updateSpeed(parseFloat(e.target.value))
  }

  return (
    <div className={styles.controls}>
      <div className={styles.left}>
        <button 
          className={styles.button} 
          onClick={prev} 
          disabled={isAtStart || !hasSteps}
          title="Previous step"
        >
          <span className={styles.buttonIcon}>|◀</span>
          <span className={styles.buttonText}>Prev</span>
        </button>
        <button 
          className={`${styles.button} ${styles.playButton}`}
          onClick={togglePlayPause}
          disabled={!hasSteps}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          <span className={styles.buttonIcon}>{isPlaying ? '⏸' : '▶'}</span>
          <span className={styles.buttonText}>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>
        <button 
          className={styles.button} 
          onClick={next} 
          disabled={isAtEnd || !hasSteps}
          title="Next step"
        >
          <span className={styles.buttonText}>Next</span>
          <span className={styles.buttonIcon}>▶|</span>
        </button>
      </div>

      <div className={styles.center}>
        <div className={styles.stepCounter}>
          Step {hasSteps ? currentStepIndex + 1 : 0} / {totalSteps}
        </div>
        <div className={styles.description}>
          {stepDescription}
        </div>
      </div>

      <div className={styles.right}>
        <span className={styles.speedLabel}>Speed:</span>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={speed}
          onChange={handleSpeedChange}
          className={styles.slider}
          disabled={!hasSteps}
          title={`Playback speed: ${speed.toFixed(1)}x`}
        />
        <span className={styles.speedValue}>{speed.toFixed(1)}x</span>
      </div>
    </div>
  )
}

export default StepControls
