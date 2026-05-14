import { memo, useCallback } from 'react'
import {
  Brain,
  BookOpen,
  ChartLineUp,
  ChatCircle,
  Database,
  FileText,
  Function as FunctionIcon,
  Globe,
  HardDrive,
  House,
} from '@phosphor-icons/react'
import ChatAvatar from '../../../features/chat/components/ChatAvatar/ChatAvatar'
import NotificationBadge from '../../effects/smoothui/components/notification-badge'
import { colors } from '../../../constants/colors'
import styles from './Sidebar.module.css'
import moonLogo from '../../../img/moon.svg'

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

function CollapsedView({
  path,
  go,
  isChatOpen,
  setIsChatOpen,
  unreadCount = 0,
  mode,
  setMode,
  sessionId,
  activeModule,
}) {
  const handleMoonClick = useCallback((e) => {
    e.preventDefault()
    go('/tree', 'btree')
  }, [go])

  const mainIcon =
    activeModule === 'algorithms' ? <ChartLineUp size={20} weight="regular" /> :
    activeModule === 'artificial-intelligence' ? <Brain size={20} weight="regular" /> :
    activeModule === 'operating-systems' ? <HardDrive size={20} weight="regular" /> :
    activeModule === 'computational-math' ? <FunctionIcon size={20} weight="regular" /> :
    activeModule === 'notes' ? <FileText size={20} weight="regular" /> :
    <Database size={20} weight="regular" />

  const mainTooltip =
    activeModule === 'algorithms' ? 'Algorithms' :
    activeModule === 'artificial-intelligence' ? 'Artificial Intelligence' :
    activeModule === 'operating-systems' ? 'Operating Systems' :
    activeModule === 'computational-math' ? 'Computational Math' :
    activeModule === 'notes' ? 'Notes' :
    'Database'

  const mainOnClick = () => {
    if (activeModule === 'algorithms') return go('/algo/code-complexity', 'complexity')
    if (activeModule === 'artificial-intelligence') return go('/logic/truth-tree', 'truth-tree')
    if (activeModule === 'notes') return go(path, 'notes')
    return go('/tree', 'btree')
  }

  return (
    <>
      <a href="/tree" onClick={handleMoonClick} className={styles.moonLink}>
        <img src={moonLogo} alt="Home" className={styles.moonLogo} />
      </a>

      <div className={styles.nav}>
        {mode === 'social' ? (
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
              isActive={path.startsWith('/social/feed')}
              activeColor={colors.iconActive}
              onClick={() => go('/social/feed', 'social-feed')}
            />
          </>
        ) : (
          <SidebarIcon
            lucideIcon={mainIcon}
            tooltip={mainTooltip}
            isActive={true}
            activeColor={colors.iconActive}
            onClick={mainOnClick}
          />
        )}
      </div>

      <div className={styles.bottom}>
        <div className={styles.modeSwitch}>
          <NotificationBadge
            count={mode !== 'social' && unreadCount > 0 ? unreadCount : 0}
            max={10}
            variant="count"
            position="top-right"
            showZero={false}
          >
            <div
              className={styles.iconWrapper}
              onClick={() => {
                setMode('social')
                go('/social/feed', 'social-feed')
              }}
              title="Social"
            >
              {mode === 'social' && <span className={styles.activeBar} style={{ background: colors.iconActive }} />}
              <div className={styles.iconInner} style={{ '--hover-color': colors.iconActive }}>
                <Globe size={20} weight="regular" style={{ color: mode === 'social' ? colors.iconActive : colors.iconOff }} />
              </div>
              <span className={styles.tooltip}>Social</span>
            </div>
          </NotificationBadge>

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
    </>
  )
}

export default memo(CollapsedView)
