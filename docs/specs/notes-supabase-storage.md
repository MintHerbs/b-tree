# Feature Spec: Notes content in Supabase (instant publish) + GitHub as image store & backup

**Status:** Proposed
**Created:** 2026-07-23
**Epic:** E-005 — Notes storage migration to Supabase

**Decisions locked** (confirmed with the product owner before this spec was written):

1. **Supabase is the source of truth for note *content* (`content_md`).** Saving a note is a single
   row upsert; the note is live on the reader's next page load — **no GitHub commit, no Vercel
   rebuild** on the critical path.
2. **Images stay in GitHub** (`public/notes/img/<module-id>/`), served as static assets by the host.
   New images therefore carry a deploy-lag window; text-only edits are instant (see §6).
3. **GitHub keeps a `.md` copy as an optional, stale-tolerant backup**, written by an explicit
   "Save to GitHub" action — *not* the save path and *not* authoritative.
4. **`modules.js` keeps its module / tool / icon / route definitions** (icons are live React
   components, routes map to `src/routes`) — only the per-module **`notes[]` arrays** are removed.
   The notes list becomes a Supabase query.

---

## 1. Overview

Today a note is not "saved" to anywhere the live site reads directly. Notes are **build-time static
content**: the public site loads them with
`import.meta.glob('../../content/notes/**/*.md', { query: '?raw' })`
([NotesPage.jsx:6](../../src/pages/notes/NotesPage.jsx#L6)), so Vite bakes every `.md` into the JS
bundle at build time, and the sidebar reads a hand-maintained registry
([modules.js](../../src/components/layout/Sidebar/modules.js)).

Because of that, a single "save" ([useEditorSave.js](../../src/hooks/useEditorSave.js)) has to run a
brittle chain:

1. Commit the `.md` to GitHub via the `admin-github-write` edge-function proxy.
2. **Regex-rewrite `modules.js`** to insert / rename / move the registry entry
   (`upsertNoteEntry`, `renameNoteEntry`, `removeNoteEntry`, `findModuleBlock` — parsing JS source as
   data).
3. Commit `modules.js` too, with 409-SHA retry logic (`commitFileWithRetry`).
4. Wait for Vercel to rebuild and redeploy before the note is actually live
   ("Published! Vercel is deploying...").

Step 2 is the fragile heart of it, and a whole class of open bugs is downstream of editing source
code as data (T-002 image cleanup, T-004/T-005 move/rename, T-027/T-028 registry desync).

This epic moves **note text** to a Supabase `notes` table, making it **runtime content**: the
sidebar and reader query the table, a save is one `upsert`, and the note is live immediately. Images
stay in GitHub and `modules.js` keeps its structural definitions; both are deliberately *not* moved.

### Guiding principle

> **Content is data, not source. The write path is an upsert, not a code edit + rebuild.**

---

## 2. Goals / Non-goals

**Goals**
- Note content lives in a Supabase `notes` table and is the single source of truth.
- Saving a note is one row upsert; it is live on the next reader page load with no rebuild.
- The `modules.js` `notes[]` regex surgery (`upsertNoteEntry` / `renameNoteEntry` /
  `removeNoteEntry`) is deleted, along with the `notes[]` arrays themselves.
- Rename / move within or across subjects becomes a plain column update, not a two-file commit.
- "Save to GitHub" becomes an explicit, optional backup export of the `.md`, off the critical path.
- Public reader and sidebar read notes from Supabase, with proper loading / not-found states.
- Server-side write authorization (owner vs. contributor, directory scoping) is faithfully
  reproduced in RLS.

**Non-goals**
- **Not** moving images off GitHub. They stay in `public/notes/img/<module-id>/`, served static
  (deliberate, per locked decision 2). Supabase Storage for images is a possible *future* pass, out
  of scope here.
- **Not** retiring `modules.js`. Module / tool / icon / route definitions stay in code (icons are
  React components). Only the content `notes[]` arrays leave.
- **Not** changing how a note is *rendered*. `NoteReader` / `MarkdownRenderer` are untouched — only
  the *source* of the `content` string changes from a bundled glob to a DB query.
- **Not** changing the WYSIWYG editor authoring UX (E-004). This is a storage-backend change; the
  editor still produces a Markdown string.
- **Not** collaborative editing, comments, or server-side version history (the GitHub backup is the
  only history mechanism, and it is best-effort).

---

## 3. Current architecture (as-built)

Read this before touching anything — the read and write paths are more entangled with GitHub than
they look.

### 3.1 Read path (public)
- [NotesPage.jsx:6](../../src/pages/notes/NotesPage.jsx#L6): `import.meta.glob('../../content/notes/**/*.md', { query: '?raw' })`
  — **synchronous, build-time**. Content is present at first render; there is no loading state today.
- Sidebar note links + counts come from the `notes[]` arrays in
  [modules.js](../../src/components/layout/Sidebar/modules.js).
- Rendering: `<NoteReader content={content} eyebrow={…} />` (E-004). Unchanged by this spec.

### 3.2 Write path (admin)
- [useEditorSave.js](../../src/hooks/useEditorSave.js) — commit `.md`, then regex-rewrite + commit
  `modules.js`, then reconcile `image_map`, then wait for Vercel.
- Registry surgery helpers live in the same file: `upsertNoteEntry`, `renameNoteEntry`,
  `removeNoteEntry`, `findModuleBlock`, `noteIsRegistered`, `parseNotePath`.
- Loading an existing note for editing: [useEditorFiles.js](../../src/hooks/useEditorFiles.js)
  `handleLoadFile` → `getFileContent(path)` (GitHub).
- Admin file tree: [DirectoryDrawer.jsx](../../src/components/admin/DirectoryDrawer.jsx) lists dirs
  via GitHub `listDirectory`.

### 3.3 Server boundary — `admin-github-write` edge function
[supabase/functions/admin-github-write/index.ts](../../supabase/functions/admin-github-write/index.ts)
verifies the caller's Supabase session and enforces, server-side:
- `isPathAllowed(path, role, allowedDirectories)`: owners write anything; contributors may write
  only `src/content/notes/<dir>/…` and `public/notes/img/<dir>/…` for `dir` in their
  `allowed_directories`; `modules.js` is always writable (shared registry).
- `modules.js` writes by a non-owner must be a **single-module scoped edit**
  (`isScopedModulesJsEdit`) and carry a `moduleId` in their `allowed_directories`.
- These are the exact rules RLS must reproduce for the `notes` table (§5).

### 3.4 Images & orphan tracking
- Images commit to `public/notes/img/<module-id>/<n>.<ext>` via `uploadImage`; markdown references
  them by path (`/notes/img/<module-id>/<n>.png`).
- `image_map` (Supabase) + [useImageCleanup.js](../../src/hooks/useImageCleanup.js) track which
  images are referenced, by scanning **committed `.md` in GitHub** and keying on the committed file
  SHA ([useEditorSave.js:364](../../src/hooks/useEditorSave.js#L364)).
- **Finding:** `image_map` has **no tracked migration** in `db/sql/` — it was created ad-hoc (same
  situation as the untracked `public.drafts` table noted in
  [0019_admin_note_drafts.sql](../../db/sql/0019_admin_note_drafts.sql)). This migration should adopt
  it into a tracked migration while it is being changed.

### 3.5 The `modules.js` module vs. notes distinction (important)
`modules.js` holds two different kinds of thing:
- **Structural** — `{ id, label, Icon: <ReactComponent>, route, tools[] }`. `Icon` is a live import
  from `@phosphor-icons/react`; `route` maps to `src/routes/index.jsx`. **These cannot live in a DB
  as-is and stay in code.**
- **Content** — the `notes[]` array per module (`{ filename, label }`). **This is the only part that
  moves to the `notes` table**, and the only part the regex surgery targets.

Removing `notes[]` deletes the fragile write path while leaving navigation/iconography in code where
it belongs.

---

## 4. Data model

### 4.1 `notes` table

```sql
create table notes (
  id          uuid primary key default gen_random_uuid(),
  module_id   text        not null,   -- matches a modules.js module id, e.g. 'web','database'
  subfolder   text        not null,   -- the existing two-level layout: 'notes' | 'tools'
  slug        text        not null,   -- filename without .md, e.g. 'getting-started'
  title       text        not null default '',  -- registry label; visible title is still the md # H1
  content_md  text        not null default '',
  updated_at  timestamptz not null default now(),
  updated_by  uuid        references auth.users(id) on delete set null,
  unique (module_id, subfolder, slug)
);
```

- The public URL derives from the row exactly as today's path does:
  `/notes/<module_id>/<subfolder>/<slug>` (the reader already parses this shape — see
  `parseNotePath` in [useEditorSave.js:123](../../src/hooks/useEditorSave.js#L123) and the path
  parsing in [useEditorFiles.js:19](../../src/hooks/useEditorFiles.js#L19)).
- Images are **not** a column and **not** a table: they remain inline Markdown paths inside
  `content_md` (`![](/notes/img/<module-id>/<n>.png>)`). The reader resolves them against the static
  host exactly as today. This keeps decision 2 intact with zero reader changes.
- `title` carries the registry label for continuity; the *visible* title remains the Markdown `# H1`
  (the E-004 reader decision), so nothing about title rendering changes.

### 4.2 `image_map` — adopt into a tracked migration
Restate the existing ad-hoc `image_map` table as a tracked migration (no shape change beyond what
T-046 needs). Its **reference source flips** from GitHub `.md` to `notes.content_md` (§6.3, T-046).

### 4.3 Sidebar / registry
No new table. The sidebar's per-module note list becomes:
`select module_id, subfolder, slug, title from notes order by module_id, subfolder, slug`,
grouped by `module_id` in the client and joined to the structural `MODULES` array from `modules.js`.

---

## 5. Row-level security (the risk area)

RLS on `notes` must reproduce, exactly, what `admin-github-write` enforces today (§3.3). This is the
single place where "simpler" could quietly become "less safe," so it is specified in full and gets
its own acceptance checks.

Reuse the existing **security-definer** helper pattern introduced in
[0017_fix_admin_users_rls.sql](../../db/sql/0017_fix_admin_users_rls.sql) (which fixed the recursive
owner-check). Add one helper that mirrors `isPathAllowed`:

```sql
-- SECURITY DEFINER, reads admin_users for the calling user.
-- Mirrors isPathAllowed(): owners write anything; contributors only their allowed modules.
create function admin_can_write_module(p_module_id text) returns boolean ...
  -- true if the caller's admin_users.role = 'owner'
  --   OR p_module_id = any(caller's allowed_directories)
```

Policies:

| Action | Policy |
|---|---|
| `SELECT` | **Public** (anon + authenticated). Notes are public content. |
| `INSERT` | `with check ( admin_can_write_module(module_id) )`. |
| `UPDATE` | `using ( admin_can_write_module(module_id) )` **and** `with check ( admin_can_write_module(module_id) )` — the `with check` covers the *new* `module_id`, so a contributor cannot move a note *into* a module they don't own. |
| Cross-module move | Changing `module_id` requires write access to **both** old and new module. For a contributor that means both must be in `allowed_directories`; the current code makes cross-module moves **owner-only** ([useEditorSave.js:233](../../src/hooks/useEditorSave.js#L233)) — reproduce that as owner-only via a trigger or a `with check` that additionally requires owner when `module_id` changed. **Decide and document one** (recommend: owner-only, matching today). |
| `DELETE` | **Owner-only** — mirrors `deleteFile` being owner-gated today ([githubApi.js:100](../../src/lib/githubApi.js#L100)). (Rename no longer needs a `cleanupFile` delete — it is an in-place `UPDATE`.) |

**Note:** direct table writes move authorization out of the edge function and into RLS. The edge
function's `modules.js`-scoping logic (`isScopedModulesJsEdit`, `findModuleBlock`) is **deleted**,
since `modules.js` is no longer written — a server-side simplification, but it means RLS is now the
*only* thing standing between a contributor and an out-of-scope write. Test it adversarially (T-043
acceptance).

---

## 6. Behaviour changes & the one honest tradeoff

### 6.1 Save
`handleSave` collapses to: resolve the image queue (unchanged, still GitHub — see §6.2), then

```
upsert into notes (module_id, subfolder, slug, title, content_md, updated_by)
  on conflict (module_id, subfolder, slug) do update ...
```

No SHA fetch, no 409 retry, no second commit, no `modules.js` edit. Rename / move = update
`slug` / `subfolder` / `module_id` on the same row (subject to §5). The registry helpers are deleted.

### 6.2 Images keep the deploy-lag — be honest about it
Image upload is unchanged: a GitHub commit to `public/notes/img/…`, served static, so a **new** image
is only fetchable **after Vercel redeploys**. Because the note text now lands instantly, a save that
*adds a new image* produces a split — text live now, image 404 for ~1 min.

- This affects **only** saves that introduce a new image. Text-only edits (the majority) are fully
  instant.
- **The editor must say so.** When a save includes new uploads, the toast reads e.g. *"Saved. New
  images go live after deploy (~1 min)."* When it does not: *"Saved."* (Replaces today's blanket
  "Vercel is deploying...".)
- Optionally render the just-uploaded image from its local blob URL in the editor so the author never
  sees the gap; only first-load public readers do, within that window.

> Accepted tradeoff: "images in GitHub" and "no rebuild lag on new images" cannot both be fully true.
> The owner has chosen images-in-GitHub.

### 6.3 Orphan tracking flips source (T-046)
`image_map` / `useImageCleanup` currently answer "which images are referenced?" from committed `.md`
in GitHub. With text in Supabase, GitHub no longer holds the authoritative text, so the scan must
read references from `notes.content_md`. If this is missed, the cleaner flags **every** image as
orphaned — which is already the symptom in **T-002**. So T-046 both flips the source and is the real
fix for T-002.

### 6.4 "Save to GitHub" — optional backup
A separate, explicit action reads the row and commits the `.md` to
`src/content/notes/<module_id>/<subfolder>/<slug>.md` as a backup, reusing the existing edge function
`commitFile` — but with **no** `modules.js` logic attached. It is stale-tolerant: if it fails, the
note is still live and safe. Restore path (manual, rare): re-import the `.md` into `notes`.

### 6.5 What happens to the GitHub proxy surface
| `githubApi.js` export | After migration |
|---|---|
| `getFileContent` | Reader/loader use DB. Kept only for backup restore. |
| `commitFile` / `commitFileWithRetry` | Only the optional "Save to GitHub" backup. `modules.js` retry path gone. |
| `uploadImage`, `getFileSha`, `listDirectory` | **Kept** — images stay in GitHub (upload, SHA, image-dir listing for numbering). |
| `deleteFile` / `cleanupFile` | Note delete = DB delete; rename cleanup no longer needed. GitHub delete only for optional backup cleanup. |

---

## 7. Migration & rollout

### 7.1 One-time content import
A script (`scripts/migrate-notes-to-supabase.mjs`, run from a repo checkout with the service-role
key) walks `src/content/notes/**/*.md`, derives `(module_id, subfolder, slug)` from the path and
`title` from the `modules.js` registry label (fallback: humanised slug), and upserts each row. Idempotent (keyed on the unique constraint) so it can be re-run. Validate by count + a
rendered-output spot check against the live site.

### 7.2 Cutover strategy
The site is low-traffic with one/few authors, so a **big-bang cutover in a single frontend release**
is acceptable and simplest:
1. Land schema + RLS (migration `00NN_init_notes.sql`) and run the import script.
2. Ship one release that flips **reader** (§3.1 → DB) **and** writer (§6.1 → upsert) together and
   removes the `import.meta.glob` and the `notes[]` arrays.

**Safer alternative if zero divergence is required:** a transitional dual-write (writer upserts to DB
*and* keeps committing `.md`) while the reader still reads the glob, then flip the reader last. More
code; only worth it if the big-bang window is unacceptable. Recommend big-bang; document the fallback.

### 7.3 Ordering & dependencies
Delivered as one ticket (T-043) in three internal phases: **A** schema/RLS/import → **B** reader +
writer flip (ship together in the cutover release) → **C** image orphan tracking (immediately after,
depends only on content being in the DB). Do not land phase B's writer flip without phase C, or the
orphan cleaner flags every live image (§6.3).

---

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| RLS doesn't fully reproduce edge-function rules → contributor writes out of scope | §5 specifies every policy against the code it mirrors; T-043 acceptance includes an **adversarial** contributor-out-of-scope test (insert, update, cross-module move, delete). |
| Cross-module move authorization gap | Reproduce today's owner-only rule explicitly (trigger or owner-gated `with check`); test it. |
| Import drops or mangles a note | Idempotent, keyed upsert; count + rendered-output validation; GitHub still holds every `.md` as the pre-migration backup, so import is re-runnable and reversible. |
| Reader has no loading/not-found state today | T-044 adds loading / error / 404 states — the glob was synchronous; a query is not. |
| Orphan cleaner flags all images (T-002) | T-046 flips the reference source to `notes.content_md`; do not ship the writer flip without it, or scope the cleaner off until it lands. |
| New-image deploy lag surprises readers | §6.2 toast honesty + optional blob-URL preview; documented accepted tradeoff. |
| `image_map` untracked drift | Adopt into a tracked migration (§4.2) while touching it. |

---

## 9. File-by-file change map

**New**
- `db/sql/00NN_init_notes.sql` — `notes` table, `admin_can_write_module` helper, RLS policies (+ `image_map` adoption, or a sibling migration).
- `scripts/migrate-notes-to-supabase.mjs` — one-time content import.
- A small `notes` data-access module (e.g. `src/lib/notesApi.js`) — `listNotes`, `getNote`, `upsertNote`, `deleteNote`, `renameNote`.

**Modified**
- `src/pages/notes/NotesPage.jsx` — drop `import.meta.glob`; query the DB; add loading/error/not-found.
- `src/components/layout/Sidebar/modules.js` — remove all `notes[]` arrays (keep module/tool/icon/route defs).
- `src/components/layout/Sidebar/*` — note links/counts from a DB query joined to `MODULES`.
- `src/hooks/useEditorSave.js` — upsert to `notes`; **delete** `upsertNoteEntry`/`renameNoteEntry`/`removeNoteEntry`/`findModuleBlock`/`noteIsRegistered`; new-image-aware toast.
- `src/hooks/useEditorFiles.js` — `handleLoadFile` reads from DB.
- `src/components/admin/DirectoryDrawer.jsx` — admin file tree from DB.
- `src/hooks/useImageCleanup.js` + `image_map` writer — reference source → `notes.content_md`.
- `supabase/functions/admin-github-write/index.ts` — drop `modules.js` scoping (`isScopedModulesJsEdit`, `findModuleBlock`, the `modules.js` branch); keep image + backup-commit ops.
- `src/lib/githubApi.js` — trim to image ops + optional backup commit; note the narrowed surface.

**Untouched (contract preserved):** `NoteReader`, `MarkdownRenderer` (content string source changes,
component does not), `CodeBlock`, the WYSIWYG editor authoring UX (E-004), `admin_note_drafts`
(autosave is orthogonal).

---

## 10. Acceptance checklist

- [ ] Saving a note upserts one `notes` row; the note is visible on a fresh reader load with **no**
      Vercel rebuild (§6.1).
- [ ] `modules.js` has no `notes[]` arrays; `upsertNoteEntry`/`renameNoteEntry`/`removeNoteEntry` are
      deleted; module/tool/icon/route defs still work (§3.5, §9).
- [ ] Rename and same-subject move are a single row update; no duplicate rows, no second commit.
- [ ] Cross-module move obeys the reproduced owner-only rule (§5).
- [ ] Public reader and sidebar list read from Supabase, with loading / not-found states (§3.1, T-044).
- [ ] **RLS adversarial:** a contributor cannot insert/update/move/delete a note outside
      `allowed_directories`; an owner can; anon can only read (§5).
- [ ] One-time import brought every existing note into `notes`, validated by count + rendered spot
      check (§7.1).
- [ ] Image upload still works; a save adding a new image shows the deploy-lag-honest toast; text-only
      saves show plain "Saved" (§6.2).
- [ ] Orphan tracking reads references from `notes.content_md`; it no longer flags live images (closes
      the T-002 class) (§6.3, T-046).
- [ ] "Save to GitHub" writes the `.md` backup and is off the critical path; its failure does not
      unpublish the note (§6.4).
- [ ] `image_map` is a tracked migration (§4.2).
- [ ] `admin-github-write` no longer contains `modules.js` logic; image + backup ops intact (§9).

---

## 11. Ticket map
The whole migration is **one ticket**, T-043, under epic **E-005**
([epics/E-005-notes-supabase-storage-migration.md](../../epics/E-005-notes-supabase-storage-migration.md)),
delivered in three internal phases. (Consolidated 2026-07-23 from a 4-ticket breakdown at the owner's
request; IDs T-044–T-046 retired, not reused.)

| Phase (in T-043) | Scope |
|---|---|
| A | `notes` schema + `admin_can_write_module` helper + RLS (reproducing edge-function rules) + one-time import script |
| B | Reader + sidebar from Supabase (remove `import.meta.glob` and `notes[]`) **and** save → upsert (delete registry surgery, "Save to GitHub" backup, deploy-lag toast, trim edge function) — ship together |
| C | Flip image orphan tracking to `notes.content_md`; adopt `image_map` into a tracked migration (closes T-002 class) |

**Order:** A → B → C (do not ship B's writer flip without C).

## 12. Relationship to other work
- **Supersedes** E-001's deferred non-goal — E-001 explicitly said a storage-backend migration "would
  be its own separate epic if ever proposed." This is that epic.
- **Fixes the root of T-002** (image cleanup flags all images) via T-046.
- **Orthogonal to E-004** (WYSIWYG editor / reader). E-004 changes how a note is *authored and
  rendered*; this changes where its bytes *live*. They compose cleanly — E-004's editor still emits a
  Markdown string; this spec changes only where that string is read from and written to.
- **Does not touch** `admin_note_drafts` (T-032/T-033 autosave) — draft autosave already uses
  Supabase and is unaffected.
