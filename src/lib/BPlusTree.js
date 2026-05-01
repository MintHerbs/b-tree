let _nodeId = 0

function mkNode(isLeaf) {
  return { id: `n${_nodeId++}`, isLeaf, keys: [], children: [], next: null, parent: null }
}

export class BPlusTree {
  constructor(order = 4) {
    if (order < 2) throw new Error('Order must be at least 2')
    this.order = order
    this.maxKeys = order - 1               // m - 1
    this.maxChildren = order               // m
    this.minKeys = Math.ceil(order / 2) - 1  // ⌈m/2⌉ - 1
    this.minChildren = Math.ceil(order / 2)  // ⌈m/2⌉
    this._root = mkNode(true)
    this._keySet = new Set()
  }

  _normalize(k) {
    const str = String(k).toLowerCase().trim()
    const num = Number(str)
    return isNaN(num) ? str : num
  }

  _cmp(a, b) {
    const aNum = typeof a === 'number'
    const bNum = typeof b === 'number'
    if (aNum && bNum) return a - b
    if (aNum) return -1
    if (bNum) return 1
    return a < b ? -1 : a > b ? 1 : 0
  }

  _findLeaf(key) {
    let node = this._root
    while (!node.isLeaf) {
      let i = 0
      while (i < node.keys.length && this._cmp(key, node.keys[i]) >= 0) i++
      node = node.children[i]
    }
    return node
  }

  search(key) {
    return this._keySet.has(this._normalize(key))
  }

  insert(key) {
    const k = this._normalize(key)
    if (this._keySet.has(k)) return
    this._keySet.add(k)

    const leaf = this._findLeaf(k)
    let i = 0
    while (i < leaf.keys.length && this._cmp(k, leaf.keys[i]) > 0) i++
    leaf.keys.splice(i, 0, k)

    if (leaf.keys.length > this.maxKeys) this._splitLeaf(leaf)
  }

  _splitLeaf(leaf) {
    // Left keeps first ⌈m/2⌉ keys; right gets the rest
    const mid = Math.ceil(this.order / 2)
    const right = mkNode(true)
    right.keys = leaf.keys.splice(mid)
    right.next = leaf.next
    leaf.next = right

    const pushUp = right.keys[0]

    if (!leaf.parent) {
      const root = mkNode(false)
      root.keys = [pushUp]
      root.children = [leaf, right]
      leaf.parent = root
      right.parent = root
      this._root = root
    } else {
      right.parent = leaf.parent
      this._insertKey(leaf.parent, pushUp, right)
    }
  }

  _insertKey(node, key, rightChild) {
    let i = 0
    while (i < node.keys.length && this._cmp(key, node.keys[i]) > 0) i++
    node.keys.splice(i, 0, key)
    node.children.splice(i + 1, 0, rightChild)
    rightChild.parent = node

    if (node.keys.length > this.maxKeys) this._splitInternal(node)
  }

  _splitInternal(node) {
    // Push up key at index ⌈m/2⌉ - 1; left keeps keys before it, right keeps keys after it
    const mid = Math.ceil(this.order / 2) - 1
    const pushUp = node.keys[mid]

    const right = mkNode(false)
    right.keys = node.keys.splice(mid + 1)
    right.children = node.children.splice(mid + 1)
    node.keys.splice(mid, 1)  // remove the pushed-up key

    right.children.forEach(c => { c.parent = right })

    if (!node.parent) {
      const root = mkNode(false)
      root.keys = [pushUp]
      root.children = [node, right]
      node.parent = root
      right.parent = root
      this._root = root
    } else {
      right.parent = node.parent
      this._insertKey(node.parent, pushUp, right)
    }
  }

  delete(key) {
    const k = this._normalize(key)
    if (!this._keySet.has(k)) return
    this._keySet.delete(k)
    const remaining = [...this._keySet]
    // Rebuild from scratch (correct and simple for a visualizer)
    this._keySet.clear()
    this._root = mkNode(true)
    remaining.forEach(rk => this.insert(rk))
  }

  getAllKeys() {
    return [...this._keySet]
  }

  get root() {
    return this._root
  }

  getParameters() {
    return {
      order: this.order,
      maxKeys: this.maxKeys,
      maxChildren: this.maxChildren,
      minKeys: this.minKeys,
      minChildren: this.minChildren,
    }
  }

  validate() {
    const errors = []
    this._validateNode(this._root, errors, true)
    return { valid: errors.length === 0, errors }
  }

  _validateNode(node, errors, isRoot) {
    if (!isRoot && node.keys.length < this.minKeys) {
      errors.push(`Node ${node.id} underflows: ${node.keys.length} keys (min ${this.minKeys})`)
    }
    if (node.keys.length > this.maxKeys) {
      errors.push(`Node ${node.id} overflows: ${node.keys.length} keys (max ${this.maxKeys})`)
    }
    if (!node.isLeaf) {
      if (node.children.length !== node.keys.length + 1) {
        errors.push(`Internal node ${node.id}: ${node.children.length} children for ${node.keys.length} keys`)
      }
      node.children.forEach(c => this._validateNode(c, errors, false))
    }
  }

  getStats() {
    let nodeCount = 0
    let height = 0
    const traverse = (node, depth) => {
      nodeCount++
      height = Math.max(height, depth)
      if (!node.isLeaf) node.children.forEach(c => traverse(c, depth + 1))
    }
    traverse(this._root, 1)
    return { order: this.order, nodeCount, keyCount: this._keySet.size, height }
  }
}

// Legacy compatibility export
export class BPlusTreeNode {
  constructor(isLeaf = false) {
    this.id = `n${_nodeId++}`
    this.isLeaf = isLeaf
    this.keys = []
    this.children = []
    this.next = null
    this.parent = null
  }
}
