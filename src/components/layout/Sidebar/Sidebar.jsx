/**
 * Sidebar — collapsed activity bar OR expanded side panel.
 *
 * Module definitions live in modules.js; CollapsedView and ExpandedView
 * both read from that single source so they cannot drift in content.
 */
import { memo, useCallback, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './Sidebar.module.css'
import CollapsedView from './CollapsedView/CollapsedView'
import ExpandedView from './ExpandedView/ExpandedView'

function Sidebar({ activeChild, onChildSelect, isChatOpen, setIsChatOpen, unreadCount = 0 }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const sessionId = localStorage.getItem('session_id') || 'anonymous'
  const [mode, setMode] = useState('academia')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPackageJsonOpen, setIsPackageJsonOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const path = location.pathname

  const go = useCallback((route, childId) => {
    setIsChatOpen?.(false)
    onChildSelect?.(childId)
    navigate(route)
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setIsExpanded(false)
    }
  }, [navigate, onChildSelect, setIsChatOpen, isMobile])

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 968)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!isExpanded) setIsPackageJsonOpen(false)
  }, [isExpanded])

  useEffect(() => {
    if (mode !== 'academia') setIsExpanded(false)
  }, [mode])

  const handleMouseEnter = () => {
    if (mode === 'academia' && !isMobile) {
      setIsExpanded(true)
    }
  }

  const handleMouseLeave = () => {
    if (mode === 'academia' && !isMobile) {
      setIsExpanded(false)
    }
  }

  const handleOverlayClick = (e) => {
    if (isMobile && isExpanded && e.target === e.currentTarget) {
      setIsExpanded(false)
    }
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isExpanded && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(2px)',
            zIndex: 59
          }}
          onClick={handleOverlayClick}
        />
      )}

      {/* Mobile hamburger toggle */}
      {isMobile && (
        <button
          type="button"
          className={styles.hamburgerButton}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Close navigation' : 'Open navigation'}
          aria-expanded={isExpanded}
        >
          <span className={styles.hamburgerBars} />
        </button>
      )}

      <aside
        className={`${styles.sidebar} ${isExpanded ? styles.sidebarExpanded : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ width: mode === 'academia' && isExpanded ? (isMobile ? '280px' : '240px') : '56px' }}
      >
        {mode === 'academia' && isExpanded ? (
          <ExpandedView
            path={path}
            go={go}
            isPackageJsonOpen={isPackageJsonOpen}
            onOpenPackageJson={() => setIsPackageJsonOpen(true)}
            onClosePackageJson={() => setIsPackageJsonOpen(false)}
            mode={mode}
            setMode={setMode}
            sessionId={sessionId}
            unreadCount={unreadCount}
          />
        ) : (
          <CollapsedView
            path={path}
            go={go}
            activeChild={activeChild}
            onChildSelect={onChildSelect}
            isChatOpen={isChatOpen}
            setIsChatOpen={setIsChatOpen}
            unreadCount={unreadCount}
            mode={mode}
            setMode={setMode}
            sessionId={sessionId}
            onOpenPackageJson={() => setIsPackageJsonOpen(true)}
            setIsExpanded={setIsExpanded}
          />
        )}
      </aside>
    </>
  )
}

export default memo(Sidebar)
