import { useEffect, useRef, useState } from 'react'
import { RippleButton, RippleButtonRipples } from '@/components/animate-ui/primitives/buttons/ripple'
import styles from './TitleModal.module.css'

export default function TitleModal({ open, onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const submitWithTitle = () => {
    const cleanTitle = title.trim()
    onSubmit?.(cleanTitle ? cleanTitle : null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    submitWithTitle()
  }

  return (
    <div className={styles.overlay} onClick={() => onClose?.()}>
      <div className={styles.backdrop} />

      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <div className={styles.heading}>Add a title?</div>
        <div className={styles.subtext}>Optional — gives your post context</div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title..."
            maxLength={100}
          />

          <div className={styles.actions}>
            <RippleButton className={styles.primaryBtn} type="submit">
              Add title
              <RippleButtonRipples />
            </RippleButton>
            <RippleButton className={styles.ghostBtn} type="button" onClick={() => onSubmit?.(null)}>
              Skip & post
              <RippleButtonRipples />
            </RippleButton>
          </div>
        </form>
      </div>
    </div>
  )
}
