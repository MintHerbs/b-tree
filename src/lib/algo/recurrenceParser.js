/**
 * Recurrence Formula Parser
 * Parses strings like "T(n) = T(n-1) + log(n)" into structured objects
 */

/**
 * Parse a recurrence formula string into a structured object
 * @param {string} formulaStr - The recurrence formula (e.g., "T(n) = T(n-1) + log(n)")
 * @returns {Object} Parsed recurrence object with type, coefficients, and complexity
 */
export function parseRecurrence(formulaStr) {
  try {
    // 1. Trim and normalize spaces
    let formula = formulaStr.trim().replace(/\s+/g, ' ');
    
    // 2. Split on '='
    const parts = formula.split('=');
    if (parts.length !== 2) {
      return { error: 'Invalid format: expected T(n) = ...' };
    }
    
    const rightSide = parts[1].trim();
    
    // 3. Find all T(...) terms with optional coefficient
    const tTermRegex = /(\d*)T\(([^)]+)\)/g;
    const tTerms = [];
    let match;
    let remainingFormula = rightSide;
    
    while ((match = tTermRegex.exec(rightSide)) !== null) {
      const coefficient = match[1] ? parseInt(match[1]) : 1;
      const argument = match[2].trim();
      tTerms.push({ coefficient, argument, fullMatch: match[0] });
    }
    
    if (tTerms.length === 0) {
      return { error: 'No recursive terms found' };
    }
    
    // 5. Extract f(n) by removing all T terms
    tTerms.forEach(term => {
      remainingFormula = remainingFormula.replace(term.fullMatch, '');
    });
    
    // Clean up remaining formula: remove leading/trailing + and spaces
    let f = remainingFormula.replace(/^\+\s*/, '').replace(/\+\s*$/, '').trim();
    if (!f) f = '1'; // If nothing remains, f(n) = 1
    
    // 6. Classify type based on first T term argument
    const firstArg = tTerms[0].argument;
    const a = tTerms[0].coefficient;
    let type, b, subproblem;
    
    if (firstArg.includes('/')) {
      // Divide type: T(n/2), T(n/3), etc.
      type = 'divide';
      subproblem = firstArg;
      
      // Extract divisor
      const divMatch = firstArg.match(/n\s*\/\s*(\d+)/);
      b = divMatch ? parseInt(divMatch[1]) : 2;
    } else if (firstArg.includes('-')) {
      // Subtract type: T(n-1), T(n-2), etc.
      type = 'subtract';
      subproblem = firstArg;
      
      // Extract subtractor
      const subMatch = firstArg.match(/n\s*-\s*(\d+)/);
      b = subMatch ? parseInt(subMatch[1]) : 1;
    } else if (tTerms.length > 1 && tTerms[0].argument !== tTerms[1].argument) {
      // Multiple different T arguments (e.g., Fibonacci)
      type = 'fibonacci';
      subproblem = tTerms.map(t => t.argument).join(', ');
      b = 1;
    } else {
      // Default to subtract type
      type = 'subtract';
      subproblem = firstArg;
      b = 1;
    }
    
    // 7. Classify f(n) complexity
    const fComplexity = classifyFComplexity(f);
    
    return {
      type,
      a,
      subproblem,
      b,
      f,
      fComplexity,
      original: formulaStr.trim(),
    };
  } catch (err) {
    return { error: `Parse error: ${err.message}` };
  }
}

/**
 * Classify the complexity of f(n)
 * @param {string} fStr - The f(n) string
 * @returns {string} Complexity key
 */
function classifyFComplexity(fStr) {
  const normalized = fStr.toLowerCase().replace(/\s+/g, '');
  
  // Check for specific patterns
  if (/^[0-9]+$/.test(normalized) || normalized === '1') {
    return '1';
  }
  
  if (normalized.includes('log') && normalized.includes('n') && normalized.includes('*')) {
    return 'n_log_n';
  }
  
  if (normalized.includes('log')) {
    return 'log_n';
  }
  
  if (normalized.includes('n^3') || normalized.includes('n*n*n')) {
    return 'n3';
  }
  
  if (normalized.includes('n^2') || normalized.includes('n*n')) {
    return 'n2';
  }
  
  if (normalized.includes('sqrt') || normalized.includes('n^0.5')) {
    return 'sqrt_n';
  }
  
  if (normalized === 'n') {
    return 'n';
  }
  
  // Default to treating as constant if unrecognized
  return '1';
}

/**
 * Convert plain text formula to LaTeX string
 * @param {string} text - Plain text formula
 * @returns {string} LaTeX formatted string
 */
export function textToLatex(text) {
  let latex = text;
  
  // Apply conversions in order
  
  // 1. log( → \log(
  latex = latex.replace(/log\(/g, '\\log(');
  
  // 2. sqrt( → \sqrt{ and matching ) → }
  latex = latex.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
  
  // 3. Standalone fractions: digits/digits → \frac{num}{denom}
  // But NOT inside T() arguments
  // Match fractions that are not inside T(...)
  latex = latex.replace(/(\d+)\/(\d+)(?![^T]*\))/g, '\\frac{$1}{$2}');
  
  // 4. ^ followed by single char or {group} → ^{...}
  // If already has braces, leave it; otherwise wrap single char
  latex = latex.replace(/\^([0-9a-zA-Z])/g, '^{$1}');
  latex = latex.replace(/\^\(([^)]+)\)/g, '^{$1}');
  
  // 5. * → \times (with spaces)
  latex = latex.replace(/\*/g, ' \\times ');
  
  // 6. ... → \cdots
  latex = latex.replace(/\.\.\./g, '\\cdots');
  
  // 7. >= → \geq
  latex = latex.replace(/>=/g, '\\geq');
  
  // 8. <= → \leq
  latex = latex.replace(/<=/g, '\\leq');
  
  // Clean up extra spaces
  latex = latex.replace(/\s+/g, ' ').trim();
  
  return latex;
}

/**
 * Convert f(n) string to term shape object
 * @param {string} fStr - The f(n) string (e.g., "n", "n^2", "log(n)", "1")
 * @returns {Object} Term object with fn, exponent, value properties
 */
export function fToTermShape(fStr) {
  const normalized = fStr.toLowerCase().replace(/\s+/g, '');
  
  // Check for constant
  if (/^[0-9]+$/.test(normalized)) {
    return { fn: 'const', value: parseInt(normalized) };
  }
  
  if (normalized === '1') {
    return { fn: 'const', value: 1 };
  }
  
  // Check for logarithmic
  if (normalized.includes('log')) {
    return { fn: 'log', arg: 'n' };
  }
  
  // Check for reciprocal (1/n)
  if (normalized.match(/^1\/n$/)) {
    return { fn: 'reciprocal', arg: 'n' };
  }
  
  // Check for power
  if (normalized.includes('n^3')) {
    return { fn: 'power', exponent: 3, arg: 'n' };
  }
  
  if (normalized.includes('n^2') || normalized.includes('n*n')) {
    return { fn: 'power', exponent: 2, arg: 'n' };
  }
  
  if (normalized === 'n') {
    return { fn: 'power', exponent: 1, arg: 'n' };
  }
  
  // Check for sqrt
  if (normalized.includes('sqrt')) {
    return { fn: 'power', exponent: 0.5, arg: 'n' };
  }
  
  // Default to constant
  return { fn: 'const', value: 1 };
}
