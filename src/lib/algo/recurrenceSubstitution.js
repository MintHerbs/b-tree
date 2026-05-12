/**
 * Recurrence Solver - Substitution Method
 * Performs algebraic back-substitution to find general pattern
 */

import { identifySummation } from './recurrenceTypes.js';
import { fToTermShape, textToLatex } from './recurrenceParser.js';
import { displayComplexity, shortComplexity } from './complexityTypes.js';

/**
 * Apply Master Theorem to divide-type recurrence
 * @param {number} a - Number of subproblems
 * @param {number} b - Factor by which problem size is divided
 * @param {string} fComplexity - Complexity of f(n)
 * @param {Array} steps - Steps array to append to
 * @returns {string} Final complexity
 */
function applyMasterTheorem(a, b, fComplexity, steps) {
  const logba = Math.log(a) / Math.log(b);
  const fExponent = {
    '1': 0,
    'log_n': 0.05,
    'sqrt_n': 0.5,
    'n': 1,
    'n_log_n': 1.05,
    'n2': 2,
    'n3': 3
  }[fComplexity] ?? 1;

  steps.push({ text: `a=${a}, b=${b}, f(n)=O(${fComplexity})`, type: 'info', indent: 0 });
  steps.push({ text: `log_${b}(${a}) = ${logba.toFixed(2)}`, type: 'special', indent: 0 });

  if (Math.abs(fExponent - logba) < 0.1) {
    // Case 2: f(n) = Θ(n^log_b(a)) → multiply by log n
    const base = exponentToComplexity(logba);
    const result = addLogFactor(base);
    steps.push({ text: `Case 2: f(n) = Θ(n^log_b(a)) → multiply by log n`, type: 'special', indent: 0 });
    return result;
  } else if (fExponent > logba) {
    // Case 3: root work dominates (f(n) grows faster)
    steps.push({ text: `Case 3: f(n) grows faster than n^log_b(a) → O(f(n))`, type: 'special', indent: 0 });
    return fComplexity;
  } else {
    // Case 1: leaf work dominates (f(n) grows slower)
    const result = exponentToComplexity(logba);
    steps.push({ text: `Case 1: f(n) grows slower than n^log_b(a) → O(n^${logba.toFixed(2)})`, type: 'special', indent: 0 });
    return result;
  }
}

/**
 * Convert exponent to complexity string
 * @param {number} exp - Exponent value
 * @returns {string} Complexity string
 */
function exponentToComplexity(exp) {
  if (exp < 0.1) return '1';
  if (Math.abs(exp - 0.5) < 0.1) return 'sqrt_n';
  if (Math.abs(exp - 1) < 0.1) return 'n';
  if (Math.abs(exp - 2) < 0.1) return 'n2';
  if (Math.abs(exp - 3) < 0.1) return 'n3';
  return 'n';
}

/**
 * Add log factor to complexity
 * @param {string} complexity - Base complexity
 * @returns {string} Complexity with log factor
 */
function addLogFactor(complexity) {
  const map = {
    '1': 'log_n',
    'sqrt_n': 'sqrt_n_log_n',
    'n': 'n_log_n',
    'n2': 'n2_log_n',
    'n3': 'n3_log_n'
  };
  return map[complexity] ?? complexity;
}

/**
 * Solve recurrence using the substitution method
 * @param {Object} parsed - Parsed recurrence object from parseRecurrence
 * @returns {Object} { formulas, steps, finalComplexity }
 */
export function solveBySubstitution(parsed) {
  if (parsed.error) {
    return {
      formulas: [],
      steps: [{ text: `Error: ${parsed.error}`, type: 'info' }],
      finalComplexity: 'unknown',
    };
  }

  if (parsed.type === 'subtract') {
    return solveSubtractSubstitution(parsed);
  } else if (parsed.type === 'divide') {
    return solveDivideSubstitution(parsed);
  } else {
    return {
      formulas: [],
      steps: [{ text: 'Unsupported recurrence type', type: 'info' }],
      finalComplexity: 'unknown',
    };
  }
}

