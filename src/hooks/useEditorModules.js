import { commitFile, commitFileWithRetry, getFileContent, deleteFile, cleanupFile } from '../lib/githubApi'
import { getIconOptionByName } from '../components/admin/adminIconOptions'
import { upsertNoteEntry } from './useEditorSave'

// Title to filename conversion
function titleToFilename(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Admin-typed names are interpolated raw into single-quoted string literals
// in modules.js (subject labels, subfolder entries, note filenames) and into
// GitHub paths. A quote, backslash, or line break would produce invalid JS —
// and because the registry commit goes straight to the deployed branch, that
// breaks the build for every visitor, not just the editor. Reject those up
// front. `/` is additionally barred where a name must be a single path
// segment (subfolders, filenames), since the subfolder is derived from the
// first "/" in a filename.
function nameError(name, { allowSlash = true } = {}) {
  const trimmed = (name ?? '').trim()
  if (!trimmed) return 'Please enter a name'
  if (/['"\\]/.test(trimmed)) return 'Name cannot contain quotes or backslashes'
  if (/[\n\r\t]/.test(trimmed)) return 'Name cannot contain line breaks or tabs'
  if (!allowSlash && trimmed.includes('/')) return 'Name cannot contain a slash'
  return null
}

const MODULES_JS_PATH = 'src/components/layout/Sidebar/modules.js'

function moduleToSource(module) {
  const lines = [
    '  {',
    `    id: '${module.id}',`,
    `    label: '${module.label}',`,
    `    Icon: ${module.iconName},`,
  ]

  if (module.notes) {
    lines.push('    notes: [')
    module.notes.forEach(note => {
      lines.push(`      { filename: '${note.filename}', label: '${note.label}' },`)
    })
    lines.push('    ],')
  }

  if (module.tools) {
    lines.push('    tools: [')
    module.tools.forEach(tool => {
      lines.push(`      { id: '${tool.id}', label: '${tool.label}', route: '${tool.route}' },`)
    })
    lines.push('    ],')
  }

  lines.push('  },')
  return lines.join('\n')
}

function ensureIconImport(modulesJs, iconName) {
  if (!iconName || modulesJs.includes(`  ${iconName},`) || modulesJs.includes(`  Function as ${iconName},`)) {
    return modulesJs
  }

  const importStart = modulesJs.indexOf('import {\n')
  const importEnd = modulesJs.indexOf("} from '@phosphor-icons/react'", importStart)

  if (importStart === -1 || importEnd === -1) {
    throw new Error('Could not update icon imports in modules.js')
  }

  const importLine = iconName === 'FunctionIcon'
    ? '  Function as FunctionIcon,'
    : `  ${iconName},`

  return `${modulesJs.slice(0, importEnd)}${importLine}\n${modulesJs.slice(importEnd)}`
}

function insertModuleSource(modulesJs, module) {
  if (modulesJs.includes(`id: '${module.id}'`)) {
    throw new Error(`Subject "${module.id}" already exists`)
  }

  const standaloneIndex = modulesJs.indexOf('export const STANDALONE_TOOLS')
  const moduleSection = standaloneIndex >= 0 ? modulesJs.slice(0, standaloneIndex) : modulesJs
  const rest = standaloneIndex >= 0 ? modulesJs.slice(standaloneIndex) : ''
  const arrayEnd = moduleSection.lastIndexOf('\n]')

  if (arrayEnd === -1) {
    throw new Error('Could not find MODULES array end')
  }

  return `${moduleSection.slice(0, arrayEnd)}\n${moduleToSource(module)}${moduleSection.slice(arrayEnd)}${rest}`
}

function removeModuleSource(modulesJs, moduleId) {
  const startPattern = new RegExp(`\\n\\s*\\{\\s*\\n\\s*id:\\s*'${moduleId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}',`, 'm')
  const startMatch = modulesJs.match(startPattern)

  if (!startMatch || startMatch.index == null) {
    throw new Error(`Could not find subject "${moduleId}" in modules.js`)
  }

  const start = startMatch.index
  let index = start + 1
  let depth = 0

  for (; index < modulesJs.length; index++) {
    const char = modulesJs[index]
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        let end = index + 1
        if (modulesJs[end] === ',') end += 1
        if (modulesJs[end] === '\r') end += 1
        if (modulesJs[end] === '\n') end += 1
        return `${modulesJs.slice(0, start)}\n${modulesJs.slice(end)}`
      }
    }
  }

  throw new Error(`Could not parse subject "${moduleId}" in modules.js`)
}

function refreshModuleState(setModules, updater) {
  setModules(prev => updater(prev))
}

// Subfolders aren't tracked directly — they're derived by grouping a
// module's notes[] by the prefix of their filename (mirrors DirectoryDrawer.jsx).
// A filename with no "/" has no subfolder (it lives at the module root), so
// it's excluded here even when the target subfolder is literally 'notes'.
function deriveSubfolder(filename) {
  const slashIndex = filename.indexOf('/')
  return slashIndex === -1 ? null : filename.slice(0, slashIndex)
}

// The GitHub path a note's filename field actually resolves to. Some legacy
// entries already carry a trailing .md, most don't — normalize both.
function notePathOnDisk(moduleId, filename) {
  const withExt = filename.endsWith('.md') ? filename : `${filename}.md`
  return `src/content/notes/${moduleId}/${withExt}`
}

function findModuleBlock(modulesJs, moduleId) {
  const escapedId = moduleId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  let startMatch = modulesJs.match(new RegExp(`\\n\\s*\\{\\s*\\n\\s*id:\\s*'${escapedId}',`, 'm'))
  if (!startMatch) {
    startMatch = modulesJs.match(new RegExp(`\\{\\s*id:\\s*'${escapedId}'\\s*,`, 'm'))
  }
  if (!startMatch || startMatch.index == null) {
    throw new Error(`Could not find subject "${moduleId}" in modules.js`)
  }

  const start = startMatch.index
  // The two patterns above disagree on where the match starts: the
  // multi-line one starts at the newline *before* the opening brace, the
  // single-line fallback starts *at* the brace itself. Locate the actual
  // brace and count depth from there so both shapes balance correctly —
  // starting the count at a fixed offset from `start` undercounts the
  // opening brace for single-line modules and runs the "block" past
  // whatever `}` happens to zero out the (now permanently negative) depth,
  // silently swallowing every module after it.
  const braceStart = modulesJs.indexOf('{', start)
  let depth = 0
  for (let index = braceStart; index < modulesJs.length; index++) {
    const char = modulesJs[index]
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return { start, end: index + 1 }
    }
  }
  throw new Error(`Could not parse subject "${moduleId}" in modules.js`)
}

