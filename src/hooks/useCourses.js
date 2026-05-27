// src/hooks/useCourses.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { commitFile } from '../lib/githubApi'

export function useCourses({ isOwner, userId }) {

  const [courses, setCourses]   = useState([])
  const [loading, setLoading]   = useState(true)

  // Fetch all courses from Supabase
  useEffect(() => {
    supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setCourses(data ?? [])
        setLoading(false)
      })
  }, [])

  // Create a new course
  // 1. Insert into Supabase courses table
  // 2. Create folder structure in GitHub
  // 3. Create initial modules.js for the course
  async function createCourse({ displayName, description = '' }) {
    if (!isOwner) throw new Error('Owners only')

    // Slugify display name: "Organic Chemistry" → "organic-chemistry"
    const id = displayName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Insert into Supabase
    const { error } = await supabase.from('courses').insert({
      id,
      display_name: displayName,
      description,
      created_by: userId,
    })
    if (error) throw new Error(`Failed to create course: ${error.message}`)

    // Create default folder structure in GitHub
    const basePath = `src/content/notes/${id}`
    await commitFile(
      `${basePath}/notes/.gitkeep`,
      '',
      `feat: init ${id} course`
    )
    await commitFile(
      `${basePath}/tools/.gitkeep`,
      '',
      `feat: init ${id} course tools`
    )
    await commitFile(
      `public/notes/img/${id}/.gitkeep`,
      '',
      `feat: init ${id} image folder`
    )

    // Create initial modules.js for the course (canonical `MODULES` export).
    // Includes a phosphor-icons import block so adding a subject with an icon
    // can extend it; the default module references FileCode to keep it valid.
    const initialModules = `import {
  FileCode,
} from '@phosphor-icons/react'

export const MODULES = [
  {
    id: 'notes',
    label: 'Notes',
    Icon: FileCode,
    subfolders: ['notes'],
  },
]
`
    await commitFile(
      `${basePath}/modules.js`,
      initialModules,
      `feat: add modules.js for ${id}`
    )

    // Update local state
    const newCourse = { id, display_name: displayName, description }
    setCourses(prev => [...prev, newCourse])
    return newCourse
  }

  // Delete a course (owners only)
  // Removes from Supabase only — does NOT delete GitHub content
  // (non-destructive to actual notes)
  async function deleteCourse(courseId) {
    if (!isOwner) throw new Error('Owners only')
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)
    if (error) throw new Error(`Failed to delete course: ${error.message}`)
    setCourses(prev => prev.filter(c => c.id !== courseId))
  }

  return { courses, loading, createCourse, deleteCourse }
}
