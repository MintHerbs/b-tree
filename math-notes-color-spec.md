# math-notes-color-spec.md — Color Coding + Container Styling

## Overview

Two separate improvements:
1. Color-coded LaTeX in `math.md` using KaTeX `\textcolor` commands
2. Warm dark container background for the notes page to reduce reading fatigue

---

## Part 1 — Notes Container Styling

### Target files
- `src/components/notes/NotesRenderer/NotesRenderer.module.css`
- `src/pages/NotesPage.jsx`

### Change
Wrap note content in a warm dark container instead of rendering directly on the
starfield. The container sits above the starfield (zIndex: 5) with:

```css
.notesContainer {
  background: #161311;
  color: #E8E0D5;
  border-radius: 12px;
  padding: 48px 56px 80px;
  max-width: 860px;
  margin: 40px auto 80px auto;
  margin-left: calc(76px + 32px); /* sidebar + gap */
  margin-right: 32px;
  position: relative;
  z-index: 5;
  box-shadow: 0 8px 40px rgba(0,0,0,0.6);
}
```

Override all text colors inside the container to use `#E8E0D5` as base instead
of pure white. Only H1 remains `#8B5CF6`. Dividers remain `rgba(139,92,246,0.4)`.

Body text: `#E8E0D5`
H2/H3/H4: `#F0EAE0` (slightly brighter than body for hierarchy)
Blockquote text: `rgba(232,224,213,0.85)`
Inline code: `#7FE7FF` on `rgba(127,231,255,0.08)` bg (unchanged)
Table text: `#E8E0D5`
Table header bg: `rgba(139,92,246,0.15)` (unchanged)

Mobile (max-width 768px): padding 24px 20px, margin-left 0, full width.

---

## Part 2 — Color Coding System for math.md

### KaTeX Color Syntax
```latex
\textcolor{#HEX}{content}
```
Example: `\textcolor{#ef4444}{\cancel{0}}` — red cancelled element

### Color Palette (matches mooner.dev cyberpunk theme)

| Role | Color | Hex |
|---|---|---|
| Cancelled element (strikethrough) | Red | `#ef4444` |
| Surviving element (stays after cancel) | Green | `#22c55e` |
| L matrix elements | Blue | `#5B8CFF` |
| U matrix elements | Pink | `#FF5FA2` |
| Zero entries (structural zeros) | Dim white | `#4a4a5a` |
| Pivot / leading diagonal element | Amber | `#EA6C0A` |
| Recently changed row element | Orange-yellow | `#facc15` |
| Brackets `\left[ \right]` | Cyan | `#7FE7FF` |
| Identity matrix ones | Purple | `#8B5CF6` |
| RHS column (augmented matrix) | Light purple | `#C9A0FF` |

### How to apply bracket color in KaTeX
Wrap matrix content with a color group. For brackets, use:
```latex
{\color{#7FE7FF} \left[ } \begin{array}{...} ... \end{array} {\color{#7FE7FF} \right]}
```
Or more simply, apply to the entire bmatrix using a group:
```latex
{\color{#7FE7FF}\begin{bmatrix}} ... {\color{#7FE7FF}\end{bmatrix}}
```
Note: KaTeX bracket coloring is tricky — the safest approach is to wrap
the whole matrix in a textcolor and accept all elements inherit that color,
then override individual elements with their own `\textcolor`. This won't
work cleanly for complex cases. Instead, use a subtle border/shadow on the
math container via CSS rather than trying to color the brackets themselves.
The bracket color improvement is OPTIONAL — skip if it causes rendering errors.

---

## Patterns to Apply in math.md

### Pattern 1 — Cancelled elements (used in Minors section)

Every `\cancel{X}` → `\textcolor{#ef4444}{\cancel{X}}`
Every element that is NOT cancelled in the same matrix → `\textcolor{#22c55e}{X}`

Example — before:
```latex
\begin{bmatrix} \cancel{0} & \cancel{1} & \cancel{2} \\ \cancel{3} & 4 & 5 \\ \cancel{6} & 7 & 8 \end{bmatrix}
```
After:
```latex
\begin{bmatrix}
  \textcolor{#ef4444}{\cancel{0}} & \textcolor{#ef4444}{\cancel{1}} & \textcolor{#ef4444}{\cancel{2}} \\
  \textcolor{#ef4444}{\cancel{3}} & \textcolor{#22c55e}{4} & \textcolor{#22c55e}{5} \\
  \textcolor{#ef4444}{\cancel{6}} & \textcolor{#22c55e}{7} & \textcolor{#22c55e}{8}
\end{bmatrix}
```

