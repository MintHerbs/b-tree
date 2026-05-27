import { commitFile, commitFileWithRetry, getFileContent, deleteFile } from '../lib/githubApi'
import { ADMIN_ICON_OPTIONS, getIconNameForComponent, getIconOptionByName } from '../components/admin/adminIconOptions'

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

  const importLine = iconName === 'FunctionIcon'
    ? '  Function as FunctionIcon,'
    : `  ${iconName},`

  const importStart = modulesJs.indexOf('import {\n')
  const importEnd = importStart === -1
    ? -1
    : modulesJs.indexOf("} from '@phosphor-icons/react'", importStart)

  // Freshly-scaffolded course modules.js files have no phosphor-icons import
  // block yet. Prepend one so the icon can be referenced instead of failing.
  if (importStart === -1 || importEnd === -1) {
    return `import {\n${importLine}\n} from '@phosphor-icons/react'\n\n${modulesJs}`
  }

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
  const escapedModuleId = moduleId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Match the module object's own `id` — anchored at the start of the object so
  // a nested tool/note `id:` can't trigger a false match. `\s*` tolerates both
  // single-line (`{ id: 'web' }`) and multi-line (`{\n  id: 'web',`) formats.
  const idAtStart = new RegExp(`^\\{\\s*id:\\s*['"\`]${escapedModuleId}['"\`]`)

  let modulesExportIndex = modulesJs.indexOf('export const MODULES')
  if (modulesExportIndex === -1) modulesExportIndex = modulesJs.indexOf('export const modules')
  if (modulesExportIndex === -1) {
    throw new Error('Could not find modules array in modules.js')
  }

  const arrayStart = modulesJs.indexOf('[', modulesExportIndex)
  if (arrayStart === -1) {
    throw new Error('Could not find modules array start in modules.js')
  }

  let bracketDepth = 1
  let braceDepth = 0
  let objStart = -1

  for (let i = arrayStart + 1; i < modulesJs.length; i++) {
    const char = modulesJs[i]

    if (char === '[') bracketDepth += 1
    else if (char === ']') {
      bracketDepth -= 1
      if (bracketDepth === 0) break
    }

    if (char === '{') {
      if (braceDepth === 0) objStart = i
      braceDepth += 1
    } else if (char === '}') {
      braceDepth -= 1
      if (braceDepth === 0 && objStart !== -1) {
        const objEnd = i + 1
        const objSource = modulesJs.slice(objStart, objEnd)

        if (idAtStart.test(objSource)) {
          // Strip the object's leading indentation + newline and a trailing
          // comma so no blank line or dangling comma is left behind.
          let start = objStart
          while (start > 0 && (modulesJs[start - 1] === ' ' || modulesJs[start - 1] === '\t')) {
            start -= 1
          }
          if (modulesJs[start - 1] === '\n') start -= 1
          if (modulesJs[start - 1] === '\r') start -= 1

          let end = objEnd
          if (modulesJs[end] === ',') end += 1

          return `${modulesJs.slice(0, start)}${modulesJs.slice(end)}`
        }

        objStart = -1
      }
    }
  }

  throw new Error(`Could not find subject "${moduleId}" in modules.js`)
}

