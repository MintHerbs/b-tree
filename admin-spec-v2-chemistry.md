# admin-spec-v2-chemistry.md — Chemistry Rendering

> This document extends all previous specs.
> Covers KaTeX mhchem for chemical equations and SmilesDrawer for
> molecular structures. Both render in the editor preview and on the
> public notes page.

---

## Overview

Two rendering capabilities added:

1. **Chemical equations** via KaTeX `mhchem` extension
   - Renders balanced equations, reaction arrows, equilibrium notation
   - Uses existing KaTeX installation — one config change only

2. **Molecular structures** via SmilesDrawer
   - Converts SMILES notation to SVG diagrams
   - PubChem API converts common names to SMILES automatically
   - SVG embedded as base64 directly in markdown — no extra GitHub commits

---

## Dependencies

```bash
npm install smiles-drawer
```

KaTeX mhchem is already bundled with KaTeX — no extra install needed.

---

## KaTeX mhchem Setup

Find wherever KaTeX is configured in the codebase (likely in
`MarkdownRenderer.jsx` or a remark/rehype plugin config).

Add `mhchem` to the KaTeX options:

```js
import 'katex/contrib/mhchem'
```

This import must happen before any KaTeX render calls. Once imported,
`\ce{...}` notation works everywhere KaTeX is used.

Examples of what becomes available:
```
\ce{H2O}              → H₂O
\ce{H2SO4}            → H₂SO₄
\ce{2H2 + O2 -> 2H2O} → balanced equation with arrow
\ce{A <=> B}          → equilibrium arrows
\ce{Fe^{2+}}          → ion notation
```

---

## SmilesDrawer Integration

### How it works

```js
import SmilesDrawer from 'smiles-drawer'

// Initialize drawer with options
const drawer = new SmilesDrawer.SvgDrawer({
  width: 400,
  height: 300,
  bondThickness: 1.2,
  fontSizeLarge: 14,
  fontSizeSmall: 10,
  backgroundColor: 'transparent',
})

// Parse and draw
SmilesDrawer.parse(smilesString, (tree) => {
  // Draw to a temporary SVG element
  const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  drawer.draw(tree, svgElement, 'light')

  // Get SVG string
  const svgString = new XMLSerializer().serializeToString(svgElement)

  // Convert to base64
  const base64 = btoa(unescape(encodeURIComponent(svgString)))
  const dataUrl = `data:image/svg+xml;base64,${base64}`
})
```

### PubChem name lookup

```js
// Convert common name to SMILES via PubChem API
// Free, no API key, no rate limits for reasonable usage
async function nameToSmiles(name) {
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/property/IsomericSMILES/JSON`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Compound "${name}" not found`)
  const data = await res.json()
  return data.PropertyTable.Properties[0].IsomericSMILES
}
```

### Auto-detect name vs SMILES

```js
// SMILES strings contain chemistry-specific characters
// Names are plain words
function isSmilesString(input) {
  return /[=#@+\-\[\]\\\/\d]/.test(input) || input.includes('(')
}

// Usage:
const smiles = isSmilesString(input)
  ? input                    // already SMILES
  : await nameToSmiles(input) // convert name first
```

---

## File Structure

```
src/components/admin/
└── ChemModal.jsx              ← NEW: two-tab chemistry insertion modal
└── ChemModal.module.css       ← NEW
src/lib/
└── chemUtils.js               ← NEW: SmilesDrawer + PubChem helpers
src/hooks/
└── useChemistry.test.js       ← NEW: tests for chemUtils functions (not a hook — named for consistency)
```

---

## `chemUtils.js`

