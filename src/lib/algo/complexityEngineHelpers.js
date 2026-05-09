// Helper functions for complexityEngine.js

import { shortComplexity } from './complexityTypes.js';
import { multiplyStepStr } from './complexityAlgebra.js';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function logOf(bound) {
  if (bound === 'n' || bound === 'n2' || bound === 'sqrt_n' || bound === 'n3') {
    return 'log_n';
  }
  return 'log_n';
}

export function sqrtOf(bound) {
  if (bound === 'n') return 'sqrt_n';
  if (bound === 'n2') return 'n';
  if (bound === 'n3') return 'n_sqrt_n';
  return 'sqrt_n';
}

export function resolveExpr(expr, ctx) {
  if (typeof expr === 'string' && /^\w+$/.test(expr) && ctx[expr]) {
    return ctx[expr].bound;
  }
  return expr;
}

export function findBodyIndent(lines, headerIdx) {
  for (let i = headerIdx + 1; i < lines.length; i++) {
    if (lines[i].kind !== 'empty') {
      return lines[i].indent;
    }
  }
  return -1;
}

export function findUpdate(bodyLines, varName) {
  for (const line of bodyLines) {
    if (line.kind === 'update' && line.meta.var === varName) {
      const op = line.meta.op;
      const isMultiplicative = op === '*=' || op === '/=' || op === '//=';
      return { op, isMultiplicative };
    }
  }
  return null;
}

export function checkBuiltinCall(stripped) {
  if (stripped.includes('.sort(') || stripped.startsWith('sorted(')) {
    return 'n_log_n';
  }
  if (stripped.startsWith('heapq.')) {
    return 'log_n';
  }
  return '1';
}

export function makeAnnotation(id, lineStart, lineEnd, complexity, label, depth, kind) {
  return { id, lineStart, lineEnd, complexity, label, depth, kind };
}

export function makeStep(text, type, complexity = undefined, indent = undefined) {
  const step = { text, type };
  if (complexity !== undefined) step.complexity = complexity;
  if (indent !== undefined) step.indent = indent;
  return step;
}

export function formatLoopStep(varName, rangeOrIterable, iterC, depth) {
  return makeStep(
    `for ${varName} in ${rangeOrIterable}: → O(${shortComplexity(iterC)}) iterations`,
    'loop',
    iterC,
    depth
  );
}

export function formatCombineStep(bodyC, iterC, totalC, depth) {
  return makeStep(
    `  └─ body: O(${shortComplexity(bodyC)})  →  ${multiplyStepStr(iterC, bodyC, totalC)}`,
    'combine_nested',
    undefined,
    depth
  );
}

export function formatWhileStep(condition, loopC, depth) {
  return makeStep(
    `while ${condition}: → O(${shortComplexity(loopC)}) iterations`,
    'loop',
    loopC,
    depth
  );
}
