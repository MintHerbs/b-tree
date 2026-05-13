/**
 * Sidebar — collapsed activity bar OR expanded side panel.
 *
 * Module definitions live in modules.js; CollapsedView and ExpandedView
 * both read from that single source so they cannot drift in content.
 */
import { memo, useCallback, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './Sidebar.module.css'
import CollapsedView from './CollapsedView'
import ExpandedView from './ExpandedView'

function Sidebar({ activeChild, onChildSelect, isChatOpen, setIsChatOpen, unreadCount = 0 }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const sessionId = localStorage.getItem('session_id') || 'anonymous'
  const [mode, setMode] = useState('academia')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPackageJsonOpen, setIsPackageJsonOpen] = useState(false)

  const path = location.pathname

  const go = useCallback((route, childId) => {
    setIsChatOpen?.(false)
    onChildSelect?.(childId)
    navigate(route)
  }, [navigate, onChildSelect, setIsChatOpen])

  useEffect(() => {
    if (!isExpanded) setIsPackageJsonOpen(false)
  }, [isExpanded])

  useEffect(() => {
    if (mode !== 'academia') setIsExpanded(false)
  }, [mode])

  return (
    <aside
      className={`${styles.sidebar} ${isExpanded ? styles.sidebarExpanded : ''}`}
      onMouseEnter={() => {
        if (mode === 'academia') setIsExpanded(true)
      }}
      onMouseLeave={() => {
        if (mode === 'academia') setIsExpanded(false)
      }}
      style={{ width: mode === 'academia' && isExpanded ? '240px' : '56px' }}
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
        />
      )}
    </aside>
  )
}

export default memo(Sidebar)
