// Large heading and subtitle that updates based on active tool
import { useState, useEffect } from 'react'
import { ScrambleText } from '../animated-text'
import styles from './HeroText.module.css'

const CONTENT = {
  btree: {
    title: 'B+ Tree Visualizer'
  },
  erd: {
    title: 'ER Diagram Builder',
    subtitle: 'Copy paste your question here'
  }
}

function HeroText({ activeTool, order, onOrderChange }) {
  const [isVisible, setIsVisible] = useState(true)
  const [content, setContent] = useState(CONTENT[activeTool])

  useEffect(() => {
    // Fade out
    setIsVisible(false)

    // Wait for fade out, then update content and fade in
    const timer = setTimeout(() => {
      setContent(CONTENT[activeTool])
      setIsVisible(true)
    }, 200)

    return () => clearTimeout(timer)
  }, [activeTool])

  const handleOrderFocus = (e) => {
    // Auto-select the number on focus
    e.target.select()
  }

  const handleOrderClick = (e) => {
    // Auto-select the number on click
    e.target.select()
  }

  const handleOrderKeyDown = (e) => {
    // Allow: backspace, delete, tab, escape, enter
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(e.key)) {
      return
    }

    // Allow: arrow keys
    if (e.key.startsWith('Arrow')) {
      return
    }

    // Block non-digit keys
    if (!/^\d$/.test(e.key)) {
      e.preventDefault()
      return
    }

    // If the input is fully selected and user types a digit, replace it
    const input = e.target
    if (input.selectionStart === 0 && input.selectionEnd === input.value.length) {
      e.preventDefault()
      const newValue = parseInt(e.key)
      if (newValue >= 2 && newValue <= 10) {
        onOrderChange(newValue)
      }
    }
  }

  const handleOrderChange = (e) => {
    const value = parseInt(e.target.value)
    if (!isNaN(value)) {
      onOrderChange(value)
    } else if (e.target.value === '') {
      // Allow empty temporarily
      onOrderChange('')
    }
  }

  const handleOrderBlur = (e) => {
    const value = parseInt(e.target.value)
    // Reset to valid range if invalid
    if (isNaN(value) || value < 3) {
      onOrderChange(3)
    } else if (value > 10) {
      onOrderChange(10)
    }
  }

  // Determine if order is invalid (below 3)
  const isInvalid = order < 3

  return (
    <div className={styles.container}>
      <h1 className={`${styles.title} ${isVisible ? styles.fadeIn : styles.fadeOut}`}>
        <ScrambleText key={activeTool} duration={500} speed={80} skipInitialAnimation={true}>
          {content.title}
        </ScrambleText>
      </h1>
      <p className={`${styles.subtitle} ${isVisible ? styles.fadeIn : styles.fadeOut}`}>
        {activeTool === 'btree' ? (
          <>
            <ScrambleText key={`${activeTool}-subtitle`} duration={500} speed={80} skipInitialAnimation={true}>
              insert your values separated by a comma
            </ScrambleText>
            {' | '}
            <span className={styles.orderLabel}>order:</span>{' '}
            <span className={`${styles.orderBox} ${isInvalid ? styles.orderBoxError : ''}`}>
              <input
                type="number"
                min="3"
                max="10"
                value={order}
                onChange={handleOrderChange}
                onBlur={handleOrderBlur}
                onFocus={handleOrderFocus}
                onClick={handleOrderClick}
                onKeyDown={handleOrderKeyDown}
                className={styles.orderInput}
              />
            </span>
          </>
        ) : (
          <ScrambleText key={`${activeTool}-subtitle`} duration={500} speed={80} skipInitialAnimation={true}>
            {content.subtitle}
          </ScrambleText>
        )}
      </p>
    </div>
  )
}

export default HeroText
