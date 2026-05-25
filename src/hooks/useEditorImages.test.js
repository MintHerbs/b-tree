import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

vi.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
    isDragActive: false,
  }),
}))

import { useEditorImages } from './useEditorImages.js'

beforeEach(() => {
  vi.restoreAllMocks()
  globalThis.fetch = vi.fn()
})

describe('handleImageUpload', () => {
  it('adds image to imageQueueRef and does NOT call uploadImage', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(123)

    const showToast = vi.fn()
    const editorRef = { current: null }
    const fileInputRef = { current: null }
    const setContent = vi.fn()

    const { result } = renderHook(() =>
      useEditorImages({
        selectedPath: { moduleId: 'm', subfolder: 's' },
        showToast,
        editorRef,
        fileInputRef,
        setContent,
      })
    )

    const file = new File(['x'], 'image.png', { type: 'image/png' })

    await act(async () => {
      await result.current.handleImageUpload(file)
    })

    expect(result.current.imageQueueRef.current).toEqual({
      'draft-img-123.png': { file, ext: 'png' },
    })
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('inserts draft:// placeholder into editor content', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(123)

    const showToast = vi.fn()
    const editor = {
      getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 })),
      executeEdits: vi.fn(),
      setPosition: vi.fn(),
      focus: vi.fn(),
    }
    const editorRef = { current: editor }
    const fileInputRef = { current: null }
    const setContent = vi.fn()

    const { result } = renderHook(() =>
      useEditorImages({
        selectedPath: { moduleId: 'm', subfolder: 's' },
        showToast,
        editorRef,
        fileInputRef,
        setContent,
      })
    )

    const file = new File(['x'], 'image.png', { type: 'image/png' })

    await act(async () => {
      await result.current.handleImageUpload(file)
    })

    const calls = editor.executeEdits.mock.calls
    expect(calls.length).toBe(1)
    expect(calls[0][1][0].text).toContain('draft://draft-img-123.png')
  })

  it('shows error toast when no selectedPath is set', async () => {
    const showToast = vi.fn()
    const editorRef = { current: null }
    const fileInputRef = { current: null }
    const setContent = vi.fn()

    const { result } = renderHook(() =>
      useEditorImages({
        selectedPath: null,
        showToast,
        editorRef,
        fileInputRef,
        setContent,
      })
    )

    const file = new File(['x'], 'image.png', { type: 'image/png' })

    await act(async () => {
      await result.current.handleImageUpload(file)
    })

    expect(showToast).toHaveBeenCalledWith('Please select a directory first', 'error')
    expect(result.current.imageQueueRef.current).toEqual({})
  })
})

