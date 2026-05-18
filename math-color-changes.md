# math-color-changes.md — Complete color coding for math.md

## Color Palette (cyberpunk, designed for background #161311, text #E8E0D5)

| Role | Color | Notes |
|---|---|---|
| Cancelled element | `#FF6B6B` | Soft coral — not hard red |
| Surviving element | `#4ECDC4` | Teal — not hard green |
| L matrix elements | `#5B8CFF` | Blue |
| U matrix elements | `#FF8FAB` | Soft pink |
| Structural zeros | `#3D3A47` | Near-invisible purple-grey |
| Identity diagonal 1s | `#A78BFA` | Light purple |
| Pivot / leading diagonal | `#FB923C` | Soft amber |
| Changed row after operation | `#FDE68A` | Soft gold |
| RHS column in augmented | `#C4B5FD` | Lavender |
| Brackets | CSS only — see Part 1 | Cyan via global CSS |

---

## PART 1 — CSS change (do this first, covers ALL brackets automatically)

> In `src/components/notes/MathBlock/MathBlock.module.css`, add these rules.
> This colors every bracket in every matrix across the entire document with
> zero changes to the .md file:

```css
/* Color all KaTeX brackets cyan */
:global(.katex) .mopen,
:global(.katex) .mclose,
:global(.katex) .delimsizing {
  color: #67E8F9 !important;
}

/* Ensure base KaTeX text inherits warm text color */
:global(.katex) {
  color: #E8E0D5 !important;
}

/* Math display block */
:global(.katex-display) {
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px 0;
}
```

---

## PART 2 — Exact replacements for math.md

Send to Kiro or Claude Code:
> Open `src/content/notes/math/notes/math.md`. Apply every BEFORE → AFTER
> replacement below. Find each BEFORE string exactly and replace with AFTER.
> Only edit inside `$$` blocks. Do not change any numbers, text, or math.

---

### CHANGE 1 — Minor M11 cancel matrix

BEFORE:
```
\begin{bmatrix} \cancel{0} & \cancel{1} & \cancel{2} \\ \cancel{3} & 4 & 5 \\ \cancel{6} & 7 & 8 \end{bmatrix}
```

AFTER:
```
\begin{bmatrix} \textcolor{#FF6B6B}{\cancel{0}} & \textcolor{#FF6B6B}{\cancel{1}} & \textcolor{#FF6B6B}{\cancel{2}} \\ \textcolor{#FF6B6B}{\cancel{3}} & \textcolor{#4ECDC4}{4} & \textcolor{#4ECDC4}{5} \\ \textcolor{#FF6B6B}{\cancel{6}} & \textcolor{#4ECDC4}{7} & \textcolor{#4ECDC4}{8} \end{bmatrix}
```

---

### CHANGE 2 — Minor M12 cancel matrix

BEFORE:
```
\begin{bmatrix} \cancel{0} & \cancel{1} & \cancel{2} \\ 3 & \cancel{4} & 5 \\ 6 & \cancel{7} & 8 \end{bmatrix}
```

AFTER:
```
\begin{bmatrix} \textcolor{#FF6B6B}{\cancel{0}} & \textcolor{#FF6B6B}{\cancel{1}} & \textcolor{#FF6B6B}{\cancel{2}} \\ \textcolor{#4ECDC4}{3} & \textcolor{#FF6B6B}{\cancel{4}} & \textcolor{#4ECDC4}{5} \\ \textcolor{#4ECDC4}{6} & \textcolor{#FF6B6B}{\cancel{7}} & \textcolor{#4ECDC4}{8} \end{bmatrix}
```

---

### CHANGE 3 — Determinant step 1: strike row 1

BEFORE:
```
\text{matrix } \mathbf{A} = \begin{bmatrix} \cancel{0} & \cancel{1} & \cancel{2} \\ 3 & 4 & 5 \\ 6 & 7 & 8 \end{bmatrix}
```

AFTER:
```
\text{matrix } \mathbf{A} = \begin{bmatrix} \textcolor{#FF6B6B}{\cancel{0}} & \textcolor{#FF6B6B}{\cancel{1}} & \textcolor{#FF6B6B}{\cancel{2}} \\ \textcolor{#4ECDC4}{3} & \textcolor{#4ECDC4}{4} & \textcolor{#4ECDC4}{5} \\ \textcolor{#4ECDC4}{6} & \textcolor{#4ECDC4}{7} & \textcolor{#4ECDC4}{8} \end{bmatrix}
```

---

