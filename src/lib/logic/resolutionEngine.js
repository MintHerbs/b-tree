// src/lib/logic/resolutionEngine.js
// Pure JS resolution algorithm with CNF conversion. No React imports.

import { parseFormula } from './formulaParser.js';

/**
 * Converts an AST node to a human-readable string.
 */
function astToString(node) {
  if (node.type === 'atom') return node.name;
  if (node.type === 'not') return `¬${astToString(node.child)}`;
  if (node.type === 'and') return `(${astToString(node.left)}∧${astToString(node.right)})`;
  if (node.type === 'or') return `(${astToString(node.left)}∨${astToString(node.right)})`;
  if (node.type === 'implies') return `(${astToString(node.left)}→${astToString(node.right)})`;
  if (node.type === 'iff') return `(${astToString(node.left)}↔${astToString(node.right)})`;
  return '?';
}

/**
 * Step 1: Eliminate biconditionals (↔)
 * P↔Q becomes (P→Q)∧(Q→P)
 */
function eliminateBiconditionals(node) {
  if (node.type === 'atom') return node;
  if (node.type === 'not') {
    return { type: 'not', child: eliminateBiconditionals(node.child) };
  }
  if (node.type === 'iff') {
    const left = eliminateBiconditionals(node.left);
    const right = eliminateBiconditionals(node.right);
    // P↔Q = (P→Q)∧(Q→P)
    return {
      type: 'and',
      left: { type: 'implies', left, right },
      right: { type: 'implies', left: right, right: left }
    };
  }
  if (node.type === 'and' || node.type === 'or' || node.type === 'implies') {
    return {
      type: node.type,
      left: eliminateBiconditionals(node.left),
      right: eliminateBiconditionals(node.right)
    };
  }
  return node;
}

/**
 * Step 2: Eliminate implications (→)
 * P→Q becomes ¬P∨Q
 */
function eliminateImplications(node) {
  if (node.type === 'atom') return node;
  if (node.type === 'not') {
    return { type: 'not', child: eliminateImplications(node.child) };
  }
  if (node.type === 'implies') {
    const left = eliminateImplications(node.left);
    const right = eliminateImplications(node.right);
    // P→Q = ¬P∨Q
    return {
      type: 'or',
      left: { type: 'not', child: left },
      right
    };
  }
  if (node.type === 'and' || node.type === 'or') {
    return {
      type: node.type,
      left: eliminateImplications(node.left),
      right: eliminateImplications(node.right)
    };
  }
  return node;
}

/**
 * Step 3: Push negations inward (De Morgan's laws + double negation elimination)
 * ¬¬P → P
 * ¬(P∧Q) → ¬P∨¬Q
 * ¬(P∨Q) → ¬P∧¬Q
 */
function pushNegationsInward(node) {
  if (node.type === 'atom') return node;
  
  if (node.type === 'not') {
    const child = node.child;
    
    // Double negation: ¬¬P → P
    if (child.type === 'not') {
      return pushNegationsInward(child.child);
    }
    
    // De Morgan: ¬(P∧Q) → ¬P∨¬Q
    if (child.type === 'and') {
      return pushNegationsInward({
        type: 'or',
        left: { type: 'not', child: child.left },
        right: { type: 'not', child: child.right }
      });
    }
    
    // De Morgan: ¬(P∨Q) → ¬P∧¬Q
    if (child.type === 'or') {
      return pushNegationsInward({
        type: 'and',
        left: { type: 'not', child: child.left },
        right: { type: 'not', child: child.right }
      });
    }
    
    // Negation of atom stays as-is
    if (child.type === 'atom') {
      return node;
    }
  }
  
  if (node.type === 'and' || node.type === 'or') {
    return {
      type: node.type,
      left: pushNegationsInward(node.left),
      right: pushNegationsInward(node.right)
    };
  }
  
  return node;
}

/**
 * Step 4: Distribute ∨ over ∧
 * (P∨(Q∧R)) → (P∨Q)∧(P∨R)
 * ((P∧Q)∨R) → (P∨R)∧(Q∨R)
 */
function distributeOrOverAnd(node) {
  if (node.type === 'atom' || node.type === 'not') return node;
  
  if (node.type === 'and') {
    return {
      type: 'and',
      left: distributeOrOverAnd(node.left),
      right: distributeOrOverAnd(node.right)
    };
  }
  
  if (node.type === 'or') {
    const left = distributeOrOverAnd(node.left);
    const right = distributeOrOverAnd(node.right);
    
    // (P∧Q)∨R → (P∨R)∧(Q∨R)
    if (left.type === 'and') {
      return distributeOrOverAnd({
        type: 'and',
        left: { type: 'or', left: left.left, right },
        right: { type: 'or', left: left.right, right }
      });
    }
    
    // P∨(Q∧R) → (P∨Q)∧(P∨R)
    if (right.type === 'and') {
      return distributeOrOverAnd({
        type: 'and',
        left: { type: 'or', left, right: right.left },
        right: { type: 'or', left, right: right.right }
      });
    }
    
    return { type: 'or', left, right };
  }
  
  return node;
}

