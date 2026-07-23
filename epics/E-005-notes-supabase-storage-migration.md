---
id: E-005
title: Notes storage migration to Supabase — instant publish, GitHub as image store & backup
status: backlog
created: 2026-07-23
---

## Goal

Note content is currently **build-time static content**: the public site loads notes with
`import.meta.glob('../../content/notes/**/*.md', { query: '?raw' })`
(`src/pages/notes/NotesPage.jsx`), so Vite bakes every `.md` into the bundle, and the sidebar reads a
hand-maintained registry (`src/components/layout/Sidebar/modules.js`). As a result, a single "save"
(`src/hooks/useEditorSave.js`) must commit the `.md` to GitHub, **regex-rewrite `modules.js`** to
update the registry (`upsertNoteEntry`/`renameNoteEntry`/`removeNoteEntry`), commit that too with
409-SHA retries, and then wait for a Vercel rebuild before the note is live. Editing source code as
data is the fragile heart of it, and a class of open bugs is downstream of it (T-002, T-004, T-005,
T-027, T-028).

This epic moves **note text** into a Supabase `notes` table so it becomes **runtime content**: the
sidebar and reader query the table, a save is a single row upsert, and the note is live on the next
page load with **no rebuild**. Images deliberately stay in GitHub (served static); `modules.js` keeps
its module/tool/icon/route definitions (icons are React components) and loses only its content
`notes[]` arrays; GitHub keeps an optional, stale-tolerant `.md` backup via an explicit "Save to
GitHub" action.

Full requirements, current-state analysis, RLS design and acceptance criteria:
[docs/specs/notes-supabase-storage.md](../docs/specs/notes-supabase-storage.md).

Locked decisions (confirmed with the owner): (1) **Supabase is the source of truth for note
content**; (2) **images stay in GitHub**, accepting a deploy-lag window on *new* images only;
(3) **GitHub `.md` is an optional backup**, not the save path; (4) **`modules.js` keeps its
structural defs**, only `notes[]` arrays move.

## Tickets

- [ ] T-043 — Migrate note content to Supabase in one cutover: schema + RLS + import (phase A), reader + writer flip (phase B), image orphan tracking (phase C)

Consolidated 2026-07-23 to a **single ticket** at the owner's request (minimum ticket count). An
initial 4-ticket breakdown (schema/RLS/import; reader; writer; image tracking) was folded into
T-043's three internal phases before any work began. IDs **T-044–T-046 are retired and not reused**.
The phase structure and per-phase acceptance live in T-043; the full design is in the spec.

## Non-goals

- Not moving images off GitHub. They stay in `public/notes/img/<module-id>/`, served static.
  Supabase Storage for images would be a separate future pass.
- Not retiring `modules.js`. Module/tool/icon/route definitions stay in code; only the content
  `notes[]` arrays leave.
- Not changing note rendering. `NoteReader`/`MarkdownRenderer` are untouched — only the source of the
  `content` string changes.
- Not changing the WYSIWYG authoring UX (E-004). This is a storage-backend change; the editor still
  emits a Markdown string. The two compose cleanly.
- Not collaborative editing, comments, or server-side version history (the GitHub backup is the only,
  best-effort, history mechanism).

## Relationship to other work

- Supersedes E-001's deferred non-goal (a storage-backend migration "would be its own separate epic
  if ever proposed").
- Fixes the root cause of T-002 via T-046.
- Orthogonal to and composes with E-004; does not touch `admin_note_drafts` (T-032/T-033).
