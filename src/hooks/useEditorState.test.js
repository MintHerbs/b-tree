import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

vi.mock('../lib/loadCourseModules', () => ({
  loadCourseModules: vi.fn(),
}))

vi.mock('../lib/supabaseClient', () => ({
  supabase: { auth: { signOut: vi.fn() } },
}))

import { useEditorState } from './useEditorState'
import { loadCourseModules } from '../lib/loadCourseModules'

function setup() {
  return renderHook(() =>
    useEditorState({ loading: false, profile: { role: 'owner' }, locationSearch: '' })
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  loadCourseModules.mockResolvedValue([{ id: 'm1', label: 'M1' }])
})

describe('useEditorState — per-course module loading', () => {
  it('does not load any course modules until a course is selected', () => {
    const { result } = setup()

    expect(loadCourseModules).not.toHaveBeenCalled()
    expect(result.current.modules).toEqual([])
  })

  it('loads the selected course modules.js from GitHub when selectedCourse is set', async () => {
    const { result } = setup()

    act(() => {
      result.current.setSelectedCourse('math')
    })

    await waitFor(() => expect(loadCourseModules).toHaveBeenCalledWith('math'))
    await waitFor(() =>
      expect(result.current.modules).toEqual([{ id: 'm1', label: 'M1' }])
    )
  })

  it('reloads modules when selectedCourse changes', async () => {
    loadCourseModules.mockImplementation(async (id) => [{ id: `mod-${id}`, label: id }])
    const { result } = setup()

    act(() => {
      result.current.setSelectedCourse('math')
    })
    await waitFor(() =>
      expect(result.current.modules).toEqual([{ id: 'mod-math', label: 'math' }])
    )

    act(() => {
      result.current.setSelectedCourse('physics')
    })
    await waitFor(() =>
      expect(result.current.modules).toEqual([{ id: 'mod-physics', label: 'physics' }])
    )

    expect(loadCourseModules).toHaveBeenCalledWith('math')
    expect(loadCourseModules).toHaveBeenCalledWith('physics')
  })

  it('marks modules as loaded once the course modules resolve', async () => {
    const { result } = setup()

    act(() => {
      result.current.setSelectedCourse('math')
    })

    await waitFor(() => expect(result.current.modulesLoading).toBe(false))
  })
})
