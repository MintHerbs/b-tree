import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

vi.mock('../lib/githubApi', () => ({
  commitFile: vi.fn(),
  commitFileWithRetry: vi.fn(),
  getFileContent: vi.fn(),
  deleteFile: vi.fn(),
}))

vi.mock('../components/admin/adminIconOptions', () => ({
  ADMIN_ICON_OPTIONS: [{ name: 'FileCode', label: 'File Code', Icon: () => null }],
  getIconNameForComponent: () => 'FileCode',
  getIconOptionByName: () => ({ name: 'FileCode', label: 'File Code', Icon: () => null }),
}))

import { useEditorModules } from './useEditorModules.js'
import { commitFile, commitFileWithRetry, deleteFile, getFileContent } from '../lib/githubApi'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('handleNewSubfolder', () => {
  it('commits .gitkeep to correct path', async () => {
    const showToast = vi.fn()
    const setModules = vi.fn()
    const setSelectedPath = vi.fn()

    const { result } = renderHook(() =>
      useEditorModules({
        showToast,
        setModules,
        setSelectedPath,
        modules: [],
        profile: { role: 'owner' },
        selectedCourse: 'course1',
        selectedPath: null,
      })
    )

    commitFile.mockResolvedValueOnce({})

    await act(async () => {
      await result.current.handleNewSubfolder('m1', 'unit-1')
    })

    expect(commitFile).toHaveBeenCalledWith(
      'src/content/notes/course1/m1/unit-1/.gitkeep',
      '',
      'feat: add unit-1 to m1'
    )
  })

  it('updates modules.js after creating subfolder', async () => {
    const showToast = vi.fn()
    const setModules = vi.fn()
    const setSelectedPath = vi.fn()

    const { result } = renderHook(() =>
      useEditorModules({
        showToast,
        setModules,
        setSelectedPath,
        modules: [],
        profile: { role: 'owner' },
        selectedCourse: 'course1',
        selectedPath: null,
      })
    )

    commitFile.mockResolvedValueOnce({})

    await act(async () => {
      await result.current.handleNewSubfolder('m1', 'unit-1')
    })

    expect(commitFileWithRetry).toHaveBeenCalled()
  })
})

describe('handleNewModule', () => {
  it('creates default folder structure', async () => {
    const showToast = vi.fn()
    const setModules = vi.fn()
    const setSelectedPath = vi.fn()

    getFileContent.mockResolvedValueOnce(
      [
        "import {",
        "  FileCode,",
        "} from '@phosphor-icons/react'",
        '',
        'export const modules = [',
        ']',
      ].join('\n')
    )
    commitFile.mockResolvedValue({})
    commitFileWithRetry.mockResolvedValue({})

    const { result } = renderHook(() =>
      useEditorModules({
        showToast,
        setModules,
        setSelectedPath,
        modules: [],
        profile: { role: 'owner' },
        selectedCourse: 'course1',
        selectedPath: null,
      })
    )

    await act(async () => {
      await result.current.handleNewModule('My Subject')
    })

    expect(commitFile).toHaveBeenCalledWith(
      'src/content/notes/course1/my-subject/notes/.gitkeep',
      '',
      'feat: create my-subject notes folder'
    )
    expect(commitFile).toHaveBeenCalledWith(
      'src/content/notes/course1/my-subject/tools/.gitkeep',
      '',
      'feat: add tools folder to my-subject'
    )
    expect(commitFileWithRetry).toHaveBeenCalledWith(
      'src/components/layout/Sidebar/modules.js',
      expect.any(String),
      'feat: add my-subject subject'
    )
  })
})
