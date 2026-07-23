---
id: T-043
title: Migrate note content to Supabase (schema+RLS, reader, writer, images) in one cutover
status: backlog
severity: high
area: admin
epic: E-005
created: 2026-07-23
---

## Summary

Move note **content** from build-time static Markdown (`import.meta.glob` + `modules.js` `notes[]`)
to a Supabase `notes` table that is the source of truth. A save becomes a single row upsert and is
live on the next reader load with no Vercel rebuild. Images stay in GitHub; `modules.js` keeps its
module/tool/icon/route definitions and loses only its `notes[]` arrays; GitHub keeps an optional
`.md` backup. This is one ticket delivered in three internal phases (A backend → B reader+writer
cutover → C images), each with its own acceptance block.

Full design, schema, RLS policies and rationale:
[docs/specs/notes-supabase-storage.md](../docs/specs/notes-supabase-storage.md).

## Evidence

- Content is bundled at build time: `import.meta.glob('../../content/notes/**/*.md', { query: '?raw' })`
  in [NotesPage.jsx:6](../src/pages/notes/NotesPage.jsx#L6) — synchronous, no loading/not-found state.
- A save commits `.md`, then regex-rewrites + commits `modules.js` (`upsertNoteEntry`,
  `renameNoteEntry`, `removeNoteEntry`, `findModuleBlock`, `noteIsRegistered`) with 409-SHA retries,
  then waits for Vercel: [useEditorSave.js](../src/hooks/useEditorSave.js). This registry surgery is
  the fragile core behind T-004/T-005/T-027/T-028.
- Write authorization lives server-side in `isPathAllowed(path, role, allowedDirectories)` and the
  non-owner `modules.js` scoping in
  [admin-github-write/index.ts](../supabase/functions/admin-github-write/index.ts); cross-module move
  is owner-only ([useEditorSave.js:233](../src/hooks/useEditorSave.js#L233)); explicit delete is
  owner-only ([githubApi.js:100](../src/lib/githubApi.js#L100)). RLS must reproduce all of this.
- RLS helper precedent: security-definer owner-check in
  [0017_fix_admin_users_rls.sql](../db/sql/0017_fix_admin_users_rls.sql). Latest tracked migration:
  `0019`.
- `modules.js` holds structural defs (`Icon:` React components, `route:`) that must stay — only
  `notes[]` moves.
- Image orphan tracking scans committed `.md` in GitHub
  ([useEditorSave.js:353-370](../src/hooks/useEditorSave.js#L353-L370),
  [useImageCleanup.js](../src/hooks/useImageCleanup.js)); `image_map` has no tracked migration (ad-hoc,
  like the orphaned `public.drafts` table noted in [0019](../db/sql/0019_admin_note_drafts.sql)).
  Once text lives in Supabase, a GitHub-based scan sees no references and flags everything as orphaned
  — already the symptom in T-002.

## Impact

Removes the registry regex-surgery bug class, makes publishing instant (no rebuild), and moves note
authorization into RLS. The main risk is RLS: direct table writes take authz out of the edge
function, so an incomplete policy would let a contributor write outside `allowed_directories`. Getting
image orphan tracking flipped (phase C) is required or the cleaner flags every live image for deletion
(T-002 footgun).

## Suggested fix (phased, per spec §4–§7, §9)

**Phase A — backend foundation**
- New tracked migration `db/sql/00NN_init_notes.sql` (+ `migrations.yaml` entry):
  `notes(id, module_id, subfolder, slug, title, content_md, updated_at, updated_by)`,
  `unique (module_id, subfolder, slug)`; `admin_can_write_module(p_module_id text)` security-definer
  helper mirroring `isPathAllowed`; policies — public `SELECT`; `INSERT`/`UPDATE` gated by
  `admin_can_write_module(module_id)` with `with check` on the new `module_id`; cross-module
  `module_id` change owner-only; `DELETE` owner-only.
- `scripts/migrate-notes-to-supabase.mjs` — idempotent keyed upsert from `src/content/notes/**/*.md`;
  `title` from the `modules.js` registry label (fallback humanised slug).
- Add a `notes` data-access module (e.g. `src/lib/notesApi.js`): `listNotes`, `getNote`, `upsertNote`,
  `deleteNote`, `renameNote`.

**Phase B — reader + writer cutover (ships as one release)**
- Reader: `NotesPage.jsx` queries `getNote(...)` from the route and renders the unchanged
  `<NoteReader>`; add loading/error/404. Sidebar note list/counts from `listNotes()` grouped by
  `module_id`, joined to the structural `MODULES`. Remove the `import.meta.glob` loader and every
  `notes[]` array from `modules.js` (keep module/tool/icon/route defs).
- Writer: `useEditorSave.handleSave` upserts to `notes` (rename/move = column update; cross-module
  move owner-only via RLS). **Delete** the registry helpers. `useEditorFiles.handleLoadFile` and
  `DirectoryDrawer` read from the DB.
- Toast honesty: a save with new image uploads → "Saved. New images go live after deploy (~1 min).";
  text-only → "Saved." (Optionally show uploaded images from a local blob URL in the editor.)
- "Save to GitHub": explicit optional action committing the `.md` backup via `commitFile`, no
  `modules.js` logic, off the critical path — its failure must not unpublish the note.
- Edge function: remove the `modules.js` scoping/branch (`isScopedModulesJsEdit`, `findModuleBlock`);
  keep image + backup-commit ops.

**Phase C — image orphan tracking**
- Build the referenced-image set by scanning `notes.content_md` for `/notes/img/…`, not GitHub `.md`.
- Adopt `image_map` into a tracked `db/sql/00NN_*.sql` migration (+ manifest entry). Do not ship
  phase B's writer flip without this, or gate the cleaner off until it lands.

## Acceptance criteria

**Phase A**
- [ ] `notes` table + `admin_can_write_module` helper + policies exist as a tracked migration with a
      `migrations.yaml` entry.
- [ ] **Adversarial RLS test passes:** a contributor can write only within `allowed_directories`,
      cannot move a note into a module they don't own, cannot cross-module move unless owner, cannot
      delete; an owner can do all; anon can only `SELECT`.
- [ ] The import script brings every existing note into `notes` (validated by count + rendered
      spot check); re-running is a no-op.

**Phase B**
- [ ] Saving performs one `notes` upsert, no critical-path GitHub commit; the note is live on the next
      reader load with no rebuild.
- [ ] Rename/same-subject move is a single row update (no duplicate rows); cross-module move is
      owner-only.
- [ ] `upsertNoteEntry`/`renameNoteEntry`/`removeNoteEntry`/`findModuleBlock` are deleted; no `notes[]`
      array remains in `modules.js`; icons/routes/tools still work.
- [ ] Reader, sidebar, note-load-for-edit, and admin file tree read from Supabase, with loading/404
      states; the `import.meta.glob` loader is gone.
- [ ] New-image save shows the deploy-lag-honest toast; text-only save shows plain "Saved".
- [ ] "Save to GitHub" writes the `.md` backup off the critical path; its failure leaves the note
      published.
- [ ] `admin-github-write` no longer contains `modules.js` logic; image + backup ops still work.

**Phase C**
- [ ] Orphan tracking computes referenced images from `notes.content_md`; live referenced images are
      never flagged (closes the T-002 class); a genuinely unreferenced image is still detected.
- [ ] `image_map` is a tracked migration.

## References

- [docs/specs/notes-supabase-storage.md](../docs/specs/notes-supabase-storage.md)
- Epic [E-005](../epics/E-005-notes-supabase-storage-migration.md)
- Root-cause fix for [T-002](./T-002-image-cleanup-flags-all-images-orphaned.md)