/**
 * Solve subtract-type recurrence using substitution
 */
function solveSubtractSubstitution(parsed) {
  const { a, b, f, fComplexity, original } = parsed;
  const formulas = [];
  
  // 1. Given formula
  formulas.push({
    latex: textToLatex(original),
    label: 'Given',
  });
  
  // 2. Replace n with n-b
  const sub1 = `T(n-${b}) = T(n-${b * 2}) + ${f.replace(/n/g, `n-${b}`)}`;
  formulas.push({
    latex: textToLatex(sub1),
    label: `Replace n with n-${b}`,
  });
  
  // 3. Substitute back
  const back1 = `T(n) = T(n-${b * 2}) + ${f.replace(/n/g, `n-${b}`)} + ${f}`;
  formulas.push({
    latex: textToLatex(back1),
    label: 'Substitute back',
  });
  
  // 4. Replace n with n-2b
  const sub2 = `T(n-${b * 2}) = T(n-${b * 3}) + ${f.replace(/n/g, `n-${b * 2}`)}`;
  formulas.push({
    latex: textToLatex(sub2),
    label: `Replace n with n-${b * 2}`,
  });
  
  // 5. Substitute back
  const back2 = `T(n) = T(n-${b * 3}) + ${f.replace(/n/g, `n-${b * 2}`)} + ${f.replace(/n/g, `n-${b}`)} + ${f}`;
  formulas.push({
    latex: textToLatex(back2),
    label: 'Substitute back',
  });
  
  // 6. Pattern label
  formulas.push({
    latex: '\\text{After } k \\text{ substitutions:}',
    label: 'Pattern',
  });
  
  // 7. General form with summation
  const sumTerm = f.replace(/n/g, 'n-i+1');
  formulas.push({
    latex: `T(n) = T(n-k) + \\sum_{i=1}^{k} ${textToLatex(sumTerm)}`,
    label: 'General form',
  });
  
  // 8. Set base case
  formulas.push({
    latex: `n - k = 0 \\implies k = n`,
    label: 'Set base case',
  });
  
  // 9. Expand with actual terms
  const expandedTerms = `${f.replace(/n/g, '1')} + ${f.replace(/n/g, '2')} + \\cdots + ${f}`;
  formulas.push({
    latex: `T(n) = T(0) + ${expandedTerms}`,
    label: 'Expand',
  });
  
  // Identify summation pattern
  const leafTerms = collectSubstitutionTerms(f, fComplexity);
  const identity = identifySummation(leafTerms);
  
  // 10. Apply summation identity
  if (identity) {
    if (identity.id === 'log_factorial') {
      formulas.push({
        latex: `= T(0) + \\log(n!)`,
        label: 'Log product rule',
      });
      formulas.push({
        latex: `= O(n \\log n)`,
        label: "By Stirling's approximation",
      });
    } else if (identity.id === 'arithmetic_series') {
      formulas.push({
        latex: `= T(0) + \\frac{n(n+1)}{2}`,
        label: 'Arithmetic series',
      });
      formulas.push({
        latex: `= O(n^{2})`,
        label: 'Final complexity',
      });
    } else if (identity.id === 'constant_sum') {
      formulas.push({
        latex: `= T(0) + n`,
        label: 'Sum of constants',
      });
      formulas.push({
        latex: `= O(n)`,
        label: 'Final complexity',
      });
    } else if (identity.id === 'sum_of_squares') {
      formulas.push({
        latex: `= T(0) + \\frac{n(n+1)(2n+1)}{6}`,
        label: 'Sum of squares',
      });
      formulas.push({
        latex: `= O(n^{3})`,
        label: 'Final complexity',
      });
    } else {
      formulas.push({
        latex: `= ${displayComplexity(identity.complexity)}`,
        label: 'Final complexity',
      });
    }
  } else {
    formulas.push({
      latex: `= O(n)`,
      label: 'Final complexity',
    });
  }
  
  // Build steps
  const steps = buildSubstitutionSteps(parsed, f, identity, 'subtract');
  const finalComplexity = identity ? identity.complexity : 'n';
  
  return { formulas, steps, finalComplexity };
}

