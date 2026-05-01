// Comprehensive B+ tree correctness tests (no external dependencies)
import { BPlusTree } from './src/lib/BPlusTree.js'

let passed = 0
let failed = 0

function assert(condition, msg) {
  if (condition) {
    console.log(`  PASS  ${msg}`)
    passed++
  } else {
    console.error(`  FAIL  ${msg}`)
    failed++
  }
}

function getLeaves(root) {
  let node = root
  while (!node.isLeaf) node = node.children[0]
  const leaves = []
  let cur = node
  while (cur) { leaves.push(cur); cur = cur.next }
  return leaves
}

function validateFull(tree, label) {
  const { valid, errors } = tree.validate()
  assert(valid, `${label}: no invariant violations${valid ? '' : ' — ' + errors.join(', ')}`)
  return valid
}

function allLeavesSameDepth(root) {
  const depths = []
  function walk(node, d) {
    if (node.isLeaf) { depths.push(d); return }
    node.children.forEach(c => walk(c, d + 1))
  }
  walk(root, 0)
  return depths.every(d => d === depths[0])
}

function leafChainSorted(root) {
  const leaves = getLeaves(root)
  const flat = leaves.flatMap(l => l.keys)
  for (let i = 1; i < flat.length; i++) {
    const a = flat[i - 1], b = flat[i]
    const cmp = (typeof a === 'number' && typeof b === 'number') ? a - b : String(a).localeCompare(String(b))
    if (cmp >= 0) return false
  }
  return true
}

// ─── Parameters ───────────────────────────────────────────────────────────────
console.log('\n=== 1. Order parameter formulas ===')
for (const m of [2, 3, 4, 5, 6, 7]) {
  const t = new BPlusTree(m)
  const p = t.getParameters()
  assert(p.maxKeys === m - 1,        `order ${m}: maxKeys = m-1 = ${m-1}, got ${p.maxKeys}`)
  assert(p.maxChildren === m,        `order ${m}: maxChildren = m = ${m}, got ${p.maxChildren}`)
  assert(p.minKeys === Math.ceil(m/2) - 1, `order ${m}: minKeys = ⌈m/2⌉-1 = ${Math.ceil(m/2)-1}, got ${p.minKeys}`)
  assert(p.minChildren === Math.ceil(m/2), `order ${m}: minChildren = ⌈m/2⌉ = ${Math.ceil(m/2)}, got ${p.minChildren}`)
}

// ─── Invariants after sequential insert ───────────────────────────────────────
console.log('\n=== 2. Invariants hold for orders 2–7, values 1–20 ===')
for (const m of [2, 3, 4, 5, 6, 7]) {
  const t = new BPlusTree(m)
  for (let i = 1; i <= 20; i++) t.insert(i)
  validateFull(t, `order ${m}, sequential 1-20`)
  assert(allLeavesSameDepth(t.root), `order ${m}: all leaves at same depth`)
  assert(leafChainSorted(t.root),    `order ${m}: leaf linked-list is sorted`)
}

// ─── Invariants after random-order insert ─────────────────────────────────────
console.log('\n=== 3. Random-order insert, orders 3–5 ===')
const shuffled = [14, 3, 7, 19, 1, 11, 5, 17, 9, 13, 2, 16, 8, 20, 4, 18, 6, 12, 10, 15]
for (const m of [3, 4, 5]) {
  const t = new BPlusTree(m)
  shuffled.forEach(v => t.insert(v))
  validateFull(t, `order ${m}, random insert`)
  assert(allLeavesSameDepth(t.root), `order ${m}: all leaves at same depth`)
  assert(leafChainSorted(t.root),    `order ${m}: leaf linked-list is sorted`)
  // all 20 values must be findable
  const allFound = shuffled.every(v => t.search(v))
  assert(allFound, `order ${m}: every inserted key found by search`)
}

