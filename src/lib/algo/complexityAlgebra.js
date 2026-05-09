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
