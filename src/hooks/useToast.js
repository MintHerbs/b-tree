import { useState, useCallback, useRef } from 'react'

let toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState([])
  const timeoutsRef = useRef({})

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id])
      delete timeoutsRef.current[id]
    }
  }, [])

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = ++toastId
    const toast = { id, message, type, duration }
    
    setToasts((prev) => [...prev, toast])

    if (duration > 0) {
      timeoutsRef.current[id] = setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [removeToast])

  const success = useCallback((message, duration) => {
    return addToast(message, 'success', duration)
  }, [addToast])

  const error = useCallback((message, duration) => {
    return addToast(message, 'error', duration)
  }, [addToast])

  const info = useCallback((message, duration) => {
    return addToast(message, 'info', duration)
  }, [addToast])

  const warning = useCallback((message, duration) => {
    return addToast(message, 'warning', duration)
  }, [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
  }
}
