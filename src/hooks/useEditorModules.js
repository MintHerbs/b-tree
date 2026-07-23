import { commitFileWithRetry, getFileContent } from '../lib/githubApi'
import { getIconOptionByName } from '../components/admin/adminIconOptions'
import {
  createFolder, renameFolder, deleteFolder, moveNote, deleteNote, deleteModuleNotes, baseName,
} from '../lib/notesApi'
import { invalidateNotesRegistry } from './useNotesRegistry'

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

// Admin-typed names are still interpolated into single-quoted JS string
// literals in modules.js for the STRUCTURAL module block (id/label). A quote,
// backslash, or line break would produce invalid JS and break the build, so
// reject them up front. `/` is barred where a name must be a single segment.
function nameError(name, { allowSlash = true } = {}) {
  const trimmed = (name ?? '').trim()
  if (!trimmed) return 'Please enter a name'
  if (/['"\\]/.test(trimmed)) return 'Name cannot contain quotes or backslashes'
  if (/[\n\r\t]/.test(trimmed)) return 'Name cannot contain line breaks or tabs'
  if (!allowSlash && trimmed.includes('/')) return 'Name cannot contain a slash'
  return null
}

// ─── Structural modules.js editing (module create/delete/rename only) ─────────
// A module carries a live React Icon component and a route, so its definition
// stays in code. These three helpers edit the STRUCTURAL block only; note
// content lives in the DB and is never written here. A module change is a
// GitHub commit and only fully takes effect on the next deploy — the optimistic
// setModules keeps the admin UI in step in the meantime.

const MODULES_JS_PATH = 'src/components/layout/Sidebar/modules.js'

function moduleToSource(module) {
  const lines = [
    '  {',
    `    id: '${module.id}',`,
    `    label: '${module.label}',`,
    `    Icon: ${module.iconName},`,
  ]
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

export function useEditorModules({ showToast, setModules, setSelectedPath, unusedIconOptions, isOwner, reloadModules }) {
  // ── Structural: create / delete / rename a subject (modules.js commit) ──────
  const handleNewModule = async (name, iconName = unusedIconOptions[0]?.name || 'FileCode') => {
    const problem = nameError(name)
    if (problem) { showToast(problem, 'error'); return }
    const moduleId = titleToFilename(name)
    if (!moduleId) { showToast('Please enter a subject name', 'error'); return }

    showToast(`Creating subject ${moduleId}...`, 'success')
    try {
      const currentModulesJs = await getFileContent(MODULES_JS_PATH)
      const iconOption = getIconOptionByName(iconName)
      const newModule = { id: moduleId, label: name.trim(), iconName: iconOption.name, Icon: iconOption.Icon, tools: [] }
      const updatedModulesJs = insertModuleSource(ensureIconImport(currentModulesJs, iconOption.name), newModule)

      await commitFileWithRetry(MODULES_JS_PATH, updatedModulesJs, `feat: add ${moduleId} subject`)

      refreshModuleState(setModules, prev => [...prev, newModule])
      showToast(`Subject ${newModule.label} created (live after next deploy)`, 'success')
    } catch (error) {
      showToast(`Failed to create subject: ${error.message}`, 'error')
    }
  }

  const handleDeleteModule = async (moduleId) => {
    showToast(`Removing subject ${moduleId}...`, 'success')
    try {
      const currentModulesJs = await getFileContent(MODULES_JS_PATH)
      const updatedModulesJs = removeModuleSource(currentModulesJs, moduleId)
      await commitFileWithRetry(MODULES_JS_PATH, updatedModulesJs, `feat: remove ${moduleId} subject`)

      // Purge the subject's note content + folders from the DB.
      await deleteModuleNotes(moduleId)
      invalidateNotesRegistry()

      refreshModuleState(setModules, prev => prev.filter(module => module.id !== moduleId))
      setSelectedPath(prev => prev?.moduleId === moduleId ? null : prev)
      showToast(`Subject ${moduleId} removed`, 'success')
    } catch (error) {
      showToast(`Failed to remove subject: ${error.message}`, 'error')
    }
  }

  const handleRenameModule = async (moduleId, newLabel) => {
    const problem = nameError(newLabel)
    if (problem) { showToast(problem, 'error'); return }
    showToast(`Renaming subject to ${newLabel}...`, 'success')
    try {
      const currentModulesJs = await getFileContent(MODULES_JS_PATH)
      const moduleRegex = new RegExp(
        `(\\{[^}]*id:\\s*'${moduleId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'[^}]*label:\\s*')([^']+)(')`
      )
      const updatedModulesJs = currentModulesJs.replace(moduleRegex, `$1${newLabel}$3`)
      await commitFileWithRetry(MODULES_JS_PATH, updatedModulesJs, `feat: rename ${moduleId} to ${newLabel}`)

      refreshModuleState(setModules, prev => prev.map(m => m.id === moduleId ? { ...m, label: newLabel } : m))
      showToast(`Subject renamed to ${newLabel} (live after next deploy)`, 'success')
    } catch (error) {
      showToast(`Failed to rename subject: ${error.message}`, 'error')
    }
  }

  // ── Folders (note_folders table) ────────────────────────────────────────────
  const handleNewSubfolder = async (moduleId, subfolderName) => {
    const problem = nameError(subfolderName, { allowSlash: false })
    if (problem) { showToast(`Failed to create subfolder: ${problem}`, 'error'); return }
    try {
      await createFolder(moduleId, subfolderName)
      invalidateNotesRegistry()
      await reloadModules?.()
      showToast(`Subfolder ${subfolderName} created`, 'success')
    } catch (error) {
      showToast(`Failed to create subfolder: ${error.message}`, 'error')
    }
  }

  const handleRenameSubfolder = async (moduleId, oldName, newName) => {
    const problem = nameError(newName, { allowSlash: false })
    if (problem) { showToast(`Failed to rename subfolder: ${problem}`, 'error'); return }
    showToast(`Renaming ${oldName} to ${newName}...`, 'success')
    try {
      await renameFolder(moduleId, oldName, newName)
      invalidateNotesRegistry()
      await reloadModules?.()
      setSelectedPath(prev =>
        prev?.moduleId === moduleId && prev?.subfolder === oldName ? { ...prev, subfolder: newName } : prev
      )
      showToast(`Subfolder renamed to ${newName}`, 'success')
    } catch (error) {
      showToast(`Failed to rename subfolder: ${error.message}`, 'error')
    }
  }

  const handleDeleteSubfolder = async (moduleId, subfolderName) => {
    showToast(`Deleting subfolder ${subfolderName}...`, 'success')
    try {
      const removed = await deleteFolder(moduleId, subfolderName)
      invalidateNotesRegistry()
      await reloadModules?.()
      setSelectedPath(prev =>
        prev?.moduleId === moduleId && prev?.subfolder === subfolderName ? null : prev
      )
      showToast(
        removed > 0
          ? `Subfolder ${subfolderName} and ${removed} note${removed === 1 ? '' : 's'} deleted`
          : `Subfolder ${subfolderName} removed`,
        'success'
      )
    } catch (error) {
      showToast(`Failed to delete subfolder: ${error.message}`, 'error')
    }
  }

  // ── Notes (notes table) ──────────────────────────────────────────────────────
  const handleMoveFile = async ({ fromModule, fromSubfolder, fromPath, toModule, toSubfolder }) => {
    const base = baseName(fromPath)
    const newPath = `${toSubfolder}/${base}`
    if (fromModule === toModule && fromSubfolder === toSubfolder) return

    const isCrossSubject = fromModule !== toModule
    if (isCrossSubject && !isOwner) {
      showToast('Moving notes between subjects is owner-only', 'error')
      return
    }

    showToast(`Moving ${base}...`, 'success')
    try {
      await moveNote({ fromModuleId: fromModule, fromPath, toModuleId: toModule, toPath: newPath })
      invalidateNotesRegistry()
      await reloadModules?.()
      showToast(`Moved ${base} to ${toModule}/${toSubfolder}`, 'success')
    } catch (error) {
      showToast(`Failed to move file: ${error.message}`, 'error')
    }
  }

  const handleDeleteFile = async (moduleId, path) => {
    try {
      await deleteNote(moduleId, path)
      invalidateNotesRegistry()
      await reloadModules?.()
      showToast(`${baseName(path)} deleted`, 'success')
    } catch (error) {
      showToast(`Failed to delete ${baseName(path)}: ${error.message}`, 'error')
    }
  }

  const handleRenameFile = async (moduleId, path, newName) => {
    const problem = nameError(newName, { allowSlash: false })
    if (problem) { showToast(`Failed to rename: ${problem}`, 'error'); return }
    try {
      const bareNewName = newName.replace(/\.md$/, '')
      const dir = path.includes('/') ? path.slice(0, path.lastIndexOf('/') + 1) : ''
      const newPath = `${dir}${bareNewName}`
      await moveNote({ fromModuleId: moduleId, fromPath: path, toModuleId: moduleId, toPath: newPath, title: `${bareNewName}.md` })
      invalidateNotesRegistry()
      await reloadModules?.()
      showToast(`Renamed to ${bareNewName}`, 'success')
    } catch (error) {
      showToast(`Failed to rename: ${error.message}`, 'error')
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
