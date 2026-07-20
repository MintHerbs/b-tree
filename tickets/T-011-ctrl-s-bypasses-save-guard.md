---
id: T-011
title: Ctrl+S bypasses the in-flight save guard the Save button enforces
status: done
severity: low
area: admin
epic: E-001
created: 2026-07-19
---

## Summary

The Save button is disabled while a save is in progress, but the Ctrl/Cmd+S
keyboard shortcut calls `handleSave()` unconditionally, allowing
overlapping saves that can fail inconsistently.

## Evidence

- `src/components/admin/EditorNavbar.jsx:150-151` — Save button has `disabled={saving}`.
- `src/pages/admin/AdminEditor.jsx:543-545` — the keydown handler for Ctrl/Cmd+S calls `handleSave()` with no check against the same `saving` flag.
- `commitFileWithRetry` handles 409 conflicts for the `.md` file commit itself, but the follow-up `modules.js` note-registry update (`useEditorSave.js:180-188`, `upsertNoteEntry`) throws `"A note with this filename already exists"` and isn't similarly guarded against a second overlapping call.

## Impact

Rapidly pressing Ctrl+S (easy to do reflexively while editing) can start
a second save before the first finishes. The file commit may succeed
twice, but the second call's `modules.js` update can fail with a
misleading "already exists" error even though the content did save —
leaving the admin unsure whether their edit actually went through.

## Suggested fix

Guard the keydown handler with the same `saving` check the button uses,
so a second Ctrl+S while a save is in flight is a no-op (or queues,
rather than firing a second overlapping save).

## Acceptance criteria

- [x] Rapidly pressing Ctrl+S while a save is in progress triggers only one save.
- [x] No spurious "already exists" error appears from a legitimate single edit.

## References

- `src/hooks/useEditorSave.js` — `upsertNoteEntry`, `commitFileWithRetry`
