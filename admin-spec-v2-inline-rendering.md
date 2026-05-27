# admin-spec-v2-inline-rendering.md — Monaco Inline Widgets + Preview Fixes

> This document extends all previous specs.
> Covers three things:
> 1. RichPopover rendered as a visual chip inside Monaco editor
> 2. SMILES molecule SVG rendered visually inside Monaco editor
> 3. SMILES preview fix — switch from base64 img to custom tag

---

## Problem Summary

### Problem 1 — RichPopover raw JSX in Monaco
When a user inserts a social link, Monaco shows:
```
<RichPopover
  platform="youtube"
  href="https://..."
  title="My video"
  actionLabel="Watch video"
/>
```
This is intimidating for non-technical users. It should show a small
visual chip — platform icon + title — exactly like the preview does,
hiding the raw JSX.

### Problem 2 — SMILES not rendering in preview
The current insert format:
```
![benzene](data:image/svg+xml;base64,PHN2Zy...very long string...)
```
Markdown parsers (remark) have issues with extremely long URLs in image
syntax. The image silently fails to render. Fix: use a custom tag
`<MoleculeStructure />` handled the same way as `<RichPopover />` in
`MarkdownRenderer`.

### Problem 3 — SMILES raw base64 in Monaco
Same problem as RichPopover — users see a huge unreadable base64 string.
Should show the actual molecule SVG image.

---

## Solution Overview

All three fixes use the same two patterns already in the codebase:

**Pattern A — Monaco view zones** (from `renderInlineLaTeX`):
Scan text with regex → inject DOM node → hide raw text with decoration
→ click to edit

**Pattern B — MarkdownRenderer custom tag splitting** (from
`splitContentByRichPopovers`):
Split content string by custom tags → render React component per tag

---

## Fix 1 — SMILES Insert Format Change

### Current format (broken)
```
![benzene](data:image/svg+xml;base64,PHN2Zy...)
```

### New format (fixed)
```
<MoleculeStructure alt="benzene" data="PHN2Zy..." />
```

This is a one-line change in `ChemModal.jsx`. The `onInsert` call
for structures changes from:

```js
// OLD
onInsert(`![${input}](${dataUrl})`)

// NEW — strip the data:image/svg+xml;base64, prefix, store just the base64
const base64 = dataUrl.replace('data:image/svg+xml;base64,', '')
onInsert(`<MoleculeStructure alt="${input.trim()}" data="${base64}" />`)
```

---

## Fix 2 — MarkdownRenderer: MoleculeStructure support

### Extend `splitContentByRichPopovers`

Rename to `splitContentByCustomTags` and extend it to also handle
`<MoleculeStructure ... />` tags:

```js
function splitContentByCustomTags(content) {
  const parts = []
  // Match both RichPopover and MoleculeStructure tags
  const regex = /<(RichPopover|MoleculeStructure)([\s\S]*?)\/>/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'markdown',
        content: content.slice(lastIndex, match.index)
      })
    }
    const tagName = match[1]
    const props   = parseRichPopoverProps(match[2])  // reuse existing parser
    parts.push({ type: tagName.toLowerCase(), props })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'markdown', content: content.slice(lastIndex) })
  }

  return parts
}
```

### Add `MoleculeChip` component

```jsx
function MoleculeChip({ alt, data }) {
  const [error, setError] = useState(false)
  const dataUrl = `data:image/svg+xml;base64,${data}`

  if (error) {
    return (
      <span className={styles.moleculeError}>
        [molecule: {alt}]
      </span>
    )
  }

  return (
    <span className={styles.moleculeWrapper}>
      <img
        src={dataUrl}
        alt={alt}
        className={styles.moleculeImage}
        onError={() => setError(true)}
      />
      {alt && (
        <span className={styles.moleculeLabel}>{alt}</span>
      )}
    </span>
  )
}
```

### CSS for MoleculeChip

```css
.moleculeWrapper {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  margin: 8px 0;
}

.moleculeImage {
  max-width: 300px;
  max-height: 220px;
  background: #ffffff;
  border-radius: 8px;
  padding: 8px;
  border: 1px solid var(--color-border);
}

.moleculeLabel {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.moleculeError {
  color: var(--color-error);
  font-size: 12px;
  font-style: italic;
}
```

### Update top-level renderer

```jsx
function MarkdownRenderer({ content }) {
  const parts = splitContentByCustomTags(content)  // renamed function

  return (
    <div className={styles.markdownContainer}>
      {parts.map((part, i) => {
        if (part.type === 'richpopover') {
          return (
            <span key={i} className={styles.richPopoverWrapper}>
              <RichPopoverChip {...part.props} />
            </span>
          )
        }
        if (part.type === 'moleculestructure') {
          return (
            <span key={i} className={styles.moleculeBlock}>
              <MoleculeChip {...part.props} />
            </span>
          )
        }
        return (
          <ReactMarkdown
            key={i}
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={markdownComponents}
          >
            {part.content}
          </ReactMarkdown>
        )
      })}
    </div>
  )
}
```

