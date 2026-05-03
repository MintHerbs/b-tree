// Router setup - defines application routes
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useRef, useState } from 'react'
import LandingPage from './pages/LandingPage'
import TreePage from './pages/TreePage'
import ERDPage from './pages/ERDPage'
import AboutPage from './pages/AboutPage'
import DisclaimerPage from './pages/DisclaimerPage'
import { usePresence } from './hooks/usePresence'
import MusicPlayer from './components/MusicPlayer/MusicPlayer'
import DynamicIsland from './components/DynamicIsland/DynamicIsland'

function App() {
  const { onlineCount } = usePresence()
  const musicPlayerRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlayPause = () => {
    if (isPlaying) {
      musicPlayerRef.current?.pause()
    } else {
      musicPlayerRef.current?.play()
    }
    setIsPlaying(prev => !prev)
  }

  return (
    <BrowserRouter>
      <MusicPlayer ref={musicPlayerRef} />
      <DynamicIsland
        onlineCount={onlineCount}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/tree" element={<TreePage />} />
        <Route path="/erd" element={<ERDPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/disclaimer" element={<DisclaimerPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
