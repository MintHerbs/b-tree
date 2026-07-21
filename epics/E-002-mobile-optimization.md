---
id: E-002
title: Mobile phone optimization — public site UI/UX
status: backlog
created: 2026-07-20
---

## Goal

The site was built desktop-first and was never optimized for mobile phone
viewports (~320-430px wide). A 2026-07-20 audit of the public-facing app
(layout shell + all feature pages; `src/pages/admin` and
`src/components/admin` excluded — see Non-goals) found 10 concrete mobile
UX problems, ranging from a missing shared breakpoint system to core
interactive canvases (the B+ Tree visualizer, ERD builder, logic tools)
having no touch pan/zoom support at all. One finding (the split-panel
stacking bug) was folded into another during triage since both traced to
the same file and the same two downstream duplicate pages — see the note
below the checklist.

This epic tracks making the public site usable and comfortable on mobile
phones while keeping the same visual theme as the desktop site (colors,
typography, motion — see [docs/design.md](../docs/design.md) and
[docs/design/](../docs/design/)). This is a mobile-optimization pass, not
a redesign: new/adjusted UI should still read as the same product, just
laid out and sized correctly for a touchscreen.

**UI component sourcing:** for any new or reworked UI element in this
epic, check [animate-ui.com](https://animate-ui.com) first for a
mobile-suited pattern (it already backs `src/components/animate-ui/`); if
it has no solution for the element's mobile need, build it with Tailwind
CSS utility classes instead of one-off hand-rolled CSS. See
[docs/rules.md §5.2](../docs/rules.md) and
[docs/design/components.md](../docs/design/components.md) for the full
rule.

Every finding below was verified by reading the actual code (not
summarized from a report) before being filed.

## Tickets

- [x] T-015 — No shared responsive breakpoint tokens; every component
      hardcodes its own (low)
- [ ] T-016 — Sidebar mobile nav: undersized hamburger hit-test, icons
      shrink instead of grow, tooltip labels lost with no touch
      alternative (medium)
- [ ] T-017 — DynamicIsland has zero responsive handling; music-player
      controls are undersized touch targets (medium)
- [x] T-018 — Navbar silently overflows horizontally instead of wrapping;
      reset button has no touch feedback state (low)
- [ ] T-019 — PageShell layout primitives (sidebar gutter + split-panel)
      have no mobile breakpoints, duplicated across tree/algo pages,
      **plus folded T-020** (same file, same duplicate pages) (high)
- [x] T-021 — Interactive SVG canvases (tree, ERD, tableaux, proof tree)
      support only mouse pan/zoom, no touch gestures (high)
- [ ] T-022 — ERDPage.module.css has zero mobile breakpoints: sidebar
      gutter plus fixed-position step controls that can overlap (medium)
- [ ] T-023 — Tableaux page has zero mobile breakpoints: sidebar gutter,
      fixed step-controls bar, and RulesPanel (medium)
- [ ] T-024 — Social feed post actions (vote/comment/flag) are undersized
      touch targets, repeated on every post card (medium)
- [ ] T-025 — Expanded mobile Sidebar blurs its own nav text via a
      duplicate overlay pseudo-element (medium)

T-020 is `wontfix` as a standalone ticket — folded into T-019 (same
`PageShell.module.css` root cause, plus the same `ComplexityPage`/
`RecurrencePage` duplicate files as the ticket it's folded into). File
kept for history per the tickets convention. Net: 10 issues found from
the original audit, 9 tracked as active work.

## Non-goals

- Not the admin panel (`src/pages/admin/`, `src/components/admin/`) —
  scope for this pass is the public-facing site only. Admin mobile
  optimization would be its own separate epic if ever proposed.
- Not a visual redesign or theme change — colors, typography, and motion
  stay as documented in [docs/design.md](../docs/design.md); this epic is
  about layout, touch interaction, and responsive breakpoints only.
- Not fixing `ResolutionCanvas` (`src/features/logic/components/ResolutionCanvas`)
  — its `index.js` re-exports a file that doesn't exist, so the resolution
  tool is unimplemented/unrouted today. That's a separate bug, not a
  mobile-layout issue, and shouldn't be scoped into this epic by mistake.
- Not native-app or PWA-install work — this is responsive web layout only.

## References

- [docs/rules.md §5.2](../docs/rules.md) — UI component sourcing rule
  (animate-ui.com → Tailwind CSS fallback)
- [docs/design/components.md](../docs/design/components.md) — component
  library policy
