import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { clearDraftBlobs, restoreDraftBlobs } from '../lib/draftDB'

const MAX_DRAFTS = 5
const LOCALSTORAGE_PREFIX = 'admin-draft-'

function localStorageKey(draftId) {
  return `${LOCALSTORAGE_PREFIX}${draftId}`
}

function pathFromRow(row) {
  return row?.module_id && row?.subfolder
    ? { moduleId: row.module_id, subfolder: row.subfolder }
    : null
}

// Reconstruct draft rows from localStorage when Supabase is unavailable.
// Each per-draft entry is stored as { draftId, title, content, selectedPath }.
// Counter entries (admin-draft-img-counter-*) parse to numbers, not objects,
// so they are naturally skipped.
function readDraftsFromLocalStorage() {
  const rows = []
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith(LOCALSTORAGE_PREFIX)) continue
    try {
      const parsed = JSON.parse(localStorage.getItem(key))
      if (parsed && typeof parsed === 'object' && parsed.draftId) {
        rows.push({
          id: parsed.draftId,
          draft_name: parsed.draftName ?? 'Untitled',
          title: parsed.title ?? '',
          content: parsed.content ?? '',
          module_id: parsed.selectedPath?.moduleId ?? null,
          subfolder: parsed.selectedPath?.subfolder ?? null,
        })
      }
    } catch {
      /* ignore malformed entries */
    }
  }
  return rows
}

