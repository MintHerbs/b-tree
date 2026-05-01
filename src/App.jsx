// Router setup - defines application routes
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import TreePage from './pages/TreePage'
import ERDPage from './pages/ERDPage'
import AboutPage from './pages/AboutPage'
import DisclaimerPage from './pages/DisclaimerPage'

function App() {
  return (
    <BrowserRouter>
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
