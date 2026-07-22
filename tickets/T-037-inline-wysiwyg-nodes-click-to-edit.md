---
id: T-037
title: Inline WYSIWYG nodes with click-to-edit — LaTeX, code, images, RichPopover, drafts
status: backlog
severity: medium
area: admin
epic: E-004
created: 2026-07-22
---

## Summary

T-036 already models each custom construct as a **read-only** rendered node; this ticket adds the
**interactions** on top — making each editable in place and round-tripping edits back to Markdown:
LaTeX (click → popup with source + live result),
fenced code (click → reveal source, themed on blur), `draft://` images, and the `<RichPopover/>`
social-link chip — plus confirm draft autosave still fires. This delivers the author's core asks
(natively-rendered LaTeX/code with click-to-edit) and makes the eye icon redundant. It also makes
**pasting** content that contains LaTeX or code auto-render (no raw `$…$` or fence left visible) and
makes copying/cutting a formula yield its Markdown source.

## Evidence

**LaTeX**
- Today formulas render as stacked full-width Monaco view-zones with the raw text hidden
  (`src/hooks/useEditorFormatting.js:99-188`) — the "boxed, messy" look; clicking only moves the caret
  (`:146-152`).
- `FormulaModal` only inserts (`src/components/admin/FormulaModal.jsx:7,37-54`) but already renders a
  live KaTeX preview (`renderPreview`, `:20-35`) — the edit affordance is half-built.
- Mounted at `AdminEditor.jsx:681-685` with `onInsert={handleInsertFormula}`.

**Code**
- The editor renders no code blocks today (`renderInlineLaTeX` handles only math); fenced code shows
  as raw source. `handleFormatAction('code')` inserts an empty ```` ```\n\n``` ```` fence
  (`useEditorFormatting.js:237-239`). Target theme is the social `CodeBlock` (unified in T-035).

**Images / RichPopover / drafts**
- Image handling is Monaco-coupled: `createImageWidget` / hover / replace / delete
  (`AdminEditor.jsx:42-178,371-507`) and the `draft://` insert queue (`src/hooks/useEditorImages.js`),
  resolved to real paths at save time (`useEditorSave.js:238-256`).
- RichPopover is inserted as a raw string by `SocialLinkModal` via `handleInsertFormula`
  (`AdminEditor.jsx:687-691`) and parsed by `splitContentByRichPopovers`
  (`MarkdownRenderer.jsx:68-89`) — must survive round-trip as a node (highest custom-node risk).
- Draft autosave/restore is in `src/hooks/useEditorDrafts.js`, keyed off `content`/`title`/`unsaved`.

**Clipboard / paste**
- Pasting is unhandled today; with Monaco, pasted `$x^2$` lands as literal text that the view-zone
  hack then hides rather than cleanly rendering, and selecting across a rendered formula can't copy
  its source (`.monaco-latex-hidden { user-select:none }`, `src/pages/admin/AdminEditor.module.css:115`).
  Auto-render on paste is **not** ProseMirror's default — it must be configured (paste-as-Markdown +
  `$…$` paste/input rules for math, fence rules for code).

## Impact

Without this the WYSIWYG editor renders only plain formatting and loses shipped features (image
upload, social-link chips, autosave). The author explicitly wants LaTeX to "natively display" with a
click-to-edit popup (source + result below) and code to "show rendered, and only on click reveal the
``` source" — neither is possible with the insert-only modal, the view-zone hack, or Monaco-coupled
image widgets.

## Suggested fix

- **Math nodes:** represent `$…$`/`$$…$$` as atomic nodes rendered with the same KaTeX config as the
  reader. Extend `FormulaModal` to `mode: 'insert' | 'edit'` (`initialLatex`, `initialDisplayMode`,
  `onSubmit(latex, displayMode)`), reusing its live-preview panel as the "result below". Clicking a
  formula opens it pre-filled; Save rewrites the node.
- **Code nodes:** render fenced code via the social `CodeBlock` (read-only look); on click/focus reveal
  an editable code surface (inline region or small popup — keep consistent with the formula flow); on
  blur/save re-render themed. Language affordance maps to the ` ```lang ` fence.
- **Image nodes:** insert `![](draft://…)` as an editor image node; keep `useEditorImages` upload logic
  and the save-time queue resolution unchanged; port replace/delete to the node.
- **RichPopover node:** parse/serialize `<RichPopover … />` as a first-class inline node (remark rule +
  node view + serializer); `SocialLinkModal` inserts the node instead of a string.
- **Drafts:** confirm `useEditorDrafts` still fires on editor changes (it keys off `content`/`unsaved`,
  preserved by T-036); adjust only if the change cadence differs.

## Acceptance criteria

- [ ] Inline/block LaTeX renders inline (no view-zone boxes); clicking a formula opens a popup with its
      source + live KaTeX result below; saving updates it in place and round-trips to `$…$`/`$$…$$`.
- [ ] Fenced code renders themed inline; clicking reveals editable source; blur/save re-renders themed;
      language round-trips to ` ```lang `.
- [ ] Dropping/inserting an image shows it inline; on save it uploads and `draft://` is rewritten to
      `/notes/img/…` exactly as today; replace/delete work from the node.
- [ ] A `<RichPopover/>` chip renders in the editor and round-trips byte-stably through save.
- [ ] Draft autosave/restore still works across reload.
- [ ] Pasting text that contains `$…$` / `$$…$$` auto-renders it inline (no raw LaTeX visible);
      pasting a fenced ` ```lang ` block renders the themed code node.
- [ ] Copying or cutting a rendered formula/code block puts its Markdown source on the clipboard, so
      it round-trips when pasted back.

## References

- Spec: [docs/specs/notes-wysiwyg-and-reader.md](../docs/specs/notes-wysiwyg-and-reader.md) §6.3, §6.4, §6.5, §6.6
- Depends on: T-036 (and shares the code theme with T-035). Epic: E-004 (folds former LaTeX + code + media tickets)
