// Produces an ordered array of animation steps for insert/delete operations.
// Works on a deep-clone of the supplied tree — the original is never mutated.

let _eid = 0

// ─── NODE HELPERS ────────────────────────────────────────────────────────────

function makeNode(isLeaf) {
  return { id: `e${_eid++}`, isLeaf, keys: [], children: [], next: null, parent: null }
}

function cmpKeys(a, b) {
  const as = String(a).toLowerCase()
  const bs = String(b).toLowerCase()
  return as < bs ? -1 : as > bs ? 1 : 0
}

// Deep-copy the subtree rooted at `node` (no parent/next pointers yet)
function cloneSubtree(node) {
  if (!node) return null
  const copy = {
    id: node.id,
    isLeaf: node.isLeaf,
    keys: [...node.keys],
    children: [],
    next: null,
    parent: null,
  }
  if (!node.isLeaf) {
    copy.children = node.children.map(cloneSubtree)
    copy.children.forEach(c => (c.parent = copy))
  }
  return copy
}

function collectLeaves(node, out = []) {
  if (!node) return out
  if (node.isLeaf) { out.push(node); return out }
  node.children.forEach(c => collectLeaves(c, out))
  return out
}

// Full root clone: restores leaf next-pointers after cloneSubtree
function cloneRoot(root) {
  const r = cloneSubtree(root)
  const leaves = collectLeaves(r)
  for (let i = 0; i < leaves.length - 1; i++) leaves[i].next = leaves[i + 1]
  return r
}

function findLeaf(root, key) {
  let node = root
  while (!node.isLeaf) {
    let i = 0
    while (i < node.keys.length && cmpKeys(key, node.keys[i]) >= 0) i++
    node = node.children[i]
  }
  return node
}

// ─── STEP RECORDING ──────────────────────────────────────────────────────────

// ctx = { t, root (mutable), steps[], id }
function snap(ctx) {
  return { t: ctx.t, root: cloneRoot(ctx.root) }
}

function record(ctx, opts) {
  ctx.steps.push({
    id: ctx.id++,
    treeSnapshot: snap(ctx),   // snapshot AFTER any mutation that preceded this call
    highlightNodeId: null,
    highlightKeys: [],
    arrowFrom: null,
    arrowTo: null,
    arrowLabel: null,
    ...opts,
  })
}

// ─── INSERT ──────────────────────────────────────────────────────────────────

function insertStepped(ctx, key) {
  const { t } = ctx

  // Early-out: duplicate
  const target = findLeaf(ctx.root, key)
  if (target.keys.some(k => cmpKeys(k, key) === 0)) {
    record(ctx, {
      type: 'done',
      description: `${key} already exists in the tree — skipping`,
      highlightNodeId: target.id,
      highlightKeys: [String(key)],
    })
    return
  }

  record(ctx, {
    type: 'traverse',
    description: `Insert ${key}: start at root`,
    highlightNodeId: ctx.root.id,
  })

  // Traverse internal nodes
  let node = ctx.root
  while (!node.isLeaf) {
    let i = 0
    while (i < node.keys.length && cmpKeys(key, node.keys[i]) >= 0) i++
    const child = node.children[i]
    const label =
      i < node.keys.length
        ? `${key} < ${node.keys[i]} → go left`
        : `${key} ≥ all keys → go right`
    record(ctx, {
      type: 'traverse',
      description: `Visiting [${node.keys.join(', ')}]: ${label}`,
      highlightNodeId: node.id,
      arrowLabel: label,
    })
    node = child
  }

  // Insert into leaf in sorted order
  let i = node.keys.length - 1
  while (i >= 0 && cmpKeys(node.keys[i], key) > 0) i--
  node.keys.splice(i + 1, 0, key)

  record(ctx, {
    type: 'insert',
    description: `Inserted ${key} into leaf → [${node.keys.join(', ')}]`,
    highlightNodeId: node.id,
    highlightKeys: [String(key)],
  })

  if (node.keys.length === 2 * t) {
    splitLeafStepped(ctx, node)
  } else {
    record(ctx, {
      type: 'done',
      description: `${key} inserted. Leaf has ${node.keys.length} key(s) — no split needed.`,
      highlightNodeId: node.id,
    })
  }
}

