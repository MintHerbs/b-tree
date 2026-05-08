// Router setup - defines application routes
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useRef, useState, lazy, Suspense } from 'react'
import { usePresence } from './hooks/usePresence'
import MusicPlayer from './components/MusicPlayer/MusicPlayer'
import DynamicIsland from './components/dynamic-island'
import Sidebar from './components/layout/Sidebar'
import { ChatPanel } from './components/chat'

// Lazy load route components for code splitting
const TreePage = lazy(() => import('./pages/TreePage'))
const ERDPage = lazy(() => import('./pages/ERDPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const DisclaimerPage = lazy(() => import('./pages/DisclaimerPage'))
const LogicalEquivalencePage = lazy(() => import('./pages/logic/LogicalEquivalencePage'))
const TableauxPage = lazy(() => import('./pages/logic/TableauxPage'))

function App() {
  const { onlineCount } = usePresence()
  const musicPlayerRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [aiState, setAIState] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [activeChild, setActiveChild] = useState('btree')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const sessionId = localStorage.getItem('session_id') || 'anonymous'

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
    <BrowserRouter>
      <MusicPlayer ref={musicPlayerRef} />
      <DynamicIsland
        onlineCount={onlineCount}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        aiState={aiState}
        errorMessage={errorMessage}
      />
      {/* Global sidebar - persists across all routes */}
      <Sidebar
        defaultOpenGroup="database"
        activeChild={activeChild}
        onChildSelect={setActiveChild}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
      />
      {/* Global chat panel */}
      <ChatPanel 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        sessionId={sessionId}
      />
      <Suspense fallback={null}>
        <Routes>
          {/* Default route redirects to /tree */}
          <Route path="/" element={<Navigate to="/tree" replace />} />
          <Route path="/tree" element={<TreePage onAIStateChange={setAIState} onChatOpen={() => setIsChatOpen(true)} />} />
          <Route path="/erd" element={<ERDPage onAIStateChange={setAIState} onChatOpen={() => setIsChatOpen(true)} />} />
          <Route path="/logic/proof" element={<LogicalEquivalencePage onAIStateChange={setAIState} onChatOpen={() => setIsChatOpen(true)} />} />
          <Route path="/logic/tableaux" element={<TableauxPage onAIStateChange={setAIState} onChatOpen={() => setIsChatOpen(true)} />} />
          <Route path="/about" element={<AboutPage onChatOpen={() => setIsChatOpen(true)} />} />
          <Route path="/disclaimer" element={<DisclaimerPage onChatOpen={() => setIsChatOpen(true)} />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