/**
 * Solve divide-type recurrence using substitution
 */
function solveDivideSubstitution(parsed) {
  const { a, b, f, fComplexity, original } = parsed;
  const formulas = [];
  
  // 1. Given formula
  formulas.push({
    latex: textToLatex(original),
    label: 'Given',
  });
  
  // 2. Replace n with n/b
  const sub1 = `T(n/${b}) = ${a}T(n/${b * b}) + ${f.replace(/n/g, `n/${b}`)}`;
  formulas.push({
    latex: textToLatex(sub1),
    label: `Replace n with n/${b}`,
  });
  
  // 3. Substitute back
  const back1 = `T(n) = ${a}(${a}T(n/${b * b}) + ${f.replace(/n/g, `n/${b}`)}) + ${f}`;
  formulas.push({
    latex: textToLatex(back1),
    label: 'Substitute back',
  });
  
  // Simplify
  const simplified1 = `T(n) = ${a * a}T(n/${b * b}) + ${a}${f.replace(/n/g, `n/${b}`)} + ${f}`;
  formulas.push({
    latex: textToLatex(simplified1),
    label: 'Simplify',
  });
  
  // 4. Replace n with n/b²
  const sub2 = `T(n/${b * b}) = ${a}T(n/${b * b * b}) + ${f.replace(/n/g, `n/${b * b}`)}`;
  formulas.push({
    latex: textToLatex(sub2),
    label: `Replace n with n/${b * b}`,
  });
  
  // 5. Substitute back
  const back2 = `T(n) = ${a * a * a}T(n/${b * b * b}) + ${a * a}${f.replace(/n/g, `n/${b * b}`)} + ${a}${f.replace(/n/g, `n/${b}`)} + ${f}`;
  formulas.push({
    latex: textToLatex(back2),
    label: 'Substitute back',
  });
  
  // 6. Pattern
  formulas.push({
    latex: '\\text{After } k \\text{ substitutions:}',
    label: 'Pattern',
  });
  
  // 7. General form
  formulas.push({
    latex: `T(n) = a^{k}T(n/b^{k}) + \\sum_{i=0}^{k-1} a^{i}f(n/b^{i})`,
    label: 'General form',
  });
  
  // 8. Set base case
  formulas.push({
    latex: `n/b^{k} = 1 \\implies k = \\log_{b}(n)`,
    label: 'Set base case',
  });
  
  // 9. Apply Master Theorem (formulas will be added based on the case)
  formulas.push({
    latex: '\\text{Apply Master Theorem}',
    label: 'Master Theorem',
  });
  
  // Build steps (Master Theorem is applied inside buildSubstitutionSteps)
  const leafTerms = collectSubstitutionTerms(f, fComplexity);
  const identity = identifySummation(leafTerms);
  const steps = buildSubstitutionSteps(parsed, f, identity, 'divide');
  
  // Extract final complexity from steps
  const finalStep = steps.find(s => s.type === 'final');
  const finalComplexity = finalStep ? finalStep.complexity : 'n_log_n';
  
  // Add final complexity formula
  formulas.push({
    latex: `= ${displayComplexity(finalComplexity)}`,
    label: 'Final complexity',
  });
  
  return { formulas, steps, finalComplexity };
}

/**
 * Collect terms for substitution pattern recognition
 */
function collectSubstitutionTerms(f, fComplexity) {
  const terms = [];
  const termShape = fToTermShape(f);
  
  for (let i = 0; i < 5; i++) {
    terms.push({ ...termShape, arg: i === 0 ? 'n' : `n-${i}` });
  }
  
  return terms;
}

/**
 * Build terminal steps for substitution method
 */
