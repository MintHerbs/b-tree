import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock('../lib/draftDB', () => ({
  clearDraftBlobs: vi.fn(async () => {}),
  restoreDraftBlobs: vi.fn(async () => ({})),
}))

import { supabase } from '../lib/supabaseClient'
import { clearDraftBlobs, restoreDraftBlobs } from '../lib/draftDB'
import { useDrafts } from './useDrafts.js'

// A chainable, thenable Supabase query stub.
// - chain methods (select/eq/order/insert/update/delete) return the builder
// - awaiting the builder itself resolves `list` (used by select…order, delete…eq)
// - `single`/`maybeSingle` resolve `single`
// - `upsert` resolves `upsert` (or rejects if upsertReject is set)
function makeBuilder({
  list = { data: [], error: null },
  single = { data: null, error: null },
  upsert = { data: null, error: null },
  upsertReject = null,
} = {}) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    single: vi.fn(async () => single),
    maybeSingle: vi.fn(async () => single),
    upsert: vi.fn(() => (upsertReject ? Promise.reject(upsertReject) : Promise.resolve(upsert))),
    then: (resolve, reject) => Promise.resolve(list).then(resolve, reject),
  }
  return builder
}

function setupSupabase(builderOpts) {
  const builder = makeBuilder(builderOpts)
  supabase.from.mockImplementation(() => builder)
  return builder
}

const STABLE = {
  setTitle: vi.fn(),
  setContent: vi.fn(),
  setSelectedPath: vi.fn(),
}

function setup(props = {}) {
  const base = {
    userId: 'u1',
    selectedCourse: 'course-1',
    title: '',
    content: '',
    selectedPath: null,
    setTitle: STABLE.setTitle,
    setContent: STABLE.setContent,
    setSelectedPath: STABLE.setSelectedPath,
    editorRef: { current: null },
    ...props,
  }
  const utils = renderHook((p) => useDrafts(p), { initialProps: base })
  return { ...utils, base }
}

// Flush the async on-mount load (supabase select + restoreDraftBlobs).
async function flushLoad() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  localStorage.clear()
  restoreDraftBlobs.mockResolvedValue({})
  clearDraftBlobs.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useDrafts — load on mount', () => {
  it('fetches all drafts for the user and restores the most recent into the editor', async () => {
    const rows = [
      { id: 'd1', draft_name: 'Recent', title: 'T1', content: 'C1', module_id: 'm1', subfolder: 's1' },
      { id: 'd2', draft_name: 'Older', title: 'T2', content: 'C2', module_id: null, subfolder: null },
    ]
    const builder = setupSupabase({ list: { data: rows, error: null } })

    const { result } = setup()
    await flushLoad()

    expect(supabase.from).toHaveBeenCalledWith('drafts')
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1')
    expect(builder.order).toHaveBeenCalledWith('updated_at', { ascending: false })
    expect(result.current.drafts).toEqual(rows)
    expect(result.current.activeDraftId).toBe('d1')
    expect(result.current.loadingDrafts).toBe(false)
    expect(STABLE.setTitle).toHaveBeenCalledWith('T1')
    expect(STABLE.setContent).toHaveBeenCalledWith('C1')
    expect(STABLE.setSelectedPath).toHaveBeenCalledWith({ moduleId: 'm1', subfolder: 's1' })
    expect(restoreDraftBlobs).toHaveBeenCalledWith('d1')
  })

  it('falls back to localStorage when the Supabase fetch errors', async () => {
    localStorage.setItem(
      'admin-draft-local-1',
      JSON.stringify({
        draftId: 'local-1',
        title: 'LT',
        content: 'LC',
        selectedPath: { moduleId: 'lm', subfolder: 'ls' },
      })
    )
    // unrelated counter entry must be ignored
    localStorage.setItem('admin-draft-img-counter-local-1', '3')

    setupSupabase({ list: { data: null, error: { message: 'offline' } } })

    const { result } = setup()
    await flushLoad()

    expect(result.current.drafts).toHaveLength(1)
    expect(result.current.activeDraftId).toBe('local-1')
    expect(STABLE.setContent).toHaveBeenCalledWith('LC')
    expect(STABLE.setSelectedPath).toHaveBeenCalledWith({ moduleId: 'lm', subfolder: 'ls' })
  })

  it('finishes loading with no active draft when the user has none', async () => {
    setupSupabase({ list: { data: [], error: null } })

    const { result } = setup()
    await flushLoad()

    expect(result.current.drafts).toEqual([])
    expect(result.current.activeDraftId).toBeNull()
    expect(result.current.loadingDrafts).toBe(false)
  })

  it('does not load when userId is null', async () => {
    setupSupabase()
    const { result } = setup({ userId: null })
    await flushLoad()
    expect(supabase.from).not.toHaveBeenCalled()
    expect(result.current.loadingDrafts).toBe(true)
  })
})

