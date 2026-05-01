// React hook that wraps BPlusTree.js with state management
// Manages: tree instance, insert/delete operations (no animation)

import { useState, useCallback, useMemo } from 'react'
import { BPlusTree } from '../lib/BPlusTree'

/**
 * Custom hook for managing B+ tree state and operations
 * @param {number} order - Tree order (m value)
 * @returns {Object} - Tree state and operations
 */
export function useBPlusTree(order = 3) {
  const [tree, setTree] = useState(() => new BPlusTree(order))

  // Initialize tree with initial values
  const initializeTree = useCallback((values, treeOrder) => {
    const newTree = new BPlusTree(treeOrder)
    values.forEach(value => newTree.insert(value))
    setTree(newTree)
  }, [])

  // Insert values into the tree
  const insert = useCallback((values) => {
    if (!Array.isArray(values)) {
      values = [values]
    }

    // Insert directly into the tree (library handles everything)
    setTree(currentTree => {
      const newTree = new BPlusTree(currentTree.order)
      
      const existingKeys = currentTree.getAllKeys()
      existingKeys.forEach(k => newTree.insert(k))
      values.forEach(v => newTree.insert(v))
      
      return newTree
    })
  }, [])

  // Delete values from the tree
  const deleteValues = useCallback((values) => {
    if (!Array.isArray(values)) {
      values = [values]
    }

    // Delete directly from the tree (library handles everything)
    setTree(currentTree => {
      const newTree = new BPlusTree(currentTree.order)
      
      const existingKeys = currentTree.getAllKeys()
      const normalizedValues = values.map(v => {
        const str = String(v).toLowerCase().trim()
        const num = Number(str)
        return isNaN(num) ? str : num
      })
      existingKeys.forEach(k => {
        if (!normalizedValues.includes(k)) newTree.insert(k)
      })
      
      return newTree
    })
  }, [])

  // Reset tree with new values
  const resetTree = useCallback((values, treeOrder) => {
    initializeTree(values, treeOrder)
  }, [initializeTree])

  // Get tree statistics
  const stats = useMemo(() => {
    return tree.getStats()
  }, [tree])

  return {
    tree,
    stats,
    initializeTree,
    insert,
    deleteValues,
    resetTree
  }
}
