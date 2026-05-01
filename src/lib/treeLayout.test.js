// Test file for treeLayout.js
import { BPlusTree } from './BPlusTree.js'
import { calculateTreeLayout, calculateNodeDimensions, getNodeSlots } from './treeLayout.js'

// Test 1: Empty tree
console.log('=== Test 1: Empty tree ===')
const emptyTree = new BPlusTree(3)
const emptyLayout = calculateTreeLayout(emptyTree.root)
console.log('Empty tree layout:', emptyLayout)
console.log('Expected: nodes with 1 root node, no edges')
console.log('')

// Test 2: Single node with keys
console.log('=== Test 2: Single node with keys ===')
const singleNodeTree = new BPlusTree(3)
singleNodeTree.insert(5)
singleNodeTree.insert(3)
singleNodeTree.insert(8)
const singleLayout = calculateTreeLayout(singleNodeTree.root)
console.log('Single node layout:', JSON.stringify(singleLayout, null, 2))
console.log('')

// Test 3: Tree with splits
console.log('=== Test 3: Tree with splits ===')
const splitTree = new BPlusTree(3)
;[5, 3, 8, 1, 9, 2, 7, 4, 6].forEach(k => splitTree.insert(k))
const splitLayout = calculateTreeLayout(splitTree.root)
console.log('Split tree layout:')
console.log('Nodes:', splitLayout.nodes.length)
console.log('Edges:', splitLayout.edges.length)
splitLayout.nodes.forEach(node => {
  console.log(`  Node ${node.id}: keys=[${node.keys}], pos=(${node.x.toFixed(1)}, ${node.y}), size=${node.width}x${node.height}, isLeaf=${node.isLeaf}`)
})
console.log('Edges:')
splitLayout.edges.forEach(edge => {
  console.log(`  ${edge.fromId} → ${edge.toId}${edge.isLeafPointer ? ' (leaf pointer)' : ''}`)
})
console.log('')

// Test 4: Node dimensions
console.log('=== Test 4: Node dimensions ===')
console.log('1 key:', calculateNodeDimensions(1))
console.log('3 keys:', calculateNodeDimensions(3))
console.log('5 keys:', calculateNodeDimensions(5))
console.log('')

// Test 5: Node slots
console.log('=== Test 5: Node slots ===')
const slots = getNodeSlots(3)
console.log('Slots for 3 keys:', slots)
console.log('Expected pattern: P, K, P, K, P, K, P')
