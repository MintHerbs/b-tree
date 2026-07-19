---
id: T-005
title: Move file duplicates content instead of moving it, and never updates the module registry
status: done
severity: high
area: admin
epic: E-001
created: 2026-07-19
---

## Summary

"Move file" copies a note to its new location but never deletes the
original or updates `modules.js`'s note entry — despite reporting "File
moved successfully."

## Evidence

`src/hooks/useEditorModules.js:255-274` — `handleMoveFile` reads the
source file (`getFileContent(oldPath)`), commits it to the new path
(`commitFile(newPath, ...)`), then:

```js
// Delete from old location (would need delete API)
// Update modules.js
showToast(`File moved successfully`, 'success')
```

Both comments are stale — the codebase already has a working `deleteFile`
used elsewhere in the same hook file, so this isn't blocked on a missing
capability.

## Impact

Moving a note from one subfolder to another creates a duplicate at the
new path while leaving the original live and still referenced by
`modules.js` — the new copy is unreachable via navigation (nothing points
to it), and the site now serves two versions of the same content from one
action that claimed to be a simple move.

## Suggested fix

Call the existing `deleteFile` on `oldPath` after the new commit succeeds,
and update the corresponding note entry in `modules.js` to point at the
new path — both already-available building blocks, per the comments in
the code itself.

## Acceptance criteria

- [ ] After a move, the file exists only at the new path (old path returns 404 from GitHub).
- [ ] `modules.js`'s note entry reflects the new path so navigation resolves correctly.
- [ ] If the delete step fails after the new commit succeeds, the user is told the move is incomplete (not "successfully" moved) and the app doesn't leave duplicate content silently.

## References

- `src/lib/githubApi.js` — existing `deleteFile` implementation to reuse
