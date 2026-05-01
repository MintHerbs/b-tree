import { BPlusTree } from './src/lib/BPlusTree.js'

console.log('=== B+ Tree Formula Verification ===\n')

// Test formulas for orders 2 through 10
console.log('Order | MaxKeys | MaxChildren | MinKeys(Leaf) | MinKeys(Internal) | MinChildren')
console.log('------|---------|-------------|---------------|-------------------|------------')

for (let order = 2; order <= 10; order++) {
  const tree = new BPlusTree(order)
  const params = tree.getParameters()
  
  // Verify formulas
  const expectedMaxKeys = order
  const expectedMaxChildren = order + 1
  const expectedMinKeysLeaf = Math.ceil((order - 1) / 2)
  const expectedMinKeysInternal = Math.ceil(order / 2) - 1
  const expectedMinChildren = Math.ceil(order / 2)
  
  const correct = 
    params.maxKeys === expectedMaxKeys &&
    params.maxChildren === expectedMaxChildren &&
    params.minKeys === expectedMinKeysLeaf &&
    params.minKeysInternal === expectedMinKeysInternal &&
    params.minChildren === expectedMinChildren
  
  const status = correct ? '✓' : '✗'
  
  console.log(
    `  ${order}   |    ${params.maxKeys}    |      ${params.maxChildren}      |       ${params.minKeys}       |         ${params.minKeysInternal}         |      ${params.minChildren}      ${status}`
  )
}

console.log('\n=== Detailed Verification for Specific Orders ===\n')

// Order 2 (minimum valid order)
console.log('Order 2:')
const tree2 = new BPlusTree(2)
console.log('  Max keys:', tree2.maxKeys, '(expected: 2)')
console.log('  Max children:', tree2.maxChildren, '(expected: 3)')
console.log('  Min keys (leaf):', tree2.minKeys, '(expected: ⌈(2-1)/2⌉ = ⌈0.5⌉ = 1)')
console.log('  Min keys (internal):', tree2.minKeysInternal, '(expected: ⌈2/2⌉-1 = 1-1 = 0)')
console.log('  Min children:', tree2.minChildren, '(expected: ⌈2/2⌉ = 1)')
console.log()

// Order 3 (common educational example)
console.log('Order 3:')
const tree3 = new BPlusTree(3)
console.log('  Max keys:', tree3.maxKeys, '(expected: 3)')
console.log('  Max children:', tree3.maxChildren, '(expected: 4)')
console.log('  Min keys (leaf):', tree3.minKeys, '(expected: ⌈(3-1)/2⌉ = ⌈1⌉ = 1)')
console.log('  Min keys (internal):', tree3.minKeysInternal, '(expected: ⌈3/2⌉-1 = 2-1 = 1)')
console.log('  Min children:', tree3.minChildren, '(expected: ⌈3/2⌉ = 2)')
console.log()

// Order 4
console.log('Order 4:')
const tree4 = new BPlusTree(4)
console.log('  Max keys:', tree4.maxKeys, '(expected: 4)')
console.log('  Max children:', tree4.maxChildren, '(expected: 5)')
console.log('  Min keys (leaf):', tree4.minKeys, '(expected: ⌈(4-1)/2⌉ = ⌈1.5⌉ = 2)')
console.log('  Min keys (internal):', tree4.minKeysInternal, '(expected: ⌈4/2⌉-1 = 2-1 = 1)')
console.log('  Min children:', tree4.minChildren, '(expected: ⌈4/2⌉ = 2)')
console.log()

// Order 5
console.log('Order 5:')
const tree5 = new BPlusTree(5)
console.log('  Max keys:', tree5.maxKeys, '(expected: 5)')
console.log('  Max children:', tree5.maxChildren, '(expected: 6)')
console.log('  Min keys (leaf):', tree5.minKeys, '(expected: ⌈(5-1)/2⌉ = ⌈2⌉ = 2)')
console.log('  Min keys (internal):', tree5.minKeysInternal, '(expected: ⌈5/2⌉-1 = 3-1 = 2)')
console.log('  Min children:', tree5.minChildren, '(expected: ⌈5/2⌉ = 3)')
console.log()

console.log('=== Runtime Enforcement Test ===\n')

// Test that rules are enforced during operations
console.log('Testing Order 3 with multiple operations...')
const testTree = new BPlusTree(3)

// Insert enough to cause splits
const keys = ['10', '20', '30', '40', '50', '60', '70', '80', '90', '100']
keys.forEach(k => testTree.insert(k))

console.log('After inserting 10 keys:', testTree.getStats())

// Verify all nodes meet requirements
function verifyNode(node, tree, path = 'root') {
  const errors = []
  
  // Check max keys
  if (node.keys.length > tree.maxKeys) {
    errors.push(`${path}: Has ${node.keys.length} keys, max is ${tree.maxKeys}`)
  }
  
  // Check min keys (except root)
  if (node !== tree.root) {
    const minRequired = node.isLeaf ? tree.minKeys : tree.minKeysInternal
    if (node.keys.length < minRequired) {
      errors.push(`${path}: Has ${node.keys.length} keys, min is ${minRequired}`)
    }
  }
  
  // Check children count for internal nodes
  if (!node.isLeaf) {
    if (node.children.length > tree.maxChildren) {
      errors.push(`${path}: Has ${node.children.length} children, max is ${tree.maxChildren}`)
    }
    
    if (node !== tree.root && node.children.length < tree.minChildren) {
      errors.push(`${path}: Has ${node.children.length} children, min is ${tree.minChildren}`)
    }
    
    // Verify children count = keys count + 1
    if (node.children.length !== node.keys.length + 1) {
      errors.push(`${path}: Children count (${node.children.length}) != keys count + 1 (${node.keys.length + 1})`)
    }
    
    // Recursively check children
    node.children.forEach((child, i) => {
      errors.push(...verifyNode(child, tree, `${path}.child[${i}]`))
    })
  }
  
  return errors
}

const errors = verifyNode(testTree.root, testTree)
if (errors.length === 0) {
  console.log('✓ All nodes satisfy B+ tree constraints')
} else {
  console.log('✗ Constraint violations found:')
  errors.forEach(err => console.log('  -', err))
}

// Test deletions
console.log('\nDeleting keys: 30, 40, 50')
testTree.delete('30')
testTree.delete('40')
testTree.delete('50')

console.log('After deletions:', testTree.getStats())

const errorsAfterDelete = verifyNode(testTree.root, testTree)
if (errorsAfterDelete.length === 0) {
  console.log('✓ All nodes still satisfy B+ tree constraints after deletions')
} else {
  console.log('✗ Constraint violations after deletions:')
  errorsAfterDelete.forEach(err => console.log('  -', err))
}

console.log('\n=== Test Complete ===')
