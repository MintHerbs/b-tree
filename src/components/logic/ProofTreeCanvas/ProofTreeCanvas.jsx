// ProofTreeCanvas - Sequential top-to-bottom proof tree renderer with live edge updates
import { useRef, useEffect, useState, useMemo } from 'react'
import { motion } from 'motion/react'
import styles from './ProofTreeCanvas.module.css'

const ROW_HEIGHT = 70

/**
 * Calculates initial node positions for proof tree in sequential order
 * Each step appears in the exact order it was solved, one row per step
 * X positions show which formulas feed into which (parent averaging)
 * Returns only positions object - edges are computed at render time
 */
function calculateInitialPositions(steps, viewportWidth = 1000) {
  const positions = {}
  const centerX = viewportWidth / 2
  
  // Process steps in the order they appear in the array
  // Each step gets its own row: Y = rowIndex * ROW_HEIGHT
  steps.forEach((step, index) => {
    const rowY = (index + 1) * ROW_HEIGHT
    
    if (step.isPremise) {
      // Premises all start at center X
      positions[step.id] = { x: centerX, y: rowY }
    } else {
      // Derived step: X = average of parent X positions
      const parents = (step.fromIds || [])
        .map(pid => positions[pid])
        .filter(Boolean)
      
      if (parents.length === 0) {
        // No parents positioned yet (shouldn't happen in valid proof)
        positions[step.id] = { x: centerX, y: rowY }
      } else if (parents.length === 1) {
        // One parent: sit directly below it (same X)
        positions[step.id] = { x: parents[0].x, y: rowY }
      } else {
        // Multiple parents: sit at midpoint X between them
        const avgX = parents.reduce((sum, p) => sum + p.x, 0) / parents.length
        positions[step.id] = { x: avgX, y: rowY }
      }
    }
  })
  
  // Apply horizontal repulsion to spread nodes at same Y level
  const MIN_DISTANCE = 150
  const REPULSION_STRENGTH = 0.6
  const ITERATIONS = 30
  
  for (let iter = 0; iter < ITERATIONS; iter++) {
    // Group nodes by Y position
    const nodesByY = {}
    Object.entries(positions).forEach(([id, pos]) => {
      if (!nodesByY[pos.y]) nodesByY[pos.y] = []
      nodesByY[pos.y].push({ id, pos })
    })
    
    // For each Y level, push apart nodes that are too close
    Object.values(nodesByY).forEach(nodesAtLevel => {
      if (nodesAtLevel.length < 2) return
      
      // Check all pairs
      for (let i = 0; i < nodesAtLevel.length; i++) {
        for (let j = i + 1; j < nodesAtLevel.length; j++) {
          const node1 = nodesAtLevel[i]
          const node2 = nodesAtLevel[j]
          
          const distance = Math.abs(node2.pos.x - node1.pos.x)
          
          if (distance < MIN_DISTANCE) {
            const pushAmount = (MIN_DISTANCE - distance) * REPULSION_STRENGTH / 2
            
            // Push apart symmetrically
            if (node1.pos.x < node2.pos.x) {
              positions[node1.id].x -= pushAmount
              positions[node2.id].x += pushAmount
            } else {
              positions[node1.id].x += pushAmount
              positions[node2.id].x -= pushAmount
            }
          }
        }
      }
    })
  }
  
  return positions
}

/**
 * Renders edges (lines from parents to children) and rule labels
 * Computed at render time from current positions - NOT stored in state
 * Lines always flow downward (parents in earlier rows have lower Y)
 */
function Edges({ steps, positions }) {
  // Compute edges from current positions
  const edges = steps.flatMap(step => {
    const fromIds = step.fromIds || []
    if (fromIds.length === 0) return []
    
    const childPos = positions[step.id]
    if (!childPos) return []
    
    return fromIds.map(parentId => {
      const parentPos = positions[parentId]
      if (!parentPos) return null
      
      return {
        x1: parentPos.x,
        y1: parentPos.y,
        x2: childPos.x,
        y2: childPos.y,
        rule: step.rule,
        stepId: step.id
      }
    }).filter(Boolean)
  })
  
  return (
    <g>
      {edges.map((edge, index) => (
        <g key={`${edge.stepId}-${index}`}>
          {/* Subtle glow effect - soft blurred line underneath */}
          <line
            x1={edge.x1}
            y1={edge.y1 + 10}
            x2={edge.x2}
            y2={edge.y2 - 10}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={4}
            filter="url(#glow)"
          />
          {/* Main line */}
          <line
            x1={edge.x1}
            y1={edge.y1 + 10}
            x2={edge.x2}
            y2={edge.y2 - 10}
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth={2}
          />
          {edge.rule && edge.rule !== 'Premise' && (
            <text
              x={edge.x2 - 24}
              y={(edge.y1 + edge.y2) / 2}
              className={styles.ruleLabel}
              textAnchor="end"
              dominantBaseline="middle"
            >
              {edge.rule}
            </text>
          )}
        </g>
      ))}
    </g>
  )
}

/**
 * Renders formula text nodes with drag support and floating animation
 */
