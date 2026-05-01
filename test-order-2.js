import { BPlusTree } from './src/lib/BPlusTree.js'

console.log('=== Order 2 B+ Tree Test ===\n')

const tree = new BPlusTree(2)
const params = tree.getParameters()

console.log('Order (m) = 2')
console.log('─────────────────────────────')
console.log('Children Limits:')
console.log('  max. children = m + 1 =', params.maxChildren)
console.log('  min. children = ⌈m/2⌉ =', params.minChildren)
console.log()
console.log('Key Limits:')
console.log('  max. keys = m =', params.maxKeys)
console.log('  min. keys (leaf) = ⌈(m-1)/2⌉ =', params.minKeys)
console.log('  min. keys (internal) = ⌈m/2⌉ - 1 =', params.minKeysInternal)
console.log()

// Test with insertions
console.log('Testing with insertions...\n')

const keys = ['A', 'B', 'C', 'D', 'E', 'F']
keys.forEach((key, i) => {
  tree.insert(key)
  console.log(`After inserting "${key}":`)
  printTree(tree.root, tree)
  console.log()
})

function printTree(node, tree, level = 0, label = 'ROOT') {
  const indent = '  '.repeat(level)
  const type = node.isLeaf ? 'LEAF' : 'INTERNAL'
  const keyCount = node.keys.length
  const childCount = node.isLeaf ? 0 : node.children.length
  
  console.log(`${indent}${label} [${type}]: keys=[${node.keys.join(',')}] (${keyCount} keys${!node.isLeaf ? `, ${childCount} children` : ''})`)
  
  // Validate constraints
  if (node !== tree.root) {
    const minKeys = node.isLeaf ? tree.minKeys : tree.minKeysInternal
    const maxKeys = tree.maxKeys
    
    if (keyCount < minKeys) {
      console.log(`${indent}  ⚠️  VIOLATION: ${keyCount} keys < min ${minKeys}`)
    }
    if (keyCount > maxKeys) {
      console.log(`${indent}  ⚠️  VIOLATION: ${keyCount} keys > max ${maxKeys}`)
    }
    
    if (!node.isLeaf) {
      if (childCount < tree.minChildren) {
        console.log(`${indent}  ⚠️  VIOLATION: ${childCount} children < min ${tree.minChildren}`)
      }
      if (childCount > tree.maxChildren) {
        console.log(`${indent}  ⚠️  VIOLATION: ${childCount} children > max ${tree.maxChildren}`)
      }
    }
  }
  
  if (!node.isLeaf) {
    node.children.forEach((child, i) => {
      printTree(child, tree, level + 1, `Child[${i}]`)
    })
  }
}

console.log('=== Verification Summary ===')
console.log('Order 2 allows:')
console.log('  - Each node can have 1-2 keys (except root)')
console.log('  - Each internal node can have 1-3 children (except root)')
console.log('  - Leaf nodes need at least 1 key')
console.log('  - Internal nodes need at least 0 keys (but at least 1 child)')
console.log()

// Verify final tree
function verifyTree(node, tree) {
  let violations = []
  
  if (node !== tree.root) {
    const minKeys = node.isLeaf ? tree.minKeys : tree.minKeysInternal
    if (node.keys.length < minKeys) {
      violations.push(`Node has ${node.keys.length} keys, min is ${minKeys}`)
    }
  }
  
  if (node.keys.length > tree.maxKeys) {
    violations.push(`Node has ${node.keys.length} keys, max is ${tree.maxKeys}`)
  }
  
  if (!node.isLeaf) {
    if (node !== tree.root && node.children.length < tree.minChildren) {
      violations.push(`Node has ${node.children.length} children, min is ${tree.minChildren}`)
    }
    if (node.children.length > tree.maxChildren) {
      violations.push(`Node has ${node.children.length} children, max is ${tree.maxChildren}`)
    }
    
    node.children.forEach(child => {
      violations.push(...verifyTree(child, tree))
    })
  }
  
  return violations
}

const violations = verifyTree(tree.root, tree)
if (violations.length === 0) {
  console.log('✓ Tree satisfies all B+ tree constraints for order 2')
} else {
  console.log('✗ Violations found:')
  violations.forEach(v => console.log('  -', v))
}

console.log('\n=== Test Complete ===')
