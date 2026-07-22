import { useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

const IDLE_MS = 4000
const CEILING_MS = 25000

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
  const idleTimerRef = useRef(null)
  const ceilingTimerRef = useRef(null)
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

  // Ends the ceiling window whenever the dirty flag or the note identity
  // changes (also runs on unmount). Without this, a ceiling timer armed
  // while editing one note can outlive a switch to a different note and
  // later fire a spurious autosave under the new note's key, using whatever
  // is current by then — even if that note was never touched.
  useEffect(() => {
    return () => {
      clearTimeout(ceilingTimerRef.current)
      ceilingTimerRef.current = null
    }
  }, [unsaved, userId, selectedPath?.moduleId, selectedPath?.subfolder])

  useEffect(() => {
    // Only autosave a note that's actually been edited and has a title —
    // an untitled note has no stable key, so it's left out of the safety net.
    if (!unsaved || !userId || !selectedPath || !title.trim()) return

    clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(saveDraft, IDLE_MS)

    if (!ceilingTimerRef.current) {
      ceilingTimerRef.current = setTimeout(() => {
        ceilingTimerRef.current = null
        saveDraft()
      }, CEILING_MS)
    }

    return () => clearTimeout(idleTimerRef.current)
  }, [unsaved, title, content, userId, selectedPath, saveDraft])

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
