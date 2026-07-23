// src/hooks/useNotesRegistry.js
//
// Loads the note registry (content identities + explicit folders) from Supabase
// and merges it into the structural MODULES array, producing the same
// `module.notes = [{ filename, label }]` / `module.subfolders` shape the
// sidebar and admin file tree already consume (E-005/T-043).
//
// Stale-while-revalidate: the last successful result is cached at module scope
// and used to paint instantly on mount, but EVERY mount also refetches in the
// background and updates. So navigating to a page (or expanding the sidebar)
// after a save reflects the change without a hard reload.

import { useCallback, useEffect, useState } from 'react'
import { MODULES } from '../components/layout/Sidebar/modules'
import { listNotes, listNoteFolders, mergeNotesIntoModules } from '../lib/notesApi'

let lastModules = null

async function fetchRegistry() {
  const [notes, folders] = await Promise.all([listNotes(), listNoteFolders()])
  return mergeNotesIntoModules(MODULES, notes, folders)
}

export function useNotesRegistry() {
  const [modules, setModules] = useState(lastModules ?? MODULES)
  const [loading, setLoading] = useState(!lastModules)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const merged = await fetchRegistry()
      lastModules = merged
      setModules(merged)
    } catch (e) {
      // On failure keep the last good data (or bare structural modules) so the
      // sidebar still renders rather than blanking out.
      setError(e)
      if (!lastModules) setModules(MODULES)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { modules, loading, error, reload: load }
}

/** Drop the cached registry so the next mount repaints from a fresh fetch. */
export function invalidateNotesRegistry() {
  lastModules = null
}
