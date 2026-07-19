---
id: T-004
title: Rename/Delete subfolder are no-op stubs that report false success
status: done
severity: high
area: admin
epic: E-001
created: 2026-07-19
---

## Summary

The "rename subfolder" and "delete subfolder" actions show a real
confirmation dialog and a "success" toast, but neither actually changes
anything — they're unfinished stub implementations.

## Evidence

`src/hooks/useEditorModules.js:243-253`:

```js
const handleRenameSubfolder = async (moduleId, oldName, newName) => {
  showToast(`Renaming ${oldName} to ${newName}...`, 'success')
  // Implementation would update modules.js references
  showToast(`Subfolder renamed`, 'success')
}
const handleDeleteSubfolder = async (moduleId, subfolderName) => {
  showToast(`Deleting subfolder ${subfolderName}...`, 'success')
  // Implementation would update modules.js
  showToast(`Subfolder deleted`, 'success')
}
```

`src/components/admin/DirectoryDrawer.jsx` renders a real confirmation
popover ("Delete this folder? Notes inside will be orphaned.") before
calling `handleDeleteSubfolder` — the UI fully commits to the action being
real.

## Impact

An owner renames or deletes a subfolder, sees "Subfolder renamed" /
"Subfolder deleted," and reasonably assumes it happened. Nothing was
written to GitHub and `modules.js` is untouched — the change silently did
not take effect, and there's no UI signal that it's a no-op.

## Suggested fix

Either implement the actual GitHub commit + `modules.js` update these
functions are stubbed for, or — if not ready to ship — disable/hide the
UI entry points until the implementation lands, so the app never reports
success for something that didn't happen.

## Acceptance criteria

- [x] Renaming a subfolder actually updates `modules.js` and the underlying content path (or the UI action is removed/disabled until it does).
- [x] Deleting a subfolder actually removes it (or the UI action is removed/disabled until it does).
- [x] No toast claims success for an action that didn't run.

## References

- `src/components/admin/DirectoryDrawer.jsx` — confirmation UI for delete