### CHANGE 4 — Determinant step 2: strike col 3

BEFORE:
```
\text{matrix } \mathbf{A} = \begin{bmatrix} \cancel{0} & \cancel{1} & \cancel{2} \\ 3 & 4 & \cancel{5} \\ 6 & 7 & \cancel{8} \end{bmatrix}
```

AFTER:
```
\text{matrix } \mathbf{A} = \begin{bmatrix} \textcolor{#FF6B6B}{\cancel{0}} & \textcolor{#FF6B6B}{\cancel{1}} & \textcolor{#FF6B6B}{\cancel{2}} \\ \textcolor{#4ECDC4}{3} & \textcolor{#4ECDC4}{4} & \textcolor{#FF6B6B}{\cancel{5}} \\ \textcolor{#4ECDC4}{6} & \textcolor{#4ECDC4}{7} & \textcolor{#FF6B6B}{\cancel{8}} \end{bmatrix}
```

---

### CHANGE 5 — Identity Matrix

BEFORE:
```
\text{matrix } \mathbf{A} = \begin{bmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & 1 \end{bmatrix}
```
(the one under "### Identity Matrix" heading only)

AFTER:
```
\text{matrix } \mathbf{A} = \begin{bmatrix} \textcolor{#A78BFA}{1} & \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} \\ \\textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} & \\textcolor{#6B6680}{0} \\ \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} \end{bmatrix}
```

---

### CHANGE 6 — Diagonal Matrix

BEFORE:
```
\text{matrix } \mathbf{A} = \begin{bmatrix} a_{11} & 0 & 0 \\ 0 & a_{22} & 0 \\ 0 & 0 & a_{23} \end{bmatrix}
```

AFTER:
```
\text{matrix } \mathbf{A} = \begin{bmatrix} \textcolor{#FB923C}{a_{11}} & \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} \\ \\textcolor{#6B6680}{0} & \textcolor{#FB923C}{a_{22}} & \\textcolor{#6B6680}{0} \\ \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \textcolor{#FB923C}{a_{23}} \end{bmatrix}
```

---

### CHANGE 7 — Lower Triangular

BEFORE:
```
\text{Lower Triangular} = \begin{bmatrix} 1 & 0 & 0 \\ -1 & 2 & 0 \\ -6 & -4 & 3 \end{bmatrix}
```

AFTER:
```
\text{Lower Triangular} = \begin{bmatrix} 1 & \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} \\ -1 & 2 & \\textcolor{#6B6680}{0} \\ -6 & -4 & 3 \end{bmatrix}
```

---

### CHANGE 8 — Upper Triangular

BEFORE:
```
\text{Upper Triangular} = \begin{bmatrix} 1 & 2 & 3 \\ 0 & 4 & 5 \\ 0 & 0 & 6 \end{bmatrix}
```

AFTER:
```
\text{Upper Triangular} = \begin{bmatrix} 1 & 2 & 3 \\ \\textcolor{#6B6680}{0} & 4 & 5 \\ \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & 6 \end{bmatrix}
```

---

### CHANGE 9 — LU triangles intro with letters

BEFORE:
```
L = \begin{bmatrix} 1 & 0 & 0 \\ a & 1 & 0 \\ b & c & 1 \end{bmatrix} \qquad U = \begin{bmatrix} d & e & f \\ 0 & g & h \\ 0 & 0 & i \end{bmatrix}
```

AFTER:
```
\textcolor{#5B8CFF}{L} = \begin{bmatrix} \textcolor{#A78BFA}{1} & \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{a} & \textcolor{#A78BFA}{1} & \\textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{b} & \textcolor{#5B8CFF}{c} & \textcolor{#A78BFA}{1} \end{bmatrix} \qquad \textcolor{#FF8FAB}{U} = \begin{bmatrix} \textcolor{#FF8FAB}{d} & \textcolor{#FF8FAB}{e} & \textcolor{#FF8FAB}{f} \\ \\textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{g} & \textcolor{#FF8FAB}{h} \\ \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{i} \end{bmatrix}
```

---

### CHANGE 10 — LU Doolittle template with L_ij U_ij

BEFORE:
```
L = \begin{bmatrix} 1 & 0 & 0 \\ L_{21} & 1 & 0 \\ L_{31} & L_{32} & 1 \end{bmatrix} \qquad U = \begin{bmatrix} U_{11} & U_{12} & U_{13} \\ 0 & U_{22} & U_{23} \\ 0 & 0 & U_{33} \end{bmatrix}
```

