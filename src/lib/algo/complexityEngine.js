// Main complexity analysis engine

import { displayComplexity, shortComplexity } from './complexityTypes.js';
import { multiplyComplexities, sumComplexities, worstCase } from './complexityAlgebra.js';
import { parseLines, analyzeExpression, analyzeRangeArgs, parseWhileCondition } from './complexityParser.js';
import {
  logOf, sqrtOf, resolveExpr, findBodyIndent, findUpdate, checkBuiltinCall,
  makeAnnotation, makeStep, formatLoopStep, formatCombineStep, formatWhileStep
} from './complexityEngineHelpers.js';

let annotationCounter = 0;

export function analyzeComplexity(code) {
  try {
    annotationCounter = 0;
    const steps = [];
    const annotations = [];
    
    const allLines = parseLines(code);
    const lines = allLines.filter(l => l.kind !== 'empty');
    
    if (lines.length === 0) {
      return { finalComplexity: '1', annotations: [], steps: [] };
    }
    
    const minIndent = Math.min(...lines.map(l => l.indent));
    
    const { complexity } = analyzeBlock(lines, 0, minIndent, {}, steps, annotations, 0);
    
    steps.push(makeStep('─────────────────────────────────', 'divider'));
    steps.push(makeStep('FINAL COMPLEXITY: ' + displayComplexity(complexity), 'final', complexity));
    
    return { finalComplexity: complexity, annotations, steps };
  } catch (err) {
    return { error: err.message };
  }
}

function analyzeBlock(lines, startIdx, minIndent, ctx, steps, annotations, depth) {
  const seqComplexities = [];
  let i = startIdx;
  
  while (i < lines.length && lines[i].indent >= minIndent) {
    const line = lines[i];
    
    if (line.indent > minIndent) {
      i++;
      continue;
    }
    
    if (line.kind === 'for_range') {
      const result = handleForRange(lines, i, line.meta, ctx, steps, annotations, depth);
      seqComplexities.push(result.complexity);
      i = result.nextIdx;
    } else if (line.kind === 'for_iter') {
      const result = handleForIter(lines, i, line.meta, ctx, steps, annotations, depth);
      seqComplexities.push(result.complexity);
      i = result.nextIdx;
    } else if (line.kind === 'while') {
      const result = handleWhile(lines, i, line.meta, ctx, steps, annotations, depth);
      seqComplexities.push(result.complexity);
      i = result.nextIdx;
    } else if (line.kind === 'if') {
      const result = handleIfElse(lines, i, ctx, steps, annotations, depth);
      seqComplexities.push(result.complexity);
      i = result.nextIdx;
    } else if (line.kind === 'def') {
      const bodyIndent = findBodyIndent(lines, i);
      if (bodyIndent !== -1) {
        steps.push(makeStep(`def ${line.meta.name}(${line.meta.params}):`, 'info', undefined, depth));
        const result = analyzeBlock(lines, i + 1, bodyIndent, ctx, steps, annotations, depth + 1);
        seqComplexities.push(result.complexity);
        i = result.nextIdx;
      } else {
        i++;
      }
    } else {
      const builtinC = checkBuiltinCall(line.stripped);
      if (builtinC !== '1') {
        seqComplexities.push(builtinC);
      }
      i++;
    }
  }
  
  const complexity = seqComplexities.reduce(sumComplexities, '1');
  return { complexity, nextIdx: i };
}

