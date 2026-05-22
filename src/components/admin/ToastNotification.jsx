import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { colors } from '../../constants/colors'
import { X, Check, Warning } from '@phosphor-icons/react'
import styles from './ToastNotification.module.css'

const ToastContext = createContext(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastNotification provider')
  }
  return context
}

export default function ToastNotification({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    const newToast = { id, message, type }
    
    setToasts(prev => {
      // Max 3 toasts - remove oldest if at capacity
      const updated = prev.length >= 3 ? prev.slice(1) : prev
      return [...updated, newToast]
    })

    // Auto-dismiss after 3500ms
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map((toast, index) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onDismiss={() => dismissToast(toast.id)}
            index={index}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function Toast({ message, type, onDismiss, index }) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Start exit animation 200ms before actual removal
    const exitTimer = setTimeout(() => {
      setIsExiting(true)
    }, 3300)

    return () => clearTimeout(exitTimer)
  }, [])

  const accentColor = type === 'error' ? colors.error : colors.success
  const Icon = type === 'error' ? Warning : Check

  return (
    <div
      className={`${styles.toast} ${isExiting ? styles.toastExit : ''}`}
      style={{
        '--accent-color': accentColor,
        '--toast-index': index
      }}
    >
      <div className={styles.toastAccent} />
      <div className={styles.toastContent}>
        <Icon size={16} weight="bold" className={styles.toastIcon} />
        <span className={styles.toastMessage}>{message}</span>
      </div>
      <button
        className={styles.toastClose}
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        <X size={14} weight="bold" />
      </button>
    </div>
  )
}
