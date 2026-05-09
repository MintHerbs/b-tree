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
