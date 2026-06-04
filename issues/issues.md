# Admin Panel Audit — Bugs & Broken Functionality

Scope: `src/pages/admin/`, `src/components/admin/`, editor/draft hooks in `src/hooks/`,
`src/lib/githubApi.js`, `src/lib/draftDB.js`, `src/lib/chemUtils.js`,
`src/components/markdown/MarkdownRenderer.jsx`, `src/components/layout/Sidebar/Sidebar.jsx`.

---

## Issue #1 — Publishing a note writes to the wrong modules.js registry
**File:** src/hooks/useEditorSave.js line 16 (and lines 192, 204, 211)
**Severity:** Critical
**Current behaviour:** On publish, the note `.md` is committed correctly to
`src/content/notes/{course}/{module}/{subfolder}/{file}.md`, but the note registry entry is
upserted into `src/components/layout/Sidebar/modules.js` (`MODULES_JS_PATH`). The Sidebar
(`Sidebar.jsx` line 56) and the editor (`loadCourseModules.js` line 13 / `useEditorModules.js`
line 293) both read the *per-course* file `src/content/notes/{course}/modules.js`. Published notes
therefore never appear in the sidebar, and publishing into a module that was created through the
admin (which only exists in the course file) throws "Could not find module" from `findModuleBlock`.
**Expected behaviour:** The note entry should be written to `src/content/notes/{selectedCourse}/modules.js`,
the same file every other part of the app reads.
**Root cause:** `useEditorSave` still targets the legacy global `Sidebar/modules.js` constant while the rest of the codebase migrated to per-course `content/notes/{course}/modules.js` registries.

---

## Issue #2 — Image cleanup scans course-less paths and never matches real images
**File:** src/hooks/useImageCleanup.js line 42, lines 95, 122 & 128
**Severity:** High
**Current behaviour:** `runScan` lists `.md` files at `src/content/notes/{module}/{subfolder}`
and lists images at `public/notes/img/{module}` — both omit the `{course}` segment. Published
notes live under `src/content/notes/{course}/{module}/...` and published images under
`public/notes/img/{course}/{module}/...` (see `useEditorSave.js` lines 165 & 183). The directory
listings come back empty, so no `.md` files are scanned and no stored images are found; the
orphan set is always empty (or, where it does list, the referenced paths
`/notes/img/{course}/{module}/x.png` never equal stored paths `/notes/img/{module}/x.png`).
**Expected behaviour:** Scan and image-listing paths must include the course segment so the
referenced-vs-stored image comparison is accurate.
**Root cause:** The cleanup hook was not updated for the course-scoped path scheme used by the save pipeline; the `{course}` directory level is missing from every path it builds.

---

## Issue #3 — Switching drafts reloads stale content and can overwrite newer edits
**File:** src/hooks/useDrafts.js lines 210-219 (switchDraft → loadRowIntoEditor)
**Severity:** High
**Current behaviour:** Edits update only `title`/`content`/`selectedPath` state; the cached
`drafts` array rows are never updated. `switchDraft` loads the target draft from that stale
`drafts` array via `loadRowIntoEditor(draft)`. Switching away from a draft and back reloads the
content as it was at initial mount, discarding edits made since. Worse, the next autosave/flush
then persists that stale content to Supabase, destroying the real edits in the database.
**Expected behaviour:** Switching should load the latest content (refetched, or kept in sync in the
local `drafts` array) so no edits are lost.
**Root cause:** `drafts` state is never kept in sync with live editor edits, yet `switchDraft` treats it as the source of truth when restoring a draft.

---

## Issue #4 — Deleting or publishing the active draft resurrects it
**File:** src/hooks/useDrafts.js lines 224-241 (deleteDraft) and 281-296 (clearActiveDraft)
**Severity:** High
**Current behaviour:** Both paths delete the active draft from Supabase, then call
`switchDraft(remaining[0].id)`. `switchDraft` runs `await flushSave()` first, and `flushSave`
upserts `activeIdRef.current` — which still holds the just-deleted draft's id — using the editor
content that has not yet been cleared. This re-inserts the row that was just deleted. Deleting the
active draft appears to fail, and publishing leaves the published note lingering as a draft.
**Expected behaviour:** Deleting/clearing the active draft should remove it permanently; flushing
should not re-create a row that was just deleted.
**Root cause:** `flushSave` uses `activeIdRef.current` (still pointing at the deleted draft) and is invoked by `switchDraft` before `activeDraftId` is updated, so an upsert recreates the deleted row.

---

