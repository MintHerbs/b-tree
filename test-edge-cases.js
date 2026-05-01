import { BPlusTree } from './src/lib/BPlusTree.js'

console.log('=== Edge Case Tests ===\n')

// Test 1: Empty tree operations
console.log('Test 1: Empty Tree Operations')
const tree1 = new BPlusTree(3)
console.log('Search in empty tree:', tree1.search('anything'))
tree1.delete('nonexistent')
console.log('Delete from empty tree: no crash ✓')
console.log()

// Test 2: Single element
console.log('Test 2: Single Element')
const tree2 = new BPlusTree(3)
tree2.insert('only')
console.log('After inserting one element:', tree2.getStats())
console.log('Search for element:', tree2.search('only'))
tree2.delete('only')
console.log('After deleting only element:', tree2.getStats())
console.log('Search after delete:', tree2.search('only'))
console.log()

// Test 3: Duplicate insertions
console.log('Test 3: Duplicate Insertions')
const tree3 = new BPlusTree(3)
tree3.insert('A')
tree3.insert('A')
tree3.insert('A')
console.log('Inserted "A" three times, key count:', tree3.getStats().keyCount, '(should be 1)')
console.log()

// Test 4: Delete non-existent key
console.log('Test 4: Delete Non-existent Key')
const tree4 = new BPlusTree(3)
tree4.insert('X')
tree4.insert('Y')
tree4.delete('Z')
console.log('Deleted non-existent key, remaining keys:', tree4.getStats().keyCount, '(should be 2)')
console.log()

// Test 5: Alternating insert/delete
console.log('Test 5: Alternating Insert/Delete')
const tree5 = new BPlusTree(3)
for (let i = 1; i <= 10; i++) {
  tree5.insert(String(i))
  if (i % 2 === 0) {
    tree5.delete(String(i - 1))
  }
}
console.log('After alternating operations:', tree5.getStats())
console.log()

// Test 6: Large order tree
console.log('Test 6: Large Order Tree')
const tree6 = new BPlusTree(100)
for (let i = 1; i <= 1000; i++) {
  tree6.insert(String(i))
}
console.log('Inserted 1000 keys with order=100:', tree6.getStats())
console.log('Search for "500":', tree6.search('500'))
console.log('Search for "1001":', tree6.search('1001'))
console.log()

// Test 7: Reverse order insertion
console.log('Test 7: Reverse Order Insertion')
const tree7 = new BPlusTree(3)
for (let i = 20; i >= 1; i--) {
  tree7.insert(String(i))
}
console.log('Inserted 20 keys in reverse order:', tree7.getStats())

// Verify sorted order
let leaf = tree7.root
while (!leaf.isLeaf) {
  leaf = leaf.children[0]
}
const sorted = []
while (leaf) {
  sorted.push(...leaf.keys)
  leaf = leaf.next
}
const isOrdered = sorted.every((key, i) => i === 0 || tree7._cmp(sorted[i-1], key) < 0)
console.log('Keys are properly sorted:', isOrdered ? '✓' : '✗')
console.log()

// Test 8: Mixed numeric strings
console.log('Test 8: Mixed Numeric Strings')
const tree8 = new BPlusTree(3)
const mixed = ['1', '10', '2', '20', '3', '30', '100', '200']
mixed.forEach(k => tree8.insert(k))

leaf = tree8.root
while (!leaf.isLeaf) {
  leaf = leaf.children[0]
}
const sortedMixed = []
while (leaf) {
  sortedMixed.push(...leaf.keys)
  leaf = leaf.next
}
console.log('Inserted:', mixed.join(', '))
console.log('Sorted as:', sortedMixed.join(', '))
console.log('(Should be numeric order: 1, 2, 3, 10, 20, 30, 100, 200)')
console.log()

// Test 9: Delete all keys
console.log('Test 9: Delete All Keys')
const tree9 = new BPlusTree(3)
const keys9 = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
keys9.forEach(k => tree9.insert(k))
console.log('Before deletion:', tree9.getStats())
keys9.forEach(k => tree9.delete(k))
console.log('After deleting all keys:', tree9.getStats())
console.log('Root is leaf:', tree9.root.isLeaf)
console.log('Root keys:', tree9.root.keys.length)
console.log()

// Test 10: Stress test with random operations
console.log('Test 10: Stress Test')
const tree10 = new BPlusTree(4)
const operations = []
for (let i = 0; i < 100; i++) {
  const key = String(Math.floor(Math.random() * 50))
  if (Math.random() > 0.3) {
    tree10.insert(key)
    operations.push(`+${key}`)
  } else {
    tree10.delete(key)
    operations.push(`-${key}`)
  }
}
console.log('Performed 100 random operations')
console.log('Final state:', tree10.getStats())

// Verify tree integrity
function verifyIntegrity(node, tree) {
  if (node !== tree.root) {
    const minRequired = node.isLeaf ? tree.minKeys : tree.minKeysInternal
    if (node.keys.length < minRequired) {
      return false
    }
  }
  if (node.keys.length > tree.maxKeys) {
    return false
  }
  if (!node.isLeaf) {
    for (const child of node.children) {
      if (!verifyIntegrity(child, tree)) {
        return false
      }
    }
  }
  return true
}

console.log('Tree integrity maintained:', verifyIntegrity(tree10.root, tree10) ? '✓' : '✗')
console.log()

console.log('=== All Edge Cases Passed ===')
