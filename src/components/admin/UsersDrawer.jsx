import { useState, useEffect } from 'react'
import { X, CaretDown, CaretRight, ArrowUp } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabaseClient'
import { useAdminUsers } from '../../hooks/useAdminUsers'
import { MODULES } from '../layout/Sidebar/modules'
import styles from './UsersDrawer.module.css'

// Generate random 12-character password
function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export default function UsersDrawer({ open, onClose, currentUserId, isOwner = false, filterCourseId = null, currentUserCourseId = null }) {
  // Use the admin users hook
  const { users, loadingUsers, fetchUsers, createUser, upgradeToAdmin, deleteUser } = useAdminUsers({
    isOwner,
    currentUserCourseId,
  })
  
  // Courses list for dropdown (owners only)
  const [courses, setCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  
  // Add user form
  const [showAddForm, setShowAddForm] = useState(false)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('contributor')
  const [selectedCourseId, setSelectedCourseId] = useState(filterCourseId || '')
  const [selectedDirectories, setSelectedDirectories] = useState([])
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  
  // Status messages
  const [status, setStatus] = useState({ message: '', type: '' })

  // Load users when drawer opens
  useEffect(() => {
    if (open) {
      loadUsers()
    }
  }, [open, filterCourseId])
  
  // Load courses for dropdown (owners only)
  useEffect(() => {
    if (open && isOwner && showAddForm) {
      loadCourses()
    }
  }, [open, isOwner, showAddForm])

  const loadUsers = async () => {
    try {
      await fetchUsers(filterCourseId)
    } catch (error) {
      console.error('Failed to load users:', error)
      setStatus({ message: `Failed to load users: ${error.message}`, type: 'error' })
      setTimeout(() => setStatus({ message: '', type: '' }), 5000)
    }
  }
  
  const loadCourses = async () => {
    setLoadingCourses(true)
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, display_name')
        .order('display_name', { ascending: true })
      
      if (error) throw error
      setCourses(data ?? [])
    } catch (error) {
      console.error('Failed to load courses:', error)
    } finally {
      setLoadingCourses(false)
    }
  }

  // Handle directory selection
  const toggleDirectory = (moduleId) => {
    setSelectedDirectories(prev => 
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  // Generate password
  const handleGeneratePassword = () => {
    const password = generatePassword()
    setGeneratedPassword(password)
    setShowPassword(true)
  }

  // Create new user
  const handleCreateUser = async (e) => {
    e.preventDefault()
    
    if (!email || !username || !generatedPassword) {
      setStatus({ message: 'Please fill all fields including password', type: 'error' })
      setTimeout(() => setStatus({ message: '', type: '' }), 3000)
      return
    }
    
    if (role !== 'owner' && !selectedCourseId) {
      setStatus({ message: 'Please select a course', type: 'error' })
      setTimeout(() => setStatus({ message: '', type: '' }), 3000)
      return
    }
    
    try {
      setCreatingUser(true)
      setStatus({ message: 'Creating user...', type: 'info' })

      await createUser({
        email,
        username,
        role,
        courseId: role === 'owner' ? null : selectedCourseId,
        allowedDirectories: role === 'contributor' ? selectedDirectories : [],
        password: generatedPassword,
      })
      
      setStatus({ message: `User created! Password: ${generatedPassword}`, type: 'success' })
      
      // Reset form
      setEmail('')
      setUsername('')
      setRole('contributor')
      setSelectedCourseId(filterCourseId || '')
      setSelectedDirectories([])
      setGeneratedPassword('')
      setShowPassword(false)
      setShowAddForm(false)
      
      // Reload users
      await loadUsers()
      
      setTimeout(() => setStatus({ message: '', type: '' }), 10000)
    } catch (error) {
      console.error('Failed to create user:', error)
      setStatus({ message: `Failed to create user: ${error.message}`, type: 'error' })
      setTimeout(() => setStatus({ message: '', type: '' }), 5000)
    } finally {
      setCreatingUser(false)
    }
  }

  // Delete user
  const handleDeleteUser = async (userId, username, userCourseId) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return
    }
    
    try {
      setStatus({ message: 'Deleting user...', type: 'info' })
      
      await deleteUser(userId, userCourseId)
      
      setStatus({ message: 'User deleted successfully', type: 'success' })
      
      // Reload users
      await loadUsers()
      
      setTimeout(() => setStatus({ message: '', type: '' }), 3000)
    } catch (error) {
      console.error('Failed to delete user:', error)
      setStatus({ message: `Failed to delete user: ${error.message}`, type: 'error' })
      setTimeout(() => setStatus({ message: '', type: '' }), 5000)
    }
  }
  
  // Upgrade contributor to admin
  const handleUpgradeToAdmin = async (userId, username) => {
    if (!confirm(`Upgrade "${username}" to admin?`)) {
      return
    }
    
    try {
      setStatus({ message: 'Upgrading user...', type: 'info' })
      
      await upgradeToAdmin(userId)
      
      setStatus({ message: 'User upgraded to admin', type: 'success' })
      
      // Reload users
      await loadUsers()
      
      setTimeout(() => setStatus({ message: '', type: '' }), 3000)
    } catch (error) {
      console.error('Failed to upgrade user:', error)
      setStatus({ message: `Failed to upgrade user: ${error.message}`, type: 'error' })
      setTimeout(() => setStatus({ message: '', type: '' }), 5000)
    }
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className={styles.backdrop} onClick={onClose} />
      )}

      {/* Drawer */}
      <div className={`${styles.drawer} ${open ? styles.open : ''}`}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Team</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {!isOwner ? (
            <p className={styles.emptyText}>Only owners can manage user accounts.</p>
          ) : (
          <>
          {/* Status Message */}
          {status.message && (
            <div className={`${styles.status} ${styles[status.type]}`}>
              {status.message}
            </div>
          )}

          {/* Users Table */}
          <div className={styles.usersSection}>
            {loadingUsers ? (
              <p className={styles.loadingText}>Loading users...</p>
            ) : users.length === 0 ? (
              <p className={styles.emptyText}>No users found</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Role</th>
                      {isOwner && filterCourseId === null && <th>Course</th>}
                      <th>Directories</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>
                          <div className={styles.userCell}>
                            <span className={styles.username}>{user.username}</span>
                            <span className={styles.email}>{user.email || user.id}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.roleBadge} ${styles[user.role]}`}>
                            {user.role}
                          </span>
                        </td>
                        {isOwner && filterCourseId === null && (
                          <td>
                            <span className={styles.courseCell}>
                              {user.role === 'owner' ? 'Global' : (user.course_id || 'None')}
                            </span>
                          </td>
                        )}
                        <td>
                          {user.role === 'owner' ? (
                            <span className={styles.allAccess}>All</span>
                          ) : user.allowed_directories?.length > 0 ? (
                            <span className={styles.directories}>
                              {user.allowed_directories.slice(0, 2).join(', ')}
                              {user.allowed_directories.length > 2 && ` +${user.allowed_directories.length - 2}`}
                            </span>
                          ) : (
                            <span className={styles.noDirs}>None</span>
                          )}
                        </td>
                        <td>
                          <div className={styles.actionsCell}>
                            {isOwner && user.role === 'contributor' && (
                              <button
                                onClick={() => handleUpgradeToAdmin(user.id, user.username)}
                                className={styles.upgradeButton}
                                title="Upgrade to admin"
                              >
                                <ArrowUp size={14} />
                                <span>Upgrade</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(user.id, user.username, user.course_id)}
                              className={styles.deleteButton}
                              disabled={user.id === currentUserId}
                              title={user.id === currentUserId ? "Can't delete yourself" : "Delete user"}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add User Section */}
          {isOwner && (
          <div className={styles.addUserSection}>
            <button
              className={styles.addUserToggle}
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? <CaretDown size={16} /> : <CaretRight size={16} />}
              <span>Add new user</span>
            </button>

            {showAddForm && (
              <form onSubmit={handleCreateUser} className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email</label>
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Username</label>
                  <input
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={styles.select}
                  >
                    <option value="contributor">Contributor</option>
                    {isOwner && <option value="admin">Admin</option>}
                    {isOwner && <option value="owner">Owner</option>}
                  </select>
                </div>

                {isOwner && role !== 'owner' && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Course</label>
                    {loadingCourses ? (
                      <p className={styles.loadingText}>Loading courses...</p>
                    ) : (
                      <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className={styles.select}
                        required
                      >
                        <option value="">Select course</option>
                        {courses.map(course => (
                          <option key={course.id} value={course.id}>
                            {course.display_name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {role === 'contributor' && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Allowed Directories</label>
                    <div className={styles.directoryGrid}>
                      {MODULES.map(module => (
                        <label key={module.id} className={styles.checkbox}>
                          <input
                            type="checkbox"
                            checked={selectedDirectories.includes(module.id)}
                            onChange={() => toggleDirectory(module.id)}
                          />
                          <span>{module.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.label}>Password</label>
                  <div className={styles.passwordGroup}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Type or generate password"
                      value={generatedPassword}
                      onChange={(e) => setGeneratedPassword(e.target.value)}
                      className={styles.input}
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className={styles.generateButton}
                    >
                      Generate
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={styles.toggleButton}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <button type="submit" className={styles.createButton} disabled={creatingUser}>
                  {creatingUser ? 'Creating...' : 'Create User'}
                </button>
              </form>
            )}
          </div>
          )}
          </>
          )}
        </div>
      </div>
    </>
  )
}
