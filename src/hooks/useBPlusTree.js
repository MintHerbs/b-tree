// React hook that wraps BPlusTree.js with state management
// Manages: tree instance, animation steps, insert/delete operations

import { useState, useCallback, useMemo } from 'react'
import { BPlusTree } from '../lib/BPlusTree'
import { generateInsertSteps, generateDeleteSteps, generateBuildSteps } from '../engine/AnimationEngine'

/**
 * Custom hook for managing B+ tree state and operations
 * @param {Array} initialValues - Initial values to insert
 * @param {number} order - Tree order (t value)
 * @returns {Object} - Tree state and operations
 */
export function useBPlusTree(initialValues = [], order = 3) {
  const [tree, setTree] = useState(() => new BPlusTree(order))
  const [steps, setSteps] = useState([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize tree with initial values
  const initializeTree = useCallback((values, treeOrder) => {
    const newTree = new BPlusTree(treeOrder)
    
    // Generate build steps (AnimationEngine handles insertions internally)
    const buildSteps = generateBuildSteps(values, treeOrder)
    
    // Apply all insertions to the actual tree
    values.forEach(value => newTree.insert(value))
    
    setTree(newTree)
    setSteps(buildSteps)
    setIsInitialized(true)
  }, [])

  // Insert values into the tree
  const insert = useCallback((values) => {
    if (!Array.isArray(values)) {
      values = [values]
    }

    // Generate steps for each value and accumulate them
    const allNewSteps = []
    
    values.forEach(value => {
      const insertSteps = generateInsertSteps(tree, value)
      allNewSteps.push(...insertSteps)
    })

    // Apply insertions to the actual tree
    const newTree = new BPlusTree(tree.t)
    // Rebuild tree from scratch by getting all keys from current tree
    const allKeys = []
    const collectKeys = (node) => {
      if (node.isLeaf) {
        allKeys.push(...node.keys)
      } else {
        node.children.forEach(child => collectKeys(child))
      }
    }
    collectKeys(tree.root)
    
    // Insert existing keys plus new values
    allKeys.forEach(k => newTree.insert(k))
    values.forEach(v => newTree.insert(v))

    // Update state
    setTree(newTree)
    setSteps(prevSteps => [...prevSteps, ...allNewSteps])
  }, [tree])

  // Delete values from the tree
  const deleteValues = useCallback((values) => {
    if (!Array.isArray(values)) {
      values = [values]
    }

    // Generate steps for each value
    const allNewSteps = []
    
    values.forEach(value => {
      const deleteSteps = generateDeleteSteps(tree, value)
      allNewSteps.push(...deleteSteps)
    })

    // Apply deletions to the actual tree
    const newTree = new BPlusTree(tree.t)
    // Rebuild tree from scratch
    const allKeys = []
    const collectKeys = (node) => {
      if (node.isLeaf) {
        allKeys.push(...node.keys)
      } else {
        node.children.forEach(child => collectKeys(child))
      }
    }
    collectKeys(tree.root)
    
    // Insert existing keys except deleted values
    allKeys.forEach(k => {
      if (!values.some(v => String(v).toLowerCase() === String(k).toLowerCase())) {
        newTree.insert(k)
      }
    })

    // Update state
    setTree(newTree)
    setSteps(prevSteps => [...prevSteps, ...allNewSteps])
  }, [tree])

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
    steps,
    isInitialized,
    stats,
    initializeTree,
    insert,
    deleteValues,
    resetTree
  }
}
