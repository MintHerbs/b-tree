import * as Dialog from '@radix-ui/react-dialog'
import { X } from '@phosphor-icons/react'
import NoteReader from '../markdown/NoteReader'
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

          <NoteReader content={content} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
