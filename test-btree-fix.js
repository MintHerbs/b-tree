import { BPlusTree } from './src/lib/BPlusTree.js'

console.log('=== Test 1: Order 2 (max 2 keys per node) ===')
console.log('Inserting: Horse, Lantern, Marble\n')

const tree1 = new BPlusTree(2)
const keys1 = ['Horse', 'Lantern', 'Marble']

keys1.forEach((key, i) => {
  tree1.insert(key)
  console.log(`After inserting "${key}":`)
  printTree(tree1)
  console.log()
})

console.log('\n=== Test 2: Order 3 (max 3 keys per node) ===')
console.log('Inserting: cauliflower, potato, squash, tomato\n')

const tree2 = new BPlusTree(3)
const keys2 = ['cauliflower', 'potato', 'squash', 'tomato']

keys2.forEach((key, i) => {
  tree2.insert(key)
  console.log(`After inserting "${key}":`)
  printTree(tree2)
  console.log()
})

function printTree(tree) {
  const queue = [{ node: tree.root, level: 0 }]
  let currentLevel = 0
  let output = ''

  while (queue.length > 0) {
    const { node, level } = queue.shift()

    if (level > currentLevel) {
      console.log(output)
      output = ''
      currentLevel = level
    }

    const tag = node.isLeaf ? 'LEAF' : 'INTERNAL'
    output += `[${node.keys.join(', ')}](${tag}) `

    if (!node.isLeaf) {
      node.children.forEach(child => queue.push({ node: child, level: level + 1 }))
    }
  }
  
  if (output) console.log(output)
}
