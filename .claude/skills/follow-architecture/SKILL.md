---
name: follow-architecture
description: Use before any non-trivial structural work in this project — adding/moving files, refactoring, new features, design questions, "where does this go?" decisions. Loads the canonical architecture, design, and rules docs so decisions match the documented target instead of guessing from current code.
---

# Follow the project's architecture and documentation

Before structural decisions, load context from the canonical docs. They are the source of truth — the current tree may not yet match them (the migration in [docs/architecture-update.md](../../../docs/architecture-update.md) §7 is phased), and guessing from `ls` will lock in stale patterns.

## Where to look first

| If the question is… | Read… |
|---|---|
| Where should a new file go? | [docs/architecture-update.md](../../../docs/architecture-update.md) §2 *Target structure*, §3 *Organising principles* |
| What exists in the codebase today? | [docs/documentation.md](../../../docs/documentation.md) |
| What colors / fonts / tokens? | [docs/design.md](../../../docs/design.md) |
| What coding conventions and component structure? | [docs/rules.md](../../../docs/rules.md) |
| What's the spec for a specific feature? | [docs/specs/](../../../docs/specs/) — see `complexity.md`, `logic-tools.md`, `presence-and-music.md` |
| How do I run X / rotate Y / migrate Z? | [docs/runbooks/](../../../docs/runbooks/) |

When the user asks for "the docs", these are the docs.

## Non-negotiable conventions

These come from the docs above. The full reasoning is there — this is a checklist, not the explanation.

- **JavaScript only.** No `.tsx` lands in `src/`. The three `.tsx` files in `src/components/smoothui/` are pending a port to `.jsx` — don't add more. ([architecture-update.md §3.5](../../../docs/architecture-update.md))
- **CSS Modules.** Every component has `<Name>.module.css` alongside it. No global stylesheets outside [src/styles/global.css](../../../src/styles/global.css). ([rules.md](../../../docs/rules.md))
- **Feature-first organisation.** Code that belongs to one feature lives under `src/features/<feature>/{components,hooks,lib,engine}/`, not in flat `src/components/`. Shared UI splits into `src/components/{ui,layout,effects}/`. ([architecture-update.md §3.2–3.3](../../../docs/architecture-update.md))
- **Server boundary.** Anything that needs a secret or enforces a quota the user must not bypass lives in `/api/` (Vercel function), not `src/`. Every `VITE_*` env var ships to the client — treat them as public. ([architecture-update.md §3.1](../../../docs/architecture-update.md))
- **Database schema.** Lives in [db/sql/](../../../db/) with a `migrations.yaml` manifest as the ordering authority — not as ad-hoc SQL files at the repo root. ([architecture-update.md §4](../../../docs/architecture-update.md))
- **Naming.** PascalCase component folders and files, `camelCase` lib/engine files, `useCamelCase.js` hooks. Folder names that are buckets (`components/`, `lib/api/`) are lowercase. ([architecture-update.md §3.4](../../../docs/architecture-update.md), [rules.md §2](../../../docs/rules.md))
- **Documentation goes in `docs/`.** Never at the repo root. See the `place-doc` skill for the exact sub-folder.
- **Colors come from tokens.** Use the CSS variables in [docs/design.md](../../../docs/design.md). No new raw hex values for new components.

## When the doc and reality disagree

[docs/architecture-update.md](../../../docs/architecture-update.md) is the **target**, not the current state. The migration is phased and most of the source tree has not yet moved. Before assuming the new layout, check:

```bash
ls src/features/        # exists?
ls src/components/      # still flat?
git log --oneline -- <path>   # what's the recent history here?
```

If the area you're touching hasn't migrated yet, do not unilaterally migrate it — that's its own PR per §7 *Migration plan*. Touch it in place and follow the existing convention nearby.

## Active issues to be aware of

[docs/architecture-update.md §6](../../../docs/architecture-update.md) maps each open GitHub issue to a part of the structure. When work intersects an issue (e.g. anything touching `geminiService.js` is issue #12), check it first:

```bash
gh issue view <number>
```

New issues should follow the `create-lt-issue` skill so they get a unique `LT-NNN` ID.
