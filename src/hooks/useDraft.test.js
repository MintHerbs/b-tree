import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '../lib/supabaseClient'
import { useDraft } from './useDraft.js'
import { extractDraftKeys, nextImageKey } from '../lib/draftDB.js'

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  localStorage.clear()
  vi.spyOn(Storage.prototype, 'getItem')
  vi.spyOn(Storage.prototype, 'setItem')
  vi.spyOn(Storage.prototype, 'removeItem')
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

function setupSupabaseDraftSelect({ data }) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn(async () => ({ data })),
    upsert: vi.fn(async () => ({ data: null, error: null })),
    delete: vi.fn(() => query),
  }

  supabase.from.mockImplementation(() => query)
  return query
}

describe('useDraft — restore', () => {
  it('Restores title, content, selectedPath from localStorage on mount when localStorage has a valid draft', async () => {
    const setTitle = vi.fn()
    const setContent = vi.fn()
    const setSelectedPath = vi.fn()

    Storage.prototype.getItem.mockImplementation((key) => {
      if (key !== 'admin-draft') return null
      return JSON.stringify({
        title: 'T1',
        content: 'C1',
        selectedPath: { moduleId: 'm1', subfolder: 's1' },
      })
    })

    setupSupabaseDraftSelect({ data: { title: 'S', content: 'SC', module_id: 'm2', subfolder: 'sf' } })

    renderHook(() =>
      useDraft({
        userId: 'u1',
        title: '',
        content: '',
        selectedPath: null,
        setTitle,
        setContent,
        setSelectedPath,
      })
    )

    await act(async () => {})

    expect(setTitle).toHaveBeenCalledWith('T1')
    expect(setContent).toHaveBeenCalledWith('C1')
    expect(setSelectedPath).toHaveBeenCalledWith({ moduleId: 'm1', subfolder: 's1' })
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('Falls back to Supabase when localStorage is empty', async () => {
    const setTitle = vi.fn()
    const setContent = vi.fn()
    const setSelectedPath = vi.fn()

    Storage.prototype.getItem.mockReturnValue(null)
    const query = setupSupabaseDraftSelect({
      data: { title: 'ST', content: 'SC', module_id: 'm2', subfolder: 'sf' },
    })

    renderHook(() =>
      useDraft({
        userId: 'u1',
        title: '',
        content: '',
        selectedPath: null,
        setTitle,
        setContent,
        setSelectedPath,
      })
    )

    await act(async () => {
      await Promise.resolve()
    })

    expect(supabase.from).toHaveBeenCalledWith('drafts')
    expect(query.maybeSingle).toHaveBeenCalledTimes(1)
    expect(setTitle).toHaveBeenCalledWith('ST')
    expect(setContent).toHaveBeenCalledWith('SC')
    expect(setSelectedPath).toHaveBeenCalledWith({ moduleId: 'm2', subfolder: 'sf' })
  })

  it('Does not restore if localStorage JSON is malformed — clears the key and continues to Supabase fallback', async () => {
    const setTitle = vi.fn()
    const setContent = vi.fn()
    const setSelectedPath = vi.fn()

    Storage.prototype.getItem.mockReturnValue('{bad json')
    const query = setupSupabaseDraftSelect({
      data: { title: 'ST', content: 'SC', module_id: null, subfolder: null },
    })

    renderHook(() =>
      useDraft({
        userId: 'u1',
        title: '',
        content: '',
        selectedPath: null,
        setTitle,
        setContent,
        setSelectedPath,
      })
    )

    await act(async () => {
      await Promise.resolve()
    })

    expect(Storage.prototype.removeItem).toHaveBeenCalledWith('admin-draft')
    expect(supabase.from).toHaveBeenCalledWith('drafts')
    expect(query.maybeSingle).toHaveBeenCalledTimes(1)
  })

  it('Does not run restore more than once even if dependencies change', async () => {
    const setTitle1 = vi.fn()
    const setContent1 = vi.fn()
    const setSelectedPath1 = vi.fn()

    Storage.prototype.getItem.mockReturnValue(null)
    const query = setupSupabaseDraftSelect({ data: null })

    const { rerender } = renderHook((props) => useDraft(props), {
      initialProps: {
        userId: 'u1',
        title: '',
        content: '',
        selectedPath: null,
        setTitle: setTitle1,
        setContent: setContent1,
        setSelectedPath: setSelectedPath1,
      },
    })

    await act(async () => {
      await Promise.resolve()
    })

    rerender({
      userId: 'u1',
      title: '',
      content: '',
      selectedPath: null,
      setTitle: vi.fn(),
      setContent: vi.fn(),
      setSelectedPath: vi.fn(),
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(Storage.prototype.getItem).toHaveBeenCalledTimes(1)
    expect(supabase.from).toHaveBeenCalledTimes(1)
    expect(query.maybeSingle).toHaveBeenCalledTimes(1)
  })
})

describe('useDraft — save to localStorage', () => {
  it("Calls localStorage.setItem with correct key 'admin-draft' after 800ms debounce when title changes", async () => {
    const setTitle = vi.fn()
    const setContent = vi.fn()
    const setSelectedPath = vi.fn()

    Storage.prototype.getItem.mockImplementation((key) => {
      if (key !== 'admin-draft') return null
      return JSON.stringify({ title: 'restored', content: 'x', selectedPath: null })
    })

    const { rerender } = renderHook((props) => useDraft(props), {
      initialProps: {
        userId: 'u1',
        title: 'A',
        content: 'C',
        selectedPath: null,
        setTitle,
        setContent,
        setSelectedPath,
      },
    })

    await act(async () => {
      vi.advanceTimersByTime(400)
    })

    rerender({
      userId: 'u1',
      title: 'B',
      content: 'C',
      selectedPath: null,
      setTitle,
      setContent,
      setSelectedPath,
    })

    await act(async () => {
      vi.advanceTimersByTime(800)
    })

    expect(Storage.prototype.setItem).toHaveBeenCalledTimes(1)
    expect(Storage.prototype.setItem.mock.calls[0][0]).toBe('admin-draft')
    const payload = JSON.parse(Storage.prototype.setItem.mock.calls[0][1])
    expect(payload).toMatchObject({ title: 'B', content: 'C', selectedPath: null })
  })

  it('Does not save before restore has completed (initialized ref)', async () => {
    const setTitle = vi.fn()
    const setContent = vi.fn()
    const setSelectedPath = vi.fn()

    Storage.prototype.getItem.mockReturnValue(null)

    let resolveMaybeSingle
    const maybeSinglePromise = new Promise((resolve) => {
      resolveMaybeSingle = resolve
    })

    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(() => maybeSinglePromise),
      upsert: vi.fn(async () => ({ data: null, error: null })),
      delete: vi.fn(() => query),
    }
    supabase.from.mockImplementation(() => query)

    const { rerender } = renderHook((props) => useDraft(props), {
      initialProps: {
        userId: 'u1',
        title: 'A',
        content: 'C',
        selectedPath: null,
        setTitle,
        setContent,
        setSelectedPath,
      },
    })

    rerender({
      userId: 'u1',
      title: 'B',
      content: 'C',
      selectedPath: null,
      setTitle,
      setContent,
      setSelectedPath,
    })

    await act(async () => {
      vi.advanceTimersByTime(800)
    })

    expect(Storage.prototype.setItem).not.toHaveBeenCalled()

    resolveMaybeSingle({ data: null })
    await act(async () => {
      await Promise.resolve()
    })
  })

  it('Debounce resets if title changes again within 800ms', async () => {
    const setTitle = vi.fn()
    const setContent = vi.fn()
    const setSelectedPath = vi.fn()

    Storage.prototype.getItem.mockImplementation((key) => {
      if (key !== 'admin-draft') return null
      return JSON.stringify({ title: 'restored', content: 'x', selectedPath: null })
    })

    const { rerender } = renderHook((props) => useDraft(props), {
      initialProps: {
        userId: 'u1',
        title: 'A',
        content: 'C',
        selectedPath: null,
        setTitle,
        setContent,
        setSelectedPath,
      },
    })

    await act(async () => {
      vi.advanceTimersByTime(400)
    })

    rerender({
      userId: 'u1',
      title: 'B',
      content: 'C',
      selectedPath: null,
      setTitle,
      setContent,
      setSelectedPath,
    })

    await act(async () => {
      vi.advanceTimersByTime(400)
    })

    rerender({
      userId: 'u1',
      title: 'C',
      content: 'C',
      selectedPath: null,
      setTitle,
      setContent,
      setSelectedPath,
    })

    await act(async () => {
      vi.advanceTimersByTime(800)
    })

    expect(Storage.prototype.setItem).toHaveBeenCalledTimes(1)
    const payload = JSON.parse(Storage.prototype.setItem.mock.calls[0][1])
    expect(payload.title).toBe('C')
  })
})

describe('useDraft — save to Supabase', () => {
  it('Calls supabase upsert after 30 seconds of inactivity', async () => {
    const setTitle = vi.fn()
    const setContent = vi.fn()
    const setSelectedPath = vi.fn()

    Storage.prototype.getItem.mockImplementation((key) => {
      if (key !== 'admin-draft') return null
      return JSON.stringify({ title: 'restored', content: 'x', selectedPath: null })
    })

    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({ data: null })),
      upsert: vi.fn(async () => ({ data: null, error: null })),
      delete: vi.fn(() => query),
    }
    supabase.from.mockImplementation(() => query)

    renderHook(() =>
      useDraft({
        userId: 'u1',
        title: 'T',
        content: 'C',
        selectedPath: { moduleId: 'm1', subfolder: 's1' },
        setTitle,
        setContent,
        setSelectedPath,
      })
    )

    await act(async () => {
      vi.advanceTimersByTime(30_000)
    })

    expect(supabase.from).toHaveBeenCalledWith('drafts')
    expect(query.upsert).toHaveBeenCalledTimes(1)
  })

  it('Includes correct fields: user_id, title, content, module_id, subfolder, updated_at', async () => {
    const setTitle = vi.fn()
    const setContent = vi.fn()
    const setSelectedPath = vi.fn()

    Storage.prototype.getItem.mockImplementation((key) => {
      if (key !== 'admin-draft') return null
      return JSON.stringify({ title: 'restored', content: 'x', selectedPath: null })
    })

    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({ data: null })),
      upsert: vi.fn(async () => ({ data: null, error: null })),
      delete: vi.fn(() => query),
    }
    supabase.from.mockImplementation(() => query)

    renderHook(() =>
      useDraft({
        userId: 'u1',
        title: 'T',
        content: 'C',
        selectedPath: { moduleId: 'm1', subfolder: 's1' },
        setTitle,
        setContent,
        setSelectedPath,
      })
    )

    await act(async () => {
      vi.advanceTimersByTime(30_000)
    })

    expect(query.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'u1',
        title: 'T',
        content: 'C',
        module_id: 'm1',
        subfolder: 's1',
        updated_at: expect.any(String),
      }),
      { onConflict: 'user_id' }
    )
  })

  it('Does not call supabase if userId is null', async () => {
    const setTitle = vi.fn()
    const setContent = vi.fn()
    const setSelectedPath = vi.fn()

    Storage.prototype.getItem.mockReturnValue(null)

    renderHook(() =>
      useDraft({
        userId: null,
        title: 'T',
        content: 'C',
        selectedPath: { moduleId: 'm1', subfolder: 's1' },
        setTitle,
        setContent,
        setSelectedPath,
      })
    )

    await act(async () => {
      vi.advanceTimersByTime(30_000)
    })

    expect(supabase.from).not.toHaveBeenCalled()
  })
})

