import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import styles from './Toast.module.css'

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

export default function Toast({ 
  type = 'info', 
  message, 
  onClose,
  duration = 5000,
  position = 'top-right'
}) {
  const Icon = iconMap[type] || Info

  return (
    <motion.div 
      className={`${styles.toast} ${styles[type]} ${styles[position]}`}
      initial={{ opacity: 0, y: position.includes('top') ? -50 : 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ 
        type: 'spring',
        stiffness: 500,
        damping: 30
      }}
      layout
    >
      <motion.div 
        className={styles.iconWrapper}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: 'spring',
          stiffness: 500,
          damping: 25,
          delay: 0.1
        }}
      >
        <Icon size={18} strokeWidth={2.5} />
      </motion.div>
      
      <div className={styles.message}>{message}</div>

      {onClose && (
        <motion.button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <X size={14} />
        </motion.button>
      )}

      {duration && (
        <motion.div 
          className={styles.progress}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  )
}

// Toast Container Component
export function ToastContainer({ toasts = [], onRemove, position = 'top-right' }) {
  return (
    <div className={`${styles.container} ${styles[`container-${position}`]}`}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            position={position}
            onClose={() => onRemove(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
