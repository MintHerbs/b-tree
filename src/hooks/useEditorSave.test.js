import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

vi.mock('../lib/githubApi', () => ({
  listDirectory: vi.fn(),
  uploadImage: vi.fn(),
  commitFile: vi.fn(),
  commitFileWithRetry: vi.fn(),
  getFileContent: vi.fn(),
}))

vi.mock('../lib/draftDB', () => ({ clearAllImageBlobs: vi.fn() }))

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn(async () => ({ data: null, error: null })),
    })),
  },
}))

import { useEditorSave } from './useEditorSave.js'
import { commitFile, commitFileWithRetry, getFileContent, listDirectory, uploadImage } from '../lib/githubApi'
import { clearAllImageBlobs } from '../lib/draftDB'
import { supabase } from '../lib/supabaseClient'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('handleSave', () => {
  it('resolves all draft:// URLs before committing markdown', async () => {
    const showToast = vi.fn()
    const setSaving = vi.fn()
    const setUnsaved = vi.fn()
    const setJustPublished = vi.fn()
    const setTitle = vi.fn()
    const setContent = vi.fn()
    const setSelectedPath = vi.fn()

    listDirectory.mockResolvedValueOnce([{ name: '1.png' }, { name: '2.png' }])
    uploadImage.mockResolvedValue({})
    commitFile.mockResolvedValue({ content: { sha: 'sha123' } })
    getFileContent.mockResolvedValue(
      [
        "import {",
        "  FileCode,",
        "} from '@phosphor-icons/react'",
        '',
        'export const modules = [',
        '  {',
        "    id: 'm1',",
        "    label: 'M1',",
        '    Icon: FileCode,',
        '    notes: [',
        '    ],',
        '  },',
        ']',
      ].join('\n')
    )
    commitFileWithRetry.mockResolvedValue({})

    const imageQueueRef = {
      current: {
        k1: { file: { arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1)) }, ext: 'png' },
        k2: { file: { arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1)) }, ext: 'jpg' },
      },
    }
    const imageCountRef = { current: {} }

    const { result } = renderHook(() =>
      useEditorSave({
        userId: 'u1',
        title: 'My Title',
        content: 'a ![x](draft://k1) b ![y](draft://k2)',
        selectedPath: { moduleId: 'm1', subfolder: 'notes' },
        selectedCourse: 'course1',
        showToast,
        setSaving,
        setUnsaved,
        setJustPublished,
        setTitle,
        setContent,
        setSelectedPath,
        imageQueueRef,
        imageCountRef,
      })
    )

    await act(async () => {
      await result.current.handleSave()
    })

    expect(commitFile).toHaveBeenCalledTimes(1)
    const committedContent = commitFile.mock.calls[0][1]
    expect(committedContent).not.toContain('draft://k1')
    expect(committedContent).not.toContain('draft://k2')
    expect(committedContent).toContain('/notes/img/course1/m1/3.png')
    expect(committedContent).toContain('/notes/img/course1/m1/4.jpg')
  })

  it('calls uploadImage for each queued image', async () => {
    const showToast = vi.fn()
    const setSaving = vi.fn()
    const setUnsaved = vi.fn()
    const setJustPublished = vi.fn()
    const setTitle = vi.fn()
    const setContent = vi.fn()
    const setSelectedPath = vi.fn()

    listDirectory.mockResolvedValueOnce([])
    uploadImage.mockResolvedValue({})
    commitFile.mockResolvedValue({ content: { sha: 'sha123' } })
    getFileContent.mockResolvedValue(
      [
        "import {",
        "  FileCode,",
        "} from '@phosphor-icons/react'",
        '',
        'export const modules = [',
        '  {',
        "    id: 'm1',",
        "    label: 'M1',",
        '    Icon: FileCode,',
        '  },',
        ']',
      ].join('\n')
    )
    commitFileWithRetry.mockResolvedValue({})

    const imageQueueRef = {
      current: {
        k1: { file: { arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1)) }, ext: 'png' },
        k2: { file: { arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1)) }, ext: 'png' },
      },
    }
    const imageCountRef = { current: {} }

    const { result } = renderHook(() =>
      useEditorSave({
        userId: 'u1',
        title: 'My Title',
        content: '![x](draft://k1) ![y](draft://k2)',
        selectedPath: { moduleId: 'm1', subfolder: 'notes' },
        selectedCourse: 'course1',
        showToast,
        setSaving,
        setUnsaved,
        setJustPublished,
        setTitle,
        setContent,
        setSelectedPath,
        imageQueueRef,
        imageCountRef,
      })
    )

    await act(async () => {
      await result.current.handleSave()
    })

    expect(uploadImage).toHaveBeenCalledTimes(2)
  })

  it('calls commitFileWithRetry for modules.js', async () => {
    const showToast = vi.fn()
    const setSaving = vi.fn()
    const setUnsaved = vi.fn()
    const setJustPublished = vi.fn()
    const setTitle = vi.fn()
    const setContent = vi.fn()
    const setSelectedPath = vi.fn()

    listDirectory.mockResolvedValueOnce([])
    uploadImage.mockResolvedValue({})
    commitFile.mockResolvedValue({ content: { sha: 'sha123' } })
    getFileContent.mockResolvedValue(
      [
        "import {",
        "  FileCode,",
        "} from '@phosphor-icons/react'",
        '',
        'export const modules = [',
        '  {',
        "    id: 'm1',",
        "    label: 'M1',",
        '    Icon: FileCode,',
        '  },',
        ']',
      ].join('\n')
    )
    commitFileWithRetry.mockResolvedValue({})

    const imageQueueRef = { current: {} }
    const imageCountRef = { current: {} }

    const { result } = renderHook(() =>
      useEditorSave({
        userId: 'u1',
        title: 'My Title',
        content: 'hello',
        selectedPath: { moduleId: 'm1', subfolder: 'notes' },
        selectedCourse: 'course1',
        showToast,
        setSaving,
        setUnsaved,
        setJustPublished,
        setTitle,
        setContent,
        setSelectedPath,
        imageQueueRef,
        imageCountRef,
      })
    )

    await act(async () => {
      await result.current.handleSave()
    })

    expect(commitFileWithRetry).toHaveBeenCalledTimes(1)
    expect(commitFileWithRetry.mock.calls[0][0]).toBe('src/components/layout/Sidebar/modules.js')
  })

  it('flushes then clears the active draft after a successful publish', async () => {
    const showToast = vi.fn()
    const setSaving = vi.fn()
    const setUnsaved = vi.fn()
    const setJustPublished = vi.fn()
    const setTitle = vi.fn()
    const setContent = vi.fn()
    const setSelectedPath = vi.fn()
    const flushSave = vi.fn(async () => {})
    const clearActiveDraft = vi.fn(async () => {})

    listDirectory.mockResolvedValueOnce([])
    uploadImage.mockResolvedValue({})
    commitFile.mockResolvedValue({ content: { sha: 'sha123' } })
    getFileContent.mockResolvedValue(
      [
        "import {",
        "  FileCode,",
        "} from '@phosphor-icons/react'",
        '',
        'export const modules = [',
        '  {',
        "    id: 'm1',",
        "    label: 'M1',",
        '    Icon: FileCode,',
        '  },',
        ']',
      ].join('\n')
    )
    commitFileWithRetry.mockResolvedValue({})

    const imageQueueRef = { current: {} }
    const imageCountRef = { current: {} }

    const { result } = renderHook(() =>
      useEditorSave({
        userId: 'u1',
        title: 'My Title',
        content: 'hello',
        selectedPath: { moduleId: 'm1', subfolder: 'notes' },
        selectedCourse: 'course1',
        showToast,
        setSaving,
        setUnsaved,
        setJustPublished,
        setTitle,
        setContent,
        setSelectedPath,
        imageQueueRef,
        imageCountRef,
        flushSave,
        clearActiveDraft,
      })
    )

    await act(async () => {
      await result.current.handleSave()
    })

    expect(flushSave).toHaveBeenCalledTimes(1)
    expect(clearActiveDraft).toHaveBeenCalledTimes(1)
  })

  it('shows error toast and does not commit when title is missing', async () => {
    const showToast = vi.fn()
    const setSaving = vi.fn()
    const setUnsaved = vi.fn()
    const setJustPublished = vi.fn()
    const setTitle = vi.fn()
    const setContent = vi.fn()
    const setSelectedPath = vi.fn()

    const imageQueueRef = { current: {} }
    const imageCountRef = { current: {} }

    const { result } = renderHook(() =>
      useEditorSave({
        userId: 'u1',
        title: '   ',
        content: 'hello',
        selectedPath: { moduleId: 'm1', subfolder: 'notes' },
        selectedCourse: 'course1',
        showToast,
        setSaving,
        setUnsaved,
        setJustPublished,
        setTitle,
        setContent,
        setSelectedPath,
        imageQueueRef,
        imageCountRef,
      })
    )

    await act(async () => {
      await result.current.handleSave()
    })

    expect(showToast).toHaveBeenCalledWith('Please enter a title', 'error')
    expect(commitFile).not.toHaveBeenCalled()
    expect(commitFileWithRetry).not.toHaveBeenCalled()
  })

  it('shows error toast and does not commit when selectedPath is missing', async () => {
    const showToast = vi.fn()
    const setSaving = vi.fn()
    const setUnsaved = vi.fn()
    const setJustPublished = vi.fn()
    const setTitle = vi.fn()
    const setContent = vi.fn()
    const setSelectedPath = vi.fn()

    const imageQueueRef = { current: {} }
    const imageCountRef = { current: {} }

    const { result } = renderHook(() =>
      useEditorSave({
        userId: 'u1',
        title: 'My Title',
        content: 'hello',
        selectedPath: null,
        selectedCourse: 'course1',
        showToast,
        setSaving,
        setUnsaved,
        setJustPublished,
        setTitle,
        setContent,
        setSelectedPath,
        imageQueueRef,
        imageCountRef,
      })
    )

    await act(async () => {
      await result.current.handleSave()
    })

    expect(showToast).toHaveBeenCalledWith('Please select a directory', 'error')
    expect(commitFile).not.toHaveBeenCalled()
    expect(commitFileWithRetry).not.toHaveBeenCalled()
  })
})
