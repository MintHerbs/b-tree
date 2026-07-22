import { listDirectory, uploadImage, commitFile, commitFileWithRetry, getFileContent, cleanupFile } from '../lib/githubApi'
import { supabase } from '../lib/supabaseClient'

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

function findModuleBlock(modulesJs, moduleId) {
  const escapedId = moduleId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // Try multi-line format first
  let startPattern = new RegExp(`\\n\\s*\\{\\s*\\n\\s*id:\\s*'${escapedId}',`, 'm')
  let startMatch = modulesJs.match(startPattern)

  // If not found, try single-line format: { id: 'module-id', label: '...', Icon: ... }
  if (!startMatch) {
    startPattern = new RegExp(`\\{\\s*id:\\s*'${escapedId}'\\s*,`, 'm')
    startMatch = modulesJs.match(startPattern)
  }

  if (!startMatch || startMatch.index == null) {
    throw new Error(`Could not find module: ${moduleId}`)
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
        return {
          start,
          end: index + 1,
          source: modulesJs.slice(start, index + 1),
        }
      }
    }
  }

  throw new Error(`Could not parse module: ${moduleId}`)
}

export function upsertNoteEntry(modulesJs, moduleId, newNoteEntry, notePath) {
  const block = findModuleBlock(modulesJs, moduleId)
  const source = block.source

  if (source.includes(`filename: '${notePath}'`)) {
    throw new Error('A note with this filename already exists')
  }

  const notesPattern = /(notes:\s*\[)([\s\S]*?)(\])/m
  const notesMatch = source.match(notesPattern)
  let updatedSource

  if (notesMatch) {
    // Module already has notes array, append to it
    updatedSource = source.replace(notesPattern, `$1$2      ${newNoteEntry}\n    $3`)
  } else {
    // Module doesn't have notes array, need to add it
    // Check if it's a single-line format: { id: '...', label: '...', Icon: ... }
    const isSingleLine = !source.includes('\n    ')

    if (isSingleLine) {
      // Convert single-line to multi-line and add notes
      const idMatch = source.match(/id:\s*'([^']+)'/)
      const labelMatch = source.match(/label:\s*'([^']+)'/)
      const iconMatch = source.match(/Icon:\s*(\w+)/)

      if (idMatch && labelMatch && iconMatch) {
        updatedSource = `{
    id: '${idMatch[1]}',
    label: '${labelMatch[1]}',
    Icon: ${iconMatch[1]},
    notes: [
      ${newNoteEntry}
    ],
  }`
      } else {
        throw new Error('Could not parse single-line module format')
      }
    } else {
      // Multi-line format, insert notes before tools or at the end
      const toolsIndex = source.indexOf('\n    tools:')
      const notesSource = `\n    notes: [\n      ${newNoteEntry}\n    ],`

      if (toolsIndex !== -1) {
        updatedSource = `${source.slice(0, toolsIndex)}${notesSource}${source.slice(toolsIndex)}`
      } else {
        const closingIndex = source.lastIndexOf('\n  }')
        if (closingIndex !== -1) {
          updatedSource = `${source.slice(0, closingIndex)}${notesSource}${source.slice(closingIndex)}`
        } else {
          // Try to find the closing brace
          const lastBrace = source.lastIndexOf('}')
          updatedSource = `${source.slice(0, lastBrace)}${notesSource}\n  }`
        }
      }
    }
  }

  return `${modulesJs.slice(0, block.start)}${updatedSource}${modulesJs.slice(block.end)}`
}