### Pattern 2 — L and U elements in LU Decomposition

Every `L_{ij}` or standalone `L` variable → `\textcolor{#5B8CFF}{L_{ij}}`
Every `U_{ij}` or standalone `U` variable → `\textcolor{#FF5FA2}{U_{ij}}`

This applies everywhere L and U subscript notation appears — in the template
matrices, in the multiplication result, in the comparison equations, and in
the final answer matrices.

Example — before:
```latex
L = \begin{bmatrix} L_{11} & 0 & 0 \\ L_{21} & L_{22} & 0 \\ L_{31} & L_{32} & L_{33} \end{bmatrix}
\qquad
U = \begin{bmatrix} U_{11} & U_{12} & U_{13} \\ 0 & U_{22} & U_{23} \\ 0 & 0 & U_{33} \end{bmatrix}
```
After:
```latex
L = \begin{bmatrix}
  \textcolor{#5B8CFF}{L_{11}} & \textcolor{#4a4a5a}{0} & \textcolor{#4a4a5a}{0} \\
  \textcolor{#5B8CFF}{L_{21}} & \textcolor{#5B8CFF}{L_{22}} & \textcolor{#4a4a5a}{0} \\
  \textcolor{#5B8CFF}{L_{31}} & \textcolor{#5B8CFF}{L_{32}} & \textcolor{#5B8CFF}{L_{33}}
\end{bmatrix}
\qquad
U = \begin{bmatrix}
  \textcolor{#FF5FA2}{U_{11}} & \textcolor{#FF5FA2}{U_{12}} & \textcolor{#FF5FA2}{U_{13}} \\
  \textcolor{#4a4a5a}{0} & \textcolor{#FF5FA2}{U_{22}} & \textcolor{#FF5FA2}{U_{23}} \\
  \textcolor{#4a4a5a}{0} & \textcolor{#4a4a5a}{0} & \textcolor{#FF5FA2}{U_{33}}
\end{bmatrix}
```

### Pattern 3 — Triangular matrices (Lower/Upper Triangular section)

Structural zeros → `\textcolor{#4a4a5a}{0}`
Non-zero elements → keep default color (inherited `#E8E0D5`)

Example — Lower Triangular:
```latex
\text{Lower Triangular} = \begin{bmatrix}
  1 & \textcolor{#4a4a5a}{0} & \textcolor{#4a4a5a}{0} \\
  -1 & 2 & \textcolor{#4a4a5a}{0} \\
  -6 & -4 & 3
\end{bmatrix}
```

Example — Upper Triangular:
```latex
\text{Upper Triangular} = \begin{bmatrix}
  1 & 2 & 3 \\
  \textcolor{#4a4a5a}{0} & 4 & 5 \\
  \textcolor{#4a4a5a}{0} & \textcolor{#4a4a5a}{0} & 6
\end{bmatrix}
```

### Pattern 4 — Identity matrix

All `1`s on the diagonal → `\textcolor{#8B5CF6}{1}`
All `0`s → `\textcolor{#4a4a5a}{0}`

Applies to: Identity Matrix section, augmented matrices `[A|I]`, and
any matrix that becomes `I_r` (rank form).

### Pattern 5 — Row operations (Gauss Elimination, Row Echelon)

After each `\xrightarrow{R_x = ...}` step, the row that was just modified
should have its changed elements highlighted in `\textcolor{#facc15}{value}`.
Elements that did not change stay default color.

Example — after `R_2 = R_2 - 2R_1` changes row 2:
```latex
\begin{bmatrix}
  1 & 2 & -1 & 1 & 0 & 0 \\
  \textcolor{#facc15}{0} & \textcolor{#facc15}{4} & \textcolor{#facc15}{-1} & \textcolor{#facc15}{2} & \textcolor{#facc15}{1} & \textcolor{#facc15}{0} \\
  1 & 1 & 0 & 0 & 0 & 1
\end{bmatrix}
```

### Pattern 6 — Augmented matrix RHS column

In augmented matrices `[A|B]`, the RHS column (after the `|`) should be:
`\textcolor{#C9A0FF}{value}`

This visually separates the constants from the coefficient matrix.

### Pattern 7 — Diagonal matrix / leading diagonal elements

In sections about diagonal matrices and dominant diagonal (Gauss-Jacobi/Seidel),
highlight the leading diagonal elements in `\textcolor{#EA6C0A}{value}`.

---

## Sections in math.md to Edit (by section header)

Apply Pattern 1 (cancelled/surviving): **Example of Minors** (H4 i and ii),
**Determinant for a 3×3 Matrix** steps.

