---
id: T-031
title: Unify Files/Edit Files tree modes; add create-file-in-folder; gate delete to owners only
status: done
severity: medium
area: admin
epic: E-003
created: 2026-07-22
---

## Summary

`DirectoryDrawer` runs two disjoint modes toggled by the "Files"/"Edit
Files" tabs: "Files" is a destination-picker for creating a brand-new
note (select a folder, type title+content elsewhere, Save); "Edit Files"
is the only mode that actually lists real files and lets you open one.
There's no way to start a new note from inside the folder you're already
browsing — you have to switch modes and reselect the same folder. Separately,
the per-file Popover (rename/delete) is gated entirely on `isOwner`, so
contributors get no rename or delete affordance on their own notes at all,
even fully inside their own `allowed_directories`.

## Evidence

- `src/components/admin/DirectoryDrawer.jsx:47` — `mode` state
  (`'create' | 'edit'`); `:303-330` — the two mode-toggle buttons in the
  header.
- `DirectoryDrawer.jsx:456-462` — subfolder row `onClick` branches on
  mode: `create` calls `onSelectPath` (destination picker), anything else
  calls `toggleFolder` (browse/expand) — the two behaviors are mutually
  exclusive per click.
- `DirectoryDrawer.jsx:537` — the file list only renders
  `mode === 'edit' && isExpanded`; in `create` mode, files are never shown
  at all, only the subfolder itself is selectable as a save target.
- `DirectoryDrawer.jsx:585-623` — the per-file Popover (`Rename`/`Delete`
  menu items) is wrapped in `isOwner && !isRenamingFile`. A contributor
  viewing a note inside their own allowed directory sees no menu on it.
- `src/hooks/useEditorFiles.js` (`handleLoadFile`) has no role check —
  opening/editing a file already works for any admin today; only the
  rename/delete *menu* is owner-gated, not the open/edit action itself.
- `src/hooks/useEditorModules.js:810-844` (`handleDeleteFile`) and
  `:846-911` (`handleRenameFile`) are both fully implemented today (not
  stubs) — this is a UI-gating change, not a missing backend primitive.
- `supabase/functions/admin-github-write/index.ts` — the `deleteFile` op
  has no owner check of its own; it only runs `isPathAllowed(path, role,
  allowed_directories)`, the same check every other op uses. A
  contributor's client today has no delete button, but nothing server-side
  currently stops a contributor from deleting a file inside their own
  allowed directory if they called the function directly.

## Impact

Adding a note and editing one are two uncoordinated flows requiring a mode
switch mid-task, which is confusing given both operate on the same tree.
Contributors can't fix a typo in their own note's filename or remove a
note they own without asking an owner or going into GitHub directly.

## Suggested fix

- Remove the mode toggle. Always render the real, `listDirectory`-backed
  tree (what "Edit Files" does today) for every subject/folder. Clicking a
  file always opens it via `onLoadFile`.
- Add a "+" icon to each **folder** row (subfolders), alongside the
  existing per-**subject** "+ New subfolder" button. Clicking it clears
  the editor and sets `selectedPath` to that folder — the existing
  title+content+Save flow already creates a new note wherever
  `selectedPath` points and `originalPath` is null, so this needs no new
  save-path logic, just a way to enter that state from inside the folder
  you're looking at instead of a separate mode.
- Split the file-row Popover's gate: any admin (whose `allowedDirectories`
  already include the module, enforced by the existing `visibleModules`
  filter) sees "Rename"; only `isOwner` sees "Delete".
- Decide and implement the server-side counterpart: today
  `admin-github-write`'s `deleteFile` op enforces directory scope but not
  role, so hiding the button client-side for non-owners is UI-only, not a
  real boundary (the same shape of gap [T-001](T-001-github-token-exposed-no-server-directory-enforcement.md)
  was filed for, at smaller scope). If "owner-only delete" is meant to be
  a real guarantee, add a role check to the `deleteFile` case in
  `admin-github-write/index.ts` — see Open question below.

## Acceptance criteria

- [x] The Files/Edit Files mode toggle is gone; there is one tree that
      always shows real folders/files.
- [x] A new file can be created by clicking "+" on a folder in the tree,
      without switching modes or losing the current selection.
- [x] Any admin (owner or contributor, within their allowed directories)
      can rename a file through the UI.
- [x] Only an owner sees/can trigger delete on a file through the UI.
- [x] `admin-github-write`'s `deleteFile` op rejects a non-owner caller
      server-side (pending the open question below being resolved as
      "yes, enforce it").

**Resolved 2026-07-22:** `DirectoryDrawer.jsx` now renders a single
`listDirectory`-backed tree unconditionally; a "+" button on each
subfolder row calls `onClearEditor()` + `onSelectPath(...)` to start a
new note in place. The file-row Popover always shows "Rename" and gates
"Delete" on `isOwner`. `admin-github-write/index.ts`'s `deleteFile` case
now rejects non-owner callers with a 403 before touching GitHub.

## Open questions

Should "owner-only delete" be enforced server-side in
`admin-github-write`, or is hiding the button client-side acceptable
here? Recommendation: enforce it server-side — contributors are trusted
admins scoped to a directory, but this repo's own audit history
(E-001/T-001) is specifically about not trusting client-side gating for
anything security-relevant, and delete is the one irreversible action in
this ticket.

## References

- [T-027](T-027-new-subfolder-invisible-dead-end.md) / [T-029](T-029-no-delete-or-rename-single-file.md) — prior work on this
  same file; both appear already implemented in the current `DirectoryDrawer.jsx`/`useEditorModules.js` despite still showing `status: backlog` — worth
  reconciling those tickets' status separately from this one.
- [T-001](T-001-github-token-exposed-no-server-directory-enforcement.md) — established the "client-side gating alone isn't a security
  boundary" pattern this ticket's open question is about.
