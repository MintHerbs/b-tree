import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

vi.mock('../lib/githubApi', () => ({
  commitFile: vi.fn(async () => ({})),
  commitFileWithRetry: vi.fn(async () => ({})),
  getFileContent: vi.fn(async () => undefined),
  deleteFile: vi.fn(async () => ({})),
  listDirectory: vi.fn(async () => []),
}))

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      upsert: vi.fn(async () => ({ data: null, error: null })),
      delete: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(async () => ({ data: null })),
    })),
  },
}))

vi.mock('../components/admin/adminIconOptions', () => ({
  ADMIN_ICON_OPTIONS: [{ name: 'FileCode', label: 'File Code', Icon: () => null }],
  getIconNameForComponent: () => 'FileCode',
  getIconOptionByName: () => ({ name: 'FileCode', label: 'File Code', Icon: () => null }),
}))

import { useEditorModules } from './useEditorModules.js'
import { commitFile, commitFileWithRetry, getFileContent, deleteFile, listDirectory } from '../lib/githubApi'

const VALID_MODULES_JS = [
  'import {',
  '  FileCode,',
  "} from '@phosphor-icons/react'",
  '',
  'export const MODULES = [',
  ']',
].join('\n')

function setup(overrides = {}) {
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
      ...overrides,
    })
  )

  return { result, showToast, setModules, setSelectedPath }
}

beforeEach(() => {
  vi.clearAllMocks()
  getFileContent.mockResolvedValue(undefined)
  commitFile.mockResolvedValue({})
  commitFileWithRetry.mockResolvedValue({})
  deleteFile.mockResolvedValue({})
  listDirectory.mockResolvedValue([])
})