function buildSubstitutionSteps(parsed, f, identity, type) {
  const steps = [];
  const { b } = parsed;
  
  steps.push({ text: `Parsed: ${parsed.original}`, type: 'info' });
  steps.push({ text: 'Method: Substitution (back-substitution)', type: 'info' });
  steps.push({ text: '', type: 'divider' });
  
  if (type === 'subtract') {
    steps.push({ text: `Substituting n → n−${b}:`, type: 'loop' });
    steps.push({ text: `  T(n−${b}) = T(n−${b * 2}) + ${f.replace(/n/g, `n−${b}`)}`, type: 'combine_nested' });
    steps.push({ text: 'Back-substituting into T(n):', type: 'loop' });
    steps.push({ text: `  T(n) = T(n−${b * 2}) + ${f.replace(/n/g, `n−${b}`)} + ${f}`, type: 'combine_nested' });
    steps.push({ text: `Substituting n → n−${b * 2}:`, type: 'loop' });
    steps.push({ text: `  T(n−${b * 2}) = T(n−${b * 3}) + ${f.replace(/n/g, `n−${b * 2}`)}`, type: 'combine_nested' });
    steps.push({ text: 'Back-substituting:', type: 'loop' });
    steps.push({ text: `  T(n) = T(n−${b * 3}) + ${f.replace(/n/g, `n−${b * 2}`)} + ${f.replace(/n/g, `n−${b}`)} + ${f}`, type: 'combine_nested' });
    steps.push({ text: '', type: 'divider' });
    steps.push({ text: 'General pattern after k steps:', type: 'special' });
    steps.push({ text: `  T(n) = T(n−k) + Σ ${f.replace(/n/g, 'n−i+1')} for i=1..k`, type: 'special' });
    steps.push({ text: `Setting base case: n − k = 0 → k = n`, type: 'special' });
    steps.push({ text: `  T(n) = T(0) + ${f.replace(/n/g, '1')} + ${f.replace(/n/g, '2')} + ... + ${f}`, type: 'special' });
    
    if (identity) {
      steps.push({ text: '', type: 'divider' });
      steps.push({ text: `Recognized: ${identity.name.toLowerCase()}`, type: 'special' });
      
      if (identity.id === 'log_factorial') {
        steps.push({ text: 'Recognized: log(n!) by log product rule', type: 'special' });
        steps.push({ text: "By Stirling: log(n!) = Θ(n log n)", type: 'special' });
      } else {
        steps.push({ text: identity.explanation, type: 'special' });
      }
    }
    
    steps.push({ text: '─────────────────────────────────', type: 'divider' });
    const finalComp = identity ? identity.complexity : 'n';
    steps.push({ text: `FINAL COMPLEXITY: ${displayComplexity(finalComp)}`, type: 'final', complexity: finalComp });
  } else {
    // divide type
    steps.push({ text: `Substituting n → n/${b}:`, type: 'loop' });
    steps.push({ text: `  T(n/${b}) = ${parsed.a}T(n/${b * b}) + ${f.replace(/n/g, `n/${b}`)}`, type: 'combine_nested' });
    steps.push({ text: 'Back-substituting:', type: 'loop' });
    steps.push({ text: `  T(n) = ${parsed.a * parsed.a}T(n/${b * b}) + ${parsed.a}${f.replace(/n/g, `n/${b}`)} + ${f}`, type: 'combine_nested' });
    steps.push({ text: '', type: 'divider' });
    steps.push({ text: 'General pattern after k steps:', type: 'special' });
    steps.push({ text: `  T(n) = a^k T(n/b^k) + Σ a^i f(n/b^i) for i=0..k-1`, type: 'special' });
    steps.push({ text: `Setting base case: n/b^k = 1 → k = log_${b}(n)`, type: 'special' });
    
    steps.push({ text: '', type: 'divider' });
    steps.push({ text: 'Applying Master Theorem:', type: 'info' });
    
    // Use Master Theorem instead of summation identity
    const finalComplexity = applyMasterTheorem(parsed.a, parsed.b, parsed.fComplexity, steps);
    
    steps.push({ text: '─────────────────────────────────', type: 'divider' });
    steps.push({ text: `FINAL COMPLEXITY: ${displayComplexity(finalComplexity)}`, type: 'final', complexity: finalComplexity });
  }
  
  return steps;
}