function handleForRange(lines, idx, meta, ctx, steps, annotations, depth) {
  const iterC = resolveExpr(analyzeRangeArgs(meta.rangeArgs), ctx);
  
  steps.push(formatLoopStep(meta.var, `range(${meta.rangeArgs})`, iterC, depth));
  
  const bodyIndent = findBodyIndent(lines, idx);
  if (bodyIndent === -1) {
    annotations.push(makeAnnotation(`a${annotationCounter++}`, lines[idx].lineNum, lines[idx].lineNum, iterC, `for ${meta.var} in range(${meta.rangeArgs})`, depth, 'for'));
    return { complexity: iterC, nextIdx: idx + 1 };
  }
  
  const newCtx = { ...ctx, [meta.var]: { kind: 'additive', bound: iterC } };
  const bodyResult = analyzeBlock(lines, idx + 1, bodyIndent, newCtx, steps, annotations, depth + 1);
  
  const totalC = multiplyComplexities(iterC, bodyResult.complexity);
  steps.push(formatCombineStep(bodyResult.complexity, iterC, totalC, depth));
  
  const lineEnd = bodyResult.nextIdx > 0 ? lines[bodyResult.nextIdx - 1].lineNum : lines[idx].lineNum;
  annotations.push(makeAnnotation(`a${annotationCounter++}`, lines[idx].lineNum, lineEnd, totalC, `for ${meta.var} in range(${meta.rangeArgs})`, depth, 'for'));
  
  return { complexity: totalC, nextIdx: bodyResult.nextIdx };
}

function handleForIter(lines, idx, meta, ctx, steps, annotations, depth) {
  let iterC = resolveExpr(analyzeExpression(meta.iterable), ctx);
  if (iterC === '1') iterC = 'n';
  
  steps.push(formatLoopStep(meta.var, meta.iterable, iterC, depth));
  
  const bodyIndent = findBodyIndent(lines, idx);
  if (bodyIndent === -1) {
    annotations.push(makeAnnotation(`a${annotationCounter++}`, lines[idx].lineNum, lines[idx].lineNum, iterC, `for ${meta.var} in ${meta.iterable}`, depth, 'for'));
    return { complexity: iterC, nextIdx: idx + 1 };
  }
  
  const newCtx = { ...ctx, [meta.var]: { kind: 'additive', bound: iterC } };
  const bodyResult = analyzeBlock(lines, idx + 1, bodyIndent, newCtx, steps, annotations, depth + 1);
  
  const totalC = multiplyComplexities(iterC, bodyResult.complexity);
  steps.push(formatCombineStep(bodyResult.complexity, iterC, totalC, depth));
  
  const lineEnd = bodyResult.nextIdx > 0 ? lines[bodyResult.nextIdx - 1].lineNum : lines[idx].lineNum;
  annotations.push(makeAnnotation(`a${annotationCounter++}`, lines[idx].lineNum, lineEnd, totalC, `for ${meta.var} in ${meta.iterable}`, depth, 'for'));
  
  return { complexity: totalC, nextIdx: bodyResult.nextIdx };
}

