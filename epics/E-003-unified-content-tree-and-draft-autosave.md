---
id: E-003
title: Admin editor — unified content tree + Supabase draft autosave
status: backlog
created: 2026-07-22
---

## Goal

Two related admin-panel UX changes, proposed together because they both
touch the same "how content moves from typing to published" flow:

1. Replace the admin editor's two disjoint tree modes ("Files" for
   picking a destination to create a new note, "Edit Files" for browsing
   and opening existing ones) with a single tree: browse subjects and
   folders, click a file to open/edit it, and create a new file directly
   from a "+" on the folder you're already looking at. Rename stays
   available to any admin on their own scope; delete becomes explicitly
   owner-only (currently the entire rename/delete menu is owner-only,
   which also blocks contributors from renaming their own notes).
2. Add a Supabase-backed autosave layer under the editor so in-progress
   work survives a reload/crash/lost tab without ever touching GitHub or
   the live site — only the existing explicit Save button/Ctrl+S
   publishes. Today there is zero persistence between keystrokes and that
   Save call; a crashed tab loses everything except the `beforeunload`
   warning.

## Tickets

- [x] T-031 — Unify Files/Edit Files into one tree; add create-file-in-folder; split rename (any admin) from delete (owner-only)
- [ ] T-032 — Add a tracked, purpose-built drafts table + migration for per-note autosave
- [ ] T-033 — Wire debounced autosave, restore-on-load, and clear-on-publish (depends on T-032)
- [ ] T-034 — Rename a subject or file by clicking directly on its name

## Non-goals

- Not real-time multi-user collaborative editing — drafts are private,
  single-user scratch space (same RLS shape as the existing orphaned
  `drafts` table: `auth.uid() = user_id` only).
- Not a rework of the editor's formatting/visual toolchain (Monaco,
  markdown formatting, image handling) — those are unaffected.
- Not a fix for [E-001](E-001-admin-panel-hardening.md)'s still-open
  items — that epic's own tickets track those; this epic assumes E-001's
  DirectoryDrawer/save-path work as currently shipped on `main`.
- Not a decision on the existing orphaned `public.drafts` table (no
  tracked migration, no code references, schema shape doesn't cleanly fit
  one-draft-per-file). T-032 leaves it alone; dropping it is a separate,
  explicit call for whoever owns that data.
