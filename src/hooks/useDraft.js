import { useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useDraft({ userId, title, content, selectedPath, setTitle, setContent, setSelectedPath }) {
  const initialized = useRef(false)
  // Id of the active draft row. The `drafts` table is keyed by `id` (multiple
  // drafts per user), so persistence must target a specific row via
  // `onConflict: 'id'` rather than assuming one row per `user_id`. Populated on
  // restore and after the first insert.
  const draftIdRef = useRef(null)

  useEffect(() => {
    if (!userId) return
    if (initialized.current) return

    const restore = async () => {
      try {
        const raw = localStorage.getItem('admin-draft')
        if (raw) {
          try {
            const parsed = JSON.parse(raw)
            if (parsed && typeof parsed === 'object') {
              if (typeof parsed.title === 'string') setTitle(parsed.title)
              if (typeof parsed.content === 'string') setContent(parsed.content)
              if (parsed.selectedPath === null || (parsed.selectedPath && typeof parsed.selectedPath === 'object')) {
                setSelectedPath(parsed.selectedPath)
              }
              console.log('[DRAFT]', 'restored from', 'localStorage')
              return
            }
          } catch {
            localStorage.removeItem('admin-draft')
          }
        }

        // A user may have several drafts; take the most recently updated one.
        // `maybeSingle()` would throw ("multiple rows returned") against the
        // multi-draft schema, so select the latest row explicitly instead.
        const { data } = await supabase
          .from('drafts')
          .select('id, title, content, module_id, subfolder')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(1)

        const row = Array.isArray(data) ? data[0] : data
        if (!row) return
        console.log('[DRAFT]', 'restored from', 'supabase')

        draftIdRef.current = row.id ?? null

        if (typeof row.title === 'string') setTitle(row.title)
        if (typeof row.content === 'string') setContent(row.content)

        if (row.module_id && row.subfolder) {
          setSelectedPath({ moduleId: row.module_id, subfolder: row.subfolder })
        } else {
          setSelectedPath(null)
        }
      } finally {
        initialized.current = true
      }
    }

    restore()
  }, [userId, setTitle, setContent, setSelectedPath])

  useEffect(() => {
    if (!initialized.current) return

    const id = setTimeout(() => {
      localStorage.setItem('admin-draft', JSON.stringify({ title, content, selectedPath }))
      console.log('[DRAFT]', 'saved to localStorage')
    }, 800)

    return () => clearTimeout(id)
  }, [title, content, selectedPath])

  useEffect(() => {
    if (!initialized.current) return
    if (!userId) return

    const id = setTimeout(() => {
      const moduleId = selectedPath?.moduleId ?? null
      const subfolder = selectedPath?.subfolder ?? null

      const row = {
        user_id: userId,
        title,
        content,
        module_id: moduleId,
        subfolder,
        updated_at: new Date().toISOString(),
      }
      // Update the active row by id when known; otherwise insert and capture the
      // generated id so later saves reuse the same row instead of multiplying.
      if (draftIdRef.current) row.id = draftIdRef.current

      supabase
        .from('drafts')
        .upsert(row, { onConflict: 'id' })
        .select('id')
        .single()
        .then(({ data }) => {
          if (data?.id) draftIdRef.current = data.id
        })
    }, 30_000)

    return () => clearTimeout(id)
  }, [userId, title, content, selectedPath])

  const clearDraft = useCallback(async () => {
    localStorage.removeItem('admin-draft')
    if (!userId) return
    await supabase.from('drafts').delete().eq('user_id', userId)
  }, [userId])

  const saveDraftNow = useCallback(async () => {
    localStorage.setItem(
      'admin-draft',
      JSON.stringify({ title, content, selectedPath })
    )
    if (!userId) return
    const row = {
      user_id:    userId,
      title,
      content,
      module_id:  selectedPath?.moduleId ?? null,
      subfolder:  selectedPath?.subfolder ?? null,
      updated_at: new Date().toISOString(),
    }
    if (draftIdRef.current) row.id = draftIdRef.current
    const { data } = await supabase
      .from('drafts')
      .upsert(row, { onConflict: 'id' })
      .select('id')
      .single()
    if (data?.id) draftIdRef.current = data.id
  }, [userId, title, content, selectedPath])

  return { clearDraft, saveDraftNow }
}
