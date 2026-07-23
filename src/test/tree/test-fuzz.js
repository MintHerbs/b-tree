// Randomized fuzz test for B+ tree insert/delete correctness across orders 3-7.
// No external dependencies — run with `node src/test/tree/test-fuzz.js`.
//
// Beyond tree.validate(), this asserts the STRICT separator invariant:
//   for every internal node, keys[i] === min(subtree(children[i+1]))
// The loose partition check (all-left < sep <= all-right) is NOT enough — a
// stale separator S < S' (true right-min) still passes it, so only this strict
// check actually verifies that delete's separator-refresh (and borrow/merge)
// keep separators exact.
import { BPlusTree } from '../../lib/BPlusTree.js'

// Deterministic PRNG so failures are reproducible.
let seed = 123456789
function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
function ri(n) { return Math.floor(rnd() * n) }

function cmp(a, b) {
  const an = typeof a === 'number', bn = typeof b === 'number'
  if (an && bn) return a - b
  if (an) return -1
  if (bn) return 1
  return a < b ? -1 : a > b ? 1 : 0
}

function getLeaves(root) {
  let node = root
  while (!node.isLeaf) node = node.children[0]
  const leaves = []
  let cur = node
  const seen = new Set()
  while (cur) {
    if (seen.has(cur.id)) throw new Error('CYCLE in leaf chain')
    seen.add(cur.id)
    leaves.push(cur)
    cur = cur.next
  }
  return leaves
}

function subtreeKeys(n) {
  if (n.isLeaf) return [...n.keys]
  return n.children.flatMap(subtreeKeys)
}

function deepCheck(tree, label, expectedKeys) {
  const problems = []
  const root = tree.root

  // 1. library's own validate (key counts, child counts, same-depth via structure)
  const v = tree.validate()
  if (!v.valid) problems.push('validate(): ' + v.errors.join('; '))

  // 2. all leaves at the same depth
  const depths = []
  ;(function walk(n, d) { if (n.isLeaf) { depths.push(d); return } n.children.forEach(c => walk(c, d + 1)) })(root, 0)
  if (!depths.every(d => d === depths[0])) problems.push('leaves not all same depth: ' + depths.join(','))

  // 3. keys within each node sorted; parent links intact
  ;(function walk(n) {
    for (let i = 1; i < n.keys.length; i++) if (cmp(n.keys[i - 1], n.keys[i]) >= 0) problems.push(`node ${n.id} keys not sorted: ${n.keys}`)
    if (!n.isLeaf) n.children.forEach(c => {
      if (c.parent !== n) problems.push(`node ${c.id}.parent not set to ${n.id}`)
      walk(c)
    })
  })(root)

  // 4. STRICT separator invariant: keys[i] === min(subtree(children[i+1]))
  ;(function walk(n) {
    if (n.isLeaf) return
    for (let i = 0; i < n.keys.length; i++) {
      const expected = Math.min // placeholder to avoid lint; real value below
      const rightMin = subtreeKeys(n.children[i + 1]).reduce((m, k) => (m === null || cmp(k, m) < 0 ? k : m), null)
      if (cmp(n.keys[i], rightMin) !== 0) {
        problems.push(`node ${n.id} sep[${i}]=${n.keys[i]} != right-subtree-min ${rightMin} (STALE SEPARATOR)`)
      }
      // and the loose partition, for good measure
      const leftMax = subtreeKeys(n.children[i]).reduce((m, k) => (m === null || cmp(k, m) > 0 ? k : m), null)
      if (leftMax !== null && cmp(leftMax, n.keys[i]) >= 0) problems.push(`node ${n.id} sep[${i}]: left child has key >= sep`)
      void expected
    }
    n.children.forEach(walk)
  })(root)

  // 5. leaf chain sorted, no dupes, equals expected key set
  const leaves = getLeaves(root)
  const flat = leaves.flatMap(l => l.keys)
  for (let i = 1; i < flat.length; i++) if (cmp(flat[i - 1], flat[i]) >= 0) problems.push(`leaf chain not sorted at ${flat[i - 1]},${flat[i]}`)
  if (flat.length !== new Set(flat).size) problems.push('leaf chain has duplicates')
  const exp = [...expectedKeys].sort(cmp)
  if (flat.length !== exp.length) problems.push(`leaf chain count ${flat.length} != expected ${exp.length}`)
  else for (let i = 0; i < exp.length; i++) if (cmp(flat[i], exp[i]) !== 0) { problems.push(`leaf chain mismatch at ${i}: ${flat[i]} vs ${exp[i]}`); break }

  // 6. leaf chain equals in-order traversal via children
  const inorder = subtreeKeys(root)
  for (let i = 0; i < inorder.length; i++) if (cmp(inorder[i], flat[i]) !== 0) { problems.push('inorder != leafchain'); break }

  // 7. every expected key found by search
  for (const k of expectedKeys) if (!tree.search(k)) problems.push(`search miss for present key ${k}`)

  if (problems.length) {
    console.error(`  FAIL [${label}]`)
    problems.slice(0, 8).forEach(p => console.error('     - ' + p))
    return false
  }
  return true
}

let fails = 0, runs = 0

console.log('=== Fuzz: insert-only, orders 3-7 ===')
for (const order of [3, 4, 5, 6, 7]) {
  for (let trial = 0; trial < 300; trial++) {
    const t = new BPlusTree(order)
    const present = new Set()
    const n = 5 + ri(80)
    for (let i = 0; i < n; i++) {
      const key = ri(200)
      t.insert(key)
      present.add(t._normalize(key))
    }
    runs++
    if (!deepCheck(t, `insert order=${order} trial=${trial}`, present)) { fails++; if (fails > 5) process.exit(1) }
  }
}

console.log('=== Fuzz: insert/delete mix, orders 3-7 ===')
for (const order of [3, 4, 5, 6, 7]) {
  for (let trial = 0; trial < 400; trial++) {
    const t = new BPlusTree(order)
    const present = new Set()
    const ops = 10 + ri(120)
    for (let i = 0; i < ops; i++) {
      const key = ri(60)
      const nk = t._normalize(key)
      if (rnd() < 0.6) { t.insert(key); present.add(nk) }
      else { t.delete(key); present.delete(nk) }
      // check the strict invariants after EVERY op, not just at the end
      if (!deepCheck(t, `ins/del order=${order} trial=${trial} op=${i}`, present)) {
        fails++
        if (fails > 5) process.exit(1)
        break
      }
    }
    runs++
  }
}

console.log(`\n${'-'.repeat(50)}`)
console.log(`Fuzz results: ${runs} trials, ${fails} failures`)
if (fails > 0) process.exit(1)
console.log('All fuzz trials passed.')
