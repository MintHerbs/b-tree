---
id: T-026
title: ERDPage step content can overflow erdMain's fixed 100vh height and get silently clipped by erdPage's overflow:hidden
status: backlog
severity: low
area: erd
epic: E-002
created: 2026-07-21
---

## Summary

`.erdMain` centers its content vertically inside a fixed `100vh` box with
no scroll affordance, and its parent `.erdPage` has `overflow: hidden`.
When a step's content is taller than the viewport, the excess is clipped
equally off the top and bottom instead of becoming reachable — and any
top-anchored control (e.g. the `.previousButton` fixed at narrow widths
in [T-022](T-022-erd-fixed-position-controls-no-mobile-layout.md)) can
still visually collide with whatever clipped content spills into view.

## Evidence

- `src/pages/erd/ERDPage.module.css:3-9` — `.erdPage { overflow: hidden;
  height: 100vh; ... }`.
- `src/pages/erd/ERDPage.module.css:11-25` — `.erdMain { position: fixed;
  height: 100vh; display: flex; flex-direction: column; justify-content:
  center; ... }` — content taller than the viewport is centered and
  overflows equally above and below, with no scroll on either ancestor.
- Reproduced with headless Chromium at a 375x667 viewport (iPhone
  SE-class): after submitting ERDStep1, ERDStep2's instruction paragraph
  is already clipped/overflowing above the viewport top edge before any
  button is considered. Confirmed pre-existing (not introduced by
  T-022's fix) by stashing the T-022 CSS changes and reproducing the
  same clipping against the unmodified baseline.
- At a 390x844 viewport (iPhone 12/13-class, ~177px taller) the same
  step's content only marginally touches the repositioned
  `.previousButton` from T-022 — much less severe, consistent with the
  root cause being available vertical space rather than the button's
  exact offset.

## Impact

On short-viewport phones, `ERDStep2` (and potentially `ERDStep3` /
`ERDCanvas` with larger content) can render with its top content cut off
entirely — unreachable, since neither `.erdPage` nor `.erdMain` scrolls —
and any fixed-position control near the top of the page can overlap
whatever spills into the visible band. This is a different, deeper root
cause than T-022's horizontal button-crowding issue: no amount of
retuning a control's `top`/`left`/`right` offset fixes it, because the
overflowing region grows with content length and viewport shortness.

## Suggested fix

Let `.erdMain` scroll instead of clipping on short viewports — e.g.
`overflow-y: auto` plus switching `justify-content: center` to
`flex-start` with top/bottom padding at narrow/short breakpoints — so
tall step content becomes reachable by scrolling instead of being cut
off.

## Acceptance criteria

- [ ] No step's content is clipped/unreachable at common short-viewport
      phone heights (e.g. 375x667)
- [ ] Tall content becomes scrollable rather than silently cut off by
      `overflow: hidden`

## References

- [T-022](T-022-erd-fixed-position-controls-no-mobile-layout.md) —
  discovered while self-reviewing/verifying that ticket's fix in a
  real browser