describe('useDrafts — saveStatus transitions', () => {
  it('starts as "saved"', async () => {
    setupSupabase({ list: { data: [], error: null } })
    const { result } = setup()
    await flushLoad()
    expect(result.current.saveStatus).toBe('saved')
  })

  it('flips to "unsaved" when content changes after load', async () => {
    setupSupabase({ list: { data: [], error: null } })
    const { result, rerender, base } = setup()
    await flushLoad()
    expect(result.current.saveStatus).toBe('saved')

    await act(async () => {
      rerender({ ...base, content: 'edited' })
    })

    expect(result.current.saveStatus).toBe('unsaved')
  })

  it('flushSave goes saving → saved on success', async () => {
    const builder = setupSupabase({
      list: { data: [{ id: 'd1', title: 'T', content: 'C', module_id: null, subfolder: null }], error: null },
    })
    // Hold the upsert open so we can observe the intermediate 'saving' state.
    let resolveUpsert
    builder.upsert.mockImplementation(
      () => new Promise((resolve) => { resolveUpsert = resolve })
    )

    const { result } = setup()
    await flushLoad()

    let pending
    await act(async () => {
      pending = result.current.flushSave()
    })
    expect(result.current.saveStatus).toBe('saving')

    await act(async () => {
      resolveUpsert({ data: null, error: null })
      await pending
    })
    expect(result.current.saveStatus).toBe('saved')
    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'd1', user_id: 'u1', selected_course: 'course-1' }),
      { onConflict: 'id' }
    )
  })

  it('flushSave goes saving → failed when upsert returns an error', async () => {
    setupSupabase({
      list: { data: [{ id: 'd1', title: 'T', content: 'C', module_id: null, subfolder: null }], error: null },
      upsert: { data: null, error: { message: 'boom' } },
    })
    const { result } = setup()
    await flushLoad()

    await act(async () => {
      await result.current.flushSave()
    })

    expect(result.current.saveStatus).toBe('failed')
  })

  it('flushSave goes saving → failed when upsert throws', async () => {
    setupSupabase({
      list: { data: [{ id: 'd1', title: 'T', content: 'C', module_id: null, subfolder: null }], error: null },
      upsertReject: new Error('network'),
    })
    const { result } = setup()
    await flushLoad()

    await act(async () => {
      await result.current.flushSave()
    })

    expect(result.current.saveStatus).toBe('failed')
  })

  it('flushSave is a no-op when there is no active draft', async () => {
    const builder = setupSupabase({ list: { data: [], error: null } })
    const { result } = setup()
    await flushLoad()

    await act(async () => {
      await result.current.flushSave()
    })

    expect(builder.upsert).not.toHaveBeenCalled()
    expect(result.current.saveStatus).toBe('saved')
  })
})

describe('useDrafts — createDraft', () => {
  it('inserts a new draft and makes it active', async () => {
    const newRow = { id: 'new1', draft_name: 'Fresh', title: '', content: '' }
    const builder = setupSupabase({
      list: { data: [], error: null },
      single: { data: newRow, error: null },
    })
    const { result } = setup()
    await flushLoad()

    await act(async () => {
      await result.current.createDraft('Fresh')
    })

    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'u1',
        draft_name: 'Fresh',
        selected_course: 'course-1',
      })
    )
    expect(result.current.drafts).toContainEqual(newRow)
    expect(result.current.activeDraftId).toBe('new1')
    expect(result.current.saveStatus).toBe('saved')
  })

  it('throws when the user already has 5 drafts', async () => {
    const five = Array.from({ length: 5 }, (_, i) => ({
      id: `d${i}`,
      title: '',
      content: '',
      module_id: null,
      subfolder: null,
    }))
    setupSupabase({ list: { data: five, error: null } })
    const { result } = setup()
    await flushLoad()

    await expect(
      act(async () => {
        await result.current.createDraft('Sixth')
      })
    ).rejects.toThrow(/Maximum 5 drafts/)
  })
})

