// ProofTreeCanvas - Handwritten notebook style proof tree renderer
import { useRef, useEffect, useState, useMemo } from 'react'
import { motion } from 'motion/react'
import styles from './ProofTreeCanvas.module.css'

const LEVEL_HEIGHT = 80
const HORIZONTAL_SPACING = 160

/**
 * Calculates layout positions for proof steps
 * Premises at top, tree grows downward
 */
function calculateLayout(steps, viewportWidth = 1000) {
  const positions = new Map()
  const levels = new Map() // level -> array of step ids
  
  // Separate premises from derived steps
  const premises = steps.filter(s => s.isPremise)
  const derived = steps.filter(s => !s.isPremise)
  
  // Position premises horizontally at top
  const premiseSpacing = Math.min(HORIZONTAL_SPACING, (viewportWidth - 200) / Math.max(premises.length, 1))
  const premisesWidth = (premises.length - 1) * premiseSpacing
  const premisesStartX = (viewportWidth - premisesWidth) / 2
  
  premises.forEach((step, index) => {
    positions.set(step.id, {
      x: premisesStartX + index * premiseSpacing,
      y: 50,
      level: 0
    })
  })
  
  // Position derived steps level by level
  let currentLevel = 1
  const positioned = new Set(premises.map(p => p.id))
  
  while (positioned.size < steps.length) {
    const levelSteps = derived.filter(step => {
      // A step can be positioned if all its dependencies are positioned
      return !positioned.has(step.id) && 
             step.fromIds.every(id => positioned.has(id))
    })
    
    if (levelSteps.length === 0) break // No more steps can be positioned
    
    // Position steps in this level
    levelSteps.forEach((step, index) => {
      // Calculate x position based on parent positions
      let parentX = 0
      let parentCount = 0
      
      step.fromIds.forEach(fromId => {
        const parentPos = positions.get(fromId)
        if (parentPos) {
          parentX += parentPos.x
          parentCount++
        }
      })
      
      const x = parentCount > 0 ? parentX / parentCount : viewportWidth / 2
      const y = 50 + currentLevel * LEVEL_HEIGHT
      
      positions.set(step.id, { x, y, level: currentLevel })
      positioned.add(step.id)
    })
    
    currentLevel++
  }
  
  // Calculate bounds
  let minX = Infinity
  let maxX = -Infinity
  let maxY = 0
  
  positions.forEach(pos => {
    minX = Math.min(minX, pos.x)
    maxX = Math.max(maxX, pos.x)
    maxY = Math.max(maxY, pos.y)
  })
  
  return {
    positions,
    totalWidth: maxX - minX + 200,
    totalHeight: maxY + 100
  }
}

/**
 * Renders V-shaped branches connecting parent formulas to derived formula
 */
function VBranches({ steps, positions }) {
  const branches = []
  
  steps.forEach(step => {
    if (step.isPremise || step.fromIds.length === 0) return
    
    const targetPos = positions.get(step.id)
    if (!targetPos) return
    
    // Get parent positions
    const parentPositions = step.fromIds
      .map(id => ({ id, pos: positions.get(id) }))
      .filter(p => p.pos)
    
    if (parentPositions.length === 0) return
    
    if (parentPositions.length === 1) {
      // Single parent - draw vertical line
      const parentPos = parentPositions[0].pos
      branches.push({
        type: 'vertical',
        x1: parentPos.x,
        y1: parentPos.y + 20,
        x2: targetPos.x,
        y2: targetPos.y - 10,
        rule: step.rule,
        ruleX: parentPos.x - 30,
        ruleY: (parentPos.y + targetPos.y) / 2
      })
    } else {
      // Multiple parents - draw V-shape
      const junctionY = targetPos.y - 20
      
      parentPositions.forEach(parent => {
        branches.push({
          type: 'diagonal',
          x1: parent.pos.x,
          y1: parent.pos.y + 20,
          x2: targetPos.x,
          y2: junctionY,
          rule: step.rule,
          ruleX: targetPos.x - 40,
          ruleY: junctionY - 5
        })
      })
    }
  })
  
  return (
    <g>
      {branches.map((branch, index) => {
        const isVertical = branch.type === 'vertical'
        const strokeColor = isVertical ? '#fff' : '#22c55e'
        const strokeWidth = isVertical ? 1 : 1.5
        
        return (
          <g key={index}>
            <line
              x1={branch.x1}
              y1={branch.y1}
              x2={branch.x2}
              y2={branch.y2}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Rule label - only show once per derivation */}
            {index === branches.findIndex(b => b.rule === branch.rule && b.ruleX === branch.ruleX) && (
              <text
                x={branch.ruleX}
                y={branch.ruleY}
                className={styles.ruleLabel}
                textAnchor="end"
              >
                {branch.rule}
              </text>
            )}
          </g>
        )
      })}
    </g>
  )
}

/**
 * Renders formula text nodes
 */
function FormulaNodes({ steps, positions, conclusionId }) {
  return (
    <g>
      {steps.map(step => {
        const pos = positions.get(step.id)
        if (!pos) return null
        
        const isConclusion = step.id === conclusionId
        const className = isConclusion ? styles.conclusionText : styles.formulaText
        
        return (
          <text
            key={step.id}
            x={pos.x}
            y={pos.y}
            className={className}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {step.formula}
          </text>
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
  
  // Calculate layout - memoized
  const layout = useMemo(() => {
    return steps && steps.length > 0 ? calculateLayout(steps, dimensions.width) : null
  }, [steps, dimensions.width])
  
  // Reset pan when steps change
  useEffect(() => {
    if (steps && steps.length > 0) {
      setPanOffset({ x: 0, y: 0 })
    }
  }, [steps])
  
  // Pan handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return
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
        {layout && (
          <>
            <VBranches steps={steps} positions={layout.positions} />
            <FormulaNodes 
              steps={steps} 
              positions={layout.positions}
              conclusionId={conclusionId}
            />
          </>
        )}
      </motion.svg>
    </div>
  )
}
