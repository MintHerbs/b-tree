// TableauxPage - Semantic tableaux visualization tool
import { useState, useCallback } from 'react'
import { useAnimationPlayer } from '../../hooks/useAnimationPlayer'
import LogicInputPage from '../../components/logic/LogicInputPage'
import TableauxCanvas from '../../components/logic/TableauxCanvas'
import RulesPanel from '../../components/logic/RulesPanel'
import LogicStepControls from '../../components/logic/LogicStepControls'
import Starfield from '../../components/Starfield/Starfield'
import Navbar from '../../components/Navbar/Navbar'
import { runTableaux } from '../../lib/logic/tableauxEngine'
import styles from './TableauxPage.module.css'

export default function TableauxPage({ onAIStateChange }) {
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState('satisfiability') // 'satisfiability' or 'validity'
  
  // Animation player for stepping through the tableau construction
  const player = useAnimationPlayer(result?.steps || [])

  const handleAIStateChange = (state) => {
    if (typeof onAIStateChange !== 'function') return
    onAIStateChange(state)
  }

  const handleSubmit = useCallback((formulaString) => {
    if (!formulaString || formulaString.trim().length === 0) {
      return
    }

    // Reset state
    setResult(null)
    setError(null)
    if (typeof onAIStateChange !== 'function') return
    onAIStateChange('thinking')

    try {
      // Run tableaux algorithm
      const tableauxResult = runTableaux(formulaString, mode)
      
      setResult(tableauxResult)
      setError(null)
      
      // Set to idle after algorithm completes
      if (typeof onAIStateChange === 'function') {
        setTimeout(() => onAIStateChange('idle'), 500)
      }
    } catch (err) {
      setError(err.message || 'Failed to generate tableau')
      setResult(null)
      if (typeof onAIStateChange === 'function') {
        onAIStateChange('idle')
      }
    }
  }, [mode, onAIStateChange])

  const handleModeChange = (e) => {
    setMode(e.target.value)
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    if (typeof onAIStateChange === 'function') {
      onAIStateChange('idle')
    }
  }

  // If we have a result, show the canvas
  if (result) {
    // Get current tree snapshot from animation player
    const currentTree = player.currentStep?.treeSnapshot || result.tree
    const highlightedNodeId = player.currentStep?.highlightNodeId || null

    return (
      <div className={styles.page}>
        <Starfield />
        <Navbar 
          showNewFormula={true}
          onNewFormula={handleReset}
        />
        
        <main className={styles.main}>
          {/* Canvas */}
          <div className={styles.canvasContainer}>
            <TableauxCanvas
              tree={currentTree}
              highlightedNodeId={highlightedNodeId}
            />
          </div>

          {/* Rules panel toggle button */}
          <RulesPanel />

          {/* Step controls */}
          <LogicStepControls player={player} />
        </main>
      </div>
    )
  }

  // If there's an error, show it
  if (error) {
    return (
      <div className={styles.page}>
        <Starfield />
        <Navbar />
        <main className={styles.main}>
          <div className={styles.errorContainer}>
            <h2 className={styles.errorTitle}>Error</h2>
            <p className={styles.errorMessage}>{error}</p>
            <button
              className={styles.backButton}
              onClick={handleReset}
            >
              ← Try Again
            </button>
          </div>
        </main>
      </div>
    )
  }

  // Otherwise show input page
  return (
    <div className={styles.inputWrapper}>
      <LogicInputPage
        title="Semantic Tableaux"
        subtitle="Enter a propositional logic formula to test satisfiability or validity"
        placeholder="¬(¬(P∧Q)↔(¬P∨¬Q))"
        onSubmit={handleSubmit}
        onAIStateChange={handleAIStateChange}
      />
      
      {/* Mode selector */}
      <div className={styles.modeSelector}>
        <label className={styles.modeLabel}>
          <input
            type="radio"
            name="mode"
            value="satisfiability"
            checked={mode === 'satisfiability'}
            onChange={handleModeChange}
            className={styles.modeRadio}
          />
          <span className={styles.modeText}>Test Satisfiability</span>
        </label>
        <label className={styles.modeLabel}>
          <input
            type="radio"
            name="mode"
            value="validity"
            checked={mode === 'validity'}
            onChange={handleModeChange}
            className={styles.modeRadio}
          />
          <span className={styles.modeText}>Test Validity</span>
        </label>
      </div>
    </div>
  )
}