describe('handleNewSubfolder', () => {
  it('commits .gitkeep to correct path', async () => {
    const { result } = setup()

    await act(async () => {
      await result.current.handleNewSubfolder('m1', 'unit-1')
    })

    expect(commitFile).toHaveBeenCalledWith(
      'src/content/notes/course1/m1/unit-1/.gitkeep',
      '',
      'feat: add unit-1 to m1'
    )
  })

  it('calls getFileContent with course-root modules.js path (course root only)', async () => {
    const { result } = setup()

    await act(async () => {
      await result.current.handleNewSubfolder('m1', 'unit-1')
    })

    expect(getFileContent).toHaveBeenCalledWith('src/content/notes/course1/modules.js')
  })

  it('calls commitFileWithRetry to update modules.js after creating subfolder', async () => {
    const { result } = setup()

    await act(async () => {
      await result.current.handleNewSubfolder('m1', 'unit-1')
    })

    expect(commitFileWithRetry).toHaveBeenCalledWith(
      'src/content/notes/course1/modules.js',
      expect.any(String),
      'feat: add unit-1 folder to m1'
    )
  })

  it('calls setModules to update local state immediately', async () => {
    const { result, setModules } = setup()

    await act(async () => {
      await result.current.handleNewSubfolder('m1', 'unit-1')
    })

    expect(setModules).toHaveBeenCalled()
  })

  it('shows success toast on completion', async () => {
    const { result, showToast } = setup()

    await act(async () => {
      await result.current.handleNewSubfolder('m1', 'unit-1')
    })

    expect(showToast).toHaveBeenCalledWith('Subfolder unit-1 created', 'success')
  })

  // Regression: getFileContent THROWS on 404 (it does not return undefined),
  // so a course with no modules.js yet must still succeed by creating one.
  // Before the fix the 404 propagated and the whole operation failed.
  it('creates a fresh modules.js when the course has none (getFileContent 404)', async () => {
    getFileContent.mockRejectedValueOnce(
      new Error('Failed to read file (404): Not Found')
    )
    const { result, showToast } = setup()

    await act(async () => {
      await result.current.handleNewSubfolder('m1', 'unit-1')
    })

    // The .gitkeep is still committed for the new subfolder...
    expect(commitFile).toHaveBeenCalledWith(
      'src/content/notes/course1/m1/unit-1/.gitkeep',
      '',
      'feat: add unit-1 to m1'
    )
    // ...and a brand-new modules.js is written at the course root.
    expect(commitFileWithRetry).toHaveBeenCalledWith(
      'src/content/notes/course1/modules.js',
      expect.stringContaining("subfolders: ['unit-1']"),
      'feat: add unit-1 folder to m1'
    )
    // It succeeds — it does NOT surface the 404 as a failure.
    expect(showToast).toHaveBeenCalledWith('Subfolder unit-1 created', 'success')
    expect(showToast).not.toHaveBeenCalledWith(
      'Failed to create subfolder: Failed to read file (404): Not Found',
      'error'
    )
  })

  // A non-404 read failure (auth, rate limit, server error) must still fail.
  it('surfaces a non-404 read failure instead of swallowing it', async () => {
    getFileContent.mockRejectedValueOnce(
      new Error('Failed to read file (403): rate limit exceeded')
    )
    const { result, showToast } = setup()

    await act(async () => {
      await result.current.handleNewSubfolder('m1', 'unit-1')
    })

    expect(showToast).toHaveBeenCalledWith(
      'Failed to create subfolder: Failed to read file (403): rate limit exceeded',
      'error'
    )
    expect(commitFileWithRetry).not.toHaveBeenCalled()
  })

  it('shows error toast if commitFile throws', async () => {
    commitFile.mockRejectedValueOnce(new Error('Failed to read file (404): Not Found'))
    const { result, showToast } = setup()

    await act(async () => {
      await result.current.handleNewSubfolder('m1', 'unit-1')
    })

    expect(showToast).toHaveBeenCalledWith(
      'Failed to create subfolder: Failed to read file (404): Not Found',
      'error'
    )
  })

  // Casing fix: the real course files export `MODULES` (uppercase). Before the
  // fix addSubfolderToModulesSource searched for lowercase `modules`, so it
  // failed to find the array in a real file and the update fell through.
  it('injects the subfolder into an existing uppercase MODULES export', async () => {
    const existing = [
      'export const MODULES = [',
      "  { id: 'm1', label: 'M1' },",
      ']',
      '',
    ].join('\n')
    getFileContent.mockResolvedValueOnce(existing)
    const { result, showToast } = setup()

    await act(async () => {
      await result.current.handleNewSubfolder('m1', 'unit-1')
    })

    expect(commitFileWithRetry).toHaveBeenCalledWith(
      'src/content/notes/course1/modules.js',
      expect.stringContaining("subfolders: ['unit-1']"),
      'feat: add unit-1 folder to m1'
    )
    // It updated the existing file in place (kept the MODULES export + m1),
    // rather than discarding it for a fresh fallback file.
    const written = commitFileWithRetry.mock.calls[0][1]
    expect(written).toContain('export const MODULES')
    expect(written).toContain("id: 'm1'")
    expect(showToast).toHaveBeenCalledWith('Subfolder unit-1 created', 'success')
  })

  // Casing fix: the no-existing-file fallback must also emit `MODULES`.
  it('creates the fallback modules.js with the canonical MODULES export', async () => {
    getFileContent.mockRejectedValueOnce(
      new Error('Failed to read file (404): Not Found')
    )
    const { result } = setup()

    await act(async () => {
      await result.current.handleNewSubfolder('m1', 'unit-1')
    })

    const written = commitFileWithRetry.mock.calls[0][1]
    expect(written).toContain('export const MODULES')
    expect(written).not.toContain('export const modules')
  })
})

