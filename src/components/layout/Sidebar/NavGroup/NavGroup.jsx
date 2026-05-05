/**
 * NavGroup - Collapsible navigation group with animated children
 * 
 * Renders a primary NavGroupIcon that toggles open/closed state.
 * Children (NavChildIcon components) animate in/out with spring physics.
 * Only receives pointer events when open.
 * 
 * @param {Object} props
 * @param {string} props.id - Unique identifier for this group ('database' | 'logic')
 * @param {React.ReactNode} props.icon - Icon to display (Lucide icon or SVG img)
 * @param {string} props.label - Tooltip label for the group icon
 * @param {boolean} props.isOpen - Whether the group is currently expanded
 * @param {Function} props.onToggle - Callback when group icon is clicked
 * @param {React.ReactNode} props.children - NavChildIcon components to render when open
 */
import { motion } from 'motion/react'
import NavGroupIcon from '../NavGroupIcon/NavGroupIcon'
import styles from './NavGroup.module.css'

export default function NavGroup({
  id,
  icon,
  label,
  isOpen,
  onToggle,
  children
}) {
  return (
    <div className={styles.groupContainer}>
      {/* Primary group icon */}
      <NavGroupIcon
        icon={icon}
        label={label}
        isOpen={isOpen}
        onClick={onToggle}
      />

      {/* Animated children container */}
      <motion.div
        className={styles.childrenContainer}
        initial={false}
        animate={isOpen ? 'open' : 'closed'}
        variants={{
          open: { 
            height: 'auto', 
            opacity: 1 
          },
          closed: { 
            height: 0, 
            opacity: 0 
          }
        }}
        transition={{ 
          type: 'spring', 
          stiffness: 300, 
          damping: 25 
        }}
        style={{ 
          pointerEvents: isOpen ? 'auto' : 'none',
          overflow: 'hidden'
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}
