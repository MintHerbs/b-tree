---
id: T-039
title: Make B+ tree deletion and visualization correct
status: backlog
severity: critical
area: tree
epic: none
created: 2026-07-23
---

## Summary

Students report the B+ tree tool "isn't correct." A deep review found that
**insertion is sound** — 3000 randomized fuzz trials across orders 3–7 pass
every B+ tree invariant (same-depth leaves, sorted+complete leaf chain,
separator-key partitioning, key-count bounds, search completeness). The
failures come from four separate issues, in severity order:

1. **Deletion is faked** — it rebuilds the whole tree instead of running the
   delete algorithm, producing valid-but-wrong-shaped trees (the headline).
2. **The diagram miswires child pointers** — every child edge leaves the
   parent's centre, not its pointer slot.
3. **Notation is misleading** — the order value is labeled `t`.
4. **Key input is silently coerced, and the test harness doesn't run** — so
   none of the above is guarded against regression.

Goal: what the tool draws after any insert *or* delete must match what a
student computes by hand.

## Evidence

### 1. Deletion is faked (the core defect)

- [src/lib/BPlusTree.js:119-128](../src/lib/BPlusTree.js#L119-L128) — `delete()`:

  ```js
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
  ```

  No borrow-from-sibling, no merge, no separator update, no underflow handling
  anywhere in the file. `minKeys`/`minChildren`
  ([src/lib/BPlusTree.js:13-14](../src/lib/BPlusTree.js#L13-L14)) are only read
  by `validate()`, never enforced on delete. Because the rebuild re-inserts in
  insertion order, the post-delete shape depends on the entire insert history,
  not the current tree.

- **Reproduced** (order 4, insert `1..10`, then `delete(5)`):

  | | shape |
  |---|---|
  | Before delete | `[5] // [3] [7,9] // [1,2] [3,4] [5,6] [7,8] [9,10]` (height 3) |
  | Tool after `delete(5)` | `[3,6,8] // [1,2] [3,4] [6,7] [8,9,10]` (**height 2**) |
  | Correct algorithm | leaf `[5,6] → [6]`; 1 key = `minKeys`, **no underflow**, tree stays height 3, only that one leaf changes |

  Deleting a single key that causes no underflow collapsed the tree a whole
  level and reorganized every leaf. Any textbook gives the height-3 result.

- [src/hooks/useBPlusTree.js:41-62](../src/hooks/useBPlusTree.js#L41-L62)
  `deleteValues()` mirrors the same rebuild workaround at the hook layer.

### 2. Diagram miswires child pointers

- [src/features/tree/components/TreeCanvas/TreeCanvas.jsx:238-245](../src/features/tree/components/TreeCanvas/TreeCanvas.jsx#L238-L245)
  starts every edge at the parent centre `fromNode.x`, identical for all
  children:

  ```js
  const from = { x: fromNode.x, y: fromNode.y + fromNode.height / 2 }
  const to   = { x: toNode.x,   y: toNode.y   - toNode.height   / 2 }
  ```

- [src/lib/treeLayout.js:71-76](../src/lib/treeLayout.js#L71-L76) emits edges
  as `{ fromId, toId }` only — the child's slot index is never recorded, so
  the renderer can't anchor to a slot. Yet
  [getNodeSlots](../src/lib/treeLayout.js#L164-L194) already computes exact
  pointer-slot x-offsets and
  [TreeNode.jsx:9](../src/features/tree/components/TreeNode/TreeNode.jsx#L9)
  draws them. With 3–4 children the lines fan from one point and it's ambiguous
  which key separates which subtree.

### 3. "Order (t)" mislabels the parameter

- [src/features/tree/components/OperationsPanel/OperationsPanel.jsx:123](../src/features/tree/components/OperationsPanel/OperationsPanel.jsx#L123)
  shows `Order (t):`. The code uses order `m` = max children
  (`maxKeys = m-1`, `maxChildren = m`,
  [src/lib/BPlusTree.js:11-14](../src/lib/BPlusTree.js#L11-L14)). In CLRS, `t`
  is the **minimum degree** (max children `= 2t`) — a different parameter.

### 4. Key normalization surprises + dead test harness

- [src/lib/BPlusTree.js:19-23](../src/lib/BPlusTree.js#L19-L23): `Number()`
  coercion means `"007" → 7`, `"1e3" → 1000`, `"0x10" → 16`, `"" → 0`,
  `"  " → 0`. `"Infinity"` is lowercased first, so it does *not* numify and
  lands as the string `"infinity"`. The OperationsPanel dedupe
  ([OperationsPanel.jsx:24-30](../src/features/tree/components/OperationsPanel/OperationsPanel.jsx#L24-L30))
  uses `String(v).toLowerCase()` without trim/coercion — a different key than
  the tree uses (latent mismatch).
- [src/test/tree/test-library-integration.js:55](../src/test/tree/test-library-integration.js#L55)
  loops `[2, 3, 4, 5, 6, 7]`, but the constructor throws for `order < 3`
  ([BPlusTree.js:9](../src/lib/BPlusTree.js#L9)) — the suite crashes on the
  first iteration and asserts nothing.
- [src/lib/treeLayout.test.js:42-44](../src/lib/treeLayout.test.js#L42-L44)
  calls `calculateNodeDimensions(1)` with a number; the function expects a
  `keys` array and calls `.map` ([treeLayout.js:147](../src/lib/treeLayout.js#L147)) — throws.
- [src/hooks/hooks.test.jsx:18](../src/hooks/hooks.test.jsx#L18) destructures
  `steps`/`isInitialized` and imports `useAnimationPlayer` — none exist in the
  current [useBPlusTree.js](../src/hooks/useBPlusTree.js) API.

## Impact

- **Who:** any student checking insert/delete homework, or an instructor
  demonstrating deletion.
- **Trigger:** any `delete()` on a multi-level tree; any internal node with
  ≥ 2 children; typing `007`/`1e3`/a stray space.
- **Consequence:** deletion shows a valid but differently-shaped (often
  different-height) tree and never demonstrates borrow/merge; child pointers
  don't line up with slots so correct trees look wrong; the order parameter is
  mislabeled; input is silently rewritten; and there is effectively no
  automated guard, so fixes can regress silently.

## Suggested fix

**Priority 1 — real deletion in `BPlusTree.js`** (replace the rebuild):

1. `_findLeaf(k)`, remove `k` from the leaf's `keys` and from `_keySet`.
2. Root leaf may hold 0 keys — done.
3. If `leaf.keys.length >= minKeys`, done — but if `k` also appears as a
   separator in an ancestor, refresh that separator to the leaf's new first
   key (or in-order successor). Keep the existing `minKeys = ⌈m/2⌉−1` formula.
4. On underflow: **borrow** from a left/right sibling (same parent) that has
   `> minKeys`, updating the parent separator.
5. Else **merge** with a sibling (pull the parent separator down for internal
   nodes; concatenate + relink `next` for leaves), then recurse the underflow
   check into the parent.
6. If the root ends with one child, promote it and reduce height.

Keep `_keySet` in sync; preserve leaf `next` pointers through borrow/merge.
Simplify the hook's `deleteValues()` once delete is structural. Leave a seam
for future step-animation but don't build it here.

**Priority 2 — edges through slots:** record the child index (or precomputed
slot-centre x) on each parent→child edge in `treeLayout.js`; in `TreeCanvas`,
start edge `i` at `parent.x - parent.width/2 + slot[i].x + POINTER_SLOT_WIDTH/2`
using the same `getNodeSlots` output the node uses. Child endpoint unchanged.

**Priority 3 — notation:** relabel to `Order (m):` / `Order (max children):`;
if min-degree is also wanted, show both explicitly.

**Priority 4 — input + tests:** define and document the key domain — either
restrict to integers with visible validation, or stop bare `Number()` coercion
(trim, reject empty, only numify plain integers `/^-?\d+$/`); align the
OperationsPanel dedupe to the same rule. Fix the three test files (start the
order loop at 3, pass real key arrays, update the hook API) and add a runnable
command (e.g. `npm run test:tree`).

## Acceptance criteria

- [ ] `delete()` mutates the tree structurally (borrow/merge), never rebuilds.
- [ ] A no-underflow delete changes only the affected leaf (and any ancestor
      separator equal to the removed key); height is unchanged — the
      `order 4, insert 1..10, delete 5` case stays height 3.
- [ ] Underflow resolves by borrowing when a sibling has a spare key, else by
      merging; height only shrinks when the root loses its last separator.
- [ ] After any insert/delete sequence, `validate()` is valid, leaves are at
      one depth, the leaf chain is sorted and equals `getAllKeys()`, and every
      present key is found by `search()`.
- [ ] Child edge `i` originates at the centre of pointer slot `i`, so each
      separator key sits between the two subtrees it divides; leaf `next`
      pointers unchanged.
- [ ] The tree-info panel no longer labels the order value `t`.
- [ ] Key input has a defined, documented normalization (no silent `007→7`,
      `1e3→1000`, `""→0`); OperationsPanel dedupe uses the same rule.
- [ ] `test-library-integration.js`, `treeLayout.test.js`, and `hooks.test.jsx`
      run to completion and pass, with a documented command to run them, and a
      fuzz test covering the insert/delete mix across orders 3–7.

## References

- Core: `src/lib/BPlusTree.js`, hook `src/hooks/useBPlusTree.js`
- Render: `src/features/tree/components/{TreeCanvas,TreeNode,TreeEdge}`,
  `src/lib/treeLayout.js`
- Existing invariant checks to reuse (currently broken):
  `src/test/tree/test-library-integration.js`