describe('handleNewModule', () => {
  it('calls getFileContent with course-root modules.js path', async () => {
    getFileContent.mockResolvedValue(VALID_MODULES_JS)
    const { result } = setup()

    await act(async () => {
      await result.current.handleNewModule('My Subject')
    })

    expect(getFileContent).toHaveBeenCalledWith('src/content/notes/course1/modules.js')
  })

  it('calls commitFileWithRetry to update modules.js', async () => {
    getFileContent.mockResolvedValue(VALID_MODULES_JS)
    const { result } = setup()

    await act(async () => {
      await result.current.handleNewModule('My Subject')
    })

    expect(commitFileWithRetry).toHaveBeenCalledWith(
      'src/content/notes/course1/modules.js',
      expect.any(String),
      'feat: add my-subject subject'
    )
  })

  // Regression: a freshly-scaffolded course modules.js has no phosphor-icons
  // import block. Adding a subject with an icon used to throw
  // "Could not update icon imports in modules.js".
  it('creates an import block when modules.js has none (scaffolded course)', async () => {
    const SCAFFOLD_MODULES_JS = [
      'export const MODULES = [',
      '  {',
      "    id: 'notes',",
      "    label: 'Notes',",
      "    subfolders: ['notes'],",
      '  },',
      ']',
      '',
    ].join('\n')
    getFileContent.mockResolvedValue(SCAFFOLD_MODULES_JS)
    const { result, showToast } = setup()

    await act(async () => {
      await result.current.handleNewModule('My Subject', 'FileCode')
    })

    expect(showToast).not.toHaveBeenCalledWith(
      expect.stringContaining('Could not update icon imports'),
      'error'
    )
    expect(commitFileWithRetry).toHaveBeenCalledTimes(1)
    const committed = commitFileWithRetry.mock.calls[0][1]
    expect(committed).toContain("} from '@phosphor-icons/react'")
    expect(committed).toContain('FileCode,')
    expect(committed).toContain('Icon: FileCode,')
  })
})

