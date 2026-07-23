---
id: E-006
title: Admin panel Drive-style navigation, delete lockdown, hide & autosave
status: backlog
created: 2026-07-23
---

## Goal

Replace the admin panel's editor-first landing page with a Google-Drive-style drill-down browser
(Subjects → module folders → files), styled in Material You, so an admin can navigate to what they
want to edit before writing rather than opening a slide-in directory drawer first. Alongside the
navigation rework: lock destructive deletes (subject/folder/file) to one specific account
(`moon@mooner.dev`) rather than the whole `owner` role, add a DB-backed "hide from live site" toggle,
and simplify the editor's recovery-draft autosave to a flat 10-second interval.

Full design, current-architecture analysis, data model, and open questions:
[docs/specs/admin-drive-navigation.md](../docs/specs/admin-drive-navigation.md).

Builds directly on E-005 (notes/folders already live in Supabase, instant writes) — this epic is UI,
permissions, and one new visibility flag on top of that data model, not a further storage change. It
also touches the delete-permission surface E-001 hardened, tightening it further rather than
re-opening it.

## Tickets

- [ ] T-045 — Admin Drive-style navigation (Material You), delete lockdown, hide toggle, and flat
      autosave — one ticket, four internal phases (A: `AdminBrowser` + editor chrome cleanup; B:
      delete lockdown to `moon@mooner.dev`; C: hide toggle; D: flat 10-second autosave)

Originally filed as four tickets (T-045 navigation, T-046 delete lockdown, T-047 hide, T-048 autosave),
then folded into T-045's four phases at the owner's request to keep the ticket count down, the same
consolidation pattern E-005 used for T-043. **T-046–T-048 are retired and not reused.**

**Ordering:** phase A is the foundation the phase B/C menu items attach to, so their UI halves land
easiest after A merges — but B/C's schema/RLS work has no dependency on A and can be built in parallel.
Phase D is fully independent (only touches `useEditorDrafts.js`) and can ship anytime. See
[docs/specs/admin-drive-navigation.md §11](../docs/specs/admin-drive-navigation.md#11-open-questions-to-confirm-before-implementation)
for the five decisions to confirm with the owner before any phase starts.

## Non-goals

- Not moving Subjects (`modules.js` entries) into the database — they keep their code-defined
  `Icon`/`route`, and subject create/rename/delete stays a GitHub commit with the existing deploy-lag
  toast. Reaffirms the same E-005 non-goal.
- Not changing note content, rendering, or the WYSIWYG editor (E-004) — only the chrome around it and
  how an admin arrives at it.
- Not changing the owner/contributor role model or `allowed_directories` scoping — T-046 adds one
  additional, narrower gate on top of it for delete specifically; it doesn't replace it.
- Not restyling the rest of the admin panel (`UsersDrawer`, `ImageCleanupDrawer`, modals) in Material
  You — M3 scope is `AdminBrowser` only, matching how M3 was first scoped to just `ui/Card` on the
  public site. A full admin-panel M3 pass would be its own future epic.
- Not auto-publishing notes on a timer — T-048 is a recovery-draft cadence change only; `handleSave`
  stays the only publish path. See the spec §8 for why this reading was chosen over the alternative.
