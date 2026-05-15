import { motion } from 'motion/react'
import styles from './Badge.module.css'

export default function Badge({ 
  children, 
  variant = 'default',
  size = 'md',
  pulse = false,
  className = ''
}) {
  return (
    <motion.span 
      className={`${styles.badge} ${styles[variant]} ${styles[size]} ${className}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ 
        type: 'spring',
        stiffness: 500,
        damping: 25
      }}
      whileHover={{ scale: 1.1 }}
    >
      {pulse && <span className={styles.pulse} />}
      {children}
    </motion.span>
  )
}

// Dot Badge for notifications
export function DotBadge({ variant = 'primary', pulse = true, className = '' }) {
  return (
    <motion.span 
      className={`${styles.dot} ${styles[variant]} ${className}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ 
        type: 'spring',
        stiffness: 500,
        damping: 25
      }}
    >
      {pulse && <span className={styles.pulse} />}
    </motion.span>
  )
}
