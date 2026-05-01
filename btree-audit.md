# BPlusTree.js — Audit Instructions for Claude Code

## Task

Read `src/lib/BPlusTree.js` in full, then audit it line by line against the reference
logic documented below. This reference is derived from the Programmiz Python B+ tree
implementation which is confirmed correct.

Do NOT rewrite the whole file. Make surgical fixes only — one per issue found.
For each issue, show: the buggy JS snippet, why it is wrong, and the corrected JS.

---

## Reference Logic (from Programmiz Python — translated to pseudocode)

### Tree Structure

- Every node has: `values` (keys array), `keys` (child pointers array OR record pointers
  for leaves), `nextKey` (next leaf pointer, leaves only), `parent`, `isLeaf` boolean.
- Internal nodes: `keys.length === values.length + 1` always.
- Leaf nodes: `values` and `keys` are parallel arrays (each `keys[i]` is the record
  pointer(s) for `values[i]`). `nextKey` points to the next leaf.

---

### Checkpoint 1 — Insert: leaf split midpoint

Python:
```python
mid = int(math.ceil(order / 2)) - 1
node1.values = old_node.values[mid + 1:]   # right half goes to new node
node1.keys   = old_node.keys[mid + 1:]
old_node.values = old_node.values[:mid + 1] # left half stays
old_node.keys   = old_node.keys[:mid + 1]
old_node.nextKey = node1                    # link leaves
# IMPORTANT: node1.values[0] is COPIED UP to parent (stays in leaf too)
self.insert_in_parent(old_node, node1.values[0], node1)
```

**What to verify in JS:**
- Midpoint formula is exactly `Math.ceil(order / 2) - 1`.
- Right half starts at `mid + 1`, left half ends at `mid + 1` (inclusive of mid).
- The promoted key is `newNode.values[0]` — it is COPIED up, NOT removed from the leaf.
- `old_node.nextKey = node1` is set BEFORE calling insert_in_parent.

**Common bug:** using `Math.floor` instead of `Math.ceil`, or slicing at `mid` instead
of `mid + 1`, or removing the promoted key from the leaf (wrong for leaf splits).

---

### Checkpoint 2 — Insert: internal node split

Python:
```python
mid = int(math.ceil(parentNode.order / 2)) - 1
parentdash.values = parentNode.values[mid + 1:]  # right values
parentdash.keys   = parentNode.keys[mid + 1:]    # right children
value_ = parentNode.values[mid]                  # median is PUSHED UP
if mid == 0:
    parentNode.values = parentNode.values[:mid + 1]
else:
    parentNode.values = parentNode.values[:mid]  # median REMOVED from node
parentNode.keys = parentNode.keys[:mid + 1]
# Re-assign parents for all children
for j in parentNode.keys: j.parent = parentNode
for j in parentdash.keys: j.parent = parentdash
self.insert_in_parent(parentNode, value_, parentdash)
```

**What to verify in JS:**
- For INTERNAL nodes, the median key (`values[mid]`) is PUSHED UP and REMOVED from
  the node — it does NOT stay in either child. This is the opposite of leaf splits.
- When `mid === 0`, left node keeps `values[:mid+1]` (1 value). Otherwise `values[:mid]`.
- All children of both resulting nodes must have their `parent` pointer updated.
- `parentdash.keys` (children) must also get parent updated, not just `parentNode.keys`.

**Common bug:** keeping the median in the internal node after promotion (treating
internal split like a leaf split), or forgetting to update parent pointers on children.

---

### Checkpoint 3 — Search traversal

Python:
```python
for i in range(len(temp2)):
    if value == temp2[i]:
        current_node = current_node.keys[i + 1]  # equal → go RIGHT child
        break
    elif value < temp2[i]:
        current_node = current_node.keys[i]       # less → go LEFT child
        break
    elif i + 1 == len(current_node.values):
        current_node = current_node.keys[i + 1]   # exhausted → rightmost child
        break
```

**What to verify in JS:**
- When the search value EQUALS a key in an internal node, traversal goes to `keys[i+1]`
  (right child), NOT `keys[i]` (left child).