export function useDrafts({
  userId,
  selectedCourse,
  title,
  setTitle,
  content,
  setContent,
  selectedPath,
  setSelectedPath,
  // eslint-disable-next-line no-unused-vars -- accepted for API parity; image
  // restore is delegated to draftDB.restoreDraftBlobs.
  editorRef,
}) {
  const [drafts, setDrafts] = useState([]) // all user's drafts
  const [activeDraftId, setActiveDraftId] = useState(null)
  const [saveStatus, setSaveStatus] = useState('saved') // 'unsaved' | 'saving' | 'saved' | 'failed'
  const [loadingDrafts, setLoadingDrafts] = useState(true)
  const initialized = useRef(false)
  const activeIdRef = useRef(null) // sync ref for timers

  // Set when the editor content is changed programmatically (load / switch /
  // create) so the dirty-tracking effect doesn't mark those as 'unsaved'.
  const skipDirtyRef = useRef(false)

  // Keep ref in sync with state
  useEffect(() => {
    activeIdRef.current = activeDraftId
  }, [activeDraftId])

  // Apply a draft row into the editor without tripping the dirty tracker.
  function loadRowIntoEditor(row) {
    skipDirtyRef.current = true
    setTitle(row?.title ?? '')
    setContent(row?.content ?? '')
    setSelectedPath(pathFromRow(row))
    setSaveStatus('saved')
  }

  // ── LOAD ALL DRAFTS ON MOUNT ────────────────────────────────────────
  // Fetch all drafts for this user from Supabase, ordered most-recent first,
  // and restore the most recently edited draft into the editor.
  // Falls back to localStorage if Supabase is unavailable.
  useEffect(() => {
    if (!userId) return
    if (initialized.current) return

    let cancelled = false

    const load = async () => {
      try {
        let rows = []
        try {
          const { data, error } = await supabase
            .from('drafts')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
          if (error) throw new Error(error.message)
          if (Array.isArray(data)) rows = data
        } catch {
          rows = readDraftsFromLocalStorage()
        }

        if (cancelled) return

        setDrafts(rows)
        if (rows.length > 0) {
          const mostRecent = rows[0]
          setActiveDraftId(mostRecent.id)
          loadRowIntoEditor(mostRecent)
          await restoreDraftBlobs(mostRecent.id)
        }
      } finally {
        if (!cancelled) {
          initialized.current = true
          setLoadingDrafts(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [userId, setTitle, setContent, setSelectedPath])

  // ── MARK UNSAVED ON CONTENT CHANGE ──────────────────────────────────
  // Any user edit flips status to 'unsaved'. Programmatic loads set
  // skipDirtyRef so they don't count as edits.
  useEffect(() => {
    if (!initialized.current) return
    if (skipDirtyRef.current) {
      skipDirtyRef.current = false
      return
    }
    setSaveStatus('unsaved')
  }, [title, content, selectedPath])

  // ── AUTO-SAVE TO LOCALSTORAGE (800ms debounce) ──────────────────────
  // Saves { draftId, title, content, selectedPath } under
  // `admin-draft-${activeDraftId}`. Not reflected in saveStatus (too noisy).
  useEffect(() => {
    if (!initialized.current) return
    if (!activeDraftId) return

    const id = setTimeout(() => {
      localStorage.setItem(
        localStorageKey(activeDraftId),
        JSON.stringify({ draftId: activeDraftId, title, content, selectedPath })
      )
    }, 800)

    return () => clearTimeout(id)
  }, [activeDraftId, title, content, selectedPath])

  // ── AUTO-SAVE TO SUPABASE (30s debounce) ────────────────────────────
  // Upserts the active draft. Drives saveStatus: 'saving' → 'saved' | 'failed'.
  useEffect(() => {
    if (!initialized.current) return
    if (!activeDraftId || !userId) return

    const id = setTimeout(() => {
      flushSave()
    }, 30_000)

    return () => clearTimeout(id)
    // flushSave reads the latest props/refs via closure each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDraftId, userId, title, content, selectedPath])

  // ── CREATE DRAFT ─────────────────────────────────────────────────────
  // Enforces the 5-draft limit, saves the current draft, then inserts a new
  // empty draft in Supabase and switches the editor to it.
  async function createDraft(draftName) {
    if (drafts.length >= MAX_DRAFTS) {
      throw new Error('Maximum 5 drafts reached. Publish or delete one first.')
    }
    await flushSave()
    const { data, error } = await supabase
      .from('drafts')
      .insert({
        user_id: userId,
        draft_name: draftName,
        title: '',
        content: '',
        selected_course: selectedCourse,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    setDrafts((prev) => [...prev, data])
    setActiveDraftId(data.id)
    skipDirtyRef.current = true
    setTitle('')
    setContent('')
    setSelectedPath(null)
    setSaveStatus('saved')
    return data
  }

  // ── SWITCH DRAFT ─────────────────────────────────────────────────────
  // Saves the current draft, loads the selected one, restores its blobs.
  async function switchDraft(draftId) {
    if (draftId === activeDraftId) return
    await flushSave()
    // Keep the local `drafts` cache in sync with the live editor before leaving
    // the current draft. The cached rows are only ever set at mount, so without
    // this the row for the draft we're switching away from still holds its
    // mount-time content; switching back would reload that stale content and the
    // next flush would persist it over the real edits. A functional update is
    // used so a concurrent removal (delete/clear → switch) is not undone, and
    // only the current row is touched (the target is never the active draft).
    const currentId = activeIdRef.current
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === currentId
          ? {
              ...d,
              title,
              content,
              module_id: selectedPath?.moduleId ?? null,
              subfolder: selectedPath?.subfolder ?? null,
            }
          : d
      )
    )
    const draft = drafts.find((d) => d.id === draftId)
    if (!draft) return
    setActiveDraftId(draftId)
    loadRowIntoEditor(draft)
    // Restore IndexedDB blobs for this draft (keyed `${draftId}:img-X.ext`).
    await restoreDraftBlobs(draftId)
  }

  // ── DELETE DRAFT ──────────────────────────────────────────────────────
  // Deletes from Supabase + localStorage, clears its blobs, and switches to
  // the next available draft if the deleted one was active.
  async function deleteDraft(draftId) {
    await supabase.from('drafts').delete().eq('id', draftId)
    localStorage.removeItem(localStorageKey(draftId))
    await clearDraftBlobs(draftId)
    const remaining = drafts.filter((d) => d.id !== draftId)
    setDrafts(remaining)
    if (draftId === activeDraftId) {
      // Drop the active pointer BEFORE switching. switchDraft → flushSave would
      // otherwise upsert activeIdRef.current — which still holds the just-deleted
      // id — with the not-yet-cleared editor content, resurrecting the row we
      // just removed. Clearing the ref makes flushSave a no-op for it.
      activeIdRef.current = null
      setActiveDraftId(null)
      if (remaining.length > 0) {
        await switchDraft(remaining[0].id)
      } else {
        skipDirtyRef.current = true
        setTitle('')
        setContent('')
        setSelectedPath(null)
      }
    }
  }

  // ── RENAME DRAFT ─────────────────────────────────────────────────────
  async function renameDraft(draftId, newName) {
    await supabase.from('drafts').update({ draft_name: newName }).eq('id', draftId)
    setDrafts((prev) =>
      prev.map((d) => (d.id === draftId ? { ...d, draft_name: newName } : d))
    )
  }

  // ── FLUSH SAVE (immediate, no debounce) ──────────────────────────────
  // Upserts the active draft right away. Used by the 30s timer and before
  // switching/deleting drafts so nothing is lost.
  async function flushSave() {
    if (!activeIdRef.current || !userId) return
    setSaveStatus('saving')
    try {
      const { error } = await supabase.from('drafts').upsert(
        {
          id: activeIdRef.current,
          user_id: userId,
          title,
          content,
          module_id: selectedPath?.moduleId ?? null,
          subfolder: selectedPath?.subfolder ?? null,
          selected_course: selectedCourse,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      if (error) throw new Error(error.message)
      setSaveStatus('saved')
    } catch {
      setSaveStatus('failed')
    }
  }

  // ── CLEAR ACTIVE DRAFT (after GitHub publish) ────────────────────────
  // Removes the active draft from Supabase + localStorage, then switches to
  // the next remaining draft (or clears the editor if none remain).
  async function clearActiveDraft() {
    if (!activeDraftId) return
    localStorage.removeItem(localStorageKey(activeDraftId))
    await supabase.from('drafts').delete().eq('id', activeDraftId)
    const remaining = drafts.filter((d) => d.id !== activeDraftId)
    setDrafts(remaining)
    // Drop the active pointer BEFORE switching so the switchDraft → flushSave
    // path can't re-upsert (resurrect) the draft we just deleted/published.
    activeIdRef.current = null
    setActiveDraftId(null)
    if (remaining.length > 0) {
      await switchDraft(remaining[0].id)
    } else {
      skipDirtyRef.current = true
      setTitle('')
      setContent('')
      setSelectedPath(null)
    }
  }

  return {
    drafts,
    activeDraftId,
    saveStatus,
    loadingDrafts,
    createDraft,
    switchDraft,
    deleteDraft,
    renameDraft,
    flushSave,
    clearActiveDraft,
  }
}
