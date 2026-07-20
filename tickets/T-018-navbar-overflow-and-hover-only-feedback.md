---
id: T-018
title: Navbar silently overflows horizontally on narrow screens instead of wrapping; reset button has no touch feedback state
status: done
severity: low
area: layout
epic: E-002
created: 2026-07-20
---

## Summary

`Navbar.module.css` has one existing responsive query but two gaps within
it: the navbar row can scroll horizontally rather than wrap its contents
on narrow screens, and its reset button only defines `:hover`, giving
touch users no visual feedback when pressed.

## Evidence

- `src/components/layout/Navbar/Navbar.module.css:11-13` — `.navbar` sets
  `overflow-x: auto` with no `flex-wrap`.
- `src/components/layout/Navbar/Navbar.module.css:104-121` — the existing
  `@media (max-width: 768px)` reduces padding/title font/gap but doesn't
  address wrapping.
- `src/components/layout/Navbar/Navbar.module.css:38-52` — `.resetButton`
  defines a `:hover` state (~line 50) and no `:active`/`:focus-visible`
  equivalent.

## Impact

If title, reset button, result badge, and the About link all render at
once on a 375px screen, they horizontally scroll rather than wrap —
there's no scrollbar affordance visible by default, so some controls can
be effectively hidden off-screen until a user thinks to swipe the bar
itself. Separately, tapping the reset button gives no visual "pressed"
feedback since only `:hover` (a state touch devices don't produce) is
styled.

## Suggested fix

Add `flex-wrap: wrap` (with appropriate row gap) to `.navbar` at the
existing narrow breakpoint, and add an `:active` style to `.resetButton`
alongside its `:hover`.

## Acceptance criteria

- [x] Navbar contents wrap onto a second row at phone widths instead of
      scrolling horizontally
- [x] Reset button shows a visible pressed state on tap

## Resolution

Added `flex-wrap: wrap` + `row-gap: 8px` to `.navbar` at the existing
768px breakpoint, and `.resetButton:active` alongside its `:hover`. A
self-review caught that `.right` (the control cluster) needed the same
`flex-wrap`/`row-gap` plus `max-width: 100%` — without it, pages with no
title (all content in `.right` alone, e.g. `TableauxPage`'s
`showResult` + `showNewFormula` result view) could still overflow
horizontally since `.right` has `flex-shrink: 0` and wasn't itself
wrap-capable. Both `.left` and `.right` now wrap independently.