describe('useDraft — clearDraft', () => {
  it("Removes 'admin-draft' from localStorage", async () => {
    const setTitle = vi.fn()
    const setContent = vi.fn()
    const setSelectedPath = vi.fn()

    Storage.prototype.getItem.mockImplementation((key) => {
      if (key !== 'admin-draft') return null
      return JSON.stringify({ title: 'restored', content: 'x', selectedPath: null })
    })

    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({ data: null })),
      upsert: vi.fn(async () => ({ data: null, error: null })),
      delete: vi.fn(() => query),
    }
    supabase.from.mockImplementation(() => query)

    const { result } = renderHook(() =>
      useDraft({
        userId: 'u1',
        title: 'T',
        content: 'C',
        selectedPath: null,
        setTitle,
        setContent,
        setSelectedPath,
      })
    )

    await act(async () => {
      await result.current.clearDraft()
    })

    expect(Storage.prototype.removeItem).toHaveBeenCalledWith('admin-draft')
  })

  it('Calls supabase delete with correct user_id filter', async () => {
    const setTitle = vi.fn()
    const setContent = vi.fn()
    const setSelectedPath = vi.fn()

    Storage.prototype.getItem.mockImplementation((key) => {
      if (key !== 'admin-draft') return null
      return JSON.stringify({ title: 'restored', content: 'x', selectedPath: null })
    })

    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({ data: null })),
      upsert: vi.fn(async () => ({ data: null, error: null })),
      delete: vi.fn(() => query),
    }
    supabase.from.mockImplementation(() => query)

    const { result } = renderHook(() =>
      useDraft({
        userId: 'u1',
        title: 'T',
        content: 'C',
        selectedPath: null,
        setTitle,
        setContent,
        setSelectedPath,
      })
    )

    await act(async () => {
      await result.current.clearDraft()
    })

    expect(supabase.from).toHaveBeenCalledWith('drafts')
    expect(query.delete).toHaveBeenCalledTimes(1)
    expect(query.eq).toHaveBeenCalledWith('user_id', 'u1')
  })
})

