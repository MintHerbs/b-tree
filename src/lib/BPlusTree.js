let _nodeId = 0

class BPlusNode {
  constructor(isLeaf = false) {
    this.id = `n${_nodeId++}`
    this.isLeaf = isLeaf
    this.keys = []
    this.children = [] // BPlusNode[] for internal nodes; unused for leaves
    this.next = null   // next leaf in linked list (leaf nodes only)
    this.parent = null
  }
}

export class BPlusTree {
  constructor(order = 3) {
    this.order = order // m = order (max children for internal, max keys = m-1)
    this.maxKeys = order - 1
    this.minKeys = Math.ceil(order / 2) - 1 // ⌈m/2⌉ - 1 for leaves
    this.root = new BPlusNode(true)
  }

  // Normalize key for comparison
  _normalize(k) {
    const str = String(k).toLowerCase()
    // Try to parse as number for numeric comparison
    const num = Number(str)
    return isNaN(num) ? str : num
  }

  // Returns negative / zero / positive
  _cmp(a, b) {
    const an = this._normalize(a)
    const bn = this._normalize(b)
    
    // If both are numbers, compare numerically
    if (typeof an === 'number' && typeof bn === 'number') {
      return an - bn
    }
    
    // Otherwise compare as strings
    const as = String(an)
    const bs = String(bn)
    return as < bs ? -1 : as > bs ? 1 : 0
  }

  // Walk internal nodes to reach the leaf where `key` belongs
  _findLeaf(key) {
    let node = this.root
    while (!node.isLeaf) {
      let i = 0
      // Move right as long as key >= separator; B+ tree rule: key >= sep → right subtree
      while (i < node.keys.length && this._cmp(key, node.keys[i]) >= 0) i++
      node = node.children[i]
    }
    return node
  }

  // Returns true if `key` exists in the tree
  search(key) {
    const leaf = this._findLeaf(key)
    return leaf.keys.some(k => this._cmp(k, key) === 0)
  }

  // Insert `key`; silently ignores duplicates
  insert(key) {
    const leaf = this._findLeaf(key)

    // Check for duplicate
    if (leaf.keys.some(k => this._cmp(k, key) === 0)) return

    // Insert and sort
    leaf.keys.push(key)
    leaf.keys.sort((a, b) => this._cmp(a, b))

    // Split if exceeds maxKeys
    if (leaf.keys.length > this.maxKeys) {
      this._splitLeaf(leaf)
    }
  }

  // Split a leaf that has exceeded maxKeys
  _splitLeaf(leaf) {
    const mid = Math.ceil(leaf.keys.length / 2)
    const right = new BPlusNode(true)

    // Split: left keeps [0..mid-1], right gets [mid..end]
    right.keys = leaf.keys.splice(mid)

    // Maintain the leaf linked list
    right.next = leaf.next
    leaf.next = right

    // The separator is the first key of the right node (COPIED, not removed from right)
    const separator = right.keys[0]

    if (leaf === this.root) {
      const newRoot = new BPlusNode(false)
      newRoot.keys = [separator]
      newRoot.children = [leaf, right]
      leaf.parent = newRoot
      right.parent = newRoot
      this.root = newRoot
    } else {
      right.parent = leaf.parent
      this._insertIntoParent(leaf.parent, separator, leaf, right)
    }
  }

  // Insert separator between leftChild and rightChild in parent
  _insertIntoParent(parent, separator, leftChild, rightChild) {
    // Find position of leftChild
    const idx = parent.children.indexOf(leftChild)
    
    // Insert separator at position idx (between leftChild and rightChild)
    parent.keys.splice(idx, 0, separator)
    // Insert rightChild after leftChild
    parent.children.splice(idx + 1, 0, rightChild)

    // Split if exceeds maxKeys
    if (parent.keys.length > this.maxKeys) {
      this._splitInternal(parent)
    }
  }

  // Split an overfull internal node
  // Median key is MOVED UP (not copied); left and right split evenly
  _splitInternal(node) {
    const mid = Math.floor(node.keys.length / 2)
    const promoted = node.keys[mid]
    const right = new BPlusNode(false)

    // Split keys: left keeps [0..mid-1], promoted goes up, right gets [mid+1..end]
    right.keys = node.keys.splice(mid + 1)
    node.keys.splice(mid) // Remove promoted key

    // Split children: right gets [mid+1..end]
    right.children = node.children.splice(mid + 1)
    right.children.forEach(c => (c.parent = right))

    if (node === this.root) {
      const newRoot = new BPlusNode(false)
      newRoot.keys = [promoted]
      newRoot.children = [node, right]
      node.parent = newRoot
      right.parent = newRoot
      this.root = newRoot
    } else {
      right.parent = node.parent
      this._insertIntoParent(node.parent, promoted, node, right)
    }
  }

  // Delete `key`; no-op if not found
  delete(key) {
    const leaf = this._findLeaf(key)
    const idx = leaf.keys.findIndex(k => this._cmp(k, key) === 0)
    if (idx === -1) return

    leaf.keys.splice(idx, 1)

    if (leaf === this.root) return // root leaf has no minimum
    if (leaf.keys.length >= this.minKeys) return // still meets minimum

    this._fixLeaf(leaf)
  }