AFTER:
```
\textcolor{#5B8CFF}{L} = \begin{bmatrix} \textcolor{#A78BFA}{1} & \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{L_{21}} & \textcolor{#A78BFA}{1} & \\textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{L_{31}} & \textcolor{#5B8CFF}{L_{32}} & \textcolor{#A78BFA}{1} \end{bmatrix} \qquad \textcolor{#FF8FAB}{U} = \begin{bmatrix} \textcolor{#FF8FAB}{U_{11}} & \textcolor{#FF8FAB}{U_{12}} & \textcolor{#FF8FAB}{U_{13}} \\ \\textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{U_{22}} & \textcolor{#FF8FAB}{U_{23}} \\ \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{U_{33}} \end{bmatrix}
```

---

### CHANGE 11 — LU Crout template with L_ij U_ij

BEFORE:
```
L = \begin{bmatrix} L_{11} & 0 & 0 \\ L_{21} & L_{22} & 0 \\ L_{31} & L_{32} & L_{33} \end{bmatrix} \qquad U = \begin{bmatrix} 1 & U_{12} & U_{13} \\ 0 & 1 & U_{23} \\ 0 & 0 & 1 \end{bmatrix}
```

AFTER:
```
\textcolor{#5B8CFF}{L} = \begin{bmatrix} \textcolor{#5B8CFF}{L_{11}} & \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{L_{21}} & \textcolor{#5B8CFF}{L_{22}} & \\textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{L_{31}} & \textcolor{#5B8CFF}{L_{32}} & \textcolor{#5B8CFF}{L_{33}} \end{bmatrix} \qquad \textcolor{#FF8FAB}{U} = \begin{bmatrix} \textcolor{#A78BFA}{1} & \textcolor{#FF8FAB}{U_{12}} & \textcolor{#FF8FAB}{U_{13}} \\ \\textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} & \textcolor{#FF8FAB}{U_{23}} \\ \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} \end{bmatrix}
```

---

### CHANGE 12 — Crout Example 1 L×U = result (line ~878)

BEFORE:
```
\begin{bmatrix} a & 0 & 0 \\ b & c & 0 \\ d & e & f \end{bmatrix} \begin{bmatrix} 1 & g & h \\ 0 & 1 & i \\ 0 & 0 & 1 \end{bmatrix} = \begin{bmatrix} 5 & 0 & 0 \\ 10 & 1 & 0 \\ 10 & 5 & 3 \end{bmatrix} \begin{bmatrix} 1 & 0.8 & 0.2 \\ 0 & 1 & 2 \\ 0 & 0 & 1 \end{bmatrix}
```

AFTER:
```
\begin{bmatrix} \textcolor{#5B8CFF}{a} & \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{b} & \textcolor{#5B8CFF}{c} & \\textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{d} & \textcolor{#5B8CFF}{e} & \textcolor{#5B8CFF}{f} \end{bmatrix} \begin{bmatrix} \textcolor{#A78BFA}{1} & \textcolor{#FF8FAB}{g} & \textcolor{#FF8FAB}{h} \\ \\textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} & \textcolor{#FF8FAB}{i} \\ \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} \end{bmatrix} = \begin{bmatrix} \textcolor{#5B8CFF}{5} & \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{10} & \textcolor{#5B8CFF}{1} & \\textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{10} & \textcolor{#5B8CFF}{5} & \textcolor{#5B8CFF}{3} \end{bmatrix} \begin{bmatrix} \textcolor{#A78BFA}{1} & \textcolor{#FF8FAB}{0.8} & \textcolor{#FF8FAB}{0.2} \\ \\textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} & \textcolor{#FF8FAB}{2} \\ \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} \end{bmatrix}
```

---

### CHANGE 13 — Crout Example 2 Step 2 decompose

BEFORE:
```
\begin{bmatrix} 1 & 1 & 1 \\ 4 & 3 & -1 \\ 3 & 5 & 3 \end{bmatrix} = \begin{bmatrix} L_{11} & 0 & 0 \\ L_{21} & L_{22} & 0 \\ L_{31} & L_{32} & L_{33} \end{bmatrix} \begin{bmatrix} 1 & U_{12} & U_{13} \\ 0 & 1 & U_{23} \\ 0 & 0 & 1 \end{bmatrix}
```