function FormulaNodes({ steps, positions, floatOffsets, conclusionId, onNodeDragStart, draggingNodeId }) {
  return (
    <g>
      {steps.map((step, index) => {
        const pos = positions[step.id]
        if (!pos) return null
        
        const isConclusion = step.id === conclusionId
        const isDragging = step.id === draggingNodeId
        const className = isConclusion ? styles.conclusionText : styles.formulaText
        
        // Apply float offset to Y position
        const floatOffset = floatOffsets[step.id] || 0
        
        // Calculate rectangle dimensions based on text length
        // Approximate width: each character is ~9px, add padding
        const textWidth = step.formula.length * 9
        const rectWidth = textWidth + 24
        const rectHeight = 32
        const rectX = pos.x - rectWidth / 2
        const rectY = pos.y + floatOffset - rectHeight / 2
        
        return (
          <g key={step.id}>
            {/* Rounded rectangle outline */}
            <rect
              x={rectX}
              y={rectY}
              width={rectWidth}
              height={rectHeight}
              rx={8}
              ry={8}
              fill="transparent"
              stroke="#8B5CF6"
              strokeWidth={1.5}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              onMouseDown={(e) => onNodeDragStart(e, step.id)}
            />
            
            {/* Formula text */}
            <text
              x={pos.x}
              y={pos.y + floatOffset}
              className={className}
              textAnchor="middle"
              dominantBaseline="middle"
              onMouseDown={(e) => onNodeDragStart(e, step.id)}
              style={{ cursor: isDragging ? 'grabbing' : 'grab', pointerEvents: 'none' }}
            >
              {step.formula}
            </text>
          </g>
        )
      })}
    </g>
  )
}

export default function ProofTreeCanvas({ steps }) {
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  
  // Store only node positions - edges computed at render time
  const [positions, setPositions] = useState({})
  const [draggingNodeId, setDraggingNodeId] = useState(null)
  
  // Float offsets for gentle animation - stored in ref to avoid re-renders
  const floatOffsetsRef = useRef({})
  const [, forceUpdate] = useState(0)
  const animationFrameRef = useRef(null)
  
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
  
  // Calculate initial positions when steps change
  useEffect(() => {
    if (steps && steps.length > 0) {
      const initialPositions = calculateInitialPositions(steps, dimensions.width)
      setPositions(initialPositions)
      setPanOffset({ x: 0, y: 0 })
    }
  }, [steps, dimensions.width])
  
  // Gentle floating animation
  useEffect(() => {
    if (!steps || steps.length === 0) return
    
    const animate = () => {
      const now = Date.now()
      
      steps.forEach((step, index) => {
        // Each node floats with a sine wave, phase-shifted by index
        // Increased amplitude from 4 to 12 for more noticeable effect
        const offset = Math.sin((now / 2000) + index * 0.8) * 12
        floatOffsetsRef.current[step.id] = offset
      })
      
      // Force a re-render to apply new offsets
      forceUpdate(prev => prev + 1)
      
      animationFrameRef.current = requestAnimationFrame(animate)
    }
    
    animationFrameRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [steps])
  
  // Node drag handlers
  const handleNodeDragStart = (e, nodeId) => {
    e.stopPropagation()
    setDraggingNodeId(nodeId)
  }
  
  const handleNodeDrag = (e) => {
    if (!draggingNodeId) return
    
    e.stopPropagation()
    
    // Get SVG coordinates
    const svg = svgRef.current
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())
    
    // Update only the dragged node's position
    setPositions(prev => ({
      ...prev,
      [draggingNodeId]: { x: svgP.x, y: svgP.y }
    }))
  }
  
  const handleNodeDragEnd = () => {
    setDraggingNodeId(null)
  }
  
  // Pan handlers - only when not dragging a node
  const handleMouseDown = (e) => {
    if (e.button !== 0 || draggingNodeId) return
    setIsPanning(true)
    setPanStart({ x: e.clientX, y: e.clientY })
    e.preventDefault()
  }
  
  const handleMouseMove = (e) => {
    // Handle node dragging
    if (draggingNodeId) {
      handleNodeDrag(e)
      return
    }
    
    // Handle panning
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
    if (draggingNodeId) {
      handleNodeDragEnd()
    }
    setIsPanning(false)
  }
  
  // Zoom handler
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
  
  if (!steps || steps.length === 0) {
    return (
      <div ref={containerRef} className={styles.container}>
        <div className={styles.emptyState}>
          <p>No proof steps to display</p>
        </div>
      </div>
    )
  }
  
  // Find the last non-premise step as conclusion
  const conclusionStep = [...steps].reverse().find(s => !s.isPremise)
  const conclusionId = conclusionStep?.id
  
  // Calculate viewBox
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
        {/* SVG filter for subtle glow effect */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <Edges steps={steps} positions={positions} />
        <FormulaNodes 
          steps={steps} 
          positions={positions}
          floatOffsets={floatOffsetsRef.current}
          conclusionId={conclusionId}
          onNodeDragStart={handleNodeDragStart}
          draggingNodeId={draggingNodeId}
        />
      </motion.svg>
    </div>
  )
}
