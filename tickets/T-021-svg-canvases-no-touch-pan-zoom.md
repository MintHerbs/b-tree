---
id: T-021
title: Interactive SVG canvases (tree, ERD, tableaux, proof tree) support only mouse pan/zoom, no touch gestures
status: done
severity: high
area: tree, erd, logic
epic: E-002
created: 2026-07-20
---

## Summary

The app's core interactive visualizations — the B+ Tree canvas, ERD
canvas, and the logic tools' tableaux/proof-tree canvases — implement pan
and zoom exclusively via `onMouseDown`/`onMouseMove`/`onWheel` handlers.
None wire touch equivalents (`onTouchStart`/`onTouchMove`) or set
`touch-action`, so there is no way to pan or zoom these diagrams using
native phone touch gestures.

## Evidence

- `src/features/tree/components/TreeCanvas/TreeCanvas.jsx:23-98` — pan/zoom
  logic wired to mouse and wheel events only.
- `src/features/erd/components/ERDCanvas/ERDCanvas.jsx:145-279` — pan,
  node-drag, and zoom all wired to mouse/wheel events only (node
  repositioning has no touch equivalent at all).
- `src/features/logic/components/TableauxCanvas/TableauxCanvas.jsx:334-377`
  — same mouse/wheel-only pattern.
- `src/features/logic/components/ProofTreeCanvas/ProofTreeCanvas.jsx` —
  same pattern.
- `src/features/recurrence/components/RecurrenceTreeView/RecurrenceTreeView.jsx`
  — has on-screen zoom buttons as a partial mitigation, but pan is still
  mouse-drag only.

## Impact

On a phone, none of these canvases can be panned or zoomed via
pinch/drag — the core teaching tool of the site (the B+ Tree visualizer)
and its sibling diagrams (ERD, tableaux, proof tree) are effectively
inert for any content that extends beyond the initial viewport, since the
only interaction path implemented is mouse-based.

## Suggested fix

Add touch event handlers (single-finger drag → pan, two-finger pinch →
zoom) alongside the existing mouse/wheel handlers in each canvas, sharing
the same underlying pan/zoom state update functions where possible.

## Acceptance criteria

- [x] TreeCanvas, ERDCanvas, TableauxCanvas, and ProofTreeCanvas can be
      panned via single-finger touch drag
- [x] The same canvases can be zoomed via pinch gesture (or an equivalent
      on-screen control, consistent with what RecurrenceTreeView already
      does)

## Resolution

Added touch handlers (single-finger drag → pan, two-finger pinch → zoom)
alongside the existing mouse/wheel handlers in all four canvases, plus
`touch-action: none` on each canvas so the browser doesn't intercept the
gesture natively. ERDCanvas and ProofTreeCanvas also got a touch
equivalent for their existing mouse-only node-dragging, since leaving
that mouse-only would have left those two tools partly unusable on
mobile even after fixing pan/zoom. Shared pinch-distance/midpoint math
lives in `src/lib/touchGestures.js`. Verified live with Playwright +
headless Chromium (real `TouchEvent` dispatch, not just a build check)
against all four canvases: pan, pinch-zoom, and node-drag where
applicable, with a self-review pass afterward that caught and fixed a
stale-closure pan bug in TableauxCanvas/ProofTreeCanvas, a stale pinch
anchor point in TreeCanvas/ERDCanvas, and a multi-touch node-drag
hijack edge case.

