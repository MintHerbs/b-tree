// Parse raw Python source into typed line objects
// Also exports expression and range analysers

// ============================================================================
// LINE PARSING
// ============================================================================

export function parseLines(code) {
  const lines = code.split('\n');
  return lines.map((raw, idx) => {
    const stripped = raw.trimStart();
    const indent = raw.length - stripped.length;
    
    if (stripped === '' || stripped.startsWith('#')) {
      return { lineNum: idx + 1, raw, stripped, indent, kind: 'empty', meta: {} };
    }

    // Apply classification patterns in order
    let match;

    // for_range: for i in range(...)
    match = stripped.match(/^for\s+(\w+)\s+in\s+range\s*\((.+)\)\s*:/);
    if (match) {
      return { lineNum: idx + 1, raw, stripped, indent, kind: 'for_range', meta: { var: match[1], rangeArgs: match[2] } };
    }

    // for_iter: for x in some_list
    match = stripped.match(/^for\s+(\w+)\s+in\s+(.+)\s*:/);
    if (match) {
      return { lineNum: idx + 1, raw, stripped, indent, kind: 'for_iter', meta: { var: match[1], iterable: match[2] } };
    }

    // while
    match = stripped.match(/^while\s+(.+?)\s*:/);
    if (match) {
      return { lineNum: idx + 1, raw, stripped, indent, kind: 'while', meta: { condition: match[1] } };
    }

    // if
    match = stripped.match(/^if\s+(.+?)\s*:/);
    if (match) {
      return { lineNum: idx + 1, raw, stripped, indent, kind: 'if', meta: { condition: match[1] } };
    }

    // elif
    match = stripped.match(/^elif\s+(.+?)\s*:/);
    if (match) {
      return { lineNum: idx + 1, raw, stripped, indent, kind: 'elif', meta: { condition: match[1] } };
    }

    // else
    match = stripped.match(/^else\s*:/);
    if (match) {
      return { lineNum: idx + 1, raw, stripped, indent, kind: 'else', meta: {} };
    }

    // def
    match = stripped.match(/^def\s+(\w+)\s*\(([^)]*)\)\s*:/);
    if (match) {
      return { lineNum: idx + 1, raw, stripped, indent, kind: 'def', meta: { name: match[1], params: match[2] } };
    }

    // update: i *= 2, i //= 2, etc.
    match = stripped.match(/^(\w+)\s*(\*=|\/\/=|\/=|\+=|-=)\s*(.+)/);
    if (match) {
      return { lineNum: idx + 1, raw, stripped, indent, kind: 'update', meta: { var: match[1], op: match[2], value: match[3] } };
    }

    // update: i = i * 2 style
    match = stripped.match(/^(\w+)\s*=\s*\1\s*([*/])\s*(.+)/);
    if (match) {
      const op = match[2] === '*' ? '*=' : '/=';
      return { lineNum: idx + 1, raw, stripped, indent, kind: 'update', meta: { var: match[1], op, value: match[3] } };
    }

    // assign
    match = stripped.match(/^(\w+)\s*=\s*(.+)/);
    if (match) {
      return { lineNum: idx + 1, raw, stripped, indent, kind: 'assign', meta: { var: match[1], value: match[2] } };
    }

    // stmt: any other line
    return { lineNum: idx + 1, raw, stripped, indent, kind: 'stmt', meta: {} };
  });
}

// ============================================================================
// EXPRESSION ANALYSIS
// ============================================================================

export function analyzeExpression(expr) {
  const e = expr.replace(/\s+/g, '');
  
  if (e === '') return '1';
  if (/^\d+$/.test(e)) return '1';
  if (e === 'n') return 'n';
  
  // n+c, n-c, c+n
  if (/^n[+-]\d+$/.test(e) || /^\d+[+-]n$/.test(e)) return 'n';
  
  // c*n, n*c
  if (/^\d+\*n$/.test(e) || /^n\*\d+$/.test(e)) return 'n';
  
  // n//c, n/c
  if (/^n\/\/\d+$/.test(e) || /^n\/\d+$/.test(e)) return 'n';
  
  // n**2, n*n
  if (e === 'n**2' || e === 'n*n') return 'n2';
  
  // n**3
  if (e === 'n**3') return 'n3';
  
  // n**0.5, n**(0.5), n**(1/2)
  if (e === 'n**0.5' || e === 'n**(0.5)' || e === 'n**(1/2)') return 'sqrt_n';
  
  // math.sqrt(n), int(n**0.5)
  if (e === 'math.sqrt(n)' || e === 'int(n**0.5)') return 'sqrt_n';
  
  // 2**n, 2^n
  if (e === '2**n' || e === '2^n') return 'exp_n';
  
  // len(...)
  if (e.startsWith('len(')) return 'n';
  
  // sorted(...), .sort(
  if (e.startsWith('sorted(') || e.includes('.sort(')) return 'n_log_n';
  
  // math.log(...), math.log2(...)
  if (e.startsWith('math.log(') || e.startsWith('math.log2(')) return 'log_n';
  
  // single word identifier
  if (/^\w+$/.test(e)) return e;
  
  // contains n
  if (e.includes('n')) return 'n';
  
  // anything else
  return '1';
}

// ============================================================================
// ARGUMENT SPLITTING
// ============================================================================

export function splitArgs(argsStr) {
  const args = [];
  let current = '';
  let depth = 0;
  
  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];
    if (ch === '(' || ch === '[') {
      depth++;
      current += ch;
    } else if (ch === ')' || ch === ']') {
      depth--;
      current += ch;
    } else if (ch === ',' && depth === 0) {
      args.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  
  if (current.trim()) {
    args.push(current.trim());
  }
  
  return args;
}

// ============================================================================
// RANGE ANALYSIS
// ============================================================================

export function analyzeRangeArgs(rangeArgs) {
  const args = splitArgs(rangeArgs);
  
  if (args.length === 1) {
    // range(stop)
    return analyzeExpression(args[0]);
  } else if (args.length === 2) {
    // range(start, stop)
    return analyzeExpression(args[1]);
  } else if (args.length === 3) {
    // range(start, stop, step) — step is constant divisor, same complexity
    return analyzeExpression(args[1]);
  }
  
  return '1';
}

// ============================================================================
// WHILE CONDITION PARSING
// ============================================================================

export function parseWhileCondition(condition) {
  const c = condition.replace(/\s+/g, '');
  
  // i*i <= n or i*i < n
  let match = c.match(/^(\w+)\*\1(<=?|<)(.+)$/);
  if (match) {
    return { var: match[1], bound: match[3], boundKind: 'sqrt_product' };
  }
  
  // i <= n, i < n, i <= n**0.5, etc.
  match = c.match(/^(\w+)(<=?|<)(.+)$/);
  if (match) {
    return { var: match[1], bound: match[3], boundKind: 'direct' };
  }
  
  // n >= i, n > i (reversed)
  match = c.match(/^(.+)(>=?|>)(\w+)$/);
  if (match) {
    return { var: match[3], bound: match[1], boundKind: 'direct' };
  }
  
  return null;
}
