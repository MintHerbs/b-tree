// Chat input with pill-shaped textarea and send button
import { useState, useRef, useEffect } from 'react'
import sendIcon from '../../../../img/social/send.svg'
import styles from './ChatInput.module.css'

const MAX_WORDS = 500
const RATE_LIMIT_MESSAGES = 3
const RATE_LIMIT_WINDOW_MS = 5000 // 5 seconds

export default function ChatInput({ onSend }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)
  const messageTimes = useRef([]) // Track message timestamps for rate limiting

  // Auto-resize on mount and value change
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 22 * 8) + 'px'
  }, [value])

  // Count words in text
  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  // Check if rate limit is exceeded
  const isRateLimited = () => {
    const now = Date.now()
    // Remove timestamps older than the window
    messageTimes.current = messageTimes.current.filter(
      time => now - time < RATE_LIMIT_WINDOW_MS
    )
    return messageTimes.current.length >= RATE_LIMIT_MESSAGES
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    const content = value.trim()
    if (!content) return

    // Check rate limit
    if (isRateLimited()) {
      // Silently ignore - no error message
      return
    }

    // Record message time
    messageTimes.current.push(Date.now())

    onSend(content)
    setValue('')
    // Reset textarea height and overflow
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.overflowY = 'hidden'
    }
  }

  const handleChange = (e) => {
    const newValue = e.target.value
    
    // Check word count - silently prevent typing beyond limit
    const wordCount = countWords(newValue)
    if (wordCount > MAX_WORDS) {
      // Don't update value - silently ignore
      return
    }

    setValue(newValue)
    // Auto-resize textarea
    const el = textareaRef.current
    if (!el) return
    
    el.style.height = 'auto'
    const lineHeight = 22
    const maxLines = 8
    const maxHeight = lineHeight * maxLines
    const newHeight = Math.min(el.scrollHeight, maxHeight)
    
    el.style.height = newHeight + 'px'
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }

  return (
    <div className={styles.container}>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        rows={1}
      />
      <div className={styles.bottomRow}>
        {value.length > 0 && (
          <button
            className={styles.sendButton}
            onClick={handleSend}
            aria-label="Send message"
            type="button"
          >
            <img src={sendIcon} alt="Send" style={{ width: '16px', height: '16px' }} />
          </button>
        )}
      </div>
    </div>
  )
}
