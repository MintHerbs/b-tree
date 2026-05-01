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

    // Clone tree and insert new values
    setTree(currentTree => {
      const newTree = new BPlusTree(currentTree.order)
      
      // Get all existing keys
      const allKeys = []
      const collectKeys = (node) => {
        if (node.isLeaf) {
          allKeys.push(...node.keys)
        } else {
          node.children.forEach(child => collectKeys(child))
        }
      }
      collectKeys(currentTree.root)
      
      // Insert existing keys plus new values
      allKeys.forEach(k => newTree.insert(k))
      values.forEach(v => newTree.insert(v))
      
      return newTree
    })
  }, [])

  // Delete values from the tree
  const deleteValues = useCallback((values) => {
    if (!Array.isArray(values)) {
      values = [values]
    }

    // Clone tree and delete values
    setTree(currentTree => {
      const newTree = new BPlusTree(currentTree.order)
      
      // Get all existing keys
      const allKeys = []
      const collectKeys = (node) => {
        if (node.isLeaf) {
          allKeys.push(...node.keys)
        } else {
          node.children.forEach(child => collectKeys(child))
        }
      }
      collectKeys(currentTree.root)
      
      // Insert existing keys except deleted values
      allKeys.forEach(k => {
        if (!values.some(v => String(v).toLowerCase() === String(k).toLowerCase())) {
          newTree.insert(k)
        }
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
