import { commitFile, commitFileWithRetry, getFileContent, deleteFile, listDirectory } from '../lib/githubApi'
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

// Locate a single module object inside the MODULES array by its `id`, returning
// the [objStart, objEnd) bounds in the source. Mirrors the brace-matching used
// by removeModuleSource so nested tool/note `id:` keys can't cause a false match.
function findModuleBounds(modulesJs, moduleId) {
  const escapedModuleId = moduleId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const idAtStart = new RegExp(`^\\{\\s*id:\\s*['"\`]${escapedModuleId}['"\`]`)

  let modulesExportIndex = modulesJs.indexOf('export const MODULES')
  if (modulesExportIndex === -1) modulesExportIndex = modulesJs.indexOf('export const modules')
  if (modulesExportIndex === -1) return null
  const arrayStart = modulesJs.indexOf('[', modulesExportIndex)
  if (arrayStart === -1) return null

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
        if (idAtStart.test(modulesJs.slice(objStart, objEnd))) {
          return { objStart, objEnd }
        }
        objStart = -1
      }
    }
  }

  return null
}

// Add a `{ filename, label }` note entry to a module object's `notes` array,
// creating the array if the module doesn't have one yet.
function insertNoteEntryIntoModuleSource(moduleSource, noteEntry) {
  const notesPattern = /(notes:\s*\[)([\s\S]*?)(\])/m
  if (notesPattern.test(moduleSource)) {
    return moduleSource.replace(notesPattern, `$1$2      ${noteEntry}\n    $3`)
  }
  const closeIndex = moduleSource.lastIndexOf('}')
  return `${moduleSource.slice(0, closeIndex)}  notes: [\n      ${noteEntry}\n    ],\n  ${moduleSource.slice(closeIndex)}`
}

