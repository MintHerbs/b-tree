import { listDirectory, uploadImage, commitFileWithRetry } from '../lib/githubApi'
import { upsertNote, moveNote, baseName } from '../lib/notesApi'
import { revokeDraftPreview } from '../lib/draftImagePreviews'
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

// Resolves the `draft://` image queue: uploads each queued image to GitHub
// (images deliberately stay in the repo, served as static assets — E-005
// non-goal) and rewrites its draft URL to the committed path. Returns the
// rewritten content and how many NEW images were uploaded (drives the
// deploy-lag-honest toast, since a new image only goes live after Vercel
// redeploys, while the note text is live from Supabase immediately).
async function resolveImageQueue(content, moduleId, imageQueueRef, imageCountRef) {
  let finalContent = content
  let uploaded = 0
  for (const [draftKey, { file, ext }] of Object.entries(imageQueueRef.current)) {
    const imgDir = `public/notes/img/${moduleId}`
    if (imageCountRef.current[moduleId] === undefined) {
      const files = await listDirectory(imgDir)
      imageCountRef.current[moduleId] = files.length
    }
    const newNumber = imageCountRef.current[moduleId] + 1
    imageCountRef.current[moduleId] = newNumber
    const imgName = `${newNumber}.${ext}`
    const arrayBuffer = await file.arrayBuffer()
    await uploadImage(`${imgDir}/${imgName}`, arrayBuffer)
    finalContent = finalContent.replaceAll(`draft://${draftKey}`, `/notes/img/${moduleId}/${imgName}`)
    revokeDraftPreview(draftKey)
    uploaded += 1
  }
  imageQueueRef.current = {}
  return { finalContent, uploaded }
}

export function useEditorSave({
  title, content, selectedPath, showToast, setSaving, setUnsaved, setTitle, setContent,
  imageQueueRef, imageCountRef, originalPath, setOriginalPath, isOwner, clearDraft, reloadModules,
}) {
  // Primary save: note CONTENT goes to Supabase (source of truth), so the note
  // is live on the reader's next load with no rebuild. Images still upload to
  // GitHub. `modules.js` is never touched — the sidebar is a DB query now.
  const handleSave = async () => {
    if (!title.trim()) {
      showToast('Please enter a title', 'error')
      return
    }
    if (!selectedPath) {
      showToast('Please select a directory', 'error')
      return
    }

    const filename = titleToFilename(title)
    if (!filename) {
      showToast('Invalid title - could not generate filename', 'error')
      return
    }

    const { moduleId, subfolder } = selectedPath
    const newPath = `${subfolder}/${filename}`
    const label = `${filename}.md`

    // originalPath is the identity the note was loaded from: { moduleId, path,
    // subfolder } — or null for a brand-new note.
    const original = originalPath
    const isNewNote = !original
    const isSamePath = original && original.moduleId === moduleId && original.path === newPath
    const isCrossModule = original && !isSamePath && original.moduleId !== moduleId

    // Cross-subject move changes module_id, which the DB trigger allows only for
    // owners (mirrors the previous owner-only rule). Say so plainly.
    if (isCrossModule && !isOwner) {
      showToast('Moving a note to a different subject is owner-only', 'error')
      return
    }

    setSaving(true)

    try {
      const { finalContent, uploaded } = await resolveImageQueue(
        content, moduleId, imageQueueRef, imageCountRef
      )

      if (original && !isSamePath) {
        // Rename and/or move: a single UPDATE that rewrites identity + label +
        // content in place. No owner-only DELETE needed (that would block a
        // contributor renaming their own note); the row keeps its history.
        await moveNote({
          fromModuleId: original.moduleId,
          fromPath: original.path,
          toModuleId: moduleId,
          toPath: newPath,
          title: label,
          contentMd: finalContent,
        })
      } else {
        // New note, or re-saving the same note: upsert content in place.
        await upsertNote({ moduleId, path: newPath, title: label, contentMd: finalContent })
      }

      // Refresh the registry so the sidebar/file tree reflect the change.
      invalidateNotesRegistry()
      await reloadModules?.()

      // Clear the autosave draft(s). A rename moves the note to a new identity,
      // so also clear the draft under the old identity.
      await clearDraft?.({ moduleId, subfolder, filename })
      if (original && !isSamePath) {
        await clearDraft?.({
          moduleId: original.moduleId,
          subfolder: original.subfolder ?? 'notes',
          filename: baseName(original.path),
        })
      }

      showToast(
        uploaded > 0 ? 'Saved. New images go live after deploy (~1 min).' : 'Saved.',
        'success'
      )
      setUnsaved(false)
      setOriginalPath({ moduleId, path: newPath, subfolder })

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

  // Optional, off-critical-path backup: write the note's current content to
  // GitHub as a plain .md (no modules.js edit). Supabase stays the source of
  // truth; a failure here never unpublishes the note.
  const handleBackupToGithub = async () => {
    if (!selectedPath || !title.trim()) {
      showToast('Nothing to back up yet', 'error')
      return
    }
    const filename = titleToFilename(title)
    const { moduleId, subfolder } = selectedPath
    const mdPath = `src/content/notes/${moduleId}/${subfolder}/${filename}.md`
    try {
      showToast('Backing up to GitHub…', 'success')
      await commitFileWithRetry(mdPath, content, `backup: ${moduleId}/${subfolder}/${filename}.md`)
      showToast('Backed up to GitHub', 'success')
    } catch (error) {
      showToast(`Backup failed (note is still saved): ${error.message}`, 'error')
    }
  }

  return { handleSave, handleBackupToGithub }
}
