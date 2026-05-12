/**
 * Recurrence Solver - Tree Method
 * Builds recursion tree and identifies summation patterns
 */

import { identifySummation, SUMMATION_IDENTITIES } from './recurrenceTypes.js';
import { fToTermShape } from './recurrenceParser.js';
import { displayComplexity, shortComplexity } from './complexityTypes.js';

// Re-export substitution method from separate file
export { solveBySubstitution } from './recurrenceSubstitution.js';

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
 * Solve recurrence using the tree method
 * @param {Object} parsed - Parsed recurrence object from parseRecurrence
 * @returns {Object} { tree, steps, finalComplexity }
 */
export function solveByTree(parsed) {
  if (parsed.error) {
    return {
      tree: { nodes: [], edges: [] },
      steps: [{ text: `Error: ${parsed.error}`, type: 'info' }],
      finalComplexity: 'unknown',
    };
  }

  if (parsed.type === 'subtract') {
    return solveSubtractTree(parsed);
  } else if (parsed.type === 'divide') {
    return solveDivideTree(parsed);
  } else {
    return {
      tree: { nodes: [], edges: [] },
      steps: [{ text: 'Unsupported recurrence type', type: 'info' }],
      finalComplexity: 'unknown',
    };
  }
}

/**
 * Solve subtract-type recurrence: T(n) = T(n-c) + f(n)
 */
function solveSubtractTree(parsed) {
  const { a, b, f, fComplexity } = parsed;
  
  // Build tree nodes with right-leaning chain layout
  const nodes = [];
  const edges = [];
  
  // Constants for layout
  const LEVEL_HEIGHT = 70;
  const X_SHIFT_RIGHT = 105;
  const X_LEAF_OFFSET = 115;
  const START_X = 165;
  const START_Y = 55;
  
  // Level 0: T(n)
  nodes.push({ id: 'n0', label: 'T(n)', type: 'recursive', x: START_X, y: START_Y, level: 0 });
  nodes.push({ id: 'l0', label: f, type: 'leaf', x: START_X - X_LEAF_OFFSET, y: START_Y + LEVEL_HEIGHT, level: 0 });
  edges.push({ from: 'n0', to: 'l0' });
  
  // Level 1: T(n-1)
  const x1 = START_X + X_SHIFT_RIGHT;
  const y1 = START_Y + LEVEL_HEIGHT;
  nodes.push({ id: 'n1', label: `T(n−${b})`, type: 'recursive', x: x1, y: y1, level: 1 });
  nodes.push({ id: 'l1', label: f.replace(/n/g, `n−${b}`), type: 'leaf', x: x1 - X_LEAF_OFFSET, y: y1 + LEVEL_HEIGHT, level: 1 });
  edges.push({ from: 'n0', to: 'n1' });
  edges.push({ from: 'n1', to: 'l1' });
  
  // Level 2: T(n-2)
  const x2 = x1 + X_SHIFT_RIGHT;
  const y2 = y1 + LEVEL_HEIGHT;
  nodes.push({ id: 'n2', label: `T(n−${b * 2})`, type: 'recursive', x: x2, y: y2, level: 2 });
  nodes.push({ id: 'l2', label: f.replace(/n/g, `n−${b * 2}`), type: 'leaf', x: x2 - X_LEAF_OFFSET, y: y2 + LEVEL_HEIGHT, level: 2 });
  edges.push({ from: 'n1', to: 'n2' });
  edges.push({ from: 'n2', to: 'l2' });
  
  // Level 3: T(n-3)
  const x3 = x2 + 80;
  const y3 = y2 + LEVEL_HEIGHT;
  nodes.push({ id: 'n3', label: `T(n−${b * 3})`, type: 'recursive', x: x3, y: y3, level: 3 });
  edges.push({ from: 'n2', to: 'n3' });
  
  // Dots
  const dotsY = y3 + 52;
  nodes.push({ id: 'dots1', type: 'dots', x: x3, y: dotsY });
  nodes.push({ id: 'dots2', type: 'dots', x: x3, y: dotsY + 16 });
  nodes.push({ id: 'dots3', type: 'dots', x: x3, y: dotsY + 32 });
  
  // Base cases: T(2), T(1), T(0)
  const xEnd2 = x3;
  const yEnd2 = dotsY + 73;
  nodes.push({ id: 'n_end2', label: 'T(2)', type: 'recursive', x: xEnd2, y: yEnd2 });
  nodes.push({ id: 'l_end2', label: f.replace(/n/g, '2'), type: 'leaf', x: xEnd2 - X_LEAF_OFFSET, y: yEnd2 + LEVEL_HEIGHT });
  edges.push({ from: 'n_end2', to: 'l_end2' });
  
  const xEnd1 = xEnd2 + 55;
  const yEnd1 = yEnd2 + LEVEL_HEIGHT;
  nodes.push({ id: 'n_end1', label: 'T(1)', type: 'recursive', x: xEnd1, y: yEnd1 });
  nodes.push({ id: 'l_end1', label: f.replace(/n/g, '1'), type: 'leaf', x: xEnd1 - X_LEAF_OFFSET, y: yEnd1 + LEVEL_HEIGHT });
  edges.push({ from: 'n_end2', to: 'n_end1' });
  edges.push({ from: 'n_end1', to: 'l_end1' });
  
  const xBase = xEnd1 + 45;
  const yBase = yEnd1 + LEVEL_HEIGHT;
  nodes.push({ id: 'n_base', label: 'T(0)', type: 'base', x: xBase, y: yBase });
  edges.push({ from: 'n_end1', to: 'n_base' });
  
  // Collect leaf terms for summation
  const leafTerms = collectSubtractLeafTerms(f, fComplexity);
  
  // Identify summation pattern
  const identity = identifySummation(leafTerms);
  
  // Build steps
  const steps = buildSubtractSteps(parsed, f, identity);
  
  const finalComplexity = identity ? identity.complexity : fComplexity;
  
  return { tree: { nodes, edges }, steps, finalComplexity };
}

