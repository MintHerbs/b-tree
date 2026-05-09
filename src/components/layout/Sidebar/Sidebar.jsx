/**
 * Sidebar — Minimalist always-visible navigation.
 * No expand/collapse — all tools visible at all times.
 * Groups separated by hairline dividers with subtle category dots.
 * Active tool has a left accent bar. Tooltips on hover.
 */
import { memo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { GitBranch, Table2, Calculator, ExternalLink } from 'lucide-react'
import ChatAvatar from '../../chat/ChatAvatar/ChatAvatar'
import NotificationBadge from '../../smoothui/components/notification-badge'
import styles from './Sidebar.module.css'

import moonLogo       from '../../../img/moon.svg'
import btreeOff       from '../../../img/btree_off.svg'
import btreeOn        from '../../../img/btree_on.svg'
import erdOff         from '../../../img/erd_off.svg'
import erdOn          from '../../../img/erd_on.svg'
import complexityOff  from '../../../img/COMPLEXITY_OFF.svg'
import complexityOn   from '../../../img/COMPLEXITY_ON.svg'
import logicOff       from '../../../img/left nav/Logic_off.svg'
import logicOn        from '../../../img/left nav/Logic_on.svg'
import chatOff        from '../../../img/social/chat_off.svg'
import chatHover      from '../../../img/social/chat_hover.svg'
import chatOn         from '../../../img/social/chat_on.svg'

// ── Single icon button ──────────────────────────────────────────────────────

function SidebarIcon({ iconOff, iconOn, lucideIcon, tooltip, isActive, activeColor = '#8B5CF6', onClick }) {
  const icon = lucideIcon
    ? <span style={{ color: isActive ? activeColor : 'rgba(255,255,255,0.45)', display: 'flex' }}>{lucideIcon}</span>
    : <img src={isActive ? iconOn : iconOff} alt={tooltip} style={{ width: '20px', height: '20px', opacity: isActive ? 1 : 0.45 }} />

  return (
    <div className={styles.iconWrapper} onClick={onClick} title={tooltip}>
      {isActive && <span className={styles.activeBar} style={{ background: activeColor }} />}
      <div className={`${styles.iconInner} ${isActive ? styles.iconActive : ''}`}
        style={{ '--hover-color': activeColor }}>
        {icon}
      </div>
      <span className={styles.tooltip}>{tooltip}</span>
    </div>
  )
}

// ── Hover-sensitive icon for chat (3 states: off / hover / on) ──────────────

function ChatIcon({ isChatOpen, onClick, unreadCount }) {
  const showBadge = !isChatOpen && unreadCount > 0

  const inner = (
    <div className={styles.iconWrapper} onClick={onClick} title="Community Chat">
      {isChatOpen && <span className={styles.activeBar} style={{ background: '#8B5CF6' }} />}
      <div className={`${styles.iconInner} ${styles.chatIcon} ${isChatOpen ? styles.iconActive : ''}`}>
        <img
          src={isChatOpen ? chatOn : chatOff}
          alt="Chat"
          style={{ width: '20px', height: '20px', opacity: isChatOpen ? 1 : 0.65 }}
          className={styles.chatImgOff}
        />
        <img
          src={chatHover}
          alt="Chat"
          style={{ width: '20px', height: '20px' }}
          className={styles.chatImgHover}
        />
      </div>
      <span className={styles.tooltip}>Community Chat</span>
    </div>
  )

  if (showBadge) {
    return (
      <NotificationBadge count={unreadCount} max={10} variant="count" position="top-right" showZero={false}>
        {inner}
      </NotificationBadge>
    )
  }
  return inner
}

// ── Divider ─────────────────────────────────────────────────────────────────

function Divider() {
  return <div className={styles.divider} />
}

// ── Root Sidebar ─────────────────────────────────────────────────────────────

function Sidebar({ activeChild, onChildSelect, isChatOpen, setIsChatOpen, unreadCount = 0 }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const sessionId = localStorage.getItem('session_id') || 'anonymous'

  const path = location.pathname

  const go = useCallback((route, childId) => {
    setIsChatOpen?.(false)
    onChildSelect?.(childId)
    navigate(route)
  }, [navigate, onChildSelect, setIsChatOpen])

  const handleMoonClick = useCallback((e) => {
    e.preventDefault()
    go('/tree', 'btree')
  }, [go])

  return (
    <aside className={styles.sidebar}>

      {/* Logo */}
      <a href="/tree" onClick={handleMoonClick} className={styles.moonLink}>
        <img src={moonLogo} alt="Home" className={styles.moonLogo} />
      </a>

      <div className={styles.nav}>

        {/* ── Database ── */}
        <SidebarIcon iconOff={btreeOff}      iconOn={btreeOn}      tooltip="B+ Tree"     isActive={path === '/tree'}          onClick={() => go('/tree', 'btree')} />
        <SidebarIcon iconOff={erdOff}        iconOn={erdOn}        tooltip="ER Diagram"   isActive={path === '/erd'}           onClick={() => go('/erd',  'erd')}   />

        <Divider />

        {/* ── Algorithms ── */}
        <SidebarIcon iconOff={complexityOff} iconOn={complexityOn} tooltip="Complexity"   isActive={path === '/algo/complexity'} activeColor="#EA6C0A" onClick={() => go('/algo/complexity', 'complexity')} />

        <Divider />

        {/* ── Logic ── */}
        <SidebarIcon lucideIcon={<GitBranch size={18} />} tooltip="Logical Equivalence" isActive={path === '/logic/proof'}    activeColor="#8B5CF6" onClick={() => go('/logic/proof',    'proof')}    />
        <SidebarIcon lucideIcon={<Table2    size={18} />} tooltip="Semantic Tableaux"   isActive={path === '/logic/tableaux'} activeColor="#8B5CF6" onClick={() => go('/logic/tableaux', 'tableaux')} />

        <Divider />

        {/* ── External ── */}
        <SidebarIcon
          lucideIcon={<ExternalLink size={18} />}
          tooltip="GPA Calculator"
          isActive={false}
          activeColor="#EA6C0A"
          onClick={() => window.open('https://lazy-grades.vercel.app/', '_blank')}
        />
      </div>

      {/* ── Bottom: chat + avatar ── */}
      <div className={styles.bottom}>
        <ChatIcon isChatOpen={isChatOpen} onClick={() => setIsChatOpen?.(p => !p)} unreadCount={unreadCount} />
        <div className={styles.avatarContainer}>
          <ChatAvatar sessionId={sessionId} size={26} />
        </div>
      </div>

    </aside>
  )
}

export default memo(Sidebar)