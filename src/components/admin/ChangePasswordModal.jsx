import { useState } from 'react'
import { X, Eye, EyeSlash } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabaseClient'
import styles from './ChangePasswordModal.module.css'

export default function ChangePasswordModal({ open, onClose, userEmail }) {
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

    if (!currentPassword) {
      setStatus({ message: 'Current password is required', type: 'error' })
      setTimeout(() => setStatus({ message: '', type: '' }), 3000)
      return
    }

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
      setStatus({ message: 'Verifying current password...', type: 'info' })

      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword
      })

      if (reauthError) {
        setStatus({ message: 'Current password is incorrect', type: 'error' })
        setTimeout(() => setStatus({ message: '', type: '' }), 5000)
        return
      }

      setStatus({ message: 'Updating password...', type: 'info' })

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      // Best-effort: sign out every other session for this account.
      // A failure here doesn't undo the password change, which is the
      // primary security requirement, so it shouldn't block success.
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'others' })
      if (signOutError) {
        console.error('Failed to invalidate other sessions:', signOutError)
      }

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
            <label className={styles.label}>Current Password</label>
            <div className={styles.passwordGroup}>
              <input
                type={showCurrent ? 'text' : 'password'}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={styles.input}
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className={styles.toggleButton}
                title={showCurrent ? 'Hide password' : 'Show password'}
              >
                {showCurrent ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

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