/**
 * Solve divide-type recurrence: T(n) = aT(n/b) + f(n)
 */
function solveDivideTree(parsed) {
  const { a, b, f, fComplexity } = parsed;
  
  const nodes = [];
  const edges = [];
  const levelCosts = [];
  
  const SVG_WIDTH = 800;
  const LEVELS_SHOWN = 3;
  const LEVEL_HEIGHT = 120;
  
  // Helper function to calculate x position for node i at level k
  const getNodeX = (level, index) => {
    const nodesAtLevel = Math.pow(a, level);
    return (2 * index + 1) * SVG_WIDTH / (2 * nodesAtLevel);
  };
  
  // Level 0: root
  const level0Y = 60;
  nodes.push({ 
    id: 'n0', 
    label: 'T(n)', 
    type: 'recursive', 
    x: getNodeX(0, 0), 
    y: level0Y, 
    level: 0 
  });
  levelCosts.push({ level: 0, label: f, y: level0Y });
  
  // Level 1: a children
  const level1Y = level0Y + LEVEL_HEIGHT;
  for (let i = 0; i < a; i++) {
    const x = getNodeX(1, i);
    const nodeId = `n1_${i}`;
    nodes.push({ 
      id: nodeId, 
      label: `T(n/${b})`, 
      type: 'recursive', 
      x, 
      y: level1Y, 
      level: 1 
    });
    edges.push({ from: 'n0', to: nodeId });
  }
  levelCosts.push({ level: 1, label: f, y: level1Y });
  
  // Level 2: a² children
  const level2Y = level1Y + LEVEL_HEIGHT;
  const nodesAtLevel2 = Math.pow(a, 2);
  for (let i = 0; i < nodesAtLevel2; i++) {
    const x = getNodeX(2, i);
    const nodeId = `n2_${i}`;
    const parentIdx = Math.floor(i / a);
    nodes.push({ 
      id: nodeId, 
      label: `T(n/${b * b})`, 
      type: 'recursive', 
      x, 
      y: level2Y, 
      level: 2 
    });
    edges.push({ from: `n1_${parentIdx}`, to: nodeId });
  }
  levelCosts.push({ level: 2, label: f, y: level2Y });
  
  // Dots below level 2
  const dotsY = level2Y + LEVEL_HEIGHT;
  const centerX = SVG_WIDTH / 2;
  nodes.push({ id: 'dots1', type: 'dots', x: centerX - 50, y: dotsY });
  nodes.push({ id: 'dots2', type: 'dots', x: centerX, y: dotsY });
  nodes.push({ id: 'dots3', type: 'dots', x: centerX + 50, y: dotsY });
  
  // Collect terms and identify pattern (no longer used for final complexity)
  const leafTerms = collectDivideLeafTerms(f, fComplexity, a, b);
  const identity = identifySummation(leafTerms);
  
  // Build steps (Master Theorem is applied inside buildDivideSteps)
  const steps = buildDivideSteps(parsed, f, a, b, identity);
  
  // Extract final complexity from steps
  const finalStep = steps.find(s => s.type === 'final');
  const finalComplexity = finalStep ? finalStep.complexity : 'n_log_n';
  
  return { 
    tree: { 
      nodes, 
      edges, 
      levelCosts 
    }, 
    steps, 
    finalComplexity 
  };
}

/**
 * Collect leaf terms for subtract-type recurrence
 */