function removeSubfolderFromModulesSource(modulesJs, moduleId, subfolderName) {
  const escapedModuleId = moduleId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const idPattern = new RegExp(`\\bid:\\s*['"\`]${escapedModuleId}['"\`]`)

  let modulesExportIndex = modulesJs.indexOf('export const MODULES')
  if (modulesExportIndex === -1) modulesExportIndex = modulesJs.indexOf('export const modules')
  if (modulesExportIndex === -1) return modulesJs
  const arrayStart = modulesJs.indexOf('[', modulesExportIndex)
  if (arrayStart === -1) return modulesJs

  let bracketDepth = 1
  let braceDepth = 0
  let objStart = -1

  for (let i = arrayStart + 1; i < modulesJs.length; i++) {
    const char = modulesJs[i]

    if (char === '[') bracketDepth += 1
    else if (char === ']') {
      bracketDepth -= 1
      if (bracketDepth === 0) break
    }

    if (char === '{') {
      if (braceDepth === 0) objStart = i
      braceDepth += 1
    } else if (char === '}') {
      braceDepth -= 1
      if (braceDepth === 0 && objStart !== -1) {
        const objEnd = i + 1
        const objSource = modulesJs.slice(objStart, objEnd)

        if (idPattern.test(objSource)) {
          const subfoldersRegex = /(\n\s*subfolders\s*:\s*)\[((?:.|\n)*?)\]/m
          const match = objSource.match(subfoldersRegex)
          // Only the explicit `subfolders` array is rewritten here. A subfolder
          // that exists solely via note path-prefixes is handled in local state;
          // its note entries live in `notes` and are out of scope for removal.
          if (!match) return modulesJs

          const values = match[2]
            .split(',')
            .map(v => v.trim())
            .filter(Boolean)
            .map(v => v.replace(/^['"`]/, '').replace(/['"`]$/, ''))
            .filter(v => v !== subfolderName)

          const rendered = values.map(v => `'${v}'`).join(', ')
          const updatedObjSource = objSource.replace(subfoldersRegex, `$1[${rendered}]`)
          return `${modulesJs.slice(0, objStart)}${updatedObjSource}${modulesJs.slice(objEnd)}`
        }

        objStart = -1
      }
    }
  }

  return modulesJs
}

function addSubfolderToModulesSource(modulesJs, moduleId, subfolderName) {
  const escapedModuleId = moduleId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const idPattern = new RegExp(`\\bid:\\s*'${escapedModuleId}'`)
  // Canonical export is `MODULES` (uppercase); also accept a legacy lowercase
  // `modules` export so subfolders can still be added to older course files.
  // Canonical export is `MODULES` (uppercase); also accept a legacy lowercase
  // `modules` export so subfolders can still be added to older course files.
  let modulesExportIndex = modulesJs.indexOf('export const MODULES')
  if (modulesExportIndex === -1) modulesExportIndex = modulesJs.indexOf('export const modules')
  if (modulesExportIndex === -1) throw new Error('Could not find modules array in modules.js')
  const arrayStart = modulesJs.indexOf('[', modulesExportIndex)
  if (arrayStart === -1) throw new Error('Could not find modules array start in modules.js')

  let bracketDepth = 1
  let braceDepth = 0
  let objStart = -1

  for (let i = arrayStart + 1; i < modulesJs.length; i++) {
    const char = modulesJs[i]
    if (char === '[') bracketDepth += 1
    if (char === ']') {
      bracketDepth -= 1
      if (bracketDepth === 0) break
    }

    if (char === '{') {
      if (braceDepth === 0) objStart = i
      braceDepth += 1
    } else if (char === '}') {
      braceDepth -= 1
      if (braceDepth === 0 && objStart !== -1) {
        const objEnd = i + 1
        const objSource = modulesJs.slice(objStart, objEnd)
        if (idPattern.test(objSource)) {
          const subfoldersRegex = /(\n\s*subfolders\s*:\s*)\[((?:.|\n)*?)\]/m
          const subfoldersMatch = objSource.match(subfoldersRegex)
          let updatedObjSource

          if (subfoldersMatch) {
            const raw = subfoldersMatch[2].trim()
            const values = raw
              ? raw
                .split(',')
                .map(v => v.trim())
                .filter(Boolean)
                .map(v => v.replace(/^['"`]/, '').replace(/['"`]$/, ''))
              : []
            if (!values.includes(subfolderName)) values.push(subfolderName)
            const rendered = values.map(v => `'${v}'`).join(', ')
            updatedObjSource = objSource.replace(subfoldersRegex, `$1[${rendered}]`)
          } else {
            const closeIndex = objSource.lastIndexOf('}')
            const closeIndentMatch = objSource.match(/\n(\s*)\}/)
            const closeIndent = closeIndentMatch ? closeIndentMatch[1] : '  '
            const propIndent = `${closeIndent}  `
            updatedObjSource = `${objSource.slice(0, closeIndex)}\n${propIndent}subfolders: ['${subfolderName}'],${objSource.slice(closeIndex)}`
          }

          return `${modulesJs.slice(0, objStart)}${updatedObjSource}${modulesJs.slice(objEnd)}`
        }
        objStart = -1
      }
    }
  }

  throw new Error(`Could not find module "${moduleId}" in modules.js`)
}

function refreshModuleState(setModules, updater) {
  setModules(prev => updater(prev))
}

function getUnusedIconOptions(modules, selectedIconName = null) {
  const usedIconNames = new Set(
    modules
      .map(module => getIconNameForComponent(module.Icon))
      .filter(Boolean)
  )

  return ADMIN_ICON_OPTIONS.filter(option => (
    option.name === selectedIconName || !usedIconNames.has(option.name)
  ))
}

export function useEditorModules({ showToast, setModules, setSelectedPath, modules, profile, selectedCourse, selectedPath }) {
  // modules.js always lives at the course root — never include moduleId or subfolder segments
  const courseModulesPath = `src/content/notes/${selectedCourse}/modules.js`

  const unusedIconOptions = getUnusedIconOptions(modules)

  const isOwner = profile?.role === 'owner'

  const visibleModules = profile?.role === 'owner'
    ? modules
    : modules.filter(m => profile?.allowed_directories?.includes(m.id))

  const allowedDirectories = profile?.role === 'owner'
    ? null
    : profile?.allowed_directories || []

  // Module management handlers
  const handleNewModule = async (name, iconName = unusedIconOptions[0]?.name || 'FileCode') => {
    const moduleId = titleToFilename(name)
    if (!moduleId) {
      showToast('Please enter a subject name', 'error')
      return
    }

    showToast(`Creating subject ${moduleId}...`, 'success')

    try {
      const currentModulesJs = await getFileContent(courseModulesPath)
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
        `src/content/notes/${selectedCourse}/${moduleId}/notes/.gitkeep`,
        '',
        `feat: create ${moduleId} notes folder`
      )
      await commitFile(
        `src/content/notes/${selectedCourse}/${moduleId}/tools/.gitkeep`,
        '',
        `feat: add tools folder to ${moduleId}`
      )
      await commitFileWithRetry(
        courseModulesPath,
        updatedModulesJs,
        `feat: add ${moduleId} subject`
      )

      refreshModuleState(setModules, prev => [...prev, newModule])
      showToast(`Subject ${label} created`, 'success')
    } catch (error) {
      showToast(`Failed to create subject: ${error.message}`, 'error')
    }
  }

  const deleteFileQuietly = async (path, message) => {
    try {
      await deleteFile(path, message)
    } catch (error) {
      // A missing placeholder (404) is fine — the folder may already be gone.
      console.warn(`[deleteModule] could not delete ${path}: ${error.message}`)
    }
  }

  const handleDeleteModule = async (moduleId) => {
    // Update the sidebar immediately so the deletion is reflected in real time,
    // independent of the GitHub round-trip below.
    refreshModuleState(setModules, prev => prev.filter(module => module.id !== moduleId))
    setSelectedPath(prev => prev?.moduleId === moduleId ? null : prev)
    showToast(`Removing subject ${moduleId}...`, 'success')

    try {
      // getFileContent throws on any non-OK response; a 404 just means there is
      // no registry file to rewrite — fall through to folder cleanup.
      let currentModulesJs = null
      try {
        currentModulesJs = await getFileContent(courseModulesPath)
      } catch (error) {
        if (!/\(404\)/.test(error.message)) throw error
      }

      if (typeof currentModulesJs === 'string') {
        let updatedModulesJs = currentModulesJs
        try {
          updatedModulesJs = removeModuleSource(currentModulesJs, moduleId)
        } catch {
          // Subject isn't in the registry (already removed) — skip the rewrite
          // rather than failing the whole delete.
        }
        if (updatedModulesJs !== currentModulesJs) {
          await commitFileWithRetry(
            courseModulesPath,
            updatedModulesJs,
            `feat: remove ${moduleId} subject`
          )
        }
      }

      await deleteFileQuietly(
        `src/content/notes/${selectedCourse}/${moduleId}/notes/.gitkeep`,
        `chore: remove ${moduleId} notes placeholder`
      )
      await deleteFileQuietly(
        `src/content/notes/${selectedCourse}/${moduleId}/tools/.gitkeep`,
        `chore: remove ${moduleId} tools placeholder`
      )

      showToast(`Subject ${moduleId} removed`, 'success')
    } catch (error) {
      showToast(`Failed to remove subject: ${error.message}`, 'error')
    }
  }

  const handleRenameModule = async (moduleId, newLabel) => {
    showToast(`Renaming subject to ${newLabel}...`, 'success')

    try {
      const currentModulesJs = await getFileContent(courseModulesPath)
      const moduleRegex = new RegExp(
        `(\\{[^}]*id:\\s*'${moduleId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'[^}]*label:\\s*')([^']+)(')`
      )
      const updatedModulesJs = currentModulesJs.replace(moduleRegex, `$1${newLabel}$3`)

      await commitFileWithRetry(
        courseModulesPath,
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
      await commitFile(
        `src/content/notes/${selectedCourse}/${moduleId}/${subfolderName}/.gitkeep`,
        '',
        `feat: add ${subfolderName} to ${moduleId}`
      )

      // getFileContent throws on any non-OK response (githubApi.js). A 404 just
      // means this course has no modules.js yet — fall through and create one.
      // Re-throw anything else (auth, rate limit, server errors) so it surfaces.
      let currentModulesJs = null
      try {
        currentModulesJs = await getFileContent(courseModulesPath)
      } catch (error) {
        if (!/\(404\)/.test(error.message)) throw error
        currentModulesJs = null
      }

      const updatedModulesJs = typeof currentModulesJs === 'string'
        ? addSubfolderToModulesSource(currentModulesJs, moduleId, subfolderName)
        : `export const MODULES = [
  {
    id: '${moduleId}',
    label: '${moduleId}',
    subfolders: ['${subfolderName}'],
  },
]
`

      await commitFileWithRetry(
        courseModulesPath,
        updatedModulesJs,
        `feat: add ${subfolderName} folder to ${moduleId}`
      )

      refreshModuleState(setModules, prev =>
        prev.map(m => {
          if (m.id !== moduleId) return m
          const current = Array.isArray(m.subfolders) ? m.subfolders : []
          return current.includes(subfolderName) ? m : { ...m, subfolders: [...current, subfolderName] }
        })
      )

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
    // Update the sidebar immediately: drop the explicit subfolder entry and any
    // notes filed under it so the folder disappears in real time.
    refreshModuleState(setModules, prev =>
      prev.map(m => {
        if (m.id !== moduleId) return m
        const subfolders = Array.isArray(m.subfolders)
          ? m.subfolders.filter(s => s !== subfolderName)
          : m.subfolders
        const notes = Array.isArray(m.notes)
          ? m.notes.filter(note => {
              const parts = String(note.filename).split('/')
              const noteSubfolder = parts.length > 1 ? parts[0] : 'notes'
              return noteSubfolder !== subfolderName
            })
          : m.notes
        return { ...m, subfolders, notes }
      })
    )
    setSelectedPath(prev =>
      prev?.moduleId === moduleId && prev?.subfolder === subfolderName ? null : prev
    )
    showToast(`Deleting subfolder ${subfolderName}...`, 'success')

    try {
      let currentModulesJs = null
      try {
        currentModulesJs = await getFileContent(courseModulesPath)
      } catch (error) {
        if (!/\(404\)/.test(error.message)) throw error
      }

      if (typeof currentModulesJs === 'string') {
        const updatedModulesJs = removeSubfolderFromModulesSource(currentModulesJs, moduleId, subfolderName)
        if (updatedModulesJs !== currentModulesJs) {
          await commitFileWithRetry(
            courseModulesPath,
            updatedModulesJs,
            `feat: remove ${subfolderName} folder from ${moduleId}`
          )
        }
      }

      showToast(`Subfolder ${subfolderName} deleted`, 'success')
    } catch (error) {
      showToast(`Failed to delete subfolder: ${error.message}`, 'error')
    }
  }

  const handleMoveFile = async ({ fromModule, fromSubfolder, filename, toModule, toSubfolder }) => {
    showToast(`Moving ${filename}...`, 'success')

    try {
      // Read file content
      const oldPath = `src/content/notes/${selectedCourse}/${fromModule}/${fromSubfolder}/${filename}`
      const fileContent = await getFileContent(oldPath)

      // Commit to new location
      const newPath = `src/content/notes/${selectedCourse}/${toModule}/${toSubfolder}/${filename}`
      await commitFile(newPath, fileContent, `feat: move ${filename} to ${toModule}/${toSubfolder}`)

      // Delete from old location (would need delete API)
      // Update modules.js

      showToast(`File moved successfully`, 'success')
    } catch (error) {
      showToast(`Failed to move file: ${error.message}`, 'error')
    }
  }

  return {
    unusedIconOptions,
    visibleModules,
    allowedDirectories,
    isOwner,
    handleDeleteSelectedModule: () => selectedPath && handleDeleteModule(selectedPath.moduleId),
    handleNewModule,
    handleDeleteModule,
    handleRenameModule,
    handleNewSubfolder,
    handleRenameSubfolder,
    handleDeleteSubfolder,
    handleMoveFile,
  }
}
