// Router setup - defines application routes
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useRef, useState, lazy, Suspense, useEffect } from 'react'
import { usePresence } from './hooks/usePresence'
import useChat from './hooks/useChat'
import MusicPlayer from './components/MusicPlayer/MusicPlayer'
import DynamicIsland from './components/dynamic-island'
import Sidebar from './components/layout/Sidebar'
import Starfield from './components/Starfield/Starfield'
import { ChatPanel, ChatDimOverlay } from './components/chat'

// Lazy load route components for code splitting
const TreePage = lazy(() => import('./pages/TreePage'))
const ERDPage = lazy(() => import('./pages/ERDPage'))
const ComplexityPage = lazy(() =>
  new Promise(resolve =>
    setTimeout(() => resolve(import('./pages/ComplexityPage')), 300)
  )
)
const AboutPage = lazy(() => import('./pages/AboutPage'))
const DisclaimerPage = lazy(() => import('./pages/DisclaimerPage'))
const LogicalEquivalencePage = lazy(() => import('./pages/logic/LogicalEquivalencePage'))
const TableauxPage = lazy(() => import('./pages/logic/TableauxPage'))
const CPA  = lazy(() => import('./pages/exam/cpa'))
const Lazy = lazy(() => import('./pages/exam/lazy'))

function AppContent() {
  const location = useLocation()
  const { onlineCount } = usePresence()
  const musicPlayerRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [aiState, setAIState] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [activeChild, setActiveChild] = useState('btree')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [currentSongId, setCurrentSongId] = useState('wjJ3-SzxhCk')
  const sessionId = localStorage.getItem('session_id') || 'anonymous'
  const { unreadCount } = useChat(isChatOpen)

  const isToolsRoute = location.pathname.startsWith('/tools/')

  // Background preload pages after initial mount
  useEffect(() => {
    const preload = setTimeout(() => {
      import('./pages/TreePage')
      import('./pages/ERDPage')
      import('./pages/logic/LogicalEquivalencePage')
      import('./pages/logic/TableauxPage')
      import('./pages/ComplexityPage')
      import('./pages/exam/cpa')
      import('./pages/exam/lazy')
    }, 3000)

    return () => clearTimeout(preload)
  }, [])

  const handlePlayPause = () => {
    if (isPlaying) {
      musicPlayerRef.current?.pause()
    } else {
      musicPlayerRef.current?.play()
    }
    setIsPlaying(prev => !prev)
  }

  const handleAIStateChange = (newState, message = '') => {
    setAIState(newState)
    setErrorMessage(message)

    // Auto-reset error state after 3 seconds
    if (newState === 'error') {
      setTimeout(() => {
        setAIState('idle')
        setErrorMessage('')
      }, 3000)
    }
  }

  return (
    <>
      <Starfield />
      {isChatOpen && !isToolsRoute && <ChatDimOverlay />}
      <DynamicIsland
        onlineCount={onlineCount}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        aiState={aiState}
        errorMessage={errorMessage}
        onSongChange={setCurrentSongId}
      />
      {/* Global sidebar - persists across all routes */}
      <Sidebar
        defaultOpenGroup="database"
        activeChild={activeChild}
        onChildSelect={setActiveChild}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        unreadCount={unreadCount}
      />
      <MusicPlayer ref={musicPlayerRef} videoId={currentSongId} />

      {/* Only routes fade — nothing else */}
      <div style={{
        opacity: isChatOpen ? 0 : 1,
        pointerEvents: isChatOpen ? 'none' : 'auto',
        transition: 'opacity 0.3s ease'
      }}>
        <Suspense fallback={null}>
          <Routes>
            {/* Default route redirects to /tree */}
            <Route path="/" element={<Navigate to="/tree" replace />} />
            <Route path="/tree" element={<TreePage onAIStateChange={setAIState} onChatOpen={() => setIsChatOpen(true)} />} />
            <Route path="/erd" element={<ERDPage onAIStateChange={setAIState} onChatOpen={() => setIsChatOpen(true)} />} />
            <Route path="/algo/complexity" element={<ComplexityPage onAIStateChange={setAIState} />} />
            <Route path="/logic/proof" element={<LogicalEquivalencePage onAIStateChange={setAIState} onChatOpen={() => setIsChatOpen(true)} />} />
            <Route path="/logic/tableaux" element={<TableauxPage onAIStateChange={setAIState} onChatOpen={() => setIsChatOpen(true)} />} />
            <Route path="/about" element={<AboutPage onChatOpen={() => setIsChatOpen(true)} />} />
            <Route path="/disclaimer" element={<DisclaimerPage onChatOpen={() => setIsChatOpen(true)} />} />
            <Route path="/tools/lazy-grades"    element={<Lazy />} />
            <Route path="/tools/cpa-calculator" element={<CPA  />} />
          </Routes>
        </Suspense>
      </div>

      {/* Chat panel outside the fading wrapper */}
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        sessionId={sessionId}
      />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