AFTER:
```
\begin{bmatrix} 1 & 1 & 1 \\ 4 & 3 & -1 \\ 3 & 5 & 3 \end{bmatrix} = \begin{bmatrix} \textcolor{#5B8CFF}{L_{11}} & \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{L_{21}} & \textcolor{#5B8CFF}{L_{22}} & \\textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{L_{31}} & \textcolor{#5B8CFF}{L_{32}} & \textcolor{#5B8CFF}{L_{33}} \end{bmatrix} \begin{bmatrix} \textcolor{#A78BFA}{1} & \textcolor{#FF8FAB}{U_{12}} & \textcolor{#FF8FAB}{U_{13}} \\ \\textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} & \textcolor{#FF8FAB}{U_{23}} \\ \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} \end{bmatrix}
```

---

### CHANGE 14 — Crout Example 2 Step 3 multiplication result (both occurrences)

BEFORE:
```
A = \begin{bmatrix} L_{11} & L_{11}U_{12} & L_{11}U_{13} \\ L_{21} & L_{21}U_{12} + L_{22} & L_{21}U_{13} + L_{22}U_{23} \\ L_{31} & L_{31}U_{12} + L_{32} & L_{31}U_{13} + L_{32}U_{23} + L_{33} \end{bmatrix}
```

AFTER:
```
A = \begin{bmatrix} \textcolor{#5B8CFF}{L_{11}} & \textcolor{#5B8CFF}{L_{11}}\textcolor{#FF8FAB}{U_{12}} & \textcolor{#5B8CFF}{L_{11}}\textcolor{#FF8FAB}{U_{13}} \\ \textcolor{#5B8CFF}{L_{21}} & \textcolor{#5B8CFF}{L_{21}}\textcolor{#FF8FAB}{U_{12}} + \textcolor{#5B8CFF}{L_{22}} & \textcolor{#5B8CFF}{L_{21}}\textcolor{#FF8FAB}{U_{13}} + \textcolor{#5B8CFF}{L_{22}}\textcolor{#FF8FAB}{U_{23}} \\ \textcolor{#5B8CFF}{L_{31}} & \textcolor{#5B8CFF}{L_{31}}\textcolor{#FF8FAB}{U_{12}} + \textcolor{#5B8CFF}{L_{32}} & \textcolor{#5B8CFF}{L_{31}}\textcolor{#FF8FAB}{U_{13}} + \textcolor{#5B8CFF}{L_{32}}\textcolor{#FF8FAB}{U_{23}} + \textcolor{#5B8CFF}{L_{33}} \end{bmatrix}
```

---

### CHANGE 15 — Crout Example 2 final answer L and U

BEFORE:
```
\therefore L = \begin{bmatrix} 1 & 0 & 0 \\ 4 & -1 & 0 \\ 3 & 2 & -10 \end{bmatrix} \quad \text{and} \quad U = \begin{bmatrix} 1 & 1 & 1 \\ 0 & 1 & 5 \\ 0 & 0 & 1 \end{bmatrix}
```

AFTER:
```
\therefore \textcolor{#5B8CFF}{L} = \begin{bmatrix} \textcolor{#A78BFA}{1} & \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{4} & \textcolor{#5B8CFF}{-1} & \\textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{3} & \textcolor{#5B8CFF}{2} & \textcolor{#5B8CFF}{-10} \end{bmatrix} \quad \text{and} \quad \textcolor{#FF8FAB}{U} = \begin{bmatrix} \textcolor{#A78BFA}{1} & \textcolor{#FF8FAB}{1} & \textcolor{#FF8FAB}{1} \\ \\textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} & \textcolor{#FF8FAB}{5} \\ \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} \end{bmatrix}
```

---

### CHANGE 16 — Doolittle Example 2 Step 2

BEFORE:
```
\begin{bmatrix} 1 & 1 & 1 \\ 4 & 3 & -1 \\ 3 & 5 & 5 \end{bmatrix} = \begin{bmatrix} 1 & 0 & 0 \\ L_{21} & 1 & 0 \\ L_{31} & L_{32} & 1 \end{bmatrix} \begin{bmatrix} U_{11} & U_{12} & U_{13} \\ 0 & U_{22} & U_{23} \\ 0 & 0 & U_{33} \end{bmatrix}
```

AFTER:
```
\begin{bmatrix} 1 & 1 & 1 \\ 4 & 3 & -1 \\ 3 & 5 & 5 \end{bmatrix} = \begin{bmatrix} \textcolor{#A78BFA}{1} & \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{L_{21}} & \textcolor{#A78BFA}{1} & \\textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{L_{31}} & \textcolor{#5B8CFF}{L_{32}} & \textcolor{#A78BFA}{1} \end{bmatrix} \begin{bmatrix} \textcolor{#FF8FAB}{U_{11}} & \textcolor{#FF8FAB}{U_{12}} & \textcolor{#FF8FAB}{U_{13}} \\ \\textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{U_{22}} & \textcolor{#FF8FAB}{U_{23}} \\ \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{U_{33}} \end{bmatrix}
```

