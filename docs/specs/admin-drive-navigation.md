# Feature Spec: Drive-style admin navigation, delete lockdown, and flat-interval autosave

**Status:** Proposed
**Created:** 2026-07-23
**Builds on:** E-005 (notes/folders already live in Supabase — this spec is UI/permissions on top of that
data model, not a storage change). Touches the delete-permission surface E-001 hardened.

---

## 0. The problem, in the owner's words

> When I login to the admin panel I am taken straight to the text editor, which is inconvenient for
> the other admins to use — they first need to open the sidebar, then select a directory, then write.

Today `/admin/editor` ([AdminEditor.jsx](../../src/pages/admin/AdminEditor.jsx)) always renders the
Monaco/WYSIWYG writing surface. Picking *where* to write means opening the slide-in
[DirectoryDrawer](../../src/components/admin/DirectoryDrawer.jsx), expanding an accordion tree, and
clicking a subfolder — three steps before the first keystroke. This spec replaces that with a
Google-Drive-style drill-down browser, styled in **Material You (M3)**, as the landing view; trims the
editor's own chrome accordingly; locks destructive deletes to one named account; adds a DB-backed "hide
from live site" toggle; and simplifies the editor's autosave to a flat 10-second interval.

---

## 1. Terminology mapping

The owner's brief uses "subject" / "module folder" / "file". The codebase already has three matching
layers, at three different levels of write-instancy — this matters throughout the spec:

| Owner's term | Codebase concept | Where it lives | Write latency |
|---|---|---|---|
| **Subject** (e.g. "Web", "AI") | `module` — an entry in the `MODULES` array | [modules.js](../../src/components/layout/Sidebar/modules.js), committed to GitHub | **Deploy-lag** (~1 min after Vercel rebuild) — `Icon` is a live React import, so a subject can't be a plain DB row without losing its icon/route (E-005 non-goal, reaffirmed here) |
| **Module folder** (e.g. "notes", "tools", or a custom subfolder) | `subfolder` — derived from note paths + explicit rows in `note_folders` | Supabase `note_folders` table ([0020_init_notes.sql](../../db/sql/0020_init_notes.sql)) | **Instant** |
| **File** | `note` — one row in `notes` | Supabase `notes` table | **Instant** |

