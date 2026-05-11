---
name: place-doc
description: Use whenever you create, move, or rename a documentation file (*.md, *.mdx) in this project. Decides the correct docs/* sub-folder so docs land in a well-categorised location and never at the repo root.
---

# Place documentation in the right docs/ folder

Every documentation file in this project belongs somewhere under [docs/](../../../docs/). Root-level `*.md` is forbidden except for `README.md`, `CONTRIBUTING.md`, `LICENSE.md`, and `SECURITY.md`. This rule was the reason we did the May-2026 root cleanup — don't undo it.

## Current docs/ layout

| Path | Purpose |
|---|---|
| [docs/architecture-update.md](../../../docs/architecture-update.md) | Target architecture — read-only reference, do not duplicate |
| [docs/documentation.md](../../../docs/documentation.md) | Single source of truth for **what exists in the codebase today** — extend this rather than writing a parallel doc |
| [docs/design.md](../../../docs/design.md) | Design tokens (colors, typography, layout, animation) |
| [docs/rules.md](../../../docs/rules.md) | Mandatory coding standards |
| [docs/architecture/](../../../docs/architecture/) | System-level architecture: overview, data-flow, routing, state |
| [docs/adr/](../../../docs/adr/) | Architecture Decision Records — one per major choice, numbered `0001-...md` |
| [docs/specs/](../../../docs/specs/) | Feature specifications (input to implementation) |
| [docs/runbooks/](../../../docs/runbooks/) | Operational procedures (deploy, rotate keys, restore, migrations) |
| [docs/features/](../../../docs/features/) | Architecture/usage docs for **shipped** features (create folder if needed) |

## Decision tree

| The new doc is about… | Put it in… |
|---|---|
| A design choice or trade-off with rationale | `docs/adr/NNNN-<topic>.md` (next free 4-digit number) |
| A system overview, data flow, or how-to-add-X | `docs/architecture/<topic>.md` |
| A **planned or new** feature's requirements / behaviour | `docs/specs/<feature>.md` |
| An **operational** procedure (deploy, rotate, restore, migrate) | `docs/runbooks/<procedure>.md` |
| Architecture or usage of an **already-shipped** feature | `docs/features/<feature>.md` |
| A cross-cutting standard (design, rules, contributing) | `docs/<topic>.md` |
| Reference of what's currently in the code | **Update [docs/documentation.md](../../../docs/documentation.md) — do not create a new file** |

## Naming

- Use `lowercase-with-dashes.md`, never `SCREAMING_SNAKE_CASE.md` (e.g. `rotate-keys.md`, not `ROTATE_KEYS.md`).
- ADR files are numbered: `0001-vite-no-ssr.md`, `0002-css-modules.md`, …
- Spec files name the feature: `complexity.md`, `logic-tools.md`.

## Forbidden patterns (this is what we just cleaned up)

- ❌ Root-level `*.md` (except the four conventional files listed above)
- ❌ Implementation diary notes — `FIX_*.md`, `*_REIMPLEMENTED.md`, `REFACTOR_COMPLETE.md`, `CLEANUP_NOTES.md`, `FINAL_*.md`
- ❌ "Summary of what I did today" — that belongs in the commit message or PR body
- ❌ Duplicating chunks of [docs/documentation.md](../../../docs/documentation.md) into a new file — extend the source of truth instead

## Before creating a doc

1. Search existing docs first (`docs/` is small — read it). If something covers 70%+ of the new content, extend it.
2. If the right category is ambiguous, ask the user before creating the file.
3. After creating, if it's an enduring reference, add a one-line pointer in [docs/documentation.md](../../../docs/documentation.md) so it's discoverable.
