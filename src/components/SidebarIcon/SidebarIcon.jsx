// RETIRED — replaced by NavChildIcon
// Single icon slot with hover tooltip and on/off SVG swap
import { useState } from 'react'
import styles from './SidebarIcon.module.css'

function SidebarIcon({ iconOff, iconOn, tooltip, isActive, onClick }) {
  const [isHovered, setIsHovered] = useState(false)

  // Show "on" icon when active or hovered
  const currentIcon = isActive || isHovered ? iconOn : iconOff
  
  // Determine opacity: full when active or hovered, reduced otherwise
  const opacity = isActive || isHovered ? 1.0 : 0.5

  return (
    <div 
      className={styles.iconContainer}
      style={{ opacity }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Icon image */}
      <img 
        src={currentIcon} 
        alt={tooltip}
        className={styles.icon}
      />
      
      {/* Tooltip - only show on hover */}
      {isHovered && (
        <div className={styles.tooltip}>
          {tooltip}
        </div>
      )}
    </div>
  )
}

export default SidebarIcon
