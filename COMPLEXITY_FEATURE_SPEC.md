# Feature Spec: O Complexity Analyser
## For Kiro — Read fully before starting any task.

---

## Overview

Add a new "Algorithms" sidebar group (between Database and Logic) with one child tool:
**O Complexity** — a pure-JS Big-O analyser for Python exam code.
No LLM APIs. No external services. Fully algorithmic.

---

## 1. Icons & Assets

All SVGs already exist in `src/img/`. Do not create or modify them.

| File | Usage |
|---|---|
| `src/img/DSA_OFF.svg` | Algorithms group icon — inactive |
| `src/img/DSA_ON.svg` | Algorithms group icon — active (group open) |
| `src/img/COMPLEXITY_OFF.svg` | Child icon — default |
| `src/img/COMPLEXITY_HOVER.svg` | Child icon — hovered |
| `src/img/COMPLEXITY_ON.svg` | Child icon — active (current route) |

---

## 2. Files to Create

Create every file listed below. Do not modify any protected files.

```
src/lib/algo/
  complexityTypes.js
  complexityAlgebra.js
  complexityParser.js
  complexityEngine.js

src/components/algo/
  ComplexityInput/
    ComplexityInput.jsx
    ComplexityInput.module.css
  ComplexityCodeView/
    ComplexityCodeView.jsx
    ComplexityCodeView.module.css
  ComplexityTerminal/
    ComplexityTerminal.jsx
    ComplexityTerminal.module.css

src/pages/
  ComplexityPage.jsx
  ComplexityPage.module.css
```

Files to **modify**:
- `src/App.jsx` — add route
- `src/components/layout/Sidebar/Sidebar.jsx` (or wherever nav groups are defined) — add Algorithms group

---

## 3. Routing

Add to `src/App.jsx` alongside existing lazy-loaded routes:

```jsx
const ComplexityPage = lazy(() =>
  new Promise(resolve =>
    setTimeout(() => resolve(import('./pages/ComplexityPage')), 1500)
  )
);

// Inside <Routes>:
<Route path="/algo/complexity" element={<ComplexityPage onAIStateChange={setAiState} />} />
```

Add a redirect if needed so `/algo` redirects to `/algo/complexity`.

---

## 4. Sidebar Changes

### Group order (top to bottom):
1. **Database** (existing) — `Database_off.svg` / `Database_on.svg`, orange active colour `#EA6C0A`
2. **Algorithms** (NEW) — `DSA_OFF.svg` / `DSA_ON.svg`, orange active colour `#EA6C0A`
3. **Logic** (existing) — `Logic_off.svg` / `Logic_on.svg`, orange active colour `#EA6C0A`

### Algorithms group children:
Only one child: **O Complexity** → route `/algo/complexity`

Child icon behaviour (follow exact same pattern as existing NavChildIcon components):
- Default: renders `COMPLEXITY_OFF.svg`
- On hover: swaps to `COMPLEXITY_HOVER.svg`
- Active (current route matches `/algo/complexity`): renders `COMPLEXITY_ON.svg`
- Clicking this child: navigate to `/algo/complexity` AND call `setIsChatOpen(false)` (same as all other nav children)

The Algorithms group uses the exact same `NavGroup` / `NavGroupIcon` / `NavChildIcon`
component pattern as Database and Logic. Only the icon paths and children differ.

---

## 5. Engine Layer — `src/lib/algo/`

These are pure JS files. No React. No CSS. No imports from the UI layer.

---

### 5a. `complexityTypes.js`

Export the following constants and helpers:

