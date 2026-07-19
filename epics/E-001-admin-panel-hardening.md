---
id: E-001
title: Admin panel hardening — security, data-integrity, and UX correctness
status: backlog
created: 2026-07-19
---

## Goal

A 2026-07-19 audit of the admin CMS (`src/pages/admin/`,
`src/components/admin/`, `src/hooks/useEditor*.js`, `src/hooks/useImageCleanup.js`,
`src/lib/githubApi.js`, `supabase/functions/admin-*`,
`db/sql/0016_init_admin_users.sql`) found 13 issues ranging from a
critical client-side secret exposure to small UX-correctness bugs. This
epic tracks fixing all of them so the admin panel's stated security model
(owner vs. contributor, directory-scoped permissions) is actually
enforced, and so destructive actions (image cleanup, module/subfolder
deletion, file moves) do what their confirmation dialogs claim.

Every finding below was verified by reading the actual code (not just
summarized from a report) before being filed.

## Tickets

- [ ] T-001 — GitHub write token shipped to the browser; contributor directory restrictions unenforced server-side (critical) — code landed on main, pending Edge Function deploy + live verification
- [ ] T-002 — Image Cleanup flags every live image as orphaned and pre-selects it for deletion (high)
- [ ] T-003 — Password change has no re-authentication and doesn't invalidate other sessions (high)
- [x] T-004 — Rename/Delete subfolder are no-op stubs that report false success (high)
- [ ] T-005 — Move file duplicates content instead of moving it, and never updates the module registry (high)
- [x] T-006 — Self-referential RLS policy on admin_users risks recursion error / full admin lockout, **plus folded T-009** (anon SELECT grant, same table/migration) (medium)
- [ ] T-007 — Admin "Sign Out" throws a ReferenceError and never signs the user out (medium)
- [ ] T-008 — Unsanitized href in Social Link modal allows stored XSS via javascript: URLs, **plus folded T-010** (inconsistent attribute escaping, same component) (medium)
- [ ] T-011 — Ctrl+S bypasses the in-flight save guard the Save button enforces (low)
- [ ] T-012 — Deleting a module orphans its note/image files despite confirmation text claiming removal (low)
- [ ] T-013 — FormattingToolbar.jsx is dead code (informational cleanup)

T-009 and T-010 are `wontfix` as standalone tickets — folded into T-006 and
T-008 respectively (same file/table/component as the ticket they're
folded into; see each folded ticket for why). Files kept for history per
the tickets convention. Net: 13 issues found, 11 tracked as active work.

## Non-goals

- Not a redesign of the admin UI or its visual language — this is
  correctness/security only. See [docs/design/](../docs/design/) for
  anything about how the admin panel should *look*.
- Not a migration off the GitHub Contents API to a different storage
  backend — T-001's fix should keep the current architecture (Vercel
  proxy enforcing auth), not replace it. A full backend migration would
  be its own separate epic if ever proposed.
- Not a full penetration test of the rest of the app — scope was the
  admin feature only, per the request that produced this audit.
