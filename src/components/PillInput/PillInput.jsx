// Pill-shaped text input with conditional send button
import { useState } from 'react'
import styles from './PillInput.module.css'

function PillInput({ activeTool, onSubmit }) {
  const [value, setValue] = useState('')

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

  return (
    <div className={styles.container}>
      <input
        type="text"
        className={styles.input}
        placeholder="banana, 67, 69, cabbage, moon..."
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