describe('useDraft — saveDraftNow', () => {
  it("Calls localStorage.setItem with key 'admin-draft' and correct JSON immediately (no debounce)", async () => {
    const setTitle = vi.fn()
    const setContent = vi.fn()
    const setSelectedPath = vi.fn()

    Storage.prototype.getItem.mockImplementation((key) => {
      if (key !== 'admin-draft') return null
      return JSON.stringify({ title: 'restored', content: 'x', selectedPath: null })
    })

    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({ data: null })),
      upsert: vi.fn(async () => ({ data: null, error: null })),
      delete: vi.fn(() => query),
    }
    supabase.from.mockImplementation(() => query)

    const { result } = renderHook(() =>
      useDraft({
        userId: 'u1',
        title: 'T',
        content: 'C',
        selectedPath: { moduleId: 'm1', subfolder: 's1' },
        setTitle,
        setContent,
        setSelectedPath,
      })
    )

    Storage.prototype.setItem.mockClear()

    await act(async () => {
      await result.current.saveDraftNow()
    })

    expect(Storage.prototype.setItem).toHaveBeenCalledTimes(1)
    expect(Storage.prototype.setItem.mock.calls[0][0]).toBe('admin-draft')
    const payload = JSON.parse(Storage.prototype.setItem.mock.calls[0][1])
    expect(payload).toEqual({
      title: 'T',
      content: 'C',
      selectedPath: { moduleId: 'm1', subfolder: 's1' },
    })
  })

  it('Calls supabase upsert with correct fields immediately', async () => {
    const setTitle = vi.fn()
    const setContent = vi.fn()
    const setSelectedPath = vi.fn()

    Storage.prototype.getItem.mockImplementation((key) => {
      if (key !== 'admin-draft') return null
      return JSON.stringify({ title: 'restored', content: 'x', selectedPath: null })
    })

    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({ data: null })),
      upsert: vi.fn(async () => ({ data: null, error: null })),
      delete: vi.fn(() => query),
    }
    supabase.from.mockImplementation(() => query)

    const { result } = renderHook(() =>
      useDraft({
        userId: 'u1',
        title: 'T',
        content: 'C',
        selectedPath: { moduleId: 'm1', subfolder: 's1' },
        setTitle,
        setContent,
        setSelectedPath,
      })
    )

    await act(async () => {
      await result.current.saveDraftNow()
    })

    expect(supabase.from).toHaveBeenCalledWith('drafts')
    expect(query.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'u1',
        title: 'T',
        content: 'C',
        module_id: 'm1',
        subfolder: 's1',
        updated_at: expect.any(String),
      }),
      { onConflict: 'user_id' }
    )
  })

  it('Does not call supabase if userId is null', async () => {
    const setTitle = vi.fn()
    const setContent = vi.fn()
    const setSelectedPath = vi.fn()

    Storage.prototype.getItem.mockReturnValue(null)

    const { result } = renderHook(() =>
      useDraft({
        userId: null,
        title: 'T',
        content: 'C',
        selectedPath: { moduleId: 'm1', subfolder: 's1' },
        setTitle,
        setContent,
        setSelectedPath,
      })
    )

    await act(async () => {
      await result.current.saveDraftNow()
    })

    expect(supabase.from).not.toHaveBeenCalled()
    expect(Storage.prototype.setItem).toHaveBeenCalledWith(
      'admin-draft',
      expect.any(String)
    )
  })
})

describe('draftDB — image queue', () => {
  it('nextImageKey falls back to the legacy draftId on first call', () => {
    expect(nextImageKey('png')).toBe('legacy:img-1.png')
  })

  it('nextImageKey increments the legacy counter on the second call', () => {
    nextImageKey('png')
    expect(nextImageKey('png')).toBe('legacy:img-2.png')
  })

  it('extractDraftKeys returns correct keys from markdown with multiple draft:// references', () => {
    const md = [
      '![a](draft://img-1.png)',
      '![b](draft://img-2.jpg)',
      '![c](draft://img-1.png)',
    ].join('\n')

    expect(extractDraftKeys(md)).toEqual(['img-1.png', 'img-2.jpg'])
  })

  it('extractDraftKeys returns empty array when no draft:// in markdown', () => {
    expect(extractDraftKeys('![a](/notes/img/1.png)')).toEqual([])
  })
})

