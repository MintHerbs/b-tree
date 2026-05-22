import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { getAdminProfile } from '../../lib/adminSupabase'
import UsersDrawer from '../../components/admin/UsersDrawer'
import '../../styles/adminTokens.css'
import styles from './AdminUsers.module.css'

export default function AdminUsers() {
  const navigate = useNavigate()
  
  // Auth state
  const [currentUser, setCurrentUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Auth guard - owners only
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          navigate('/admin')
          return
        }
        
        setCurrentUser(user)
        
        // Get admin profile
        const adminProfile = await getAdminProfile(user.id)
        setProfile(adminProfile)
        
        // Check if owner
        if (adminProfile.role !== 'owner') {
          setLoading(false)
          return
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        navigate('/admin')
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [navigate])

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  // 403 for non-owners
  if (profile?.role !== 'owner') {
    return (
      <div className={styles.page}>
        <div className={styles.forbidden}>
          <h1>403 Forbidden</h1>
          <p>Only owners can access this page.</p>
          <button onClick={() => navigate('/admin/editor')} className={styles.backButton}>
            Go to Editor
          </button>
        </div>
      </div>
    )
  }

  // Render UsersDrawer as a full-page component (backwards compatibility)
  return (
    <div className={styles.page}>
      <UsersDrawer 
        open={true} 
        onClose={() => navigate('/admin/editor')}
        currentUserId={currentUser?.id}
        isOwner={profile?.role === 'owner'}
      />
    </div>
  )
}