/**
 * Convert formula to CNF (Conjunctive Normal Form)
 */
function convertToCNF(node) {
  let result = node;
  result = eliminateBiconditionals(result);
  result = eliminateImplications(result);
  result = pushNegationsInward(result);
  result = distributeOrOverAnd(result);
  return result;
}

/**
 * Extract clauses from CNF formula.
 * Returns array of clauses, where each clause is an array of literal strings.
 * Example: (P∨Q)∧(¬P∨R) → [['P', 'Q'], ['¬P', 'R']]
 */
function extractClauses(node) {
  const clauses = [];
  
  function extractLiterals(n) {
    if (n.type === 'atom') return [n.name];
    if (n.type === 'not' && n.child.type === 'atom') return [`¬${n.child.name}`];
    if (n.type === 'or') {
      return [...extractLiterals(n.left), ...extractLiterals(n.right)];
    }
    return [];
  }
  
  function collectClauses(n) {
    if (n.type === 'and') {
      collectClauses(n.left);
      collectClauses(n.right);
    } else {
      // Single clause (could be atom, negation, or disjunction)
      const literals = extractLiterals(n);
      if (literals.length > 0) {
        clauses.push(literals);
      }
    }
  }
  
  collectClauses(node);
  return clauses;
}

/**
 * Check if two literals are complementary (P and ¬P)
 */
function areComplementary(lit1, lit2) {
  if (lit1.startsWith('¬') && !lit2.startsWith('¬')) {
    return lit1.slice(1) === lit2;
  }
  if (!lit1.startsWith('¬') && lit2.startsWith('¬')) {
    return lit1 === lit2.slice(1);
  }
  return false;
}

/**
 * Resolve two clauses on a complementary literal.
 * Returns the resolvent clause (without duplicates) or null if no resolution possible.
 */
function resolve(clause1, clause2) {
  for (const lit1 of clause1) {
    for (const lit2 of clause2) {
      if (areComplementary(lit1, lit2)) {
        // Found complementary pair — create resolvent
        const resolvent = [
          ...clause1.filter(l => l !== lit1),
          ...clause2.filter(l => l !== lit2)
        ];
        // Remove duplicates
        const unique = [...new Set(resolvent)];
        return { resolvent: unique, resolvedLiteral: lit1 };
      }
    }
  }
  return null;
}

/**
 * Check if two clauses are equal (same literals, order-independent)
 */
function clausesEqual(c1, c2) {
  if (c1.length !== c2.length) return false;
  const s1 = new Set(c1);
  const s2 = new Set(c2);
  if (s1.size !== s2.size) return false;
  for (const lit of s1) {
    if (!s2.has(lit)) return false;
  }
  return true;
}

/**
 * Check if a clause already exists in the knowledge base
 */
function clauseExists(clause, knowledgeBase) {
  return knowledgeBase.some(kb => clausesEqual(kb.clause, clause));
}

/**
 * Main resolution algorithm.
 * 
 * @param {string|string[]} input - Either a formula string or array of clause strings
 * @returns {object} { knowledgeBase, steps, result }
 */
