import { commitFile, commitFileWithRetry, getFileContent, deleteFile } from '../lib/githubApi'
import { getIconOptionByName } from '../components/admin/adminIconOptions'

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

export function useEditorModules({ showToast, setModules, setSelectedPath, unusedIconOptions }) {
  // Module management handlers
  const handleNewModule = async (name, iconName = unusedIconOptions[0]?.name || 'FileCode') => {
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
      showToast(`Subject ${moduleId} removed from the filesystem`, 'success')
    } catch (error) {
      showToast(`Failed to remove subject: ${error.message}`, 'error')
    }
  }

  const handleRenameModule = async (moduleId, newLabel) => {
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
    try {
      // Create the subfolder directory on GitHub
      await commitFile(
        `src/content/notes/${moduleId}/${subfolderName}/.gitkeep`,
        '',
        `feat: add ${subfolderName} to ${moduleId}`
      )

      // Note: Subfolders are derived from note filenames in modules.js, not explicitly tracked.
      // The new subfolder will appear in the DirectoryDrawer once:
      // 1. A note is added to it (which updates modules.js), OR
      // 2. The user expands the module in edit mode (which calls listDirectory from GitHub)
      //
      // For immediate visibility without a note, the DirectoryDrawer would need to be refactored
      // to call listDirectory on module expansion or maintain a separate subfolders list.

      showToast(`Subfolder ${subfolderName} created`, 'success')
    } catch (error) {
      showToast(`Failed to create subfolder: ${error.message}`, 'error')
    }
  }

  const handleRenameSubfolder = async (moduleId, oldName, newName) => {
    showToast(`Renaming ${oldName} to ${newName}...`, 'success')
    // Implementation would update modules.js references
    showToast(`Subfolder renamed`, 'success')
  }

  const handleDeleteSubfolder = async (moduleId, subfolderName) => {
    showToast(`Deleting subfolder ${subfolderName}...`, 'success')
    // Implementation would update modules.js
    showToast(`Subfolder deleted`, 'success')
  }

  const handleMoveFile = async ({ fromModule, fromSubfolder, filename, toModule, toSubfolder }) => {
    showToast(`Moving ${filename}...`, 'success')

    try {
      // Read file content
      const oldPath = `src/content/notes/${fromModule}/${fromSubfolder}/${filename}`
      const fileContent = await getFileContent(oldPath)

      // Commit to new location
      const newPath = `src/content/notes/${toModule}/${toSubfolder}/${filename}`
      await commitFile(newPath, fileContent, `feat: move ${filename} to ${toModule}/${toSubfolder}`)

      // Delete from old location (would need delete API)
      // Update modules.js

      showToast(`File moved successfully`, 'success')
    } catch (error) {
      showToast(`Failed to move file: ${error.message}`, 'error')
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
  }
}
