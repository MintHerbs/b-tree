import { useState, useRef, useCallback, useMemo } from 'react'
import { calculateERDLayout } from '../../lib/erdLayout'
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
              style={{ cursor: isDraggable ? 'move' : 'default' }}
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