```js
// Ordered lowest → highest (used for dominance comparison)
export const COMPLEXITY_ORDER = [
  '1', 'log_n', 'log2_n', 'sqrt_n', 'sqrt_n_log_n',
  'n', 'n_log_n', 'n_sqrt_n', 'n2', 'n2_log_n',
  'n3', 'n3_log_n', 'exp_n', 'unknown',
];

// Full O(...) strings
export const COMPLEXITY_DISPLAY = {
  '1':            'O(1)',
  'log_n':        'O(log n)',
  'log2_n':       'O(log² n)',
  'sqrt_n':       'O(√n)',
  'sqrt_n_log_n': 'O(√n · log n)',
  'n':            'O(n)',
  'n_log_n':      'O(n log n)',
  'n_sqrt_n':     'O(n√n)',
  'n2':           'O(n²)',
  'n2_log_n':     'O(n² log n)',
  'n3':           'O(n³)',
  'n3_log_n':     'O(n³ log n)',
  'exp_n':        'O(2ⁿ)',
  'unknown':      'O(?)',
};

// Short inner labels for step strings like "O(n) × O(log n) = O(n log n)"
export const COMPLEXITY_SHORT = {
  '1':            '1',
  'log_n':        'log n',
  'log2_n':       'log² n',
  'sqrt_n':       '√n',
  'sqrt_n_log_n': '√n·log n',
  'n':            'n',
  'n_log_n':      'n log n',
  'n_sqrt_n':     'n√n',
  'n2':           'n²',
  'n2_log_n':     'n² log n',
  'n3':           'n³',
  'n3_log_n':     'n³ log n',
  'exp_n':        '2ⁿ',
  'unknown':      '?',
};

export const displayComplexity = c => COMPLEXITY_DISPLAY[c] ?? 'O(?)';
export const shortComplexity   = c => COMPLEXITY_SHORT[c]   ?? '?';
```

---

### 5b. `complexityAlgebra.js`

Implements three operations: `multiplyComplexities`, `sumComplexities`, `worstCase`.

