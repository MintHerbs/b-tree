import * as Dialog from '@radix-ui/react-dialog'
import { X } from '@phosphor-icons/react'
import MarkdownRenderer from '../markdown/MarkdownRenderer'
import styles from './PreviewModal.module.css'

export default function PreviewModal({ open, onClose, title, content }) {
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
              <MarkdownRenderer content={content} />
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
