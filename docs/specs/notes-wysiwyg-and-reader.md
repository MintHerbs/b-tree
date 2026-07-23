# Feature Spec: Notes WYSIWYG Editor + Full-Bleed Reader + Code Theme Unification

**Status:** Proposed
**Created:** 2026-07-22
**Epic:** E-004 — Notes authoring & reading overhaul
**Decisions locked** (confirmed with the product owner before this spec was written):

1. **Editor direction — True WYSIWYG rewrite.** Replace the Monaco source editor with a
   live-preview editor so headings, bold, LaTeX and code all render inline *as the note is
   written*. The standalone "eye icon" preview becomes obsolete.
2. **Live page look — Full-bleed reader.** Public note pages render as a clean centred
   document that matches the eye-icon preview as closely as possible, via **one shared reader
   component** used by both the live page and (for as long as it survives) the preview.

---

## 1. Overview

Three problems, one root cause. Notes are authored in a **Monaco code editor** (`AdminEditor.jsx`)
but read through a **`react-markdown` renderer** (`MarkdownRenderer.jsx`). The two surfaces don't
share a rendering language, so the author never sees the finished note while writing it — hence the
"eye icon" preview exists as a crutch, and small styling forks (code themes, page chrome) have crept
in between the surfaces.

| # | Problem (author's words) | Root cause |
|---|---|---|
| 1 | *"When I insert LaTeX the editor shows the messy boxed view (image 1); I want it to render natively like the preview (image 2) and make the eye icon obsolete."* | Monaco is a source editor. `renderInlineLaTeX` fakes rendering with stacked full-width **view-zones** while headings/bold/lists stay raw markdown — an unavoidable hybrid. |
| 1b | *"Clicking a formula should open a popup with the LaTeX and its result below. Same for code — show it rendered, and only on click reveal the ``` source."* | `FormulaModal` only **inserts**; there is no **edit** path. Code blocks aren't rendered in the editor at all. |
| 2 | *"On the main website the code block should use the same theme as the social code block."* | The reader (`MarkdownRenderer`) highlights code with `react-syntax-highlighter` + `vscDarkPlus`. The social feed uses a bespoke themed `CodeBlock`. Two implementations, two looks. |

### Guiding principle

> **Editor render === reader render === published render.**

There must be exactly one visual language for a note. The WYSIWYG editor renders a note using the
*same* KaTeX config, the *same* code-block component, and the *same* typography as the public
reader. When that is true, "what you're writing" and "what readers see" are pixel-identical and the
preview modal has nothing left to show.

---

## 2. Goals / Non-goals

**Goals**
- Author sees LaTeX, code, headings, bold, tables, images and social-link chips rendered inline
  while editing.
- Click a rendered formula → popup editor (LaTeX source **+** live KaTeX result below); save updates
  the note in place.
- Click a rendered code block → reveal/edit the fenced source; blur re-renders it themed.
- One `CodeBlock` theme everywhere (reader, live page, editor).
- Live note pages render as a full-bleed document identical to the reader/preview.
- The eye-icon preview is retired (or repurposed as a plain fullscreen reader) once the editor is
  WYSIWYG.

**Non-goals**
- Changing the storage format. Notes remain **plain Markdown** committed to GitHub
  (`src/content/notes/**/*.md`). The editor must round-trip Markdown losslessly.
- Changing the save/registry/image-upload pipeline behaviour (`useEditorSave`, `modules.js`
  registry, `draft://` image scheme) — only its editor-side call sites move.
- Rewriting the public `MarkdownRenderer` engine. It stays `react-markdown`; only its **code
  component** and **container/chrome** change.
- Rich collaborative editing, comments, version history.

---

## 3. Current architecture (as-built)

Read this before touching anything; the surfaces are more entangled than they look.

### 3.1 Editor — `src/pages/admin/AdminEditor.jsx` (+ `src/hooks/useEditor*.js`)
- `@monaco-editor/react`, `defaultLanguage="markdown"`, custom `mooner-dark` theme.
- `renderInlineLaTeX(editor, monaco)` ([useEditorFormatting.js](../../src/hooks/useEditorFormatting.js)):
  scans `$…$` / `$$…$$`, renders each with `katex.renderToString` into a Monaco **view-zone**
  (full-width block on its own line, purple left border — the "boxes" in image 1), and hides the raw
  text with a `monaco-latex-hidden` decoration. Clicking a box just moves the caret into the raw
  source. Formulas whose range overlaps the caret are shown raw ("edit mode").