```js
import { COMPLEXITY_ORDER, COMPLEXITY_SHORT } from './complexityTypes.js';

// Returns the higher-order of two complexity keys
export function dominantOf(a, b) {
  const ia = COMPLEXITY_ORDER.indexOf(a);
  const ib = COMPLEXITY_ORDER.indexOf(b);
  if (ia === -1) return b;
  if (ib === -1) return a;
  return ia >= ib ? a : b;
}

// Always sort pair so a×b === b×a lookup works
const pairKey = (a, b) => [a, b].sort().join('×');

// Comprehensive multiply table — covers all realistic exam combinations
const MULTIPLY_TABLE = {
  [pairKey('log_n',        'log_n')]:        'log2_n',
  [pairKey('log_n',        'log2_n')]:       'log2_n',
  [pairKey('log_n',        'sqrt_n')]:       'sqrt_n_log_n',
  [pairKey('log_n',        'sqrt_n_log_n')]: 'sqrt_n_log_n',
  [pairKey('log_n',        'n')]:            'n_log_n',
  [pairKey('log_n',        'n_log_n')]:      'n_log_n',
  [pairKey('log_n',        'n_sqrt_n')]:     'n_sqrt_n',
  [pairKey('log_n',        'n2')]:           'n2_log_n',
  [pairKey('log_n',        'n2_log_n')]:     'n2_log_n',
  [pairKey('log_n',        'n3')]:           'n3_log_n',
  [pairKey('log2_n',       'sqrt_n')]:       'sqrt_n_log_n',
  [pairKey('log2_n',       'n')]:            'n_log_n',
  [pairKey('log2_n',       'n2')]:           'n2_log_n',
  [pairKey('sqrt_n',       'sqrt_n')]:       'n',
  [pairKey('sqrt_n',       'sqrt_n_log_n')]: 'n_log_n',
  [pairKey('sqrt_n',       'n')]:            'n_sqrt_n',
  [pairKey('sqrt_n',       'n_log_n')]:      'n_sqrt_n',
  [pairKey('sqrt_n',       'n_sqrt_n')]:     'n2',
  [pairKey('sqrt_n',       'n2')]:           'n3',
  [pairKey('sqrt_n_log_n', 'sqrt_n')]:       'n_log_n',
  [pairKey('sqrt_n_log_n', 'n')]:            'n_sqrt_n',
  [pairKey('n',            'n')]:            'n2',
  [pairKey('n',            'n_log_n')]:      'n2_log_n',
  [pairKey('n',            'n_sqrt_n')]:     'n3',
  [pairKey('n',            'n2')]:           'n3',
  [pairKey('n',            'n2_log_n')]:     'n3_log_n',
  [pairKey('n',            'n3')]:           'exp_n',
  [pairKey('n_log_n',      'n_log_n')]:      'n2_log_n',
  [pairKey('n_log_n',      'n')]:            'n2_log_n',
  [pairKey('n_log_n',      'n2')]:           'n3_log_n',
  [pairKey('n2',           'n2')]:           'exp_n',
  [pairKey('n2',           'n_log_n')]:      'n3_log_n',
  [pairKey('n3',           'log_n')]:        'n3_log_n',
  [pairKey('n3',           'n')]:            'exp_n',
  [pairKey('exp_n',        'log_n')]:        'exp_n',
  [pairKey('exp_n',        'n')]:            'exp_n',
  [pairKey('exp_n',        'n2')]:           'exp_n',
  [pairKey('exp_n',        'exp_n')]:        'exp_n',
};

// Multiply — used for nested loops/blocks
export function multiplyComplexities(a, b) {
  if (a === '1') return b;
  if (b === '1') return a;
  if (a === 'unknown' || b === 'unknown') return 'unknown';
  if (a === 'exp_n' || b === 'exp_n') return 'exp_n';
  return MULTIPLY_TABLE[pairKey(a, b)] ?? dominantOf(a, b);
}

// Sum — used for sequential blocks (keep dominant term only)
export function sumComplexities(a, b) {
  return dominantOf(a, b);
}

// Worst case — used for if/elif/else branches
export function worstCase(arr) {
  return arr.reduce(dominantOf, '1');
}

// Human-readable step string
export function multiplyStepStr(a, b, result) {
  if (a === '1') return `O(${COMPLEXITY_SHORT[b]})`;
  if (b === '1') return `O(${COMPLEXITY_SHORT[a]})`;
  return `O(${COMPLEXITY_SHORT[a]}) × O(${COMPLEXITY_SHORT[b]}) = O(${COMPLEXITY_SHORT[result]})`;
}
```

---

### 5c. `complexityParser.js`

Parses raw Python source into typed line objects.
Also exports expression and range analysers.

#### `parseLines(code)` → array of line objects

Each line object shape:
```js
{
  lineNum: number,   // 1-indexed
  raw: string,       // original string
  stripped: string,  // trimStart() version
  indent: number,    // character count of leading whitespace
  kind: string,      // see kinds below
  meta: object,      // kind-specific data
}
```

**Kinds and their `meta`:**

| kind | meta fields |
|---|---|
| `empty` | `{}` |
| `for_range` | `{ var, rangeArgs }` — e.g. var='i', rangeArgs='1, n+1' |
| `for_iter` | `{ var, iterable }` — e.g. var='x', iterable='some_list' |
| `while` | `{ condition }` — everything between `while ` and `:` |
| `if` | `{ condition }` |
| `elif` | `{ condition }` |
| `else` | `{}` |
| `def` | `{ name, params }` |
| `update` | `{ var, op, value }` — e.g. op='*=', value='2' |
| `assign` | `{ var, value }` |
| `stmt` | `{}` — any other line |

**Classification regex patterns** (apply in order, return first match):

