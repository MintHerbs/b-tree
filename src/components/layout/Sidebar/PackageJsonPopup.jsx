import { useEffect } from 'react'
import { BookOpen, Globe } from '@phosphor-icons/react'
import ChatAvatar from '../../../features/chat/components/ChatAvatar/ChatAvatar'
import NotificationBadge from '../../effects/smoothui/components/notification-badge'
import styles from './PackageJsonPopup.module.css'

const PACKAGE_JSON_TEXT = `{
  "name": "your-degree",
  "version": "4.0.0",
  "description": "You are closer than you think.",
  "scripts": {
    "study": "stay-consistent --daily",
    "rest": "sleep 8h",
    "succeed": "npm run study && npm run rest"
  },
  "dependencies": {
    "discipline": "^1.0.0",
    "curiosity": "latest",
    "patience": "*"
  },
  "author": "You",
  "license": "MIT"
}`

function PackageJsonPopup({
  isOpen,
  onClose,
  mode,
  setMode,
  sessionId,
  unreadCount = 0,
}) {
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  return (
    <>
      {isOpen && (
        <div className={styles.overlay} onClick={() => onClose?.()}>
          <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
            <pre className={styles.code}>{PACKAGE_JSON_TEXT}</pre>
          </div>
        </div>
      )}

      <div className={styles.expandedBottom}>
        <NotificationBadge
          count={mode !== 'social' && unreadCount > 0 ? unreadCount : 0}
          max={10}
          variant="count"
          position="top-right"
          showZero={false}
        >
          <div
            className={`${styles.bottomRow} ${mode === 'social' ? styles.bottomRowActive : ''}`}
            onClick={() => setMode?.('social')}
          >
            <div className={styles.rowLeft}>
              <Globe size={18} weight="regular" />
              <span>Global</span>
            </div>
          </div>
        </NotificationBadge>

        <div
          className={`${styles.bottomRow} ${mode === 'academia' ? styles.bottomRowActive : ''}`}
          onClick={() => setMode?.('academia')}
        >
          <div className={styles.rowLeft}>
            <BookOpen size={18} weight="regular" />
            <span>Academia</span>
          </div>
        </div>

        <div className={`${styles.bottomRow} ${styles.avatarRow}`}>
          <div className={styles.rowLeft}>
            <ChatAvatar sessionId={sessionId} size={22} />
            <span>{sessionId}</span>
          </div>
        </div>
      </div>
    </>
  )
}

export default PackageJsonPopup
