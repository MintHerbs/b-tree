import { useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useDraft({ userId, title, content, selectedPath, setTitle, setContent, setSelectedPath }) {
  const initialized = useRef(false)

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

        const { data } = await supabase
          .from('drafts')
          .select('title, content, module_id, subfolder')
          .eq('user_id', userId)
          .maybeSingle()

        if (!data) return
        console.log('[DRAFT]', 'restored from', 'supabase')

        if (typeof data.title === 'string') setTitle(data.title)
        if (typeof data.content === 'string') setContent(data.content)

        if (data.module_id && data.subfolder) {
          setSelectedPath({ moduleId: data.module_id, subfolder: data.subfolder })
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

      supabase.from('drafts').upsert(
        {
          user_id: userId,
          title,
          content,
          module_id: moduleId,
          subfolder,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
    }, 30_000)

    return () => clearTimeout(id)
  }, [userId, title, content, selectedPath])

  const clearDraft = useCallback(async () => {
    localStorage.removeItem('admin-draft')
    if (!userId) return
    await supabase.from('drafts').delete().eq('user_id', userId)
  }, [userId])

  return { clearDraft }
}