---

### CHANGE 17 — Doolittle Step 3 multiplication (both occurrences)

BEFORE:
```
A = \begin{bmatrix} U_{11} & U_{12} & U_{13} \\ L_{21}U_{11} & L_{21}U_{12} + U_{22} & U_{13}L_{21} + U_{23} \\ L_{31}U_{11} & L_{31}U_{12} + L_{32}U_{22} & L_{31}U_{13} + L_{32}U_{23} + U_{33} \end{bmatrix}
```

AFTER:
```
A = \begin{bmatrix} \textcolor{#FF8FAB}{U_{11}} & \textcolor{#FF8FAB}{U_{12}} & \textcolor{#FF8FAB}{U_{13}} \\ \textcolor{#5B8CFF}{L_{21}}\textcolor{#FF8FAB}{U_{11}} & \textcolor{#5B8CFF}{L_{21}}\textcolor{#FF8FAB}{U_{12}} + \textcolor{#FF8FAB}{U_{22}} & \textcolor{#FF8FAB}{U_{13}}\textcolor{#5B8CFF}{L_{21}} + \textcolor{#FF8FAB}{U_{23}} \\ \textcolor{#5B8CFF}{L_{31}}\textcolor{#FF8FAB}{U_{11}} & \textcolor{#5B8CFF}{L_{31}}\textcolor{#FF8FAB}{U_{12}} + \textcolor{#5B8CFF}{L_{32}}\textcolor{#FF8FAB}{U_{22}} & \textcolor{#5B8CFF}{L_{31}}\textcolor{#FF8FAB}{U_{13}} + \textcolor{#5B8CFF}{L_{32}}\textcolor{#FF8FAB}{U_{23}} + \textcolor{#FF8FAB}{U_{33}} \end{bmatrix}
```

---

### CHANGE 18 — Doolittle Example 2 final L and U

BEFORE:
```
\therefore L = \begin{bmatrix} 1 & 0 & 0 \\ 4 & 1 & 0 \\ 3 & -2 & 1 \end{bmatrix} \quad U = \begin{bmatrix} 1 & 1 & 1 \\ 0 & -1 & -5 \\ 0 & 0 & -10 \end{bmatrix}
```

AFTER:
```
\therefore \textcolor{#5B8CFF}{L} = \begin{bmatrix} \textcolor{#A78BFA}{1} & \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{4} & \textcolor{#A78BFA}{1} & \\textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{3} & \textcolor{#5B8CFF}{-2} & \textcolor{#A78BFA}{1} \end{bmatrix} \quad \textcolor{#FF8FAB}{U} = \begin{bmatrix} \textcolor{#FF8FAB}{1} & \textcolor{#FF8FAB}{1} & \textcolor{#FF8FAB}{1} \\ \\textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{-1} & \textcolor{#FF8FAB}{-5} \\ \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{-10} \end{bmatrix}
```

---

### CHANGE 19 — Doolittle continued: split into L U (line ~1148)

BEFORE:
```
\begin{bmatrix} 5 & 4 & 1 \\ 10 & 9 & 4 \\ 10 & 13 & 15 \end{bmatrix} = \begin{bmatrix} 1 & 0 & 0 \\ L_{21} & 1 & 0 \\ L_{31} & L_{32} & 1 \end{bmatrix} \begin{bmatrix} U_{11} & U_{12} & U_{13} \\ 0 & U_{22} & U_{23} \\ 0 & 0 & U_{33} \end{bmatrix}
```

AFTER:
```
\begin{bmatrix} 5 & 4 & 1 \\ 10 & 9 & 4 \\ 10 & 13 & 15 \end{bmatrix} = \begin{bmatrix} \textcolor{#A78BFA}{1} & \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{L_{21}} & \textcolor{#A78BFA}{1} & \\textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{L_{31}} & \textcolor{#5B8CFF}{L_{32}} & \textcolor{#A78BFA}{1} \end{bmatrix} \begin{bmatrix} \textcolor{#FF8FAB}{U_{11}} & \textcolor{#FF8FAB}{U_{12}} & \textcolor{#FF8FAB}{U_{13}} \\ \\textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{U_{22}} & \textcolor{#FF8FAB}{U_{23}} \\ \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{U_{33}} \end{bmatrix}
```

