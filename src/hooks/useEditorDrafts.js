import { useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

// Flat cadence (T-045 phase D) — replaces the earlier idle/ceiling pair.
// Still a recovery draft only (admin_note_drafts), not the publish path;
// `handleSave` is the only thing that makes a note live. saveDraft's own
// lastSavedRef check (below) already no-ops when nothing changed since the
// last autosave, so "only if something new was written" is free.
const AUTOSAVE_INTERVAL_MS = 10000

// Title to filename conversion — kept in sync with useEditorSave.js /
// useEditorModules.js so a draft's key always matches its eventual publish path.
function titleToFilename(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function useEditorDrafts({
  userId, title, content, selectedPath, unsaved,
  showToast, setTitle, setContent, setUnsaved,
}) {
  const intervalRef = useRef(null)
  const lastSavedRef = useRef({ title: null, content: null })
  const latestRef = useRef({})
  latestRef.current = { userId, title, content, selectedPath }

  // Reads the latest state via a ref rather than closing over title/content
  // directly — the ceiling timer is armed once per idle-burst, and must save
  // whatever was last typed by the time it actually fires, not a stale snapshot.
  const saveDraft = useCallback(async () => {
    const { userId, title, content, selectedPath } = latestRef.current
    const filename = title.trim() ? titleToFilename(title) : ''
    if (!userId || !selectedPath || !filename) return
    if (lastSavedRef.current.title === title && lastSavedRef.current.content === content) return

    lastSavedRef.current = { title, content }

    try {
      await supabase.from('admin_note_drafts').upsert({
        user_id: userId,
        module_id: selectedPath.moduleId,
        subfolder: selectedPath.subfolder,
        filename,
        title,
        content,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,module_id,subfolder,filename' })
    } catch (error) {
      console.error('Autosave failed:', error)
    }
  }, [])

  // Flat 10s interval while the note is dirty. Scoped to the note's identity
  // (not just `unsaved`) so switching notes tears down and re-arms the
  // interval under the new key, rather than letting a stale one fire a
  // spurious autosave against whatever note happens to be open when it ticks.
  useEffect(() => {
    if (!unsaved || !userId || !selectedPath || !title.trim()) return

    intervalRef.current = setInterval(saveDraft, AUTOSAVE_INTERVAL_MS)
    return () => {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [unsaved, userId, selectedPath?.moduleId, selectedPath?.subfolder, saveDraft])

  // Any draft row still present at this key is by definition unpublished —
  // clearDraft removes it the moment a publish succeeds, so existence alone
  // (no timestamp comparison) is enough to know it's newer than the last publish.
  const restoreDraftIfExists = useCallback(async ({ moduleId, subfolder, filename }) => {
    if (!userId) return false

    try {
      const { data, error } = await supabase
        .from('admin_note_drafts')
        .select('title, content')
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .eq('subfolder', subfolder)
        .eq('filename', filename)
        .maybeSingle()

      if (error || !data) return false

      setTitle(data.title)
      setContent(data.content)
      setUnsaved(true)
      lastSavedRef.current = { title: data.title, content: data.content }
      showToast('Restored an unsaved draft of this note', 'success')
      return true
    } catch (error) {
      console.error('Draft lookup failed:', error)
      return false
    }
  }, [userId, setTitle, setContent, setUnsaved, showToast])

  const clearDraft = useCallback(async ({ moduleId, subfolder, filename }) => {
    if (!userId) return

    try {
      await supabase
        .from('admin_note_drafts')
        .delete()
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .eq('subfolder', subfolder)
        .eq('filename', filename)
    } catch (error) {
      console.error('Failed to clear draft:', error)
    }
  }, [userId])

  return { restoreDraftIfExists, clearDraft }
}