```
for_range:  /^for\s+(\w+)\s+in\s+range\s*\((.+)\)\s*:/
for_iter:   /^for\s+(\w+)\s+in\s+(.+)\s*:/
while:      /^while\s+(.+?)\s*:/
if:         /^if\s+(.+?)\s*:/
elif:       /^elif\s+(.+?)\s*:/
else:       /^else\s*:/
def:        /^def\s+(\w+)\s*\(([^)]*)\)\s*:/
update:     /^(\w+)\s*(\*=|\/\/=|\/=|\+=|-=)\s*(.+)/
update:     /^(\w+)\s*=\s*\1\s*([*/])\s*(.+)/   ← covers "i = i * 2" style
assign:     /^(\w+)\s*=\s*(.+)/
```

#### `analyzeExpression(expr)` → complexity key

Normalise expr by stripping whitespace first. Then match in order:

| Expression pattern | Returns |
|---|---|
| empty string | `'1'` |
| pure digit(s) e.g. `10`, `100` | `'1'` |
| `n` | `'n'` |
| `n+c`, `n-c`, `c+n` where c is digits | `'n'` |
| `c*n`, `n*c` | `'n'` |
| `n//c`, `n/c` | `'n'` |
| `n**2`, `n*n` | `'n2'` |
| `n**3` | `'n3'` |
| `n**0.5`, `n**(0.5)`, `n**(1/2)` | `'sqrt_n'` |
| `math.sqrt(n)`, `int(n**0.5)` | `'sqrt_n'` |
| `2**n`, `2^n` | `'exp_n'` |
| `len(...)` | `'n'` |
| `sorted(...)`, `.sort(` | `'n_log_n'` |
| `math.log(...)`, `math.log2(...)` | `'log_n'` |
| single word identifier (e.g. `k`) | return the identifier string as-is |
| contains `n` | `'n'` (fallback) |
| anything else | `'1'` |

#### `splitArgs(argsStr)` → string[]

Split a comma-separated argument string respecting nested parentheses.
Track depth: increment on `(` or `[`, decrement on `)` or `]`.
Split only when depth === 0 and char is `,`.

#### `analyzeRangeArgs(rangeArgs)` → complexity key

Parse range arguments:
- `range(stop)` → analyse `stop`
- `range(start, stop)` → analyse `stop`
- `range(start, stop, step)` → analyse `stop` (step is a constant divisor, same complexity class)

Call `analyzeExpression` on the stop value.

#### `parseWhileCondition(condition)` → `{ var, bound, boundKind }` | null

Handle these forms:

| Condition | var | bound expression | boundKind |
|---|---|---|---|
| `i <= n` | `i` | `n` | `'direct'` |
| `i < n` | `i` | `n` | `'direct'` |
| `i <= n**0.5` | `i` | `n**0.5` | `'direct'` |
| `i*i <= n` | `i` | `n` | `'sqrt_product'` |
| `i*i < n` | `i` | `n` | `'sqrt_product'` |
| `n >= i` (reversed) | `i` | `n` | `'direct'` |

For `sqrt_product`: bound is what's on the right of the `<=`, but the effective bound passed to the loop complexity function should be `sqrtOf(bound)`.

Return `null` if no recognisable pattern.

---

### 5d. `complexityEngine.js`

Main entry point. Exports one function: `analyzeComplexity(code)`.

#### Return shape

```js
{
  finalComplexity: string,   // complexity key e.g. 'n2'
  annotations: Annotation[],
  steps: Step[],
  error?: string,            // only if analysis failed
}
```

**Annotation shape:**
```js
{
  id: string,          // unique e.g. 'a0', 'a1'
  lineStart: number,   // 1-indexed, inclusive
  lineEnd: number,     // 1-indexed, inclusive
  complexity: string,  // complexity key
  label: string,       // human label e.g. 'for i in range(n)'
  depth: number,       // nesting depth 0=outermost
  kind: 'for' | 'while' | 'if' | 'def',
}
```

**Step shape:**
```js
{
  text: string,
  type: 'loop' | 'combine_nested' | 'worst_case' | 'special' | 'info' | 'divider' | 'final',
  complexity?: string,   // complexity key (optional on divider/info)
  indent?: number,       // 0-based nesting depth for indentation display
}
```

