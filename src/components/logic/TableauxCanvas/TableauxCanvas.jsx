// TableauxCanvas - SVG renderer for semantic tableaux tree
import { useRef, useEffect, useState, useMemo } from 'react'
import { motion } from 'motion/react'
import styles from './TableauxCanvas.module.css'

const NODE_HEIGHT = 40
const NODE_SPACING_Y = 20
const BRANCH_SPACING_X = 150
const NODE_WIDTH = 200

/**
 * Calculates layout positions for all nodes in the tree
 * Returns positions centered for a given viewport width
 */
function calculateLayout(tree, viewportWidth = 1000) {
  const positions = new Map()
  
  // Calculate depth and width of each subtree
  function measureTree(node) {
    if (!node) return { depth: 0, width: 1 }
    
    if (node.children.length === 0) {
      return { depth: 1, width: 1 }
    }
    
    if (node.children.length === 1) {
      const childMeasure = measureTree(node.children[0])
      return { depth: childMeasure.depth + 1, width: childMeasure.width }
    }
    
    // Two children (beta split)
    const leftMeasure = measureTree(node.children[0])
    const rightMeasure = measureTree(node.children[1])
    return {
      depth: Math.max(leftMeasure.depth, rightMeasure.depth) + 1,
      width: leftMeasure.width + rightMeasure.width
    }
  }
  
  // Position nodes recursively starting from x=0
  function positionNodes(node, x, y, availableWidth) {
    if (!node) return
    
    positions.set(node.id, { x, y })
    
    if (node.children.length === 0) {
      return
    }
    
    if (node.children.length === 1) {
      // Single child - same x position, move down
      positionNodes(node.children[0], x, y + NODE_HEIGHT + NODE_SPACING_Y, availableWidth)
    } else {
      // Two children - split horizontally with increased spacing
      const leftMeasure = measureTree(node.children[0])
      const rightMeasure = measureTree(node.children[1])
      const totalWidth = leftMeasure.width + rightMeasure.width
      
      const leftWidth = (leftMeasure.width / totalWidth) * availableWidth
      const rightWidth = (rightMeasure.width / totalWidth) * availableWidth
      
      // Increase branch separation to prevent overlap
      const branchSeparation = availableWidth / 3
      const leftX = x - branchSeparation
      const rightX = x + branchSeparation
      
      positionNodes(node.children[0], leftX, y + NODE_HEIGHT + NODE_SPACING_Y, leftWidth)
      positionNodes(node.children[1], rightX, y + NODE_HEIGHT + NODE_SPACING_Y, rightWidth)
    }
  }
  
  const measure = measureTree(tree)
  const totalWidth = measure.width * BRANCH_SPACING_X * 1.5 // Increase base width
  
  // Start positioning from x=0
  positionNodes(tree, 0, 0, totalWidth)
  
  // Apply horizontal repulsion to prevent overlaps
  const MIN_DISTANCE = 180
  const REPULSION_ITERATIONS = 20
  
  for (let iter = 0; iter < REPULSION_ITERATIONS; iter++) {
    // Group nodes by Y position (same depth level)
    const nodesByY = new Map()
    positions.forEach((pos, id) => {
      if (!nodesByY.has(pos.y)) {
        nodesByY.set(pos.y, [])
      }
      nodesByY.get(pos.y).push({ id, pos })
    })
    
    // Apply repulsion within each level
    nodesByY.forEach(nodesAtLevel => {
      if (nodesAtLevel.length < 2) return
      
      // Sort by X position
      nodesAtLevel.sort((a, b) => a.pos.x - b.pos.x)
      
      // Push apart nodes that are too close
      for (let i = 0; i < nodesAtLevel.length - 1; i++) {
        const node1 = nodesAtLevel[i]
        const node2 = nodesAtLevel[i + 1]
        
        const distance = node2.pos.x - node1.pos.x
        
        if (distance < MIN_DISTANCE) {
          const pushAmount = (MIN_DISTANCE - distance) * 0.5
          
          // Update positions in the map
          const pos1 = positions.get(node1.id)
          const pos2 = positions.get(node2.id)
          
          positions.set(node1.id, { x: pos1.x - pushAmount, y: pos1.y })
          positions.set(node2.id, { x: pos2.x + pushAmount, y: pos2.y })
        }
      }
    })
  }
  
  // Find bounding box of all nodes
  let minX = Infinity
  let maxX = -Infinity
  positions.forEach(pos => {
    minX = Math.min(minX, pos.x - NODE_WIDTH / 2)
    maxX = Math.max(maxX, pos.x + NODE_WIDTH / 2)
  })
  
  const treeWidth = maxX - minX
  
  // Calculate offset to center tree in viewport
  // Root node should be at viewportWidth / 2
  const centerOffset = (viewportWidth - treeWidth) / 2 - minX
  
  // Apply centering offset to all positions
  const centeredPositions = new Map()
  positions.forEach((pos, id) => {
    centeredPositions.set(id, { x: pos.x + centerOffset, y: pos.y })
  })
  
  return { 
    positions: centeredPositions, 
    totalWidth: treeWidth, 
    totalHeight: measure.depth * (NODE_HEIGHT + NODE_SPACING_Y) 
  }
}

/**
 * Renders a single node
 */
