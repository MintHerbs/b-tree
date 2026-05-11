# Recurrence Relation Engine — Implementation Notes

## Architecture

```
User formula string
       ↓
  recurrenceParser.js
       ↓
  { type, a, b, f, fComplexity }
       ↓
  ┌────────────────────┬──────────────────────┐
  │  solveByTree()     │  solveBySubstitution()│
  │  (recurrenceSolver)│  (recurrenceSolver)   │
  └────────┬───────────┴──────────┬───────────┘
           ↓                      ↓
    tree object              formulas array
    (nodes + edges)          (LaTeX strings)
           ↓                      ↓
    RecurrenceTreeView    RecurrenceSubstitutionView
    (SVG left panel)      (KaTeX left panel)
           ↓                      ↓
           └──────── ComplexityTerminal (right panel, shared) ────┘
```

## Files

| File | Purpose |
|---|---|
| `src/lib/algo/recurrenceParser.js` | Parses formula strings into structured objects |
| `src/lib/algo/recurrenceSolver.js` | Tree method + substitution method solvers |
| `src/lib/algo/recurrenceTypes.js` | Summation identity lookup table |
| `src/components/algo/RecurrenceTreeView/` | SVG tree with zoom/pan |
| `src/components/algo/RecurrenceSubstitutionView/` | KaTeX formula display |
| `src/components/algo/RecurrenceInput/` | Input pill + math symbols + method dropdown |
| `src/components/algo/MathSymbolBar/` | Math operation button bar |
| `src/pages/RecurrencePage.jsx` | Main page component |

## Summation Identities Supported

| ID | Sum Pattern | Formula | Complexity |
|---|---|---|---|
| `constant_sum` | c + c + ... + c (n terms) | n × c | O(n) |
| `arithmetic_series` | 1 + 2 + 3 + ... + n | n(n+1)/2 | O(n²) |
| `sum_of_squares` | 1² + 2² + ... + n² | n(n+1)(2n+1)/6 | O(n³) |
| `log_factorial` | log(1) + log(2) + ... + log(n) | log(n!) → Stirling | O(n log n) |
| `geometric_growing` | 1 + r + r² + ... + r^k (r>1) | (r^(k+1)−1)/(r−1) | O(r^k) |
| `geometric_shrinking` | n + n/2 + n/4 + ... + 1 | 2n | O(n) |
| `repeated_n_logn_times` | n + n + n + ... (log n times) | n × log n | O(n log n) |
| `harmonic_series` | 1 + 1/2 + 1/3 + ... + 1/n | ln(n) + γ | O(log n) |

## Solver Methods

### Tree Method (`solveByTree`)

1. Parse the recurrence into { type, a, b, f }
2. Generate tree nodes with pre-computed (x, y) positions
3. For subtract type: right-leaning chain, 3-4 explicit levels, dots, base case
4. For divide type: balanced tree, a children per node, 3 levels shown
5. Collect all leaf node labels as symbolic sum terms
6. Run `identifySummation(terms)` against the lookup table
7. Return the matching identity's complexity and explanation
8. Build step-by-step terminal output

### Substitution Method (`solveBySubstitution`)

1. Parse the recurrence
2. Generate 3 explicit substitution rounds:
   - Replace n with n-1 (or n/b) to get T(smaller)
   - Substitute back into the equation
3. State the general pattern after k substitutions
4. Set the base case condition to solve for k
5. Evaluate the resulting sum using the identity table
6. Return LaTeX formula array + terminal steps

## Supported Recurrence Forms

### Subtract type: T(n) = aT(n-c) + f(n)
- a = number of recursive calls (usually 1)
- c = constant subtracted (usually 1)
- Depth of recursion: n/c levels
- Sum collected across all levels

### Divide type: T(n) = aT(n/b) + f(n)
- a = branching factor
- b = division factor
- Depth: log_b(n) levels
- Level k has a^k nodes, each doing f(n/b^k) work

### Special cases
- Fibonacci: T(n) = T(n-1) + T(n-2) → O(2^n) (hardcoded)
- Single call divide: T(n) = T(n/b) + f(n) → simpler tree
