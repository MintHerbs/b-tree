// Router setup - defines application routes
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import TreePage from './pages/TreePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/tree" element={<TreePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