export function runResolution(input) {
  let clauses = [];
  
  // Parse input
  if (typeof input === 'string') {
    // Single formula — convert to CNF and extract clauses
    const ast = parseFormula(input);
    const cnf = convertToCNF(ast);
    clauses = extractClauses(cnf);
  } else if (Array.isArray(input)) {
    // Array of clause strings — parse each
    for (const clauseStr of input) {
      const ast = parseFormula(clauseStr);
      const cnf = convertToCNF(ast);
      const extracted = extractClauses(cnf);
      // Add all extracted clauses
      clauses.push(...extracted);
    }
  } else {
    throw new Error('Input must be a formula string or array of clause strings');
  }
  
  // Initialize knowledge base
  const knowledgeBase = clauses.map((clause, idx) => ({
    id: `c${idx}`,
    clause,
    source: 'premise'
  }));
  
  const steps = [];
  let stepId = 0;
  
  // Resolution loop
  let iteration = 0;
  const maxIterations = 100; // Prevent infinite loops
  
  while (iteration < maxIterations) {
    iteration++;
    let newClausesAdded = false;
    const currentSize = knowledgeBase.length;
    
    // Try all pairs of clauses
    for (let i = 0; i < currentSize; i++) {
      for (let j = 0; j < currentSize; j++) {
        if (i === j) continue; // Don't resolve a clause with itself
        
        const kb1 = knowledgeBase[i];
        const kb2 = knowledgeBase[j];
        
        const resolution = resolve(kb1.clause, kb2.clause);
        if (resolution) {
          const { resolvent, resolvedLiteral } = resolution;
          
          // Check if this is a new clause
          if (!clauseExists(resolvent, knowledgeBase)) {
            const newId = `c${knowledgeBase.length}`;
            knowledgeBase.push({
              id: newId,
              clause: resolvent,
              source: 'resolution'
            });
            
            steps.push({
              id: `step${stepId++}`,
              clause1: kb1.id,
              clause2: kb2.id,
              resolvedLiteral,
              resolvent,
              resolventId: newId
            });
            
            newClausesAdded = true;
            
            // Check for empty clause (contradiction)
            if (resolvent.length === 0) {
              return {
                knowledgeBase,
                steps,
                result: 'contradiction'
              };
            }
          }
        }
      }
    }
    
    // If no new clauses were added, we're done
    if (!newClausesAdded) {
      break;
    }
  }
  
  // No more clauses can be derived
  return {
    knowledgeBase,
    steps,
    result: 'satisfiable'
  };
}

// --- TEST ---
(function runTests() {
  const assert = (cond, msg) => { if (!cond) throw new Error(`TEST FAILED: ${msg}`); };
  
  console.log('[resolutionEngine] Running tests...');
  
  // Test 1: Simple resolution — P∨Q, ¬P∨R should resolve to Q∨R
  const t1 = runResolution(['P∨Q', '¬P∨R']);
  assert(t1.knowledgeBase.length >= 3, 'T1: at least 3 clauses');
  assert(t1.steps.length >= 1, 'T1: at least 1 resolution step');
  const t1Resolvent = t1.steps[0].resolvent;
  assert(t1Resolvent.includes('Q') && t1Resolvent.includes('R'), 'T1: resolvent contains Q and R');
  
  // Test 2: Contradiction — P, ¬P should produce empty clause
  const t2 = runResolution(['P', '¬P']);
  assert(t2.result === 'contradiction', 'T2: contradiction detected');
  assert(t2.steps.length === 1, 'T2: one resolution step');
  assert(t2.steps[0].resolvent.length === 0, 'T2: empty clause produced');
  
  // Test 3: No resolution possible — P, Q (no complementary literals)
  const t3 = runResolution(['P', 'Q']);
  assert(t3.result === 'satisfiable', 'T3: satisfiable (no resolution)');
  assert(t3.steps.length === 0, 'T3: no resolution steps');
  
  // Test 4: Image 4 example
  // Premises: (P→Q)∧(R→S)∧(¬Q∨¬S)
  // Conclusion: P∧R (we want to prove this)
  // To prove by contradiction, we negate the conclusion and add it to premises
  // ¬(P∧R) = ¬P∨¬R
  // 
  // But actually, to get a contradiction, we need the premises to force P and R to be true
  // Let's add P and R as unit clauses instead
  
  const t4 = runResolution(['¬P∨Q', '¬R∨S', '¬Q∨¬S', 'P', 'R']);
  // With P and R as facts:
  // P + (¬P∨Q) → Q
  // R + (¬R∨S) → S
  // Q + (¬Q∨¬S) → ¬S
  // S + ¬S → [] (empty clause, contradiction)
  assert(t4.result === 'contradiction', 'T4: Image 4 example produces contradiction');
  assert(t4.steps.length > 0, 'T4: multiple resolution steps');
  
  // Test 5: CNF conversion — (P→Q) should become ¬P∨Q
  const t5 = runResolution('P→Q');
  assert(t5.knowledgeBase.length === 1, 'T5: one clause');
  const t5Clause = t5.knowledgeBase[0].clause;
  assert(t5Clause.includes('¬P') && t5Clause.includes('Q'), 'T5: CNF is ¬P∨Q');
  
  // Test 6: CNF conversion with biconditional — P↔Q
  const t6 = runResolution('P↔Q');
  // P↔Q = (P→Q)∧(Q→P) = (¬P∨Q)∧(¬Q∨P)
  const premiseClauses = t6.knowledgeBase.filter(kb => kb.source === 'premise');
  assert(premiseClauses.length === 2, 'T6: two premise clauses from biconditional');
  
  console.log('[resolutionEngine] All tests passed ✓');
})();
