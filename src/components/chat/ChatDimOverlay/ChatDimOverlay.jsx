// Overlay that dims starfield and hides page content when chat is open
import styles from './ChatDimOverlay.module.css'

function ChatDimOverlay() {
  return <div className={styles.overlay} />
}

export default ChatDimOverlay
