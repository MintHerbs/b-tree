// src/lib/logic/tableauxEngine.js
// Semantic tableaux algorithm for propositional logic. Pure JS, no React imports.

import { parseFormula } from './formulaParser.js';

/**
 * Converts an AST node back to a display string using Unicode symbols.
 * @param {object} node - AST node
 * @returns {string} - formatted formula string
 */
function astToString(node) {
  if (node.type === 'atom') return node.name;
  if (node.type === 'not') return `¬${astToString(node.child)}`;
  
  const left = astToString(node.left);
  const right = astToString(node.right);
  
  // Add parentheses for clarity
  const needsParens = (n) => n.type !== 'atom';
  const leftStr = needsParens(node.left) ? `(${left})` : left;
  const rightStr = needsParens(node.right) ? `(${right})` : right;
  
  if (node.type === 'and') return `${leftStr}∧${rightStr}`;
  if (node.type === 'or') return `${leftStr}∨${rightStr}`;
  if (node.type === 'implies') return `${leftStr}→${rightStr}`;
  if (node.type === 'iff') return `${leftStr}↔${rightStr}`;
  
  throw new Error(`Unknown node type: ${node.type}`);
}

/**
 * Checks if a formula is a literal (atom or negated atom).
 * @param {object} node - AST node
 * @returns {boolean}
 */
function isLiteral(node) {
  if (node.type === 'atom') return true;
  if (node.type === 'not' && node.child.type === 'atom') return true;
  return false;
}

/**
 * Gets the literal key for contradiction checking.
 * Returns the atom name, with a prefix for negated atoms.
 * @param {object} node - AST node (must be a literal)
 * @returns {string} - e.g., 'P' or '¬P'
 */
function getLiteralKey(node) {
  if (node.type === 'atom') return node.name;
  if (node.type === 'not' && node.child.type === 'atom') return `¬${node.child.name}`;
  throw new Error('getLiteralKey called on non-literal');
}

/**
 * Checks if two literals are contradictory (P and ¬P).
 * @param {string} key1
 * @param {string} key2
 * @returns {boolean}
 */
function areContradictory(key1, key2) {
  if (key1.startsWith('¬') && key2 === key1.slice(1)) return true;
  if (key2.startsWith('¬') && key1 === key2.slice(1)) return true;
  return false;
}

/**
 * Applies tableau expansion rules to a formula.
 * Returns { type: 'alpha' | 'beta' | 'literal', formulas: [...] }
 * For alpha: formulas is a single array of formulas to add sequentially
 * For beta: formulas is [leftBranch, rightBranch] where each branch is an array
 * For literal: formulas is empty
 */