function handleWhile(lines, idx, meta, ctx, steps, annotations, depth) {
  const parsed = parseWhileCondition(meta.condition);
  
  if (!parsed) {
    steps.push(makeStep(`while ${meta.condition}: → O(n) iterations (assumed)`, 'loop', 'n', depth));
    const bodyIndent = findBodyIndent(lines, idx);
    if (bodyIndent === -1) {
      return { complexity: 'n', nextIdx: idx + 1 };
    }
    const bodyResult = analyzeBlock(lines, idx + 1, bodyIndent, ctx, steps, annotations, depth + 1);
    const totalC = multiplyComplexities('n', bodyResult.complexity);
    return { complexity: totalC, nextIdx: bodyResult.nextIdx };
  }
  
  const loopVar = parsed.var;
  const rawBound = parsed.bound;
  const boundKind = parsed.boundKind;
  
  const bound = resolveExpr(analyzeExpression(rawBound), ctx);
  const effectiveBound = boundKind === 'sqrt_product' ? sqrtOf(bound) : bound;
  
  const bodyIndent = findBodyIndent(lines, idx);
  if (bodyIndent === -1) {
    return { complexity: effectiveBound, nextIdx: idx + 1 };
  }
  
  // Collect body lines for geometric series detection
  const bodyLines = [];
  for (let j = idx + 1; j < lines.length; j++) {
    if (lines[j].indent < bodyIndent) break;
    if (lines[j].indent === bodyIndent) {
      bodyLines.push(lines[j]);
    }
  }
  
  const update = findUpdate(bodyLines, loopVar);
  
  // Geometric series detection
  if (update && update.isMultiplicative) {
    const hasInnerForWithVar = bodyLines.some(
      line => line.kind === 'for_range' && line.meta.rangeArgs.includes(loopVar)
    );
    
    if (hasInnerForWithVar) {
      steps.push(makeStep(`while ${meta.condition}: multiplicative → O(log n) iterations`, 'loop', 'log_n', depth));
      steps.push(makeStep(`⚠ Geometric series: inner for range(${loopVar}) with ${loopVar} doubling`, 'special', undefined, depth));
      steps.push(makeStep(`Σ(k=1,2,4,...,n) = 2n−1 → combined while+for = O(${shortComplexity(bound)})`, 'special', undefined, depth));
      
      const bodyResult = analyzeBlock(lines, idx + 1, bodyIndent, ctx, steps, annotations, depth + 1);
      
      const lineEnd = bodyResult.nextIdx > 0 ? lines[bodyResult.nextIdx - 1].lineNum : lines[idx].lineNum;
      annotations.push(makeAnnotation(`a${annotationCounter++}`, lines[idx].lineNum, lineEnd, bound, `while ${meta.condition} [geometric series]`, depth, 'while'));
      
      return { complexity: bound, nextIdx: bodyResult.nextIdx };
    }
  }
  
  // Normal path
  const loopC = update && update.isMultiplicative ? logOf(effectiveBound) : effectiveBound;
  steps.push(formatWhileStep(meta.condition, loopC, depth));
  
  const bodyResult = analyzeBlock(lines, idx + 1, bodyIndent, ctx, steps, annotations, depth + 1);
  const totalC = multiplyComplexities(loopC, bodyResult.complexity);
  steps.push(formatCombineStep(bodyResult.complexity, loopC, totalC, depth));
  
  const lineEnd = bodyResult.nextIdx > 0 ? lines[bodyResult.nextIdx - 1].lineNum : lines[idx].lineNum;
  annotations.push(makeAnnotation(`a${annotationCounter++}`, lines[idx].lineNum, lineEnd, totalC, `while ${meta.condition}`, depth, 'while'));
  
  return { complexity: totalC, nextIdx: bodyResult.nextIdx };
}

function handleIfElse(lines, idx, ctx, steps, annotations, depth) {
  const branchComplexities = [];
  const startLine = lines[idx].lineNum;
  const baseIndent = lines[idx].indent;
  let i = idx;
  
  while (i < lines.length && lines[i].indent === baseIndent && ['if', 'elif', 'else'].includes(lines[i].kind)) {
    const line = lines[i];
    const label = line.kind === 'else' ? 'else' : `${line.kind} ${line.meta.condition}`;
    
    steps.push(makeStep(`${label}:`, 'info', undefined, depth));
    
    const bodyIndent = findBodyIndent(lines, i);
    if (bodyIndent === -1) {
      branchComplexities.push('1');
      i++;
      continue;
    }
    
    const bodyResult = analyzeBlock(lines, i + 1, bodyIndent, ctx, steps, annotations, depth + 1);
    branchComplexities.push(bodyResult.complexity);
    i = bodyResult.nextIdx;
  }
  
  const worst = worstCase(branchComplexities);
  steps.push(makeStep(`if/else: worst-case branch → O(${shortComplexity(worst)})`, 'worst_case', worst, depth));
  
  const endLine = i > 0 ? lines[i - 1].lineNum : lines[idx].lineNum;
  annotations.push(makeAnnotation(`a${annotationCounter++}`, startLine, endLine, worst, 'if/else branches', depth, 'if'));
  
  return { complexity: worst, nextIdx: i };
}
