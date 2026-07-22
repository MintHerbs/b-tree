---
id: T-035
title: Reader parity — full-bleed shared NoteReader + unified code-block theme
status: done
severity: medium
area: notes
epic: E-004
created: 2026-07-22
---

## Summary

Two reader-side fixes that make a *published/read* note look consistent everywhere, both independent
of the WYSIWYG rewrite (so they can ship first):

1. **Code theme** — the reader highlights fenced code with `react-syntax-highlighter` + `vscDarkPlus`,
   while the social feed uses a bespoke themed `CodeBlock`. Switch the reader to the social `CodeBlock`.
2. **Full-bleed reader** — the live note page and the eye-icon preview already use the *same*
   `MarkdownRenderer` but wrap it in different chrome (warm 860px card vs. flat 720px document).
   Extract one `NoteReader` and use it for both.

**Decisions (2026-07-22, "go all in"):** Q1 = **A** — no standalone document title; the Markdown
`# H1` is the title, `eyebrow` carries a humanised section breadcrumb. Q2 = **B (true full-bleed)** —
suppress the sidebar on `/notes/*` by reusing App.jsx's existing admin-route chrome gate (low-risk,
not a routing rewrite), keep the floating DynamicIsland/MusicPlayer, and add a back/close affordance.
See Suggested fix for the concrete plan.

## Evidence

**Code theme**
- `src/components/markdown/MarkdownRenderer.jsx:5-6` imports `{ Prism as SyntaxHighlighter }` +
  `vscDarkPlus`; the `code()` component (`:91-125`) renders block code through `<SyntaxHighlighter>`.
- `src/components/social/CodeBlock/CodeBlock.jsx` is a self-contained themed block (`{ code, language }`,
  traffic-light header, language label, line numbers) backed by `src/lib/social/codeHighlighter.js`.
- `MarkdownRenderer.module.css:74-106,256-277` carries `.codeBlock*` rules that only style the
  `react-syntax-highlighter` output.

**Full-bleed reader**
- `src/components/admin/PreviewModal.jsx:19-23` — flat `var(--bg)`, `.scrollContainer` centred,
  `.documentContainer` **max-width 720px**, a `.documentTitle` `<h1>` + `<MarkdownRenderer>` (the
  preferred "Obsidian" look).
- `src/pages/notes/NotesPage.jsx:51-65` — the same `<MarkdownRenderer>` inside `.notesContainer`.
- `MarkdownRenderer.module.css:1-26` — `.notesContainer` is a warm `#161311` card, **max-width 860px**,
  `margin: 80px auto 0`, box-shadow, with a `::before` gradient that "fades content under navbar"
  (confirming a global fixed navbar wraps the route).
- Notes have **no frontmatter** (`src/content/notes/database/getting-started.md` opens with
  `# Database Tools`); the editor `title` state only drives the filename/registry label
  (`src/hooks/useEditorSave.js:5-13,280`), so the preview prints the title twice (its `.documentTitle`
  *and* the Markdown `# H1`).

Both the live page (`NotesPage.jsx:63`) and the preview (`PreviewModal.jsx:22`) go through the same
`MarkdownRenderer`, so the code-theme fix reaches both surfaces at once.

## Impact

A ` ```c … ``` ` block on a live note renders in VS Code dark, inconsistent with the identical block
in a social post. And opening a note on the live site looks materially different from the preview the
author designs against (warm card vs. flat document), with the title duplicated in the preview. The
author wants the social code theme on the main site and the live page to look "exactly like" the
preview.

## Suggested fix

**Code theme**
- In `MarkdownRenderer.jsx` `code()`, for the `isBlock` branch render
  `<CodeBlock code={codeString} language={language} />` instead of `<SyntaxHighlighter>`; leave the
  inline-code branch (`.inlineCode`) unchanged.
- Confirm `CodeBlock` has no `social/`-only coupling (it imports only `codeHighlighter.js` — clean).
- Grep for other importers of `react-syntax-highlighter`; if the reader was the only one, drop the
  dependency and the dead `.codeBlock*` CSS.
- Accept the neon (off-brand) palette per spec §5.2 — reusing an existing approved component, not new
  raw hex.

**Full-bleed reader** — decided: **true full-bleed** (Q2 = B), not a reflow inside existing chrome.
- New `src/components/markdown/NoteReader/{NoteReader.jsx,NoteReader.module.css,index.js}`: props
  `content` (required), `eyebrow?`, `onClose?`; internals generalised from `PreviewModal.module.css`
  (flat `var(--bg)`, centred ~720px column); renders `<MarkdownRenderer content={content} />`.
- `PreviewModal.jsx` and `NotesPage.jsx` both render `<NoteReader>`; drop the warm `.notesContainer`
  card **and** its `::before` "fade under navbar" gradient.
- **Title (Q1 = A):** no standalone document title. The Markdown `# H1` is the visible title (renders
  via `MarkdownRenderer`); `eyebrow` shows a small breadcrumb built from the route — humanised, e.g.
  `Database · Getting Started` (title-case the module label + filename, strip `.md` and dashes),
  **not** the raw registry label `getting-started.md`. A note with no `# H1` shows just the eyebrow
  (matches today's live behaviour) — no empty title gap.
- **Chrome (Q2 = B):** suppress the global `Sidebar` (and `Starfield`) on `/notes/*` using the pattern
  App.jsx already uses for admin — add `isNoteRoute = location.pathname.startsWith('/notes/')`
  alongside `isAdminRoute` (`src/App.jsx:28-29,61,72`) and gate `Sidebar`/`Starfield` on it. Same
  one-line mechanism as admin, **not** a routing rewrite.
- Keep the floating `DynamicIsland` + `MusicPlayer` (they already render on every route; minimal,
  non-intrusive, and preserve music/presence while reading).
- Add a floating **back/close affordance** in `NoteReader` (top-left back arrow or top-right X,
  mirroring the preview): `navigate(-1)` when history exists, else fall back to the module/section
  landing so a deep-link never strands the user. Tappable/responsive on mobile.
- Optional (nice-to-have, not required for acceptance): a toggle to re-open the sidebar for quick
  note-switching without leaving the reader.
- Preserve the mobile `@media (max-width: 768px)` behaviour from `MarkdownRenderer.module.css`.

## Acceptance criteria

- [x] A fenced code block on a live note renders with the social `CodeBlock` theme (traffic-light
      header, language label, line numbers, neon) — identical to a social post.
- [x] Inline code unchanged; no unused `react-syntax-highlighter` import or dead `.codeBlock*` CSS.
- [x] Live page and preview are visually indistinguishable in the content column.
- [x] Live page: flat full-bleed background, centred ~720px column, no warm card, no duplicated title.
- [x] Global `Sidebar` (and `Starfield`) suppressed on `/notes/*`; `DynamicIsland`/`MusicPlayer` kept.
- [x] A back/close affordance returns the user to the previous page (history) with a landing fallback
      for deep-links; works on mobile.
- [x] Eyebrow shows a humanised `Section · Note` breadcrumb (not the raw `.md` label); a note with no
      `# H1` still reads cleanly (eyebrow only).
- [x] `NoteReader` is the single component both surfaces use.

## References

- Spec: [docs/specs/notes-wysiwyg-and-reader.md](../docs/specs/notes-wysiwyg-and-reader.md) §4, §5
- Epic: E-004 (folds former code-theme + reader tickets)