const NOTE_ENTRY_PATTERN = /\{\s*filename:\s*'([^']+)'\s*,\s*label:\s*'([^']*)'\s*\},?/g

// Folders created empty (via "+ New subfolder") have no notes to derive a
// subfolder from, so — unlike every other subfolder — they're tracked
// explicitly in this field instead. Once a note is added, the folder shows
// up via NOTE_ENTRY_PATTERN too; the explicit entry is just redundant then,
// not wrong, and gets cleaned up on rename/delete.
const SUBFOLDERS_FIELD_PATTERN = /subfolders:\s*\[([^\]]*)\]/

function parseSubfoldersField(moduleSource) {
  const match = moduleSource.match(SUBFOLDERS_FIELD_PATTERN)
  if (!match) return []
  return [...match[1].matchAll(/'([^']+)'/g)].map(m => m[1])
}

function addSubfolderEntry(modulesJs, moduleId, subfolderName) {
  const block = findModuleBlock(modulesJs, moduleId)
  const source = modulesJs.slice(block.start, block.end)

  if (parseSubfoldersField(source).includes(subfolderName)) {
    return modulesJs
  }

  let updatedSource
  const fieldMatch = source.match(SUBFOLDERS_FIELD_PATTERN)
  if (fieldMatch) {
    const inner = fieldMatch[1].trim()
    const sep = inner ? ', ' : ''
    updatedSource = source.replace(SUBFOLDERS_FIELD_PATTERN, `subfolders: [${fieldMatch[1]}${sep}'${subfolderName}']`)
  } else {
    // Some modules (the "coming soon" ones with no notes/tools) are written
    // as a single-line block with no newlines at all — a multi-line-only
    // Icon match would throw for every one of them. Detect the shape and
    // insert accordingly: as its own line after Icon's, or inline before
    // the closing brace.
    const iconLineMatch = source.match(/Icon:[^\n]*\n/)
    if (iconLineMatch) {
      const insertAt = iconLineMatch.index + iconLineMatch[0].length
      updatedSource = `${source.slice(0, insertAt)}    subfolders: ['${subfolderName}'],\n${source.slice(insertAt)}`
    } else {
      const iconMatch = source.match(/Icon:\s*[^,}]+/)
      if (!iconMatch) {
        throw new Error(`Could not find Icon field for subject "${moduleId}" in modules.js`)
      }
      let insertAt = iconMatch.index + iconMatch[0].length
      while (/\s/.test(source[insertAt - 1])) insertAt--
      updatedSource = `${source.slice(0, insertAt)}, subfolders: ['${subfolderName}']${source.slice(insertAt)}`
    }
  }

  return `${modulesJs.slice(0, block.start)}${updatedSource}${modulesJs.slice(block.end)}`
}