function TableauNode({ node, position, isHighlighted }) {
  const { x, y } = position
  
  // Calculate dynamic width based on formula length
  // Approximate: each character is ~9px in monospace font, add padding
  const textWidth = node.formula.length * 9
  const dynamicWidth = Math.max(NODE_WIDTH, textWidth + 32) // Minimum NODE_WIDTH, or text + padding
  
  // Determine node styling
  let nodeClass = styles.node
  let markerClass = null
  let marker = null
  
  if (node.isClosed) {
    nodeClass = `${styles.node} ${styles.closedNode}`
    marker = '✗'
    markerClass = styles.closedMarker
  } else if (node.isOpen) {
    nodeClass = `${styles.node} ${styles.openNode}`
    marker = '○'
    markerClass = styles.openMarker
  }
  
  if (isHighlighted) {
    nodeClass = `${nodeClass} ${styles.highlighted}`
  }
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Node background - dynamic width */}
      <rect
        x={-dynamicWidth / 2}
        y={0}
        width={dynamicWidth}
        height={NODE_HEIGHT}
        className={nodeClass}
        rx={8}
      />
      
      {/* Formula text */}
      <text
        x={0}
        y={NODE_HEIGHT / 2}
        className={styles.formulaText}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {node.formula}
      </text>
      
      {/* Marker (✗ or ○) */}
      {marker && (
        <text
          x={0}
          y={NODE_HEIGHT + 20}
          className={markerClass}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {marker}
        </text>
      )}
    </g>
  )
}

/**
 * Renders edges between nodes
 */
function TableauEdges({ tree, positions }) {
  const edges = []
  
  function collectEdges(node) {
    if (!node || node.children.length === 0) return
    
    const parentPos = positions.get(node.id)
    
    for (const child of node.children) {
      const childPos = positions.get(child.id)
      if (parentPos && childPos) {
        edges.push({
          x1: parentPos.x,
          y1: parentPos.y + NODE_HEIGHT,
          x2: childPos.x,
          y2: childPos.y
        })
      }
      collectEdges(child)
    }
  }
  
  collectEdges(tree)
  
  return (
    <g className={styles.edges}>
      {edges.map((edge, index) => (
        <line
          key={index}
          x1={edge.x1}
          y1={edge.y1}
          x2={edge.x2}
          y2={edge.y2}
          className={styles.edge}
        />
      ))}
    </g>
  )
}

/**
 * Renders all nodes in the tree
 */
function TableauNodes({ tree, positions, highlightedNodeId }) {
  const nodes = []
  
  function collectNodes(node) {
    if (!node) return
    nodes.push(node)
    for (const child of node.children) {
      collectNodes(child)
    }
  }
  
  collectNodes(tree)
  
  return (
    <g>
      {nodes.map(node => {
        const position = positions.get(node.id)
        if (!position) return null
        
        return (
          <TableauNode
            key={node.id}
            node={node}
            position={position}
            isHighlighted={node.id === highlightedNodeId}
          />
        )
      })}
    </g>
  )
}

export default function TableauxCanvas({ tree, highlightedNodeId }) {
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  
  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        })
      }
    }
    
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])
  
  // Calculate layout with viewport width for proper centering - memoized to prevent infinite re-renders
  const layout = useMemo(() => {
    return tree ? calculateLayout(tree, dimensions.width) : null
  }, [tree, dimensions.width])
  
  // Reset pan and center tree when tree changes
  useEffect(() => {
    if (tree) {
      // Center the tree vertically with some top padding
      const topPadding = 100
      setPanOffset({ x: 0, y: topPadding })
    }
  }, [tree])
  
  // Pan handlers - left-click to drag
  const handleMouseDown = (e) => {
    if (e.button !== 0) return // Only left-click
    setIsPanning(true)
    setPanStart({ x: e.clientX, y: e.clientY })
    e.preventDefault()
  }
  
  const handleMouseMove = (e) => {
    if (!isPanning) return
    
    const dx = (e.clientX - panStart.x) / zoom
    const dy = (e.clientY - panStart.y) / zoom
    
    setPanOffset(prev => ({
      x: prev.x + dx,
      y: prev.y + dy
    }))
    
    setPanStart({ x: e.clientX, y: e.clientY })
  }
  
  const handleMouseUp = () => {
    setIsPanning(false)
  }
  
  // Zoom handler - memoized to prevent recreating on every render
  const handleWheel = useMemo(() => {
    return (e) => {
      e.preventDefault()
      
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.1, Math.min(3, zoom * delta))
      
      setZoom(newZoom)
    }
  }, [zoom])
  
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    
    svg.addEventListener('wheel', handleWheel, { passive: false })
    return () => svg.removeEventListener('wheel', handleWheel)
  }, [handleWheel])
  
  if (!tree) {
    return (
      <div ref={containerRef} className={styles.container}>
        <div className={styles.emptyState}>
          <p>Enter a formula to generate a tableau</p>
        </div>
      </div>
    )
  }
  
  // Calculate viewBox string with pan offset
  // Start viewBox at negative panOffset so tree appears centered with padding
  const svgViewBox = `${-panOffset.x} ${-panOffset.y} ${dimensions.width / zoom} ${dimensions.height / zoom}`
  
  return (
    <div ref={containerRef} className={styles.container}>
      <motion.svg
        ref={svgRef}
        className={styles.svg}
        width="100%"
        height="100%"
        viewBox={svgViewBox}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {layout && (
          <>
            <TableauEdges tree={tree} positions={layout.positions} />
            <TableauNodes
              tree={tree}
              positions={layout.positions}
              highlightedNodeId={highlightedNodeId}
            />
          </>
        )}
      </motion.svg>
    </div>
  )
}