describe('handleDeleteModule', () => {
  it('removes a multi-line module block and commits the updated modules.js', async () => {
    const modulesJs = [
      "import { FileCode, Globe } from '@phosphor-icons/react'",
      '',
      'export const MODULES = [',
      '  {',
      "    id: 'notes',",
      "    label: 'Notes',",
      '    Icon: FileCode,',
      '  },',
      '  {',
      "    id: 'web',",
      "    label: 'Web',",
      '    Icon: Globe,',
      '    notes: [',
      '    ],',
      '    tools: [',
      '    ],',
      '  },',
      ']',
    ].join('\n')
    getFileContent.mockResolvedValue(modulesJs)
    const { result, showToast } = setup()

    await act(async () => {
      await result.current.handleDeleteModule('web')
    })

    expect(showToast).not.toHaveBeenCalledWith(
      expect.stringContaining('Could not find subject'),
      'error'
    )
    expect(commitFileWithRetry).toHaveBeenCalledTimes(1)
    const committed = commitFileWithRetry.mock.calls[0][1]
    expect(committed).not.toContain("id: 'web'")
    expect(committed).toContain("id: 'notes'")
  })

  // Regression: the old regex required `id:` to be on its own line directly
  // after `{`, so compact / single-line module objects failed with
  // "Could not find subject ... in modules.js".
  it('removes a single-line module block', async () => {
    const modulesJs = [
      "import { FileCode, Globe } from '@phosphor-icons/react'",
      '',
      'export const MODULES = [',
      "  { id: 'notes', label: 'Notes', Icon: FileCode },",
      "  { id: 'web', label: 'Web', Icon: Globe },",
      ']',
    ].join('\n')
    getFileContent.mockResolvedValue(modulesJs)
    const { result, showToast } = setup()

    await act(async () => {
      await result.current.handleDeleteModule('web')
    })

    expect(showToast).not.toHaveBeenCalledWith(
      expect.stringContaining('Could not find subject'),
      'error'
    )
    const committed = commitFileWithRetry.mock.calls[0][1]
    expect(committed).not.toContain("id: 'web'")
    expect(committed).toContain("id: 'notes'")
  })

  it('does not remove a module merely because a nested tool shares the id', async () => {
    const modulesJs = [
      "import { FileCode, Globe } from '@phosphor-icons/react'",
      '',
      'export const MODULES = [',
      '  {',
      "    id: 'algo',",
      "    label: 'Algorithms',",
      '    Icon: FileCode,',
      '    tools: [',
      "      { id: 'web', label: 'web.js', route: '/web' },",
      '    ],',
      '  },',
      '  {',
      "    id: 'web',",
      "    label: 'Web',",
      '    Icon: Globe,',
      '  },',
      ']',
    ].join('\n')
    getFileContent.mockResolvedValue(modulesJs)
    const { result } = setup()

    await act(async () => {
      await result.current.handleDeleteModule('web')
    })

    const committed = commitFileWithRetry.mock.calls[0][1]
    // The algo module (whose tool has id 'web') must survive intact.
    expect(committed).toContain("id: 'algo'")
    expect(committed).toContain("label: 'web.js'")
    // The standalone 'web' subject must be gone.
    expect(committed).not.toContain("label: 'Web'")
  })

  // A subject that isn't in modules.js must not fail the delete: the sidebar
  // still updates and no error is shown (idempotent / safe to retry).
  it('does not error and still updates state when the subject is absent', async () => {
    const modulesJs = [
      "import { FileCode } from '@phosphor-icons/react'",
      '',
      'export const MODULES = [',
      "  { id: 'notes', label: 'Notes', Icon: FileCode },",
      ']',
    ].join('\n')
    getFileContent.mockResolvedValue(modulesJs)
    const { result, setModules, showToast } = setup()

    await act(async () => {
      await result.current.handleDeleteModule('missing')
    })

    expect(commitFileWithRetry).not.toHaveBeenCalled()
    expect(setModules).toHaveBeenCalled() // optimistic sidebar update still runs
    expect(showToast).not.toHaveBeenCalledWith(
      expect.stringContaining('Failed to remove subject'),
      'error'
    )
  })

  it('updates the sidebar immediately (optimistic) before the commit resolves', async () => {
    const modulesJs = [
      "import { FileCode, Globe } from '@phosphor-icons/react'",
      '',
      'export const MODULES = [',
      "  { id: 'notes', label: 'Notes', Icon: FileCode },",
      "  { id: 'web', label: 'Web', Icon: Globe },",
      ']',
    ].join('\n')
    getFileContent.mockResolvedValue(modulesJs)
    const { result, setModules } = setup()

    await act(async () => {
      await result.current.handleDeleteModule('web')
    })

    // The optimistic updater removes the target module from prior state.
    const updater = setModules.mock.calls[0][0]
    expect(updater([{ id: 'notes' }, { id: 'web' }])).toEqual([{ id: 'notes' }])
  })

  it('does not fail the delete when a .gitkeep placeholder is missing (404)', async () => {
    const modulesJs = [
      "import { FileCode, Globe } from '@phosphor-icons/react'",
      '',
      'export const MODULES = [',
      "  { id: 'web', label: 'Web', Icon: Globe },",
      ']',
    ].join('\n')
    getFileContent.mockResolvedValue(modulesJs)
    deleteFile.mockRejectedValue(new Error('GitHub API error (404): Not Found'))
    const { result, showToast } = setup()

    await act(async () => {
      await result.current.handleDeleteModule('web')
    })

    expect(commitFileWithRetry).toHaveBeenCalledTimes(1)
    expect(showToast).toHaveBeenCalledWith('Subject web removed', 'success')
    expect(showToast).not.toHaveBeenCalledWith(
      expect.stringContaining('Failed to remove subject'),
      'error'
    )
  })
})

