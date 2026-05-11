---
name: create-lt-issue
description: Use whenever you create a GitHub issue in this project. Computes the next unique LT-NNN identifier by scanning all existing issues, prepends it to the title (format `LT-NNN: <title>`), and creates the issue via gh CLI. Required for every human-authored issue.
---

# Create a GitHub issue with a unique `LT-NNN` ID

Every human-authored issue in this repo carries a unique tracking ID at the front of its title: `LT-001`, `LT-042`, `LT-128`, … The ID is permanent, three-digit zero-padded, and never reused — even for closed or deleted issues. Bot-authored issues (Dependabot, Renovate, etc.) are exempt.

## Step 1 — Find the next free LT- number

Scan **all** issues (open + closed) for existing `LT-NNN` tokens in titles and pick `max + 1`:

```bash
NEXT=$(gh issue list --state all --limit 1000 --search "LT-" --json title \
  --jq '[.[].title | scan("LT-[0-9]+") | gsub("LT-"; "") | tonumber] | max // 0' )
NEXT=$((NEXT + 1))
ID=$(printf "LT-%03d" "$NEXT")
echo "Next ID: $ID"
```

Notes:
- `--state all` is mandatory — closed issues still occupy their ID.
- `--limit 1000` covers any realistic repo size; bump if `gh` warns about truncation.
- If the repo has zero `LT-`-tagged issues, `max // 0` returns 0 and you get `LT-001`.
- **Batch creation:** if you're creating multiple issues in one go, increment `NEXT` locally between creations — do not re-run the scan, because the previously-created issue may not be indexed yet.

## Step 2 — Verify uniqueness before creating

Belt-and-braces — confirm no other issue already has the chosen ID:

```bash
EXISTING=$(gh issue list --state all --search "$ID" --json title --jq '[.[].title | select(test("\\b'"$ID"'\\b"))] | length')
if [ "$EXISTING" -ne 0 ]; then
  echo "Collision: $ID is taken — recompute"
  exit 1
fi
```

If a collision shows up, re-run Step 1. (This shouldn't happen unless someone created an issue manually without the skill.)

## Step 3 — Create the issue

```bash
gh issue create \
  --title "$ID: <short imperative description>" \
  --body "$(cat <<'EOF'
## Context
<why this issue exists — what problem, what user, what doc>

## Scope
<what's in / what's out>

## Acceptance
- [ ] <observable outcome 1>
- [ ] <observable outcome 2>

## References
- docs/<relevant-doc>.md §<section>
- Related: #<issue-number> (if any)
EOF
)"
```

Add labels/assignees inline if needed:

```bash
gh issue create --title "$ID: ..." --body "..." \
  --label "type:feature" --label "area:tree" --assignee "@me"
```

## Title format — exact rules

- **Prefix:** `LT-` + three-digit zero-padded integer.
- **Separator:** colon + single space. `LT-007: ` not `LT-007 -` or `[LT-007]`.
- **Body of title:** short, imperative, fits in ~60 chars after the prefix.

| ✅ Good | ❌ Bad |
|---|---|
| `LT-001: Move Gemini call into /api proxy` | `[LT-001] Move Gemini call into /api proxy` |
| `LT-042: File-system routing via vite-plugin-pages` | `LT42: file system routing` |
| `LT-007: Test infra (Vitest + RTL + CI)` | `Add tests (LT-7)` |

## Linking from architecture-update.md

When a new issue resolves something the architecture doc references, update [docs/architecture-update.md](../../../docs/architecture-update.md) §6 (Resolving open issues) to add a row for the new `LT-NNN`. Conversely, when filing an issue **about** an architecture-doc bullet, link the section in the issue body so the doc stays the source of truth.

## When NOT to invent an LT ID

- **Bot issues** (Dependabot, Renovate, security advisories) — leave their titles alone.
- **Comments** on an existing issue — only the issue *title* gets a prefix.
- **Pull requests** — PRs get their own numbering from GitHub; reference issue IDs in the PR body (`Closes LT-042`).