function splitLeafStepped(ctx, leaf) {
  const { t } = ctx

  record(ctx, {
    type: 'split',
    description: `Leaf [${leaf.keys.join(', ')}] is full (${2 * t} keys) — splitting`,
    highlightNodeId: leaf.id,
    highlightKeys: leaf.keys.map(String),
  })

  const right = makeNode(true)
  right.keys = leaf.keys.splice(t)    // leaf keeps first t; right gets last t
  right.next = leaf.next
  leaf.next = right
  const separator = right.keys[0]     // copied up, stays in right node

  if (leaf === ctx.root) {
    const newRoot = makeNode(false)
    newRoot.keys = [separator]
    newRoot.children = [leaf, right]
    leaf.parent = newRoot
    right.parent = newRoot
    ctx.root = newRoot

    record(ctx, {
      type: 'split',
      description: `New root [${separator}] — left leaf=[${leaf.keys.join(', ')}], right leaf=[${right.keys.join(', ')}]`,
      highlightNodeId: newRoot.id,
      highlightKeys: [String(separator)],
    })
    record(ctx, {
      type: 'done',
      description: `Insert complete. Tree grew taller.`,
      highlightNodeId: newRoot.id,
    })
  } else {
    right.parent = leaf.parent
    const parent = leaf.parent
    const idx = parent.children.indexOf(leaf)
    parent.keys.splice(idx, 0, separator)
    parent.children.splice(idx + 1, 0, right)

    record(ctx, {
      type: 'split',
      description: `Split leaf → left=[${leaf.keys.join(', ')}], right=[${right.keys.join(', ')}]; copied ${separator} up to parent`,
      highlightNodeId: parent.id,
      highlightKeys: [String(separator)],
    })

    if (parent.keys.length === 2 * t) {
      splitInternalStepped(ctx, parent)
    } else {
      record(ctx, {
        type: 'done',
        description: `Separator ${separator} added to parent. No further splits needed.`,
        highlightNodeId: parent.id,
      })
    }
  }
}

