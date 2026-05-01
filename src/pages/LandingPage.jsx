// Initial input screen - centered layout with InputBox for entering initial tree values
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar/Navbar'
import InputBox from '../components/InputBox/InputBox'
import styles from './LandingPage.module.css'

function LandingPage() {
  const [order, setOrder] = useState(3)
  const navigate = useNavigate()

  const handleBuildTree = (values) => {
    // Navigate to tree page with values and order
    navigate('/tree', { state: { values, order } })
  }

  return (
    <div className={styles.container}>
      <Navbar order={order} onOrderChange={setOrder} />
      <div className={styles.content}>
        <h1 className={styles.heading}>B+ Tree Visualizer</h1>
        <p className={styles.subtitle}>
          Watch your B+ tree build step-by-step with animated visualizations
        </p>
        <InputBox onSubmit={handleBuildTree} />
      </div>
    </div>
  )
}

export default LandingPage
