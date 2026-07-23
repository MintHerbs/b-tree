---
id: T-045
title: Admin Drive-style navigation (Material You), delete lockdown, hide toggle, and flat autosave
status: backlog
severity: high
area: admin
epic: E-006
created: 2026-07-23
---

## Summary

Replace `/admin/editor`'s always-on text editor with a Drive-style drill-down browser (Subjects →
module folders → files), styled in Material You, so an admin lands on a navigable list instead of a
blank editor behind a slide-in drawer. Delivered as one ticket in four internal phases: **A** the
browser itself + editor chrome cleanup, **B** locking delete to one named account, **C** a
hide-from-live-site toggle, **D** a simpler autosave cadence. Each phase has its own acceptance block
and can be reviewed/shipped as its own PR even though they're tracked as one ticket.

Full design, current-architecture analysis, data model, and open questions:
[docs/specs/admin-drive-navigation.md](../docs/specs/admin-drive-navigation.md).

*(Originally filed as four separate tickets — T-045 through T-048 — then folded into this one ticket's
phases at the owner's request to keep the ticket count down. T-046–T-048 are retired and not reused;
their content lives in phases B–D below.)*

## Evidence

- **Navigation (phase A):** picking where to write today means opening the slide-in
  [DirectoryDrawer.jsx](../src/components/admin/DirectoryDrawer.jsx), expanding an accordion tree, and
  clicking a subfolder — three steps before the first keystroke
  ([AdminEditor.jsx](../src/pages/admin/AdminEditor.jsx) always renders the writing surface). The
  drawer already has the tree/merge logic to lift into a full-page browser: subfolder derivation
  ([DirectoryDrawer.jsx:252-262](../src/components/admin/DirectoryDrawer.jsx#L252-L262)), per-folder
  file listing (`filesForFolder`,
  [DirectoryDrawer.jsx:26-34](../src/components/admin/DirectoryDrawer.jsx#L26-L34)). `EditorNavbar.jsx`
  has the directory-toggle button
  ([EditorNavbar.jsx:82-97](../src/components/admin/EditorNavbar.jsx#L82-L97)) and the "New subject" /
  "Delete selected module" controls
  ([EditorNavbar.jsx:345-421](../src/components/admin/EditorNavbar.jsx#L345-L421)) this phase removes.
  Material You tokens already exist app-wide (`--md-*` in [global.css](../src/styles/global.css),
  mirrored as `md` in [colors.js](../src/constants/colors.js)), currently consumed only by `ui/Card`.
- **Delete lockdown (phase B):** delete is currently gated on `profile.role === 'owner'` — client-side
  in `DirectoryDrawer`/`EditorNavbar`, server-side via the `notes` table's owner-scoped DELETE policy
  ([0020_init_notes.sql](../db/sql/0020_init_notes.sql)) and `admin-github-write`'s `deleteFile` op
  ([index.ts:170-179](../supabase/functions/admin-github-write/index.ts#L170-L179)). `admin_users.email`
  is an admin-editable profile column, not a verified identity claim, so the narrower check this phase
  adds must read the JWT's verified email instead.
- **Hide (phase C):** Subjects are code (`modules.js` `MODULES`,
  [modules.js](../src/components/layout/Sidebar/modules.js)) with a live `Icon` per entry — no DB row
  to attach a visibility flag to. Folders (`note_folders`) and files (`notes`) already live in Supabase
  with no `hidden` column. Public consumption paths that would need to respect one:
  [useNotesRegistry.js](../src/hooks/useNotesRegistry.js) (feeds
  [ExpandedView.jsx](../src/components/layout/Sidebar/ExpandedView/ExpandedView.jsx) and
  [NotesPage.jsx](../src/pages/notes/NotesPage.jsx)) and `NotesPage`'s direct-URL lookup.
- **Autosave (phase D):** [useEditorDrafts.js](../src/hooks/useEditorDrafts.js) already debounces on a
  4-second idle timer with a 25-second ceiling
  ([useEditorDrafts.js:1-83](../src/hooks/useEditorDrafts.js#L1-L83)), writing to `admin_note_drafts`
  only (not the live `notes` table), and already no-ops when title/content match the last save
  ([useEditorDrafts.js:32-38](../src/hooks/useEditorDrafts.js#L32-L38)) — the "only if something new was
  written" behavior the brief describes already exists; this phase only changes the cadence.

## Impact

Removes the "open drawer → expand tree → click subfolder" detour every admin hits before writing
anything, and two redundant subject create/delete entry points from inside the editor. Narrows an
irreversible action (delete) from "anyone with the owner role" to one named account — a pure
narrowing, no existing allowed action is prevented. Adds a genuinely new, low-risk capability (hide).
Simplifies an existing safety net's cadence without touching its target table or dirty-check.

The one place real risk concentrates: **phase B's server-side enforcement**. A client-only delete gate
(hiding the button) would repeat exactly the class of bug E-001's T-001 found and fixed once already —
the RLS/edge-function changes are load-bearing, not the UI gate. Two open interpretation calls need the
owner's sign-off before phases C and D start (drag-and-drop replacement in phase A, and the
recovery-draft-vs-auto-publish reading in phase D) — see
[spec §11](../docs/specs/admin-drive-navigation.md#11-open-questions-to-confirm-before-implementation).

## Suggested fix

Per [spec §3–§9](../docs/specs/admin-drive-navigation.md), in four phases:

**Phase A — `AdminBrowser` navigation + Material You + editor chrome cleanup**
- Nested routes in [src/routes/index.jsx](../src/routes/index.jsx): `/admin/editor`,
  `/admin/editor/:moduleId`, `/admin/editor/:moduleId/:subfolder` → new `AdminBrowser`;
  `.../:slug` and `.../new` → existing `AdminEditor`, trimmed.
- New `src/pages/admin/AdminBrowser.jsx` (+ `.module.css`): three list-views by `useParams()` depth,
  each with a breadcrumb, a create action (M3 extended FAB), and a per-row 3-dot menu (Rename now;
  Delete/Hide land in phases B/C).
- Style per spec §4: tonal `--md-surface-container` rows (no shadows), `--md-state-hover`/`-pressed`
  opacity overlays instead of transform/scale, `--md-shape-lg` corners, the `ui/Card` ripple primitive
  with `hoverScale` neutralized to `1`. Add `--admin-md-*` aliases to
  [adminTokens.css](../src/styles/adminTokens.css) per spec §4.2.
- Retire `DirectoryDrawer.jsx` (logic lifted into `AdminBrowser`, drawer-only chrome deleted). Remove
  `EditorNavbar`'s folder toggle and `moduleGroup`; add a breadcrumb in its place. Remove
  `AdminEditor.jsx`'s `DirectoryDrawer` render and dead `directoryOpen` state.
- Add a `docs/design.md` decisions-log entry recording the M3 scope extension to `AdminBrowser`.
- Confirm the "Move to…" picker replacing drag-and-drop (open question 2) before building file-move.

**Phase B — Delete lockdown to `moon@mooner.dev`**
- New security-definer helper, alongside the existing `admin_can_write_module()` pattern:
  `admin_is_delete_authorized() returns boolean ... select (auth.jwt() ->> 'email') = 'moon@mooner.dev'`.
- `notes` DELETE policy + cross-subject-move `with check`, and `note_folders` DELETE policy: append
  `and admin_is_delete_authorized()`.
- `admin-github-write`'s delete-capable op: require the caller's verified email alongside the existing
  owner-role check (confirm whether subject delete needs its own scoped op instead of reusing
  `commitFile` — open question 4).
- Client: `canDelete = user.email === 'moon@mooner.dev'` gates the Delete item in `AdminBrowser`'s
  overflow menu, additive to the existing role/scope check.

**Phase C — Hide toggle**
- Same migration as phase B (`db/sql/00NN_admin_delete_lock_and_visibility.sql` + `migrations.yaml`
  entry): `module_visibility(module_id text primary key, hidden boolean default false, updated_at)`
  (public select, owner-only write); `hidden boolean default false` added to `note_folders` and `notes`.
- Admin: `handleHideModule`/`handleHideSubfolder`/`hideNote` alongside the existing handlers in
  [useEditorModules.js](../src/hooks/useEditorModules.js)/[notesApi.js](../src/lib/notesApi.js); wire
  Hide/Unhide into `AdminBrowser`'s overflow menu. Hidden rows stay visible in the admin browser,
  de-emphasized (dimmed + M3 tonal badge). Owner-role-gated, independent of phase B's delete lock
  (confirm — open question 3).
- Public: `useNotesRegistry`'s merge drops hidden notes/folders and cross-references
  `module_visibility` to drop hidden Subjects; `NotesPage.jsx`'s direct-URL lookup applies the same
  filter so a hidden note 404s, not just disappears from the listing.

**Phase D — Flat 10-second autosave (independent of A–C; can ship in parallel)**
- Confirm the recovery-draft (not auto-publish) reading with the owner first — open question 1.
- In [useEditorDrafts.js](../src/hooks/useEditorDrafts.js), replace `IDLE_MS`/`CEILING_MS` and the two
  timers with one `setInterval(saveDraft, 10000)`, started while `unsaved` is true, cleared on unmount /
  note-identity change. `saveDraft`'s existing `lastSavedRef` check already gives the dirty-only
  behavior for free.

## Acceptance criteria

**Phase A**
- [ ] Landing on `/admin/editor` shows the Subjects list, not the text editor; drilling in uses real
      routes with working back/forward.
- [ ] Root view has an M3-styled create FAB (owner-only) and each row has a working Rename action.
- [ ] Contributors see only Subjects within their `allowed_directories`.
- [ ] `EditorNavbar` no longer renders a folder-toggle or "New subject"/"Delete selected module"
      controls; a breadcrumb replaces them. `DirectoryDrawer.jsx` is deleted.
- [ ] `AdminBrowser` uses tonal surfaces + state-layer hover/press only, spot-checked against `ui/Card`.
- [ ] `docs/design.md`'s decision log has an entry for the M3 scope extension.

**Phase B**
- [ ] `admin_is_delete_authorized()` reads the verified JWT email, not `admin_users.email`.
- [ ] Delete succeeds for `moon@mooner.dev` and is rejected server-side for every other account
      (including other owners) at all three levels — verified by a direct call, not just via the UI.
- [ ] The Delete menu item is hidden/disabled for every other account.
- [ ] Every other owner-gated action (create, rename, non-cross-module move) is unaffected.

**Phase C**
- [ ] `module_visibility` table and `hidden` columns exist as a tracked migration (shared with phase B).
- [ ] Hiding a subject/folder/file removes it from the public sidebar and `NotesPage` listing, and its
      direct URL 404s.
- [ ] A hidden row remains visible (de-emphasized) and manageable, including "Unhide", in the admin
      browser.
- [ ] Every existing (non-hidden) item is unaffected — `hidden` defaults to `false`.

**Phase D**
- [ ] Owner has confirmed the recovery-draft interpretation before this ships.
- [ ] While a note is unsaved, `admin_note_drafts` is upserted roughly every 10 seconds, only when
      changed since the last autosave; switching notes / unmounting stops the interval cleanly.
- [ ] The public `notes` table is never written by this path — `handleSave` remains the only publish
      path.

## References

- [docs/specs/admin-drive-navigation.md](../docs/specs/admin-drive-navigation.md)
- Epic [E-006](../epics/E-006-admin-drive-navigation.md)
- Precedent: [E-001](../epics/E-001-admin-panel-hardening.md) T-001 (client-side-only auth checks are
  not sufficient); [E-005](../epics/E-005-notes-supabase-storage-migration.md) T-043 (same
  multi-ticket-to-one-phased-ticket consolidation pattern)
