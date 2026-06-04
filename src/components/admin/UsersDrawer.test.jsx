import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'

// The bug (Issue #8): the "Allowed Directories" checkboxes were populated from a
// static `MODULES` import of the legacy global Sidebar/modules.js, so they never
// reflected the course the contributor was being assigned to. The fix loads the
// selected course's registry via loadCourseModules. These mocks let us assert
// the checkboxes come from the *selected course*, not a hardwired module set.
vi.mock('../../lib/loadCourseModules', () => ({
  loadCourseModules: vi.fn(),
}))

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () =>
          Promise.resolve({
            data: [
              { id: 'physics', display_name: 'Physics' },
              { id: 'maths', display_name: 'Maths' },
            ],
            error: null,
          }),
      }),
    }),
  },
}))

vi.mock('../../hooks/useAdminUsers', () => ({
  useAdminUsers: () => ({
    users: [],
    loadingUsers: false,
    fetchUsers: vi.fn().mockResolvedValue(undefined),
    createUser: vi.fn(),
    upgradeToAdmin: vi.fn(),
    deleteUser: vi.fn(),
  }),
}))

import UsersDrawer from './UsersDrawer'
import { loadCourseModules } from '../../lib/loadCourseModules'

// vitest globals are disabled, so Testing Library's auto-cleanup is not
// registered — unmount between tests so DOM nodes don't accumulate.
afterEach(() => cleanup())

beforeEach(() => {
  vi.clearAllMocks()
})

describe('UsersDrawer — Allowed Directories reflect the selected course', () => {
  it('loads the selected course modules and renders them as directory checkboxes', async () => {
    loadCourseModules.mockResolvedValue([
      { id: 'mechanics', label: 'Mechanics' },
      { id: 'thermo', label: 'Thermodynamics' },
    ])

    render(
      <UsersDrawer
        open
        onClose={() => {}}
        currentUserId="me"
        isOwner
        filterCourseId="physics"
      />
    )

    // Open the "Add new user" form (default role is contributor).
    fireEvent.click(screen.getByText('Add new user'))

    // The hook must be queried with the selected course id, not a global set.
    await waitFor(() => expect(loadCourseModules).toHaveBeenCalledWith('physics'))

    // The checkboxes must show *this course's* module labels.
    await waitFor(() => {
      expect(screen.getByText('Mechanics')).toBeInTheDocument()
      expect(screen.getByText('Thermodynamics')).toBeInTheDocument()
    })
  })

  it('reloads the directory list when the selected course changes', async () => {
    loadCourseModules.mockImplementation(async (courseId) =>
      courseId === 'physics'
        ? [{ id: 'mechanics', label: 'Mechanics' }]
        : [{ id: 'algebra', label: 'Algebra' }]
    )

    const { container } = render(
      <UsersDrawer open onClose={() => {}} currentUserId="me" isOwner filterCourseId="physics" />
    )
    fireEvent.click(screen.getByText('Add new user'))

    await waitFor(() => expect(screen.getByText('Mechanics')).toBeInTheDocument())

    // Switching course via the dropdown must repopulate from that course's registry.
    const courseSelect = await screen.findByDisplayValue('Physics')
    fireEvent.change(courseSelect, { target: { value: 'maths' } })

    await waitFor(() => {
      expect(loadCourseModules).toHaveBeenCalledWith('maths')
      expect(screen.getByText('Algebra')).toBeInTheDocument()
    })
    expect(screen.queryByText('Mechanics')).not.toBeInTheDocument()
    expect(container).toBeTruthy()
  })
})