---

### CHANGE 20 — Doolittle continued: multiplication result (line ~1152)

BEFORE:
```
\begin{bmatrix} 5 & 4 & 1 \\ 10 & 9 & 4 \\ 10 & 13 & 15 \end{bmatrix} = \begin{bmatrix} U_{11} & U_{12} & U_{13} \\ L_{21}U_{11} & L_{21}U_{12} + U_{22} & L_{21}U_{13} + U_{23} \\ L_{31}U_{11} & L_{31}U_{12} + L_{32}U_{22} & L_{31}U_{13} + L_{32}U_{23} + U_{33} \end{bmatrix}
```

AFTER:
```
\begin{bmatrix} 5 & 4 & 1 \\ 10 & 9 & 4 \\ 10 & 13 & 15 \end{bmatrix} = \begin{bmatrix} \textcolor{#FF8FAB}{U_{11}} & \textcolor{#FF8FAB}{U_{12}} & \textcolor{#FF8FAB}{U_{13}} \\ \textcolor{#5B8CFF}{L_{21}}\textcolor{#FF8FAB}{U_{11}} & \textcolor{#5B8CFF}{L_{21}}\textcolor{#FF8FAB}{U_{12}} + \textcolor{#FF8FAB}{U_{22}} & \textcolor{#5B8CFF}{L_{21}}\textcolor{#FF8FAB}{U_{13}} + \textcolor{#FF8FAB}{U_{23}} \\ \textcolor{#5B8CFF}{L_{31}}\textcolor{#FF8FAB}{U_{11}} & \textcolor{#5B8CFF}{L_{31}}\textcolor{#FF8FAB}{U_{12}} + \textcolor{#5B8CFF}{L_{32}}\textcolor{#FF8FAB}{U_{22}} & \textcolor{#5B8CFF}{L_{31}}\textcolor{#FF8FAB}{U_{13}} + \textcolor{#5B8CFF}{L_{32}}\textcolor{#FF8FAB}{U_{23}} + \textcolor{#FF8FAB}{U_{33}} \end{bmatrix}
```

---

### CHANGE 21 — Doolittle continued: final L and U answer (line ~1182)

BEFORE:
```
L = \begin{bmatrix} 1 & 0 & 0 \\ 2 & 1 & 0 \\ 2 & 5 & 1 \end{bmatrix} \quad \text{and} \quad U = \begin{bmatrix} 5 & 4 & 1 \\ 0 & 1 & 2 \\ 0 & 0 & 3 \end{bmatrix}
```

AFTER:
```
\textcolor{#5B8CFF}{L} = \begin{bmatrix} \textcolor{#A78BFA}{1} & \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{2} & \textcolor{#A78BFA}{1} & \\textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{2} & \textcolor{#5B8CFF}{5} & \textcolor{#A78BFA}{1} \end{bmatrix} \quad \text{and} \quad \textcolor{#FF8FAB}{U} = \begin{bmatrix} \textcolor{#FF8FAB}{5} & \textcolor{#FF8FAB}{4} & \textcolor{#FF8FAB}{1} \\ \\textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{1} & \textcolor{#FF8FAB}{2} \\ \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{3} \end{bmatrix}
```

---

### CHANGE 22 — Gauss Elimination triangular target form

BEFORE:
```
\begin{bmatrix} a & b & c \\ 0 & d & e \\ 0 & 0 & f \end{bmatrix} \begin{bmatrix} x \\ y \\ z \end{bmatrix} = \begin{bmatrix} g \\ h \\ i \end{bmatrix}
```

AFTER:
```
\begin{bmatrix} a & b & c \\ \\textcolor{#6B6680}{0} & d & e \\ \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & f \end{bmatrix} \begin{bmatrix} x \\ y \\ z \end{bmatrix} = \begin{bmatrix} \textcolor{#C4B5FD}{g} \\ \textcolor{#C4B5FD}{h} \\ \textcolor{#C4B5FD}{i} \end{bmatrix}
```

---

### CHANGE 23 — Gauss Elimination Example 1: row operations result (final triangular)

BEFORE:
```
\left[\begin{array}{ccc|c} 4 & -1 & 2 & 15 \\ 0 & \frac{7}{4} & \frac{7}{2} & \frac{35}{4} \\ 0 & 0 & 18 & 18 \end{array}\right]
```

