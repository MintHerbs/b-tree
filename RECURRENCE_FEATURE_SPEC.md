# Feature Spec: Recurrence Relation Solver
## Tree Method + Substitution Method — Pure Algorithmic

---

## Overview

A new tool under the Algorithms sidebar group at `/algo/recurrence`.
Student inputs a recurrence formula like `T(n) = T(n-1) + log(n)`.
The tool solves it using either the Tree Method or Substitution Method.

**Left panel:** SVG recursion tree (tree method) or LaTeX formulas (substitution method)
**Right panel:** Step-by-step terminal derivation (reuses ComplexityTerminal)
**No LLM.** Entirely algorithmic — parser + solver + summation identity lookup.

---

## 1. Files to Create

```
feature_documentation/
  recursion_engine.md              ← this file documents the engine

src/lib/algo/
  recurrenceParser.js              ← parses "T(n) = T(n-1) + log(n)" strings
  recurrenceSolver.js              ← tree + substitution methods + summation
  recurrenceTypes.js               ← summation identities lookup table

src/components/algo/
  MathSymbolBar/
    MathSymbolBar.jsx              ← math operation buttons (+, -, ×, ÷, ^)
    MathSymbolBar.module.css
  RecurrenceInput/
    RecurrenceInput.jsx            ← expanding pill + symbol bar + method dropdown
    RecurrenceInput.module.css
  RecurrenceTreeView/
    RecurrenceTreeView.jsx         ← SVG tree with zoom in/out
    RecurrenceTreeView.module.css
  RecurrenceSubstitutionView/
    RecurrenceSubstitutionView.jsx ← LaTeX formula display using KaTeX
    RecurrenceSubstitutionView.module.css

src/pages/
  RecurrencePage.jsx
  RecurrencePage.module.css
```

**Files to modify:**
- `src/App.jsx` — add route `/algo/recurrence`
- Sidebar — add "Recurrence Relation" child under Algorithms group

**Shared components (do NOT recreate):**
- `ComplexityTerminal` — right panel, reuse as-is

**Dependency to install:**
```
npm install katex
```

---

## 2. Routing

```jsx
const RecurrencePage = lazy(() =>
  new Promise(resolve =>
    setTimeout(() => resolve(import('./pages/RecurrencePage')), 300)
  )
);

// Inside <Routes>:
<Route path="/algo/recurrence" element={<RecurrencePage onAIStateChange={setAiState} />} />
```

Add `import('./pages/RecurrencePage')` to the background preload useEffect.

---

## 3. Sidebar

Add a second child under the existing **Algorithms** group:

| Label | Route | Icons |
|---|---|---|
| O Complexity | `/algo/complexity` | COMPLEXITY_OFF/HOVER/ON (existing) |
| Recurrence Relation | `/algo/recurrence` | RECURRENCE_OFF/HOVER/ON (need SVGs) |

Same icon state behaviour as all other children.

---

## 4. Engine Layer — `src/lib/algo/`

### 4a. `recurrenceTypes.js`

Exports the summation identity lookup table. This is the core "intelligence"
of the solver — every identity your teacher uses is a table entry.