function collectSubtractLeafTerms(f, fComplexity) {
  const terms = [];
  const termShape = fToTermShape(f);
  
  // Generate n terms from n down to 1
  for (let i = 0; i < 5; i++) {
    terms.push({ ...termShape, arg: i === 0 ? 'n' : `n-${i}` });
  }
  
  return terms;
}

/**
 * Collect leaf terms for divide-type recurrence
 */
function collectDivideLeafTerms(f, fComplexity, a, b) {
  const terms = [];
  const termShape = fToTermShape(f);
  
  // For divide type, check if it's repeated n pattern
  if (termShape.fn === 'power' && termShape.exponent === 1) {
    // n repeated log_b(n) times
    const logLevels = 5; // Approximate
    for (let i = 0; i < logLevels; i++) {
      terms.push({ ...termShape, arg: 'n' });
    }
  } else {
    // Other patterns
    for (let i = 0; i < 5; i++) {
      terms.push({ ...termShape });
    }
  }
  
  return terms;
}

/**
 * Build terminal steps for subtract-type recurrence
 */
function buildSubtractSteps(parsed, f, identity) {
  const steps = [];
  const { b } = parsed;
  
  steps.push({ text: `Parsed: ${parsed.original}`, type: 'info' });
  steps.push({ text: `Form: subtract type (n−${b}), work per level: ${f}`, type: 'info' });
  steps.push({ text: 'Building recursion tree...', type: 'info' });
  steps.push({ text: '', type: 'divider' });
  
  steps.push({ text: `Level 0:  ${f}`, type: 'loop' });
  steps.push({ text: `Level 1:  ${f.replace(/n/g, `n−${b}`)}`, type: 'loop' });
  steps.push({ text: `Level 2:  ${f.replace(/n/g, `n−${b * 2}`)}`, type: 'loop' });
  steps.push({ text: '⋮', type: 'info' });
  steps.push({ text: `Level n−1: ${f.replace(/n/g, '1')}`, type: 'loop' });
  
  steps.push({ text: '', type: 'divider' });
  steps.push({ text: 'Summing all levels:', type: 'info' });
  steps.push({ text: `${f} + ${f.replace(/n/g, `n−${b}`)} + ... + ${f.replace(/n/g, '2')} + ${f.replace(/n/g, '1')}`, type: 'combine_nested' });
  
  if (identity) {
    steps.push({ text: '', type: 'divider' });
    steps.push({ text: `Recognized: ${identity.name.toLowerCase()}`, type: 'special' });
    
    if (identity.id === 'log_factorial') {
      steps.push({ text: `= ${f} × ${f.replace(/n/g, 'n−1')} × ... × ${f.replace(/n/g, '2')} × ${f.replace(/n/g, '1')}`, type: 'special' });
      steps.push({ text: `= ${identity.formula}`, type: 'special' });
      steps.push({ text: identity.explanation, type: 'special' });
    } else {
      steps.push({ text: `= ${identity.formula}`, type: 'special' });
      steps.push({ text: identity.explanation, type: 'special' });
    }
  }
  
  steps.push({ text: '─────────────────────────────────', type: 'divider' });
  const finalComp = identity ? identity.complexity : 'n';
  steps.push({ text: `FINAL COMPLEXITY: ${displayComplexity(finalComp)}`, type: 'final', complexity: finalComp });
  
  return steps;
}

/**
 * Build terminal steps for divide-type recurrence
 */
function buildDivideSteps(parsed, f, a, b, identity) {
  const steps = [];
  
  steps.push({ text: `Parsed: ${parsed.original}`, type: 'info' });
  steps.push({ text: `Divide type: a=${a}, b=${b}, f(n) = ${f}`, type: 'info' });
  steps.push({ text: 'Building recursion tree...', type: 'info' });
  steps.push({ text: '', type: 'divider' });
  
  steps.push({ text: `Level 0: 1 node  × ${f}     = ${f}`, type: 'loop' });
  steps.push({ text: `Level 1: ${a} nodes × ${f.replace(/n/g, `n/${b}`)}   = ${f}`, type: 'loop' });
  steps.push({ text: `Level 2: ${a * a} nodes × ${f.replace(/n/g, `n/${b * b}`)}   = ${f}`, type: 'loop' });
  steps.push({ text: '⋮', type: 'info' });
  steps.push({ text: `Height: log₂(n) levels`, type: 'info' });
  
  steps.push({ text: '', type: 'divider' });
  steps.push({ text: 'Applying Master Theorem:', type: 'info' });
  
  // Use Master Theorem instead of summation identity
  const finalComplexity = applyMasterTheorem(a, b, parsed.fComplexity, steps);
  
  steps.push({ text: '─────────────────────────────────', type: 'divider' });
  steps.push({ text: `FINAL COMPLEXITY: ${displayComplexity(finalComplexity)}`, type: 'final', complexity: finalComplexity });
  
  return steps;
}