// Update modules.js so the registry entry for a moved note points at its new
// location. Notes are stored as `{ filename: '<subfolder>/<file>', label }`
// inside each module's `notes` array. A move within the same module just
// rewrites the filename in place; a move to a different module strips the entry
// from the source module and appends it (with the new path) to the target.
function moveNoteInModulesSource(modulesJs, { fromModule, fromSubfolder, toModule, toSubfolder, filename }) {
  const oldRel = `${fromSubfolder}/${filename}`
  const newRel = `${toSubfolder}/${filename}`
  const escapedOldRel = oldRel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const fromBounds = findModuleBounds(modulesJs, fromModule)
  if (!fromBounds) {
    throw new Error(`Could not find module "${fromModule}" in modules.js`)
  }

  const fromSource = modulesJs.slice(fromBounds.objStart, fromBounds.objEnd)
  // Note objects have no nested braces, so [^{}] keeps the match to one entry.
  const noteRegex = new RegExp(`\\{[^{}]*filename:\\s*['"\`]${escapedOldRel}['"\`][^{}]*\\}`)
  const noteMatch = fromSource.match(noteRegex)
  if (!noteMatch) {
    throw new Error(`Could not find note "${oldRel}" in module "${fromModule}"`)
  }

  if (fromModule === toModule) {
    const rewritten = noteMatch[0].replace(
      new RegExp(`filename:\\s*['"\`]${escapedOldRel}['"\`]`),
      `filename: '${newRel}'`
    )
    const updatedSource = fromSource.replace(noteRegex, rewritten)
    return `${modulesJs.slice(0, fromBounds.objStart)}${updatedSource}${modulesJs.slice(fromBounds.objEnd)}`
  }

  // Preserve the note's label when moving it to another module.
  const labelMatch = noteMatch[0].match(/label:\s*['"`]([^'"`]*)['"`]/)
  const label = labelMatch ? labelMatch[1] : filename

  // 1. Strip the entry (and its trailing comma + indentation) from the source module.
  const removeRegex = new RegExp(`\\s*\\{[^{}]*filename:\\s*['"\`]${escapedOldRel}['"\`][^{}]*\\},?`)
  const fromSourceWithout = fromSource.replace(removeRegex, '')
  const working = `${modulesJs.slice(0, fromBounds.objStart)}${fromSourceWithout}${modulesJs.slice(fromBounds.objEnd)}`

  // 2. Append the entry (with the new path) to the destination module.
  const toBounds = findModuleBounds(working, toModule)
  if (!toBounds) {
    throw new Error(`Could not find module "${toModule}" in modules.js`)
  }
  const toSource = working.slice(toBounds.objStart, toBounds.objEnd)
  const newEntry = `{ filename: '${newRel}', label: '${label}' },`
  const updatedToSource = insertNoteEntryIntoModuleSource(toSource, newEntry)
  return `${working.slice(0, toBounds.objStart)}${updatedToSource}${working.slice(toBounds.objEnd)}`
}

// Rename a subfolder inside a single module object: rewrite every note
// `filename` whose path is prefixed with `<oldName>/` to `<newName>/`, and
// rename the matching entry in the explicit `subfolders` array if present.
// Notes filed under the implicit default folder (bare `file.md`, no `/`) are
// left untouched. Returns the source unchanged if nothing in the module
// references the old subfolder.
function renameSubfolderInModulesSource(modulesJs, moduleId, oldName, newName) {
  const bounds = findModuleBounds(modulesJs, moduleId)
  if (!bounds) {
    throw new Error(`Could not find module "${moduleId}" in modules.js`)
  }

  let source = modulesJs.slice(bounds.objStart, bounds.objEnd)
  const escapedOld = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // Rewrite note path prefixes: `filename: '<oldName>/...'` → `'<newName>/...'`.
  const noteFilenameRegex = new RegExp(`(filename:\\s*['"\`])${escapedOld}/`, 'g')
  source = source.replace(noteFilenameRegex, `$1${newName}/`)

  // Rewrite the matching value in an explicit `subfolders` array, if any.
  const subfoldersRegex = /(\n\s*subfolders\s*:\s*)\[((?:.|\n)*?)\]/m
  const subfoldersMatch = source.match(subfoldersRegex)
  if (subfoldersMatch) {
    const values = subfoldersMatch[2]
      .split(',')
      .map(v => v.trim())
      .filter(Boolean)
      .map(v => v.replace(/^['"`]/, '').replace(/['"`]$/, ''))
      .map(v => (v === oldName ? newName : v))
    const rendered = values.map(v => `'${v}'`).join(', ')
    source = source.replace(subfoldersRegex, `$1[${rendered}]`)
  }

  return `${modulesJs.slice(0, bounds.objStart)}${source}${modulesJs.slice(bounds.objEnd)}`
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

    try {
      // 1. GitHub has no native folder rename — move each file individually:
      //    copy it to the new subfolder path, then delete the original. Only
      //    reaches the success toast if every step below succeeds.
      const oldDir = `src/content/notes/${selectedCourse}/${moduleId}/${oldName}`
      const files = await listDirectory(oldDir)
      for (const file of files) {
        const oldFilePath = `${oldDir}/${file.name}`
        const newFilePath = `src/content/notes/${selectedCourse}/${moduleId}/${newName}/${file.name}`
        const content = await getFileContent(oldFilePath)
        await commitFile(newFilePath, content, `feat: rename ${oldName} to ${newName} (${file.name})`)
        await deleteFile(oldFilePath, `feat: remove ${file.name} from ${oldName}`)
      }

      // 2. Update the course registry so note path prefixes and the explicit
      //    subfolders entry point at the new name instead of the old one.
      const currentModulesJs = await getFileContent(courseModulesPath)
      const updatedModulesJs = renameSubfolderInModulesSource(
        currentModulesJs,
        moduleId,
        oldName,
        newName
      )
      if (updatedModulesJs !== currentModulesJs) {
        await commitFileWithRetry(
          courseModulesPath,
          updatedModulesJs,
          `feat: rename ${oldName} folder to ${newName} in ${moduleId}`
        )
      }

      // 3. Update local state: rename the subfolder entry and rewrite the path
      //    prefix of every note filed under it.
      refreshModuleState(setModules, prev =>
        prev.map(m => {
          if (m.id !== moduleId) return m
          const subfolders = Array.isArray(m.subfolders)
            ? m.subfolders.map(s => (s === oldName ? newName : s))
            : m.subfolders
          const notes = Array.isArray(m.notes)
            ? m.notes.map(note => {
                const parts = String(note.filename).split('/')
                if (parts.length > 1 && parts[0] === oldName) {
                  return { ...note, filename: `${newName}/${parts.slice(1).join('/')}` }
                }
                return note
              })
            : m.notes
          return { ...m, subfolders, notes }
        })
      )
      setSelectedPath(prev =>
        prev?.moduleId === moduleId && prev?.subfolder === oldName
          ? { ...prev, subfolder: newName }
          : prev
      )

      showToast(`Subfolder renamed to ${newName}`, 'success')
    } catch (error) {
      showToast(`Failed to rename subfolder: ${error.message}`, 'error')
    }
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
      // 1. Read the source note and commit a copy to the new location.
      const oldPath = `src/content/notes/${selectedCourse}/${fromModule}/${fromSubfolder}/${filename}`
      const fileContent = await getFileContent(oldPath)

      const newPath = `src/content/notes/${selectedCourse}/${toModule}/${toSubfolder}/${filename}`
      await commitFile(newPath, fileContent, `feat: move ${filename} to ${toModule}/${toSubfolder}`)

      // 2. Update the course registry so the note entry points at the new path
      // instead of leaving a stale entry for the now-moved file.
      const currentModulesJs = await getFileContent(courseModulesPath)
      const updatedModulesJs = moveNoteInModulesSource(currentModulesJs, {
        fromModule,
        fromSubfolder,
        toModule,
        toSubfolder,
        filename,
      })
      await commitFileWithRetry(
        courseModulesPath,
        updatedModulesJs,
        `feat: move ${filename} registry entry to ${toModule}/${toSubfolder}`
      )

      // 3. Delete the original file now that the copy and registry are in place.
      await deleteFile(oldPath, `feat: remove ${filename} from ${fromModule}/${fromSubfolder}`)

      // Only reached if every step above succeeded.
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
