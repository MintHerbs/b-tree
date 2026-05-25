// src/hooks/useAdminUsers.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useAdminUsers({ isOwner, currentUserCourseId }) {
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Fetch users for a specific course (admins + contributors)
  // Owners pass courseId = null to see all users across all courses
  async function fetchUsers(courseId) {
    setLoadingUsers(true)
    try {
      let query = supabase.from('admin_users').select('*')
      if (courseId !== null) {
        query = query.eq('course_id', courseId)
      }
      const { data, error } = await query.order('created_at', { ascending: true })
      
      if (error) throw error
      
      // Sort users: owners first, then admins, then contributors
      const sortedUsers = (data ?? []).sort((a, b) => {
        const roleOrder = { owner: 0, admin: 1, contributor: 2 }
        return (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3)
      })
      
      setUsers(sortedUsers)
      return sortedUsers
    } catch (error) {
      console.error('Failed to fetch users:', error)
      throw error
    } finally {
      setLoadingUsers(false)
    }
  }

  // Create a new user (owner creates admin or contributor,
  // course admin creates contributor only for their course)
  async function createUser({ email, username, role, courseId, allowedDirectories, password }) {
    // Course admins can only create contributors
    if (!isOwner && role !== 'contributor') {
      throw new Error('Course admins can only create contributors')
    }
    // Course admins can only create users for their own course
    if (!isOwner && courseId !== currentUserCourseId) {
      throw new Error('Cannot create users for other courses')
    }

    // Validate password
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }

    // Validate required fields
    if (!email || !username) {
      throw new Error('Email and username are required')
    }

    // Validate allowed directories for contributors
    if (role === 'contributor' && (!allowedDirectories || allowedDirectories.length === 0)) {
      throw new Error('Contributors must have at least one allowed directory')
    }

    // Create Supabase auth account via edge function
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: {
        email,
        password,
        username,
        role,
        courseId: role === 'owner' ? null : courseId,
        allowedDirectories: role === 'owner' ? [] : (allowedDirectories ?? []),
      },
    })

    if (error) throw error
    if (data?.error) throw new Error(data.error)

    return data
  }

  // Upgrade a contributor to admin (owners only)
  async function upgradeToAdmin(userId) {
    if (!isOwner) throw new Error('Owners only')
    
    const { error } = await supabase
      .from('admin_users')
      .update({ role: 'admin' })
      .eq('id', userId)
    
    if (error) throw new Error(error.message)
  }

  // Delete a user
  // Owners can delete anyone. Course admins can only delete
  // contributors from their own course.
  async function deleteUser(userId, targetCourseId) {
    if (!isOwner && targetCourseId !== currentUserCourseId) {
      throw new Error('Cannot delete users from other courses')
    }
    
    if (!isOwner) {
      // Verify target is a contributor, not an admin
      const { data } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', userId)
        .single()
      
      if (data?.role !== 'contributor') {
        throw new Error('Course admins can only delete contributors')
      }
    }
    
    // Delete via edge function
    const { data, error } = await supabase.functions.invoke('admin-delete-user', {
      body: { userId },
    })

    if (error) throw error
    if (data?.error) throw new Error(data.error)
  }

  return {
    users,
    loadingUsers,
    fetchUsers,
    createUser,
    upgradeToAdmin,
    deleteUser,
  }
}