```js
export const SUMMATION_IDENTITIES = [
  {
    id: 'constant_sum',
    // c + c + ... + c  (n terms)
    detect: (terms) => allConstant(terms),
    formula: 'n × c',
    simplified: 'n',
    complexity: 'n',
    explanation: 'Sum of n constants = O(n)',
  },
  {
    id: 'arithmetic_series',
    // 1 + 2 + 3 + ... + n
    detect: (terms) => isArithmeticSeries(terms),
    formula: 'n(n+1)/2',
    simplified: 'n²/2',
    complexity: 'n2',
    explanation: 'Arithmetic series: n(n+1)/2 = O(n²)',
  },
  {
    id: 'sum_of_squares',
    // 1² + 2² + ... + n²
    detect: (terms) => isSumOfSquares(terms),
    formula: 'n(n+1)(2n+1)/6',
    simplified: 'n³/6',
    complexity: 'n3',
    explanation: 'Sum of squares: n(n+1)(2n+1)/6 = O(n³)',
  },
  {
    id: 'log_factorial',
    // log(1) + log(2) + ... + log(n) = log(n!)
    detect: (terms) => isLogSum(terms),
    formula: 'log(n!)',
    simplified: 'n log n',
    complexity: 'n_log_n',
    explanation: 'Sum of logarithms = log(n!). By Stirling\'s approximation: log(n!) = Θ(n log n)',
  },
  {
    id: 'geometric_growing',
    // 1 + r + r² + ... + r^k where r > 1
    detect: (terms) => isGeometricGrowing(terms),
    formula: '(r^(k+1) − 1) / (r − 1)',
    // dominated by last term: O(r^k)
    complexity: (r, k) => computeGeometric(r, k),
    explanation: 'Geometric series (r > 1): dominated by last term',
  },
  {
    id: 'geometric_shrinking',
    // n + n/2 + n/4 + ... + 1
    detect: (terms) => isGeometricShrinking(terms),
    formula: '2n',
    complexity: 'n',
    explanation: 'Geometric series (r < 1): converges to O(n)',
  },
  {
    id: 'repeated_n_logn_times',
    // n + n + n + ... (log n times)
    detect: (terms) => isRepeatedNLogTimes(terms),
    formula: 'n × log n',
    complexity: 'n_log_n',
    explanation: 'n repeated log(n) times = O(n log n)',
  },
  {
    id: 'harmonic_series',
    // 1 + 1/2 + 1/3 + ... + 1/n
    detect: (terms) => isHarmonicSeries(terms),
    formula: 'ln(n) + γ',
    complexity: 'log_n',
    explanation: 'Harmonic series ≈ O(log n)',
  },
];
```

Each identity has a `detect` function that receives the symbolic terms
collected from the tree/substitution and returns true if it matches.

Also export the complexity display/short maps (can import from
complexityTypes.js or duplicate the subset needed).

---

### 4b. `recurrenceParser.js`

Parses formula strings into a structured object.

**Input formats to handle:**

```
T(n) = T(n-1) + log(n)
T(n) = T(n-1) + n
T(n) = T(n-1) + n^2
T(n) = T(n-1) + 1
T(n) = 2T(n/2) + n
T(n) = 2T(n/2) + n^2
T(n) = 2T(n/2) + 1
T(n) = 3T(n/3) + n
T(n) = T(n/2) + 1
T(n) = T(n/2) + n
T(n) = 4T(n/2) + n
T(n) = T(n-1) + T(n-2) + 1   ← Fibonacci special case
```

**Export:** `parseRecurrence(formulaStr)`

**Return shape:**
```js
{
  type: 'subtract' | 'divide' | 'fibonacci',
  a: number,           // number of recursive calls (coefficient)
  subproblem: string,  // 'n-1', 'n/2', 'n/3' etc
  b: number,           // divisor (for divide type) or subtractor
  f: string,           // non-recursive work: '1', 'n', 'n^2', 'log(n)'
  fComplexity: string, // complexity key of f: '1', 'n', 'n2', 'log_n'
  original: string,    // original formula string
  error?: string,
}
```

**Parsing approach:**

1. Trim whitespace, normalise: `T (n)` → `T(n)`
2. Split on `=` to get left and right sides
3. On right side: find all `T(...)` terms with optional coefficient
   - Regex: `/(\d*)T\(([^)]+)\)/g`
   - Extract coefficient (default 1) and argument
4. Everything remaining after removing T terms is f(n)
5. Classify:
   - Argument contains `/` → type 'divide', extract b
   - Argument contains `-` → type 'subtract', extract decrement
   - Multiple different T arguments → type 'fibonacci' or special

**Also export:** `textToLatex(text)` — converts plain text formula to LaTeX string

```js
export function textToLatex(text) {
  let latex = text;
  // T(expr) → T(expr) — already valid LaTeX
  // a/b → \frac{a}{b}   (only simple fractions, not inside T())
  // n^k → n^{k}
  // log(x) → \log(x)
  // * → \times
  // ... → \cdots
  // sqrt(x) → \sqrt{x}
  // >= → \geq, <= → \leq
  return latex;
}
```

---

### 4c. `recurrenceSolver.js`

Exports two functions:

```js
export function solveByTree(parsed)       // returns { tree, steps, finalComplexity }
export function solveBySubstitution(parsed) // returns { formulas, steps, finalComplexity }
```

#### Tree method: `solveByTree(parsed)`

**1. Build tree data structure**

For subtract type (T(n) = T(n-1) + f(n)):

