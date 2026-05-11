/**
 * PackageJsonModal — Easter egg displaying a motivational package.json.
 * Syntax-highlighted JSON view with purple keys and green values.
 */
import { useEffect } from 'react'
import styles from './PackageJsonModal.module.css'

const PACKAGE_JSON_CONTENT = {
  "name": "mooner-academia",
  "version": "∞.0.0",
  "description": "Built with midnight oil and purple ambitions.",
  "scripts": {
    "study": "focus --no-distractions --music=lofi",
    "debug": "stare-at-screen --until-it-makes-sense",
    "submit": "pray --hard --before-deadline"
  },
  "motivation": "Every expert was once a beginner who refused to quit.",
  "devDependencies": {
    "coffee": "^4.0.0",
    "persistence": "latest",
    "curiosity": "*",
    "sleep": "0.0.1"
  },
  "peerDependencies": {
    "a-good-teacher": ">=1.0.0"
  }
}

function PackageJsonModal({ isOpen, onClose }) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Syntax highlight JSON
  const renderJson = (obj, indent = 0) => {
    const indentStr = '  '.repeat(indent)
    const lines = []

    lines.push(<span key={`open-${indent}`} className={styles.punctuation}>{'{\n'}</span>)

    const entries = Object.entries(obj)
    entries.forEach(([key, value], index) => {
      const isLast = index === entries.length - 1
      
      lines.push(
        <span key={`line-${indent}-${index}`}>
          <span className={styles.indent}>{indentStr}  </span>
          <span className={styles.key}>"{key}"</span>
          <span className={styles.punctuation}>: </span>
          {typeof value === 'object' && value !== null ? (
            renderJson(value, indent + 1)
          ) : typeof value === 'string' ? (
            <span className={styles.stringValue}>"{value}"</span>
          ) : (
            <span className={styles.numberValue}>{String(value)}</span>
          )}
          <span className={styles.punctuation}>{isLast ? '\n' : ',\n'}</span>
        </span>
      )
    })

    lines.push(<span key={`close-${indent}`} className={styles.punctuation}>{indentStr}{'}'}</span>)

    return lines
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>package.json</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.content}>
          <pre className={styles.codeBlock}>
            <code>
              {renderJson(PACKAGE_JSON_CONTENT)}
            </code>
          </pre>
        </div>
      </div>
    </div>
  )
}

export default PackageJsonModal
