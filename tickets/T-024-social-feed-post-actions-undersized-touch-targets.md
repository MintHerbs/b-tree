---
id: T-024
title: Social feed post actions (vote/comment/flag) are undersized touch targets, repeated on every post card
status: done
severity: medium
area: social
epic: E-002
created: 2026-07-20
---

## Summary

`PostActions`' vote, comment, and flag pills are roughly 28–32px tall,
below the ~44px minimum touch target generally recommended for mobile UI
(WCAG 2.5.5, and Apple/Material platform guidance). This renders once per
post card, so it's the single most-repeated undersized touch target in
the app — it multiplies by however many posts are in the feed.

## Evidence

- `src/components/social/PostActions/PostActions.module.css:8-126` —
  `.votePill`, `.commentPill`, `.flagPill` are ~28–32px tall with
  `padding: 6px`.

## Impact

On a phone feed with many posts, every single card carries three
sub-minimum-size tap targets sitting close together — increasing
mis-tap/rage-tap rate specifically on the primary engagement actions
(voting and commenting) of the social feed.

## Suggested fix

Increase the pills' effective hit area toward ~44px (via padding, not
necessarily visual size) — e.g. `min-height`/`min-width` on the pill with
the icon+count centered inside, rather than shrinking padding to fit
content tightly.

## Acceptance criteria

- [x] Vote/comment/flag pills have an effective touch target close to the
      ~44px recommended minimum on mobile viewports