Three levels, two different latency models, in one drill-down UI — Subject create/rename/delete toasts
should keep saying so explicitly, the same way `useEditorSave.js` already does for new images (see
[notes-supabase-storage.md §6.2](notes-supabase-storage.md#62-images-keep-the-deploy-lag--be-honest-about-it)).

---

## 2. Goals / Non-goals

**Goals**
- Replace the editor-first landing with a full-page, breadcrumb-driven browser: Subjects → module
  folders → files, each level with a create action and a per-row overflow menu (rename / delete / hide),
  styled in Material You (§4).
- Opening a file still lands in the existing writing surface ([NoteEditor](../../src/components/admin/NoteEditor)),
  unchanged in content-editing behaviour.
- Strip the editor's own directory affordances now that navigation happens one level up: the
  folder-toggle button and the `DirectoryDrawer` it opens, and the "New subject" / "Delete selected
  module" controls in [EditorNavbar](../../src/components/admin/EditorNavbar.jsx)'s row 2.
- Delete (subject, folder, or file) becomes authorized to exactly one account
  (`moon@mooner.dev`), enforced server-side, not just hidden in the UI.
- A subject/folder/file can be **hidden** — remains visible and manageable in the admin browser, but is
  excluded from the public site's sidebar and note routes.
- Autosave: while a note has unsaved changes, it is saved to Supabase every 10 seconds — only when
  something new has actually been typed since the last autosave (existing dirty-check semantics,
  simplified cadence).

**Non-goals**
- **Not** moving Subjects into the database. `modules.js` keeps `id` / `label` / `Icon` / `route` /
  `tools` in code — same non-goal E-005 already committed to, for the same reason (`Icon` is a live
  component). Subject create/rename/delete stays a GitHub commit with the existing deploy-lag toast.
- **Not** changing note content, rendering, or the WYSIWYG editor itself (E-004). Only the chrome around
  it and how you arrive at it.
- **Not** changing the owner/contributor role model or `allowed_directories` scoping — those still gate
  which Subjects a contributor sees and whether they can create/rename folders, exactly as today. This
  spec adds one **additional**, narrower gate on top for delete (§6).
- **Not** replacing the existing `admin_note_drafts` recovery-draft mechanism with an auto-publish. See
  §8 — this is the one place this spec deliberately does *less* than a literal reading of the brief
  might suggest, and it's flagged as an open question, not a silent decision.
- **Not** restyling the rest of the admin panel (`UsersDrawer`, `ImageCleanupDrawer`, modals, etc.) in
  M3. §4's scope is `AdminBrowser` only — matching how M3 was scoped to just `ui/Card` on first
  introduction (design.md, Session 10). A full admin-panel M3 pass would be its own follow-up.

---

## 3. New navigation model

### 3.1 Routes

Real routes (not a client-only view-state toggle) so back/forward and bookmarking work, matching how
Drive itself behaves:

```
/admin/editor                              → Browser, root: list of Subjects
/admin/editor/:moduleId                    → Browser: that Subject's module folders
/admin/editor/:moduleId/:subfolder         → Browser: that folder's files
/admin/editor/:moduleId/:subfolder/:slug   → Editor (existing writing surface)
/admin/editor/:moduleId/:subfolder/new     → Editor, blank note pre-targeted at this folder
```

[src/routes/index.jsx](../../src/routes/index.jsx) currently has a single `/admin/editor` route to
`AdminEditor`. This becomes two lazy-loaded components: a new `AdminBrowser` (levels 1–3 above) and the
existing `AdminEditor` trimmed per §5 (levels 4–5). `AdminBrowser` reads its depth from `useParams()`
and renders the Subjects / folders / files list accordingly — one component, three list-views, exactly
like Drive's own `/folder/:id` pattern in the reference screenshot.

### 3.2 Root view — Subjects

- Grid or list of Subjects (owner's screenshot shows a list view with columns; a simple row list matches
  the M3 tonal-row treatment in §4 better than a grid — see §4 before styling).
- Contributors see only Subjects in their `allowed_directories`, exactly as `visibleModules` already
  filters in [AdminEditor.jsx:358-360](../../src/pages/admin/AdminEditor.jsx#L358-L360) — that filter
  moves to `AdminBrowser`.
- **Create button** (top-left, per the Drive reference) → an M3 extended FAB (§4.1) that opens the same
  name/icon form `EditorNavbar`'s row-2 popover has today ([EditorNavbar.jsx:349-405](../../src/components/admin/EditorNavbar.jsx#L349-L405)),
  calling the existing `handleNewModule` ([useEditorModules.js:120-140](../../src/hooks/useEditorModules.js#L120-L140)).
  Owner-only, matching today.
- **Per-row overflow menu** (3-dot): Rename, Delete, Hide.
  - Rename/Delete reuse `handleRenameModule` / `handleDeleteModule` as-is.
  - Delete is additionally gated per §6 (not just `isOwner`).
  - Hide is new — see §7.

### 3.3 Subject view — module folders

- Lists the Subject's folders (today's `subfolders`, derived from `note_folders` + note paths —
  [DirectoryDrawer.jsx:252-262](../../src/components/admin/DirectoryDrawer.jsx#L252-L262) has the exact
  merge logic to lift into `AdminBrowser`).
- Breadcrumb: `Subjects / <Subject label>`.
- Create-folder action, per-row overflow (Rename / Delete / Hide) — reuses
  `handleNewSubfolder` / `handleRenameSubfolder` / `handleDeleteSubfolder`, all owner-gated exactly as
  today; Delete additionally requires §6.

### 3.4 Folder view — files

- Lists notes in the folder (`filesForFolder` — [DirectoryDrawer.jsx:26-34](../../src/components/admin/DirectoryDrawer.jsx#L26-L34)).
- Breadcrumb: `Subjects / <Subject label> / <folder>`.
- "+ New file" navigates to `/admin/editor/:moduleId/:subfolder/new` (blank editor, `selectedPath`
  pre-set — same effect as today's `handleNewFileInFolder`).
- Clicking a file navigates to `/admin/editor/:moduleId/:subfolder/:slug`, loading it via the existing
  `handleLoadFile` ([useEditorFiles.js](../../src/hooks/useEditorFiles.js)).
- Per-row overflow: Rename (any admin with access, as today), Delete (gated per §6), Hide.
- **Moving a file between folders**: today this is drag-and-drop within the always-expanded accordion
  tree, where source and destination are both on screen at once
  ([DirectoryDrawer.jsx:172-214](../../src/components/admin/DirectoryDrawer.jsx#L172-L214)). A
  drill-down browser only ever shows one folder at a time, so drag-and-drop has nothing to drop *onto*.
  **Recommendation:** replace it with an explicit "Move to…" row in the file's overflow menu, opening a
  small Subject/folder picker, calling the existing `handleMoveFile`. Flagged as an open question in
  §11 — confirm before implementation, since it's a UX change beyond what the brief described.

### 3.5 Editor view

Unchanged writing surface, minus the chrome removed in §5.

---

## 4. Visual design: Material You (M3)

The owner asked for this new surface to be designed in Material You. The codebase already has a small,
deliberate M3 token set for exactly this kind of expansion — [global.css](../../src/styles/global.css)
defines `--md-*` custom properties (surface containers, primary/on-primary, state-layer opacities, shape
scale, motion easing), mirrored as the `md` export in [colors.js](../../src/constants/colors.js), seeded
from the existing brand purple (`--md-primary: #8B5CF6`, the same value as `--color-accent`) rather than
Material's baseline palette — full table in
[docs/design/colors.md § Material You tokens](../design/colors.md#material-you-tokens---md-).

Today that token set is used by exactly one component, `ui/Card` (the landing-page tool cards), and
`docs/design.md`'s decision log scoped it there deliberately: "restyling the sidebar/navbar/tool pages is
its own epic." `AdminBrowser` is a second, intentional expansion of that scope — expected here since the
owner is asking for it directly, not scope creep — but it's exactly the kind of call `docs/design.md`'s
log exists to record. **Land a decisions-log entry** ("M3 scope extended to the admin browser") in
`docs/design.md` alongside this feature, mirroring its existing Session 10 entries.

### 4.1 What M3 means concretely here

| M3 concept | Applied to |
|---|---|
| **Tonal elevation, not shadows** | Each row / breadcrumb bar / overflow-menu surface is a `--md-surface-container` (`-low`/`-high` for stacked layers, e.g. an open menu over its row) — a lighter tone, not a `box-shadow`. `adminTokens.css`'s `--shadow-sm/md/lg` stay as-is for the modals/drawers this spec doesn't touch — M3 elevation is scoped to `AdminBrowser` only, not retrofitted app-wide (§2 non-goals). |
| **Filled, never outlined *and* filled** | A row is either a filled tonal surface (`--md-surface-container`, no border) or sits on the plain admin background with an `--md-outline-variant` hairline — never both, per the existing rule in colors.md. |
| **State layers, not transforms** | Hover/press feedback on a Subject/folder/file row is a `--md-state-hover` (`0.08`) / `--md-state-pressed` (`0.12`) opacity overlay in `--md-on-surface`, exactly like `ui/Card`. No `translateY` lift, no `scale`. |
| **Shape scale** | Rows: `--md-shape-lg` (16px), matching the card primitive. Overflow-menu surface: `--md-shape-md` (12px). The create FAB: pill / `--md-shape-lg`, per M3 FAB spec. |
| **FAB for the create action** | The root/Subject/folder-level "+" (§3.2–3.4) is an M3 **extended FAB** (icon + "New Subject" / "New folder" / "New file" label), not a plain icon button — the single most recognizable M3 pattern, and it's literally what's in the same corner of the Drive reference screenshot. |
| **Motion** | Row-open / breadcrumb transitions use `--md-easing-emphasized` at `--md-duration-short` / `-medium`, via `motion/react` (project standard — no Framer Motion, no GSAP, per design.md). |

### 4.2 Where the tokens live for admin use

`docs/design/components.md` describes `adminTokens.css` as the admin panel's *own* token set,
independent of `global.css` (authoritative "outside `/admin`"). But `--md-*` is declared on
`global.css`'s `:root`, and `:root` custom properties are page-global regardless of which stylesheet
declares them or which component's CSS Module consumes them — so `--md-*` is already available inside
`/admin` today with zero plumbing, the same way `ui/Card` reads it on the public site.

To match the existing `adminTokens.css` convention (it re-aliases shared values under short admin-local
names, e.g. `--bg` → `--color-bg`), add the same short-alias treatment for the M3 tokens `AdminBrowser`
needs (`--admin-md-surface`, `--admin-md-state-hover`, etc., repointing to the global `--md-*` values)
rather than having `AdminBrowser.module.css` reach across to `global.css` tokens by a different naming
convention than every other admin component uses.

### 4.3 Sourcing order (unchanged rule — still applies)

Per [docs/design/components.md](../design/components.md)'s mandatory sourcing order: check
[animate-ui.com](https://animate-ui.com) first for row/list/menu primitives, fall back to Tailwind
utilities, and hand-roll CSS Modules only last — the same order `ui/Card` followed, including reuse of
its [ripple primitive](../../src/components/animate-ui/primitives/buttons/ripple.tsx) with `hoverScale`
neutralized to `1` (the state layer in the table above replaces the scale/lift the primitive defaults
to). Do not add an installed M3 library (`@material/web`, MUI) — out of bounds per
[rules.md §5.2](../rules.md), same as everywhere else in the app.

---

## 5. Editor chrome removed

In [EditorNavbar.jsx](../../src/components/admin/EditorNavbar.jsx):

| Remove | Why |
|---|---|
| Row 1 folder toggle button (`Folder`/`FolderOpen`, `onToggleDirectory`) and the `DirectoryDrawer` it opens ([EditorNavbar.jsx:82-97](../../src/components/admin/EditorNavbar.jsx#L82-L97)) | Navigation now happens one level up, in `AdminBrowser`. Nothing left to toggle from inside the editor. |
| Row 2 `moduleGroup`: "New subject" (`FilePlus`) popover and "Delete selected module" (`DotsThreeVertical`) ([EditorNavbar.jsx:345-421](../../src/components/admin/EditorNavbar.jsx#L345-L421)) | Subject create/delete now live exclusively in the Browser's root view (§3.2). Keeping a second entry point in the editor re-creates the exact "where do I even do this" confusion the brief is trying to remove. |

In [AdminEditor.jsx](../../src/pages/admin/AdminEditor.jsx): delete the `DirectoryDrawer` render
(`directoryOpen` state, `onClearEditor`, the whole block at
[AdminEditor.jsx:664-691](../../src/pages/admin/AdminEditor.jsx#L664-L691)) and the props it no longer
needs to pass into `EditorNavbar`.

**Replace with:** a breadcrumb in the navbar's left group (where the folder toggle used to be) showing
`<Subject> / <folder>`, clickable back to that level in `AdminBrowser` — the one piece of "where am I"
context worth keeping once the full tree is gone. Style it with the M3 on-surface-variant text token
(§4), consistent with `AdminBrowser`'s own breadcrumbs.

---

## 6. Delete lockdown: `moon@mooner.dev` only

Today, delete of a subject / folder / file is gated on `profile.role === 'owner'`
(client: `isOwner` throughout `DirectoryDrawer`/`EditorNavbar`; server: the `notes` table's owner-only
DELETE policy and owner-only cross-subject-move trigger from
[0020_init_notes.sql](../../db/sql/0020_init_notes.sql), and `admin-github-write`'s
`deleteFile` op ([index.ts:170-179](../../supabase/functions/admin-github-write/index.ts#L170-L179))).

The brief asks for something narrower: delete restricted to **one specific account**, regardless of how
many accounts hold the `owner` role. This is a tightening, so it composes as an **additional** check,
not a replacement — an action must still pass the existing role/scope check *and* this one.

**Client:** compute `canDelete = user.email === 'moon@mooner.dev'` (from the authenticated
`supabase.auth` session — see `handleSignOut`'s use of `user` in
[AdminEditor.jsx](../../src/pages/admin/AdminEditor.jsx)) and gate every Delete menu item on it, in
`AdminBrowser`.

**Server — this is the part that actually matters** (E-001's whole point was that
client-side-only gates get bypassed; don't repeat that here):
- `notes` DELETE RLS policy and the cross-subject-move `with check`: add `and admin_is_delete_authorized()`,
  a security-definer helper mirroring `admin_can_write_module()`'s pattern
  ([0020_init_notes.sql](../../db/sql/0020_init_notes.sql)), checking the **verified JWT email**
  (`auth.jwt() ->> 'email'`), **not** `admin_users.email` — that column is an admin-editable profile
  field, not an identity claim, and using it here would let a compromised or misconfigured profile row
  grant delete rights to itself.
- `note_folders` DELETE policy: same helper.
- `admin-github-write`'s `deleteFile` op (subject deletion is a `modules.js` commit, which goes through
  `commitFile`, not `deleteFile` — but confirm whether subject delete should route through a
  dedicated, similarly-gated op instead of the general-purpose `commitFile`, since `commitFile` today
  has no role check beyond `isPathAllowed`). Tighten the existing `profile.role !== 'owner'` check
  at [index.ts:175](../../supabase/functions/admin-github-write/index.ts#L175) to also require the
  caller's verified email.

---

## 7. Hide (new capability)

Nothing today lets a Subject/folder/file exist in the admin panel but not show on the live site. This
needs new state, because:
- **Subjects** are code (`modules.js`) — you cannot toggle visibility of a code-defined module without
  a redeploy unless the toggle lives somewhere else. **Recommendation:** a small DB table,
  `module_visibility (module_id text primary key, hidden boolean not null default false, updated_at)`.
  Public: `select`, unrestricted. Write: owner-only (hide is not destructive, so it doesn't need the
  §6 delete lock — flagged as an assumption to confirm).
- **Folders** (`note_folders`) and **files** (`notes`) already live in the DB — add a `hidden boolean not
  null default false` column to each instead of a side table, since they're already per-row DB state.

**Public-site filtering** — every place that currently reads `MODULES`/notes/folders unfiltered needs to
respect `hidden`:
- [useNotesRegistry](../../src/hooks/useNotesRegistry.js) merge step (drives both the sidebar and
  `NotesPage`) — drop hidden notes/folders from the merge, and cross-reference `module_visibility` to
  drop hidden Subjects entirely.
- [ExpandedView.jsx](../../src/components/layout/Sidebar/ExpandedView/ExpandedView.jsx) and
  [NotesPage.jsx](../../src/pages/notes/NotesPage.jsx) consume the already-filtered registry, so no
  separate change needed there if the filter lives in `useNotesRegistry`.
- A hidden note's direct URL (`/notes/<module>/<path>`) should also 404 for public visitors even if
  someone has the link — `NotesPage`'s lookup needs the same filter, not just the sidebar listing.

**Admin browser:** a hidden row still appears, visually de-emphasized (dimmed, plus an M3 tonal "hidden"
badge — reuse the primary-container token from §4, not a new color), with "Unhide" replacing "Hide" in
its overflow menu — same pattern as any admin CMS's draft/published toggle.

---

## 8. Autosave — flat 10-second interval (and the one interpretation call to make)

There is **already** a Supabase-backed autosave: [useEditorDrafts.js](../../src/hooks/useEditorDrafts.js)
writes to `admin_note_drafts` on a 4-second idle timer with a 25-second ceiling, only when title/content
actually changed since the last save (`lastSavedRef` comparison —
[useEditorDrafts.js:32-38](../../src/hooks/useEditorDrafts.js#L32-L38)). It exists precisely to recover
from a crashed tab or accidental navigation; it is **not** the publish path — `handleSave` is what makes
a note live.

The brief's "autosaved to supabase every 10 seconds (given the user has written something new, else we
don't)" matches this existing dirty-check mechanism almost exactly, just with a different cadence. Two
readings, and the spec recommends the first:

1. **(Recommended) Simplify the existing recovery-draft autosave to a flat 10-second interval**,
   replacing the idle/ceiling pair with a single `setInterval`-driven check-and-save. Still writes to
   `admin_note_drafts`, still silent, still recovered via `restoreDraftIfExists` on next load. No change
   to publish semantics — a note still only goes live when the admin clicks Save.
2. **(Not recommended) Auto-publish**: upsert straight into the public `notes` table every 10 seconds.
   This would make every keystroke-adjacent pause go live on the public site with no explicit "Save"
   action at all — a materially different product behaviour (a half-finished sentence becomes public),
   and it would need `handleSave`'s validation (title required, filename derivation, cross-subject
   owner-check) re-run on a timer rather than on click. Nothing in the brief mentions removing the Save
   button, so this reading is presumed **not** intended, but is called out explicitly rather than
   silently assumed.

**Confirm interpretation 1 before implementation** (see §11).

Implementation sketch for (1) — [useEditorDrafts.js](../../src/hooks/useEditorDrafts.js): replace
`IDLE_MS`/`CEILING_MS`/the two timers with one `setInterval(10000)` that calls `saveDraft()`, which
already no-ops when `lastSavedRef` matches the current title/content — the "only if something new was
written" behaviour is free, it's already how `saveDraft` works today.

---

## 9. Data model changes

```sql
-- New: subject-level hide (modules.js entries have no DB row otherwise)
create table module_visibility (
  module_id  text primary key,
  hidden     boolean not null default false,
  updated_at timestamptz not null default now()
);
-- public select; owner-only write (see §7)

-- Add to existing tables
alter table note_folders add column hidden boolean not null default false;
alter table notes        add column hidden boolean not null default false;

-- New security-definer helper (mirrors admin_can_write_module in 0020_init_notes.sql)
create function admin_is_delete_authorized() returns boolean
  language sql security definer as $$
  select (auth.jwt() ->> 'email') = 'moon@mooner.dev'
$$;
```

RLS changes: `notes` and `note_folders` DELETE policies (and the `notes` cross-subject-move `with
check`) get `and admin_is_delete_authorized()` appended to their existing owner-scoped condition.

---

## 10. File-by-file change map

**New**
- `src/pages/admin/AdminBrowser.jsx` (+ `.module.css`) — the three drill-down list views (§3), styled
  per §4.
- `db/sql/00NN_admin_delete_lock_and_visibility.sql` — `module_visibility` table, `hidden` columns,
  `admin_is_delete_authorized()`, RLS policy updates (§9).

**Modified**
- [src/routes/index.jsx](../../src/routes/index.jsx) — split `/admin/editor` into the nested routes in
  §3.1.
- [src/components/admin/EditorNavbar.jsx](../../src/components/admin/EditorNavbar.jsx) — remove folder
  toggle + module-group controls (§5); add breadcrumb.
- [src/pages/admin/AdminEditor.jsx](../../src/pages/admin/AdminEditor.jsx) — remove `DirectoryDrawer`
  usage and its now-dead state/props; read target folder from route params instead of `selectedPath`
  set by the drawer.
- [src/hooks/useEditorDrafts.js](../../src/hooks/useEditorDrafts.js) — flat 10s interval (§8).
- [src/hooks/useEditorModules.js](../../src/hooks/useEditorModules.js) — add `handleHideModule` /
  `handleHideSubfolder`; thread `canDelete` alongside `isOwner` into the delete handlers' preconditions.
- [src/hooks/useEditorFiles.js](../../src/hooks/useEditorFiles.js) / `notesApi.js` — add `hideNote`,
  respect `hidden` in `listNotes`/`getNote` for public-facing reads.
- [src/hooks/useNotesRegistry.js](../../src/hooks/useNotesRegistry.js) — filter `hidden` Subjects/
  folders/notes out of what the public site ever sees (§7).
- [src/pages/notes/NotesPage.jsx](../../src/pages/notes/NotesPage.jsx) — 404 a hidden note by direct URL.
- [supabase/functions/admin-github-write/index.ts](../../supabase/functions/admin-github-write/index.ts) —
  verified-email check alongside the existing owner check on the delete-capable op (§6).
- [src/styles/adminTokens.css](../../src/styles/adminTokens.css) — add the `--admin-md-*` aliases (§4.2).
- [docs/design.md](../design.md) — decisions-log entry recording the M3 scope extension (§4).

**Retired**
- [src/components/admin/DirectoryDrawer.jsx](../../src/components/admin/DirectoryDrawer.jsx) — its tree/
  popover logic is lifted into `AdminBrowser`; the drawer-specific chrome (backdrop, slide-in, "Saving
  to:" footer) has no home in a full-page browser and is deleted, not ported.

---

## 11. Open questions to confirm before implementation

1. **Autosave semantics** (§8): confirm interpretation 1 (flat-interval recovery draft, not auto-publish).
2. **Move-between-folders UX** (§3.4): confirm replacing drag-and-drop with an explicit "Move to…"
   picker, since the drill-down layout removes drag-and-drop's implicit source+destination visibility.
3. **Hide-write permission**: confirm hide is owner-role-gated (not delete-lock-gated) — it's
   non-destructive, but worth confirming explicitly rather than assuming.
4. **Subject delete's server-side op**: confirm whether subject delete needs a dedicated, tightly-scoped
   edge-function op instead of reusing the general `commitFile` op (§6).
5. **Row layout at the root level** (§3.2): confirm a simple M3 row list (not a grid) — the Drive
   reference screenshot uses a dense list-with-columns view, which reads better as M3 tonal rows than
   as a card grid, but worth a nod before it's built.

---

## 12. Acceptance checklist

- [ ] Landing on `/admin/editor` shows the Subjects list, not the text editor.
- [ ] Drilling in (Subject → folder → file) uses real routes; browser back/forward works at each level.
- [ ] Root view has a create button (owner-only, styled as an M3 extended FAB) and each row has
      Rename/Delete/Hide.
- [ ] Delete is available and functional **only** for `moon@mooner.dev`, at every level (subject,
      folder, file) — verified both by the UI hiding the action for other accounts and by a direct
      RLS/edge-function call from another owner account being rejected.
- [ ] Hiding a Subject/folder/file removes it from the public sidebar, `NotesPage` listing, and its
      direct note URL, while it remains visible (de-emphasized) and manageable in the admin browser.
- [ ] `EditorNavbar` no longer renders a folder-toggle or "New subject"/"Delete selected module"
      controls; a breadcrumb shows the open note's Subject/folder instead.
- [ ] Editing a note autosaves to `admin_note_drafts` on a flat 10-second interval, silently, only when
      title/content changed since the last autosave — and does **not** publish to the live `notes` table.
- [ ] Manual Save (`handleSave`) behaviour is unchanged — still the only way a note goes live.
- [ ] `AdminBrowser` uses tonal surfaces + state-layer hover/press (no shadows, no translate/scale lifts)
      and the `--md-*` token set throughout, per §4 — spot-check against `ui/Card` for consistency.
- [ ] `docs/design.md`'s decision log has an entry recording the M3 scope extension to `AdminBrowser`.
