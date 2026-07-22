# ADR 0001 — WYSIWYG editor library for the notes editor (T-036, Task 0 spike)

**Status:** Accepted (spike passed)
**Date:** 2026-07-23
**Ticket:** T-036 — WYSIWYG editor foundation
**Epic:** E-004 — Notes authoring & reading overhaul
**Spec:** [docs/specs/notes-wysiwyg-and-reader.md](../specs/notes-wysiwyg-and-reader.md) §6.1

## Decision

Use **Milkdown `7.21.3`** (ProseMirror + remark) as the WYSIWYG editor that replaces
the Monaco source editor. The time-boxed round-trip spike passed against the Q2/Q3
guardrails, so the migration may proceed.

## Context

Notes are stored as plain Markdown committed to GitHub; the editor must round-trip
Markdown losslessly, including the app's custom constructs (block/inline math,
fenced code, `![](…)` images incl. the `draft://` scheme, and the `<RichPopover … />`
social-link chip). A lossy round-trip would silently corrupt notes on save, so the
library choice was gated on a spike (spec §6.1, T-036 Task 0).

## What was tested

Round-trip = load Markdown → parse to the editor's document model → serialise back to
Markdown. Run over **all 32 real notes** in `src/content/notes/` plus a composite
fixture. (No single real note contains all four custom constructs, and **zero** notes
currently contain a `<RichPopover/>`, so the chip was tested via the exact string
`SocialLinkModal.jsx` emits.)

Three layers:

1. **mdast/remark serialiser (DOM-free)** — the normalisation surface. Milkdown's
   `@milkdown/transformer` is built on this same remark engine.
2. **Real Milkdown transformer** — `md → ProseMirror doc → md`, run headless via jsdom
   (`@milkdown/kit` + commonmark + gfm + `@milkdown/plugin-math`). This is the decisive
   test of the **ProseMirror schema** mapping — whether custom constructs survive the
   doc model, not just the serialiser.
3. **Rendered-output equivalence** — for the one content-affecting normalisation, proved
   the before/after produce byte-identical KaTeX HTML under the reader's own remark-math.

## Findings

- **`<RichPopover/>` round-trips (out of the box).** Milkdown's commonmark preset keeps
  unknown tags as `html` nodes and re-serialises them verbatim; chip + all 6 attributes
  preserved through the real PM schema. Round-trip needs **no** custom node spec.
  (T-037 still adds a node *view* to render/edit it — a rendering concern, not storage.)
- **Code blocks, images, tables, and proper display-math `$$` blocks round-trip exactly.**
  No construct dropped in any real note.
- **Byte-identity is not achievable** (0/32 notes are byte-identical after round-trip),
  as expected. All differences are **rendered-equivalent** normalisations.

### Documented normalisations (accepted per Q2)

| Normalisation | Example | Rendered-equivalent? |
|---|---|---|
| CRLF → LF line endings | `hello\r` → `hello` | yes |
| Trailing-space hard break → backslash hard break | `text  ` → `text\` | yes (both `<br>`) |
| List bullet `-` → `*` | `- item` → `* item` | yes |
| Table cell padding to column width | `\| a \|` → `\| a   \|` | yes |
| `<RichPopover>` attribute indentation stripped | `  platform=` → `platform=` | yes (`parseRichPopoverProps` is indentation-agnostic) |
| **Inline `$$X$$` → `$X$`** | `$$(-1)^{i+j}$$` mid-line → `$(-1)^{i+j}$` | **yes — see below** |

### The one semantic-looking change is benign

Inline `$$…$$` (dollar-dollar used mid-paragraph, common in the math notes) is demoted
to `$…$`. This looks like display→inline, but **both parse to the same `inlineMath`
node with the same value** under remark-math — which is the reader's exact engine — so
they render to **identical KaTeX HTML** (verified). The reader already renders these
inline today; the round-trip only normalises the *source* to match the *render*. Proper
display blocks (`$$` on their own lines) parse to `math`/display and are unaffected.

## Guardrail status (T-036 §Confirmed decisions)

- ✅ Custom nodes round-trip exactly: RichPopover, code, images, display math — exact;
  inline-`$$` normalises but is rendered-equivalent. **No library-failing drop.**
- ✅ Validation is by rendered-output equivalence, not raw bytes.
- ➡️ The one-time `normalize-all-notes` commit (Q2) must run the full HTML-diff harness
  (render every note through `MarkdownRenderer` before/after) before landing — this
  spike proved the mechanism on the math hazard; the migration must prove it on all 32.

## Risks / follow-ups for the migration (not blockers)

- **`@milkdown/plugin-math@7.5.9` is deprecated** ("no longer supported"). Round-trip
  serialisation of math actually rides on the remark layer, and T-037 renders math with
  our **own** KaTeX config (spec §6.3) — so prefer a small custom math node view over a
  hard dependency on the deprecated plugin. Decide during T-037.
- **Node engine:** the modern Milkdown/jsdom toolchain wants Node ≥20.19 (this env is
  18.19). The *app* build is Vite and unaffected, but CI/dev Node should move to 20+.
- **Controlled↔uncontrolled feedback loop:** Milkdown must own its document and only
  *emit* Markdown to `handleContentChange`; do not drive it from the `content` prop
  except on explicit note load (classic ProseMirror integration trap).

## Alternatives

- **TipTap** — Markdown not native; needs a custom serializer for every custom node
  (higher round-trip risk). Not tested; only needed if Milkdown had failed.
- **Lexical** — most manual for Markdown/math. Not tested.

## Reproduction

Throwaway spike harnesses (not committed): mdast layer, headless Milkdown layer, and the
math-equivalence proof. Reconstructable from this ADR; deps installed were
`@milkdown/kit@7.21.3`, `@milkdown/plugin-math@7.5.9`, `jsdom@22`.