```js
// Show first 3 levels explicitly, then dots, then last 2 levels
const tree = {
  nodes: [
    { id: 'n0', label: 'T(n)', type: 'recursive', x: 0, y: 0, level: 0 },
    { id: 'l0', label: 'log(n)', type: 'leaf', x: 0, y: 0, level: 0 },
    { id: 'n1', label: 'T(n−1)', type: 'recursive', x: 0, y: 0, level: 1 },
    { id: 'l1', label: 'log(n−1)', type: 'leaf', x: 0, y: 0, level: 1 },
    { id: 'n2', label: 'T(n−2)', type: 'recursive', x: 0, y: 0, level: 2 },
    { id: 'l2', label: 'log(n−2)', type: 'leaf', x: 0, y: 0, level: 2 },
    { id: 'n3', label: 'T(n−3)', type: 'recursive', x: 0, y: 0, level: 3 },
    // dots node
    { id: 'dots', type: 'dots', x: 0, y: 0 },
    // base cases
    { id: 'n_end2', label: 'T(2)', type: 'recursive', x: 0, y: 0 },
    { id: 'l_end2', label: 'log(2)', type: 'leaf', x: 0, y: 0 },
    { id: 'n_end1', label: 'T(1)', type: 'recursive', x: 0, y: 0 },
    { id: 'l_end1', label: 'log(1)', type: 'leaf', x: 0, y: 0 },
    { id: 'n_base', label: 'T(0)', type: 'base', x: 0, y: 0 },
  ],
  edges: [
    { from: 'n0', to: 'l0' },
    { from: 'n0', to: 'n1' },
    { from: 'n1', to: 'l1' },
    { from: 'n1', to: 'n2' },
    // ...
  ],
}
```

**2. Position nodes** — use the exact layout from the SVG reference:

For subtract type:
```
LEVEL_HEIGHT = 70
X_SHIFT_RIGHT = 105    // T nodes drift right each level
X_LEAF_OFFSET = 115    // leaf sits this far left of parent
START_X = 165
START_Y = 55

T(n)   at (165, 55)     → leaf log(n)   at (65, 125)
T(n-1) at (285, 125)    → leaf log(n-1) at (170, 195)
T(n-2) at (390, 195)    → leaf log(n-2) at (285, 265)
T(n-3) at (470, 265)
[dots]  at (470, 335)
T(2)    at (470, 390)    → leaf log(2)   at (365, 460)
T(1)    at (525, 460)    → leaf log(1)   at (420, 530)
T(0)    at (570, 530)
```

For divide type (T(n) = aT(n/b) + f(n)):
```
Standard binary/n-ary tree layout
Root at center top
Children spread horizontally, each level doubles the spread
Show 3-4 levels then dots
```

**3. Collect sum terms** — traverse all leaf nodes:

```
['log(n)', 'log(n-1)', 'log(n-2)', ..., 'log(2)', 'log(1)']
```

**4. Identify summation pattern** — run through SUMMATION_IDENTITIES:

```
isLogSum(['log(n)', 'log(n-1)', ..., 'log(1)']) → true
→ formula: 'log(n!)'
→ By Stirling: O(n log n)
```

**5. Build steps for ComplexityTerminal:**

```js
steps = [
  { text: 'Parsed: T(n) = T(n−1) + log(n)', type: 'info' },
  { text: 'Form: subtract type (n−1), work per level: log(k)', type: 'info' },
  { text: 'Building recursion tree...', type: 'info' },
  { text: '', type: 'divider' },
  { text: 'Level 0:  log(n)', type: 'loop' },
  { text: 'Level 1:  log(n−1)', type: 'loop' },
  { text: 'Level 2:  log(n−2)', type: 'loop' },
  { text: '⋮', type: 'info' },
  { text: 'Level n−1: log(1)', type: 'loop' },
  { text: '', type: 'divider' },
  { text: 'Summing all levels:', type: 'info' },
  { text: 'log(n) + log(n−1) + ... + log(2) + log(1)', type: 'combine_nested' },
  { text: '', type: 'divider' },
  { text: 'Recognized: sum of logarithms', type: 'special' },
  { text: '= log(n × (n−1) × ... × 2 × 1)', type: 'special' },
  { text: '= log(n!)', type: 'special' },
  { text: 'By Stirling\'s approximation: log(n!) = Θ(n log n)', type: 'special' },
  { text: '─────────────────────────────────', type: 'divider' },
  { text: 'FINAL COMPLEXITY: O(n log n)', type: 'final', complexity: 'n_log_n' },
]
```

