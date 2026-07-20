---
id: T-025
title: Expanded mobile Sidebar blurs its own nav text via a duplicate overlay pseudo-element
status: backlog
severity: medium
area: layout
epic: E-002
created: 2026-07-21
---

## Summary

When the Sidebar is expanded on a mobile viewport, its own nav labels and
icons render visibly blurred/illegible. This is caused by a leftover,
duplicate overlay mechanism in CSS that stacks on top of the sidebar's
own content instead of only dimming the page behind it.

## Evidence

- `src/components/layout/Sidebar/Sidebar.jsx:73-87` — the correct overlay:
  a `position: fixed`, `z-index: 59`, `backdropFilter: blur(2px)` `<div>`
  rendered as a **sibling** of `<aside>` (React fragment), gated on
  `isMobile && isExpanded`. `.sidebar` itself has `z-index: 60`
  (`Sidebar.module.css:12`), so this overlay correctly sits behind the
  sidebar and only blurs the page content, not the sidebar.
- `src/components/layout/Sidebar/Sidebar.module.css:81-92` — a second,
  duplicate overlay: `.sidebar.sidebarExpanded::before`, also
  `position: fixed`, full-viewport, `z-index: 59`,
  `backdrop-filter: blur(2px)`. This one is a **pseudo-element generated
  inside `.sidebar` itself**, not a sibling.
- Root cause: per CSS painting order (CSS2.1 Appendix E), positioned
  descendants with a non-auto `z-index` paint in the "positioned
  descendants" bucket, which comes *after* normal in-flow, non-positioned
  content — regardless of DOM/generated-content order. Because this
  `::before` has `position: fixed` + `z-index: 59`, it paints **on top
  of** the sidebar's own normal-flow children (the `ExpandedView` nav
  list, which has no explicit position/z-index), even though `::before`
  is nominally "before" them in generated-content order. The result: the
  pseudo-element's full-viewport blur backdrop composites over the
  sidebar's own text/icons.

## Impact

Every time a user expands the sidebar on a mobile viewport (≤968px, the
`--breakpoint-xl` cutoff), the nav module list (Algorithms, Artificial
Intelligence, Database, etc.) renders with a frosted/blurred look,
making the primary navigation hard to read. The JSX-rendered overlay
already provides the intended dim-behind-sidebar effect correctly, so
this CSS rule is redundant on top of being buggy.

## Suggested fix

Delete the `.sidebar.sidebarExpanded::before` rule
(`Sidebar.module.css:81-92`, including its `/* Overlay when sidebar is
open */` comment) — it's dead/duplicate code superseded by the working
overlay `<div>` in `Sidebar.jsx`. No JS changes needed.

## Acceptance criteria

- [ ] Expanding the Sidebar on a mobile viewport shows crisp, unblurred
      nav text/icons
- [ ] Tapping outside the expanded sidebar (on the dimmed backdrop)
      still closes it, unchanged

## References

- T-016 — prior Sidebar mobile-nav ticket (hamburger hit-test, icon
  labels); this is a separate, previously-undiscovered issue in the same
  component.
