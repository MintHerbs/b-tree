// ResolutionPage - Resolution method visualization tool
import { useState, useCallback } from 'react'
import { useAnimationPlayer } from '../../hooks/useAnimationPlayer'
import LogicInputPage from '../../components/logic/LogicInputPage'
import ResolutionCanvas from '../../components/logic/ResolutionCanvas'
import LogicStepControls from '../../components/logic/LogicStepControls'
import Starfield from '../../components/Starfield/Starfield'
import Navbar from '../../components/Navbar/Navbar'
import { runResolution } from '../../lib/logic/resolutionEngine'
import { parseFormula } from '../../lib/logic/formulaParser'
import styles from './ResolutionPage.module.css'

/**
 * Parses input string to extract premises and conclusion if "prove:" is present
 * Returns { clauses: string[], isProof: boolean }
 */
function parseInput(input) {
  const trimmed = input.trim()
  
  // Check if input contains "prove:"
  const proveMatch = trimmed.match(/^(.+?),?\s*prove:\s*(.+)$/i)
  
  if (proveMatch) {
    // Split premises by comma
    const premisesStr = proveMatch[1]
    const conclusionStr = proveMatch[2]
    
    // Parse premises
    const premises = premisesStr
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0)
    
    // Negate conclusion and add to clauses
    // Wrap conclusion in parentheses and negate
    const negatedConclusion = `¬(${conclusionStr.trim()})`
    
    return {
      clauses: [...premises, negatedConclusion],
      isProof: true
    }
  }
  
  // Otherwise, treat as comma-separated clause set
  const clauses = trimmed
    .split(',')
    .map(c => c.trim())
    .filter(c => c.length > 0)
  
  return {
    clauses,
    isProof: false
  }
}

export default function ResolutionPage({ onAIStateChange }) {
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  
  // Animation player for stepping through resolution steps
  const player = useAnimationPlayer(result?.steps || [])

  const handleAIStateChange = (state) => {
    if (typeof onAIStateChange !== 'function') return
    onAIStateChange(state)
  }

  const handleSubmit = useCallback((inputString) => {
    if (!inputString || inputString.trim().length === 0) {
      return
    }

    // Reset state
    setResult(null)
    setError(null)
    if (typeof onAIStateChange !== 'function') return
    onAIStateChange('thinking')

    try {
      // Parse input
      const { clauses, isProof } = parseInput(inputString)
      
      if (clauses.length === 0) {
        throw new Error('No clauses provided')
      }
      
      // Validate clauses by parsing them
      for (const clause of clauses) {
        try {
          parseFormula(clause)
        } catch (err) {
          throw new Error(`Invalid clause "${clause}": ${err.message}`)
        }
      }
      
      // Run resolution algorithm
      const resolutionResult = runResolution(clauses)
      
      setResult({
        ...resolutionResult,
        isProof
      })
      setError(null)
      
      // Set to idle after algorithm completes
      if (typeof onAIStateChange === 'function') {
        setTimeout(() => onAIStateChange('idle'), 500)
      }
    } catch (err) {
      setError(err.message || 'Failed to run resolution')
      setResult(null)
      if (typeof onAIStateChange === 'function') {
        onAIStateChange('idle')
      }
    }
  }, [onAIStateChange])

  const handleReset = () => {
    setResult(null)
    setError(null)
    if (typeof onAIStateChange === 'function') {
      onAIStateChange('idle')
    }
  }

  // If we have a result, show the canvas
  if (result) {
    return (
      <div className={styles.page}>
        <Starfield />
        <Navbar />
        
        <main className={styles.main}>
          {/* Canvas */}
          <div className={styles.canvasContainer}>
            <ResolutionCanvas
              knowledgeBase={result.knowledgeBase}
              steps={result.steps}
              result={result.result}
              currentStepIndex={player.currentStepIndex}
            />
          </div>

          {/* Step controls */}
          <LogicStepControls player={player} />

          {/* Back button */}
          <button
            className={styles.backButton}
            onClick={handleReset}
          >
            ← New Problem
          </button>
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
        title="Resolution Method"
        subtitle="Enter clauses or a formula with conclusion to prove using resolution"
        placeholder="(P→Q)∧(R→S)∧(¬Q∨¬S), prove: ¬(¬P∨¬R)"
        onSubmit={handleSubmit}
        onAIStateChange={handleAIStateChange}
      />
      
      {/* Help text */}
      <div className={styles.helpText}>
        <p className={styles.helpTitle}>Input Formats:</p>
        <ul className={styles.helpList}>
          <li>
            <strong>Proof mode:</strong> Enter premises, then "prove:" followed by conclusion
            <br />
            <code>P→Q, Q→R, prove: P→R</code>
          </li>
          <li>
            <strong>Clause mode:</strong> Enter comma-separated clauses
            <br />
            <code>P∨Q, ¬P∨R, ¬Q∨S</code>
          </li>
        </ul>
      </div>
    </div>
  )
}
