import { useState, useRef, useCallback, useMemo } from 'react'
import { calculateERDLayout } from '../../../../lib/erdLayout'
import {
  EntityRectangle,
  WeakEntityRectangle,
  AttributeEllipse,
  KeyAttributeEllipse,
  PartialKeyAttributeEllipse,
  MultiValuedAttributeEllipse,
  DerivedAttributeEllipse,
  RelationshipDiamond,
  IdentifyingRelationshipDiamond,
  IsATriangle
} from './shapes.jsx'
import {
  renderSingleLine,
  renderDoubleLine,
  renderAttributeLine,
  getNodeEdgePoint
} from './edges.jsx'
import { getTouchDistance, getTouchMidpoint } from '../../../../lib/touchGestures'
import styles from './ERDCanvas.module.css'

function nodeShape(node) {
  const props = { x: node.x, y: node.y, width: node.width, height: node.height, label: node.name ?? 'IS-A' }

  if (node.type === 'entity') {
    return node.isWeak
      ? <WeakEntityRectangle {...props} />
      : <EntityRectangle {...props} />
  }

  if (node.type === 'relationship') {
    return node.isIdentifying
      ? <IdentifyingRelationshipDiamond {...props} />
      : <RelationshipDiamond {...props} />
  }

  if (node.type === 'attribute') {
    const animationDelay = `${(node.animationIndex || 0) * 0.3}s`
    const Component = (() => {
      switch (node.attrType) {
        case 'key':         return KeyAttributeEllipse
        case 'partial_key': return PartialKeyAttributeEllipse
        case 'multivalued': return MultiValuedAttributeEllipse
        case 'derived':     return DerivedAttributeEllipse
        default:            return AttributeEllipse
      }
    })()
    return (
      <g className={styles.floatingAttribute} style={{ animationDelay }}>
        <Component {...props} />
      </g>
    )
  }

  if (node.type === 'isa') {
    return <IsATriangle {...props} label="IS-A" />
  }

  return null
}

function edgeContent(edge) {
  const { fromNode: from, toNode: to } = edge

  // Calculate border intersection points
  const fromPoint = getNodeEdgePoint(from, to.x, to.y)
  const toPoint = getNodeEdgePoint(to, from.x, from.y)

  if (edge.type === 'attribute-link') {
    return renderAttributeLine(fromPoint.x, fromPoint.y, toPoint.x, toPoint.y)
  }

  if (edge.type === 'relationship-entity') {
    const line = edge.participation === 'total'
      ? renderDoubleLine(fromPoint.x, fromPoint.y, toPoint.x, toPoint.y)
      : renderSingleLine(fromPoint.x, fromPoint.y, toPoint.x, toPoint.y)

    // Cardinality label 20px from entity end, along the line toward relationship
    const totalDist = Math.sqrt((toPoint.x - fromPoint.x) ** 2 + (toPoint.y - fromPoint.y) ** 2) || 1
    const ux = (fromPoint.x - toPoint.x) / totalDist
    const uy = (fromPoint.y - toPoint.y) / totalDist
    const labelX = toPoint.x + ux * 20
    const labelY = toPoint.y + uy * 20

    return (
      <>
        {line}
        {edge.cardinality && (
          <text
            x={labelX}
            y={labelY}
            fill="#ffffff"
            fontSize="12"
            fontWeight="600"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {edge.cardinality}
          </text>
        )}
      </>
    )
  }

  if (edge.type === 'isa-parent') {
    return edge.participation === 'total'
      ? renderDoubleLine(fromPoint.x, fromPoint.y, toPoint.x, toPoint.y)
      : renderSingleLine(fromPoint.x, fromPoint.y, toPoint.x, toPoint.y)
  }

  if (edge.type === 'isa-child') {
    return renderSingleLine(fromPoint.x, fromPoint.y, toPoint.x, toPoint.y)
  }

  return null
}

