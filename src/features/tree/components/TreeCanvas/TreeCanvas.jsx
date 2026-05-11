// SVG viewport - owns the <svg> root element and handles pan/zoom
import { useState, useRef, useCallback, useMemo } from 'react'
import styles from './TreeCanvas.module.css'
import TreeNode from '../TreeNode/TreeNode'
import TreeEdge from '../TreeEdge/TreeEdge'
import { calculateTreeLayout } from '../../lib/treeLayout'

function TreeCanvas({ tree }) {
  const svgRef = useRef(null)
  const [viewBox, setViewBox] = useState({ x: -500, y: -100, width: 1000, height: 800 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  // Calculate layout from tree
  const layout = useMemo(() => {
    if (!tree || !tree.root) return { nodes: [], edges: [] }
    return calculateTreeLayout(tree.root)
  }, [tree])

  const hasTree = layout.nodes.length > 0

  // Mouse down - start panning
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return // Only left click
    setIsPanning(true)
    setPanStart({ x: e.clientX, y: e.clientY })
    e.preventDefault()
  }, [])

  // Mouse move - pan the view
  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return

    const dx = e.clientX - panStart.x
    const dy = e.clientY - panStart.y

    // Scale movement by viewBox size / SVG size
    const svg = svgRef.current
    if (!svg) return

    const rect = svg.getBoundingClientRect()
    const scaleX = viewBox.width / rect.width
    const scaleY = viewBox.height / rect.height

    setViewBox(prev => ({
      ...prev,
      x: prev.x - dx * scaleX,
      y: prev.y - dy * scaleY
    }))

    setPanStart({ x: e.clientX, y: e.clientY })
  }, [isPanning, panStart, viewBox.width, viewBox.height])

  // Mouse up - stop panning
  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Mouse leave - stop panning
  const handleMouseLeave = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Wheel - zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault()

    const delta = e.deltaY
    const zoomFactor = delta > 0 ? 1.1 : 0.9

    // Zoom towards mouse position
    const svg = svgRef.current
    if (!svg) return

    const rect = svg.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Convert mouse position to SVG coordinates
    const svgX = viewBox.x + (mouseX / rect.width) * viewBox.width
    const svgY = viewBox.y + (mouseY / rect.height) * viewBox.height

    setViewBox(prev => {
      const newWidth = prev.width * zoomFactor
      const newHeight = prev.height * zoomFactor

      // Adjust position to zoom towards mouse
      const newX = svgX - (mouseX / rect.width) * newWidth
      const newY = svgY - (mouseY / rect.height) * newHeight

      return {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      }
    })
  }, [viewBox])

  // Build node map for quick lookup
  const nodeMap = new Map()
  layout.nodes.forEach(node => {
    nodeMap.set(node.id, node)
  })

  // Empty state - no tree yet
  if (!hasTree) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🌳</div>
          <h2 className={styles.emptyTitle}>No Tree Yet</h2>
          <p className={styles.emptyText}>
            Use the operations panel to insert values and build your B+ tree, or click "Reset / New Tree" to start over with new values.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <svg
        ref={svgRef}
        className={styles.svg}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      >
        {/* Define arrow markers */}
        <defs>
          {/* Leaf pointer arrow (green) */}
          <marker
            id="leaf-arrow"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="var(--accent-green)" />
          </marker>
        </defs>

        {/* Render parent-child edges first (behind nodes) */}
        {layout.edges.map((edge, index) => {
          if (edge.isLeafPointer) return null // Skip leaf pointers here

          const fromNode = nodeMap.get(edge.fromId)
          const toNode = nodeMap.get(edge.toId)

          if (!fromNode || !toNode) return null

          // Calculate edge endpoints
          const from = {
            x: fromNode.x,
            y: fromNode.y + fromNode.height / 2
          }
          const to = {
            x: toNode.x,
            y: toNode.y - toNode.height / 2
          }

          return (
            <TreeEdge
              key={`edge-${index}`}
              from={from}
              to={to}
              isLeafPointer={false}
            />
          )
        })}

        {/* Render nodes */}
        {layout.nodes.map(node => (
          <TreeNode
            key={node.id}
            node={node}
            isHighlighted={false}
            highlightedKeys={[]}
          />
        ))}

        {/* Render leaf-to-leaf pointers (on top of nodes) */}
        {layout.nodes.map(node => {
          if (!node.isLeaf || !node.nextLeafId) return null

          const nextNode = nodeMap.get(node.nextLeafId)
          if (!nextNode) return null

          // Calculate horizontal arrow from right edge of current to left edge of next
          const from = {
            x: node.x + node.width / 2,
            y: node.y
          }
          const to = {
            x: nextNode.x - nextNode.width / 2,
            y: nextNode.y
          }

          return (
            <TreeEdge
              key={`leaf-pointer-${node.id}`}
              from={from}
              to={to}
              isLeafPointer={true}
            />
          )
        })}
      </svg>

      {/* Zoom controls hint */}
      <div className={styles.hint}>
        Drag to pan • Scroll to zoom
      </div>
    </div>
  )
}

export default TreeCanvas
