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

function Sidebar({ courseId = 'computer-science', activeChild, onChildSelect, isChatOpen, setIsChatOpen, unreadCount = 0 }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const sessionId = localStorage.getItem('session_id') || 'anonymous'
  const [mode, setMode] = useState('academia')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPackageJsonOpen, setIsPackageJsonOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    setLoading(true)
    import(`../../../content/notes/${courseId}/modules.js`)
      .then(mod => {
        setModules(mod.modules ?? mod.MODULES ?? [])
        setLoading(false)
      })
      .catch(() => {
        setModules([])
        setLoading(false)
      })
  }, [courseId])

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

  const handleMobileToggle = (e) => {
    if (isMobile) {
      // Check if click is on the hamburger area (top-left 56x56px)
      const rect = e.currentTarget.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top
      
      if (clickX <= 56 && clickY <= 56) {
        setIsExpanded(!isExpanded)
      }
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
      
      <aside
        className={`${styles.sidebar} ${isExpanded ? styles.sidebarExpanded : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleMobileToggle}
        style={{ width: mode === 'academia' && isExpanded ? (isMobile ? '280px' : '240px') : '56px' }}
      >
        {mode === 'academia' && isExpanded ? (
          loading ? (
            <div className={styles.skeletonList} aria-label="Loading modules">
              <div className={styles.skeletonRow} />
              <div className={styles.skeletonRow} />
              <div className={styles.skeletonRow} />
            </div>
          ) : (
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
          )
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
