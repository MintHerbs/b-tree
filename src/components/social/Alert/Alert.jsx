import { motion } from 'motion/react'
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'
import styles from './Alert.module.css'

const iconMap = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
}

export default function Alert({ 
  type = 'info', 
  title, 
  message, 
  onClose,
  className = ''
}) {
  const Icon = iconMap[type] || Info

  return (
    <motion.div 
      className={`${styles.alert} ${styles[type]} ${className}`}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      layout
    >
      <div className={styles.iconWrapper}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      
      <div className={styles.content}>
        {title && <div className={styles.title}>{title}</div>}
        {message && <div className={styles.message}>{message}</div>}
      </div>

      {onClose && (
        <motion.button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <X size={16} />
        </motion.button>
      )}
    </motion.div>
  )
}
