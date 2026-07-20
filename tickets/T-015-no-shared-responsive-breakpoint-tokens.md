---
id: T-015
title: No shared responsive breakpoint tokens — every component hardcodes its own
status: done
severity: low
area: infra
epic: E-002
created: 2026-07-20
---

## Summary

`src/styles/global.css` defines color/spacing/typography tokens but no
`--breakpoint-*` variables or shared media-query pattern. Every component
that has any responsive CSS today hardcodes its own raw pixel breakpoint
independently, and the values disagree across the app (`968px`, `768px`,
`640px`, `480px` all appear as one-off choices in different files).

## Evidence

- `src/styles/global.css` — 74 lines, tokens only (color/spacing/type), no
  breakpoint variables.
- `src/components/layout/Sidebar/Sidebar.jsx` — mobile detection via a
  hardcoded `window.innerWidth <= 968` check.
- `src/components/layout/Navbar/Navbar.module.css:104` — `@media
  (max-width: 768px)`.
- `src/components/social/ChatPanel/ChatPanel.module.css` (~line 118) —
  `@media (max-width: 640px)`.
- `src/components/layout/Sidebar/NavChildIcon.module.css:60-83` /
  `NavGroupIcon.module.css:83-110` — `@media (max-width: 640px)` with a
  different shrink behavior than its sibling files.
- Repo-wide: 32 of 82 non-admin CSS module files contain `@media` at all,
  each with its own breakpoint choice.

## Impact

Every new mobile fix in this epic risks picking yet another
one-off breakpoint value, making the responsive behavior inconsistent
page-to-page (one page stacks at 768px, another at 640px) and harder to
maintain — there's no single place to change "what counts as mobile" for
the whole app.

## Suggested fix

Add a small set of shared breakpoint values (CSS custom media / documented
constants, matching whatever the project's CSS Modules + PostCSS setup
supports) to `src/styles/global.css`, and have new/updated components in
this epic reference them instead of inventing new pixel values.

## Acceptance criteria

- [x] A documented, shared breakpoint convention exists (e.g. tokens or a
      documented standard set of pixel values) that new mobile work in
      this epic follows
- [x] `docs/design.md` or `docs/design/` records the convention so future
      components reuse it

