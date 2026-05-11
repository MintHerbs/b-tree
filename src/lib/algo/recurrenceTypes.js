/**
 * Summation Identity Lookup Table
 * Each identity has a detect function that recognizes the pattern
 * and returns the complexity and explanation.
 */

// Helper functions for pattern detection

function allConstant(terms) {
  return terms.length > 0 && terms.every(t => t.fn === 'const');
}

function isArithmeticSeries(terms) {
  // Check if terms are sequential descending powers of 1: n, n-1, n-2, ..., 1
  if (terms.length === 0) return false;
  
  // All terms should be linear (power of 1)
  const allLinear = terms.every(t => t.fn === 'power' && t.exponent === 1);
  if (!allLinear) return false;
  
  // Check if they form a descending sequence
  for (let i = 0; i < terms.length - 1; i++) {
    const current = terms[i].arg || 'n';
    const next = terms[i + 1].arg || 'n';
    // Simple check: should be descending (n, n-1, n-2, etc.)
    if (current === 'n' && next !== 'n-1' && next !== 'n') return false;
  }
  
  return true;
}

function isSumOfSquares(terms) {
  // Check if terms are sequential descending powers of 2: n^2, (n-1)^2, ..., 1^2
  if (terms.length === 0) return false;
  
  // All terms should be quadratic (power of 2)
  return terms.every(t => t.fn === 'power' && t.exponent === 2);
}

function isLogSum(terms) {
  // Check if all terms are logarithmic: log(n), log(n-1), ..., log(1)
  return terms.length > 0 && terms.every(t => t.fn === 'log');
}

function isGeometricGrowing(terms) {
  // Check if terms are powers of a constant r > 1: 1, r, r^2, ..., r^k
  if (terms.length < 2) return false;
  
  // Look for exponential growth pattern
  let hasExponentialGrowth = false;
  for (let i = 0; i < terms.length - 1; i++) {
    if (terms[i].fn === 'power' && terms[i].base && terms[i].base > 1) {
      hasExponentialGrowth = true;
      break;
    }
  }
  
  return hasExponentialGrowth;
}

function isGeometricShrinking(terms) {
  // Check if terms follow n/c^k pattern: n, n/2, n/4, ..., 1
  if (terms.length < 2) return false;
  
  // Look for pattern where each term is half (or fraction) of previous
  // Terms should be: n, n/2, n/4, n/8, etc.
  let hasGeometricDecay = false;
  
  for (let i = 0; i < terms.length; i++) {
    const term = terms[i];
    // Check if term has form n/c^k or similar division pattern
    if (term.fn === 'power' && term.exponent === 1 && term.divisor) {
      hasGeometricDecay = true;
      break;
    }
    // Also check for explicit division notation
    if (term.fn === 'divide') {
      hasGeometricDecay = true;
      break;
    }
  }
  
  return hasGeometricDecay;
}

function isRepeatedNLogTimes(terms) {
  // Check if all terms equal to the same 'n' value: n, n, n, ... (log n times)
  if (terms.length === 0) return false;
  
  // All terms should be identical linear terms
  const firstTerm = terms[0];
  if (firstTerm.fn !== 'power' || firstTerm.exponent !== 1) return false;
  
  // Check if all terms are the same
  return terms.every(t => 
    t.fn === 'power' && 
    t.exponent === 1 && 
    t.arg === firstTerm.arg
  );
}

function isHarmonicSeries(terms) {
  // Check if terms are 1/k pattern: 1, 1/2, 1/3, ..., 1/n
  return terms.length > 0 && terms.every(t => t.fn === 'reciprocal');
}

function computeGeometric(r, k) {
  // For geometric series with r > 1, dominated by last term: O(r^k)
  return `${r}^${k}`;
}

// Main summation identities lookup table
export const SUMMATION_IDENTITIES = [
  {
    id: 'constant_sum',
    name: 'Sum of Constants',
    detect: (terms) => allConstant(terms),
    formula: 'n × c',
    simplified: 'n',
    complexity: 'n',
    explanation: 'Sum of n constants = O(n)',
  },
  {
    id: 'arithmetic_series',
    name: 'Arithmetic Series',
    detect: (terms) => isArithmeticSeries(terms),
    formula: 'n(n+1)/2',
    simplified: 'n²/2',
    complexity: 'n2',
    explanation: 'Arithmetic series: n(n+1)/2 = O(n²)',
  },
  {
    id: 'sum_of_squares',
    name: 'Sum of Squares',
    detect: (terms) => isSumOfSquares(terms),
    formula: 'n(n+1)(2n+1)/6',
    simplified: 'n³/6',
    complexity: 'n3',
    explanation: 'Sum of squares: n(n+1)(2n+1)/6 = O(n³)',
  },
  {
    id: 'log_factorial',
    name: 'Logarithmic Factorial',
    detect: (terms) => isLogSum(terms),
    formula: 'log(n!)',
    simplified: 'n log n',
    complexity: 'n_log_n',
    explanation: 'Sum of logarithms = log(n!). By Stirling\'s approximation: log(n!) = Θ(n log n)',
  },
  {
    id: 'geometric_growing',
    name: 'Geometric Series (Growing)',
    detect: (terms) => isGeometricGrowing(terms),
    formula: '(r^(k+1) − 1) / (r − 1)',
    simplified: 'r^k',
    complexity: (r, k) => computeGeometric(r, k),
    explanation: 'Geometric series (r > 1): dominated by last term',
  },
  {
    id: 'geometric_shrinking',
    name: 'Geometric Series (Shrinking)',
    detect: (terms) => isGeometricShrinking(terms),
    formula: '2n',
    simplified: '2n',
    complexity: 'n',
    explanation: 'Geometric series (r < 1): converges to O(n)',
  },
  {
    id: 'repeated_n_logn_times',
    name: 'Repeated n (log n times)',
    detect: (terms) => isRepeatedNLogTimes(terms),
    formula: 'n × log n',
    simplified: 'n log n',
    complexity: 'n_log_n',
    explanation: 'n repeated log(n) times = O(n log n)',
  },
  {
    id: 'harmonic_series',
    name: 'Harmonic Series',
    detect: (terms) => isHarmonicSeries(terms),
    formula: 'ln(n) + γ',
    simplified: 'log n',
    complexity: 'log_n',
    explanation: 'Harmonic series ≈ O(log n)',
  },
];

/**
 * Helper function to identify which summation pattern matches the given terms
 * @param {Array} terms - Array of term objects from the recursion tree/substitution
 * @returns {Object|null} - The matching identity or null if no match
 */
export function identifySummation(terms) {
  if (!terms || terms.length === 0) return null;
  
  for (const identity of SUMMATION_IDENTITIES) {
    if (identity.detect(terms)) {
      return identity;
    }
  }
  
  return null;
}
