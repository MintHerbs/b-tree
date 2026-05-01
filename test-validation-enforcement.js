import { BPlusTree } from './src/lib/BPlusTree.js'

console.log('=== B+ Tree Constraint Enforcement Test ===\n')

// Test multiple orders
for (let order = 2; order <= 6; order++) {
  console.log(`Testing Order ${order}`)
  console.log('─'.repeat(50))
  
  const tree = new BPlusTree(order)
  const params = tree.getParameters()
  
  console.log(`Parameters: maxKeys=${params.maxKeys}, minKeys(leaf)=${params.minKeys}, minKeys(internal)=${params.minKeysInternal}`)
  
  // Insert many keys
  const keys = []
  for (let i = 1; i <= 20; i++) {
    keys.push(String(i * 5))
  }
  
  let allValid = true
  
  // Test insertions
  keys.forEach((key, idx) => {
    tree.insert(key)
    const validation = tree.validate()
    
    if (!validation.valid) {
      console.log(`  ✗ After inserting "${key}":`)
      validation.errors.forEach(err => console.log(`    - ${err}`))
      allValid = false
    }
  })
  
  if (allValid) {
    console.log(`  ✓ All ${keys.length} insertions maintained valid tree structure`)
  }
  
  // Test deletions
  const toDelete = keys.slice(0, 10) // Delete first 10
  toDelete.forEach(key => {
    tree.delete(key)
    const validation = tree.validate()
    
    if (!validation.valid) {
      console.log(`  ✗ After deleting "${key}":`)
      validation.errors.forEach(err => console.log(`    - ${err}`))
      allValid = false
    }
  })
  
  if (allValid) {
    console.log(`  ✓ All ${toDelete.length} deletions maintained valid tree structure`)
  }
  
  const finalStats = tree.getStats()
  console.log(`  Final: ${finalStats.nodeCount} nodes, ${finalStats.keyCount} keys, height ${finalStats.height}`)
  
  const finalValidation = tree.validate()
  if (finalValidation.valid) {
    console.log(`  ✓ Final tree structure is valid`)
  } else {
    console.log(`  ✗ Final tree has violations:`)
    finalValidation.errors.forEach(err => console.log(`    - ${err}`))
  }
  
  console.log()
}

console.log('=== Stress Test: Random Operations ===\n')

const stressTree = new BPlusTree(4)
let operationCount = 0
let violationCount = 0

for (let i = 0; i < 200; i++) {
  const key = String(Math.floor(Math.random() * 100))
  const operation = Math.random() > 0.4 ? 'insert' : 'delete'
  
  if (operation === 'insert') {
    stressTree.insert(key)
  } else {
    stressTree.delete(key)
  }
  
  operationCount++
  
  const validation = stressTree.validate()
  if (!validation.valid) {
    violationCount++
    if (violationCount <= 5) { // Only show first 5 violations
      console.log(`Violation after ${operation}("${key}"):`)
      validation.errors.forEach(err => console.log(`  - ${err}`))
    }
  }
}

console.log(`Performed ${operationCount} random operations`)
console.log(`Violations detected: ${violationCount}`)

if (violationCount === 0) {
  console.log('✓ Tree maintained valid structure through all random operations')
} else {
  console.log('✗ Tree had constraint violations during random operations')
}

console.log('\nFinal tree stats:', stressTree.getStats())
console.log('Final validation:', stressTree.validate().valid ? '✓ Valid' : '✗ Invalid')

console.log('\n=== Edge Case: Order 2 Minimum Tree ===\n')

const minTree = new BPlusTree(2)
console.log('Order 2 constraints:')
console.log('  Max keys: 2, Min keys (leaf): 1, Min keys (internal): 0')
console.log('  Max children: 3, Min children: 1')
console.log()

// Build then tear down
const minKeys = ['A', 'B', 'C', 'D', 'E']
console.log('Building tree with:', minKeys.join(', '))
minKeys.forEach(k => minTree.insert(k))

let validation = minTree.validate()
console.log('After insertions:', validation.valid ? '✓ Valid' : '✗ Invalid')

console.log('\nDeleting all keys...')
minKeys.forEach(k => {
  minTree.delete(k)
  validation = minTree.validate()
  if (!validation.valid) {
    console.log(`After deleting "${k}": ✗ Invalid`)
    validation.errors.forEach(err => console.log(`  - ${err}`))
  }
})

validation = minTree.validate()
console.log('After all deletions:', validation.valid ? '✓ Valid' : '✗ Invalid')
console.log('Final state:', minTree.getStats())

console.log('\n=== Test Complete ===')
