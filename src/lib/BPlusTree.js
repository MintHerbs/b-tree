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
  constructor(t = 3) {
    this.t = t
    this.root = new BPlusNode(true)
  }

  // Normalize key for comparison: lowercase string
  _str(k) {
    return String(k).toLowerCase()
  }

  // Returns negative / zero / positive
  _cmp(a, b) {
    const as = this._str(a)
    const bs = this._str(b)
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

    // Find sorted insertion index
    let i = leaf.keys.length - 1
    while (i >= 0 && this._cmp(leaf.keys[i], key) > 0) i--

    if (i >= 0 && this._cmp(leaf.keys[i], key) === 0) return // duplicate

    leaf.keys.splice(i + 1, 0, key)

    if (leaf.keys.length === 2 * this.t) this._splitLeaf(leaf)
  }

  // Split a leaf that has reached 2t keys into two leaves of t keys each
  _splitLeaf(leaf) {
    const t = this.t
    const right = new BPlusNode(true)

    // right takes the upper half; leaf retains the lower half
    right.keys = leaf.keys.splice(t) // leaf: keys[0..t-1], right: keys[t..2t-1]

    // Maintain the leaf linked list
    right.next = leaf.next
    leaf.next = right

    // The separator pushed up is the first key of the right node (copied, not removed)
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
      this._insertIntoInternal(leaf, separator, right)
    }
  }

  // After a child split, push `separator` and `rightChild` into the parent
  _insertIntoInternal(leftChild, separator, rightChild) {
    const parent = leftChild.parent
    const idx = parent.children.indexOf(leftChild)

    parent.keys.splice(idx, 0, separator)
    parent.children.splice(idx + 1, 0, rightChild)
    rightChild.parent = parent

    if (parent.keys.length === 2 * this.t) this._splitInternal(parent)
  }

  // Split an overfull internal node (2t keys, 2t+1 children)
  // Median key is PUSHED UP (not copied); left keeps t-1 keys, right keeps t keys
  _splitInternal(node) {
    const t = this.t
    const mid = t - 1 // index of the key to promote

    const promoted = node.keys[mid]
    const right = new BPlusNode(false)

    right.keys = node.keys.splice(mid + 1) // keys[t..2t-1] → right
    node.keys.splice(mid)                   // drop median; node keeps keys[0..t-2]

    right.children = node.children.splice(mid + 1) // children[t..2t] → right
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
      this._insertIntoInternal(node, promoted, right)
    }
  }

  // Delete `key`; no-op if not found
  delete(key) {
    const leaf = this._findLeaf(key)
    const idx = leaf.keys.findIndex(k => this._cmp(k, key) === 0)
    if (idx === -1) return

    leaf.keys.splice(idx, 1)

    if (leaf === this.root) return       // root leaf has no minimum
    if (leaf.keys.length >= this.t - 1) return // still meets minimum

    this._fixLeaf(leaf)
  }

  _fixLeaf(leaf) {
    const parent = leaf.parent
    const idx = parent.children.indexOf(leaf)

    // Attempt: borrow from right sibling
    if (idx < parent.children.length - 1) {
      const right = parent.children[idx + 1]
      if (right.keys.length > this.t - 1) {
        leaf.keys.push(right.keys.shift())
        parent.keys[idx] = right.keys[0] // new first key of right becomes separator
        return
      }
    }

    // Attempt: borrow from left sibling
    if (idx > 0) {
      const left = parent.children[idx - 1]
      if (left.keys.length > this.t - 1) {
        leaf.keys.unshift(left.keys.pop())
        parent.keys[idx - 1] = leaf.keys[0] // new first key of leaf becomes separator
        return
      }
    }

    // Merge
    if (idx < parent.children.length - 1) {
      // Absorb right sibling into leaf
      const right = parent.children[idx + 1]
      leaf.keys.push(...right.keys)
      leaf.next = right.next
      parent.keys.splice(idx, 1)
      parent.children.splice(idx + 1, 1)
    } else {
      // Absorb leaf into left sibling
      const left = parent.children[idx - 1]
      left.keys.push(...leaf.keys)
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
    if (node.keys.length >= this.t - 1) return
    this._fixInternal(node)
  }

  _fixInternal(node) {
    const parent = node.parent
    const idx = parent.children.indexOf(node)

    // Attempt: borrow from right sibling
    if (idx < parent.children.length - 1) {
      const right = parent.children[idx + 1]
      if (right.keys.length > this.t - 1) {
        node.keys.push(parent.keys[idx])      // pull separator down to end of node
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
      if (left.keys.length > this.t - 1) {
        node.keys.unshift(parent.keys[idx - 1])  // pull separator down to front of node
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
      right.children.forEach(c => (c.parent = node))
      node.children.push(...right.children)
      parent.keys.splice(idx, 1)
      parent.children.splice(idx + 1, 1)
    } else {
      // Merge left sibling with node
      const left = parent.children[idx - 1]
      left.keys.push(parent.keys[idx - 1]) // pull separator down
      left.keys.push(...node.keys)
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
    return { order: this.t, nodeCount, keyCount, height }
  }
}

// Keep named export for legacy callers that import { BPlusTreeNode }
export { BPlusNode as BPlusTreeNode }

// --- TEST ---
// Run with: node src/lib/BPlusTree.js
if (typeof process !== 'undefined' && process.argv[1]?.endsWith('BPlusTree.js')) {
  const tree = new BPlusTree(3)
  ;[5, 3, 8, 1, 9, 2, 7].forEach(k => tree.insert(k))

  function printNode(node, prefix = '') {
    const tag = node.isLeaf ? ' (leaf)' : ' (internal)'
    console.log(`${prefix}[${node.keys.join(', ')}]${tag}  id=${node.id}`)
    if (!node.isLeaf) node.children.forEach(c => printNode(c, prefix + '  '))
  }

  console.log('=== Tree structure after inserting [5,3,8,1,9,2,7] with t=3 ===')
  printNode(tree.root)

  console.log('\n=== Leaf chain (linked list) ===')
  let leaf = tree.root
  while (!leaf.isLeaf) leaf = leaf.children[0]
  const parts = []
  while (leaf) { parts.push('[' + leaf.keys.join(', ') + ']'); leaf = leaf.next }
  console.log(parts.join(' → '))

  console.log('\n=== Stats ===', tree.getStats())

  console.log('\n=== Search ===')
  ;[1, 5, 7, 4, 9].forEach(k => console.log(`  search(${k}) → ${tree.search(k)}`))

  console.log('\n=== Delete 5 (a separator key) then delete 3 ===')
  tree.delete(5)
  tree.delete(3)
  printNode(tree.root)
  let l = tree.root
  while (!l.isLeaf) l = l.children[0]
  const p2 = []
  while (l) { p2.push('[' + l.keys.join(', ') + ']'); l = l.next }
  console.log('Leaf chain:', p2.join(' → '))
  console.log('Stats after deletes:', tree.getStats())
}
