import { BPlusTree } from './src/lib/BPlusTree.js'

console.log('=== Python Equivalent Test ===\n')
console.log('Replicating the exact Python test case:\n')

// Python test: order=3, insert ['5','15','25','35','45']
const tree = new BPlusTree(3)
const keys = ['5', '15', '25', '35', '45']

console.log('Order:', tree.order)
console.log('Max keys:', tree.maxKeys)
console.log('Min keys (leaf):', tree.minKeys)
console.log('Min keys (internal):', tree.minKeysInternal)
console.log()

console.log('Inserting keys:', keys.join(', '))
keys.forEach(k => {
  tree.insert(k)
  console.log(`  Inserted ${k}`)
})
console.log()

// Print tree structure
function printTree(node, level = 0) {
  const indent = '  '.repeat(level)
  const type = node.isLeaf ? 'LEAF' : 'INTERNAL'
  console.log(`${indent}[${node.keys.join(',')}] (${type})`)
  
  if (!node.isLeaf) {
    node.children.forEach(child => printTree(child, level + 1))
  }
}

console.log('Tree structure:')
printTree(tree.root)
console.log()

// Test search (Python tests find('5', '34'))
console.log('Search tests:')
console.log('  search("5"):', tree.search('5'))
console.log('  search("25"):', tree.search('25'))
console.log('  search("45"):', tree.search('45'))
console.log('  search("100"):', tree.search('100'))
console.log()

// Verify leaf linked list
console.log('Leaf linked list (left to right):')
let leaf = tree.root
while (!leaf.isLeaf) {
  leaf = leaf.children[0]
}
let leafNum = 1
while (leaf) {
  console.log(`  Leaf ${leafNum}: [${leaf.keys.join(',')}]`)
  leaf = leaf.next
  leafNum++
}
console.log()

// Test stats
const stats = tree.getStats()
console.log('Tree statistics:')
console.log('  Height:', stats.height)
console.log('  Node count:', stats.nodeCount)
console.log('  Key count:', stats.keyCount)
console.log()

// Expected structure for order=3 with keys [5,15,25,35,45]:
// Root (internal): [25]
//   Left leaf: [5, 15]
//   Right leaf: [25, 35, 45]
console.log('Expected structure:')
console.log('  Root: [25] (INTERNAL)')
console.log('    Leaf 1: [5,15]')
console.log('    Leaf 2: [25,35,45]')
console.log()

// Verify structure matches
const isCorrect = 
  !tree.root.isLeaf &&
  tree.root.keys.length === 1 &&
  tree.root.keys[0] === '25' &&
  tree.root.children.length === 2 &&
  tree.root.children[0].isLeaf &&
  tree.root.children[1].isLeaf &&
  tree.root.children[0].keys.length === 2 &&
  tree.root.children[1].keys.length === 3

console.log('Structure matches expected:', isCorrect ? '✓ YES' : '✗ NO')

console.log('\n=== Test Complete ===')
