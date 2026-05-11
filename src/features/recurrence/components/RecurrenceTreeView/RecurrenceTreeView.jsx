/**
 * RecurrenceTreeView - Zoomable/pannable SVG recursion tree
 * Displays the recursion tree with colored nodes for recursive calls, leaves, and base cases
 */
import { useState, useRef } from 'react'
import styles from './RecurrenceTreeView.module.css'

function RecurrenceTreeView({ tree, formula }) {
  const [zoom, setZoom] = useState(1.0)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isPanning, setIsPanning] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)

  if (!tree || !tree.nodes || tree.nodes.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>No tree data</div>
      </div>
    )
  }

  const { nodes, edges } = tree

  // Compute viewBox from node positions
  const nodePositions = nodes.filter(n => n.type !== 'dots').map(n => ({ x: n.x, y: n.y }))
  const minX = Math.min(...nodePositions.map(p => p.x)) - 80
  const minY = Math.min(...nodePositions.map(p => p.y)) - 40
  const maxX = Math.max(...nodePositions.map(p => p.x)) + 80
  const maxY = Math.max(...nodePositions.map(p => p.y)) + 40
  const viewBox = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`

  // Zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 2.0))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.4))
  }

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom(prev => Math.max(0.4, Math.min(2.0, prev + delta)))
    }
  }

  // Pan controls
  const handleMouseDown = (e) => {
    setIsPanning(true)
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY })
  }

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPanX(e.clientX - dragStart.x)
      setPanY(e.clientY - dragStart.y)
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  const handleDoubleClick = () => {
    setZoom(1.0)
    setPanX(0)
    setPanY(0)
  }

  // Render node based on type
  const renderNode = (node) => {
    if (node.type === 'dots') {
      // Render 3 dots
      return (
        <g key={node.id}>
          <circle cx={node.x} cy={node.y} r={2.5} fill="#6b7280" />
          <circle cx={node.x} cy={node.y + 16} r={2.5} fill="#6b7280" />
          <circle cx={node.x} cy={node.y + 32} r={2.5} fill="#6b7280" />
        </g>
      )
    }

    // Calculate rect dimensions
    const width = node.label.length * 8 + 24
    const height = 28
    const x = node.x - width / 2
    const y = node.y - 14

    // Colors by type
    let fill, stroke, textFill
    if (node.type === 'recursive') {
      fill = 'rgba(139,92,246,0.15)'
      stroke = '#8B5CF6'
      textFill = '#c4b5fd'
    } else if (node.type === 'leaf') {
      fill = 'rgba(34,197,94,0.15)'
      stroke = '#22c55e'
      textFill = '#86efac'
    } else if (node.type === 'base') {
      fill = 'rgba(107,114,128,0.15)'
      stroke = '#6b7280'
      textFill = '#9ca3af'
    }

    return (
      <g key={node.id}>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          stroke={stroke}
          strokeWidth={1.5}
          rx={6}
        />
        <text
          x={node.x}
          y={node.y + 4}
          textAnchor="middle"
          fill={textFill}
          fontSize="13"
          fontFamily="JetBrains Mono, monospace"
          fontWeight="bold"
        >
          {node.label}
        </text>
      </g>
    )
  }

  // Render edge
  const renderEdge = (edge) => {
    const fromNode = nodes.find(n => n.id === edge.from)
    const toNode = nodes.find(n => n.id === edge.to)

    if (!fromNode || !toNode) return null

    // Skip edges to/from dots
    if (fromNode.type === 'dots' || toNode.type === 'dots') return null

    return (
      <line
        key={`${edge.from}-${edge.to}`}
        x1={fromNode.x}
        y1={fromNode.y + 14}
        x2={toNode.x}
        y2={toNode.y - 14}
        stroke="#555"
        strokeWidth={1.5}
      />
    )
  }

  return (
    <div className={styles.container}>
      {/* Zoom controls */}
      <div className={styles.zoomControls}>
        <button
          className={styles.zoomButton}
          onClick={handleZoomIn}
          title="Zoom in"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          className={styles.zoomButton}
          onClick={handleZoomOut}
          title="Zoom out"
          aria-label="Zoom out"
        >
          −
        </button>
      </div>

      {/* SVG canvas */}
      <div
        ref={containerRef}
        className={`${styles.svgWrapper} ${isPanning ? styles.grabbing : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
        >
          <g transform={`translate(${panX / zoom}, ${panY / zoom}) scale(${zoom})`}>
            {/* Render edges first (behind nodes) */}
            {edges.map(edge => renderEdge(edge))}
            
            {/* Render nodes */}
            {nodes.map(node => renderNode(node))}
          </g>
        </svg>
      </div>

      {/* Formula display at bottom */}
      {formula && (
        <div className={styles.formulaDisplay}>
          {formula}
        </div>
      )}
    </div>
  )
}

export default RecurrenceTreeView