const NOTE_ENTRY_PATTERN = /\{\s*filename:\s*'([^']+)'\s*,\s*label:\s*'([^']*)'\s*\},?/g

// Splits a loaded note's GitHub path back into the pieces the registry keys
// on. Mirrors the parsing already done in useEditorFiles.js's handleLoadFile
// (src/content/notes/{moduleId}/{subfolder}/{basename}.md) so "was this path
// already registered" can be checked without re-deriving it from the title.
function parseNotePath(path) {
  const parts = path.split('/')
  if (parts.length < 5) return null

  const moduleId = parts[3]
  const subfolder = parts[4]
  const basename = parts[parts.length - 1].replace(/\.md$/, '')

  return { moduleId, subfolder, filename: `${subfolder}/${basename}` }
}

// True if the module already has an entry resolving to this note. Compares on
// the .md-stripped filename because some legacy entries carry a trailing .md
// while notePath (derived via parseNotePath) doesn't — an exact match would
// miss those and re-inserting would duplicate the entry (mirrors the stripped
// comparison findNoteEntry already uses in useEditorModules.js).
function noteIsRegistered(modulesJs, moduleId, notePath) {
  try {
    const block = findModuleBlock(modulesJs, moduleId)
    const target = notePath.replace(/\.md$/, '')
    return [...block.source.matchAll(NOTE_ENTRY_PATTERN)]
      .some(match => match[1].replace(/\.md$/, '') === target)
  } catch {
    return false
  }
}

// Rewrites an existing entry's filename + label in place (same-module
// rename/move). Throws if the old entry can't be found, so callers can fall
// back to inserting a fresh entry instead (registry/disk got out of sync).
function renameNoteEntry(modulesJs, moduleId, oldFilename, newFilename, newLabel) {
  const block = findModuleBlock(modulesJs, moduleId)
  const source = block.source
  let renamed = false

  const updatedSource = source.replace(NOTE_ENTRY_PATTERN, (fullMatch, entryFilename) => {
    if (!renamed && entryFilename === oldFilename) {
      renamed = true
      return `{ filename: '${newFilename}', label: '${newLabel}' },`
    }
    return fullMatch
  })

  if (!renamed) {
    throw new Error(`Could not find note "${oldFilename}" in modules.js`)
  }

  return `${modulesJs.slice(0, block.start)}${updatedSource}${modulesJs.slice(block.end)}`
}

// Drops a single note entry from a module's block (used ahead of inserting
// it into a different module during a cross-subject rename-on-save).
function removeNoteEntry(modulesJs, moduleId, filename) {
  const block = findModuleBlock(modulesJs, moduleId)
  const source = block.source
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

export function useEditorSave({ title, content, selectedPath, showToast, setSaving, setUnsaved, setTitle, setContent, imageQueueRef, imageCountRef, originalPath, setOriginalPath, isOwner, clearDraft }) {
  // Save handler
  const handleSave = async () => {
    if (!title.trim()) {
      showToast('Please enter a title', 'error')
      return
    }

    if (!selectedPath) {
      showToast('Please select a directory', 'error')
      return
    }

    // Captured once up front — this closure's view of originalPath doesn't
    // change even after setOriginalPath() is called later in this same run.
    // isNewNote keys off the parsed identity so it can't disagree with the
    // registry branching below (both treat an unparseable path as "create").
    const original = originalPath ? parseNotePath(originalPath) : null
    const isNewNote = !original

    setSaving(true)

    try {
      const filename = titleToFilename(title)
      if (!filename) {
        throw new Error('Invalid title - could not generate filename')
      }

      const { moduleId, subfolder } = selectedPath
      const newFilename = `${subfolder}/${filename}`
      const isSamePath = original?.moduleId === moduleId && original?.filename === newFilename
      const isCrossModule = original && !isSamePath && original.moduleId !== moduleId

      // A cross-module rename rewrites two module blocks in modules.js, which
      // the admin-github-write Edge Function rejects for anyone but an owner
      // (same rule handleMoveFile in useEditorModules.js already respects).
      if (isCrossModule && !isOwner) {
        throw new Error('Moving a note to a different subject is owner-only')
      }

      // Resolve image queue before committing
      let finalContent = content
      for (const [draftKey, { file, ext }] of Object.entries(imageQueueRef.current)) {
        const imgDir = `public/notes/img/${moduleId}`
        if (imageCountRef.current[moduleId] === undefined) {
          const files = await listDirectory(imgDir)
          imageCountRef.current[moduleId] = files.length
        }
        const newNumber = imageCountRef.current[moduleId] + 1
        imageCountRef.current[moduleId] = newNumber
        const filename = `${newNumber}.${ext}`
        const arrayBuffer = await file.arrayBuffer()
        await uploadImage(`${imgDir}/${filename}`, arrayBuffer)
        finalContent = finalContent.replaceAll(
          `draft://${draftKey}`,
          `/notes/img/${moduleId}/${filename}`
        )
      }
      // clear queue after successful upload
      imageQueueRef.current = {}

      // Commit .md to GitHub — this always lands the edit, even if the
      // registry step below turns out to be a no-op or fails.
      const mdPath = `src/content/notes/${moduleId}/${subfolder}/${filename}.md`
      const commitMessage = original
        ? `docs: update ${filename} in ${moduleId}/${subfolder}`
        : `docs: add ${filename} to ${moduleId}/${subfolder}`

      const commitResult = await commitFile(mdPath, finalContent, commitMessage)

      // Read current modules.js
      let currentModulesJs

      try {
        currentModulesJs = await getFileContent(MODULES_JS_PATH)
      } catch (error) {
        throw new Error(`Could not read modules.js: ${error.message}`)
      }

      if (!currentModulesJs) {
        throw new Error('modules.js file is empty or does not exist')
      }

      const newNoteEntry = `{ filename: '${newFilename}', label: '${filename}.md' },`
      let updatedModulesJs = currentModulesJs
      let modulesCommitModuleId = moduleId
      let modulesCommitMessage = `feat: add ${filename} to ${moduleId} notes`

      if (!original) {
        // Brand-new note.
        updatedModulesJs = upsertNoteEntry(currentModulesJs, moduleId, newNoteEntry, newFilename)
      } else if (isSamePath) {
        // Re-saving the note it was loaded from. The content commit above
        // already carries the edit — only touch the registry if it's
        // somehow not registered there yet (self-heals a desynced note
        // instead of throwing "already exists" on an unchanged path).
        if (noteIsRegistered(currentModulesJs, moduleId, newFilename)) {
          updatedModulesJs = currentModulesJs
        } else {
          updatedModulesJs = upsertNoteEntry(currentModulesJs, moduleId, newNoteEntry, newFilename)
        }
      } else if (!isCrossModule) {
        // Title (and/or subfolder) changed, same subject — rewrite the
        // existing entry in place rather than inserting a duplicate.
        try {
          updatedModulesJs = renameNoteEntry(
            currentModulesJs, moduleId, original.filename, newFilename, `${filename}.md`
          )
          modulesCommitMessage = `feat: rename ${original.filename} to ${newFilename} in ${moduleId}`
        } catch {
          // Old entry wasn't where expected (registry/disk got out of sync)
          // — fall back to inserting fresh rather than hard-failing.
          updatedModulesJs = upsertNoteEntry(currentModulesJs, moduleId, newNoteEntry, newFilename)
        }
      } else {
        // Cross-subject move (owner-only, checked above). Two single-module
        // edits combined into one commit — allowed because owners skip the
        // per-module scoping check server-side.
        let withoutOld = currentModulesJs
        try {
          withoutOld = removeNoteEntry(currentModulesJs, original.moduleId, original.filename)
        } catch {
          // Old entry wasn't where expected — nothing to remove, just insert.
        }
        updatedModulesJs = upsertNoteEntry(withoutOld, moduleId, newNoteEntry, newFilename)
        modulesCommitModuleId = undefined
        modulesCommitMessage = `feat: move ${filename} from ${original.moduleId} to ${moduleId}`
      }

      if (updatedModulesJs !== currentModulesJs) {
        await commitFileWithRetry(
          MODULES_JS_PATH,
          updatedModulesJs,
          modulesCommitMessage,
          modulesCommitModuleId
        )
      }

      // If the note moved (title/subfolder/subject changed), the content is
      // already safe at the new path — remove the stale copy. A failed
      // delete doesn't undo the save; it just leaves a duplicate to clean up.
      if (original && !isSamePath) {
        try {
          await cleanupFile(originalPath, `chore: remove old copy after rename to ${moduleId}/${newFilename}`)
        } catch (deleteError) {
          showToast(
            `Saved, but the old file couldn't be removed (${deleteError.message}) — delete ${originalPath} manually`,
            'error'
          )
          setUnsaved(false)
          setOriginalPath(mdPath)
          return
        }
      }

      // Update image_map with published note's image references
      try {
        // Extract all image paths from the published markdown
        const usedImages = [...finalContent.matchAll(/!\[.*?\]\((\/notes\/img\/.*?)\)/g)]
          .map(m => m[1])   // e.g. ["/notes/img/web/1.png", "/notes/img/web/2.png"]

        // file_path is relative: "web/notes/intro" (no leading slash, no .md extension)
        const relativePath = `${moduleId}/${subfolder}/${filename}`

        // Get the SHA of the file we just committed (returned by commitFile)
        const committedSha = commitResult.content.sha

        await supabase.from('image_map').upsert({
          file_path: relativePath,
          module_id: moduleId,
          images_used: usedImages,
          file_sha: committedSha,
          last_scanned_at: new Date().toISOString(),
        }, { onConflict: 'file_path' })
      } catch (error) {
        // Log but don't fail the save if image_map update fails
        console.error('Failed to update image_map:', error)
      }

      // Clear the autosave draft now that this note is published. A mid-edit
      // rename moves the note to a new identity (see isSamePath above), so the
      // draft it was last autosaved under before the rename may still sit at
      // the old identity — clear both, non-fatal on either.
      await clearDraft?.({ moduleId, subfolder, filename })
      if (original && !isSamePath) {
        await clearDraft?.({
          moduleId: original.moduleId,
          subfolder: original.subfolder,
          filename: original.filename.split('/').pop(),
        })
      }

      showToast('Published! Vercel is deploying...', 'success')
      setUnsaved(false)
      setOriginalPath(mdPath)

      // Only reset to a blank "create new note" state after actually
      // creating one — clearing the editor 2s after every save would wipe
      // an open note out from under someone who just edited it.
      if (isNewNote) {
        setTimeout(() => {
          setTitle('')
          setContent('')
          setOriginalPath(null)
        }, 2000)
      }

    } catch (error) {
      console.error('Save failed:', error)
      showToast(`Save failed: ${error.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  return { handleSave }
}