function applyRule(node) {
  // Literals cannot be expanded
  if (isLiteral(node)) {
    return { type: 'literal', formulas: [] };
  }
  
  // ¬¬A → A (alpha)
  if (node.type === 'not' && node.child.type === 'not') {
    return { type: 'alpha', formulas: [node.child.child] };
  }
  
  // A∧B → A, B (alpha)
  if (node.type === 'and') {
    return { type: 'alpha', formulas: [node.left, node.right] };
  }
  
  // ¬(A∨B) → ¬A, ¬B (alpha)
  if (node.type === 'not' && node.child.type === 'or') {
    return {
      type: 'alpha',
      formulas: [
        { type: 'not', child: node.child.left },
        { type: 'not', child: node.child.right }
      ]
    };
  }
  
  // ¬(A→B) → A, ¬B (alpha)
  if (node.type === 'not' && node.child.type === 'implies') {
    return {
      type: 'alpha',
      formulas: [
        node.child.left,
        { type: 'not', child: node.child.right }
      ]
    };
  }
  
  // A∨B → left:[A] right:[B] (beta)
  if (node.type === 'or') {
    return {
      type: 'beta',
      formulas: [[node.left], [node.right]]
    };
  }
  
  // ¬(A∧B) → left:[¬A] right:[¬B] (beta)
  if (node.type === 'not' && node.child.type === 'and') {
    return {
      type: 'beta',
      formulas: [
        [{ type: 'not', child: node.child.left }],
        [{ type: 'not', child: node.child.right }]
      ]
    };
  }
  
  // A→B → left:[¬A] right:[B] (beta)
  if (node.type === 'implies') {
    return {
      type: 'beta',
      formulas: [
        [{ type: 'not', child: node.left }],
        [node.right]
      ]
    };
  }
  
  // A↔B → left:[A,B] right:[¬A,¬B] (beta, despite spec table label)
  if (node.type === 'iff') {
    return {
      type: 'beta',
      formulas: [
        [node.left, node.right],
        [{ type: 'not', child: node.left }, { type: 'not', child: node.right }]
      ]
    };
  }
  
  // ¬(A↔B) → left:[¬A,B] right:[A,¬B] (beta)
  if (node.type === 'not' && node.child.type === 'iff') {
    return {
      type: 'beta',
      formulas: [
        [{ type: 'not', child: node.child.left }, node.child.right],
        [node.child.left, { type: 'not', child: node.child.right }]
      ]
    };
  }
  
  throw new Error(`Unknown formula type: ${node.type}`);
}

/**
 * Runs the semantic tableaux algorithm.
 * @param {string} formulaString - propositional logic formula
 * @param {string} mode - 'satisfiability' | 'validity'
 * @returns {object} - { tree, steps, result }
 */
