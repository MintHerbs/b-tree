// Documentation of the useBPlusTree hook API (example usage).
//
// This file is an example/reference, not a node-runnable script — it imports
// React hooks, which need a renderer to execute. The runnable, framework-free
// checks for the hook's core contract (clone-then-mutate independence + the
// stats shape it exposes) live in `src/test/tree/test-library-integration.js`
// and run via `npm run test:tree`.
//
// (Per project decision T-039: no test framework; React-hook execution would
// require one, so we verify the non-React core the hook delegates to instead.)

import { useBPlusTree } from './useBPlusTree.js'

// Example of how the hook is consumed in a component:
function ExampleTreeComponent() {
  // Current API — order is a single number; there is no animation/steps API here.
  const {
    tree,            // BPlusTree instance
    stats,           // { order, nodeCount, keyCount, height }
    initializeTree,  // (values, order) => void
    insert,          // (values | value) => void   (clone-then-mutate)
    deleteValues,    // (values | value) => void   (structural delete, clone-then-mutate)
    resetTree        // (values, order) => void
  } = useBPlusTree(3)

  // Typical usage:
  // - initializeTree([5, 3, 8], 3) — build a tree with initial values
  // - insert([42, 7])              — insert new values
  // - deleteValues([5])            — structurally delete values
  // - resetTree([1, 2, 3], 4)      — reset with new values and order

  return null // demonstration only
}

void ExampleTreeComponent

console.log('=== useBPlusTree(order) API ===')
console.log('Returns: { tree, stats, initializeTree, insert, deleteValues, resetTree }')
console.log('  - tree:           BPlusTree instance')
console.log('  - stats:          { order, nodeCount, keyCount, height }')
console.log('  - initializeTree(values, order)')
console.log('  - insert(values)      // array or single value; clone-then-mutate (StrictMode-safe)')
console.log('  - deleteValues(values)// array or single value; structural borrow/merge delete')
console.log('  - resetTree(values, order)')