describe('useDrafts — switchDraft', () => {
  it('saves the current draft, loads the target, and restores its blobs', async () => {
    const rows = [
      { id: 'd1', title: 'T1', content: 'C1', module_id: 'm1', subfolder: 's1' },
      { id: 'd2', title: 'T2', content: 'C2', module_id: null, subfolder: null },
    ]
    const builder = setupSupabase({
      list: { data: rows, error: null },
      upsert: { data: null, error: null },
    })
    const { result } = setup()
    await flushLoad()
    STABLE.setTitle.mockClear()
    builder.upsert.mockClear()
    restoreDraftBlobs.mockClear()

    await act(async () => {
      await result.current.switchDraft('d2')
    })

    expect(builder.upsert).toHaveBeenCalledTimes(1) // flushSave of d1
    expect(result.current.activeDraftId).toBe('d2')
    expect(STABLE.setTitle).toHaveBeenCalledWith('T2')
    expect(restoreDraftBlobs).toHaveBeenCalledWith('d2')
  })

  it('reloads the latest edits — not stale mount-time content — when switching away and back (Issue #3)', async () => {
    const rows = [
      { id: 'd1', title: 'T1', content: 'C1', module_id: null, subfolder: null },
      { id: 'd2', title: 'T2', content: 'C2', module_id: null, subfolder: null },
    ]
    setupSupabase({ list: { data: rows, error: null }, upsert: { data: null, error: null } })
    const { result, rerender, base } = setup()
    await flushLoad()

    // User edits the active draft (d1) in the editor. The mock setters don't
    // feed back into props, so we drive the live editor content via rerender.
    await act(async () => {
      rerender({ ...base, content: 'C1-edited' })
    })

    // Switch to d2; the editor now shows d2's content.
    await act(async () => {
      await result.current.switchDraft('d2')
    })
    await act(async () => {
      rerender({ ...base, content: 'C2' })
    })

    STABLE.setContent.mockClear()

    // Switch back to d1 — it must reload the EDITED content, not the original C1.
    await act(async () => {
      await result.current.switchDraft('d1')
    })

    expect(STABLE.setContent).toHaveBeenCalledWith('C1-edited')
    expect(STABLE.setContent).not.toHaveBeenCalledWith('C1')
    expect(result.current.activeDraftId).toBe('d1')
  })

  it('does nothing when switching to the already-active draft', async () => {
    const rows = [{ id: 'd1', title: 'T1', content: 'C1', module_id: null, subfolder: null }]
    const builder = setupSupabase({ list: { data: rows, error: null } })
    const { result } = setup()
    await flushLoad()
    builder.upsert.mockClear()

    await act(async () => {
      await result.current.switchDraft('d1')
    })

    expect(builder.upsert).not.toHaveBeenCalled()
  })
})

describe('useDrafts — deleteDraft', () => {
  it('deletes from Supabase, clears blobs, and switches to the next draft when active', async () => {
    const rows = [
      { id: 'd1', title: 'T1', content: 'C1', module_id: null, subfolder: null },
      { id: 'd2', title: 'T2', content: 'C2', module_id: null, subfolder: null },
    ]
    const builder = setupSupabase({ list: { data: rows, error: null } })
    const { result } = setup()
    await flushLoad()

    await act(async () => {
      await result.current.deleteDraft('d1')
    })

    expect(builder.delete).toHaveBeenCalled()
    expect(builder.eq).toHaveBeenCalledWith('id', 'd1')
    expect(clearDraftBlobs).toHaveBeenCalledWith('d1')
    expect(result.current.drafts.map((d) => d.id)).toEqual(['d2'])
    expect(result.current.activeDraftId).toBe('d2')
  })

  it('clears the editor when the last draft is deleted', async () => {
    const rows = [{ id: 'd1', title: 'T1', content: 'C1', module_id: null, subfolder: null }]
    setupSupabase({ list: { data: rows, error: null } })
    const { result } = setup()
    await flushLoad()

    await act(async () => {
      await result.current.deleteDraft('d1')
    })

    expect(result.current.drafts).toEqual([])
    expect(result.current.activeDraftId).toBeNull()
    expect(STABLE.setContent).toHaveBeenLastCalledWith('')
  })

  it('does not resurrect the deleted active draft via the switchDraft → flushSave path (Issue #4)', async () => {
    const rows = [
      { id: 'd1', title: 'T1', content: 'C1', module_id: null, subfolder: null },
      { id: 'd2', title: 'T2', content: 'C2', module_id: null, subfolder: null },
    ]
    const builder = setupSupabase({ list: { data: rows, error: null }, upsert: { data: null, error: null } })
    const { result } = setup()
    await flushLoad()
    builder.upsert.mockClear()

    // Delete the active draft (d1). Internally this switches to d2, which runs
    // flushSave first — that flush must NOT upsert the just-deleted d1.
    await act(async () => {
      await result.current.deleteDraft('d1')
    })

    const resurrected = builder.upsert.mock.calls.some(([payload]) => payload?.id === 'd1')
    expect(resurrected).toBe(false)
    expect(result.current.activeDraftId).toBe('d2')
    expect(result.current.drafts.map((d) => d.id)).toEqual(['d2'])
  })
})

