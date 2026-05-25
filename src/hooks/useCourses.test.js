import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

vi.mock('../lib/githubApi', () => ({
  commitFile: vi.fn(),
}))

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [] })),
      })),
      insert: vi.fn(async () => ({ error: null })),
      delete: vi.fn(() => ({
        eq: vi.fn(async () => ({ error: null })),
      })),
    })),
  },
}))

import { useCourses } from './useCourses.js'
import { commitFile } from '../lib/githubApi'
import { supabase } from '../lib/supabaseClient'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createCourse', () => {
  it('slugifies display name correctly', async () => {
    const { result } = renderHook(() => useCourses({ isOwner: true, userId: 'u1' }))

    await waitFor(() => expect(result.current.loading).toBe(false))

    let created
    await act(async () => {
      created = await result.current.createCourse({ displayName: 'Organic Chemistry' })
    })

    expect(created.id).toBe('organic-chemistry')
    expect(commitFile).toHaveBeenCalledWith(
      'src/content/notes/organic-chemistry/notes/.gitkeep',
      '',
      'feat: init organic-chemistry course'
    )
  })

  it('throws when isOwner is false', async () => {
    const { result } = renderHook(() => useCourses({ isOwner: false, userId: 'u1' }))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(result.current.createCourse({ displayName: 'X' })).rejects.toThrow('Owners only')
  })

  it('courses state updates immediately after createCourse succeeds', async () => {
    const { result } = renderHook(() => useCourses({ isOwner: true, userId: 'u1' }))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.createCourse({ displayName: 'Linear Algebra' })
    })

    expect(result.current.courses.some(c => c.id === 'linear-algebra')).toBe(true)
  })
})

describe('deleteCourse', () => {
  it('throws when isOwner is false', async () => {
    const { result } = renderHook(() => useCourses({ isOwner: false, userId: 'u1' }))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(result.current.deleteCourse('any')).rejects.toThrow('Owners only')
  })
})
