// Subfolders shown for a module are the union of:
//   • folders implied by its notes' path prefixes (e.g. "unit-1/x.md" → "unit-1")
//   • any explicit `subfolders` array — where freshly created, still-empty
//     folders live until they contain a note (handleNewSubfolder writes here).
// Falls back to the conventional notes/tools pair when the module has neither,
// so existing modules render exactly as before.
export function deriveModuleSubfolders(module) {
  const fromNotes = Array.isArray(module?.notes)
    ? module.notes.map(note => {
        const parts = note.filename.split('/')
        return parts.length > 1 ? parts[0] : 'notes'
      })
    : []
  const explicit = Array.isArray(module?.subfolders) ? module.subfolders : []
  const merged = [...fromNotes, ...explicit]
  return merged.length > 0 ? [...new Set(merged)] : ['notes', 'tools']
}
