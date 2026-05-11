/**
 * NotesModal — Displays markdown notes in a modal overlay.
 * Used for viewing .md files from the sidebar file tree.
 */
import { useEffect } from 'react'
import styles from './NotesModal.module.css'

function NotesModal({ isOpen, onClose, title, content }) {
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

  // Simple markdown parser for headings, blockquotes, and regular text
  const renderMarkdown = (text) => {
    if (!text) return null
    
    const lines = text.split('\n')
    return lines.map((line, index) => {
      // Headings
      if (line.startsWith('# ')) {
        return <h1 key={index} className={styles.heading1}>{line.slice(2)}</h1>
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className={styles.heading2}>{line.slice(3)}</h2>
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className={styles.heading3}>{line.slice(4)}</h3>
      }
      
      // Blockquotes
      if (line.startsWith('> ')) {
        return <blockquote key={index} className={styles.blockquote}>{line.slice(2)}</blockquote>
      }
      
      // Empty lines
      if (line.trim() === '') {
        return <br key={index} />
      }
      
      // Regular text
      return <p key={index} className={styles.paragraph}>{line}</p>
    })
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.content}>
          {renderMarkdown(content)}
        </div>
      </div>
    </div>
  )
}

export default NotesModal