function ERDCanvas({ erdData }) {
  const svgRef = useRef(null)
  const [viewBox, setViewBox] = useState({ x: -700, y: -200, width: 1400, height: 900 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  
  // Node dragging state
  const [dragState, setDragState] = useState(null) // { nodeId, startX, startY, offsetX, offsetY, attributeOffsets }
  const [nodePositions, setNodePositions] = useState({}) // { nodeId: { x, y, manuallyPlaced } }

  // Touch tracking refs - read directly (not via dragState/isPanning React state) so a
  // touchmove immediately following a touchstart always sees up-to-date gating, even before
  // React has committed the corresponding state update
  const touchPinchRef = useRef(null) // { distance, midpoint }
  const touchPanRef = useRef(null) // { x, y } - background single-finger pan
  const dragStateRef = useRef(null) // mirrors dragState for touch reads

  const layout = useMemo(
    () => erdData ? calculateERDLayout(erdData, nodePositions) : { nodes: [], edges: [] },
    [erdData, nodePositions]
  )

  // Convert mouse position to SVG coordinates
  const screenToSVG = useCallback((clientX, clientY) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const x = viewBox.x + ((clientX - rect.left) / rect.width) * viewBox.width
    const y = viewBox.y + ((clientY - rect.top) / rect.height) * viewBox.height
    return { x, y }
  }, [viewBox])

  // Start dragging a node
  const handleNodeMouseDown = useCallback((e, node) => {
    // Only drag entities, relationships, and ISA nodes (not attributes)
    if (node.type === 'attribute') return
    
    e.stopPropagation()
    const svgPos = screenToSVG(e.clientX, e.clientY)
    
    // Calculate offset from mouse to node center
    const offsetX = node.x - svgPos.x
    const offsetY = node.y - svgPos.y
    
    // Find all attributes belonging to this node
    const attributeOffsets = []
    if (node.type === 'entity' || node.type === 'relationship') {
      layout.nodes.forEach(n => {
        if (n.type === 'attribute') {
          // Check if this attribute belongs to the dragged node
          const edge = layout.edges.find(e => 
            e.type === 'attribute-link' && 
            e.from === node.id && 
            e.to === n.id
          )
          if (edge) {
            attributeOffsets.push({
              id: n.id,
              offsetX: n.x - node.x,
              offsetY: n.y - node.y
            })
          }
        }
      })
    }
    
    setDragState({
      nodeId: node.id,
      startX: svgPos.x,
      startY: svgPos.y,
      offsetX,
      offsetY,
      attributeOffsets,
      hasMoved: false
    })
  }, [layout.nodes, layout.edges, screenToSVG])

  // Start dragging a node via touch (mirrors handleNodeMouseDown).
  // Ignores a second finger landing on a different node mid-drag rather than hijacking the
  // drag onto it, since handleTouchMove only tracks a single active drag via touches[0]
  const handleNodeTouchStart = useCallback((e, node) => {
    if (node.type === 'attribute' || dragStateRef.current) return

    e.stopPropagation()
    const touch = e.touches[0]
    const svgPos = screenToSVG(touch.clientX, touch.clientY)

    const offsetX = node.x - svgPos.x
    const offsetY = node.y - svgPos.y

    const attributeOffsets = []
    if (node.type === 'entity' || node.type === 'relationship') {
      layout.nodes.forEach(n => {
        if (n.type === 'attribute') {
          const edge = layout.edges.find(e =>
            e.type === 'attribute-link' &&
            e.from === node.id &&
            e.to === n.id
          )
          if (edge) {
            attributeOffsets.push({
              id: n.id,
              offsetX: n.x - node.x,
              offsetY: n.y - node.y
            })
          }
        }
      })
    }

    const dragPayload = {
      nodeId: node.id,
      startX: svgPos.x,
      startY: svgPos.y,
      offsetX,
      offsetY,
      attributeOffsets,
      hasMoved: false
    }
    dragStateRef.current = dragPayload
    setDragState(dragPayload)
  }, [layout.nodes, layout.edges, screenToSVG])

  // Handle mouse move during drag
  const handleMouseMove = useCallback((e) => {
    if (dragState) {
      const svgPos = screenToSVG(e.clientX, e.clientY)
      
      // Calculate new position with offset
      const newX = svgPos.x + dragState.offsetX
      const newY = svgPos.y + dragState.offsetY
      
      // Check if moved significantly (> 3px) to distinguish from click
      const dx = svgPos.x - dragState.startX
      const dy = svgPos.y - dragState.startY
      const hasMoved = dragState.hasMoved || (Math.abs(dx) > 3 || Math.abs(dy) > 3)
      
      // Update positions for the dragged node and its attributes
      setNodePositions(prev => {
        const updated = { ...prev }
        
        // Update main node
        updated[dragState.nodeId] = { x: newX, y: newY, manuallyPlaced: true }
        
        // Update attributes with same relative offset
        dragState.attributeOffsets.forEach(attr => {
          updated[attr.id] = {
            x: newX + attr.offsetX,
            y: newY + attr.offsetY,
            manuallyPlaced: true
          }
        })
        
        return updated
      })
      
      setDragState(prev => ({ ...prev, hasMoved }))
    } else if (isPanning) {
      const dx = e.clientX - panStart.x
      const dy = e.clientY - panStart.y
      const svg = svgRef.current
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      const scaleX = viewBox.width / rect.width
      const scaleY = viewBox.height / rect.height
      setViewBox(prev => ({ ...prev, x: prev.x - dx * scaleX, y: prev.y - dy * scaleY }))
      setPanStart({ x: e.clientX, y: e.clientY })
    }
  }, [dragState, isPanning, panStart, viewBox.width, viewBox.height, screenToSVG])

  // Handle mouse up - end drag or pan
  const handleMouseUp = useCallback(() => {
    if (dragState) {
      setDragState(null)
    }
    setIsPanning(false)
  }, [dragState])

  const handleMouseLeave = useCallback(() => {
    if (dragState) {
      setDragState(null)
    }
    setIsPanning(false)
  }, [dragState])

  // Start panning (only if not dragging a node)
  const handleBackgroundMouseDown = useCallback((e) => {
    if (e.button !== 0 || dragState) return
    setIsPanning(true)
    setPanStart({ x: e.clientX, y: e.clientY })
    e.preventDefault()
  }, [dragState])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const svgX = viewBox.x + (mouseX / rect.width) * viewBox.width
    const svgY = viewBox.y + (mouseY / rect.height) * viewBox.height
    setViewBox(prev => {
      const newWidth = prev.width * zoomFactor
      const newHeight = prev.height * zoomFactor
      return {
        x: svgX - (mouseX / rect.width) * newWidth,
        y: svgY - (mouseY / rect.height) * newHeight,
        width: newWidth,
        height: newHeight
      }
    })
  }, [viewBox])

  // Start panning or pinch-zooming (only if not dragging a node).
  // Note: gating reads dragStateRef, not dragState - a touchmove immediately following this
  // touchstart can fire before React commits the corresponding setState.
  const handleBackgroundTouchStart = useCallback((e) => {
    if (dragStateRef.current) return

    if (e.touches.length === 1) {
      setIsPanning(true)
      touchPanRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else if (e.touches.length === 2) {
      setIsPanning(false)
      touchPanRef.current = null
      touchPinchRef.current = {
        distance: getTouchDistance(e.touches)
      }
    }
  }, [])

  // Note: React attaches touchmove as a passive listener, so preventDefault() here would be a
  // no-op (and log a warning) - touch-action: none in CSS is what stops native scroll/zoom
  const handleTouchMove = useCallback((e) => {
    // Dragging a node with one finger
    if (dragStateRef.current) {
      const drag = dragStateRef.current
      const touch = e.touches[0]
      const svgPos = screenToSVG(touch.clientX, touch.clientY)

      const newX = svgPos.x + drag.offsetX
      const newY = svgPos.y + drag.offsetY
      const dx = svgPos.x - drag.startX
      const dy = svgPos.y - drag.startY
      const hasMoved = drag.hasMoved || (Math.abs(dx) > 3 || Math.abs(dy) > 3)

      setNodePositions(prev => {
        const updated = { ...prev }
        updated[drag.nodeId] = { x: newX, y: newY, manuallyPlaced: true }
        drag.attributeOffsets.forEach(attr => {
          updated[attr.id] = {
            x: newX + attr.offsetX,
            y: newY + attr.offsetY,
            manuallyPlaced: true
          }
        })
        return updated
      })

      dragStateRef.current = { ...drag, hasMoved }
      setDragState(prev => (prev ? { ...prev, hasMoved } : prev))
      return
    }

    // Two-finger pinch-zoom on the background
    if (e.touches.length === 2 && touchPinchRef.current) {
      const svg = svgRef.current
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      const state = touchPinchRef.current
      const newDistance = getTouchDistance(e.touches)
      const zoomFactor = state.distance / newDistance

      // Anchor at the current midpoint (not the one from pinch start) so the zoom tracks the
      // fingers even when they drift while pinching, matching wheel-zoom's live cursor anchor
      const midpoint = getTouchMidpoint(e.touches)
      const midX = midpoint.x - rect.left
      const midY = midpoint.y - rect.top
      const svgX = viewBox.x + (midX / rect.width) * viewBox.width
      const svgY = viewBox.y + (midY / rect.height) * viewBox.height

      setViewBox(prev => {
        const newWidth = prev.width * zoomFactor
        const newHeight = prev.height * zoomFactor
        return {
          x: svgX - (midX / rect.width) * newWidth,
          y: svgY - (midY / rect.height) * newHeight,
          width: newWidth,
          height: newHeight
        }
      })

      touchPinchRef.current = { ...state, distance: newDistance }
      return
    }

    // Single-finger pan on the background
    if (touchPanRef.current && e.touches.length === 1) {
      const touch = e.touches[0]
      const dx = touch.clientX - touchPanRef.current.x
      const dy = touch.clientY - touchPanRef.current.y
      const svg = svgRef.current
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      const scaleX = viewBox.width / rect.width
      const scaleY = viewBox.height / rect.height
      setViewBox(prev => ({ ...prev, x: prev.x - dx * scaleX, y: prev.y - dy * scaleY }))
      touchPanRef.current = { x: touch.clientX, y: touch.clientY }
    }
  }, [viewBox, screenToSVG])

  // End touch interaction — stop drag/pan/pinch, or fall back to pan if one finger remains
  const handleTouchEnd = useCallback((e) => {
    if (e.touches.length === 0) {
      if (dragStateRef.current) {
        dragStateRef.current = null
        setDragState(null)
      }
      setIsPanning(false)
      touchPanRef.current = null
      touchPinchRef.current = null
    } else if (e.touches.length === 1) {
      touchPinchRef.current = null
      if (!dragStateRef.current) {
        setIsPanning(true)
        touchPanRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
    }
  }, [])

  return (
    <div className={styles.container}>
      <svg
        ref={svgRef}
        className={styles.svg}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        onMouseDown={handleBackgroundMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onTouchStart={handleBackgroundTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{ cursor: dragState ? 'grabbing' : isPanning ? 'grabbing' : 'grab' }}
      >
        {/* Edges first — behind nodes so lines don't overlap labels */}
        {layout.edges.map((edge, i) => (
          <g key={`edge-${i}`}>{edgeContent(edge)}</g>
        ))}

        {/* Nodes on top */}
        {layout.nodes.map(node => {
          const isDraggable = node.type === 'entity' || node.type === 'relationship' || node.type === 'isa'
          return (
            <g
              key={node.id}
              onMouseDown={isDraggable ? (e) => handleNodeMouseDown(e, node) : undefined}
              onTouchStart={isDraggable ? (e) => handleNodeTouchStart(e, node) : undefined}
              style={{ cursor: isDraggable ? 'move' : 'default', touchAction: 'none' }}
            >
              {nodeShape(node)}
            </g>
          )
        })}
      </svg>

      <div className={styles.hint}>
        {dragState ? 'Dragging node...' : 'Drag nodes to reposition • Drag background to pan • Scroll to zoom'}
      </div>
    </div>
  )
}

export default ERDCanvas
