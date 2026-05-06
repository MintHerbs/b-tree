// ResolutionCanvas - SVG renderer for resolution method
import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import styles from './ResolutionCanvas.module.css'

const CLAUSE_WIDTH = 180
const CLAUSE_HEIGHT = 50
const V_HEIGHT = 100
const STEP_SPACING_Y = 180
const STEP_SPACING_X = 220

/**
 * Renders a clause box
 */
function ClauseBox({ clause, x, y, isHighlighted, isContradiction }) {
  const displayText = clause.length === 0 ? '⊥' : clause.join(', ')
  const isEmptyClause = clause.length === 0
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        x={-CLAUSE_WIDTH / 2}
        y={-CLAUSE_HEIGHT / 2}
        width={CLAUSE_WIDTH}
        height={CLAUSE_HEIGHT}
        className={`${styles.clauseBox} ${isHighlighted ? styles.highlighted : ''} ${isEmptyClause ? styles.contradiction : ''}`}
        rx={8}
      />
      <text
        x={0}
        y={0}
        className={`${styles.clauseText} ${isEmptyClause ? styles.contradictionText : ''}`}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {displayText}
      </text>
    </g>
  )
}

/**
 * Renders a V-connector with two parent clauses and a resolvent
 */
function ResolutionStep({ step, x, y, knowledgeBase }) {
  const clause1 = knowledgeBase.find(kb => kb.id === step.clause1)
  const clause2 = knowledgeBase.find(kb => kb.id === step.clause2)
  
  if (!clause1 || !clause2) return null
  
  const leftX = x - CLAUSE_WIDTH / 2 - 20
  const rightX = x + CLAUSE_WIDTH / 2 + 20
  const topY = y
  const bottomY = y + V_HEIGHT
  const junctionY = y + V_HEIGHT / 2
  
  return (
    <motion.g
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Left parent clause */}
      <ClauseBox clause={clause1.clause} x={leftX} y={topY} />
      
      {/* Right parent clause */}
      <ClauseBox clause={clause2.clause} x={rightX} y={topY} />
      
      {/* V-connector lines */}
      <line
        x1={leftX}
        y1={topY + CLAUSE_HEIGHT / 2}
        x2={x}
        y2={junctionY}
        className={styles.vLine}
      />
      <line
        x1={rightX}
        y1={topY + CLAUSE_HEIGHT / 2}
        x2={x}
        y2={junctionY}
        className={styles.vLine}
      />
      <line
        x1={x}
        y1={junctionY}
        x2={x}
        y2={bottomY - CLAUSE_HEIGHT / 2}
        className={styles.vLine}
      />
      
      {/* Resolved literal label at junction */}
      <g transform={`translate(${x + 10}, ${junctionY})`}>
        <rect
          x={0}
          y={-12}
          width={80}
          height={24}
          className={styles.literalLabel}
          rx={4}
        />
        <text
          x={40}
          y={0}
          className={styles.literalText}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {step.resolvedLiteral}
        </text>
      </g>
      
      {/* Resolvent clause at bottom */}
      <ClauseBox
        clause={step.resolvent}
        x={x}
        y={bottomY}
        isContradiction={step.resolvent.length === 0}
      />
    </motion.g>
  )
}

/**
 * Knowledge base panel showing initial clauses
 */
