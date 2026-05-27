import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

vi.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
    isDragActive: false,
  }),
}))

vi.mock('../lib/draftDB', () => ({
  saveImageBlob: vi.fn(async () => {}),
  restoreDraftBlobs: vi.fn(async () => ({})),
  nextImageKey: vi.fn((draftId, ext) => `${draftId}:img-1.${ext}`),
  clearAllImageBlobs: vi.fn(async () => {}),
}))

// uploadImage lives in githubApi — mock it so we can assert it is never called
vi.mock('../lib/githubApi', () => ({
  uploadImage: vi.fn(async () => {}),
  listDirectory: vi.fn(async () => []),
}))

import { saveImageBlob, restoreDraftBlobs, nextImageKey } from '../lib/draftDB'
import { uploadImage } from '../lib/githubApi'
import { useEditorImages } from './useEditorImages.js'

function makeEditor() {
  return {
    executeEdits: vi.fn(),
    getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 })),
    setPosition: vi.fn(),
    focus: vi.fn(),
  }
}

function setup({ selectedPath = { moduleId: 'm1', subfolder: 's1' }, editor = makeEditor(), activeDraftId = 'draft-1' } = {}) {
  const showToast = vi.fn()
  const setContent = vi.fn()
  const editorRef = { current: editor }
  const fileInputRef = { current: null }

  const { result } = renderHook(() =>
    useEditorImages({ selectedPath, showToast, editorRef, fileInputRef, setContent, activeDraftId })
  )

  return { result, showToast, setContent, editorRef, editor }
}

beforeEach(() => {
  vi.clearAllMocks()
  restoreDraftBlobs.mockResolvedValue({})
  nextImageKey.mockImplementation((draftId, ext) => `${draftId}:img-1.${ext}`)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('handleImageUpload', () => {
  it('calls saveImageBlob with a draft-scoped key from nextImageKey and the file', async () => {
    const { result } = setup({ activeDraftId: 'draft-1' })
    const file = new File(['x'], 'photo.png', { type: 'image/png' })

    await act(async () => {
      await result.current.handleImageUpload(file)
    })

    expect(nextImageKey).toHaveBeenCalledWith('draft-1', 'png')
    expect(saveImageBlob).toHaveBeenCalledTimes(1)
    const [key, passedFile] = saveImageBlob.mock.calls[0]
    expect(key).toBe('draft-1:img-1.png')
    expect(passedFile).toBe(file)
  })

  it('adds the file to imageQueueRef.current under the draftKey', async () => {
    const { result } = setup({ activeDraftId: 'draft-1' })
    const file = new File(['x'], 'photo.png', { type: 'image/png' })

    await act(async () => {
      await result.current.handleImageUpload(file)
    })

    const queue = result.current.imageQueueRef.current
    expect(queue['draft-1:img-1.png']).toEqual({ file, ext: 'png' })
  })

  it('inserts draft:// placeholder into editor at cursor position', async () => {
    const { result, editor } = setup({ activeDraftId: 'draft-1' })
    const file = new File(['x'], 'photo.png', { type: 'image/png' })

    await act(async () => {
      await result.current.handleImageUpload(file)
    })

    expect(editor.executeEdits).toHaveBeenCalledTimes(1)
    const edits = editor.executeEdits.mock.calls[0][1]
    expect(edits[0].text).toBe('![image](draft://draft-1:img-1.png)')
    expect(edits[0].range).toMatchObject({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 1,
    })
  })

  it('shows error toast when selectedPath is null', async () => {
    const { result, showToast } = setup({ selectedPath: null })
    const file = new File(['x'], 'photo.png', { type: 'image/png' })

    await act(async () => {
      await result.current.handleImageUpload(file)
    })

    expect(showToast).toHaveBeenCalledWith('Please select a directory first', 'error')
    expect(saveImageBlob).not.toHaveBeenCalled()
  })

  it('does NOT call uploadImage (images must not upload immediately)', async () => {
    const { result } = setup()
    const file = new File(['x'], 'photo.png', { type: 'image/png' })

    await act(async () => {
      await result.current.handleImageUpload(file)
    })

    expect(uploadImage).not.toHaveBeenCalled()
  })
})

describe('queue restore on mount', () => {
  it('calls restoreDraftBlobs on mount with the active draft id', async () => {
    setup({ activeDraftId: 'draft-7' })

    await act(async () => {
      await Promise.resolve()
    })

    expect(restoreDraftBlobs).toHaveBeenCalledWith('draft-7')
  })

  it('does not restore when there is no active draft', async () => {
    setup({ activeDraftId: null })

    await act(async () => {
      await Promise.resolve()
    })

    expect(restoreDraftBlobs).not.toHaveBeenCalled()
  })

  it('populates imageQueueRef.current with the blobs returned by restoreDraftBlobs', async () => {
    const blob = new Blob(['x'])
    restoreDraftBlobs.mockResolvedValue({
      'draft-1:img-1.png': { file: blob, ext: 'png' },
    })

    const { result } = setup({ activeDraftId: 'draft-1' })

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(result.current.imageQueueRef.current['draft-1:img-1.png']).toEqual({
      file: blob,
      ext: 'png',
    })
  })
})
