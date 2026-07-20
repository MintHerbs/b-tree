---
id: T-013
title: FormattingToolbar.jsx is dead code
status: done
severity: low
area: admin
epic: E-001
created: 2026-07-19
---

## Summary

`src/components/admin/FormattingToolbar.jsx` is a 3-line component that
renders `null` and is not imported anywhere in `src/`. `EditorNavbar.jsx`
implements the formatting buttons directly instead.

## Evidence

- `src/components/admin/FormattingToolbar.jsx` — full contents:
  `export default function FormattingToolbar() { return null }`.
- Confirmed via grep across `src/`: no import of `FormattingToolbar`
  exists anywhere.

## Impact

No functional impact — this is unused code, not a bug. Filed for
cleanup/tracking rather than left as a silent surprise for the next
person who finds it and wonders if it's wired up somewhere non-obvious.

## Suggested fix

Delete `src/components/admin/FormattingToolbar.jsx` and its
`FormattingToolbar.module.css` sibling.

## Acceptance criteria

- [x] File and its CSS module are removed.
- [x] Build and admin editor continue to work unchanged (nothing referenced it).

## References

- `src/components/admin/EditorNavbar.jsx` — where formatting buttons actually live