function renameSubfolderEntry(modulesJs, moduleId, oldName, newName) {
  const block = findModuleBlock(modulesJs, moduleId)
  const source = modulesJs.slice(block.start, block.end)
  const names = parseSubfoldersField(source)
  if (!names.includes(oldName)) return modulesJs

  const updated = names.map(name => name === oldName ? newName : name)
  const updatedSource = source.replace(
    SUBFOLDERS_FIELD_PATTERN,
    `subfolders: [${updated.map(name => `'${name}'`).join(', ')}]`
  )
  return `${modulesJs.slice(0, block.start)}${updatedSource}${modulesJs.slice(block.end)}`
}

function removeSubfolderEntry(modulesJs, moduleId, subfolderName) {
  const block = findModuleBlock(modulesJs, moduleId)
  const source = modulesJs.slice(block.start, block.end)
  const match = source.match(SUBFOLDERS_FIELD_PATTERN)
  if (!match) return modulesJs

  const remaining = parseSubfoldersField(source).filter(name => name !== subfolderName)

  let updatedSource
  if (remaining.length > 0) {
    updatedSource = source.replace(
      SUBFOLDERS_FIELD_PATTERN,
      `subfolders: [${remaining.map(name => `'${name}'`).join(', ')}]`
    )
  } else {
    // Nothing left in the field — drop it along with one adjacent comma so
    // the field the block already had (Icon's, on multi-line blocks; the
    // one this same code inserted, on single-line blocks) becomes the
    // separator again. A line-based removal here is unsafe: single-line
    // blocks have no newlines at all, so a "delete this whole line" fallback
    // would delete the entire module block instead of just this field.
    updatedSource = source.replace(/,\s*subfolders:\s*\[[^\]]*\]/, '')
  }

  return `${modulesJs.slice(0, block.start)}${updatedSource}${modulesJs.slice(block.end)}`
}

// Removes every note entry in `moduleId` whose derived subfolder matches
// `subfolderName`. Leaves the underlying GitHub files in place — the
// DirectoryDrawer delete-confirmation copy already promises "notes inside
// will be orphaned", matching the existing image-cleanup workflow.
function removeSubfolderNotes(modulesJs, moduleId, subfolderName) {
  const block = findModuleBlock(modulesJs, moduleId)
  const source = modulesJs.slice(block.start, block.end)

  let removedCount = 0
  const updatedSource = source
    .replace(NOTE_ENTRY_PATTERN, (fullMatch, filename) => {
      if (deriveSubfolder(filename) === subfolderName) {
        removedCount += 1
        return ''
      }
      return fullMatch
    })
    .replace(/\n[ \t]*\n/g, '\n')

  const updatedModulesJs = `${modulesJs.slice(0, block.start)}${updatedSource}${modulesJs.slice(block.end)}`
  return { modulesJs: updatedModulesJs, removedCount }
}

// The subfolder a note is *displayed* under in DirectoryDrawer: root-level
// notes (no "/" in the filename) are grouped into "notes" there even though
// deriveSubfolder calls them null. Match that when resolving a dragged file.
function displaySubfolder(filename) {
  return deriveSubfolder(filename) ?? 'notes'
}

// Resolves a dragged file back to its modules.js entry. File rows come from
// two sources — GitHub's directory listing (always "<base>.md") and modules.js
// itself (usually extensionless) — so compare on the stripped basename.
function findNoteEntry(moduleSource, subfolder, filename) {
  const target = filename.replace(/\.md$/, '')

  for (const [, entryFilename, label] of moduleSource.matchAll(NOTE_ENTRY_PATTERN)) {
    const base = entryFilename.split('/').pop().replace(/\.md$/, '')
    if (displaySubfolder(entryFilename) === subfolder && base === target) {
      return { filename: entryFilename, label }
    }
  }

  return null
}

// Drops a single note entry from a module's block. Only needed when a note
// moves to a *different* subject, where its entry has to leave one block and
// be added to another; a same-subject move is just a filename rewrite.
function removeNoteEntry(modulesJs, moduleId, filename) {
  const block = findModuleBlock(modulesJs, moduleId)
  const source = modulesJs.slice(block.start, block.end)
  let removed = false

  const updatedSource = source
    .replace(NOTE_ENTRY_PATTERN, (fullMatch, entryFilename) => {
      if (!removed && entryFilename === filename) {
        removed = true
        return ''
      }
      return fullMatch
    })
    .replace(/\n[ \t]*\n/g, '\n')

  if (!removed) {
    throw new Error(`Could not find note "${filename}" in modules.js`)
  }

  return `${modulesJs.slice(0, block.start)}${updatedSource}${modulesJs.slice(block.end)}`
}

