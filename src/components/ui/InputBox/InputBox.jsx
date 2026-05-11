// Centered Claude-style input box for entering initial tree values
import { useState } from 'react'
import styles from './InputBox.module.css'

function InputBox({ onSubmit }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    // Parse and validate values
    const values = input
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0)

    // Validation: minimum 2 values
    if (values.length < 2) {
      setError('Please enter at least 2 values')
      return
    }

    // Deduplicate values (case-insensitive)
    const uniqueValues = []
    const seen = new Set()
    
    for (const value of values) {
      const normalized = String(value).toLowerCase()
      if (!seen.has(normalized)) {
        seen.add(normalized)
        uniqueValues.push(value)
      }
    }

    // Check if we still have at least 2 unique values
    if (uniqueValues.length < 2) {
      setError('Please enter at least 2 unique values')
      return
    }

    setError('')
    onSubmit(uniqueValues)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit()
    }
  }

  return (
    <div className={styles.container}>
      <textarea
        className={styles.textarea}
        placeholder="e.g.  42, 7, banana, 15, dragon, 3"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyPress}
        rows={4}
      />
      {error && <div className={styles.error}>{error}</div>}
      <button className={styles.button} onClick={handleSubmit}>
        Build Tree →
      </button>
    </div>
  )
}

export default InputBox
