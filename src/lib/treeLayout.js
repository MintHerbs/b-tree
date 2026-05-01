// Converts B+ tree structure to x/y coordinates for SVG rendering
// Uses level-based spacing algorithm (can be upgraded to Reingold-Tilford)

const POINTER_SLOT_WIDTH = 24
const NODE_HEIGHT = 60
const LEVEL_VERTICAL_SPACING = 120
const MIN_HORIZONTAL_SPACING = 40

/**
 * Calculate the width of a key slot based on the key's text length
 * @param {string|number} key - The key value
 * @returns {number} - Width in pixels
 */
function calculateKeySlotWidth(key) {
  const keyString = String(key)
  const textLength = keyString.length
  // Each character is approximately 9px, plus 24px padding
  const calculatedWidth = textLength * 9 + 24
  // Minimum width of 48px
  return Math.max(48, calculatedWidth)
}

/**
 * Calculate layout positions for all nodes in the tree
 * @param {Object} root - The root node of the B+ tree
 * @returns {Object} - { nodes: [], edges: [] }
 */
export function calculateTreeLayout(root) {
  const nodes = []
  const edges = []

  if (!root) {
    return { nodes, edges }
  }

  // Step 1: BFS to organize nodes by level
  const levels = []
  const queue = [{ node: root, level: 0 }]
  const nodeMap = new Map() // id -> node data

  while (queue.length > 0) {
    const { node, level } = queue.shift()

    if (!levels[level]) {
      levels[level] = []
    }

    // Calculate node dimensions based on actual key lengths
    const dimensions = calculateNodeDimensions(node.keys)
    
    const nodeData = {
      id: node.id,
      keys: node.keys,
      isLeaf: node.isLeaf,
      width: dimensions.width,
      height: dimensions.height,
      keySlotWidths: dimensions.keySlotWidths,
      nextLeafId: node.next ? node.next.id : null,
      children: node.children || []
    }

    levels[level].push(nodeData)
    nodeMap.set(node.id, nodeData)

    // Add children to queue
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        if (child) {
          queue.push({ node: child, level: level + 1 })
          
          // Create edge from parent to child
          edges.push({
            fromId: node.id,
            toId: child.id
          })
        }
      }
    }
  }

  // Step 2: Calculate positions for each level
  for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
    const levelNodes = levels[levelIndex]
    const y = levelIndex * LEVEL_VERTICAL_SPACING + 50

    // Calculate total width needed for this level
    const totalNodeWidth = levelNodes.reduce((sum, node) => sum + node.width, 0)
    const totalSpacing = (levelNodes.length - 1) * MIN_HORIZONTAL_SPACING
    const levelWidth = totalNodeWidth + totalSpacing

    // Start position (centered)
    let currentX = -levelWidth / 2

    // Position each node in the level
    for (const nodeData of levelNodes) {
      nodeData.x = currentX + nodeData.width / 2
      nodeData.y = y

      // Add to output nodes array
      nodes.push({
        id: nodeData.id,
        x: nodeData.x,
        y: nodeData.y,
        width: nodeData.width,
        height: nodeData.height,
        keys: nodeData.keys,
        keySlotWidths: nodeData.keySlotWidths,
        isLeaf: nodeData.isLeaf,
        nextLeafId: nodeData.nextLeafId
      })

      currentX += nodeData.width + MIN_HORIZONTAL_SPACING
    }
  }

  // Step 3: Add leaf-to-leaf pointer edges
  const leafLevel = levels[levels.length - 1]
  if (leafLevel) {
    for (const leafNode of leafLevel) {
      if (leafNode.nextLeafId) {
        edges.push({
          fromId: leafNode.id,
          toId: leafNode.nextLeafId,
          isLeafPointer: true
        })
      }
    }
  }

  return { nodes, edges }
}

/**
 * Calculate node dimensions based on the actual keys
 * @param {Array} keys - Array of key values
 * @returns {Object} - { width, height, keySlotWidths }
 */
export function calculateNodeDimensions(keys) {
  // B+ tree node layout: [ P | K1 | P | K2 | P | ... | Kn | P ]
  // Number of pointer slots = keys.length + 1
  // Number of key slots = keys.length
  
  const keyCount = keys.length
  const numPointerSlots = keyCount + 1
  
  // Calculate width for each key slot based on its text length
  const keySlotWidths = keys.map(key => calculateKeySlotWidth(key))
  
  // Total width = all pointer slots + all key slots
  const totalKeyWidth = keySlotWidths.reduce((sum, width) => sum + width, 0)
  const totalPointerWidth = numPointerSlots * POINTER_SLOT_WIDTH
  const width = totalKeyWidth + totalPointerWidth
  const height = NODE_HEIGHT

  return { width, height, keySlotWidths }
}

/**
 * Get slot positions within a node for rendering
 * @param {number} keyCount - Number of keys in the node
 * @param {Array} keySlotWidths - Array of widths for each key slot
 * @returns {Array} - Array of slot objects with { type: 'pointer'|'key', x, width, index }
 */
export function getNodeSlots(keyCount, keySlotWidths = []) {
  const slots = []
  let currentX = 0

  // Alternate between pointer and key slots
  for (let i = 0; i <= keyCount; i++) {
    // Pointer slot
    slots.push({
      type: 'pointer',
      x: currentX,
      width: POINTER_SLOT_WIDTH,
      index: i
    })
    currentX += POINTER_SLOT_WIDTH

    // Key slot (except after the last pointer)
    if (i < keyCount) {
      const keySlotWidth = keySlotWidths[i] || 48 // fallback to minimum
      slots.push({
        type: 'key',
        x: currentX,
        width: keySlotWidth,
        index: i,
        keyIndex: i
      })
      currentX += keySlotWidth
    }
  }

  return slots
}
