// ERD Step 2 - Show generated prompt with copy button
import { useState } from 'react'
import styles from './ERDStep2.module.css'

function ERDStep2({ prompt, onNext }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className={styles.container}>
      <p className={styles.instruction}>
        Copy the prompt below and paste it into ChatGPT, Claude, Gemini, or any LLM.
        Then copy the JSON it returns and paste it in the next step.
      </p>

      <div className={styles.codeBlock}>
        <div className={styles.codeHeader}>
          <span className={styles.codeLabel}>PROMPT</span>
          <button className={styles.copyButton} onClick={handleCopy}>
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
        </div>
        <pre className={styles.codeContent}>{prompt}</pre>
      </div>

      <div className={styles.buttons}>
        <button className={styles.nextButton} onClick={onNext}>
          Next: paste the JSON →
        </button>
      </div>
    </div>
  )
}

export default ERDStep2