Apply Pattern 2 (L/U): **LU Decomposition** — all of it (Crout's Method,
Doolittle's Method, both examples).

Apply Pattern 3 (triangular zeros): **Types of Matrices → Triangular Matrix**,
**Gauss Elimination** target triangular form, **Gauss Elimination examples**.

Apply Pattern 4 (identity): **Types of Matrices → Identity Matrix**,
**Inverse of a Matrix → Method 2** (augmented with I), **Rank** section.

Apply Pattern 5 (changed rows): **Inverse of a Matrix → Method 2**,
**Gauss Elimination** all examples, **Rank** row operations.

Apply Pattern 6 (RHS column): All augmented matrices throughout the file.

Apply Pattern 7 (diagonal): **Gauss-Jacobi Method**, **Gauss-Seidel Method**
dominant diagonal check matrices.

---

## Implementation Prompts

### Prompt 1 — Container background styling

> Read `src/components/notes/NotesRenderer/NotesRenderer.module.css` and
> `src/pages/NotesPage.jsx`. Wrap the rendered note content in a warm dark
> container. In `NotesPage.jsx`, wrap `<NotesRenderer>` in a div with
> `className={styles.notesContainer}`. Add `.notesContainer` to
> `NotesRenderer.module.css` (or create `NotesPage.module.css` if NotesPage
> has no CSS module yet):
> ```css
> .notesContainer {
>   background: #161311;
>   border-radius: 12px;
>   padding: 48px 56px 80px;
>   max-width: 860px;
>   margin: 40px 32px 80px calc(76px + 32px);
>   position: relative;
>   z-index: 5;
>   box-shadow: 0 8px 40px rgba(0,0,0,0.6);
> }
> @media (max-width: 768px) {
>   .notesContainer { padding: 24px 20px; margin: 16px 0; }
> }
> ```
> In `NotesRenderer.module.css`, change all `rgba(255,255,255,0.85)` body text
> references to `#E8E0D5`, H2/H3/H4 color to `#F0EAE0`. H1 stays `#8B5CF6`.
> Remove the existing page wrapper `background: transparent` since the container
> now provides the background. Do not change any other files.

### Prompt 2 — Apply color coding to math.md (send to Claude Code)

> Read `src/content/notes/math/notes/math.md` in full. Apply KaTeX `\textcolor`
> color coding throughout the file following these rules — do NOT change any
> mathematical content, only wrap existing values in `\textcolor{#HEX}{value}`:
>
> **Rule 1 — Cancelled elements:** Every `\cancel{X}` → `\textcolor{#ef4444}{\cancel{X}}`.
> In the same matrix, every non-cancelled element → `\textcolor{#22c55e}{X}`.
> Apply to all matrices in the Minors and Determinant sections.
>
> **Rule 2 — LU elements:** Every `L_{ij}` notation →
> `\textcolor{#5B8CFF}{L_{ij}}`. Every `U_{ij}` notation →
> `\textcolor{#FF5FA2}{U_{ij}}`. Zeros in L/U matrices →
> `\textcolor{#4a4a5a}{0}`. Apply throughout the entire LU Decomposition section.
>
> **Rule 3 — Triangular zeros:** In Triangular Matrix section and any matrix
> being reduced to triangular form, structural zeros (zeros that define the
> triangle shape) → `\textcolor{#4a4a5a}{0}`.
>
> **Rule 4 — Identity matrix:** In Identity Matrix section and any `[A|I]`
> augmented matrices, diagonal `1`s → `\textcolor{#8B5CF6}{1}`, off-diagonal
> `0`s → `\textcolor{#4a4a5a}{0}`.
>
> **Rule 5 — Modified rows:** After each `\xrightarrow{R_x = ...}` step in
> Gauss Elimination, Inverse Method 2, and Rank sections, the row that was
> just modified has its elements wrapped in `\textcolor{#facc15}{value}`.
>
> **Rule 6 — Augmented RHS:** In all `\left[\begin{array}{...|...}` augmented
> matrices, the values in the column after the `|` →
> `\textcolor{#C9A0FF}{value}`.
>
> **Rule 7 — Leading diagonal in Jacobi/Seidel:** In the dominant diagonal
> check matrices in Gauss-Jacobi and Gauss-Seidel sections, diagonal elements
> → `\textcolor{#EA6C0A}{value}`.
>
> Apply all rules systematically to every matching occurrence. Do not change
> any text outside of `$$...$$` and `$...$` blocks. Do not change section
> headers, prose, or blockquotes. Preserve all existing `\text{}`, `\quad`,
> `\xrightarrow`, `\frac`, and other LaTeX commands unchanged.