// Rewrites the filename field of specific note entries within a module
// (used after their content has already moved on GitHub).
function renameNoteFilenames(modulesJs, moduleId, renames) {
  const block = findModuleBlock(modulesJs, moduleId)
  let source = modulesJs.slice(block.start, block.end)

  for (const { oldFilename, newFilename } of renames) {
    const escapedOld = oldFilename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`filename:\\s*'${escapedOld}'`)
    if (!pattern.test(source)) {
      throw new Error(`Could not find note "${oldFilename}" in modules.js`)
    }
    source = source.replace(pattern, `filename: '${newFilename}'`)
  }

  return `${modulesJs.slice(0, block.start)}${source}${modulesJs.slice(block.end)}`
}

export function useEditorModules({ showToast, setModules, setSelectedPath, unusedIconOptions, isOwner }) {
  // Module management handlers
  const handleNewModule = async (name, iconName = unusedIconOptions[0]?.name || 'FileCode') => {
    const problem = nameError(name)
    if (problem) {
      showToast(problem, 'error')
      return
    }
    const moduleId = titleToFilename(name)
    if (!moduleId) {
      showToast('Please enter a subject name', 'error')
      return
    }

    showToast(`Creating subject ${moduleId}...`, 'success')

    try {
      const currentModulesJs = await getFileContent(MODULES_JS_PATH)
      const label = name.trim()
      const iconOption = getIconOptionByName(iconName)
      const newModule = {
        id: moduleId,
        label,
        iconName: iconOption.name,
        Icon: iconOption.Icon,
        notes: [],
        tools: [],
      }
      const updatedModulesJs = insertModuleSource(
        ensureIconImport(currentModulesJs, iconOption.name),
        newModule
      )

      await commitFile(
        `src/content/notes/${moduleId}/notes/.gitkeep`,
        '',
        `feat: create ${moduleId} notes folder`
      )
      await commitFile(
        `src/content/notes/${moduleId}/tools/.gitkeep`,
        '',
        `feat: add tools folder to ${moduleId}`
      )
      await commitFileWithRetry(
        MODULES_JS_PATH,
        updatedModulesJs,
        `feat: add ${moduleId} subject`
      )

      refreshModuleState(setModules, prev => [...prev, newModule])
      showToast(`Subject ${label} created`, 'success')
    } catch (error) {
      showToast(`Failed to create subject: ${error.message}`, 'error')
    }
  }

  const handleDeleteModule = async (moduleId) => {
    showToast(`Removing subject ${moduleId}...`, 'success')

    try {
      const currentModulesJs = await getFileContent(MODULES_JS_PATH)
      const updatedModulesJs = removeModuleSource(currentModulesJs, moduleId)

      await commitFileWithRetry(
        MODULES_JS_PATH,
        updatedModulesJs,
        `feat: remove ${moduleId} subject`
      )
      await deleteFile(
        `src/content/notes/${moduleId}/notes/.gitkeep`,
        `chore: remove ${moduleId} notes placeholder`
      )
      await deleteFile(
        `src/content/notes/${moduleId}/tools/.gitkeep`,
        `chore: remove ${moduleId} tools placeholder`
      )

      refreshModuleState(setModules, prev => prev.filter(module => module.id !== moduleId))
      setSelectedPath(prev => prev?.moduleId === moduleId ? null : prev)
      showToast(`Subject ${moduleId} removed`, 'success')
    } catch (error) {
      showToast(`Failed to remove subject: ${error.message}`, 'error')
    }
  }

  const handleRenameModule = async (moduleId, newLabel) => {
    const problem = nameError(newLabel)
    if (problem) {
      showToast(problem, 'error')
      return
    }

    showToast(`Renaming subject to ${newLabel}...`, 'success')

    try {
      const currentModulesJs = await getFileContent(MODULES_JS_PATH)
      const moduleRegex = new RegExp(
        `(\\{[^}]*id:\\s*'${moduleId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'[^}]*label:\\s*')([^']+)(')`
      )
      const updatedModulesJs = currentModulesJs.replace(moduleRegex, `$1${newLabel}$3`)

      await commitFileWithRetry(
        MODULES_JS_PATH,
        updatedModulesJs,
        `feat: rename ${moduleId} to ${newLabel}`
      )

      refreshModuleState(setModules, prev =>
        prev.map(m => m.id === moduleId ? { ...m, label: newLabel } : m)
      )
      showToast(`Subject renamed to ${newLabel}`, 'success')
    } catch (error) {
      showToast(`Failed to rename subject: ${error.message}`, 'error')
    }
  }

  const handleNewSubfolder = async (moduleId, subfolderName) => {
    const problem = nameError(subfolderName, { allowSlash: false })
    if (problem) {
      showToast(`Failed to create subfolder: ${problem}`, 'error')
      return
    }

    try {
      // Read and patch the registry *before* writing anything. Both steps can
      // fail (unknown subject, unparseable block), and doing the .gitkeep
      // commit first leaves an orphan folder on GitHub that nothing points at
      // — invisible to DirectoryDrawer but very much present in the repo.
      const currentModulesJs = await getFileContent(MODULES_JS_PATH)
      const updatedModulesJs = addSubfolderEntry(currentModulesJs, moduleId, subfolderName)

      // Create the subfolder directory on GitHub
      await commitFile(
        `src/content/notes/${moduleId}/${subfolderName}/.gitkeep`,
        '',
        `feat: add ${subfolderName} to ${moduleId}`
      )

      // Register it explicitly — an empty folder has no notes for
      // DirectoryDrawer to derive its subfolder list from otherwise.
      await commitFileWithRetry(
        MODULES_JS_PATH,
        updatedModulesJs,
        `feat: register ${subfolderName} in ${moduleId}`,
        moduleId
      )

      refreshModuleState(setModules, prev =>
        prev.map(module =>
          module.id === moduleId
            ? { ...module, subfolders: [...new Set([...(module.subfolders ?? []), subfolderName])] }
            : module
        )
      )

      showToast(`Subfolder ${subfolderName} created`, 'success')
    } catch (error) {
      showToast(`Failed to create subfolder: ${error.message}`, 'error')
    }
  }

  const handleRenameSubfolder = async (moduleId, oldName, newName) => {
    const problem = nameError(newName, { allowSlash: false })
    if (problem) {
      showToast(`Failed to rename subfolder: ${problem}`, 'error')
      return
    }

    showToast(`Renaming ${oldName} to ${newName}...`, 'success')

    try {
      const currentModulesJs = await getFileContent(MODULES_JS_PATH)
      const block = findModuleBlock(currentModulesJs, moduleId)
      const moduleSource = currentModulesJs.slice(block.start, block.end)
      const allFilenames = new Set(
        [...moduleSource.matchAll(NOTE_ENTRY_PATTERN)].map(match => match[1])
      )
      const targetFilenames = [...allFilenames].filter(
        filename => deriveSubfolder(filename) === oldName
      )
      const explicitSubfolders = parseSubfoldersField(moduleSource)
      const isExplicit = explicitSubfolders.includes(oldName)

      if (targetFilenames.length === 0 && !isExplicit) {
        showToast(`No registered notes found in ${oldName} to rename`, 'error')
        return
      }

      if (targetFilenames.length === 0) {
        // Empty folder tracked only in `subfolders` — nothing to move, just
        // rename the placeholder and the registry entry.
        await commitFile(
          `src/content/notes/${moduleId}/${newName}/.gitkeep`,
          '',
          `feat: rename ${oldName} to ${newName} in ${moduleId}`
        )
        try {
          await cleanupFile(
            `src/content/notes/${moduleId}/${oldName}/.gitkeep`,
            `chore: remove ${oldName} placeholder after rename to ${newName}`
          )
        } catch {
          // Old placeholder left behind — harmless, safe to delete manually later.
        }

        const updatedModulesJs = renameSubfolderEntry(currentModulesJs, moduleId, oldName, newName)
        await commitFileWithRetry(
          MODULES_JS_PATH,
          updatedModulesJs,
          `feat: rename ${oldName} to ${newName} in ${moduleId}`,
          moduleId
        )

        refreshModuleState(setModules, prev =>
          prev.map(module =>
            module.id === moduleId
              ? { ...module, subfolders: (module.subfolders ?? []).map(name => name === oldName ? newName : name) }
              : module
          )
        )
        setSelectedPath(prev =>
          prev?.moduleId === moduleId && prev?.subfolder === oldName
            ? { ...prev, subfolder: newName }
            : prev
        )
        showToast(`Subfolder renamed to ${newName}`, 'success')
        return
      }

      const moved = []
      const failed = []
      const leftoverCopies = []

      for (const oldFilename of targetFilenames) {
        const rest = oldFilename.slice(oldFilename.indexOf('/') + 1)
        const newFilename = `${newName}/${rest}`

        if (allFilenames.has(newFilename)) {
          failed.push({ oldFilename, error: `A note already exists at ${newFilename}` })
          continue
        }

        const oldPath = notePathOnDisk(moduleId, oldFilename)
        const newPath = notePathOnDisk(moduleId, newFilename)

        let content
        try {
          content = await getFileContent(oldPath)
        } catch (readError) {
          // Files move one commit at a time but the registry is written once
          // at the end, so a run that dies partway leaves disk ahead of
          // modules.js. On the retry those already-moved notes 404 here
          // forever, because the entry still names a path nothing occupies.
          // If the content is already sitting at newPath, the move did happen
          // — count it as moved so this run repairs the stale entry.
          try {
            await getFileContent(newPath)
            moved.push({ oldFilename, newFilename })
          } catch {
            failed.push({ oldFilename, error: readError.message })
          }
          continue
        }

        try {
          await commitFile(newPath, content, `feat: move ${oldFilename} to ${newFilename} in ${moduleId}`)
          // Content is safely at newPath now — a delete failure here just
          // leaves a stale duplicate at oldPath, not a broken link, so it
          // still counts as moved rather than being discarded as failed.
          try {
            await cleanupFile(oldPath, `chore: remove ${oldFilename} after move to ${newFilename}`)
          } catch {
            leftoverCopies.push(oldPath)
          }
          moved.push({ oldFilename, newFilename })
        } catch (error) {
          failed.push({ oldFilename, error: error.message })
        }
      }

      if (moved.length > 0) {
        let updatedModulesJs = renameNoteFilenames(currentModulesJs, moduleId, moved)
        if (isExplicit) {
          updatedModulesJs = renameSubfolderEntry(updatedModulesJs, moduleId, oldName, newName)
        }
        await commitFileWithRetry(
          MODULES_JS_PATH,
          updatedModulesJs,
          `feat: rename ${oldName} to ${newName} in ${moduleId}`,
          moduleId
        )

        refreshModuleState(setModules, prev =>
          prev.map(module => {
            if (module.id !== moduleId) return module
            return {
              ...module,
              notes: (module.notes ?? []).map(note => {
                const match = moved.find(m => m.oldFilename === note.filename)
                return match ? { ...note, filename: match.newFilename } : note
              }),
              subfolders: isExplicit
                ? (module.subfolders ?? []).map(name => name === oldName ? newName : name)
                : module.subfolders,
            }
          })
        )
      }

      const leftoverSuffix = leftoverCopies.length > 0
        ? ` (${leftoverCopies.length} old ${leftoverCopies.length === 1 ? 'copy' : 'copies'} could not be removed — safe to delete manually)`
        : ''

      if (failed.length === 0) {
        setSelectedPath(prev =>
          prev?.moduleId === moduleId && prev?.subfolder === oldName
            ? { ...prev, subfolder: newName }
            : prev
        )
        showToast(`Subfolder renamed to ${newName}${leftoverSuffix}`, leftoverCopies.length > 0 ? 'error' : 'success')
      } else if (moved.length === 0) {
        showToast(`Failed to rename subfolder: ${failed[0].error}`, 'error')
      } else {
        showToast(
          `Renamed ${moved.length} of ${targetFilenames.length} notes; ${failed.length} failed — fix and retry${leftoverSuffix}`,
          'error'
        )
      }
    } catch (error) {
      showToast(`Failed to rename subfolder: ${error.message}`, 'error')
    }
  }

  const handleDeleteSubfolder = async (moduleId, subfolderName) => {
    showToast(`Deleting subfolder ${subfolderName}...`, 'success')

    try {
      const currentModulesJs = await getFileContent(MODULES_JS_PATH)
      const block = findModuleBlock(currentModulesJs, moduleId)
      const isExplicit = parseSubfoldersField(currentModulesJs.slice(block.start, block.end)).includes(subfolderName)

      const { modulesJs: notesRemovedJs, removedCount } = removeSubfolderNotes(
        currentModulesJs,
        moduleId,
        subfolderName
      )

      if (removedCount === 0 && !isExplicit) {
        showToast(`No registered notes found in ${subfolderName} to remove`, 'error')
        return
      }

      const updatedModulesJs = isExplicit
        ? removeSubfolderEntry(notesRemovedJs, moduleId, subfolderName)
        : notesRemovedJs

      await commitFileWithRetry(
        MODULES_JS_PATH,
        updatedModulesJs,
        `feat: remove ${subfolderName} subfolder from ${moduleId}`,
        moduleId
      )

      if (isExplicit) {
        try {
          await deleteFile(
            `src/content/notes/${moduleId}/${subfolderName}/.gitkeep`,
            `chore: remove ${subfolderName} placeholder from ${moduleId}`
          )
        } catch {
          // Placeholder may already be gone (e.g. a note was added since creation) — not fatal.
        }
      }

      refreshModuleState(setModules, prev =>
        prev.map(module =>
          module.id === moduleId
            ? {
                ...module,
                notes: (module.notes ?? []).filter(
                  note => deriveSubfolder(note.filename) !== subfolderName
                ),
                subfolders: (module.subfolders ?? []).filter(name => name !== subfolderName),
              }
            : module
        )
      )
      setSelectedPath(prev =>
        prev?.moduleId === moduleId && prev?.subfolder === subfolderName ? null : prev
      )
      showToast(
        removedCount > 0
          ? `Subfolder ${subfolderName} removed from the registry (files left in place)`
          : `Subfolder ${subfolderName} removed`,
        'success'
      )
    } catch (error) {
      showToast(`Failed to delete subfolder: ${error.message}`, 'error')
    }
  }

  const handleMoveFile = async ({ fromModule, fromSubfolder, filename, toModule, toSubfolder }) => {
    if (fromModule === toModule && fromSubfolder === toSubfolder) return

    const isCrossSubject = fromModule !== toModule

    // A cross-subject move rewrites two module blocks in modules.js, which the
    // admin-github-write Edge Function rejects for anyone but an owner (it
    // proves each edit stays inside a single module). Say so plainly rather
    // than letting it surface as a raw 403 after the content has been copied.
    if (isCrossSubject && !isOwner) {
      showToast('Moving notes between subjects is owner-only', 'error')
      return
    }

    showToast(`Moving ${filename}...`, 'success')

    try {
      const currentModulesJs = await getFileContent(MODULES_JS_PATH)
      const fromBlock = findModuleBlock(currentModulesJs, fromModule)
      const entry = findNoteEntry(
        currentModulesJs.slice(fromBlock.start, fromBlock.end),
        fromSubfolder,
        filename
      )

      if (!entry) {
        showToast(`${filename} isn't registered in modules.js — nothing to move`, 'error')
        return
      }

      const base = entry.filename.split('/').pop()
      const newFilename = `${toSubfolder}/${base}`
      const toBlock = findModuleBlock(currentModulesJs, toModule)
      const toSource = currentModulesJs.slice(toBlock.start, toBlock.end)

      if ([...toSource.matchAll(NOTE_ENTRY_PATTERN)].some(match => match[1] === newFilename)) {
        showToast(`A note already exists at ${toModule}/${newFilename}`, 'error')
        return
      }

      const oldPath = notePathOnDisk(fromModule, entry.filename)
      const newPath = notePathOnDisk(toModule, newFilename)

      const fileContent = await getFileContent(oldPath)
      await commitFile(newPath, fileContent, `feat: move ${base} to ${toModule}/${toSubfolder}`)

      // Content is safe at the new path from here on. The registry is updated
      // *before* the old file is deleted so the worst case is a lingering
      // duplicate the registry ignores — deleting first would leave the entry
      // pointing at a path that no longer exists.
      const updatedModulesJs = isCrossSubject
        ? upsertNoteEntry(
            removeNoteEntry(currentModulesJs, fromModule, entry.filename),
            toModule,
            `{ filename: '${newFilename}', label: '${entry.label}' },`,
            newFilename
          )
        : renameNoteFilenames(currentModulesJs, fromModule, [
            { oldFilename: entry.filename, newFilename },
          ])

      await commitFileWithRetry(
        MODULES_JS_PATH,
        updatedModulesJs,
        `feat: move ${base} from ${fromModule}/${fromSubfolder} to ${toModule}/${toSubfolder}`,
        isCrossSubject ? undefined : fromModule
      )

      refreshModuleState(setModules, prev =>
        prev.map(module => {
          const notes = module.notes ?? []

          if (!isCrossSubject) {
            if (module.id !== fromModule) return module
            return {
              ...module,
              notes: notes.map(note =>
                note.filename === entry.filename ? { ...note, filename: newFilename } : note
              ),
            }
          }

          if (module.id === fromModule) {
            return { ...module, notes: notes.filter(note => note.filename !== entry.filename) }
          }
          if (module.id === toModule) {
            return { ...module, notes: [...notes, { filename: newFilename, label: entry.label }] }
          }
          return module
        })
      )

      try {
        await cleanupFile(oldPath, `chore: remove ${base} after move to ${toModule}/${toSubfolder}`)
      } catch (deleteError) {
        showToast(
          `Moved ${filename} to ${toModule}/${toSubfolder}, but the original couldn't be removed (${deleteError.message}) — delete ${oldPath} manually`,
          'error'
        )
        return
      }

      showToast(`Moved ${filename} to ${toModule}/${toSubfolder}`, 'success')
    } catch (error) {
      showToast(`Failed to move file: ${error.message}`, 'error')
    }
  }

  const handleDeleteFile = async (moduleId, subfolder, filename) => {
    try {
      const currentModulesJs = await getFileContent(MODULES_JS_PATH)
      const block = findModuleBlock(currentModulesJs, moduleId)
      const entry = findNoteEntry(currentModulesJs.slice(block.start, block.end), subfolder, filename)

      if (!entry) {
        showToast(`${filename} isn't registered in modules.js — nothing to delete`, 'error')
        return
      }

      const updatedModulesJs = removeNoteEntry(currentModulesJs, moduleId, entry.filename)
      await commitFileWithRetry(
        MODULES_JS_PATH,
        updatedModulesJs,
        `feat: remove ${entry.filename} from ${moduleId}`,
        moduleId
      )
      await deleteFile(
        notePathOnDisk(moduleId, entry.filename),
        `chore: remove ${entry.filename} from ${moduleId}`
      )

      refreshModuleState(setModules, prev =>
        prev.map(module =>
          module.id === moduleId
            ? { ...module, notes: (module.notes ?? []).filter(note => note.filename !== entry.filename) }
            : module
        )
      )
      showToast(`${filename} deleted`, 'success')
    } catch (error) {
      showToast(`Failed to delete ${filename}: ${error.message}`, 'error')
    }
  }

  const handleRenameFile = async (moduleId, subfolder, filename, newName) => {
    const problem = nameError(newName, { allowSlash: false })
    if (problem) {
      showToast(`Failed to rename ${filename}: ${problem}`, 'error')
      return
    }

    try {
      const currentModulesJs = await getFileContent(MODULES_JS_PATH)
      const block = findModuleBlock(currentModulesJs, moduleId)
      const moduleSource = currentModulesJs.slice(block.start, block.end)
      const entry = findNoteEntry(moduleSource, subfolder, filename)

      if (!entry) {
        showToast(`${filename} isn't registered in modules.js — nothing to rename`, 'error')
        return
      }

      const bareNewName = newName.replace(/\.md$/, '')
      const rest = entry.filename.slice(0, entry.filename.lastIndexOf('/') + 1)
      const newFilename = `${rest}${bareNewName}`
      const newLabel = `${bareNewName}.md`

      if ([...moduleSource.matchAll(NOTE_ENTRY_PATTERN)].some(match => match[1] === newFilename)) {
        showToast(`A note already exists at ${newFilename}`, 'error')
        return
      }

      const oldPath = notePathOnDisk(moduleId, entry.filename)
      const newPath = notePathOnDisk(moduleId, newFilename)

      const content = await getFileContent(oldPath)
      await commitFile(newPath, content, `feat: rename ${entry.filename} to ${newFilename} in ${moduleId}`)

      const updatedModulesJs = renameNoteFilenames(currentModulesJs, moduleId, [
        { oldFilename: entry.filename, newFilename },
      ])
      await commitFileWithRetry(
        MODULES_JS_PATH,
        updatedModulesJs,
        `feat: rename ${entry.filename} to ${newFilename} in ${moduleId}`,
        moduleId
      )

      refreshModuleState(setModules, prev =>
        prev.map(module =>
          module.id === moduleId
            ? {
                ...module,
                notes: (module.notes ?? []).map(note =>
                  note.filename === entry.filename ? { ...note, filename: newFilename, label: newLabel } : note
                ),
              }
            : module
        )
      )

      try {
        await cleanupFile(oldPath, `chore: remove ${entry.filename} after rename to ${newFilename}`)
      } catch (deleteError) {
        showToast(
          `Renamed to ${bareNewName}, but the original couldn't be removed (${deleteError.message}) — delete ${oldPath} manually`,
          'error'
        )
        return
      }

      showToast(`Renamed to ${bareNewName}`, 'success')
    } catch (error) {
      showToast(`Failed to rename ${filename}: ${error.message}`, 'error')
    }
  }

  return {
    handleNewModule,
    handleDeleteModule,
    handleRenameModule,
    handleNewSubfolder,
    handleRenameSubfolder,
    handleDeleteSubfolder,
    handleMoveFile,
    handleDeleteFile,
    handleRenameFile,
  }
}