#### `analyzeComplexity(code)`

1. Call `parseLines(code)`
2. Filter out empty lines, find minimum indent level
3. Call `analyzeBlock(lines, 0, minIndent, {}, steps, annotations, 0)`
4. Push a divider step `{ text: '─────────────────────────────────', type: 'divider' }`
5. Push final step `{ text: 'FINAL COMPLEXITY: ' + displayComplexity(complexity), type: 'final', complexity }`
6. Return `{ finalComplexity: complexity, annotations, steps }`
7. Wrap in try/catch — return `{ error: message }` on failure

#### `analyzeBlock(lines, startIdx, minIndent, ctx, steps, annotations, depth)` → `{ complexity, nextIdx }`

Process lines sequentially from `startIdx`. Stop when a line's indent < minIndent or we reach end.

For each line:

**`for_range`** → call `handleForRange(...)`
**`for_iter`** → call `handleForIter(...)`
**`while`** → call `handleWhile(...)`
**`if`** → call `handleIfElse(...)` (this also consumes subsequent elif/else at same indent)
**`def`** → find body indent, push info step, recurse into body
**`empty`** → skip
**other** → check `checkBuiltinCall(line.stripped)` — if it returns non-`'1'`, add to sequential list

Collect all block complexities in a list.
At end: `seqComplexities.reduce(sumComplexities, '1')` → final complexity.
Return `{ complexity, nextIdx: i }`.

#### `handleForRange(lines, idx, meta, ctx, steps, annotations, depth)` → `{ complexity, nextIdx }`

1. `iterC = resolveExpr(analyzeRangeArgs(meta.rangeArgs), ctx)`
2. Push step: `{ text: 'for VAR in range(ARGS): → O(short) iterations', type: 'loop', complexity: iterC, indent: depth }`
3. Find body indent (`findBodyIndent`)
4. If no body: annotate + return iterC
5. Build `newCtx = { ...ctx, [meta.var]: { kind: 'additive', bound: iterC } }`
6. Recurse: `analyzeBlock(lines, idx+1, bodyIndent, newCtx, ...)`
7. `totalC = multiplyComplexities(iterC, bodyC)`
8. Push step: `{ text: '  └─ body: O(short)  →  multiplyStepStr(...)', type: 'combine_nested', indent: depth }`
9. Push annotation spanning lineStart→lineEnd
10. Return `{ complexity: totalC, nextIdx }`

#### `handleForIter(lines, idx, meta, ctx, steps, annotations, depth)` → `{ complexity, nextIdx }`

Same as `handleForRange` but:
- `iterC = resolveExpr(analyzeExpression(meta.iterable), ctx)` — if resolves to `'1'`, use `'n'` as default
- Label uses `for VAR in ITERABLE`

#### `handleWhile(lines, idx, meta, ctx, steps, annotations, depth)` → `{ complexity, nextIdx }`

1. Call `parseWhileCondition(meta.condition)` → `{ var, bound, boundKind }`
2. If null: assume `'n'`, push warning step, recurse body, return
3. `bound = resolveExpr(analyzeExpression(rawBound), ctx)`
4. If `boundKind === 'sqrt_product'`: `effectiveBound = sqrtOf(bound)` else `effectiveBound = bound`
5. Collect body lines (flat list of lines with indent >= bodyIndent, only at depth+1 level)
6. Call `findUpdate(bodyLines, loopVar)` → `{ op, isMultiplicative }` or null