- `renderInlineImages` + `createImageWidget`: hover widget over `![](…)` markdown with
  replace/delete context menu; `draft://` scheme for not-yet-uploaded images.
- Formatting: `handleFormatAction` (bold/italic/strike/code) and `handleStyleChange`
  (title `#` / subtitle `##` / body) rewrite Markdown syntax via `editor.executeEdits`.
- Modals wired in: `FormulaModal` (insert-only), `SocialLinkModal` (inserts a `<RichPopover … />`
  string via the same `handleInsertFormula`), `PreviewModal`, `DirectoryDrawer`, etc.
- Content is a Markdown string in `useEditorState`; `title` is **separate** state.

### 3.2 Reader / preview — `src/components/admin/PreviewModal.jsx`
- Radix full-screen dialog → `.scrollContainer` (centred) → `.documentContainer` (**max-width 720px**)
  → a `.documentTitle` `<h1>` (the editor's `title` state) **+** `<MarkdownRenderer content={content} />`.
- This is the "Obsidian" look the author prefers (image 2). Flat `var(--bg)` background, no card.

### 3.3 Live page — `src/pages/notes/NotesPage.jsx`
- Loads the `.md` via `import.meta.glob('../../content/notes/**/*.md', { query: '?raw' })`.
- Renders `<MarkdownRenderer content={content} />` inside `.notesContainer` — a **warm `#161311`
  card, max-width 860px, `margin: 80px auto 0`, box-shadow**, sitting under the global fixed navbar
  (the `.notesContainer::before` gradient "fades content under navbar"). No document title.
- **Key finding:** live and preview use the *same* `MarkdownRenderer`. The only visible difference
  is the **container chrome** (warm 860px card + app navbar vs. flat 720px document).

### 3.4 The two code renderers
| | Reader today | Social feed (target) |
|---|---|---|
| File | `MarkdownRenderer.jsx` `code()` | `src/components/social/CodeBlock/CodeBlock.jsx` |
| Engine | `react-syntax-highlighter` (Prism) + `vscDarkPlus` | bespoke `tokenizeCodeLine` in `src/lib/social/codeHighlighter.js` |
| Chrome | rounded box, no header | traffic-light dots + language label + line numbers + neon "cyberpunk" theme |
| Colours | VS Code dark | raw hex `#5B8CFF` / `#FF5FA2` / `#7FE7FF` |

### 3.5 Content & title model (important)
- Notes are **Markdown with no frontmatter**. The first `# Heading` in the file *is* the visible
  title (e.g. `getting-started.md` starts with `# Database Tools`).
- The editor's `title` state only drives the **filename** (`titleToFilename`) and the `modules.js`
  registry **label** (`'<filename>.md'`) — it is **not** written into the `.md`.
- Consequence: the preview shows the title **twice** (the `.documentTitle` from `title` state *and*
  the Markdown `# H1`). The live page shows it once (just the `# H1`). The reader spec below must
  pick **one** title treatment rather than propagate the duplication.

---

## 4. Part A — Full-bleed shared reader

**Outcome:** one `NoteReader` component renders a note identically wherever it appears.

### 4.1 New component — `src/components/markdown/NoteReader/`
```
NoteReader/
  NoteReader.jsx          # <NoteReader title? eyebrow? content /> — layout shell + <MarkdownRenderer>
  NoteReader.module.css   # flat bg, centred ~720px column, document title, reading typography
  index.js
```
- Props: `content` (Markdown string, required), `title` (string, optional), `eyebrow` (optional
  breadcrumb such as `section • filename`).
- Internals: the current `.scrollContainer` / `.documentContainer` / `.documentTitle` styling from
  `PreviewModal.module.css`, generalised. Renders `<MarkdownRenderer content={content} />` inside.

### 4.2 Wire it up
- `PreviewModal.jsx` and `NotesPage.jsx` both render `<NoteReader content={content} eyebrow={…} onClose={…} />`.
  Drop the warm `#161311` `.notesContainer` card and its `::before` gradient.
- **Title — decision A (no standalone title):** the Markdown `# H1` is the visible title (it already
  renders via `MarkdownRenderer`). There is **no** `title` prop; `eyebrow` carries a humanised route
  breadcrumb — `Database · Getting Started` (title-case the module label + filename, strip `.md`/
  dashes), **not** the raw registry label `getting-started.md`. A note with no `# H1` shows just the
  eyebrow (matches today's live behaviour) — no empty title gap. Rationale: the registry label is a
  filename (a poor title); the `# H1` is the real title; A is the least code for the cleanest result.

### 4.3 Reconcile global chrome — decision B (true full-bleed)

> **Superseded 2026-07-23 (owner decision):** the sidebar is now **persistent on
> `/notes/*`** (global sidebar on every route except the admin editor). Only the
> Starfield stays suppressed on notes, so the reading background stays flat. The
> reader's back affordance moved to the top-right to clear the left sidebar rail.
> The full-bleed *content column* (flat bg, centred ~720px) is unchanged; only the
> sidebar-suppression part of decision B was reversed. See `src/App.jsx` sidebar
> gate and `NoteReader.module.css` `.backButton`.

- Chrome is gated by route in `src/App.jsx:28-29,61,72`: `isAdminRoute` already suppresses `Sidebar`
  and `Starfield`. Full-bleed reuses that exact pattern — add
  `isNoteRoute = location.pathname.startsWith('/notes/')` and gate `Sidebar`/`Starfield` on it. This
  is a one-line mechanism, **not** a routing rewrite (the earlier "scope risk" assumed one).
- Keep the floating `DynamicIsland` + `MusicPlayer` (they render on every route already; minimal, and
  they preserve music/presence while reading).
- `NoteReader` provides a floating **back/close** affordance (mirrors the preview's X): `navigate(-1)`
  when history exists, else fall back to the module/section landing so deep-links never strand the
  user. Tappable on mobile; keep the `@media (max-width: 768px)` behaviour from
  `MarkdownRenderer.module.css`.
- Optional follow-up (not required): a toggle to re-open the sidebar for note-switching in-reader.

### 4.4 Acceptance
- Opening a note on the live site and opening the same note via the (surviving) preview are visually
  indistinguishable in the content column.
- No warm card, no double navbar gutter, no duplicated title.

---

## 5. Part B — Code-block theme unification

**Outcome:** the social `CodeBlock` theme is the *only* code look in the app.

### 5.1 Change `MarkdownRenderer.jsx` `code()` component
- For **block** code (`isBlock`), render `<CodeBlock code={codeString} language={language} />`
  (from `src/components/social/CodeBlock/`) instead of `<SyntaxHighlighter style={vscDarkPlus}>`.
- Keep the existing inline-code branch (`.inlineCode`) as-is.
- Remove the now-unused `react-syntax-highlighter` / `vscDarkPlus` imports **if** no other file uses
  them (grep first — the social path uses its own highlighter, so this import is likely reader-only).
- Delete the dead `.codeBlock*` rules from `MarkdownRenderer.module.css` once the switch is verified.

### 5.2 Make `CodeBlock` reusable outside the feed
- Confirm `CodeBlock` has no `social/`-only coupling (it takes `{ code, language }` and imports only
  `codeHighlighter.js` — clean). If any social-only assumption exists, lift it.
- **Token note:** `CodeBlock.module.css` uses raw neon hex (`#5B8CFF` / `#FF5FA2` / `#7FE7FF`), off
  the purple brand palette (`docs/design/colors.md`). This is a **deliberate reuse of an existing
  approved component**, so the "no new raw hex" rule is not newly violated. If a future pass wants it
  on-brand, tokenise it separately — **out of scope here** (the ask is explicitly "same as social").

### 5.3 Acceptance
- A ` ```c … ``` ` block on a live note renders with the traffic-light header, language label, line
  numbers and neon theme — identical to the same block in a social post.

---

## 6. Part C — WYSIWYG editor (replace Monaco)

The large piece. Delivers problems 1 and 1b.

### 6.1 Library choice — **recommend Milkdown**, spike first
The editor must round-trip Markdown losslessly *and* host custom inline nodes (math, code,
`RichPopover`, `draft://` images).

| Option | Fit | Notes |
|---|---|---|
| **Milkdown** (ProseMirror + **remark**) ✅ recommended | Markdown is the *native* document model; `@milkdown/plugin-math` (KaTeX) and a configurable code-block; `@milkdown/react`. Custom syntax via a remark plugin + node view — the same remark ecosystem the reader already uses (`remark-math`, `remark-gfm`). | Lossless round-trip is first-class. |
| TipTap (ProseMirror) | Large ecosystem, great DX. | Markdown is **not** native — needs `tiptap-markdown`/`prosemirror-markdown` with a custom serializer for **every** custom node (math, RichPopover, images); higher round-trip risk. |
| Lexical | Solid. | Markdown via transformers; math/code as fully custom nodes — most manual. |

> **Task 0 of the foundation ticket is a time-boxed spike** confirming the chosen library can
> round-trip one real existing note (with `$$`, a code block, an image and a `<RichPopover/>`)
> byte-stable. Do not migrate the editor until that passes. Libraries are `node_modules` deps —
> the JS-only/`.tsx` rule (`docs/rules.md`) applies to **our** `src/` code, which stays `.jsx`.

### 6.2 Document / round-trip model
- Source of truth stays a Markdown string in `useEditorState` (`content`). The editor parses
  Markdown → doc on load and serialises doc → Markdown on every change (feeding the existing
  `onChange`/`unsaved`/draft-autosave flow unchanged).
- `useEditorSave`, `useEditorDrafts`, `useEditorModules`, `useEditorFiles` keep their signatures;
  only the component that produces `content` changes.
- **Round-trip strictness (decided):** literal byte-identity is not required — accept a *documented*
  set of `remark` cosmetic normalisations and land a one-time `normalize-all-notes` commit so existing
  notes already match the serialiser (future `load → save` is a no-op diff). Validate that pass by
  **rendered-output equivalence** (HTML diff via `MarkdownRenderer`), not raw bytes. Custom nodes
  (`$$`, fenced code, `<RichPopover/>`, `draft://` images) must round-trip **exactly**; if the library
  can't, it fails the spike.

### 6.3 Nodes & marks to support
Standard: headings, bold, italic, strike, inline code, fenced code, lists, blockquote, hr, tables
(GFM), links, images, paragraphs. Custom:
- **Math** — inline `$…$` and block `$$…$$` as atomic nodes rendered with the **same KaTeX config**
  as the reader.
- **Code block** — rendered with the **social `CodeBlock`** (Part B) as its node view.
- **RichPopover** — the `<RichPopover … />` inline chip (see `splitContentByRichPopovers` in
  `MarkdownRenderer.jsx`). Needs a remark/parse rule + node view + serializer so it survives
  round-trip. This is the highest-risk custom node — cover it explicitly.
- **Image** — `![](…)` including the `draft://` scheme; preserve the upload-on-save queue.

**Foundation vs interaction boundary (decided):** **T-036 models every node above as a read-only
rendered node** — so the round-trip gate is proven end-to-end for all of them. **T-037 adds the
editing interactions** (formula edit popup, code reveal-source, image upload/replace/delete,
RichPopover insert/edit, paste-auto-render). You cannot prove lossless serialisation of a node you
haven't modelled, so the nodes must exist before the foundation is signed off.

### 6.4 Inline LaTeX + click-to-edit (problem 1b)
- Formulas render inline as KaTeX (no view-zone boxes).
- **Click a formula → `FormulaModal` in edit mode:** pre-filled LaTeX source with the live KaTeX
  result **below**; Save rewrites that node; Cancel leaves it. This requires extending
  `FormulaModal` from insert-only to **insert-or-edit** (`initialLatex`, `initialDisplayMode`,
  `mode`, `onSubmit(latex, displayMode)`), which it structurally already supports (it renders a live
  preview today).

### 6.5 Inline themed code + click-to-edit (problems 1b + 2)
- Code blocks render via `CodeBlock` (themed, read-only) in the flow.
- **Click → reveal the fenced source** for editing (either an inline editable code area or a small
  popup mirroring the formula flow — pick one and keep it consistent); on blur/save it re-renders
  themed. A language affordance maps to the ` ```lang ` fence.

### 6.6 Toolbar, styles, images, social links
- Re-wire `EditorNavbar`'s toolbar (bold/italic/strike/code, the `Body ▾` style dropdown, image,
  formula, social-link) to editor commands instead of Monaco `executeEdits`.
- Port image insert/hover/replace/delete and the `draft://` queue to editor image nodes
  (`useEditorImages` keeps its upload logic; only the insert/replace call sites change).
- `SocialLinkModal` inserts a RichPopover node instead of a raw string.

### 6.7 Clipboard & paste behaviour

**Why copy-paste is broken today.** The Monaco editor hides each rendered formula's raw `$…$` text
with `.monaco-latex-hidden { opacity:0; pointer-events:none; user-select:none }`
([AdminEditor.module.css:115](../../src/pages/admin/AdminEditor.module.css)), while the visible KaTeX
sits in a Monaco **view-zone** that is *not* part of the editable model. So a selection touching a
formula can neither include the raw source (`user-select:none`) nor copy the rendered math (it isn't
model text) — selecting/copying across a formula yields nothing usable. Monaco's own right-click
**Paste** item is additionally blocked by browser clipboard policy (only Ctrl/Cmd+V reads the
clipboard), which reads as "paste doesn't work". The WYSIWYG rewrite **deletes this whole hack** — no
hidden text, no view-zone — so the bug class disappears.

**Target behaviour (explicit acceptance, not assumed):**
- **Copy / cut / paste** work via keyboard *and* the browser's native context menu — the editor is
  contenteditable-based (ProseMirror/Milkdown), so the browser handles the clipboard natively.
- **Copying a rendered formula / code block** puts its Markdown source (`$…$`, `$$…$$`, fenced block)
  on the clipboard — the selected doc slice serialises back to Markdown — so it round-trips on paste.
- **Pasting text that contains LaTeX auto-renders it** (the author's explicit ask). This is **not**
  ProseMirror's default — plain-text paste would insert literal `$x^2$`. Configure the editor so
  pasted **plain text is parsed as Markdown** (Milkdown supports a paste-as-Markdown flow) and/or add
  paste + input rules that turn `$…$` / `$$…$$` into math nodes on paste. The same applies to pasted
  fenced code (` ```lang ` → themed code node) and other Markdown constructs.
- Pasting rich HTML (e.g. from a webpage) maps to the nearest supported nodes; unsupported content
  degrades to text rather than being dropped.

Delivered by **T-036** (copy/cut/paste + paste-as-Markdown for standard constructs) and **T-037**
(paste-auto-render for LaTeX and code, plus copy-yields-source).

### 6.8 Retire the eye icon
- Once 6.1–6.7 land, remove the preview button from `EditorNavbar` and the `PreviewModal` mount from
  `AdminEditor.jsx`. Either delete `PreviewModal` or repurpose it as a plain fullscreen `NoteReader`
  wrapper (cheap, occasionally nice for a distraction-free read). Keep `NoteReader` regardless.

### 6.9 Acceptance
- Typing `## X` shows a rendered H2; `**b**` shows bold; `$$…$$` shows centred KaTeX; a fenced block
  shows the themed `CodeBlock` — all inline, no raw syntax left visible for supported constructs.
- Copy/cut/paste work via keyboard and the browser's native context menu; selecting across a formula
  copies its `$…$` source (the current Monaco selection bug is gone).
- Pasting text containing `$…$` / `$$…$$` renders it inline (no raw LaTeX visible); pasting a fenced
  block renders the themed code node.
- Round-trip: load an existing note, make no change, serialise → **byte-identical** Markdown.
- Save/registry/image-upload behave exactly as before (same commits, same `modules.js` edits).
- The editor content column is visually identical to `NoteReader`.

---

## 7. Design & standards constraints
- JS-only in `src/` (`.jsx`); CSS Modules per component; no global CSS outside
  `src/styles/global.css` (`docs/rules.md`).
- Brand tokens from `src/constants/colors.js` / `docs/design/colors.md`. Exception: the reused social
  `CodeBlock` keeps its neon hex (§5.2).
- Feature-first placement: reader is shared UI → `src/components/markdown/NoteReader/`; the WYSIWYG
  editor and its pieces live with the admin editor (`src/pages/admin/` + `src/hooks/` or a new
  `src/components/admin/NoteEditor/`), matching current structure.

---

## 8. Risks & mitigations
| Risk | Mitigation |
|---|---|
| Lossy Markdown round-trip (custom nodes mangled) | Library spike (§6.1) gates the migration; golden-file round-trip test over every existing note in `src/content/notes/`. |
| RichPopover custom syntax breaks | Treat as a first-class node with explicit parse + serialize; test a note containing one. |
| Image `draft://` queue regresses | Keep `useEditorImages` upload logic; only swap insert/replace call sites; test the upload-on-save path. |
| Big-bang editor swap is risky | Phase it (§9); keep Monaco importable behind a flag until the WYSIWYG editor passes acceptance, then delete. |
| Off-brand neon code theme app-wide | Accepted per the explicit ask; note a future tokenisation pass. |

## 9. Phasing / rollout
1. **Part B** (code theme) — small, independent, ship first; de-risks the shared code look.
2. **Part A** (full-bleed reader) — independent; ship second.
3. **Part C** — spike → foundation (round-trip + basic formatting) → math+click-to-edit →
   code+click-to-edit → images/RichPopover/drafts → retire eye icon.

## 10. File-by-file change map
**New**
- `src/components/markdown/NoteReader/{NoteReader.jsx,NoteReader.module.css,index.js}`
- WYSIWYG editor component tree (under `src/components/admin/NoteEditor/` or equivalent)

**Modified**
- `src/components/markdown/MarkdownRenderer.jsx` — `code()` → social `CodeBlock`; drop `react-syntax-highlighter`.
- `src/components/markdown/MarkdownRenderer.module.css` — remove dead `.codeBlock*` rules.
- `src/pages/notes/NotesPage.jsx` — use `NoteReader`; drop `.notesContainer` card.
- `src/components/admin/PreviewModal.jsx` — use `NoteReader` (or be retired in §6.7).
- `src/pages/admin/AdminEditor.jsx` — swap Monaco for the WYSIWYG editor; drop LaTeX view-zone code.
- `src/hooks/useEditorFormatting.js` — commands instead of `executeEdits`; delete `renderInlineLaTeX`.
- `src/hooks/useEditorImages.js` — insert/replace via editor image nodes.
- `src/components/admin/FormulaModal.jsx` — add edit mode.
- `src/components/admin/SocialLinkModal.jsx` — insert RichPopover node.
- `src/components/admin/EditorNavbar.jsx` — re-wire toolbar; remove preview button (§6.7).

**Untouched (contract preserved):** `useEditorSave.js`, `useEditorModules.js`, `useEditorFiles.js`,
`useEditorDrafts.js`, `modules.js` registry format, `lib/githubApi.js`, `lib/social/codeHighlighter.js`.

## 11. Acceptance checklist
- [ ] Live code blocks match the social feed theme (§5.3).
- [ ] `NoteReader` renders identically on the live page and in the preview (§4.4).
- [ ] Live page: no warm card, no duplicated title, chrome reconciled (§4).
- [ ] Editor renders headings/bold/LaTeX/code/tables/images/RichPopover inline (§6.9).
- [ ] Click a formula → edit popup with source + live result; save updates in place (§6.4).
- [ ] Click a code block → edit source → blur re-renders themed (§6.5).
- [ ] Copy/cut/paste work (keyboard + native context menu); the current Monaco selection bug is gone (§6.7).
- [ ] Pasting LaTeX/code auto-renders it; copying a formula yields its `$…$` source (§6.7).
- [ ] Markdown round-trip is byte-stable over all existing notes (§6.9).
- [ ] Save / registry / image-upload unchanged (§6.9).
- [ ] Eye-icon preview removed or repurposed (§6.8).
- [ ] JS-only, CSS Modules, tokens respected (§7).

## 12. Ticket map
Tickets live under epic **E-004** ([epics/E-004-notes-authoring-reading-overhaul.md](../../epics/E-004-notes-authoring-reading-overhaul.md)).
Folded 2026-07-22 from an initial 8-ticket breakdown to 4 (IDs T-039–T-042 retired, not reused).

| Ticket | Scope | Parts | Size |
|---|---|---|---|
| [T-035](../../tickets/T-035-reader-parity-note-reader-and-code-theme.md) | Reader parity: full-bleed `NoteReader` + unified code-block theme | A + B | L |
| [T-036](../../tickets/T-036-wysiwyg-editor-foundation.md) | WYSIWYG foundation: replace Monaco, Markdown round-trip, formatting (incl. library spike) | C | L |
| [T-037](../../tickets/T-037-inline-wysiwyg-nodes-click-to-edit.md) | Inline nodes + click-to-edit: LaTeX, code, images, RichPopover, drafts | C | L |
| [T-038](../../tickets/T-038-retire-eye-icon-preview.md) | Retire the eye-icon preview | C | S |

**Suggested order:** T-035 (independent, ship first) → T-036 (foundation) → T-037 (inline nodes) →
T-038 (last).
