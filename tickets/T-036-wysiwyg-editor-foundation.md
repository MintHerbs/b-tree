---
id: T-036
title: WYSIWYG editor foundation — replace Monaco, lossless Markdown round-trip, formatting (incl. library spike)
status: backlog
severity: medium
area: admin
epic: E-004
created: 2026-07-22
---

## Summary

Replace the Monaco source editor with a true WYSIWYG editor wired to the existing content/save flow,
rendering headings/bold/italic/strike/inline-code/lists/blockquote/hr/tables/links inline. Starts
with a time-boxed **library spike** that must prove lossless Markdown round-trip (incl. the app's
custom constructs) before the migration proceeds. This is the backbone the inline-node ticket (T-037)
builds on.

## Evidence

- Notes are stored as plain Markdown (`src/pages/notes/NotesPage.jsx:6-9` globs `**/*.md` raw) and
  committed to GitHub by `src/hooks/useEditorSave.js` — the editor must emit Markdown, not HTML/JSON.
- `package.json` has no WYSIWYG editor today (only `@monaco-editor/react`); one new dependency is added.
- `src/pages/admin/AdminEditor.jsx:737-762` mounts `@monaco-editor/react`; `:339-369` wires
  view-zone/decoration rendering; `handleContentChange` (`:509-512`) feeds `content`/`unsaved`.
- Formatting today mutates Markdown text via `editor.executeEdits` in
  `src/hooks/useEditorFormatting.js:217-266` (`handleFormatAction`) and `:269-301`
  (`handleStyleChange`, the `# / ##` "Body ▾" dropdown); toolbar buttons in `EditorNavbar` call
  `onFormatAction` / `onStyleChange` (`AdminEditor.jsx:711-716`).
- Custom constructs the parser/serializer must survive round-trip (detailed handling is T-037, but the
  spike must prove them here): block/inline math `$$…$$`/`$…$`
  (`src/hooks/useEditorFormatting.js:42-76`), `<RichPopover … />` chips
  (`src/components/markdown/MarkdownRenderer.jsx:68-89`), and `draft://` images (`useEditorImages.js`).
- Content contract to preserve: `content` is a Markdown string in `useEditorState`; `title` is
  separate; `useEditorSave` / `useEditorDrafts` consume `content` unchanged.
- **Clipboard (current breakage):** no copy/cut/paste/clipboard handler exists in the codebase; the
  only selection-affecting rule is `.monaco-latex-hidden { opacity:0; pointer-events:none;
  user-select:none }` (`src/pages/admin/AdminEditor.module.css:115`) over the raw `$…$` behind each
  rendered formula, whose visible KaTeX sits in a Monaco **view-zone** that isn't part of the editable
  model — so selecting/copying across a formula returns nothing usable, and Monaco's custom right-click
  **Paste** is blocked by browser clipboard policy. Replacing Monaco deletes this entirely.

## Impact

Until this lands the editor stays a source editor and none of the WYSIWYG asks are possible. A lossy
round-trip would silently corrupt notes on save (mangled math, dropped RichPopover chips), so the
spike gates the work.

## Suggested fix

- **Spike (task 0):** evaluate **Milkdown** (ProseMirror + remark — Markdown-native,
  `@milkdown/plugin-math`, same remark ecosystem as the reader) as the primary candidate; TipTap /
  Lexical as fallbacks (spec §6.1 trade-off table). Load one real note containing `$$`, a code block,
  an image and a `<RichPopover/>` and diff `serialize(parse(md))` against the original. Record the
  recommendation (library + version), optionally as a short `docs/adr/` entry. Do not migrate until it
  passes.
- **Round-trip strictness (Q2 = documented normalisation + one-time pass):** literal byte-identity is
  *not* the bar — `remark` normalises some cosmetics. Accept a **documented** normalisation set
  (trailing whitespace, bullet-marker style, heading style, blank-line runs) and land a **one-time,
  isolated `normalize-all-notes` commit** across `src/content/notes/` so existing files already match
  the serialiser's output — then every future `load → save` is a true no-op diff. **Guardrails:**
  (1) validate the pass by **rendered-output equivalence** — render each note through
  `MarkdownRenderer` before/after and diff the HTML, *not* raw bytes; (2) custom nodes (`$$…$$`,
  fenced code, `<RichPopover/>`, `draft://` images) must round-trip **exactly** and are never
  "normalised away"; if the library can't round-trip one even after serialiser config, that **fails
  the library** — pick another. Run the pass only after the library is locked.
- **Model all node types now (Q3 = read-only nodes in the foundation):** this ticket models **every**
  custom construct as a **read-only rendered node** — math (KaTeX), fenced code (the social
  `CodeBlock` from T-035), images (rendered `<img>`), and `<RichPopover/>` (rendered chip) — so the
  round-trip gate is honest end-to-end (you can't prove lossless serialisation of a node you haven't
  modelled). Only the **interactions** (formula edit popup, code reveal-source, image
  upload/replace/delete, RichPopover insert/edit, paste-auto-render) are deferred to T-037.
- New editor component tree (e.g. `src/components/admin/NoteEditor/`) mounted by `AdminEditor.jsx` in
  place of `<Editor>`; parse `content` → doc on load, serialize doc → Markdown on change into the
  existing `handleContentChange`.
- Re-implement `handleFormatAction` / `handleStyleChange` as editor commands; re-wire the
  `EditorNavbar` toolbar + `Body ▾` dropdown to them.
- **Render using the same styling language as `NoteReader` (T-035)** so the editing surface matches
  the published look (the guiding principle that makes the eye icon obsolete).
- Keep Monaco importable behind a flag until acceptance passes, then delete Monaco + `renderInlineLaTeX`.

## Acceptance criteria

- [ ] Chosen library round-trips a representative note with only **documented** cosmetic
      normalisations; custom nodes round-trip **exactly**. Recommendation recorded; `src/` is `.jsx`.
- [ ] A one-time `normalize-all-notes` commit lands so existing `src/content/notes/` already match the
      serialiser, validated by **rendered-output equivalence** (HTML diff before/after), not raw bytes.
- [ ] After that pass, `load → change nothing → save` produces a **no-op diff**.
- [ ] Headings/bold/italic/strike/lists/tables render inline, and **math (KaTeX), fenced code (social
      `CodeBlock`), images and `<RichPopover/>` render as read-only nodes** — no raw syntax visible for
      any supported construct. (Editing interactions are T-037.)
- [ ] Toolbar (bold/italic/strike/inline-code) and `Body ▾` style dropdown work via editor commands.
- [ ] Copy, cut and paste work via keyboard **and** the browser's native context menu; pasting
      Markdown text (headings/bold/lists) parses to the right nodes. (The Monaco `user-select:none` +
      view-zone selection bug that broke copy-paste is gone.)
- [ ] `useEditorSave` / `useEditorDrafts` / registry behaviour unchanged (same commits, same
      `modules.js` edits).
- [ ] Editor content column matches `NoteReader` visually.

## References

- Spec: [docs/specs/notes-wysiwyg-and-reader.md](../docs/specs/notes-wysiwyg-and-reader.md) §6.1, §6.2, §6.6
- After: T-035 (reuses `CodeBlock` + matches `NoteReader`). Epic: E-004 (folds former spike + foundation tickets)