export function runTableaux(formulaString, mode) {
  // Parse the formula
  let rootFormula;
  try {
    rootFormula = parseFormula(formulaString);
  } catch (err) {
    throw new Error(`Parse error: ${err.message}`);
  }
  
  // For validity mode, negate the formula
  if (mode === 'validity') {
    rootFormula = { type: 'not', child: rootFormula };
  }
  
  let nodeIdCounter = 0;
  const steps = [];
  
  /**
   * Creates a new tableau node.
   */
  function createNode(formulaNode) {
    return {
      id: `n${nodeIdCounter++}`,
      formula: astToString(formulaNode),
      formulaNode,
      isClosed: false,
      isOpen: false,
      closedBy: null,
      children: []
    };
  }
  
  /**
   * Deep clones the tree for step snapshots.
   */
  function cloneTree(node) {
    return JSON.parse(JSON.stringify(node));
  }
  
  /**
   * Records a step in the animation.
   */
  function recordStep(description, tree, highlightNodeId) {
    steps.push({
      id: steps.length,
      description,
      treeSnapshot: cloneTree(tree),
      highlightNodeId
    });
  }
  
  // Create root node
  const tree = createNode(rootFormula);
  recordStep(`Start with ${tree.formula}`, tree, tree.id);
  
  /**
   * Represents a branch being processed.
   * Contains: leafNode (the current leaf), literals (map), unexpanded (queue)
   */
  class Branch {
    constructor(leafNode, literals = new Map(), unexpanded = []) {
      this.leafNode = leafNode;
      this.literals = new Map(literals);
      this.unexpanded = [...unexpanded];
    }
    
    clone() {
      return new Branch(this.leafNode, this.literals, this.unexpanded);
    }
  }
  
  // Initialize work queue with root branch
  const initialBranch = new Branch(tree, new Map(), []);
  
  // If root is a literal, add it to literals map, otherwise add to unexpanded
  if (isLiteral(rootFormula)) {
    initialBranch.literals.set(getLiteralKey(rootFormula), tree.id);
  } else {
    initialBranch.unexpanded.push({ node: tree, formulaNode: rootFormula });
  }
  
  const workQueue = [initialBranch];
  
  let iterations = 0;
  const MAX_ITERATIONS = 500;
  
  // Process branches depth-first
  while (workQueue.length > 0 && iterations < MAX_ITERATIONS) {
    iterations++;
    const branch = workQueue.pop();
    
    // Helper function to check for contradictions in current branch
    function checkContradiction() {
      for (const [key1, id1] of branch.literals) {
        for (const [key2, id2] of branch.literals) {
          if (id1 !== id2 && areContradictory(key1, key2)) {
            return [id1, id2];
          }
        }
      }
      return null;
    }
    
    // Check for contradiction
    const contradiction = checkContradiction();
    
    if (contradiction) {
      // Close this branch
      branch.leafNode.isClosed = true;
      branch.leafNode.closedBy = contradiction;
      recordStep(`Branch closed: contradiction between ${contradiction[0]} and ${contradiction[1]}`, tree, branch.leafNode.id);
      continue;
    }
    
    // If no unexpanded formulas, mark as open (no contradiction found)
    if (branch.unexpanded.length === 0) {
      branch.leafNode.isOpen = true;
      recordStep(`Branch complete: no contradiction found`, tree, branch.leafNode.id);
      continue;
    }
    
    // Sort unexpanded queue: alpha rules first, then beta rules
    branch.unexpanded.sort((a, b) => {
      const ruleA = applyRule(a.formulaNode);
      const ruleB = applyRule(b.formulaNode);
      if (ruleA.type === 'alpha' && ruleB.type !== 'alpha') return -1;
      if (ruleA.type !== 'alpha' && ruleB.type === 'alpha') return 1;
      return 0;
    });
    
    // Take the first unexpanded formula
    const { node: expandNode, formulaNode } = branch.unexpanded.shift();
    
    // If expandNode is null, it means this formula needs to be added as a child of the current leaf
    if (expandNode === null) {
      const newNode = createNode(formulaNode);
      branch.leafNode.children = [newNode];
      branch.leafNode = newNode;
      
      if (isLiteral(formulaNode)) {
        branch.literals.set(getLiteralKey(formulaNode), newNode.id);
        // Re-queue the branch to check for contradictions
        workQueue.push(branch);
      } else {
        // Add the new node to unexpanded and re-queue
        branch.unexpanded.unshift({ node: newNode, formulaNode });
        workQueue.push(branch);
      }
      
      recordStep(`Add ${astToString(formulaNode)} to branch`, tree, newNode.id);
      continue;
    }
    
    const rule = applyRule(formulaNode);
    
    if (rule.type === 'literal') {
      // Should not happen since literals are not added to unexpanded queue
      continue;
    }
    
    if (rule.type === 'alpha') {
      // Alpha rule: add formulas sequentially as a chain
      // Replace any existing children (from beta branch formula list)
      let currentParent = expandNode;
      
      for (let i = 0; i < rule.formulas.length; i++) {
        const newNode = createNode(rule.formulas[i]);
        
        // Replace children
        currentParent.children = [newNode];
        
        if (isLiteral(rule.formulas[i])) {
          branch.literals.set(getLiteralKey(rule.formulas[i]), newNode.id);
        } else {
          branch.unexpanded.push({ node: newNode, formulaNode: rule.formulas[i] });
        }
        
        recordStep(`Apply α-rule to ${astToString(formulaNode)}: add ${astToString(rule.formulas[i])}`, tree, newNode.id);
        currentParent = newNode;
      }
      
      // Update leaf node to the last node in the chain
      branch.leafNode = currentParent;
      
      // Continue processing this branch
      workQueue.push(branch);
      
    } else if (rule.type === 'beta') {
      // Beta rule: create two branches
      // Replace any existing children (from beta branch formula list)
      expandNode.children = [];
      
      recordStep(`Apply β-rule to ${astToString(formulaNode)}`, tree, expandNode.id);
      
      // Create two child branches
      for (let i = 0; i < 2; i++) {
        const branchFormulas = rule.formulas[i];
        const newBranch = branch.clone();
        
        // For beta branches, we only create the FIRST node as a child of expandNode
        // The remaining formulas are added to the unexpanded queue and will be
        // processed later, creating children of the current leaf
        const firstFormula = branchFormulas[0];
        const firstNode = createNode(firstFormula);
        expandNode.children.push(firstNode);
        
        // Add first node to literals or unexpanded
        if (isLiteral(firstFormula)) {
          newBranch.literals.set(getLiteralKey(firstFormula), firstNode.id);
        } else {
          newBranch.unexpanded.push({ node: firstNode, formulaNode: firstFormula });
        }
        
        newBranch.leafNode = firstNode;
        recordStep(`Add ${astToString(firstFormula)} to branch ${i + 1}`, tree, firstNode.id);
        
        // Add remaining formulas to unexpanded (they'll be added as children of the leaf later)
        for (let j = 1; j < branchFormulas.length; j++) {
          // Store the formula to be processed later - it will be added as a child of the current leaf
          newBranch.unexpanded.push({ node: null, formulaNode: branchFormulas[j] });
        }
        
        // Add this branch to work queue (depth-first: push to end, pop from end)
        workQueue.push(newBranch);
      }
    }
  }
  
  if (iterations >= MAX_ITERATIONS) {
    throw new Error('Tableau algorithm exceeded maximum iterations');
  }
  
  // Determine result
  const allLeaves = collectLeaves(tree);
  const allClosed = allLeaves.every(leaf => leaf.isClosed);
  const anyOpen = allLeaves.some(leaf => leaf.isOpen);
  
  let result;
  if (mode === 'validity') {
    result = allClosed ? 'valid' : 'invalid';
  } else {
    result = anyOpen ? 'satisfiable' : 'unsatisfiable';
  }
  
  return { tree, steps, result };
}

