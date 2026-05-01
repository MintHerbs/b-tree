// Top navigation bar - displays app name, order input, and about link
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './Navbar.module.css'

function Navbar({ order, onOrderChange }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isTreePage = location.pathname === '/tree'

  const handleReset = () => {
    navigate('/')
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.left}>
        <h2 className={styles.title}>B+ Tree Visualizer</h2>
      </div>
      <div className={styles.right}>
        {onOrderChange && (
          <div className={styles.orderInput}>
            <label htmlFor="order">Order (t):</label>
            <input
              id="order"
              type="number"
              min="2"
              max="10"
              value={order}
              onChange={(e) => onOrderChange(parseInt(e.target.value) || 2)}
            />
          </div>
        )}
        {isTreePage && (
          <button className={styles.resetButton} onClick={handleReset}>
            Reset / New Tree
          </button>
        )}
        <a href="#" className={styles.aboutLink}>About</a>
      </div>
    </nav>
  )
}

export default Navbar