#### Substitution method: `solveBySubstitution(parsed)`

**1. Generate substitution formulas** — array of LaTeX strings for left panel:

For `T(n) = T(n-1) + log(n)`:

```js
formulas = [
  { latex: 'T(n) = T(n-1) + \\log(n)', label: 'Given' },
  { latex: 'T(n-1) = T(n-2) + \\log(n-1)', label: 'Replace n with n-1' },
  { latex: 'T(n) = T(n-2) + \\log(n-1) + \\log(n)', label: 'Substitute back' },
  { latex: 'T(n-2) = T(n-3) + \\log(n-2)', label: 'Replace n with n-2' },
  { latex: 'T(n) = T(n-3) + \\log(n-2) + \\log(n-1) + \\log(n)', label: 'Substitute back' },
  { latex: '\\text{After } k \\text{ substitutions:}', label: 'Pattern' },
  { latex: 'T(n) = T(n-k) + \\sum_{i=1}^{k} \\log(n-i+1)', label: 'General form' },
  { latex: 'n - k = 0 \\implies k = n', label: 'Set base case' },
  { latex: 'T(n) = T(0) + \\log(1) + \\log(2) + \\cdots + \\log(n)', label: 'Expand' },
  { latex: '= T(0) + \\log(n!)', label: 'Log product rule' },
  { latex: '= O(n \\log n)', label: 'By Stirling\'s approximation' },
]
```

**2. Build terminal steps** — same format as tree method but describing substitution:

```js
steps = [
  { text: 'Parsed: T(n) = T(n−1) + log(n)', type: 'info' },
  { text: 'Method: Substitution (back-substitution)', type: 'info' },
  { text: '', type: 'divider' },
  { text: 'Substituting n → n−1:', type: 'loop' },
  { text: '  T(n−1) = T(n−2) + log(n−1)', type: 'combine_nested' },
  { text: 'Back-substituting into T(n):', type: 'loop' },
  { text: '  T(n) = T(n−2) + log(n−1) + log(n)', type: 'combine_nested' },
  { text: 'Substituting n → n−2:', type: 'loop' },
  { text: '  T(n−2) = T(n−3) + log(n−2)', type: 'combine_nested' },
  { text: 'Back-substituting:', type: 'loop' },
  { text: '  T(n) = T(n−3) + log(n−2) + log(n−1) + log(n)', type: 'combine_nested' },
  { text: '', type: 'divider' },
  { text: 'General pattern after k steps:', type: 'special' },
  { text: '  T(n) = T(n−k) + Σ log(n−i+1) for i=1..k', type: 'special' },
  { text: 'Setting base case: n − k = 0 → k = n', type: 'special' },
  { text: '  T(n) = T(0) + log(1) + log(2) + ... + log(n)', type: 'special' },
  { text: '', type: 'divider' },
  { text: 'Recognized: log(n!) by log product rule', type: 'special' },
  { text: 'By Stirling: log(n!) = Θ(n log n)', type: 'special' },
  { text: '─────────────────────────────────', type: 'divider' },
  { text: 'FINAL COMPLEXITY: O(n log n)', type: 'final', complexity: 'n_log_n' },
]
```

---

## 5. Component Layer

### 5a. `MathSymbolBar`

Based on the existing `SymbolBar` from the logic page. Read
`src/components/logic/SymbolBar/` first and copy its visual pattern.

**Buttons:** `+`  `−`  `×`  `÷`  `^`  `log`  `(`  `)`  `T(n)`

**Props:** `{ onInsert(symbol) }`

**Behaviour:**
- Clicking a button calls onInsert with the symbol text
- `^` inserts `^` character — the LaTeX preview renders it as superscript
- `÷` inserts `/` — the LaTeX preview renders fractions
- `T(n)` inserts `T(n)` as a shortcut
- `log` inserts `log(`

Same dark styling as SymbolBar — compact row of small buttons.

---

### 5b. `RecurrenceInput`

Expanding pill input based on CodePillInput pattern.

**Props:** `{ onSubmit(formula, method), onAIStateChange(state) }`

**Layout inside the pill:**
```
┌──────────────────────────────────────┐
│  T(n) = T(n-1) + log(n)         [→] │  ← textarea + send button
│                                      │
│  LaTeX preview: T(n) = T(n-1)+log(n) │  ← KaTeX rendered (only when has content)
│                                      │
│  [+] [−] [×] [÷] [^] [log] [( )] [T]│  ← MathSymbolBar (only when has content)
└──────────────────────────────────────┘
```

