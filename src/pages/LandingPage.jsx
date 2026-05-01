// Grok-inspired landing page with starfield background and sidebar
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Starfield from '../components/Starfield/Starfield'
import Sidebar from '../components/Sidebar/Sidebar'
import Navbar from '../components/Navbar/Navbar'
import HeroText from '../components/HeroText/HeroText'
import PillInput from '../components/PillInput/PillInput'
import styles from './LandingPage.module.css'

function LandingPage() {
  const [activeTool, setActiveTool] = useState('btree')
  const [order, setOrder] = useState(2)
  const [showToast, setShowToast] = useState(false)
  const navigate = useNavigate()

  // Handle tool switching
  const handleToolChange = (tool) => {
    if (tool === 'calculator') {
      // Open external URL without changing active state
      window.open('https://lazy-grades.vercel.app/', '_blank')
    } else {
      // Update active tool for btree or erd
      setActiveTool(tool)
    }
  }

  // Handle order change
  const handleOrderChange = (newOrder) => {
    setOrder(newOrder)
  }

  // Handle input submission
  const handleSubmit = (value) => {
    if (activeTool === 'btree') {
      // Parse CSV values
      const values = value
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0)

      // Navigate to tree page with values and order
      if (values.length >= 2) {
        navigate('/tree', { state: { values, order } })
      }
    } else if (activeTool === 'erd') {
      // Show "coming soon" toast
      setShowToast(true)
      
      // Hide toast after 2500ms
      setTimeout(() => {
        setShowToast(false)
      }, 2500)
    }
  }

  return (
    <div className={styles.landing}>
      {/* Starfield background - z-index: 0 */}
      <Starfield />
      
      {/* Sidebar - z-index: 10 */}
      <Sidebar 
        activeTool={activeTool}
        onToolChange={handleToolChange}
      />
      
      {/* Navbar - z-index: 10 */}
      <Navbar />
      
      {/* Center content - z-index: 5 */}
      <main className={styles.center}>
        <HeroText 
          activeTool={activeTool} 
          order={order}
          onOrderChange={handleOrderChange}
        />
        <PillInput activeTool={activeTool} onSubmit={handleSubmit} />
      </main>

      {/* Toast notification */}
      {showToast && (
        <div className={styles.toast}>
          ER Diagram builder coming soon!
        </div>
      )}
    </div>
  )
}

export default LandingPage
