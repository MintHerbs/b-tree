// Router setup - defines application routes
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useRef, useState, lazy, Suspense } from 'react'
import { usePresence } from './hooks/usePresence'
import MusicPlayer from './components/MusicPlayer/MusicPlayer'
import DynamicIsland from './components/dynamic-island'
import Sidebar from './components/layout/Sidebar'

// Lazy load route components for code splitting
const TreePage = lazy(() => import('./pages/TreePage'))
const ERDPage = lazy(() => import('./pages/ERDPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const DisclaimerPage = lazy(() => import('./pages/DisclaimerPage'))
const TranslatePage = lazy(() => import('./pages/logic/TranslatePage'))
const LogicalEquivalencePage = lazy(() => import('./pages/logic/LogicalEquivalencePage'))
const TableauxPage = lazy(() => import('./pages/logic/TableauxPage'))
const ResolutionPage = lazy(() => import('./pages/logic/ResolutionPage'))

function App() {
  const { onlineCount } = usePresence()
  const musicPlayerRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [aiState, setAIState] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [activeChild, setActiveChild] = useState('btree')

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
      />
      <Suspense fallback={null}>
        <Routes>
          {/* Default route redirects to /tree */}
          <Route path="/" element={<Navigate to="/tree" replace />} />
          <Route path="/tree" element={<TreePage onAIStateChange={setAIState} />} />
          <Route path="/erd" element={<ERDPage onAIStateChange={setAIState} />} />
          <Route path="/logic/translate" element={<TranslatePage onAIStateChange={setAIState} />} />
          <Route path="/logic/proof" element={<LogicalEquivalencePage onAIStateChange={setAIState} />} />
          <Route path="/logic/tableaux" element={<TableauxPage onAIStateChange={setAIState} />} />
          <Route path="/logic/resolution" element={<ResolutionPage onAIStateChange={setAIState} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/disclaimer" element={<DisclaimerPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
