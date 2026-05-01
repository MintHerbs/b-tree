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
  renderAttributeLine
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

  if (edge.type === 'attribute-link') {
    return renderAttributeLine(from.x, from.y, to.x, to.y)
  }

  if (edge.type === 'relationship-entity') {
    const line = edge.participation === 'total'
      ? renderDoubleLine(from.x, from.y, to.x, to.y)
      : renderSingleLine(from.x, from.y, to.x, to.y)

    // Cardinality label 20px from entity end, along the line toward relationship
    const totalDist = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2) || 1
    const ux = (from.x - to.x) / totalDist
    const uy = (from.y - to.y) / totalDist
    const labelX = to.x + ux * 20
    const labelY = to.y + uy * 20

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
      ? renderDoubleLine(from.x, from.y, to.x, to.y)
      : renderSingleLine(from.x, from.y, to.x, to.y)
  }

  if (edge.type === 'isa-child') {
    return renderSingleLine(from.x, from.y, to.x, to.y)
  }

  return null
}

function ERDCanvas({ erdData }) {
  const svgRef = useRef(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  const layout = useMemo(
    () => erdData ? calculateERDLayout(erdData) : { nodes: [], edges: [], bounds: null },
    [erdData]
  )

  // Initial viewBox derived from layout bounds with 100px padding on each side
  const [viewBox, setViewBox] = useState(() => {
    if (!layout.bounds) return { x: -700, y: -200, width: 1400, height: 900 }
    const { minX, minY, width, height } = layout.bounds
    return { x: minX - 100, y: minY - 100, width: width + 200, height: height + 200 }
  })

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    setIsPanning(true)
    setPanStart({ x: e.clientX, y: e.clientY })
    e.preventDefault()
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return
    const dx = e.clientX - panStart.x
    const dy = e.clientY - panStart.y
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const scaleX = viewBox.width / rect.width
    const scaleY = viewBox.height / rect.height
    setViewBox(prev => ({ ...prev, x: prev.x - dx * scaleX, y: prev.y - dy * scaleY }))
    setPanStart({ x: e.clientX, y: e.clientY })
  }, [isPanning, panStart, viewBox.width, viewBox.height])

  const handleMouseUp = useCallback(() => setIsPanning(false), [])
  const handleMouseLeave = useCallback(() => setIsPanning(false), [])

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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      >
        {/* Edges first — behind nodes so lines don't overlap labels */}
        {layout.edges.map((edge, i) => (
          <g key={`edge-${i}`}>{edgeContent(edge)}</g>
        ))}

        {/* Nodes on top */}
        {layout.nodes.map(node => (
          <g key={node.id}>{nodeShape(node)}</g>
        ))}
      </svg>

      <div className={styles.hint}>Drag to pan • Scroll to zoom</div>
    </div>
  )
}

export default ERDCanvas
