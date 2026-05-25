import { colors } from '../../constants/colors'
import styles from './DraftStatusIndicator.module.css'

export default function DraftStatusIndicator({
  unsaved = false,
  saving = false,
  justPublished = false
}) {
  let text = '✓ Draft saved'
  let color = colors.textMuted
  let extraClassName = ''

  if (justPublished) {
    text = '☁ Published'
    color = colors.success
    extraClassName = styles.published
  } else if (saving) {
    text = '↑ Publishing…'
    color = colors.textMuted
  } else if (unsaved) {
    text = '● Unsaved'
    color = colors.orange
  }

  return (
    <span className={`${styles.label} ${extraClassName}`} style={{ color }}>
      {text}
    </span>
  )
}