describe('handleDeleteSubfolder', () => {
  it('removes the subfolder from the explicit subfolders array and commits', async () => {
    const modulesJs = [
      "import { FileCode } from '@phosphor-icons/react'",
      '',
      'export const MODULES = [',
      '  {',
      "    id: 'notes',",
      "    label: 'Notes',",
      '    Icon: FileCode,',
      "    subfolders: ['notes', 'tester'],",
      '  },',
      ']',
    ].join('\n')
    getFileContent.mockResolvedValue(modulesJs)
    const { result, setModules, showToast } = setup()

    await act(async () => {
      await result.current.handleDeleteSubfolder('notes', 'tester')
    })

    expect(setModules).toHaveBeenCalled() // optimistic sidebar update
    expect(commitFileWithRetry).toHaveBeenCalledTimes(1)
    const committed = commitFileWithRetry.mock.calls[0][1]
    expect(committed).toContain("subfolders: ['notes']")
    expect(committed).not.toContain("'tester'")
    expect(showToast).toHaveBeenCalledWith('Subfolder tester deleted', 'success')
  })

  it('optimistically drops the subfolder and its notes from local state', async () => {
    getFileContent.mockResolvedValue(
      ['export const MODULES = [', "  { id: 'm', subfolders: ['tester'] },", ']'].join('\n')
    )
    const { result, setModules } = setup()

    await act(async () => {
      await result.current.handleDeleteSubfolder('m', 'tester')
    })

    const updater = setModules.mock.calls[0][0]
    const next = updater([
      {
        id: 'm',
        subfolders: ['notes', 'tester'],
        notes: [{ filename: 'tester/a.md' }, { filename: 'notes/b.md' }],
      },
    ])
    expect(next[0].subfolders).toEqual(['notes'])
    expect(next[0].notes).toEqual([{ filename: 'notes/b.md' }])
  })

  it('does not commit when the subfolder is not in the explicit array', async () => {
    getFileContent.mockResolvedValue(
      ['export const MODULES = [', "  { id: 'm', subfolders: ['notes'] },", ']'].join('\n')
    )
    const { result } = setup()

    await act(async () => {
      await result.current.handleDeleteSubfolder('m', 'tester')
    })

    expect(commitFileWithRetry).not.toHaveBeenCalled()
  })
})