## Issue #5 — "Move file" only copies the file; source and registry are left untouched
**File:** src/hooks/useEditorModules.js lines 545-564 (handleMoveFile)
**Severity:** High
**Current behaviour:** `handleMoveFile` reads the source `.md` and commits a copy to the new
location, then shows "File moved successfully". It never deletes the original file (the "would need
delete API" comment) and never updates `modules.js`. The result is a duplicated file with a stale
registry entry pointing at the old path.
**Expected behaviour:** A move should delete the source file (the `deleteFile` API is already
imported) and update the note's `filename` entry in the course registry, then report success only
if all steps succeed.
**Root cause:** The delete-source and registry-update steps were never implemented; only the copy step exists, yet the function reports success unconditionally.

---

## Issue #6 — Subfolder rename is a no-op that falsely reports success
**File:** src/hooks/useEditorModules.js lines 490-494 (handleRenameSubfolder)
**Severity:** Medium
**Current behaviour:** `handleRenameSubfolder` shows "Renaming…" then immediately shows
"Subfolder renamed", but performs no GitHub/registry/state change. The Rename action in the
directory drawer does nothing while telling the user it worked.
**Expected behaviour:** It should rename the folder's files, update `modules.js` note path
prefixes, and update local state — or be disabled until implemented.
**Root cause:** The handler body is an unimplemented stub ("Implementation would update modules.js references") that still emits a success toast.

---

## Issue #7 — FormulaModal calls setState during render
**File:** src/components/admin/FormulaModal.jsx lines 20-35 (renderPreview), invoked at line 105
**Severity:** Medium
**Current behaviour:** `renderPreview()` is called inline during JSX render and calls
`setError(...)`/`setError('')` as a side effect of rendering. Setting state during render triggers
React's "Cannot update during render" warning and forces an extra render pass each keystroke.
**Expected behaviour:** Validation/error state should be derived in an effect or `useMemo`, not set
as a side effect inside a function invoked during render.
**Root cause:** Error state is mutated synchronously inside a render-time function rather than computed in `useMemo`/`useEffect`.

---

## Issue #8 — User "Allowed Directories" list is hardcoded to the legacy global modules
**File:** src/components/admin/UsersDrawer.jsx line 5 (import) and line 390
**Severity:** Medium
**Current behaviour:** The contributor directory checkboxes map over `MODULES` statically imported
from `../layout/Sidebar/modules` (the legacy global registry), not the modules of the course the
user is being assigned to. Contributors get permission options for the wrong/legacy module set.
**Expected behaviour:** The directory list should reflect the selected course's modules.
**Root cause:** A static import of the legacy single-course `Sidebar/modules.js` is used instead of loading the selected course's module registry.

---

## Issue #9 — Course "Manage" button is a stub; rename forces a full page reload
**File:** src/components/admin/CourseManagementDrawer.jsx lines 153-156 and line 145
**Severity:** Medium
**Current behaviour:** Clicking "Manage" on a course only runs `console.log('Manage course:', …)`
— nothing opens. After a successful course rename, `window.location.reload()` is called, blowing
away any unsaved editor/draft state in the page just to refresh the course list.
**Expected behaviour:** "Manage" should open the per-course users view; rename should update the
courses list in place via state, not a hard reload.
**Root cause:** `handleManageCourse` was never wired up ("wired up in the next prompt"), and rename relies on a full-page reload instead of refetching/refreshing local course state.

---

## Issue #10 — Commit conflict retry only matches "409", missing GitHub's 422 sha conflicts
**File:** src/lib/githubApi.js lines 53-67 (commitFileWithRetry), check at line 59
**Severity:** Medium
**Current behaviour:** `commitFileWithRetry` retries only when `err.message` includes `'409'`.
GitHub's Contents API commonly returns **422 Unprocessable Entity** ("…does not match…") when the
supplied sha is stale, not 409. Those conflicts are rethrown immediately and never retried, so the
intended concurrent-write protection does not trigger for the most common conflict response.
**Expected behaviour:** Retry should cover the status codes GitHub actually returns for stale-sha
conflicts (422 as well as 409).
**Root cause:** Conflict detection is a brittle substring match on `'409'` only, which does not cover GitHub's 422 sha-mismatch responses.

---

## Issue #11 — getFileSha swallows non-404 errors and reports "no sha"
**File:** src/lib/githubApi.js lines 16-24
**Severity:** Medium
**Current behaviour:** `getFileSha` only special-cases 404; for any other non-OK response (e.g. 403
rate-limit, 401 auth, 5xx) it still calls `res.json()` and returns `data.sha ?? null`, i.e. `null`.
Callers (`commitFile`, `uploadImage`, `deleteFile`) then treat an existing file as new: `commitFile`
PUTs without a sha (GitHub rejects with 422 "sha wasn't supplied"), and `deleteFile` silently
returns `null` as if the file were already gone.
**Expected behaviour:** Non-404, non-OK responses should throw (or be surfaced) instead of being
collapsed into "file does not exist".
**Root cause:** The function checks only for 404 and otherwise assumes success, so transient/auth errors are misinterpreted as a missing file.

---

## Issue #12 — Image filename numbering collides after deletions / ignores course
**File:** src/hooks/useEditorSave.js lines 165-177; src/hooks/useEditorImages.js line 7
**Severity:** Low
**Current behaviour:** New image filenames are `${listDirectory(dir).length + 1}.${ext}` and
`imageCountRef` is keyed by `moduleId` only (not course+module). If any earlier image was deleted
(e.g. via cleanup), the directory count no longer matches the highest existing number, so the next
upload can reuse an existing filename and overwrite a referenced image. Sharing the counter across
courses with the same module id compounds this.
**Expected behaviour:** Generate a guaranteed-unique name (e.g. max existing index + 1, or a uuid),
keyed per course+module.
**Root cause:** Filename numbering is derived from a directory file *count* rather than the maximum existing index, and the in-memory counter is not course-scoped.

---

## Issue #13 — Global Cmd/Ctrl+B / Ctrl+I shortcuts fire regardless of focus
**File:** src/pages/admin/AdminEditor.jsx lines 89-116
**Severity:** Low
**Current behaviour:** The `keydown` listener is attached to `window`, so Ctrl/Cmd+B and Ctrl/Cmd+I
run `handleFormatAction` (mutating the Monaco document) even when focus is in the title input or any
other field, and `preventDefault` blocks the browser/native behaviour everywhere on the page.
**Expected behaviour:** Formatting shortcuts should only apply when the Monaco editor is focused.
**Root cause:** The shortcut handler is bound at the window level with no check that the editor (rather than another input) currently has focus.

---

## Issue #14 — Legacy useDraft.js is schema-incompatible with the current drafts table
**File:** src/hooks/useDraft.js lines 31-36, 75-85, 103-110
**Severity:** Low
**Current behaviour:** `useDraft` queries `drafts` with `.maybeSingle()` and upserts with
`onConflict: 'user_id'`, assuming one draft per user. The active hook `useDrafts.js` stores multiple
drafts per user keyed by `id` (`onConflict: 'id'`). If `useDraft` were used, `maybeSingle()` would
throw on users with multiple drafts and its upserts would clash with the multi-draft schema.
**Expected behaviour:** Remove the dead/duplicate hook or align it with the multi-draft `id`-keyed
schema.
**Root cause:** `useDraft.js` is an older single-draft-per-user implementation left behind after the migration to the multi-draft `useDrafts.js`, and its conflict target/`maybeSingle` assumptions no longer match the table.

---

## Issue #15 — ChemModal does not escape quotes in the molecule alt attribute
**File:** src/components/admin/ChemModal.jsx line 94
**Severity:** Low
**Current behaviour:** `handleInsertStructure` builds `<MoleculeStructure alt="${input.trim()}" …/>`
without escaping `"`. SocialLinkModal escapes attributes via `escapeAttr` (line 16-18), but ChemModal
does not. An input containing a double quote produces malformed tag markup that the renderer's
attribute regex (`MarkdownRenderer.jsx` line 27) will mis-parse.
**Expected behaviour:** Escape `"` (and ideally `&`) in the `alt` value before embedding it in the tag.
**Root cause:** The molecule alt value is interpolated into a quoted HTML-style attribute without the quote-escaping the social-link path already applies.

---

## Issue #16 — Social link chips render as block elements breaking sentence flow
**File:** src/components/markdown/MarkdownRenderer.jsx
**Severity:** High
**Current behaviour:** SocialLink chips split surrounding text onto separate lines.
**Expected behaviour:** Chip renders inline within the sentence like a standard inline element.
**Root cause:** Wrapper element around RichPopoverChip uses block-level display.

---

## Issue #17 — Monaco editor shows raw MoleculeStructure tag instead of friendly label
**File:** src/hooks/useEditorFormatting.js
**Severity:** High
**Current behaviour:** Full `<MoleculeStructure alt="x" data="base64..." />` visible in editor.
**Expected behaviour:** Editor shows `[skeletal formula: x]` label only, hiding raw markup.
**Root cause:** renderInlineWidgets view zone not applied to MoleculeStructure tags.

---

## Issue #18 — Reaction SMILES with > separators fail to render
**File:** src/lib/chemUtils.js
**Severity:** Medium
**Current behaviour:** SMILES strings containing `>` (reactants>reagents>products) throw or render blank.
**Expected behaviour:** Each part of the reaction renders as a separate diagram with arrows between them.
**Root cause:** SmilesDrawer only handles single molecules; reaction notation is not parsed.

---

## Issue #19 — deltaDecorations called recursively on every keystroke
**File:** src/hooks/useEditorFormatting.js
**Severity:** Critical
**Current behaviour:** Error: Invoking deltaDecorations recursively could lead to leaking decorations.
**Expected behaviour:** No recursive decoration calls; editor renders without errors.
**Root cause:** renderInlineWidgets triggers Monaco model events which re-enter renderInlineWidgets before the first call finishes.

---

## Issue #20 — CORS error from data:text/plain;base64,Cg== on every page load
**File:** Unknown — needs investigation across DirectoryDrawer and GitHub API consumers
**Severity:** Medium
**Current behaviour:** Cross-Origin Request Blocked: data:text/plain;base64,Cg== in console.
**Expected behaviour:** No CORS errors; .gitkeep files never fetched as URLs.
**Root cause:** Something outside githubApi.js accesses download_url from GitHub API responses.