describe('useDrafts — renameDraft', () => {
  it('updates Supabase and the local draft list', async () => {
    const rows = [{ id: 'd1', draft_name: 'Old', title: '', content: '', module_id: null, subfolder: null }]
    const builder = setupSupabase({ list: { data: rows, error: null } })
    const { result } = setup()
    await flushLoad()

    await act(async () => {
      await result.current.renameDraft('d1', 'New name')
    })

    expect(builder.update).toHaveBeenCalledWith({ draft_name: 'New name' })
    expect(builder.eq).toHaveBeenCalledWith('id', 'd1')
    expect(result.current.drafts[0].draft_name).toBe('New name')
  })
})

describe('useDrafts — clearActiveDraft', () => {
  it('removes the active draft and switches to a remaining one', async () => {
    const rows = [
      { id: 'd1', title: 'T1', content: 'C1', module_id: null, subfolder: null },
      { id: 'd2', title: 'T2', content: 'C2', module_id: null, subfolder: null },
    ]
    const builder = setupSupabase({ list: { data: rows, error: null } })
    const { result } = setup()
    await flushLoad()

    await act(async () => {
      await result.current.clearActiveDraft()
    })

    expect(builder.delete).toHaveBeenCalled()
    expect(result.current.drafts.map((d) => d.id)).toEqual(['d2'])
    expect(result.current.activeDraftId).toBe('d2')
  })

  it('clears the editor when no drafts remain', async () => {
    const rows = [{ id: 'd1', title: 'T1', content: 'C1', module_id: null, subfolder: null }]
    setupSupabase({ list: { data: rows, error: null } })
    const { result } = setup()
    await flushLoad()

    await act(async () => {
      await result.current.clearActiveDraft()
    })

    expect(result.current.drafts).toEqual([])
    expect(result.current.activeDraftId).toBeNull()
  })

  it('does not resurrect the just-published draft via the switchDraft → flushSave path (Issue #4)', async () => {
    const rows = [
      { id: 'd1', title: 'T1', content: 'C1', module_id: null, subfolder: null },
      { id: 'd2', title: 'T2', content: 'C2', module_id: null, subfolder: null },
    ]
    const builder = setupSupabase({ list: { data: rows, error: null }, upsert: { data: null, error: null } })
    const { result } = setup()
    await flushLoad()
    builder.upsert.mockClear()

    await act(async () => {
      await result.current.clearActiveDraft()
    })

    const resurrected = builder.upsert.mock.calls.some(([payload]) => payload?.id === 'd1')
    expect(resurrected).toBe(false)
    expect(result.current.activeDraftId).toBe('d2')
    expect(result.current.drafts.map((d) => d.id)).toEqual(['d2'])
  })
})

describe('useDrafts — localStorage auto-save', () => {
  it('writes the active draft to localStorage after the 800ms debounce', async () => {
    setupSupabase({ list: { data: [{ id: 'd1', title: 'T', content: 'C', module_id: null, subfolder: null }], error: null } })
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const { rerender, base } = setup()
    await flushLoad()
    // Let the effect commit the new debounce timer before advancing the clock.
    await act(async () => {
      rerender({ ...base, content: 'edited' })
    })
    setItem.mockClear()

    await act(async () => {
      vi.advanceTimersByTime(800)
    })

    const call = setItem.mock.calls.find(([key]) => key === 'admin-draft-d1')
    expect(call).toBeTruthy()
    const payload = JSON.parse(call[1])
    expect(payload).toMatchObject({ draftId: 'd1', content: 'edited' })
  })
})

describe('useDrafts — Supabase 30s auto-save', () => {
  it('upserts the active draft after 30s of inactivity', async () => {
    const builder = setupSupabase({
      list: { data: [{ id: 'd1', title: 'T', content: 'C', module_id: null, subfolder: null }], error: null },
      upsert: { data: null, error: null },
    })
    const { result } = setup()
    await flushLoad()
    builder.upsert.mockClear()

    await act(async () => {
      vi.advanceTimersByTime(30_000)
      await Promise.resolve()
    })

    expect(builder.upsert).toHaveBeenCalledTimes(1)
    expect(result.current.saveStatus).toBe('saved')
  })
})
