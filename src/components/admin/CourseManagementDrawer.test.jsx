import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'

// Issue #9 has two defects in CourseManagementDrawer:
//   (1) "Manage" was a stub — handleManageCourse only ran console.log, so nothing
//       opened. It should open the per-course users view.
//   (2) A successful rename called window.location.reload(), blowing away any
//       unsaved editor/draft state just to refresh the list. The list should
//       update in place via state instead.

// Stub UsersDrawer so we can assert it is opened and scoped to the right course
// without pulling in its supabase/admin-user machinery.
vi.mock('./UsersDrawer', () => ({
  default: ({ open, filterCourseId }) =>
    open ? <div data-testid="users-view">users-view:{String(filterCourseId)}</div> : null,
}))

// Flatten Radix Popover so the context-menu items render deterministically in
// jsdom (no portals / pointer-capture). asChild Triggers render their child.
vi.mock('@radix-ui/react-popover', () => {
  const Pass = ({ children }) => <>{children}</>
  return { Root: Pass, Trigger: Pass, Portal: Pass, Content: Pass }
})

// useCourses owns the canonical list; the component layers rename overrides on top.
vi.mock('../../hooks/useCourses', () => ({
  useCourses: () => ({
    courses: [
      { id: 'physics', display_name: 'Physics', description: '' },
      { id: 'maths', display_name: 'Maths', description: '' },
    ],
    loading: false,
    createCourse: vi.fn(),
    deleteCourse: vi.fn(),
  }),
}))

// supabase.from('courses').update({...}).eq('id', id) must resolve for rename.
const sb = vi.hoisted(() => ({ renameEq: vi.fn(() => Promise.resolve({ error: null })) }))
vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: () => ({
      update: () => ({ eq: sb.renameEq }),
      // Defensive: loadUnassignedAdmins chain (not exercised by these tests).
      select: () => ({ eq: () => ({ is: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }) }),
    }),
  },
}))

import CourseManagementDrawer from './CourseManagementDrawer'

// vitest globals are disabled, so Testing Library's auto-cleanup is not
// registered — unmount between tests so DOM nodes don't accumulate.
afterEach(() => cleanup())

let reloadSpy
beforeEach(() => {
  vi.clearAllMocks()
  // Replace window.location with a reload spy so we can assert it is never called
  // (and so jsdom's "not implemented: reload" never fires).
  reloadSpy = vi.fn()
  Object.defineProperty(window, 'location', {
    writable: true,
    configurable: true,
    value: { ...window.location, reload: reloadSpy },
  })
})

const renderDrawer = () =>
  render(
    <CourseManagementDrawer open onClose={() => {}} isOwner userId="owner-1" />
  )

describe('CourseManagementDrawer — Issue #9', () => {
  it('"Manage" opens the per-course users view scoped to that course (not a console stub)', () => {
    renderDrawer()

    // Nothing open initially.
    expect(screen.queryByTestId('users-view')).toBeNull()

    // Click the first course's Manage button (Physics).
    fireEvent.click(screen.getAllByRole('button', { name: /Manage/i })[0])

    // The users view opens, filtered to the clicked course.
    const view = screen.getByTestId('users-view')
    expect(view).toHaveTextContent('users-view:physics')
  })

  it('renaming a course updates the list in place via state and never reloads the page', async () => {
    renderDrawer()

    // Enter rename mode for the first course via its context-menu item.
    fireEvent.click(screen.getAllByText('Rename course')[0])

    // The rename input is seeded with the current name.
    const input = screen.getByDisplayValue('Physics')
    fireEvent.change(input, { target: { value: 'Mechanics 101' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    // The supabase rename was issued for the right course.
    await waitFor(() => expect(sb.renameEq).toHaveBeenCalledWith('id', 'physics'))

    // The new name appears in place; the old name is gone.
    await waitFor(() => expect(screen.getByText('Mechanics 101')).toBeInTheDocument())
    expect(screen.queryByText('Physics')).toBeNull()

    // The defining regression: no full-page reload.
    expect(reloadSpy).not.toHaveBeenCalled()
  })
})