AFTER:
```
\left[\begin{array}{ccc|c} \textcolor{#FB923C}{4} & -1 & 2 & \textcolor{#C4B5FD}{15} \\ \\textcolor{#6B6680}{0} & \textcolor{#FB923C}{\frac{7}{4}} & \frac{7}{2} & \textcolor{#C4B5FD}{\frac{35}{4}} \\ \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \textcolor{#FB923C}{18} & \textcolor{#C4B5FD}{18} \end{array}\right]
```

---

### CHANGE 24 — Gauss Elimination Example 2: step 1 changed row (R3 + R1)

BEFORE:
```
\left[\begin{array}{ccc|c} 1 & 1 & -1 & -2 \\ 2 & -1 & 1 & 5 \\ 0 & 3 & 1 & -1 \end{array}\right] \xrightarrow{2R_1 - R_2}
```

AFTER:
```
\left[\begin{array}{ccc|c} 1 & 1 & -1 & \textcolor{#C4B5FD}{-2} \\ 2 & -1 & 1 & \textcolor{#C4B5FD}{5} \\ \textcolor{#FDE68A}{0} & \textcolor{#FDE68A}{3} & \textcolor{#FDE68A}{1} & \textcolor{#FDE68A}{-1} \end{array}\right] \xrightarrow{2R_1 - R_2}
```

---

### CHANGE 25 — Gauss Elimination Example 2: step 2 changed row (2R1 - R2)

BEFORE:
```
\left[\begin{array}{ccc|c} 1 & 1 & -1 & -2 \\ 0 & 3 & -3 & -9 \\ 0 & 3 & 1 & -1 \end{array}\right] \xrightarrow{R_3 - R_2}
```

AFTER:
```
\left[\begin{array}{ccc|c} 1 & 1 & -1 & \textcolor{#C4B5FD}{-2} \\ \textcolor{#FDE68A}{0} & \textcolor{#FDE68A}{3} & \textcolor{#FDE68A}{-3} & \textcolor{#FDE68A}{-9} \\ 0 & 3 & 1 & \textcolor{#C4B5FD}{-1} \end{array}\right] \xrightarrow{R_3 - R_2}
```

---

### CHANGE 26 — Gauss Elimination Example 2: final triangular

BEFORE:
```
\left[\begin{array}{ccc|c} 1 & 1 & -1 & -2 \\ 0 & 3 & -3 & -9 \\ 0 & 0 & 4 & 8 \end{array}\right]
```

AFTER:
```
\left[\begin{array}{ccc|c} \textcolor{#FB923C}{1} & 1 & -1 & \textcolor{#C4B5FD}{-2} \\ \\textcolor{#6B6680}{0} & \textcolor{#FB923C}{3} & -3 & \textcolor{#C4B5FD}{-9} \\ \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \textcolor{#FB923C}{4} & \textcolor{#C4B5FD}{8} \end{array}\right]
```

---

### CHANGE 27 — Augmented [A|I] initial Example 1 (line ~257)

BEFORE:
```
\left[\begin{array}{ccc|ccc} 1 & 2 & -1 & 1 & 0 & 0 \\ -2 & 0 & 1 & 0 & 1 & 0 \\ 1 & 1 & 0 & 0 & 0 & 1 \end{array}\right]
```
(first occurrence, before any row operations)

AFTER:
```
\left[\begin{array}{ccc|ccc} 1 & 2 & -1 & \textcolor{#C4B5FD}{\textcolor{#A78BFA}{1}} & \textcolor{#C4B5FD}{\\textcolor{#6B6680}{0}} & \textcolor{#C4B5FD}{\\textcolor{#6B6680}{0}} \\ -2 & 0 & 1 & \textcolor{#C4B5FD}{\\textcolor{#6B6680}{0}} & \textcolor{#C4B5FD}{\textcolor{#A78BFA}{1}} & \textcolor{#C4B5FD}{\\textcolor{#6B6680}{0}} \\ 1 & 1 & 0 & \textcolor{#C4B5FD}{\\textcolor{#6B6680}{0}} & \textcolor{#C4B5FD}{\\textcolor{#6B6680}{0}} & \textcolor{#C4B5FD}{\textcolor{#A78BFA}{1}} \end{array}\right]
```

---

### CHANGE 28 — Final augmented = identity (line ~295)

BEFORE:
```
\left[\begin{array}{ccc|ccc} 1 & 0 & 0 & 1 & 1 & 2 \\ 0 & 1 & 0 & 1 & 1 & 1 \\ 0 & 0 & 1 & 2 & 3 & 4 \end{array}\right] \qquad \therefore A^{-1} = \begin{bmatrix} 1 & 1 & 2 \\ 1 & 1 & 1 \\ 2 & 3 & 4 \end{bmatrix}
```

