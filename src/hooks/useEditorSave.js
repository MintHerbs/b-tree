import { listDirectory, uploadImage, commitFile, commitFileWithRetry, getFileContent } from '../lib/githubApi'
import { clearAllImageBlobs } from '../lib/draftDB'
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

function upsertNoteEntry(modulesJs, moduleId, newNoteEntry, notePath) {
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

export function useEditorSave({
  userId,
  title,
  content,
  selectedPath,
  selectedCourse,
  showToast,
  setSaving,
  setUnsaved,
  setJustPublished,
  setTitle,
  setContent,
  setSelectedPath,
  imageQueueRef,
  imageCountRef,
  flushSave,
  clearActiveDraft
}) {
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

    setSaving(true)

    try {
      // Flush the active draft to Supabase before publishing so nothing is lost.
      if (typeof flushSave === 'function') await flushSave()

      const filename = titleToFilename(title)
      if (!filename) {
        throw new Error('Invalid title - could not generate filename')
      }

      const { moduleId, subfolder } = selectedPath

      // The note registry lives in the per-course modules.js — the same file the
      // Sidebar, loadCourseModules, and useEditorModules read/write — not the
      // legacy global src/components/layout/Sidebar/modules.js.
      const courseModulesPath = `src/content/notes/${selectedCourse}/modules.js`

      // Resolve image queue before committing
      let finalContent = content
      // Key the counter per course+module — the same module id can exist in
      // different courses, and sharing one counter across them collides.
      const imageCountKey = `${selectedCourse}/${moduleId}`
      for (const [draftKey, { file, ext }] of Object.entries(imageQueueRef.current)) {
        const imgDir = `public/notes/img/${selectedCourse}/${moduleId}`
        if (imageCountRef.current[imageCountKey] === undefined) {
          const files = await listDirectory(imgDir)
          // Seed from the highest existing index, not the file count. After a
          // deletion the count no longer matches the max number, so count+1
          // can reuse a live filename and overwrite a referenced image.
          imageCountRef.current[imageCountKey] = files.reduce((max, f) => {
            const n = parseInt(f.name, 10)
            return Number.isNaN(n) ? max : Math.max(max, n)
          }, 0)
        }
        const newNumber = imageCountRef.current[imageCountKey] + 1
        imageCountRef.current[imageCountKey] = newNumber
        const filename = `${newNumber}.${ext}`
        const arrayBuffer = await file.arrayBuffer()
        await uploadImage(`${imgDir}/${filename}`, arrayBuffer)
        finalContent = finalContent.replaceAll(
          `draft://${draftKey}`,
          `/notes/img/${selectedCourse}/${moduleId}/${filename}`
        )
      }
      // clear queue after successful upload
      imageQueueRef.current = {}

      // Commit .md to GitHub
      const mdPath = `src/content/notes/${selectedCourse}/${moduleId}/${subfolder}/${filename}.md`
      const commitMessage = `docs: add ${filename} to ${moduleId}/${subfolder}`

      const commitResult = await commitFile(mdPath, finalContent, commitMessage)

      // Read current modules.js
      let currentModulesJs

      try {
        currentModulesJs = await getFileContent(courseModulesPath)
      } catch (error) {
        throw new Error(`Could not read modules.js: ${error.message}`)
      }

      if (!currentModulesJs) {
        throw new Error('modules.js file is empty or does not exist')
      }

      // Insert new note entry
      const newNoteEntry = `{ filename: '${subfolder}/${filename}', label: '${filename}.md' },`

      const updatedModulesJs = upsertNoteEntry(
        currentModulesJs,
        moduleId,
        newNoteEntry,
        `${subfolder}/${filename}`
      )

      await commitFileWithRetry(
        courseModulesPath,
        updatedModulesJs,
        `feat: add ${filename} to ${moduleId} notes`
      )

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

      showToast('Published! Vercel is deploying...', 'success')
      if (typeof clearActiveDraft === 'function') await clearActiveDraft()
      await clearAllImageBlobs()
      setUnsaved(false)
      setJustPublished(true)
      setTimeout(() => setJustPublished(false), 3000)

      // Clear form
      setTimeout(() => {
        setTitle('')
        setContent('')
      }, 2000)

    } catch (error) {
      console.error('Save failed:', error)
      showToast(`Save failed: ${error.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  // saveDraftNow (e.g. Cmd+S) now flushes the active draft via useDrafts.
  return { handleSave, saveDraftNow: flushSave }
}
