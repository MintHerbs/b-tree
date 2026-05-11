# Recurrence Relation Engine — Implementation Notes

## Architecture

The recurrence relation solver is built on three core modules:

- **recurrenceParser.js**: Parses formula strings → structured object
- **recurrenceSolver.js**: Implements tree method + substitution method
- **recurrenceTypes.js**: Summation identity lookup table

## Summation Identities Supported

The engine recognizes 8 common summation patterns:

### 1. Sum of Constants
- **Pattern**: `c + c + ... + c` (n terms)
- **Formula**: `n × c`
- **Complexity**: `O(n)`
- **Example**: `T(n) = T(n-1) + 1` → Sum of n ones = O(n)

### 2. Arithmetic Series
- **Pattern**: `1 + 2 + 3 + ... + n`
- **Formula**: `n(n+1)/2`
- **Complexity**: `O(n²)`
- **Example**: `T(n) = T(n-1) + n` → Arithmetic series = O(n²)

### 3. Sum of Squares
- **Pattern**: `1² + 2² + 3² + ... + n²`
- **Formula**: `n(n+1)(2n+1)/6`
- **Complexity**: `O(n³)`
- **Example**: `T(n) = T(n-1) + n²` → Sum of squares = O(n³)

### 4. Logarithmic Factorial
- **Pattern**: `log(1) + log(2) + ... + log(n)`
- **Formula**: `log(n!)`
- **Complexity**: `O(n log n)`
- **Explanation**: By Stirling's approximation, log(n!) = Θ(n log n)
- **Example**: `T(n) = T(n-1) + log(n)` → log(n!) = O(n log n)

### 5. Geometric Series (Growing)
- **Pattern**: `1 + r + r² + ... + r^k` where r > 1
- **Formula**: `(r^(k+1) − 1) / (r − 1)`
- **Complexity**: `O(r^k)` (dominated by last term)
- **Example**: `T(n) = T(n-1) + 2^n` → Geometric growth

### 6. Geometric Series (Shrinking)
- **Pattern**: `n + n/2 + n/4 + ... + 1`
- **Formula**: `2n`
- **Complexity**: `O(n)`
- **Example**: `T(n) = 2T(n/2) + n` with shrinking work per level

### 7. Repeated n (log n times)
- **Pattern**: `n + n + n + ...` (log n times)
- **Formula**: `n × log n`
- **Complexity**: `O(n log n)`
- **Example**: `T(n) = 2T(n/2) + n` → Each level does n work, log n levels

### 8. Harmonic Series
- **Pattern**: `1 + 1/2 + 1/3 + ... + 1/n`
- **Formula**: `ln(n) + γ`
- **Complexity**: `O(log n)`
- **Example**: `T(n) = T(n-1) + 1/n` → Harmonic series ≈ O(log n)

## Solver Methods

### Tree Method

The tree method visualizes the recursion as an SVG tree and collects work done at each level.

**Process**:
1. **Build tree structure**: Creates nodes for each recursive call and leaf nodes for non-recursive work
2. **Position nodes**: Calculates x,y coordinates for visual layout
3. **Collect leaf terms**: Gathers all f(n) terms from the tree
4. **Identify pattern**: Runs through SUMMATION_IDENTITIES to find matching pattern
5. **Return complexity**: Returns the Big-O complexity based on the identified pattern

**Supported forms**:
- **Subtract type**: `T(n) = aT(n-c) + f(n)` — linear recursion tree
- **Divide type**: `T(n) = aT(n/b) + f(n)` — branching recursion tree

**Output**:
- SVG tree visualization with zoom/pan controls
- Step-by-step terminal derivation
- Final complexity result

### Substitution Method

The substitution method performs algebraic back-substitution to find the general pattern.

**Process**:
1. **Generate substitutions**: Creates a sequence of formula substitutions
2. **Identify pattern**: Recognizes the general form after k substitutions
3. **Set base case**: Determines k by setting T(n-k) = T(0) or T(n/b^k) = T(1)
4. **Evaluate sum**: Identifies the resulting summation pattern
5. **Return complexity**: Returns the Big-O complexity

**Output**:
- LaTeX-rendered formula sequence
- Step-by-step terminal derivation
- Final complexity result

## Supported Recurrence Forms

### Subtract Type
- **Form**: `T(n) = aT(n-c) + f(n)`
- **Examples**:
  - `T(n) = T(n-1) + 1` → O(n)
  - `T(n) = T(n-1) + n` → O(n²)
  - `T(n) = T(n-1) + log(n)` → O(n log n)
  - `T(n) = T(n-1) + n²` → O(n³)

### Divide Type
- **Form**: `T(n) = aT(n/b) + f(n)`
- **Examples**:
  - `T(n) = 2T(n/2) + n` → O(n log n) (merge sort)
  - `T(n) = 2T(n/2) + 1` → O(n)
  - `T(n) = T(n/2) + 1` → O(log n) (binary search)
  - `T(n) = 4T(n/2) + n` → O(n²)

## Implementation Details

### Term Representation

Each term collected from the tree/substitution is represented as an object:

```javascript
{
  fn: 'log' | 'power' | 'const' | 'reciprocal' | 'divide',
  arg: 'n' | 'n-k',
  exponent: number,
  value: number,
  base: number,
  divisor: number
}
```

### Detection Logic

Each summation identity has a `detect(terms)` function that:
1. Examines the structure of all terms
2. Checks for specific patterns (all constants, sequential powers, etc.)
3. Returns true if the pattern matches

The `identifySummation(terms)` helper runs through all identities in order and returns the first match.

### Complexity Mapping

The engine uses standard complexity notation:
- `'1'` → O(1)
- `'n'` → O(n)
- `'n2'` → O(n²)
- `'n3'` → O(n³)
- `'log_n'` → O(log n)
- `'n_log_n'` → O(n log n)

## Future Enhancements

Potential additions to the engine:
- Master Theorem automatic application
- Support for multiple recursive terms (e.g., Fibonacci)
- More complex summation patterns
- Interactive tree node highlighting
- Export to LaTeX/PDF
