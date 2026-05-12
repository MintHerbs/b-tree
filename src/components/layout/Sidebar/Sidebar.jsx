/**
 * Sidebar — Minimalist always-visible navigation with mode switching.
 * Two modes: Academia (tools) and Social (chat/feed).
 * Active tool has a left accent bar. Tooltips on hover.
 */
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
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

  const defaultOpen = useMemo(() => {
    if (path === '/tree' || path === '/erd') return ['database']
    if (path.startsWith('/algo')) return ['algorithms']
    if (path.startsWith('/logic')) return ['artificial-intelligence']
    return []
  }, [path])

  const activeModule = useMemo(() => {
    if (path.startsWith('/notes/')) return 'notes'
    return defaultOpen[0] ?? 'database'
  }, [defaultOpen, path])

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
          defaultOpen={defaultOpen}
          go={go}
          activeChild={activeChild}
          onChildSelect={onChildSelect}
          isChatOpen={isChatOpen}
          setIsChatOpen={setIsChatOpen}
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
          activeModule={activeModule}
        />
      )}
    </aside>
  )
}

export default memo(Sidebar)