---

## Fix 3 — Monaco Inline Rendering

Add a new exported function `renderInlineWidgets` to
`src/hooks/useEditorFormatting.js`. This follows the exact same
pattern as `renderInlineLaTeX`.

### RichPopover chip in Monaco

Detects `<RichPopover ... />` blocks, renders a platform icon + title
chip as a DOM node in a view zone, hides the raw JSX with a decoration.

```js
// Platform icon SVGs as inline strings
const PLATFORM_ICONS = {
  youtube: `<svg viewBox="0 0 16 16" width="14" height="14" fill="#ff0000">
    <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.01 2.01 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.01 2.01 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31 31 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.01 2.01 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A100 100 0 0 1 7.858 2zM6.4 5.209v4.818l4.157-2.408z"/>
  </svg>`,
  instagram: `<svg viewBox="0 0 16 16" width="14" height="14">
    <defs>
      <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#f09433"/>
        <stop offset="25%" stop-color="#e6683c"/>
        <stop offset="50%" stop-color="#dc2743"/>
        <stop offset="75%" stop-color="#cc2366"/>
        <stop offset="100%" stop-color="#bc1888"/>
      </linearGradient>
    </defs>
    <path fill="url(#ig-grad)" d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334"/>
  </svg>`,
  linkedin: `<svg viewBox="0 0 16 16" width="14" height="14" fill="#0077b5">
    <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z"/>
  </svg>`,
}
```

### `renderInlineWidgets` function