```js
// src/lib/chemUtils.js
import SmilesDrawer from 'smiles-drawer'

// Detect whether input is a SMILES string or a common name
// SMILES contain chemistry symbols: = # @ + - [ ] ( ) digits \ /
export function isSmilesString(input) {
  return /[=#@+\[\]\\\/\d]/.test(input.trim()) || input.includes('(')
}

// Convert a common chemical name to SMILES via PubChem
// Throws if the compound is not found
export async function nameToSmiles(name) {
  const encoded = encodeURIComponent(name.trim())
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encoded}/property/IsomericSMILES/JSON`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Compound "${name}" not found in PubChem`)
  const data = await res.json()
  return data.PropertyTable.Properties[0].IsomericSMILES
}

// Convert a SMILES string to a base64-encoded SVG data URL
// Returns a Promise<string> — the data:image/svg+xml;base64,... URL
export function smilesToSvgDataUrl(smilesString) {
  return new Promise((resolve, reject) => {
    const drawer = new SmilesDrawer.SvgDrawer({
      width: 400,
      height: 300,
      bondThickness: 1.2,
      fontSizeLarge: 14,
      fontSizeSmall: 10,
      backgroundColor: 'transparent',
    })

    SmilesDrawer.parse(smilesString, (tree) => {
      try {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        drawer.draw(tree, svg, 'light')
        const svgString = new XMLSerializer().serializeToString(svg)
        const base64 = btoa(unescape(encodeURIComponent(svgString)))
        resolve(`data:image/svg+xml;base64,${base64}`)
      } catch (err) {
        reject(err)
      }
    }, (err) => reject(new Error(`Invalid SMILES: ${err}`)))
  })
}

// Full pipeline: input (name or SMILES) → base64 SVG data URL
// Handles name lookup automatically
export async function inputToSvgDataUrl(input) {
  const smiles = isSmilesString(input)
    ? input.trim()
    : await nameToSmiles(input)
  return smilesToSvgDataUrl(smiles)
}
```

---

## `ChemModal.jsx`

### Props

```js
{
  open,        // boolean
  onClose,     // fn()
  onInsert,    // fn(markdownString) — called with the markdown to insert
}
```

### Layout

```
┌─────────────────────────────────────────┐
│  Chemistry                        [×]   │
├─────────────────────────────────────────┤
│  [Equation ⚗]  [Structure 🔬]          │  ← tab bar
├─────────────────────────────────────────┤
│                                         │
│  TAB 1 — Equation                       │
│                                         │
│  Chemical equation:                     │
│  ┌───────────────────────────────────┐  │
│  │ 2H2 + O2 -> 2H2O                 │  │
│  └───────────────────────────────────┘  │
│  Hint: Use -> for reaction, <=> for     │
│  equilibrium, ^ for superscript         │
│                                         │
│  Preview:                               │
│  ┌───────────────────────────────────┐  │
│  │  [KaTeX rendered equation]        │  │
│  └───────────────────────────────────┘  │
│                                         │
│                          [Insert]       │
├─────────────────────────────────────────┤
│                                         │
│  TAB 2 — Structure                      │
│                                         │
│  Molecule name or SMILES:               │
│  ┌───────────────────────────────────┐  │
│  │ benzene                           │  │
│  └───────────────────────────────────┘  │
│  e.g. "caffeine" or "C1=CC=CC=C1"      │
│                                         │
│  [Preview structure]                    │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  [SVG molecular diagram]          │  │
│  │  or error message if not found    │  │
│  └───────────────────────────────────┘  │
│                                         │
│                          [Insert]       │
└─────────────────────────────────────────┘
```

### Equation tab behaviour

- Input is a plain text field
- Live preview: re-renders KaTeX on every keystroke using
  `dangerouslySetInnerHTML` with `katex.renderToString(\`\\ce{${input}}\`)`
- KaTeX render wrapped in try/catch — shows `"Invalid equation"` in
  `colors.error` if KaTeX throws
- On Insert: calls `onInsert('$$\\ce{' + input + '}$$')` then `onClose()`

### Structure tab behaviour

- Input is a plain text field
- **Preview is NOT live** — user clicks `[Preview structure]` button to trigger
  the PubChem lookup + SmilesDrawer render (avoids hammering PubChem on every
  keystroke)
- While previewing: button shows `"Loading..."` and is disabled
- On success: SVG preview appears as `<img src={dataUrl} />`
- On error: shows error message in `colors.error`:
  - PubChem 404: `"Compound not found — try a SMILES string instead"`
  - Invalid SMILES: `"Invalid SMILES notation"`
- On Insert: calls `onInsert('![' + input + '](' + dataUrl + ')')` then
  `onClose()`
- Insert button is disabled until a preview has been successfully generated

### State

```js
const [activeTab, setActiveTab]         = useState('equation')
const [equationInput, setEquationInput] = useState('')
const [structureInput, setStructureInput] = useState('')
const [previewDataUrl, setPreviewDataUrl] = useState(null)
const [previewError, setPreviewError]   = useState(null)
const [previewing, setPreviewing]       = useState(false)
```