function splitInternalStepped(ctx, node) {
  const { t } = ctx
  const mid = t - 1    // index of the key to promote (pushed up, not copied)

  record(ctx, {
    type: 'split',
    description: `Internal node [${node.keys.join(', ')}] is full (${2 * t} keys) — splitting`,
    highlightNodeId: node.id,
    highlightKeys: node.keys.map(String),
  })

  const promoted = node.keys[mid]
  const right = makeNode(false)
  right.keys = node.keys.splice(mid + 1)   // keys after median → right
  node.keys.splice(mid)                      // drop median; node keeps keys[0..t-2]
  right.children = node.children.splice(mid + 1)
  right.children.forEach(c => (c.parent = right))

  if (node === ctx.root) {
    const newRoot = makeNode(false)
    newRoot.keys = [promoted]
    newRoot.children = [node, right]
    node.parent = newRoot
    right.parent = newRoot
    ctx.root = newRoot

    record(ctx, {
      type: 'split',
      description: `Split internal → left=[${node.keys.join(', ')}], right=[${right.keys.join(', ')}]; promoted ${promoted} to new root`,
      highlightNodeId: newRoot.id,
      highlightKeys: [String(promoted)],
    })
    record(ctx, {
      type: 'done',
      description: `Insert complete. Tree grew taller.`,
      highlightNodeId: newRoot.id,
    })
  } else {
    right.parent = node.parent
    const parent = node.parent
    const idx = parent.children.indexOf(node)
    parent.keys.splice(idx, 0, promoted)
    parent.children.splice(idx + 1, 0, right)

    record(ctx, {
      type: 'split',
      description: `Split internal → left=[${node.keys.join(', ')}], right=[${right.keys.join(', ')}]; promoted ${promoted} to parent`,
      highlightNodeId: parent.id,
      highlightKeys: [String(promoted)],
    })

    if (parent.keys.length === 2 * t) {
      splitInternalStepped(ctx, parent)
    } else {
      record(ctx, {
        type: 'done',
        description: `${promoted} promoted. No further splits needed.`,
        highlightNodeId: parent.id,
      })
    }
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

function deleteStepped(ctx, key) {
  const { t } = ctx

  record(ctx, {
    type: 'traverse',
    description: `Delete ${key}: start at root`,
    highlightNodeId: ctx.root.id,
  })

  let node = ctx.root
  while (!node.isLeaf) {
    let i = 0
    while (i < node.keys.length && cmpKeys(key, node.keys[i]) >= 0) i++
    const child = node.children[i]
    const label =
      i < node.keys.length
        ? `${key} < ${node.keys[i]} → go left`
        : `${key} ≥ all keys → go right`
    record(ctx, {
      type: 'traverse',
      description: `Visiting [${node.keys.join(', ')}]: ${label}`,
      highlightNodeId: node.id,
      arrowLabel: label,
    })
    node = child
  }

  const keyIdx = node.keys.findIndex(k => cmpKeys(k, key) === 0)
  if (keyIdx === -1) {
    record(ctx, {
      type: 'done',
      description: `${key} not found — nothing to delete`,
      highlightNodeId: node.id,
    })
    return
  }

  node.keys.splice(keyIdx, 1)
  record(ctx, {
    type: 'delete',
    description: `Removed ${key} from leaf → [${node.keys.join(', ') || 'empty'}]`,
    highlightNodeId: node.id,
    highlightKeys: node.keys.map(String),
  })

  if (node === ctx.root) {
    record(ctx, {
      type: 'done',
      description: `${key} deleted. Root leaf has no minimum — done.`,
      highlightNodeId: node.id,
    })
    return
  }

  if (node.keys.length >= t - 1) {
    record(ctx, {
      type: 'done',
      description: `${key} deleted. Leaf still has ${node.keys.length} key(s) ≥ minimum (${t - 1}) — done.`,
      highlightNodeId: node.id,
    })
    return
  }

  fixLeafStepped(ctx, node)
}

function fixLeafStepped(ctx, leaf) {
  const { t } = ctx
  const parent = leaf.parent
  const idx = parent.children.indexOf(leaf)

  record(ctx, {
    type: 'merge',
    description: `Leaf [${leaf.keys.join(', ') || 'empty'}] underflows (needs ≥ ${t - 1} keys) — checking siblings`,
    highlightNodeId: leaf.id,
  })

  // Try: borrow from right sibling
  if (idx < parent.children.length - 1) {
    const right = parent.children[idx + 1]
    if (right.keys.length > t - 1) {
      const borrowed = right.keys.shift()
      leaf.keys.push(borrowed)
      parent.keys[idx] = right.keys[0]   // new first key of right becomes separator
      record(ctx, {
        type: 'borrow',
        description: `Borrowed ${borrowed} from right sibling → leaf=[${leaf.keys.join(', ')}], right=[${right.keys.join(', ')}]`,
        highlightNodeId: leaf.id,
        highlightKeys: [String(borrowed)],
        arrowLabel: `← borrow ${borrowed}`,
      })
      record(ctx, { type: 'done', description: `Rebalancing done.`, highlightNodeId: leaf.id })
      return
    }
  }

  // Try: borrow from left sibling
  if (idx > 0) {
    const left = parent.children[idx - 1]
    if (left.keys.length > t - 1) {
      const borrowed = left.keys.pop()
      leaf.keys.unshift(borrowed)
      parent.keys[idx - 1] = leaf.keys[0]   // new first key of leaf becomes separator
      record(ctx, {
        type: 'borrow',
        description: `Borrowed ${borrowed} from left sibling → left=[${left.keys.join(', ')}], leaf=[${leaf.keys.join(', ')}]`,
        highlightNodeId: leaf.id,
        highlightKeys: [String(borrowed)],
        arrowLabel: `borrow ${borrowed} →`,
      })
      record(ctx, { type: 'done', description: `Rebalancing done.`, highlightNodeId: leaf.id })
      return
    }
  }

  // Must merge (prefer right; fall back to left)
  if (idx < parent.children.length - 1) {
    const right = parent.children[idx + 1]
    leaf.keys.push(...right.keys)
    leaf.next = right.next
    parent.keys.splice(idx, 1)
    parent.children.splice(idx + 1, 1)
    record(ctx, {
      type: 'merge',
      description: `Merged leaf with right sibling → [${leaf.keys.join(', ')}]; removed separator from parent`,
      highlightNodeId: leaf.id,
      highlightKeys: leaf.keys.map(String),
    })
  } else {
    const left = parent.children[idx - 1]
    left.keys.push(...leaf.keys)
    left.next = leaf.next
    parent.keys.splice(idx - 1, 1)
    parent.children.splice(idx, 1)
    record(ctx, {
      type: 'merge',
      description: `Merged leaf into left sibling → [${left.keys.join(', ')}]; removed separator from parent`,
      highlightNodeId: left.id,
      highlightKeys: left.keys.map(String),
    })
  }

  afterMerge(ctx, parent)
}

function afterMerge(ctx, node) {
  const { t } = ctx

  if (node === ctx.root) {
    if (node.keys.length === 0) {
      // Root was drained — its sole remaining child becomes the new root
      ctx.root = node.children[0]
      ctx.root.parent = null
      record(ctx, {
        type: 'merge',
        description: `Root emptied — its only child becomes the new root`,
        highlightNodeId: ctx.root.id,
      })
    }
    record(ctx, { type: 'done', description: `Deletion complete.`, highlightNodeId: ctx.root.id })
    return
  }

  if (node.keys.length >= t - 1) {
    record(ctx, {
      type: 'done',
      description: `Parent still has ${node.keys.length} key(s) — no further rebalancing.`,
      highlightNodeId: node.id,
    })
    return
  }

  fixInternalStepped(ctx, node)
}

function fixInternalStepped(ctx, node) {
  const { t } = ctx
  const parent = node.parent
  const idx = parent.children.indexOf(node)

  record(ctx, {
    type: 'merge',
    description: `Internal node [${node.keys.join(', ')}] underflows — checking siblings`,
    highlightNodeId: node.id,
  })

  // Try: borrow from right sibling
  if (idx < parent.children.length - 1) {
    const right = parent.children[idx + 1]
    if (right.keys.length > t - 1) {
      const pulledDown = parent.keys[idx]
      const pushedUp = right.keys[0]
      node.keys.push(pulledDown)
      parent.keys[idx] = right.keys.shift()
      const moved = right.children.shift()
      moved.parent = node
      node.children.push(moved)
      record(ctx, {
        type: 'borrow',
        description: `Rotate right: pulled separator ${pulledDown} down, pushed ${pushedUp} up as new separator`,
        highlightNodeId: node.id,
        arrowLabel: `← rotate`,
      })
      record(ctx, { type: 'done', description: `Rebalancing done.`, highlightNodeId: node.id })
      return
    }
  }

  // Try: borrow from left sibling
  if (idx > 0) {
    const left = parent.children[idx - 1]
    if (left.keys.length > t - 1) {
      const pulledDown = parent.keys[idx - 1]
      const pushedUp = left.keys[left.keys.length - 1]
      node.keys.unshift(pulledDown)
      parent.keys[idx - 1] = left.keys.pop()
      const moved = left.children.pop()
      moved.parent = node
      node.children.unshift(moved)
      record(ctx, {
        type: 'borrow',
        description: `Rotate left: pulled separator ${pulledDown} down, pushed ${pushedUp} up as new separator`,
        highlightNodeId: node.id,
        arrowLabel: `rotate →`,
      })
      record(ctx, { type: 'done', description: `Rebalancing done.`, highlightNodeId: node.id })
      return
    }
  }

  // Must merge
  if (idx < parent.children.length - 1) {
    const right = parent.children[idx + 1]
    node.keys.push(parent.keys[idx])    // pull separator down
    node.keys.push(...right.keys)
    right.children.forEach(c => (c.parent = node))
    node.children.push(...right.children)
    parent.keys.splice(idx, 1)
    parent.children.splice(idx + 1, 1)
    record(ctx, {
      type: 'merge',
      description: `Merged internal [${node.keys.join(', ')}] with right sibling; pulled separator down`,
      highlightNodeId: node.id,
    })
  } else {
    const left = parent.children[idx - 1]
    left.keys.push(parent.keys[idx - 1])   // pull separator down
    left.keys.push(...node.keys)
    node.children.forEach(c => (c.parent = left))
    left.children.push(...node.children)
    parent.keys.splice(idx - 1, 1)
    parent.children.splice(idx, 1)
    record(ctx, {
      type: 'merge',
      description: `Merged internal into left sibling → [${left.keys.join(', ')}]; pulled separator down`,
      highlightNodeId: left.id,
    })
  }

  afterMerge(ctx, parent)
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Generate animation steps for inserting `value` into `tree`.
 * Does NOT mutate `tree`.
 */
export function generateInsertSteps(tree, value) {
  const ctx = { t: tree.t, root: cloneRoot(tree.root), steps: [], id: 0 }
  insertStepped(ctx, value)
  return ctx.steps
}

/**
 * Generate animation steps for deleting `value` from `tree`.
 * Does NOT mutate `tree`.
 */
export function generateDeleteSteps(tree, value) {
  const ctx = { t: tree.t, root: cloneRoot(tree.root), steps: [], id: 0 }
  deleteStepped(ctx, value)
  return ctx.steps
}

/**
 * Generate combined animation steps for building a fresh tree from `values`.
 * @param {Array} values - Initial values to insert (in order)
 * @param {number} order - Tree order (t)
 */
export function generateBuildSteps(values, order) {
  const ctx = {
    t: order,
    root: { id: `e${_eid++}`, isLeaf: true, keys: [], children: [], next: null, parent: null },
    steps: [],
    id: 0,
  }
  for (const v of values) {
    insertStepped(ctx, v)
  }
  return ctx.steps
}
