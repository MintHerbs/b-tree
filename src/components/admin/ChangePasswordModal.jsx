import { useState } from 'react'
import { X, Eye, EyeSlash } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabaseClient'
import styles from './ChangePasswordModal.module.css'

export default function ChangePasswordModal({ open, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ message: '', type: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      setStatus({ message: 'Password must be at least 8 characters', type: 'error' })
      setTimeout(() => setStatus({ message: '', type: '' }), 3000)
      return
    }

    if (newPassword !== confirmPassword) {
      setStatus({ message: 'Passwords do not match', type: 'error' })
      setTimeout(() => setStatus({ message: '', type: '' }), 3000)
      return
    }

    try {
      setLoading(true)
      setStatus({ message: 'Updating password...', type: 'info' })

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setStatus({ message: 'Password updated successfully!', type: 'success' })
      
      // Reset form
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      setTimeout(() => {
        setStatus({ message: '', type: '' })
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Failed to update password:', error)
      setStatus({ message: `Failed to update password: ${error.message}`, type: 'error' })
      setTimeout(() => setStatus({ message: '', type: '' }), 5000)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} />

      {/* Modal */}
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Change Password</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <X size={18} weight="bold" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Status Message */}
          {status.message && (
            <div className={`${styles.status} ${styles[status.type]}`}>
              {status.message}
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>New Password</label>
            <div className={styles.passwordGroup}>
              <input
                type={showNew ? 'text' : 'password'}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={styles.input}
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className={styles.toggleButton}
                title={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Confirm New Password</label>
            <div className={styles.passwordGroup}>
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.input}
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className={styles.toggleButton}
                title={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