// ─── Search and delete ────────────────────────────────────────────────────────
console.log('\n=== 4. Search and delete ===')
{
  const t = new BPlusTree(4)
  ;[10, 20, 30, 40, 50].forEach(v => t.insert(v))
  assert(t.search(30), 'search: finds existing key 30')
  assert(!t.search(99), 'search: misses absent key 99')
  t.delete(30)
  assert(!t.search(30), 'delete: key 30 no longer found after delete')
  validateFull(t, 'after deleting 30')
  assert(leafChainSorted(t.root), 'leaf chain sorted after delete')
}

// ─── No node exceeds maxKeys ───────────────────────────────────────────────────
console.log('\n=== 5. No node ever exceeds maxKeys (order 4, 30 values) ===')
{
  const t = new BPlusTree(4)
  function checkMax(node) {
    if (node.keys.length > t.maxKeys) return false
    if (!node.isLeaf) return node.children.every(checkMax)
    return true
  }
  for (let i = 1; i <= 30; i++) {
    t.insert(i)
    assert(checkMax(t.root), `after inserting ${i}: no node exceeds maxKeys=${t.maxKeys}`)
  }
}

// ─── String keys ──────────────────────────────────────────────────────────────
console.log('\n=== 6. String keys (order 3) ===')
{
  const t = new BPlusTree(3)
  ;['banana', 'apple', 'cherry', 'date', 'elderberry', 'fig', 'grape'].forEach(w => t.insert(w))
  validateFull(t, 'string keys')
  assert(t.search('cherry'), 'search: finds "cherry"')
  assert(!t.search('mango'), 'search: misses "mango"')
  t.delete('cherry')
  assert(!t.search('cherry'), 'delete: "cherry" gone after delete')
  validateFull(t, 'strings after delete')
}

// ─── Mixed numeric + string keys ──────────────────────────────────────────────
console.log('\n=== 7. Mixed numeric + string keys (order 4) ===')
{
  const t = new BPlusTree(4)
  ;['banana', '67', '69', 'cabbage', 'moon'].forEach(v => t.insert(v))
  validateFull(t, 'mixed keys')
  assert(t.search('67'), 'search: finds numeric-string "67" (stored as 67)')
  assert(t.search('banana'), 'search: finds "banana"')
  assert(leafChainSorted(t.root), 'leaf chain sorted (numbers before strings)')
}

// ─── Duplicate insert is a no-op ──────────────────────────────────────────────
console.log('\n=== 8. Duplicate insert ===')
{
  const t = new BPlusTree(4)
  ;[1, 2, 3].forEach(v => t.insert(v))
  t.insert(2)
  assert(t.getStats().keyCount === 3, 'inserting duplicate does not increase key count')
  validateFull(t, 'after duplicate insert')
}

// ─── Empty tree ───────────────────────────────────────────────────────────────
console.log('\n=== 9. Empty tree ===')
{
  const t = new BPlusTree(4)
  assert(t.root.isLeaf, 'empty tree: root is a leaf')
  assert(t.root.keys.length === 0, 'empty tree: root has no keys')
  assert(!t.search(1), 'empty tree: search returns false')
  validateFull(t, 'empty tree')
}

// ─── Textbook example: order 4, insert 1-10 ───────────────────────────────────
console.log('\n=== 10. Textbook example: order 4, insert 1..10 ===')
{
  const t = new BPlusTree(4)
  ;[1,2,3,4,5,6,7,8,9,10].forEach(v => t.insert(v))
  const r = t.root
  assert(!r.isLeaf, 'root is internal')
  assert(r.keys.length === 1 && r.keys[0] === 5, `root key is [5], got [${r.keys}]`)
  assert(r.children.length === 2, 'root has 2 children')
  const left = r.children[0], right = r.children[1]
  assert(!left.isLeaf && String(left.keys) === '3', `left subtree root = [3], got [${left.keys}]`)
  assert(!right.isLeaf && String(right.keys) === '7,9', `right subtree root = [7,9], got [${right.keys}]`)
  const leaves = getLeaves(r)
  const leafStr = leaves.map(l => `[${l.keys}]`).join('->')
  assert(leafStr === '[1,2]->[3,4]->[5,6]->[7,8]->[9,10]', `leaf chain: ${leafStr}`)
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`)
console.log(`Results: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