  _fixLeaf(leaf) {
    const parent = leaf.parent
    const idx = parent.children.indexOf(leaf)

    // Attempt: borrow from right sibling
    if (idx < parent.children.length - 1) {
      const right = parent.children[idx + 1]
      if (right.keys.length > this.minKeys) {
        leaf.keys.push(right.keys.shift())
        leaf.keys.sort((a, b) => this._cmp(a, b)) // Sort after borrowing
        parent.keys[idx] = right.keys[0] // new first key of right becomes separator
        return
      }
    }

    // Attempt: borrow from left sibling
    if (idx > 0) {
      const left = parent.children[idx - 1]
      if (left.keys.length > this.minKeys) {
        leaf.keys.unshift(left.keys.pop())
        leaf.keys.sort((a, b) => this._cmp(a, b)) // Sort after borrowing
        parent.keys[idx - 1] = leaf.keys[0] // new first key of leaf becomes separator
        return
      }
    }

    // Merge
    if (idx < parent.children.length - 1) {
      // Absorb right sibling into leaf
      const right = parent.children[idx + 1]
      leaf.keys.push(...right.keys)
      leaf.keys.sort((a, b) => this._cmp(a, b)) // Sort after merge
      leaf.next = right.next
      parent.keys.splice(idx, 1)
      parent.children.splice(idx + 1, 1)
    } else {
      // Absorb leaf into left sibling
      const left = parent.children[idx - 1]
      left.keys.push(...leaf.keys)
      left.keys.sort((a, b) => this._cmp(a, b)) // Sort after merge
      left.next = leaf.next
      parent.keys.splice(idx - 1, 1)
      parent.children.splice(idx, 1)
    }

    this._afterMerge(parent)
  }

  _afterMerge(node) {
    if (node === this.root) {
      if (node.keys.length === 0) {
        this.root = node.children[0]
        this.root.parent = null
      }
      return
    }
    if (node.keys.length >= this.minKeys) return
    this._fixInternal(node)
  }

  _fixInternal(node) {
    const parent = node.parent
    const idx = parent.children.indexOf(node)

    // Attempt: borrow from right sibling
    if (idx < parent.children.length - 1) {
      const right = parent.children[idx + 1]
      if (right.keys.length > this.minKeys) {
        node.keys.push(parent.keys[idx])      // pull separator down to end of node
        node.keys.sort((a, b) => this._cmp(a, b)) // Sort after borrowing
        parent.keys[idx] = right.keys.shift() // right's first key becomes new separator
        const moved = right.children.shift()
        moved.parent = node
        node.children.push(moved)
        return
      }
    }

    // Attempt: borrow from left sibling
    if (idx > 0) {
      const left = parent.children[idx - 1]
      if (left.keys.length > this.minKeys) {
        node.keys.unshift(parent.keys[idx - 1])  // pull separator down to front of node
        node.keys.sort((a, b) => this._cmp(a, b)) // Sort after borrowing
        parent.keys[idx - 1] = left.keys.pop()   // left's last key becomes new separator
        const moved = left.children.pop()
        moved.parent = node
        node.children.unshift(moved)
        return
      }
    }

    // Merge
    if (idx < parent.children.length - 1) {
      // Merge node with right sibling
      const right = parent.children[idx + 1]
      node.keys.push(parent.keys[idx]) // pull separator down
      node.keys.push(...right.keys)
      node.keys.sort((a, b) => this._cmp(a, b)) // Sort after merge
      right.children.forEach(c => (c.parent = node))
      node.children.push(...right.children)
      parent.keys.splice(idx, 1)
      parent.children.splice(idx + 1, 1)
    } else {
      // Merge left sibling with node
      const left = parent.children[idx - 1]
      left.keys.push(parent.keys[idx - 1]) // pull separator down
      left.keys.push(...node.keys)
      left.keys.sort((a, b) => this._cmp(a, b)) // Sort after merge
      node.children.forEach(c => (c.parent = left))
      left.children.push(...node.children)
      parent.keys.splice(idx - 1, 1)
      parent.children.splice(idx, 1)
    }

    this._afterMerge(parent)
  }

  // Returns aggregate stats used by the React hook
  getStats() {
    let nodeCount = 0
    let keyCount = 0
    let height = 0

    const walk = (node, depth) => {
      nodeCount++
      keyCount += node.keys.length
      if (depth > height) height = depth
      if (!node.isLeaf) node.children.forEach(c => walk(c, depth + 1))
    }

    walk(this.root, 1)
    return { order: this.order, nodeCount, keyCount, height }
  }
}

// Keep named export for legacy callers that import { BPlusTreeNode }
export { BPlusNode as BPlusTreeNode }

// --- TEST ---
// Run with: node src/lib/BPlusTree.js
if (typeof process !== 'undefined' && process.argv[1]?.endsWith('BPlusTree.js')) {
  const tree = new BPlusTree(3) // order 3 = max 2 keys per node
  ;['5', '15', '25', '35', '45'].forEach(k => tree.insert(k))

  console.log('=== Tree structure after inserting [5,15,25,35,45] with order=3 ===')
  console.log('BFS level-by-level:\n')

  // BFS traversal
  const queue = [{ node: tree.root, level: 0 }]
  let currentLevel = 0

  while (queue.length > 0) {
    const { node, level } = queue.shift()

    if (level > currentLevel) {
      console.log('') // new line for new level
      currentLevel = level
    }

    const tag = node.isLeaf ? 'L' : 'I'
    process.stdout.write(`[${node.keys.join(',')}](${tag}) `)

    if (!node.isLeaf) {
      node.children.forEach(child => queue.push({ node: child, level: level + 1 }))
    }
  }

  console.log('\n')
}