**Geometric series detection** (check before computing loop complexity):
- Condition: `update.isMultiplicative === true`
- AND: one of the body lines is a `for_range` whose `rangeArgs` contains `loopVar`
- If both true:
  - Push step: `while CONDITION: multiplicative → O(log n) iterations`
  - Push special step: `⚠ Geometric series: inner for range(VAR) with VAR doubling`
  - Push special step: `Σ(k=1,2,4,...,n) = 2n−1 → combined while+for = O(bound)`
  - Recurse body normally (it will process the inner for too — that's fine, the annotation will show the correct combined complexity)
  - Annotate with `complexity: bound` (e.g. `'n'`), label `while CONDITION [geometric series]`
  - Return `{ complexity: bound, nextIdx }`

**Normal path:**
7. `loopC = isMultiplicative ? logOf(effectiveBound) : effectiveBound`
8. Push loop step
9. Recurse body
10. `totalC = multiplyComplexities(loopC, bodyC)`
11. Push combine step
12. Annotate + return

**Helper functions needed:**

`logOf(bound)`:
- `'n'` → `'log_n'`
- `'n2'` → `'log_n'` (log(n²) = 2log(n))
- `'sqrt_n'` → `'log_n'` (log(√n) = ½log(n))
- `'n3'` → `'log_n'`
- default → `'log_n'`

`sqrtOf(bound)`:
- `'n'` → `'sqrt_n'`
- `'n2'` → `'n'`
- `'n3'` → `'n_sqrt_n'`
- default → `'sqrt_n'`

`resolveExpr(expr, ctx)`:
If `expr` is a plain identifier and `ctx[expr]` exists, return `ctx[expr].bound`. Otherwise return `expr` as-is.

`findBodyIndent(lines, headerIdx)`:
Scan forward from headerIdx+1, return `.indent` of first non-empty line. Return -1 if none found.

`findUpdate(bodyLines, varName)`:
Scan bodyLines for a line with `kind === 'update'` and `meta.var === varName`.
Return `{ op, isMultiplicative: op === '*=' || op === '/=' || op === '//=' }` or null.

`checkBuiltinCall(stripped)`:
- Contains `.sort(` or starts with `sorted(` → `'n_log_n'`
- Starts with `heapq.` → `'log_n'`
- Otherwise → `'1'`

#### `handleIfElse(lines, idx, ctx, steps, annotations, depth)` → `{ complexity, nextIdx }`

1. Starting from idx, loop while line kind is `if`, `elif`, or `else` AND indent matches lines[idx].indent
2. For each branch: find body indent, push info step, recurse body, collect branchC
3. After all branches: `worst = worstCase(branchComplexities)`
4. Push step: `if/else: worst-case branch → O(worst)`
5. Annotate spanning all branches
6. Return `{ complexity: worst, nextIdx }`

---

## 6. Component Layer

### 6a. `ComplexityInput`

**Purpose:** Textarea pill where users paste Python code. Same visual language as LogicInputPage.

**Props:** `{ onSubmit(code), onAIStateChange(state) }`

**Behaviour:**
- On focus → `onAIStateChange('observing')`
- On blur → `onAIStateChange('idle')`
- On submit → `onAIStateChange('thinking')` then 120ms delay then `onSubmit(code.trim())`
- Keyboard: `Cmd+Enter` / `Ctrl+Enter` submits
- Submit button disabled when textarea is empty

**Layout:**
- Centered on page
- Header row: small icon + "O Complexity Analyser" in `--color-accent`
- Subtitle: "Paste a Python code block and get a step-by-step Big-O breakdown." in `--color-muted`
- Pill container: `background: var(--color-surface)`, `border: 1px solid var(--color-border)`, `border-radius: 16px`
- On focus: border and box-shadow become `--color-accent`
- Textarea: `font-family: 'JetBrains Mono', monospace`, `font-size: 13px`, `min-height: 280px`, `max-height: 480px`, `resize: none`
- Footer inside pill: hint text left ("⌘ Enter to analyse"), submit button right
- Submit button: `background: var(--color-accent)`, `border-radius: 8px`, icon + "Analyse" text

---

### 6b. `ComplexityCodeView`

**Purpose:** Left panel on the result page. Shows the Python code with SVG bracket annotations on the right side.

**Props:** `{ code: string, annotations: Annotation[] }`

**Layout:**
- Full height panel
- Header bar: "Code" label in muted uppercase
- Scrollable content area
- Inside: two side-by-side sections:
  1. **Code lines** — line numbers + code text (monospace)
  2. **Annotation panel** — SVG canvas for brackets

**Line rendering:**
- Fixed line height: `22px` — this is critical for accurate bracket positioning
- Line number: right-aligned in a fixed-width column, muted colour, non-selectable
- Line text: `font-family: 'JetBrains Mono', monospace`, `font-size: 13px`, `white-space: pre`

**SVG bracket rendering:**
- Panel width = `(maxDepth + 1) * 56 + 16` pixels
- For each annotation (sorted deepest-first so outermost is drawn on top):
  - Column `x` position = `(maxDepth - ann.depth) * 56 + 8` — outermost bracket is rightmost column
  - `yTop = (ann.lineStart - 1) * 22 + 11` (midpoint of first line)
  - `yBot = (ann.lineEnd - 1) * 22 + 11` (midpoint of last line)
  - `yMid = (yTop + yBot) / 2`
  - Vertical line from yTop to yBot
  - Horizontal tick at yTop (6px wide, pointing right)
  - Horizontal tick at yBot (6px wide, pointing right)
  - Label background rect at yMid (height 18px, rx 4, low opacity fill)
  - Label text at yMid+4 — complexity string e.g. "O(n²)"

**Bracket colours by complexity key:**

| Key | Colour |
|---|---|
| `'1'` | `#6b7280` |
| `'log_n'`, `'log2_n'` | `#10b981` |
| `'sqrt_n'`, `'sqrt_n_log_n'` | `#06b6d4` |
| `'n'` | `#3b82f6` |
| `'n_log_n'`, `'n_sqrt_n'` | `#8b5cf6` |
| `'n2'`, `'n2_log_n'` | `#f59e0b` |
| `'n3'`, `'n3_log_n'` | `#ef4444` |
| `'exp_n'` | `#be123c` |
| `'unknown'` | `#6b7280` |

**Styling:**
- Background: `var(--color-surface)`
- Right border: `1px solid var(--color-border)`
- Custom scrollbar: 4px wide, `var(--color-border)` thumb

---

### 6c. `ComplexityTerminal`

**Purpose:** Right panel on the result page. Green monospace terminal showing step-by-step derivation with typewriter animation.

**Props:** `{ steps: Step[], finalComplexity: string }`

**Behaviour:**
- When steps array changes: reset visible count to 0, then reveal one step every 80ms via `setInterval`
- Auto-scroll to bottom as steps appear
- After all steps visible AND `finalComplexity` exists: show the final answer box

**Layout structure:**
```
┌─ header bar ──────────────────────────────────┐
│  ● ● ●   complexity.log                        │
├─ terminal body ───────────────────────────────┤
│  $ analyse --mode=big-o --drop-constants       │
│  Running asymptotic analysis...               │
│                                               │
│  01 ▸ for i in range(n): → O(n) iterations    │
│  02   └─ body: O(n)  →  O(n) × O(n) = O(n²)  │
│  ...                                          │
│  ─────────────────────────────────────────    │
│                                               │
│  ┌─ FINAL COMPLEXITY ─────────────────────┐  │
│  │  O(n²)                                  │  │
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

**Step type → colour:**

| type | colour |
|---|---|
| `loop` | `#4ade80` |
| `combine_nested` | `#34d399` |
| `worst_case` | `#fbbf24` |
| `special` | `#67e8f9` |
| `info` | `#9ca3af` |
| `divider` | `#374151` |
| `final` | skipped — shown in finalBox instead |

**Step prefix by type:**
- `special` → `  ⚡ `
- `worst_case` → `  ⚠ `
- `combine_nested` → no prefix (indented with spaces already)
- all others → `▸ `

**Per-step indent:** multiply `step.indent` by 2 spaces.

**Line format:** `[2-digit index]  [indent][prefix][text]`

**Animations:**
- Each step line: `fadeSlideIn` keyframe (opacity 0→1, translateX -4px→0, duration 0.15s)
- Blinking cursor (█) shown while steps are still being revealed
- Final box: `finalReveal` keyframe (opacity 0→1, scale 0.97→1, duration 0.4s)

**Final box styling:**
- Border: `1px solid #166534`
- Background: `rgba(20, 83, 45, 0.2)`
- Label: "FINAL COMPLEXITY" — 9px, bold, uppercase, letter-spacing 0.18em, `#166534`
- Value: 28px, bold, `#4ade80`, text-shadow glow `rgba(74, 222, 128, 0.4)`

**Terminal background:** `#020409` (near-black, not pure black)
**Header background:** `#0d1117`
**Font:** `'JetBrains Mono', 'Fira Code', monospace`, 12px, line-height 1.7

---

## 7. `ComplexityPage.jsx`

**Props:** `{ onAIStateChange }`

**State:**
- `view`: `'input'` | `'result'`
- `code`: string (the submitted Python code)
- `result`: object from `analyzeComplexity()` or null

**Input view:**
- `<Starfield />`
- `<Navbar />` (all defaults — nothing shown except About, same as landing pages)
- Centred `<ComplexityInput onSubmit={handleSubmit} onAIStateChange={onAIStateChange} />`

**`handleSubmit(submittedCode)`:**
1. Call `analyzeComplexity(submittedCode)` — synchronous, no delay needed
2. `setCode(submittedCode)`
3. `setResult(analysis)`
4. `setView('result')`
5. `onAIStateChange('idle')`

**Result view:**
- `<Starfield />`
- `<Navbar showTitle title="O Complexity" showResult resultText={displayComplexity(result.finalComplexity)} showNewFormula onNewFormula={handleReset} />`
- If `result.error`: show centred error message + retry button
- Else: `<div className={styles.splitPanel}>` with two children:
  - Left (`className={styles.leftPanel}`): `<ComplexityCodeView code={code} annotations={result.annotations} />`
  - Right (`className={styles.rightPanel}`): `<ComplexityTerminal steps={result.steps} finalComplexity={result.finalComplexity} />`

**`handleReset()`:**
1. `setView('input')`, `setCode('')`, `setResult(null)`
2. `onAIStateChange('idle')`

**CSS for `ComplexityPage.module.css`:**

```css
.inputPage {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.inputCenter {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resultPage {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.splitPanel {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.leftPanel {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.rightPanel {
  width: 420px;
  flex-shrink: 0;
  overflow: hidden;
}
```

---

## 8. Checklist for Kiro

- [ ] Create all 4 engine files in `src/lib/algo/`
- [ ] Create ComplexityInput component + CSS module
- [ ] Create ComplexityCodeView component + CSS module
- [ ] Create ComplexityTerminal component + CSS module
- [ ] Create ComplexityPage + CSS module
- [ ] Add lazy route `/algo/complexity` in App.jsx
- [ ] Add Algorithms NavGroup to Sidebar between Database and Logic groups
- [ ] NavGroup uses DSA_OFF/DSA_ON icons, orange active colour `#EA6C0A`
- [ ] NavChildIcon for O Complexity uses COMPLEXITY_OFF/HOVER/ON, navigates to `/algo/complexity`, calls `setIsChatOpen(false)` on click
- [ ] Verify: clicking any other nav child while on `/algo/complexity` still closes chat and navigates correctly
- [ ] No file over 200 lines — split if needed
- [ ] CSS Modules only — no Tailwind in JSX
- [ ] `motion/react` for any animations (not Framer Motion)
- [ ] Update `documentation.md`
