let _nodeId = 0

function mkNode(isLeaf) {
  return { id: `n${_nodeId++}`, isLeaf, keys: [], children: [], next: null, parent: null }
}

/**
 * Canonical key-normalization rule, shared by the tree and every caller that
 * needs to compare against a stored key (e.g. the OperationsPanel dedupe).
 *
 * Contract: trim + lowercase, then coerce to a Number ONLY when the string is a
 * clean signed integer (`/^-?\d+$/`). Everything else stays a trimmed string.
 *
 *   kept (intentionally):  "007" -> 7, "-5" -> -5, "banana" -> "banana"
 *   NOT coerced (were bugs): "1e3", "0x10", "1.5", "+7", "" , "   "  -> stay strings
 *
 * Note: integers beyond Number.MAX_SAFE_INTEGER lose precision under Number();
 * this is an accepted limitation for a teaching visualizer (keys that large are
 * not supported), not something this function guards against.
 */
export function normalizeKey(k) {
  const str = String(k).toLowerCase().trim()
  return /^-?\d+$/.test(str) ? Number(str) : str
}

export class BPlusTree {
  constructor(order = 4) {
    if (order < 3) throw new Error('Order must be at least 3')
    this.order = order
    this.maxKeys = order - 1               // m - 1
    this.maxChildren = order               // m
    this.minKeys = Math.ceil(order / 2) - 1  // ⌈m/2⌉ - 1
    this.minChildren = Math.ceil(order / 2)  // ⌈m/2⌉
    this._root = mkNode(true)
    this._keySet = new Set()
  }

  _normalize(k) {
    return normalizeKey(k)
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

    const leaf = this._findLeaf(k)
    const idx = leaf.keys.findIndex(x => this._cmp(x, k) === 0)
    if (idx === -1) return  // _keySet was out of sync; nothing structural to do
    leaf.keys.splice(idx, 1)

    // Root leaf may legitimately hold 0 keys — no rebalance needed there.
    if (leaf !== this._root && leaf.keys.length < this.minKeys) {
      this._rebalance(leaf)
    }

    // A copy of k may still sit in an ancestor as a separator (separators are
    // subtree minimums; k could only be one if it was a leaf's minimum). Borrow
    // /merge fix the *immediate* parent separator, but a stale copy can linger
    // in a higher ancestor when the underflowing leaf was a leftmost child, and
    // a no-underflow delete of a leaf's minimum leaves the copy untouched too.
    // One walk down k's search path repairs whichever single copy remains.
    this._refreshSeparatorForDeletedKey(k)
  }

  // Repair the (at most one) internal separator still equal to a just-deleted
  // key. The stale copy lies on k's search path; replace it with the true
  // minimum of the right subtree it heads (== k's in-order successor).
  _refreshSeparatorForDeletedKey(k) {
    let node = this._root
    while (!node.isLeaf) {
      const si = node.keys.findIndex(key => this._cmp(key, k) === 0)
      if (si !== -1) {
        node.keys[si] = this._minKey(node.children[si + 1])
        return
      }
      let i = 0
      while (i < node.keys.length && this._cmp(k, node.keys[i]) >= 0) i++
      node = node.children[i]
    }
  }

  _minKey(node) {
    while (!node.isLeaf) node = node.children[0]
    return node.keys[0]
  }

  // Restore the min-keys invariant for an underflowed node by borrowing from an
  // adjacent sibling (same parent) that has a spare key, else merging with one
  // and recursing the underflow check into the parent.
  _rebalance(node) {
    if (node === this._root) {
      // An internal root that has lost its last separator (1 child) shrinks the
      // tree by one level. A root leaf is allowed to be under-full (even empty).
      if (!node.isLeaf && node.keys.length === 0) {
        this._root = node.children[0]
        this._root.parent = null
      }
      return
    }

    if (node.keys.length >= this.minKeys) return

    const parent = node.parent
    const idx = parent.children.indexOf(node)
    const left = idx > 0 ? parent.children[idx - 1] : null
    const right = idx < parent.children.length - 1 ? parent.children[idx + 1] : null

    if (left && left.keys.length > this.minKeys) {
      this._borrowFromLeft(node, left, parent, idx)
      return
    }
    if (right && right.keys.length > this.minKeys) {
      this._borrowFromRight(node, right, parent, idx)
      return
    }

    // No sibling can spare a key — merge with one, then re-check the parent.
    if (left) {
      this._merge(left, node, parent, idx - 1)
    } else {
      this._merge(node, right, parent, idx)
    }
    this._rebalance(parent)
  }

  // Move the left sibling's last entry across, rotating through parent.keys[idx-1].
  _borrowFromLeft(node, left, parent, idx) {
    const sep = idx - 1
    if (node.isLeaf) {
      node.keys.unshift(left.keys.pop())
      parent.keys[sep] = node.keys[0]
    } else {
      node.keys.unshift(parent.keys[sep])
      const movedChild = left.children.pop()
      node.children.unshift(movedChild)
      movedChild.parent = node
      parent.keys[sep] = left.keys.pop()
    }
  }

  // Move the right sibling's first entry across, rotating through parent.keys[idx].
  _borrowFromRight(node, right, parent, idx) {
    const sep = idx
    if (node.isLeaf) {
      node.keys.push(right.keys.shift())
      parent.keys[sep] = right.keys[0]
    } else {
      node.keys.push(parent.keys[sep])
      const movedChild = right.children.shift()
      node.children.push(movedChild)
      movedChild.parent = node
      parent.keys[sep] = right.keys.shift()
    }
  }

  // Fold `right` into `left`, dropping parent separator/child at [sepIdx]/[sepIdx+1].
  _merge(left, right, parent, sepIdx) {
    if (left.isLeaf) {
      left.keys.push(...right.keys)
      left.next = right.next  // preserve the leaf linked-list through the merge
    } else {
      left.keys.push(parent.keys[sepIdx], ...right.keys)  // pull the separator down
      right.children.forEach(c => { c.parent = left })
      left.children.push(...right.children)
    }
    parent.keys.splice(sepIdx, 1)
    parent.children.splice(sepIdx + 1, 1)
  }

  // Deep copy sharing no mutable node objects, so callers (e.g. the React hook)
  // can clone-then-mutate without touching the original — safe under StrictMode's
  // double-invoked state updaters. Node ids are preserved for stable render keys.
  clone() {
    const copy = new BPlusTree(this.order)
    copy._keySet = new Set(this._keySet)

    const cloneNode = (node) => {
      const n = { id: node.id, isLeaf: node.isLeaf, keys: [...node.keys], children: [], next: null, parent: null }
      if (!node.isLeaf) {
        n.children = node.children.map(c => {
          const cc = cloneNode(c)
          cc.parent = n
          return cc
        })
      }
      return n
    }
    copy._root = cloneNode(this._root)

    // Relink leaf `next` pointers in left-to-right order.
    const leaves = []
    ;(function collect(n) { if (n.isLeaf) leaves.push(n); else n.children.forEach(collect) })(copy._root)
    for (let i = 0; i < leaves.length - 1; i++) leaves[i].next = leaves[i + 1]

    return copy
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