**Expanding behaviour:**
- Empty: single-line pill (border-radius: 9999px)
- Has content: expands to show LaTeX preview + symbol bar below
  - border-radius transitions to 20px
  - Symbol bar and preview appear with smooth animation

**KaTeX live preview:**
- Import KaTeX CSS: `import 'katex/dist/katex.min.css'`
- Use `katex.renderToString(textToLatex(inputValue))` to generate HTML
- Display via `dangerouslySetInnerHTML` in a preview div
- Preview updates on every keystroke
- If KaTeX throws (invalid formula), show the raw text instead

**Method selector (below the pill, outside it):**
- Text: "Method: **tree**" — tree is bold and clickable
- On click: dropdown appears with two options: "Tree" and "Substitution"
- Selected option shown in bold
- Default: tree
- Same compact dropdown style as B+ Tree order selector

---

### 5c. `RecurrenceTreeView`

SVG recursion tree displayed in the left panel (replaces ComplexityCodeView).

**Props:** `{ tree, formula }`

`tree` is the object returned by `solveByTree(parsed).tree` containing
`nodes` and `edges` arrays with pre-computed x,y positions.

**Node types and dark-theme colours:**

| Type | Fill | Stroke | Text colour |
|---|---|---|---|
| `recursive` (T nodes) | `rgba(139,92,246,0.15)` | `#8B5CF6` | `#c4b5fd` |
| `leaf` (log/f nodes) | `rgba(34,197,94,0.15)` | `#22c55e` | `#86efac` |
| `base` (T(0)) | `rgba(107,114,128,0.15)` | `#6b7280` | `#9ca3af` |
| `dots` | no box | — | `#6b7280` |

**Node rendering:**
- Rounded rectangles (rx=6) — NOT circles
- Label text centered inside the box
- Box width: auto-sized to fit label + 16px padding
- Box height: 28px

**Edge rendering:**
- Simple straight lines from parent center-bottom to child center-top
- Stroke: `#555`, width: 1.5

**Dots rendering:**
- 3 filled circles (r=2.5) vertically spaced between the last explicit node
  and the base case nodes

**Zoom controls:**
- Two buttons in the top-right corner of the panel: [+] and [−]
- Zoom state: min 0.4, max 2.0, step 0.2
- Apply via CSS transform: `scale(zoom)` on the SVG container
- Mouse wheel should also zoom (with ctrl/cmd held)
- Pan: click and drag to move the tree around (track translateX/Y in state)
- Reset: double-click resets zoom to 1.0 and position to center

**SVG viewBox:** compute from the node positions — add 60px padding all around.

**Container:** same rounded card as ComplexityCodeView — dark background,
border, border-radius 14px, flex:1.

---

### 5d. `RecurrenceSubstitutionView`

Displays LaTeX-rendered substitution formulas in the left panel.

**Props:** `{ formulas }`

`formulas` is the array returned by `solveBySubstitution(parsed).formulas`
— each item has `{ latex, label }`.

**Rendering:**
- Scrollable vertical list
- Each formula: a row with:
  - Left: label text in muted colour (e.g. "Replace n with n−1")
  - Below: KaTeX-rendered formula, larger font
- Use `katex.renderToString(formula.latex, { throwOnError: false })`
- Display via `dangerouslySetInnerHTML`
- Add a subtle divider between formula groups

**KaTeX colour override:**
KaTeX renders in black by default. Override in CSS:
```css
.katex { color: #e2e8f0; }
.katex .mord { color: #e2e8f0; }
```

**Container:** same rounded card as the tree view — dark background,
border, border-radius 14px, flex:1.

---

## 6. `RecurrencePage.jsx`

**Props:** `{ onAIStateChange }`

**State:**
- `view`: `'input'` | `'result'`
- `formula`: string
- `method`: `'tree'` | `'substitution'`
- `result`: object from solver or null

**Input view:**
- Starfield + Navbar (no props)
- HeroText with title "Recurrence Relation" (same purple glow + scramble)
- Subtitle: "Enter your recurrence formula" (same scramble)
- RecurrenceInput
- Same centering and spacing as ComplexityPage and TreePage