describe('handleMoveFile', () => {
  const WEB_AND_ALGO_MODULES = [
    "import { FileCode, Globe } from '@phosphor-icons/react'",
    '',
    'export const MODULES = [',
    '  {',
    "    id: 'web',",
    "    label: 'Web',",
    '    Icon: FileCode,',
    '    notes: [',
    "      { filename: 'notes/intro.md', label: 'intro.md' },",
    '    ],',
    '  },',
    '  {',
    "    id: 'algo',",
    "    label: 'Algorithms',",
    '    Icon: Globe,',
    '    notes: [',
    '    ],',
    '  },',
    ']',
  ].join('\n')

  // getFileContent is called twice: first for the source .md, then for modules.js.
  function mockReads(modulesJs, noteContent = '# Intro\n') {
    getFileContent.mockImplementation(async (path) =>
      path.endsWith('modules.js') ? modulesJs : noteContent
    )
  }

  // Regression for Issue #5: the old handler copied the file but never deleted
  // the source and never touched modules.js, leaving a duplicate file with a
  // stale registry entry — yet still reported success.
  it('deletes the source file after copying it to the destination', async () => {
    mockReads(WEB_AND_ALGO_MODULES)
    const { result } = setup()

    await act(async () => {
      await result.current.handleMoveFile({
        fromModule: 'web',
        fromSubfolder: 'notes',
        filename: 'intro.md',
        toModule: 'web',
        toSubfolder: 'unit-1',
      })
    })

    // Copy went to the new path...
    expect(commitFile).toHaveBeenCalledWith(
      'src/content/notes/course1/web/unit-1/intro.md',
      '# Intro\n',
      'feat: move intro.md to web/unit-1'
    )
    // ...and the original was deleted (the step the old stub skipped).
    expect(deleteFile).toHaveBeenCalledWith(
      'src/content/notes/course1/web/notes/intro.md',
      expect.any(String)
    )
  })

  it('rewrites the registry filename entry for a same-module move', async () => {
    mockReads(WEB_AND_ALGO_MODULES)
    const { result } = setup()

    await act(async () => {
      await result.current.handleMoveFile({
        fromModule: 'web',
        fromSubfolder: 'notes',
        filename: 'intro.md',
        toModule: 'web',
        toSubfolder: 'unit-1',
      })
    })

    expect(commitFileWithRetry).toHaveBeenCalledWith(
      'src/content/notes/course1/modules.js',
      expect.any(String),
      expect.any(String)
    )
    const written = commitFileWithRetry.mock.calls[0][1]
    expect(written).toContain("filename: 'unit-1/intro.md'")
    expect(written).not.toContain("filename: 'notes/intro.md'")
  })

  it('moves the registry entry between modules on a cross-module move', async () => {
    mockReads(WEB_AND_ALGO_MODULES)
    const { result } = setup()

    await act(async () => {
      await result.current.handleMoveFile({
        fromModule: 'web',
        fromSubfolder: 'notes',
        filename: 'intro.md',
        toModule: 'algo',
        toSubfolder: 'unit-1',
      })
    })

    const written = commitFileWithRetry.mock.calls[0][1]
    // The stale entry is gone entirely...
    expect(written).not.toContain("filename: 'notes/intro.md'")
    // ...and the note now lives under algo with its new path + preserved label.
    const algoBlock = written.slice(written.indexOf("id: 'algo'"))
    expect(algoBlock).toContain("filename: 'unit-1/intro.md'")
    expect(algoBlock).toContain("label: 'intro.md'")
    // The web block no longer references the note.
    const webBlock = written.slice(written.indexOf("id: 'web'"), written.indexOf("id: 'algo'"))
    expect(webBlock).not.toContain('intro.md')
  })

  it('reports success only when every step succeeds', async () => {
    mockReads(WEB_AND_ALGO_MODULES)
    const { result, showToast } = setup()

    await act(async () => {
      await result.current.handleMoveFile({
        fromModule: 'web',
        fromSubfolder: 'notes',
        filename: 'intro.md',
        toModule: 'web',
        toSubfolder: 'unit-1',
      })
    })

    expect(showToast).toHaveBeenCalledWith('File moved successfully', 'success')
  })

  // The old handler reported success unconditionally. If the delete fails, the
  // move is incomplete and must surface as an error, not "moved successfully".
  it('does not report success if deleting the source fails', async () => {
    mockReads(WEB_AND_ALGO_MODULES)
    deleteFile.mockRejectedValueOnce(new Error('GitHub delete failed: 422'))
    const { result, showToast } = setup()

    await act(async () => {
      await result.current.handleMoveFile({
        fromModule: 'web',
        fromSubfolder: 'notes',
        filename: 'intro.md',
        toModule: 'web',
        toSubfolder: 'unit-1',
      })
    })

    expect(showToast).not.toHaveBeenCalledWith('File moved successfully', 'success')
    expect(showToast).toHaveBeenCalledWith(
      'Failed to move file: GitHub delete failed: 422',
      'error'
    )
  })
})