```js
export function renderInlineWidgets(editor, monaco) {
  if (!editor || !monaco) return

  const model = editor.getModel()
  if (!model) return

  const text = model.getValue()

  // ── 1. Find RichPopover tags ──────────────────────────────────────────
  const richPopoverRegex = /<RichPopover([\s\S]*?)\/>/g
  const richPopovers = []
  let match

  while ((match = richPopoverRegex.exec(text)) !== null) {
    const props = parseInlineProps(match[1])
    richPopovers.push({
      raw: match[0],
      startOffset: match.index,
      endOffset: match.index + match[0].length,
      props,
    })
  }

  // ── 2. Find MoleculeStructure tags ────────────────────────────────────
  const moleculeRegex = /<MoleculeStructure([\s\S]*?)\/>/g
  const molecules = []

  while ((match = moleculeRegex.exec(text)) !== null) {
    const props = parseInlineProps(match[1])
    molecules.push({
      raw: match[0],
      startOffset: match.index,
      endOffset: match.index + match[0].length,
      props,
    })
  }

  if (richPopovers.length === 0 && molecules.length === 0) return

  // ── 3. Track cursor position (don't hide if user is editing) ──────────
  const cursorOffset = model.getOffsetAt(editor.getPosition())

  // ── 4. Clear previous widgets ─────────────────────────────────────────
  if (editor._inlineWidgets) {
    editor._inlineWidgets.forEach(w => editor.removeContentWidget(w))
  }
  editor._inlineWidgets = []

  if (editor._inlineWidgetDecorations) {
    editor._inlineWidgetDecorations.forEach(id =>
      editor.deltaDecorations([id], [])
    )
  }
  editor._inlineWidgetDecorations = []

  if (editor._inlineViewZoneIds) {
    editor.changeViewZones(accessor => {
      editor._inlineViewZoneIds.forEach(id => accessor.removeZone(id))
    })
  }
  editor._inlineViewZoneIds = []

  // ── 5. Render RichPopover chips ───────────────────────────────────────
  const decorations = []

  editor.changeViewZones(accessor => {
    richPopovers.forEach(item => {
      const startPos = model.getPositionAt(item.startOffset)
      const endPos   = model.getPositionAt(item.endOffset)

      // Skip if cursor is inside this block (user is editing)
      if (
        cursorOffset >= item.startOffset &&
        cursorOffset <= item.endOffset
      ) return

      const platform = item.props.platform ?? 'youtube'
      const title    = item.props.title ?? 'Link'
      const iconSvg  = PLATFORM_ICONS[platform] ?? PLATFORM_ICONS.youtube

      const domNode = document.createElement('div')
      domNode.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 6px;
        cursor: pointer;
        margin: 2px 0;
        font-size: 12px;
        color: rgba(255,255,255,0.85);
        font-family: inherit;
        max-width: 320px;
      `

      const iconSpan = document.createElement('span')
      iconSpan.innerHTML = iconSvg
      iconSpan.style.display = 'flex'
      iconSpan.style.alignItems = 'center'

      const titleSpan = document.createElement('span')
      titleSpan.textContent = title
      titleSpan.style.cssText = `
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 260px;
      `

      domNode.appendChild(iconSpan)
      domNode.appendChild(titleSpan)

      domNode.addEventListener('click', () => {
        editor.setPosition({
          lineNumber: startPos.lineNumber,
          column: startPos.column,
        })
        editor.focus()
      })

      // Hide the raw text
      decorations.push({
        range: new monaco.Range(
          startPos.lineNumber, startPos.column,
          endPos.lineNumber, endPos.column
        ),
        options: {
          inlineClassName: 'monaco-inline-widget-hidden',
          stickiness:
            monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      })

      const zoneId = accessor.addZone({
        afterLineNumber: endPos.lineNumber,
        heightInPx: 32,
        domNode,
        suppressMouseDown: false,
      })
      editor._inlineViewZoneIds.push(zoneId)
    })

    // ── 6. Render MoleculeStructure images ──────────────────────────────
    molecules.forEach(item => {
      const startPos = model.getPositionAt(item.startOffset)
      const endPos   = model.getPositionAt(item.endOffset)

      if (
        cursorOffset >= item.startOffset &&
        cursorOffset <= item.endOffset
      ) return

      const alt     = item.props.alt ?? 'molecule'
      const data    = item.props.data ?? ''
      const dataUrl = `data:image/svg+xml;base64,${data}`

      const domNode = document.createElement('div')
      domNode.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        padding: 8px 0;
        cursor: pointer;
      `

      const img = document.createElement('img')
      img.src = dataUrl
      img.alt = alt
      img.style.cssText = `
        max-width: 280px;
        max-height: 200px;
        background: #ffffff;
        border-radius: 6px;
        padding: 6px;
        border: 1px solid rgba(255,255,255,0.1);
        object-fit: contain;
      `
      img.onerror = () => {
        img.style.display = 'none'
        const fallback = document.createElement('span')
        fallback.textContent = `[molecule: ${alt}]`
        fallback.style.cssText = 'color: #ef4444; font-size: 12px;'
        domNode.appendChild(fallback)
      }

      const label = document.createElement('span')
      label.textContent = alt
      label.style.cssText = `
        font-size: 11px;
        color: rgba(255,255,255,0.5);
        font-family: inherit;
      `

      domNode.appendChild(img)
      domNode.appendChild(label)

      domNode.addEventListener('click', () => {
        editor.setPosition({
          lineNumber: startPos.lineNumber,
          column: startPos.column,
        })
        editor.focus()
      })

      decorations.push({
        range: new monaco.Range(
          startPos.lineNumber, startPos.column,
          endPos.lineNumber, endPos.column
        ),
        options: {
          inlineClassName: 'monaco-inline-widget-hidden',
          stickiness:
            monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      })

      // Height based on image — estimate 200px for molecule + 20px label
      const zoneId = accessor.addZone({
        afterLineNumber: endPos.lineNumber,
        heightInPx: 230,
        domNode,
        suppressMouseDown: false,
      })
      editor._inlineViewZoneIds.push(zoneId)
    })
  })

  // Apply all decorations at once
  editor.deltaDecorations([], decorations)
}

// ── Prop parser ───────────────────────────────────────────────────────────
// Parses a string of JSX-like props into a plain object
// Handles: platform="youtube"  title="My video"  data="base64..."
function parseInlineProps(propsString) {
  const result = {}
  const regex = /(\w+)="([^"]*)"/g
  let m
  while ((m = regex.exec(propsString)) !== null) {
    result[m[1]] = m[2]
  }
  return result
}
```

### CSS — hide raw text

Add to the Monaco editor's global CSS (or inject via `editor.addStyleRule`):

```css
.monaco-inline-widget-hidden {
  display: none !important;
}
```

---

## Wiring `renderInlineWidgets` into the editor

In `useEditorFormatting.js`, `renderInlineWidgets` must be called:
- On every content change (alongside `renderInlineLaTeX`)
- On cursor position change (to re-show the raw text when cursor enters a widget)
- On editor mount

The existing `renderInlineLaTeX` call site is the right place to add it:

```js
// Wherever renderInlineLaTeX is called, add:
renderInlineLaTeX(editorRef.current, monaco)
renderInlineWidgets(editorRef.current, monaco)
```

Both functions are independent — they do not interfere with each other's
view zones or decorations because they use separate tracking arrays
(`_latexViewZoneIds` vs `_inlineViewZoneIds`).

---

## File Changes Summary

| File | Change |
|------|--------|
| `src/components/admin/ChemModal.jsx` | Change insert format to `<MoleculeStructure ... />` |
| `src/components/markdown/MarkdownRenderer.jsx` | Extend split function + add MoleculeChip component |
| `src/components/markdown/MarkdownRenderer.module.css` | Add molecule styles |
| `src/hooks/useEditorFormatting.js` | Add `renderInlineWidgets` function + call it alongside `renderInlineLaTeX` |

---

## Implementation Prompts

---

### Prompt K1 — ChemModal insert format fix

> Open `src/components/admin/ChemModal.jsx`. Find the Structure tab's
> Insert button handler — the `onInsert` call that currently inserts
> `![${input}](${dataUrl})`.
>
> Replace it with:
> ```js
> const base64 = dataUrl.replace('data:image/svg+xml;base64,', '')
> onInsert(`<MoleculeStructure alt="${input.trim()}" data="${base64}" />`)
> ```
>
> Do not change the Equation tab insert format. Do not change anything
> else in the file.

---

### Prompt K2 — MarkdownRenderer: MoleculeStructure support

> Open `src/components/markdown/MarkdownRenderer.jsx` and
> `src/components/markdown/MarkdownRenderer.module.css`.
>
> **Step 1 — Rename and extend the split function:**
> Find `splitContentByRichPopovers`. Rename it to `splitContentByCustomTags`
> everywhere it is called. Update the regex inside it to match BOTH
> `<RichPopover ... />` and `<MoleculeStructure ... />` tags. Store the
> tag name in each part object as `type: 'richpopover'` or
> `type: 'moleculestructure'` (lowercased tag name).
>
> **Step 2 — Add `MoleculeChip` component:**
> Add the `MoleculeChip` component as described in the spec. It accepts
> `{ alt, data }` props. It reconstructs the data URL as
> `data:image/svg+xml;base64,${data}`. It renders an `<img>` with white
> background, max 300px wide, border-radius 8px. On img error it shows
> `[molecule: {alt}]` in error color. Below the image show the alt text
> as a small label.
>
> **Step 3 — Update the top-level renderer:**
> In the `MarkdownRenderer` function, add a condition for
> `part.type === 'moleculestructure'` that renders `<MoleculeChip {...part.props} />`.
>
> **Step 4 — Add CSS:**
> Add `.moleculeWrapper`, `.moleculeImage`, `.moleculeLabel`,
> `.moleculeError` classes to the CSS module as described in the spec.
>
> Do not change the RichPopover rendering logic. Do not change
> `markdownComponents` or the ReactMarkdown config. Do not modify any
> other files.

---

### Prompt K3 — Monaco inline widget rendering

> Read `src/hooks/useEditorFormatting.js` in full before making changes.
>
> Add the `renderInlineWidgets` function and `parseInlineProps` helper
> and the `PLATFORM_ICONS` constant to the file, exactly as described
> in the spec. Place them after the existing `clearLatexWidgets` function.
>
> The function must:
> - Accept `(editor, monaco)` — same signature as `renderInlineLaTeX`
> - Scan for `<RichPopover ... />` and `<MoleculeStructure ... />` using
>   separate regexes
> - Use `parseInlineProps` to extract props from the matched attribute string
> - Skip any widget where the cursor is currently inside its text range
> - Clear previous widgets using `_inlineViewZoneIds`, `_inlineWidgets`,
>   `_inlineWidgetDecorations` arrays on the editor instance
> - For RichPopover: render a 32px tall view zone with platform icon SVG
>   + title text. Platform icon comes from `PLATFORM_ICONS` object.
> - For MoleculeStructure: render a 230px tall view zone with an `<img>`
>   tag using the base64 data URL, with white background, and alt text label below
> - Both types: add a `monaco-inline-widget-hidden` decoration to hide
>   the raw text
> - Both types: click handler sets cursor to start of the widget
>
> Then find where `renderInlineLaTeX` is called in the file (it should
> be called on content change and cursor change). Add
> `renderInlineWidgets(editor, monaco)` immediately after each call to
> `renderInlineLaTeX`.
>
> Add this CSS injection after the editor mounts — find where the Monaco
> editor theme is defined (the `mooner-dark` theme setup) and add
> alongside it:
> ```js
> // Inject CSS to hide raw widget text
> const styleEl = document.createElement('style')
> styleEl.textContent = '.monaco-inline-widget-hidden { display: none !important; }'
> document.head.appendChild(styleEl)
> ```
> Only inject this once — check `document.querySelector` first.
>
> Export `renderInlineWidgets` and `clearInlineWidgets` from the file.
> Do not modify `renderInlineLaTeX` or `clearLatexWidgets`.
> Do not modify any other files.
