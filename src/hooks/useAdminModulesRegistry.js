import { useCallback, useEffect, useState } from 'react'
import { MODULES } from '../components/layout/Sidebar/modules'
import { listModuleVisibility, listNotes, listNoteFolders, mergeNotesIntoModules } from '../lib/notesApi'
import { invalidateNotesRegistry } from './useNotesRegistry'

async function fetchAll() {
  const [notes, folders, moduleVisibility] = await Promise.all([
    listNotes(), listNoteFolders(), listModuleVisibility(),
  ])
  return { notes, folders, moduleVisibility }
}

// Shared by AdminBrowser and AdminEditor so both pages see the same
// admin-scoped module/note/folder/visibility state without duplicating the
// fetch — the browser needs it to list Subjects/folders/files (and which are
// hidden), the editor needs it for useEditorSave's reloadModules and
// useEditorModules' create/rename/delete/hide handlers.
export function useAdminModulesRegistry() {
  const [modules, setModules] = useState(MODULES)
  // Raw folder/module-visibility rows, kept alongside the merged `modules`
  // shape (which only carries a per-note `hidden` flag — see notesApi.js) so
  // AdminBrowser can look up a folder's or Subject's own hidden state too.
  const [folders, setFolders] = useState([])
  const [hiddenModuleIds, setHiddenModuleIds] = useState(() => new Set())
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    try {
      const { notes, folders: nextFolders, moduleVisibility } = await fetchAll()
      setModules(prev => mergeNotesIntoModules(prev, notes, nextFolders))
      setFolders(nextFolders)
      setHiddenModuleIds(new Set(moduleVisibility.filter(m => m.hidden).map(m => m.moduleId)))
    } catch (err) {
      console.error('Failed to reload notes registry:', err)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    invalidateNotesRegistry()

    ;(async () => {
      try {
        const { notes, folders: nextFolders, moduleVisibility } = await fetchAll()
        if (cancelled) return
        setModules(mergeNotesIntoModules(MODULES, notes, nextFolders))
        setFolders(nextFolders)
        setHiddenModuleIds(new Set(moduleVisibility.filter(m => m.hidden).map(m => m.moduleId)))
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load notes registry:', err)
        setModules(MODULES)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return { modules, setModules, folders, hiddenModuleIds, loading, reload }
}