AFTER:
```
\left[\begin{array}{ccc|ccc} \textcolor{#A78BFA}{1} & \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \textcolor{#C4B5FD}{1} & \textcolor{#C4B5FD}{1} & \textcolor{#C4B5FD}{2} \\ \\textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} & \\textcolor{#6B6680}{0} & \textcolor{#C4B5FD}{1} & \textcolor{#C4B5FD}{1} & \textcolor{#C4B5FD}{1} \\ \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} & \textcolor{#C4B5FD}{2} & \textcolor{#C4B5FD}{3} & \textcolor{#C4B5FD}{4} \end{array}\right] \qquad \therefore A^{-1} = \begin{bmatrix} 1 & 1 & 2 \\ 1 & 1 & 1 \\ 2 & 3 & 4 \end{bmatrix}
```

---

### CHANGE 29 — Rank: final identity form (line ~1390)

BEFORE:
```
\begin{bmatrix} 1 & 0 & 0 & 0 & 0 \\ 0 & 1 & 0 & 0 & 0 \\ 0 & 0 & 1 & 0 & 0 \\ 0 & 0 & 0 & 0 & 0 \end{bmatrix}
```
(the final rearranged form under "Step 2: Rearrange the columns")

AFTER:
```
\begin{bmatrix} \textcolor{#A78BFA}{1} & \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} \\ \\textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} & \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} \\ \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} & \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} \\ \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} \end{bmatrix}
```

---

### CHANGE 30 — Gauss-Jacobi dominant diagonal matrix

BEFORE:
```
\begin{bmatrix} 5 & -2 & 3 \\ -3 & 9 & 2 \\ 2 & -l & -7 \end{bmatrix}
```

AFTER:
```
\begin{bmatrix} \textcolor{#FB923C}{5} & -2 & 3 \\ -3 & \textcolor{#FB923C}{9} & 2 \\ 2 & -l & \textcolor{#FB923C}{-7} \end{bmatrix}
```

---

### CHANGE 31 — Gauss-Seidel dominant diagonal matrix (identical to above, in Seidel section)

Same replacement as CHANGE 30 — apply to the same matrix that appears in the Gauss-Seidel section.

---

### CHANGE 32 — Echelon Form display matrix

BEFORE:
```
\text{Echelon Form:} \quad \begin{bmatrix} x & x & x \\ 0 & x & x \\ 0 & 0 & x \end{bmatrix} \qquad \text{Reduced Echelon Form:} \quad \begin{bmatrix} 1 & 0 & 2 \\ 0 & 1 & 4 \\ 0 & 0 & 0 \end{bmatrix}
```

AFTER:
```
\text{Echelon Form:} \quad \begin{bmatrix} \textcolor{#FB923C}{x} & x & x \\ \\textcolor{#6B6680}{0} & \textcolor{#FB923C}{x} & x \\ \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \textcolor{#FB923C}{x} \end{bmatrix} \qquad \text{Reduced Echelon Form:} \quad \begin{bmatrix} \textcolor{#A78BFA}{1} & \\textcolor{#6B6680}{0} & 2 \\ \\textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} & 4 \\ \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} & \\textcolor{#6B6680}{0} \end{bmatrix}
```

---

### CHANGE 33 — LU intro example decomposition

BEFORE:
```
\mathbf{A} = \begin{bmatrix} 1 & 2 \\ 1 & 0 \end{bmatrix} = \begin{bmatrix} 1 & 0 \\ 1 & 1 \end{bmatrix} \begin{bmatrix} 1 & 2 \\ 0 & -2 \end{bmatrix} = \mathbf{LU}
```

AFTER:
```
\mathbf{A} = \begin{bmatrix} 1 & 2 \\ 1 & 0 \end{bmatrix} = \underbrace{\begin{bmatrix} \textcolor{#A78BFA}{1} & \\textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{1} & \textcolor{#A78BFA}{1} \end{bmatrix}}_{\textcolor{#5B8CFF}{L}} \underbrace{\begin{bmatrix} \textcolor{#FF8FAB}{1} & \textcolor{#FF8FAB}{2} \\ \\textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{-2} \end{bmatrix}}_{\textcolor{#FF8FAB}{U}} = \mathbf{\textcolor{#5B8CFF}{L}\textcolor{#FF8FAB}{U}}
```
