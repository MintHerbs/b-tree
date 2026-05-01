// Converts B+ tree structure to x/y coordinates for SVG rendering
// Uses level-based spacing algorithm (can be upgraded to Reingold-Tilford)

const KEY_SLOT_WIDTH = 50
const POINTER_SLOT_WIDTH = 24
const NODE_HEIGHT = 60
const LEVEL_VERTICAL_SPACING = 120
const MIN_HORIZONTAL_SPACING = 40

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

    // Calculate node dimensions based on key count
    const dimensions = calculateNodeDimensions(node.keys.length, node.keys.length)
    
    const nodeData = {
      id: node.id,
      keys: node.keys,
      isLeaf: node.isLeaf,
      width: dimensions.width,
      height: dimensions.height,
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
 * Calculate node dimensions based on number of keys
 * @param {number} keyCount - Number of keys in the node
 * @param {number} order - Tree order (optional, not used in current implementation)
 * @returns {Object} - { width, height }
 */
export function calculateNodeDimensions(keyCount, order) {
  // B+ tree node layout: [ P | K1 | P | K2 | P | ... | Kn | P ]
  // Number of pointer slots = keyCount + 1
  // Number of key slots = keyCount
  
  const numPointerSlots = keyCount + 1
  const numKeySlots = keyCount
  
  const width = (numKeySlots * KEY_SLOT_WIDTH) + (numPointerSlots * POINTER_SLOT_WIDTH)
  const height = NODE_HEIGHT

  return { width, height }
}

/**
 * Get slot positions within a node for rendering
 * @param {number} keyCount - Number of keys in the node
 * @returns {Array} - Array of slot objects with { type: 'pointer'|'key', x, width, index }
 */
export function getNodeSlots(keyCount) {
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
      slots.push({
        type: 'key',
        x: currentX,
        width: KEY_SLOT_WIDTH,
        index: i,
        keyIndex: i
      })
      currentX += KEY_SLOT_WIDTH
    }
  }

  return slots
}