describe('handleRenameSubfolder', () => {
  const MODULE_WITH_SUBFOLDER = [
    "import { FileCode } from '@phosphor-icons/react'",
    '',
    'export const MODULES = [',
    '  {',
    "    id: 'web',",
    "    label: 'Web',",
    '    Icon: FileCode,',
    "    subfolders: ['notes', 'old-unit'],",
    '    notes: [',
    "      { filename: 'old-unit/intro.md', label: 'Intro' },",
    "      { filename: 'notes/misc.md', label: 'Misc' },",
    '    ],',
    '  },',
    ']',
  ].join('\n')

  // getFileContent is called for each note file in the folder, then for
  // modules.js. Route by path so the registry read returns the module source.
  function mockReads(modulesJs, noteContent = '# Intro\n') {
    getFileContent.mockImplementation(async (path) =>
      path.endsWith('modules.js') ? modulesJs : noteContent
    )
  }

  // Regression for Issue #6: the old stub emitted "Subfolder renamed" without
  // performing ANY GitHub/registry/state change. These assertions all fail
  // against that stub (no listDirectory/commit/delete/setModules ran, and the
  // success message had the wrong text).
  it('moves each file in the folder to the renamed path then deletes the original', async () => {
    listDirectory.mockResolvedValue([{ name: 'intro.md' }])
    mockReads(MODULE_WITH_SUBFOLDER)
    const { result } = setup()

    await act(async () => {
      await result.current.handleRenameSubfolder('web', 'old-unit', 'unit-1')
    })

    // Listed the source folder at the course-scoped path.
    expect(listDirectory).toHaveBeenCalledWith(
      'src/content/notes/course1/web/old-unit'
    )
    // Copied the file to the new subfolder...
    expect(commitFile).toHaveBeenCalledWith(
      'src/content/notes/course1/web/unit-1/intro.md',
      '# Intro\n',
      expect.any(String)
    )
    // ...and removed the original (the step the old stub skipped).
    expect(deleteFile).toHaveBeenCalledWith(
      'src/content/notes/course1/web/old-unit/intro.md',
      expect.any(String)
    )
  })

  it('rewrites note path prefixes and the subfolders entry in modules.js', async () => {
    listDirectory.mockResolvedValue([{ name: 'intro.md' }])
    mockReads(MODULE_WITH_SUBFOLDER)
    const { result } = setup()

    await act(async () => {
      await result.current.handleRenameSubfolder('web', 'old-unit', 'unit-1')
    })

    expect(commitFileWithRetry).toHaveBeenCalledWith(
      'src/content/notes/course1/modules.js',
      expect.any(String),
      'feat: rename old-unit folder to unit-1 in web'
    )
    const written = commitFileWithRetry.mock.calls[0][1]
    // The note under the renamed folder now points at the new prefix...
    expect(written).toContain("filename: 'unit-1/intro.md'")
    expect(written).not.toContain("filename: 'old-unit/intro.md'")
    // ...the explicit subfolders entry is renamed...
    expect(written).toContain("subfolders: ['notes', 'unit-1']")
    expect(written).not.toContain('old-unit')
    // ...and unrelated notes are left alone.
    expect(written).toContain("filename: 'notes/misc.md'")
  })

  it('updates local state: renames the subfolder and rewrites note filename prefixes', async () => {
    listDirectory.mockResolvedValue([])
    mockReads(MODULE_WITH_SUBFOLDER)
    const { result, setModules } = setup()

    await act(async () => {
      await result.current.handleRenameSubfolder('web', 'old-unit', 'unit-1')
    })

    const updater = setModules.mock.calls[0][0]
    const next = updater([
      {
        id: 'web',
        subfolders: ['notes', 'old-unit'],
        notes: [
          { filename: 'old-unit/intro.md', label: 'Intro' },
          { filename: 'notes/misc.md', label: 'Misc' },
        ],
      },
    ])
    expect(next[0].subfolders).toEqual(['notes', 'unit-1'])
    expect(next[0].notes).toEqual([
      { filename: 'unit-1/intro.md', label: 'Intro' },
      { filename: 'notes/misc.md', label: 'Misc' },
    ])
  })

  it('reports success only after the work completes (not the old stub message)', async () => {
    listDirectory.mockResolvedValue([{ name: 'intro.md' }])
    mockReads(MODULE_WITH_SUBFOLDER)
    const { result, showToast } = setup()

    await act(async () => {
      await result.current.handleRenameSubfolder('web', 'old-unit', 'unit-1')
    })

    expect(showToast).toHaveBeenCalledWith('Subfolder renamed to unit-1', 'success')
  })

  // The old stub reported success unconditionally. If moving a file fails, the
  // rename is incomplete and must surface as an error.
  it('does not report success if a file move fails', async () => {
    listDirectory.mockResolvedValue([{ name: 'intro.md' }])
    mockReads(MODULE_WITH_SUBFOLDER)
    commitFile.mockRejectedValueOnce(new Error('GitHub commit failed: 422'))
    const { result, showToast } = setup()

    await act(async () => {
      await result.current.handleRenameSubfolder('web', 'old-unit', 'unit-1')
    })

    expect(showToast).not.toHaveBeenCalledWith('Subfolder renamed to unit-1', 'success')
    expect(showToast).toHaveBeenCalledWith(
      'Failed to rename subfolder: GitHub commit failed: 422',
      'error'
    )
  })
})