**handleSubmit(formula, method):**
1. Parse: `parseRecurrence(formula)`
2. If parse error: show error state
3. If method === 'tree': `solveByTree(parsed)`
4. If method === 'substitution': `solveBySubstitution(parsed)`
5. Set result, switch to result view, `onAIStateChange('idle')`

**Result view:**
- Starfield + Navbar with showTitle, showResult, showNewFormula
- Same split panel layout as ComplexityPage (two rounded cards with gap)
- Left panel: `RecurrenceTreeView` or `RecurrenceSubstitutionView` based on method
- Right panel: `ComplexityTerminal` (reused, not recreated)

**CSS:** Copy ComplexityPage.module.css pattern — same splitPanel, leftPanel,
rightPanel dimensions. Account for sidebar offset.

---

## 7. Example Solver Walkthroughs

### Example 1: T(n) = T(n-1) + n (arithmetic series)

Terminal:
```
▸ Parsed: T(n) = T(n−1) + n
▸ Building recursion tree...
  Level 0:  n
  Level 1:  n−1
  Level 2:  n−2
  ⋮
  Level n−1: 1
▸ Summing: n + (n−1) + (n−2) + ... + 1
⚡ Recognized: arithmetic series
  = n(n+1)/2
⚡ Drop constants → O(n²)
FINAL COMPLEXITY: O(n²)
```

### Example 2: T(n) = 2T(n/2) + n (merge sort)

Terminal:
```
▸ Parsed: T(n) = 2T(n/2) + n
▸ Divide type: a=2, b=2, f(n) = n
▸ Building recursion tree...
  Level 0: 1 node  × n     = n
  Level 1: 2 nodes × n/2   = n
  Level 2: 4 nodes × n/4   = n
  ⋮
  Height: log₂(n) levels
▸ Each level does O(n) work
▸ n repeated log(n) times
⚡ = n × log n = O(n log n)
FINAL COMPLEXITY: O(n log n)
```

### Example 3: T(n) = T(n-1) + 1 (linear)

Terminal:
```
▸ Parsed: T(n) = T(n−1) + 1
▸ Building recursion tree...
  Level 0: 1
  Level 1: 1
  Level 2: 1
  ⋮ (n levels)
▸ Summing: 1 + 1 + ... + 1 (n times)
⚡ Recognized: sum of constants
  = n × 1 = n
FINAL COMPLEXITY: O(n)
```

---

## 8. Summation Detection Logic

The detect functions in recurrenceTypes.js work on symbolic terms.
Each term is an object: `{ fn: 'log'|'power'|'const'|'reciprocal', arg: 'n'|'n-k', exponent: number }`.

| Function | f(n) text | Term shape |
|---|---|---|
| constant | `1`, `5`, `c` | `{ fn: 'const', value: 1 }` |
| linear | `n`, `n-1` | `{ fn: 'power', exponent: 1 }` |
| quadratic | `n^2` | `{ fn: 'power', exponent: 2 }` |
| logarithmic | `log(n)` | `{ fn: 'log' }` |
| reciprocal | `1/n` | `{ fn: 'reciprocal' }` |

Detection:
- All terms are `{ fn: 'const' }` → constant_sum
- Terms are `n, n-1, n-2, ...` → arithmetic_series
- Terms are `n^2, (n-1)^2, ...` → sum_of_squares
- Terms are `log(n), log(n-1), ...` → log_factorial
- Terms are `n, n, n, ...` (log n of them) → repeated_n_logn_times
- Terms are `n, n/2, n/4, ...` → geometric_shrinking

---

## 9. Checklist

- [ ] Install KaTeX: `npm install katex`
- [ ] Create all engine files in src/lib/algo/
- [ ] Create MathSymbolBar component (based on SymbolBar pattern)
- [ ] Create RecurrenceInput component (expanding pill + preview + dropdown)
- [ ] Create RecurrenceTreeView component (SVG tree + zoom)
- [ ] Create RecurrenceSubstitutionView component (KaTeX formulas)
- [ ] Create RecurrencePage + CSS module
- [ ] Add lazy route /algo/recurrence in App.jsx
- [ ] Add "Recurrence Relation" child to Algorithms group in Sidebar
- [ ] No file over 200 lines
- [ ] CSS Modules only — no Tailwind in JSX
- [ ] Reuse ComplexityTerminal — do not recreate it
- [ ] Create feature_documentation/recursion_engine.md
