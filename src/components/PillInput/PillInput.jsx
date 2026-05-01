// Pill-shaped text input with conditional send button
import { useState, useEffect } from 'react'
import styles from './PillInput.module.css'

function PillInput({ activeTool, onSubmit, placeholder, defaultValue = '' }) {
  const [value, setValue] = useState(defaultValue)

  // Update value if defaultValue changes
  useEffect(() => {
    if (defaultValue) {
      setValue(defaultValue)
    }
  }, [defaultValue])

  const handleSubmit = () => {
    if (value.trim().length === 0) return
    
    onSubmit(value)
    setValue('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  const hasContent = value.length > 0
  
  // Use custom placeholder or default based on active tool
  const defaultPlaceholder = activeTool === 'btree' 
    ? "Frodo, Sauron, 67, Gandalf, etc..."
    : "Consider the following scenario. Draw an Entity Relationship..."
  
  const inputPlaceholder = placeholder || defaultPlaceholder

  return (
    <div className={styles.container}>
      <input
        type="text"
        className={styles.input}
        placeholder={inputPlaceholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      
      {/* Send button - only visible when input has content */}
      {hasContent && (
        <button 
          className={styles.sendButton}
          onClick={handleSubmit}
          type="button"
          aria-label="Send"
        >
          {/* Right-pointing arrow chevron */}
          <svg 
            className={styles.arrow}
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default PillInput