- The exhausted-loop case correctly goes to the last child pointer `keys[i+1]`.

**Common bug:** going left (`keys[i]`) on equality instead of right (`keys[i+1]`).

---

### Checkpoint 4 — Delete: underflow threshold

Python:
```python
# Internal node underflow:
len(node_.keys) < math.ceil(order / 2)
# Leaf node underflow:
len(node_.values) < math.ceil((order - 1) / 2)
```

**What to verify in JS:**
- Internal node minimum children: `Math.ceil(order / 2)`.
- Leaf node minimum values: `Math.ceil((order - 1) / 2)`.
- These are two DIFFERENT formulas — verify JS doesn't use the same formula for both.

---

### Checkpoint 5 — Delete: borrow vs merge decision

Python decision order:
1. Find previous sibling (`PrevNode`) and next sibling (`NextNode`) from parent.
2. If no previous sibling → must use next sibling.
3. If no next sibling → must use previous sibling (is_predecessor = 1).
4. If both exist → prefer merge if `len(node_.values) + len(NextNode.values) < order`,
   otherwise borrow from previous.

**What to verify in JS:**
- Borrow is attempted BEFORE merge — if a sibling has a spare key, borrow; only merge
  if no sibling can spare one.
- The separator key in the parent is updated correctly after a borrow:
  - Borrow from LEFT sibling: parent separator becomes the borrowed key.
  - Borrow from RIGHT sibling: parent separator becomes `rightSibling.values[0]`
    AFTER the borrow (i.e. the new first key of the right sibling).

**Common bug:** always merging without checking if a borrow is possible first, or
updating the wrong parent separator key index after a borrow.

---

### Checkpoint 6 — Delete: merge leaf nodes

Python:
```python
ndash.keys += node_.keys      # append all key pointers
ndash.values += node_.values  # append all values
ndash.nextKey = node_.nextKey # FIX the linked list — skip over deleted node
self.deleteEntry(node_.parent, value_, node_)  # recurse up
del node_
```

**What to verify in JS:**
- After merging two leaf nodes, `survivingNode.nextKey` is updated to `deletedNode.nextKey`
  to maintain the leaf linked list. If this is missing, the leaf chain is broken.
- `deleteEntry` is called recursively on the parent to handle underflow propagation.

**Common bug:** forgetting to re-link `nextKey` after a leaf merge, breaking all
subsequent leaf traversals.

---

### Checkpoint 7 — Delete: merge internal nodes

Python:
```python
if not node_.check_leaf:
    ndash.values.append(value_)   # pull the separator DOWN from parent
ndash.keys += node_.keys
ndash.values += node_.values
```

**What to verify in JS:**
- When merging two INTERNAL nodes, the parent separator key is pulled DOWN into the
  merged node's values. This does NOT happen for leaf merges.
- The separator is appended to the left sibling's values BEFORE appending the right
  node's values, so order is maintained.

**Common bug:** not pulling the separator down during internal node merge, resulting
in a node with missing keys and broken tree structure.

---

### Checkpoint 8 — Root collapse

Python:
```python
if self.root == node_ and len(node_.keys) == 1:
    self.root = node_.keys[0]
    node_.keys[0].parent = None
    del node_
    return
```

**What to verify in JS:**
- When the root is left with exactly 1 child pointer and 0 keys, the single child
  becomes the new root and its `parent` is set to `null`.
- This check happens at the TOP of `deleteEntry`, before the underflow check.

**Common bug:** checking `keys.length === 0` instead of `keys.length === 1`, or
not setting `parent = null` on the new root.

---

## How to Report Findings

For each checkpoint, report one of:
- ✅ PASS — logic matches reference
- ❌ FAIL — show the buggy line(s), explain the deviation, show the fix
- ⚠️  PARTIAL — logic is close but has an edge case issue

After all checkpoints, apply all FAIL and PARTIAL fixes to `BPlusTree.js` directly.
Then add a `// --- TEST ---` block at the bottom that inserts
`['5','15','25','35','45']` with order 3 and logs the resulting tree level by level
so the structure can be visually verified.
