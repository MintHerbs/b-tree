import { BPlusTree } from './src/lib/BPlusTree.js'

console.log('=== Testing Minimum Keys Requirements ===\n')

// Test with order=4 to have clearer minimum requirements
// Order 4: maxKeys=4, minKeys(leaf)=2, minKeys(internal)=2
const tree = new BPlusTree(4)

console.log('Order 4 B+ Tree')
console.log('Max keys per node:', tree.maxKeys)
console.log('Min keys for leaf:', tree.minKeys)
console.log('Min keys for internal:', tree.minKeysInternal)
console.log()

// Insert enough keys to create a multi-level tree
const keys = []
for (let i = 1; i <= 20; i++) {
  keys.push(String(i * 5))
}

console.log('Inserting keys:', keys.join(', '))
keys.forEach(k => tree.insert(k))

const stats = tree.getStats()
console.log('\nTree structure:')
console.log('Height:', stats.height)
console.log('Total nodes:', stats.nodeCount)
console.log('Total keys:', stats.keyCount)
console.log()

// Verify tree structure by walking it
function verifyTree(node, level = 0, path = 'root') {
  const indent = '  '.repeat(level)
  const type = node.isLeaf ? 'LEAF' : 'INTERNAL'
  console.log(`${indent}${path} [${type}]: ${node.keys.length} keys [${node.keys.join(',')}]`)
  
  // Check minimum requirements (except for root)
  if (node !== tree.root) {
    const minRequired = node.isLeaf ? tree.minKeys : tree.minKeysInternal
    if (node.keys.length < minRequired) {
      console.log(`${indent}  ⚠️  WARNING: Node has ${node.keys.length} keys, minimum is ${minRequired}`)
    }
  }
  
  // Check maximum
  if (node.keys.length > tree.maxKeys) {
    console.log(`${indent}  ❌ ERROR: Node has ${node.keys.length} keys, maximum is ${tree.maxKeys}`)
  }
  
  if (!node.isLeaf) {
    node.children.forEach((child, i) => {
      verifyTree(child, level + 1, `child[${i}]`)
    })
  }
}

console.log('Tree structure verification:')
verifyTree(tree.root)
console.log()

// Now test deletions that should trigger borrowing and merging
console.log('Testing deletions...')
const toDelete = ['50', '55', '60', '65', '70']
toDelete.forEach(k => {
  tree.delete(k)
  console.log(`After deleting ${k}: nodes=${tree.getStats().nodeCount}, keys=${tree.getStats().keyCount}`)
})
console.log()

console.log('Tree structure after deletions:')
verifyTree(tree.root)
console.log()

// Verify all remaining keys are searchable
console.log('Verifying remaining keys are searchable:')
const remaining = keys.filter(k => !toDelete.includes(k))
const allFound = remaining.every(k => tree.search(k))
console.log('All remaining keys found:', allFound)
console.log()

// Verify deleted keys are not found
const allDeleted = toDelete.every(k => !tree.search(k))
console.log('All deleted keys removed:', allDeleted)
console.log()

console.log('=== Test Complete ===')
