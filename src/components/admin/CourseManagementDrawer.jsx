import { useState, useEffect } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { X, Plus, Trash, DotsThreeVertical, PencilSimple, Users, CaretDown, CaretRight } from '@phosphor-icons/react'
import { useCourses } from '../../hooks/useCourses'
import { supabase } from '../../lib/supabaseClient'
import styles from './CourseManagementDrawer.module.css'

export default function CourseManagementDrawer({ open, onClose, isOwner, userId }) {
  const { courses, loading, createCourse, deleteCourse } = useCourses({ isOwner, userId })
  
  // Create course form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [courseName, setCourseName] = useState('')
  const [courseDescription, setCourseDescription] = useState('')
  const [selectedAdminId, setSelectedAdminId] = useState('')
  const [creating, setCreating] = useState(false)
  
  // Unassigned admins for dropdown
  const [unassignedAdmins, setUnassignedAdmins] = useState([])
  const [loadingAdmins, setLoadingAdmins] = useState(false)
  
  // Rename state
  const [renamingCourseId, setRenamingCourseId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  
  // Status messages
  const [status, setStatus] = useState({ message: '', type: '' })
  
  // Context menu state
  const [contextMenuOpen, setContextMenuOpen] = useState(null)
  
  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(null)
  
  // Load unassigned admins when create form opens
  useEffect(() => {
    if (showCreateForm && isOwner) {
      loadUnassignedAdmins()
    }
  }, [showCreateForm, isOwner])
  
  const loadUnassignedAdmins = async () => {
    setLoadingAdmins(true)
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, username, email')
        .eq('role', 'admin')
        .is('course_id', null)
        .order('username', { ascending: true })
      
      if (error) throw error
      setUnassignedAdmins(data ?? [])
    } catch (error) {
      console.error('Failed to load unassigned admins:', error)
    } finally {
      setLoadingAdmins(false)
    }
  }
  
  const handleCreateCourse = async (e) => {
    e.preventDefault()
    
    if (!courseName.trim()) {
      setStatus({ message: 'Course name is required', type: 'error' })
      setTimeout(() => setStatus({ message: '', type: '' }), 3000)
      return
    }
    
    setCreating(true)
    setStatus({ message: 'Creating course...', type: 'info' })
    
    try {
      const newCourse = await createCourse({
        displayName: courseName.trim(),
        description: courseDescription.trim(),
      })
      
      // If admin was selected, assign them to this course
      if (selectedAdminId) {
        const { error } = await supabase
          .from('admin_users')
          .update({ course_id: newCourse.id })
          .eq('id', selectedAdminId)
        
        if (error) {
          console.error('Failed to assign admin:', error)
          setStatus({ message: `Course created but failed to assign admin: ${error.message}`, type: 'error' })
        } else {
          setStatus({ message: `${newCourse.display_name} created and admin assigned`, type: 'success' })
        }
      } else {
        setStatus({ message: `${newCourse.display_name} created`, type: 'success' })
      }
      
      // Reset form
      setCourseName('')
      setCourseDescription('')
      setSelectedAdminId('')
      setShowCreateForm(false)
      
      setTimeout(() => setStatus({ message: '', type: '' }), 5000)
    } catch (error) {
      console.error('Failed to create course:', error)
      setStatus({ message: `Failed to create course: ${error.message}`, type: 'error' })
      setTimeout(() => setStatus({ message: '', type: '' }), 5000)
    } finally {
      setCreating(false)
    }
  }
  
  const handleDeleteCourse = async (courseId) => {
    try {
      setStatus({ message: 'Deleting course...', type: 'info' })
      await deleteCourse(courseId)
      setStatus({ message: 'Course deleted', type: 'success' })
      setDeleteConfirmOpen(null)
      setTimeout(() => setStatus({ message: '', type: '' }), 3000)
    } catch (error) {
      console.error('Failed to delete course:', error)
      setStatus({ message: `Failed to delete course: ${error.message}`, type: 'error' })
      setTimeout(() => setStatus({ message: '', type: '' }), 5000)
    }
  }
  
  const handleRenameCourse = async (courseId) => {
    if (!renameValue.trim()) {
      setRenamingCourseId(null)
      return
    }
    
    try {
      const { error } = await supabase
        .from('courses')
        .update({ display_name: renameValue.trim() })
        .eq('id', courseId)
      
      if (error) throw error
      
      setStatus({ message: 'Course renamed', type: 'success' })
      setRenamingCourseId(null)
      setTimeout(() => setStatus({ message: '', type: '' }), 3000)
      
      // Refresh courses list (trigger re-fetch)
      window.location.reload()
    } catch (error) {
      console.error('Failed to rename course:', error)
      setStatus({ message: `Failed to rename course: ${error.message}`, type: 'error' })
      setTimeout(() => setStatus({ message: '', type: '' }), 5000)
    }
  }
  
  const handleManageCourse = (courseId) => {
    // This will be wired up in the next prompt to open UsersDrawer filtered to this course
    console.log('Manage course:', courseId)
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
          <h2 className={styles.title}>Courses</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <X size={18} weight="bold" />
          </button>
        </div>
        
        {/* Content */}
        <div className={styles.content}>
          {!isOwner ? (
            <p className={styles.emptyText}>Only owners can manage courses.</p>
          ) : (
            <>
              {/* Status Message */}
              {status.message && (
                <div className={`${styles.status} ${styles[status.type]}`}>
                  {status.message}
                </div>
              )}
              
              {/* Courses List */}
              <div className={styles.coursesSection}>
                {loading ? (
                  <p className={styles.loadingText}>Loading courses...</p>
                ) : courses.length === 0 ? (
                  <p className={styles.emptyText}>No courses found</p>
                ) : (
                  <div className={styles.coursesList}>
                    {courses.map(course => (
                      <div key={course.id} className={styles.courseRow}>
                        {renamingCourseId === course.id ? (
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => handleRenameCourse(course.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameCourse(course.id)
                              if (e.key === 'Escape') setRenamingCourseId(null)
                            }}
                            className={styles.renameInput}
                            autoFocus
                          />
                        ) : (
                          <span className={styles.courseName}>{course.display_name}</span>
                        )}
                        
                        <div className={styles.courseActions}>
                          <button
                            className={styles.manageButton}
                            onClick={() => handleManageCourse(course.id)}
                          >
                            <Users size={14} />
                            <span>Manage</span>
                          </button>
                          
                          <Popover.Root
                            open={contextMenuOpen === course.id}
                            onOpenChange={(open) => setContextMenuOpen(open ? course.id : null)}
                          >
                            <Popover.Trigger asChild>
                              <button className={styles.contextMenuButton}>
                                <DotsThreeVertical size={16} />
                              </button>
                            </Popover.Trigger>
                            <Popover.Portal>
                              <Popover.Content className={styles.popoverContent} sideOffset={4}>
                                <button
                                  className={styles.menuItem}
                                  onClick={() => {
                                    setRenamingCourseId(course.id)
                                    setRenameValue(course.display_name)
                                    setContextMenuOpen(null)
                                  }}
                                >
                                  <PencilSimple size={16} />
                                  <span>Rename course</span>
                                </button>
                                
                                <Popover.Root
                                  open={deleteConfirmOpen === course.id}
                                  onOpenChange={(open) => setDeleteConfirmOpen(open ? course.id : null)}
                                >
                                  <Popover.Trigger asChild>
                                    <button className={`${styles.menuItem} ${styles.danger}`}>
                                      <Trash size={16} />
                                      <span>Delete course</span>
                                    </button>
                                  </Popover.Trigger>
                                  <Popover.Portal>
                                    <Popover.Content className={styles.confirmPopover} sideOffset={4}>
                                      <p className={styles.confirmText}>
                                        This removes the course from the system but does not delete notes from GitHub.
                                      </p>
                                      <div className={styles.confirmActions}>
                                        <button
                                          className={styles.cancelButton}
                                          onClick={() => setDeleteConfirmOpen(null)}
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          className={styles.confirmButton}
                                          onClick={() => handleDeleteCourse(course.id)}
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </Popover.Content>
                                  </Popover.Portal>
                                </Popover.Root>
                              </Popover.Content>
                            </Popover.Portal>
                          </Popover.Root>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Create New Course Section */}
              <div className={styles.createSection}>
                <button
                  className={styles.createToggle}
                  onClick={() => setShowCreateForm(!showCreateForm)}
                >
                  {showCreateForm ? <CaretDown size={16} /> : <CaretRight size={16} />}
                  <span>Create new course</span>
                </button>
                
                {showCreateForm && (
                  <form onSubmit={handleCreateCourse} className={styles.form}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Organic Chemistry"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        className={styles.input}
                        required
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Description (optional)</label>
                      <input
                        type="text"
                        placeholder="Brief description"
                        value={courseDescription}
                        onChange={(e) => setCourseDescription(e.target.value)}
                        className={styles.input}
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Assign admin</label>
                      {loadingAdmins ? (
                        <p className={styles.loadingText}>Loading admins...</p>
                      ) : unassignedAdmins.length === 0 ? (
                        <p className={styles.emptyText}>No unassigned admins available</p>
                      ) : (
                        <select
                          value={selectedAdminId}
                          onChange={(e) => setSelectedAdminId(e.target.value)}
                          className={styles.select}
                        >
                          <option value="">Select admin (optional)</option>
                          {unassignedAdmins.map(admin => (
                            <option key={admin.id} value={admin.id}>
                              {admin.username} ({admin.email})
                            </option>
                          ))}
                        </select>
                      )}
                      {selectedAdminId && (
                        <button
                          type="button"
                          className={styles.skipLink}
                          onClick={() => setSelectedAdminId('')}
                        >
                          Skip for now
                        </button>
                      )}
                    </div>
                    
                    <button
                      type="submit"
                      className={styles.createButton}
                      disabled={!courseName.trim() || creating}
                    >
                      {creating ? (
                        <>
                          <span className={styles.spinner} />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <>
                          <Plus size={16} weight="bold" />
                          <span>Create course</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
