// src/lib/logic/formulaParser.js
// Pure JS recursive descent parser for propositional logic. No React imports.

/**
 * Tokenizes a propositional logic string.
 * Atoms: A-Z   Negation: ¬ ~   Conjunction: ∧ &   Disjunction: ∨ |
 * Implication: → ->   Biconditional: ↔ <->   Grouping: ( )
 * Whitespace is silently ignored.
 */
function tokenize(input) {
  const tokens = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === '<' && input.slice(i, i + 3) === '<->') {
      tokens.push('IFF'); i += 3;
    } else if (ch === '-' && input[i + 1] === '>') {
      tokens.push('IMPLIES'); i += 2;
    } else if (ch === '¬' || ch === '~') {
      tokens.push('NOT'); i++;
    } else if (ch === '∧' || ch === '&') {
      tokens.push('AND'); i++;
    } else if (ch === '∨' || ch === '|') {
      tokens.push('OR'); i++;
    } else if (ch === '→') {
      tokens.push('IMPLIES'); i++;
    } else if (ch === '↔') {
      tokens.push('IFF'); i++;
    } else if (ch === '(' || ch === ')') {
      tokens.push(ch); i++;
    } else if (/[A-Z]/.test(ch)) {
      tokens.push({ type: 'atom', name: ch }); i++;
    } else {
      throw new Error(`Unexpected character '${ch}' at position ${i}`);
    }
  }
  return tokens;
}

/**
 * Parses a token array into an AST.
 *
 * Grammar — precedence lowest → highest:
 *   iff      : implies (IFF implies)*          (left-assoc)
 *   implies  : or (IMPLIES implies)?           (right-assoc)
 *   or       : and (OR and)*                   (left-assoc)
 *   and      : not (AND not)*                  (left-assoc)
 *   not      : NOT not | primary
 *   primary  : ATOM | '(' iff ')'
 */
function parse(tokens) {
  let pos = 0;

  function peek() { return tokens[pos]; }
  function consume() { return tokens[pos++]; }

  function label(tok) {
    if (tok === undefined) return 'end of input';
    if (typeof tok === 'object') return `atom '${tok.name}'`;
    return `'${tok}'`;
  }

  function parseIff() {
    let left = parseImplies();
    while (peek() === 'IFF') {
      consume();
      const right = parseImplies();
      left = { type: 'iff', left, right };
    }
    return left;
  }

  function parseImplies() {
    const left = parseOr();
    if (peek() === 'IMPLIES') {
      consume();
      const right = parseImplies(); // right-recursive → right-associative
      return { type: 'implies', left, right };
    }
    return left;
  }

  function parseOr() {
    let left = parseAnd();
    while (peek() === 'OR') {
      consume();
      const right = parseAnd();
      left = { type: 'or', left, right };
    }
    return left;
  }

  function parseAnd() {
    let left = parseNot();
    while (peek() === 'AND') {
      consume();
      const right = parseNot();
      left = { type: 'and', left, right };
    }
    return left;
  }

  function parseNot() {
    if (peek() === 'NOT') {
      consume();
      const child = parseNot();
      return { type: 'not', child };
    }
    return parsePrimary();
  }

  function parsePrimary() {
    const tok = peek();
    if (tok === '(') {
      consume();
      const node = parseIff();
      if (peek() !== ')') {
        throw new Error(`Expected ')' but found ${label(peek())}`);
      }
      consume();
      return node;
    }
    if (tok && typeof tok === 'object' && tok.type === 'atom') {
      consume();
      return { type: 'atom', name: tok.name };
    }
    if (tok === undefined) {
      throw new Error("Unexpected end of input: expected atom or '('");
    }
    throw new Error(`Unexpected token ${label(tok)}: expected atom or '('`);
  }

  const root = parseIff();
  if (pos < tokens.length) {
    throw new Error(`Unexpected token ${label(tokens[pos])} after complete formula`);
  }
  return root;
}

/**
 * Parses a propositional logic formula string into an AST.
 *
 * Node shapes:
 *   { type: 'atom', name: 'P' }
 *   { type: 'not',  child: node }
 *   { type: 'and' | 'or' | 'implies' | 'iff', left: node, right: node }
 *
 * @param {string} formula
 * @returns {object} AST root node
 * @throws {Error} on malformed input
 */
export function parseFormula(formula) {
  if (typeof formula !== 'string' || formula.trim() === '') {
    throw new Error('Formula must be a non-empty string');
  }
  return parse(tokenize(formula));
}

// --- TEST ---
(function runTests() {
  const assert = (cond, msg) => { if (!cond) throw new Error(`TEST FAILED: ${msg}`); };

  // 1. De Morgan — ¬(P∧Q)↔(¬P∨¬Q)
  const t1 = parseFormula('¬(P∧Q)↔(¬P∨¬Q)');
  assert(t1.type === 'iff',            '1: root iff');
  assert(t1.left.type === 'not',       '1: left not');
  assert(t1.left.child.type === 'and', '1: left child and');
  assert(t1.right.type === 'or',       '1: right or');
  assert(t1.right.left.type === 'not', '1: right.left not');
  assert(t1.right.right.type === 'not','1: right.right not');

  // 2. Negated De Morgan — ¬(¬(P∧Q)↔(¬P∨¬Q))
  const t2 = parseFormula('¬(¬(P∧Q)↔(¬P∨¬Q))');
  assert(t2.type === 'not',       '2: root not');
  assert(t2.child.type === 'iff', '2: child iff');

  // 3. Simple implication — P→Q
  const t3 = parseFormula('P→Q');
  assert(t3.type === 'implies',  '3: implies');
  assert(t3.left.name === 'P',   '3: left P');
  assert(t3.right.name === 'Q',  '3: right Q');

  // 4. Double negation — ¬¬P
  const t4 = parseFormula('¬¬P');
  assert(t4.type === 'not',            '4: outer not');
  assert(t4.child.type === 'not',      '4: inner not');
  assert(t4.child.child.name === 'P',  '4: atom P');

  // 5. (P∨Q)→R
  const t5 = parseFormula('(P∨Q)→R');
  assert(t5.type === 'implies',   '5: implies');
  assert(t5.left.type === 'or',   '5: left or');
  assert(t5.left.left.name === 'P',  '5: P');
  assert(t5.left.right.name === 'Q', '5: Q');
  assert(t5.right.name === 'R',   '5: right R');

  // 6. ASCII equivalents — ~(P&Q)<->(~P|~Q)
  const t6 = parseFormula('~(P&Q)<->(~P|~Q)');
  assert(t6.type === 'iff',            '6: iff');
  assert(t6.left.type === 'not',       '6: left not');
  assert(t6.left.child.type === 'and', '6: left child and');
  assert(t6.right.type === 'or',       '6: right or');

  // 7. Right-associativity of → — P→Q→R = P→(Q→R)
  const t7 = parseFormula('P->Q->R');
  assert(t7.type === 'implies',         '7: outer implies');
  assert(t7.left.name === 'P',          '7: left P');
  assert(t7.right.type === 'implies',   '7: right implies (right-assoc)');
  assert(t7.right.left.name === 'Q',    '7: Q');
  assert(t7.right.right.name === 'R',   '7: R');

  // 8. Malformed — dangling ∧ should throw
  let threw = false;
  try { parseFormula('P∧'); } catch (_) { threw = true; }
  assert(threw, '8: P∧ throws');

  console.log('[formulaParser] all tests passed');
})();
