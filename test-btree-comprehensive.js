import { BPlusTree } from './src/lib/BPlusTree.js'

console.log('=== Comprehensive B+ Tree Test ===\n')

// Test 1: Basic insertion (matching Python test)
console.log('Test 1: Basic Insertion (order=3)')
const tree1 = new BPlusTree(3)
const keys1 = ['5', '15', '25', '35', '45']
keys1.forEach(k => tree1.insert(k))

console.log('Keys inserted:', keys1.join(', '))
console.log('Tree stats:', tree1.getStats())
console.log('Search for "25":', tree1.search('25'))
console.log('Search for "100":', tree1.search('100'))
console.log()

// Test 2: Deletion
console.log('Test 2: Deletion')
const tree2 = new BPlusTree(3)
const keys2 = ['5', '15', '25', '35', '45', '55', '65']
keys2.forEach(k => tree2.insert(k))
console.log('Before deletion:', tree2.getStats())

tree2.delete('25')
console.log('After deleting "25":', tree2.getStats())
console.log('Search for "25":', tree2.search('25'))
console.log('Search for "35":', tree2.search('35'))
console.log()

// Test 3: Minimum keys validation
console.log('Test 3: Minimum Keys Calculation')
for (let order = 3; order <= 7; order++) {
  const tree = new BPlusTree(order)
  console.log(`Order ${order}: maxKeys=${tree.maxKeys}, minKeys(leaf)=${tree.minKeys}, minKeys(internal)=${tree.minKeysInternal}`)
}
console.log()

// Test 4: Split behavior
console.log('Test 4: Split Behavior (order=3)')
const tree4 = new BPlusTree(3)
console.log('Inserting keys one by one...')
for (let i = 1; i <= 10; i++) {
  const key = String(i * 10)
  tree4.insert(key)
  console.log(`After inserting ${key}: height=${tree4.getStats().height}, nodes=${tree4.getStats().nodeCount}`)
}
console.log()

// Test 5: Duplicate handling
console.log('Test 5: Duplicate Handling')
const tree5 = new BPlusTree(3)
tree5.insert('10')
tree5.insert('20')
tree5.insert('10') // duplicate
console.log('Keys inserted: 10, 20, 10 (duplicate)')
console.log('Key count:', tree5.getStats().keyCount, '(should be 2)')
console.log()

// Test 6: Numeric vs string comparison
console.log('Test 6: Numeric Comparison')
const tree6 = new BPlusTree(3)
const nums = ['100', '20', '3', '1000', '50']
nums.forEach(k => tree6.insert(k))
console.log('Inserted:', nums.join(', '))

// Walk the leaf nodes to show sorted order
let leaf = tree6.root
while (!leaf.isLeaf) {
  leaf = leaf.children[0]
}
const sorted = []
while (leaf) {
  sorted.push(...leaf.keys)
  leaf = leaf.next
}
console.log('Sorted order:', sorted.join(', '))
console.log()

// Test 7: Merge behavior
console.log('Test 7: Merge Behavior')
const tree7 = new BPlusTree(3)
const keys7 = ['10', '20', '30', '40', '50', '60', '70']
keys7.forEach(k => tree7.insert(k))
console.log('Initial tree:', tree7.getStats())

// Delete multiple keys to trigger merges
tree7.delete('30')
console.log('After deleting 30:', tree7.getStats())
tree7.delete('40')
console.log('After deleting 40:', tree7.getStats())
tree7.delete('50')
console.log('After deleting 50:', tree7.getStats())
console.log()

console.log('=== All Tests Complete ===')
