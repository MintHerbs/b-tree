/**
 * Sidebar — Minimalist always-visible navigation with mode switching.
 * Two modes: Academia (tools) and Social (chat/feed).
 * Active tool has a left accent bar. Tooltips on hover.
 */
import { memo, useCallback, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  TreeStructure,      // B+ Tree
  Database,           // ERD
  ChartLineUp,        // Code Complexity
  GitBranch,          // Logical Equivalence
  Table,              // Semantic Tableaux
  ArrowSquareOut,     // External link / CPA Calculator
  Calculator,         // CPA Calculator
  Sparkle,            // Min Max
  ChatCircle,         // Chat / Social
  House,              // Home feed
  Globe,              // Social mode switch
  BookOpen,           // Academia mode switch
} from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import ChatAvatar from '../../../features/chat/components/ChatAvatar/ChatAvatar'
import NotificationBadge from '../../effects/smoothui/components/notification-badge'
import { colors } from '../../../constants/colors'
import styles from './Sidebar.module.css'

import moonLogo from '../../../img/moon.svg'

// ── Single icon button ──────────────────────────────────────────────────────

function SidebarIcon({ lucideIcon, tooltip, isActive, activeColor = colors.iconActive, onClick }) {
  return (
    <div className={styles.iconWrapper} onClick={onClick} title={tooltip}>
      {isActive && <span className={styles.activeBar} style={{ background: activeColor }} />}
      <div className={`${styles.iconInner} ${isActive ? styles.iconActive : ''}`}
        style={{ '--hover-color': activeColor }}>
        <span style={{ color: isActive ? activeColor : colors.iconOff, display: 'flex' }}>
          {lucideIcon}
        </span>
      </div>
      <span className={styles.tooltip}>{tooltip}</span>
    </div>
  )
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
  const [mode, setMode] = useState('academia')

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

  // ── Academia Icons ──────────────────────────────────────────────────────────

  function AcademiaIcons() {
    return (
      <>
        {/* ── Database ── */}
        <SidebarIcon
          lucideIcon={<TreeStructure size={20} weight="regular" />}
          tooltip="B+ Tree"
          isActive={path === '/tree'}
          activeColor={colors.iconActive}
          onClick={() => go('/tree', 'btree')}
        />
        <SidebarIcon
          lucideIcon={<Database size={20} weight="regular" />}
          tooltip="ER Diagram"
          isActive={path === '/erd'}
          activeColor={colors.iconActive}
          onClick={() => go('/erd', 'erd')}
        />

        <Divider />

        {/* ── Algorithms ── */}
        <SidebarIcon
          lucideIcon={<ChartLineUp size={20} weight="regular" />}
          tooltip="Complexity"
          isActive={path === '/algo/complexity'}
          activeColor={colors.iconActive}
          onClick={() => go('/algo/complexity', 'complexity')}
        />
        <SidebarIcon
          lucideIcon={<ChartLineUp size={20} weight="regular" />}
          tooltip="Recurrence Relation"
          isActive={path === '/algo/recurrence'}
          activeColor={colors.iconActive}
          onClick={() => go('/algo/recurrence', 'recurrence')}
        />

        <Divider />

        {/* ── Logic ── */}
        <SidebarIcon
          lucideIcon={<GitBranch size={20} weight="regular" />}
          tooltip="Logical Equivalence"
          isActive={path === '/logic/proof'}
          activeColor={colors.iconActive}
          onClick={() => go('/logic/proof', 'proof')}
        />
        <SidebarIcon
          lucideIcon={<Table size={20} weight="regular" />}
          tooltip="Semantic Tableaux"
          isActive={path === '/logic/tableaux'}
          activeColor={colors.iconActive}
          onClick={() => go('/logic/tableaux', 'tableaux')}
        />

        <Divider />

        {/* ── External Tools ── */}
        <SidebarIcon
          lucideIcon={<Calculator size={20} weight="regular" />}
          tooltip="CPA Calculator"
          isActive={path === '/tools/cpa-calculator'}
          activeColor={colors.iconActiveAlt}
          onClick={() => go('/tools/cpa-calculator', 'cpa')}
        />
        <SidebarIcon
          lucideIcon={<Sparkle size={20} weight="regular" />}
          tooltip="Min Effort & Max Results"
          isActive={path === '/tools/lazy-grades'}
          activeColor={colors.iconActiveAlt}
          onClick={() => go('/tools/lazy-grades', 'minmax')}
        />
      </>
    )
  }

  // ── Social Icons ────────────────────────────────────────────────────────────

  function SocialIcons() {
    return (
      <>
        <NotificationBadge
          count={!isChatOpen && unreadCount > 0 ? unreadCount : 0}
          max={10}
          variant="count"
          position="top-right"
          showZero={false}
        >
          <div className={styles.iconWrapper} onClick={() => setIsChatOpen?.(p => !p)} title="Community Chat">
            {isChatOpen && <span className={styles.activeBar} style={{ background: colors.iconActive }} />}
            <div className={styles.iconInner} style={{ '--hover-color': colors.iconActive }}>
              <ChatCircle size={20} weight="regular" style={{ color: isChatOpen ? colors.iconActive : colors.iconOff }} />
            </div>
            <span className={styles.tooltip}>Community Chat</span>
          </div>
        </NotificationBadge>
        <SidebarIcon
          lucideIcon={<House size={20} weight="regular" />}
          tooltip="Home Feed"
          isActive={false}
          activeColor={colors.iconActive}
          onClick={() => alert('Coming soon — Home Feed')}
        />
      </>
    )
  }

  return (
    <aside className={styles.sidebar}>

      {/* Logo */}
      <a href="/tree" onClick={handleMoonClick} className={styles.moonLink}>
        <img src={moonLogo} alt="Home" className={styles.moonLogo} />
      </a>

      <div className={styles.nav}>
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className={styles.dynamicArea}
          >
            {mode === 'academia' && <AcademiaIcons />}
            {mode === 'social'   && <SocialIcons />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Bottom: mode switch + avatar ── */}
      <div className={styles.bottom}>
        <div className={styles.modeSwitch}>
          {/* Globe — switches to Social mode */}
          <NotificationBadge
            count={mode !== 'social' && unreadCount > 0 ? unreadCount : 0}
            max={10}
            variant="count"
            position="top-right"
            showZero={false}
          >
            <div className={styles.iconWrapper} onClick={() => setMode('social')} title="Social">
              {mode === 'social' && <span className={styles.activeBar} style={{ background: colors.iconActive }} />}
              <div className={styles.iconInner} style={{ '--hover-color': colors.iconActive }}>
                <Globe size={20} weight="regular" style={{ color: mode === 'social' ? colors.iconActive : colors.iconOff }} />
              </div>
              <span className={styles.tooltip}>Social</span>
            </div>
          </NotificationBadge>

          {/* BookOpen — switches to Academia mode */}
          <div className={styles.iconWrapper} onClick={() => setMode('academia')} title="Academia">
            {mode === 'academia' && <span className={styles.activeBar} style={{ background: colors.iconActive }} />}
            <div className={styles.iconInner} style={{ '--hover-color': colors.iconActive }}>
              <BookOpen size={20} weight="regular" style={{ color: mode === 'academia' ? colors.iconActive : colors.iconOff }} />
            </div>
            <span className={styles.tooltip}>Academia</span>
          </div>
        </div>

        <div className={styles.avatarContainer}>
          <ChatAvatar sessionId={sessionId} size={26} />
        </div>
      </div>

    </aside>
  )
}

export default memo(Sidebar)