function KnowledgeBasePanel({ knowledgeBase }) {
  const premiseClauses = knowledgeBase.filter(kb => kb.source === 'premise')
  
  return (
    <div className={styles.kbPanel}>
      <h3 className={styles.kbTitle}>Knowledge Base</h3>
      <div className={styles.kbContent}>
        {premiseClauses.map((kb, index) => (
          <div key={kb.id} className={styles.kbClause}>
            <span className={styles.kbId}>{kb.id}:</span>
            <span className={styles.kbFormula}>
              {kb.clause.length === 0 ? '⊥' : `{${kb.clause.join(', ')}}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ResolutionCanvas({ knowledgeBase, steps, result, currentStepIndex }) {
  const svgRef = useRef(null)
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1000, height: 600 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  
  // Calculate layout for resolution steps
  const visibleSteps = steps.slice(0, currentStepIndex + 1)
  
  // Arrange steps in a grid layout
  const stepsPerRow = 3
  const stepPositions = visibleSteps.map((step, index) => {
    const row = Math.floor(index / stepsPerRow)
    const col = index % stepsPerRow
    
    return {
      x: col * STEP_SPACING_X,
      y: row * STEP_SPACING_Y,
      step
    }
  })
  
  // Center the view on mount
  useEffect(() => {
    if (svgRef.current && steps.length > 0) {
      const containerWidth = svgRef.current.clientWidth
      const containerHeight = svgRef.current.clientHeight
      
      const totalRows = Math.ceil(steps.length / stepsPerRow)
      const totalWidth = stepsPerRow * STEP_SPACING_X
      const totalHeight = totalRows * STEP_SPACING_Y
      
      const centerX = -totalWidth / 2
      const centerY = -100
      
      setViewBox({
        x: centerX,
        y: centerY,
        width: containerWidth / zoom,
        height: containerHeight / zoom
      })
    }
  }, [steps.length, zoom])
  
  // Pan handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    setIsPanning(true)
    setPanStart({ x: e.clientX, y: e.clientY })
  }
  
  const handleMouseMove = (e) => {
    if (!isPanning) return
    
    const dx = (e.clientX - panStart.x) / zoom
    const dy = (e.clientY - panStart.y) / zoom
    
    setViewBox(prev => ({
      ...prev,
      x: prev.x - dx,
      y: prev.y - dy
    }))
    
    setPanStart({ x: e.clientX, y: e.clientY })
  }
  
  const handleMouseUp = () => {
    setIsPanning(false)
  }
  
  // Zoom handler
  const handleWheel = (e) => {
    e.preventDefault()
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.1, Math.min(3, zoom * delta))
    
    setZoom(newZoom)
  }
  
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    
    svg.addEventListener('wheel', handleWheel, { passive: false })
    return () => svg.removeEventListener('wheel', handleWheel)
  }, [zoom])
  
  if (!knowledgeBase || knowledgeBase.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p>Enter clauses or a formula to generate resolution proof</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className={styles.container}>
      {/* Knowledge base panel */}
      <KnowledgeBasePanel knowledgeBase={knowledgeBase} />
      
      {/* SVG canvas */}
      <div className={styles.canvasArea}>
        <motion.svg
          ref={svgRef}
          className={styles.svg}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Render resolution steps */}
          <AnimatePresence>
            {stepPositions.map((pos, index) => (
              <ResolutionStep
                key={pos.step.id}
                step={pos.step}
                x={pos.x}
                y={pos.y}
                knowledgeBase={knowledgeBase}
              />
            ))}
          </AnimatePresence>
        </motion.svg>
        
        {/* Result badge */}
        {result && (
          <div className={styles.resultBadge}>
            <span className={styles.resultLabel}>Result:</span>
            <span className={`${styles.resultValue} ${styles[result]}`}>
              {result === 'contradiction' ? 'CONTRADICTION (Valid)' : 'SATISFIABLE (Invalid)'}
            </span>
          </div>
        )}
        
        {/* Zoom controls */}
        <div className={styles.zoomControls}>
          <button
            className={styles.zoomButton}
            onClick={() => setZoom(prev => Math.min(3, prev * 1.2))}
            title="Zoom in"
          >
            +
          </button>
          <span className={styles.zoomLevel}>{Math.round(zoom * 100)}%</span>
          <button
            className={styles.zoomButton}
            onClick={() => setZoom(prev => Math.max(0.1, prev / 1.2))}
            title="Zoom out"
          >
            −
          </button>
        </div>
      </div>
    </div>
  )
}
