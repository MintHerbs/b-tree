import { colors } from '../../constants/colors'
import styles from './DraftStatusIndicator.module.css'

const STATUS_MAP = {
  unsaved: { text: '● Unsaved', color: colors.orange },
  saving: { text: '↑ Saving...', color: colors.textMuted },
  saved: { text: '✓ Draft saved', color: colors.success },
  failed: { text: '⚠ Save failed', color: colors.error },
}

export default function DraftStatusIndicator({
  saveStatus = 'saved',
  justPublished = false,
}) {
  // Publishing to GitHub still overrides the draft status (existing behaviour).
  if (justPublished) {
    return (
      <span className={`${styles.label} ${styles.published}`} style={{ color: colors.success }}>
        ☁ Published
      </span>
    )
  }

  const { text, color } = STATUS_MAP[saveStatus] ?? STATUS_MAP.saved

  return (
    <span className={styles.label} style={{ color }}>
      {text}
    </span>
  )
}