Reset `previewDataUrl`, `previewError` whenever `structureInput` changes
(so stale previews don't show after input is edited).

### CSS

- Modal: `position: fixed`, `inset: 0`, `z-index: 1001`
- Backdrop: `rgba(0,0,0,0.6)`
- Modal box: `width: 480px`, centered, `background: colors.surface`,
  `border: 1px solid colors.border`, `border-radius: 12px`
- Tab bar: two buttons, active tab has `border-bottom: 2px solid colors.accent`
  and `color: colors.text`, inactive has `color: colors.textMuted`
- Preview box: `min-height: 120px`, `background: #ffffff` (white background
  for SVG visibility), `border-radius: 8px`, `display: flex`,
  `align-items: center`, `justify-content: center`
- Insert button: `background: colors.accent`, `color: #ffffff`,
  `border-radius: 8px`, `padding: 8px 20px`
- All other colors from `src/constants/colors.js`

---

## Toolbar Integration

### Icon

Use `<Flask />` from `@phosphor-icons/react` for the chemistry button.
If `Flask` is not available in the installed version, use `<Atom />` or
`<TestTube />` — check which is available first.

### Placement

In `src/components/admin/FormattingToolbar.jsx` (or `EditorNavbar.jsx`
Row 2), add the chemistry button immediately after the existing
Insert Math / Formula button.

```jsx
<Tooltip label="Insert chemistry">
  <button
    onClick={() => setChemOpen(true)}
    className={styles.toolbarBtn}
  >
    <Flask size={18} />
  </button>
</Tooltip>

<ChemModal
  open={chemOpen}
  onClose={() => setChemOpen(false)}
  onInsert={handleChemInsert}
/>
```

### `handleChemInsert` in AdminEditor

```js
function handleChemInsert(markdown) {
  if (!editorRef.current) return
  const editor   = editorRef.current
  const position = editor.getPosition()
  const range = {
    startLineNumber: position.lineNumber,
    startColumn:     position.column,
    endLineNumber:   position.lineNumber,
    endColumn:       position.column,
  }
  editor.executeEdits('', [{ range, text: markdown }])
  editor.focus()
}
```

---

## Public Notes Page — Rendering

### Chemical equations

Already handled — `$$\ce{...}$$` blocks render via the existing KaTeX
setup once `mhchem` is imported. No changes needed to `MarkdownRenderer`
beyond the import.

### Molecular structures

The SVG is embedded as a base64 data URL in the `<img>` src attribute.
Standard markdown renderers handle this natively — no changes needed.

The preview box in the modal uses a white background specifically because
SVG molecular diagrams have transparent backgrounds and atom labels need
contrast. On the public notes page the image renders with whatever the
page background is — this is acceptable since the public page is dark and
carbon atom labels (which are typically omitted in skeletal formulas) use
the SVG's own styling.

---

## Tests

### `src/lib/chemUtils.test.js`

```
describe isSmilesString:
  - returns true for "C1=CC=CC=C1" (contains = and digits)
  - returns true for "CC(=O)O" (contains parentheses)
  - returns false for "benzene"
  - returns false for "sulfuric acid"
  - returns false for "water"

describe nameToSmiles:
  - calls PubChem API with encoded compound name
  - returns SMILES string on success
  - throws with descriptive message on 404
  - throws with descriptive message on network error

describe smilesToSvgDataUrl:
  - returns a string starting with "data:image/svg+xml;base64,"
  - rejects with "Invalid SMILES" message for invalid input

describe inputToSvgDataUrl:
  - calls nameToSmiles when input is a name
  - calls smilesToSvgDataUrl directly when input is SMILES
  - returns data URL on valid input
```

Mock all `fetch` calls — never hit PubChem in tests.
Mock `SmilesDrawer` entirely — never render real SVGs in tests.
Mock `document.createElementNS` and `XMLSerializer` for the SVG generation.

---

## Implementation Prompts

---

### Prompt J1 — `chemUtils.js` + mhchem setup

> Install `smiles-drawer` if it is not already in `package.json`:
> ```bash
> npm install smiles-drawer
> ```
>
> Create `src/lib/chemUtils.js` with the exact implementation from the
> "`chemUtils.js`" section of `admin-spec-v2-chemistry.md`. Export all
> four functions: `isSmilesString`, `nameToSmiles`, `smilesToSvgDataUrl`,
> `inputToSvgDataUrl`.
>
> Then find where KaTeX is imported or configured in the codebase — search
> for `katex` or `renderToString` or `rehype-katex` in the source files.
> Add `import 'katex/contrib/mhchem'` at the top of that file, before any
> KaTeX usage. This enables `\ce{...}` chemical equation notation.
>
> Do not modify any other files.

---

### Prompt J2 — `ChemModal.jsx`

> Read `admin-spec-v2-chemistry.md` in full. Confirm `src/lib/chemUtils.js`
> exists from Prompt J1.
>
> Create `src/components/admin/ChemModal.jsx` and
> `src/components/admin/ChemModal.module.css`.
>
> Props: `{ open, onClose, onInsert }`
>
> Implement exactly as described in the "`ChemModal.jsx`" section of the spec:
>
> - Two tabs: Equation and Structure
> - Equation tab: live KaTeX preview using `katex.renderToString` wrapped
>   in try/catch, inserts `$$\ce{input}$$` on confirm
> - Structure tab: manual preview trigger (not live) — clicking
>   `[Preview structure]` calls `inputToSvgDataUrl` from `chemUtils.js`,
>   shows SVG in an `<img>` tag, Insert button disabled until preview succeeds
> - All state resets when modal closes (`onClose` called)
> - `previewDataUrl` and `previewError` reset when `structureInput` changes
> - Preview box has white (`#ffffff`) background for SVG visibility
> - KaTeX equation errors shown in `colors.error`
> - PubChem/SMILES errors shown in `colors.error`
> - Insert button: `background: colors.accent`
> - Tab active state: `border-bottom: 2px solid colors.accent`
>
> Icon for tabs from `@phosphor-icons/react`:
> - Equation tab: `<Equation />` or `<MathOperations />` — use whichever exists
> - Structure tab: `<Atom />` or `<Flask />` — use whichever exists
>
> Check which icons are available before using them.
> All colors from `src/constants/colors.js`.
> Do not modify any existing files.

---

### Prompt J3 — Toolbar button + AdminEditor wiring

> Read `admin-spec-v2-chemistry.md`. Confirm `ChemModal.jsx` exists.
>
> **Part 1 — Toolbar button:**
> In the formatting toolbar (either `src/components/admin/FormattingToolbar.jsx`
> or `src/components/admin/EditorNavbar.jsx` Row 2 — search for where the
> Formula/Math button currently lives), add the chemistry button immediately
> after it.
>
> Use `<Flask size={18} />` from `@phosphor-icons/react`. If `Flask` is not
> available, check for `Atom`, `TestTube`, or `Beaker` and use whichever
> exists. Wrap in a `@radix-ui/react-tooltip` with label `"Insert chemistry"`.
>
> The button calls `onChemClick` prop (or equivalent — match the existing
> pattern used by the formula button).
>
> **Part 2 — AdminEditor wiring:**
> In `src/hooks/useEditorState.js`, add:
> ```js
> const [chemOpen, setChemOpen] = useState(false)
> ```
>
> In `src/pages/admin/AdminEditor.jsx` (the shell), add:
> - Import `ChemModal`
> - Mount `<ChemModal open={chemOpen} onClose={() => setChemOpen(false)} onInsert={handleChemInsert} />`
> - Implement `handleChemInsert` as described in the spec — inserts the
>   markdown string at the current cursor position via `editorRef.current.executeEdits`
> - Pass `onChemClick={() => setChemOpen(true)}` to the toolbar
>
> Do not modify `ChemModal.jsx` or `chemUtils.js`.

---

### Prompt J4 — Tests

> Read `admin-spec-v2-chemistry.md`, specifically the "Tests" section.
> Confirm `src/lib/chemUtils.js` exists.
>
> Create `src/lib/chemUtils.test.js`.
>
> Rules:
> - Mock all `fetch` calls with `vi.fn()` — never call PubChem in tests
> - Mock `SmilesDrawer` entirely:
>   ```js
>   vi.mock('smiles-drawer', () => ({
>     default: {
>       SvgDrawer: vi.fn().mockImplementation(() => ({
>         draw: vi.fn(),
>       })),
>       parse: vi.fn((smiles, success, error) => {
>         if (smiles === 'INVALID') error('bad smiles')
>         else success({})
>       }),
>     }
>   }))
>   ```
> - Mock `document.createElementNS` to return a plain object
> - Mock `XMLSerializer` to return `{ serializeToString: vi.fn(() => '<svg></svg>') }`
> - PubChem success mock response:
>   ```js
>   {
>     PropertyTable: {
>       Properties: [{ IsomericSMILES: 'C1=CC=CC=C1' }]
>     }
>   }
>   ```
> - PubChem 404 mock: `{ ok: false, status: 404 }`
>
> Write all tests listed in the "Tests" section of the spec.
> Use `describe` blocks per function name.
> Use `beforeEach(() => vi.clearAllMocks())`.
>
> After writing the tests, run `npm test -- --run src/lib/chemUtils.test.js`
> and report pass/fail counts and exact error messages for any failures.
> Do not fix failures — report only.
