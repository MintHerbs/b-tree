// Top navigation bar - displays app name, order input, and about link
import { useNavigate, useLocation } from 'react-router-dom'
import moonLogo from '../../img/moon.svg'
import styles from './Navbar.module.css'

function Navbar({ order, onOrderChange, showNewFormula, onNewFormula, resultBadge }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isTreePage = location.pathname === '/tree'
  const isERDPage = location.pathname === '/erd'
  const isLandingPage = location.pathname === '/'

  const handleReset = () => {
    navigate('/')
  }

  const handleAboutClick = (e) => {
    e.preventDefault()
    navigate('/about')
  }

  const handleDisclaimerClick = (e) => {
    e.preventDefault()
    navigate('/disclaimer')
  }

  // On landing page, render only the Disclaimer and About links in top-right corner
  if (isLandingPage) {
    return (
      <nav className={styles.navbarLanding}>
        <a href="/disclaimer" onClick={handleDisclaimerClick} className={styles.aboutLink}>Disclaimer</a>
        <a href="/about" onClick={handleAboutClick} className={styles.aboutLink}>About</a>
      </nav>
    )
  }

  // Determine title based on page
  const title = isERDPage ? 'ER Diagram Builder' : 'B+ Tree Visualizer'

  // On tree or ERD page, render full navbar
  return (
    <nav className={styles.navbar}>
      <div className={styles.left}>
        <a 
          href="https://www.linkedin.com/in/offrian/" 
          target="_blank" 
          rel="noreferrer"
          className={styles.logoLink}
        >
          <img 
            src={moonLogo} 
            alt="Moon logo" 
            className={styles.logo}
          />
        </a>
        <h2 className={styles.title}>{title}</h2>
      </div>
      <div className={styles.right}>
        {onOrderChange && (
          <div className={styles.orderInput}>
            <label htmlFor="order">Order (t):</label>
            <input
              id="order"
              type="number"
              min="3"
              max="10"
              value={order}
              onChange={(e) => onOrderChange(parseInt(e.target.value) || 3)}
            />
          </div>
        )}
        {isTreePage && (
          <button className={styles.resetButton} onClick={handleReset}>
            Reset / New Tree
          </button>
        )}
        {resultBadge && (
          <span className={`${styles.resultBadge} ${styles[resultBadge.toLowerCase()]}`}>
            {resultBadge}
          </span>
        )}
        {showNewFormula && (
          <button className={styles.resetButton} onClick={onNewFormula}>
            ← New Formula
          </button>
        )}
        <a href="/disclaimer" onClick={handleDisclaimerClick} className={styles.aboutLink}>Disclaimer</a>
        <a href="/about" onClick={handleAboutClick} className={styles.aboutLink}>About</a>
      </div>
    </nav>
  )
}

export default Navbar