/**
 * Collects all leaf nodes in the tree.
 */
function collectLeaves(tree) {
  if (tree.children.length === 0) return [tree];
  const leaves = [];
  for (const child of tree.children) {
    leaves.push(...collectLeaves(child));
  }
  return leaves;
}

// --- TEST ---
(function runTests() {
  const assert = (cond, msg) => { if (!cond) throw new Error(`TEST FAILED: ${msg}`); };
  
  // Test 1: ¬(¬(P∧Q)↔(¬P∨¬Q)) in satisfiability mode
  // This is the negation of De Morgan's law — should be unsatisfiable (all branches close)
  const t1 = runTableaux('¬(¬(P∧Q)↔(¬P∨¬Q))', 'satisfiability');
  assert(t1.result === 'unsatisfiable', '1: result unsatisfiable');
  const leaves1 = collectLeaves(t1.tree);
  assert(leaves1.every(leaf => leaf.isClosed), '1: all leaves closed');
  assert(leaves1.length > 0, '1: has leaves');
  
  // Test 2: P→P in validity mode
  // Tautology — should be valid (all branches close when negated)
  const t2 = runTableaux('P->P', 'validity');
  assert(t2.result === 'valid', '2: result valid');
  
  // Test 3: P∨Q in satisfiability mode
  // Should be satisfiable (at least one branch stays open)
  const t3 = runTableaux('P|Q', 'satisfiability');
  assert(t3.result === 'satisfiable', '3: result satisfiable');
  const leaves3 = collectLeaves(t3.tree);
  assert(leaves3.some(leaf => leaf.isOpen), '3: at least one leaf open');
  
  // Test 4: P∧¬P in satisfiability mode
  // Contradiction — should be unsatisfiable
  const t4 = runTableaux('P&~P', 'satisfiability');
  assert(t4.result === 'unsatisfiable', '4: result unsatisfiable');
  
  // Test 5: P→Q in validity mode
  // Not a tautology — should be invalid
  const t5 = runTableaux('P->Q', 'validity');
  assert(t5.result === 'invalid', '5: result invalid');
  
  console.log('[tableauxEngine] all tests passed');
})();
