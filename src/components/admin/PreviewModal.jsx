import { useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from '@phosphor-icons/react'
import MarkdownRenderer from '../markdown/MarkdownRenderer'
import { patchDraftUrls } from '../../lib/draftDB'
import styles from './PreviewModal.module.css'

export default function PreviewModal({ open, onClose, title, content }) {
  const [patchedContent, setPatchedContent] = useState('')
  const cleanupRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function patch() {
      if (!open) return

      if (cleanupRef.current) {
        cleanupRef.current()
      }

      const { patched, cleanup } = await patchDraftUrls(content || '')

      if (cancelled) {
        cleanup?.()
        return
      }

      setPatchedContent(patched)
      cleanupRef.current = cleanup
    }

    if (open) {
      patch()
    }

    return () => {
      cancelled = true
      cleanupRef.current?.()
      cleanupRef.current = null
    }
  }, [open, content])

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content}>
          <Dialog.Title className={styles.dialogTitle}>
            {title || 'Preview'}
          </Dialog.Title>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close preview">
            <X size={20} weight="bold" />
          </button>
          
          <div className={styles.scrollContainer}>
            <div className={styles.documentContainer}>
              {title && <h1 className={styles.documentTitle}>{title}</h1>}
              <MarkdownRenderer content={patchedContent} />
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
