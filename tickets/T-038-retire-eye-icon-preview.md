---
id: T-038
title: Retire the eye-icon preview
status: backlog
severity: low
area: admin
epic: E-004
created: 2026-07-22
---

## Summary

Once the editor is WYSIWYG (T-036–T-037), the standalone preview is redundant. Remove the eye-icon
preview button and the `PreviewModal` mount, or repurpose `PreviewModal` as a plain fullscreen
`NoteReader` wrapper. This is the closing move that realises "make the eye icon obsolete".

## Evidence

- `PreviewModal` is mounted in `src/pages/admin/AdminEditor.jsx:650-655` and opened via
  `onPreview` / `setPreviewOpen` (`:700`) plus the `Ctrl/Cmd+Shift+P` shortcut (`:566-569`).
- The preview button lives in `EditorNavbar` (`onPreview` prop, `AdminEditor.jsx:700`).
- After T-035, `PreviewModal` already delegates to `NoteReader`, so retiring it is low-risk.

## Impact

Leaving a preview button after the editor is WYSIWYG is confusing (it shows the same thing the editor
already shows) and keeps dead paths alive.

## Suggested fix

- Remove the preview button from `EditorNavbar` and the `PreviewModal` mount + `previewOpen` state +
  the `Ctrl/Cmd+Shift+P` handler from `AdminEditor.jsx`.
- Either delete `PreviewModal` or keep it as an optional distraction-free fullscreen `NoteReader`
  (owner's call). Keep `NoteReader` regardless — the live page depends on it.

## Acceptance criteria

- [ ] No eye-icon preview button in the editor toolbar.
- [ ] `previewOpen` state and the preview keyboard shortcut are removed.
- [ ] `PreviewModal` is deleted or clearly repurposed; no dead imports remain.
- [ ] `NoteReader` (live page) is unaffected.

## References

- Spec: [docs/specs/notes-wysiwyg-and-reader.md](../docs/specs/notes-wysiwyg-and-reader.md) §6.8
- Depends on: T-036, T-037 (and T-035 for `NoteReader`). Epic: E-004
