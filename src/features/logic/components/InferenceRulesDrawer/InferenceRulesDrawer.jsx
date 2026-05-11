// InferenceRulesDrawer - Sliding drawer showing all inference rules
import { useEffect } from 'react'
import styles from './InferenceRulesDrawer.module.css'

const INFERENCE_RULES = [
  { name: 'Modus Ponens (M.P.)', pattern: 'P→Q, P ∴ Q' },
  { name: 'Modus Tollens (M.T.)', pattern: 'P→Q, ¬Q ∴ ¬P' },
  { name: 'Hypothetical Syllogism (H.S.)', pattern: 'P→Q, Q→R ∴ P→R' },
  { name: 'Disjunctive Syllogism (D.S.)', pattern: 'P∨Q, ¬P ∴ Q' },
  { name: 'Simplification (Simp.)', pattern: 'P∧Q ∴ P' },
  { name: 'Conjunction (Conj.)', pattern: 'P, Q ∴ P∧Q' },
  { name: 'Double Negation (D.N.)', pattern: '¬¬P ∴ P' },
  { name: 'Contrapositive', pattern: 'P→Q ∴ ¬Q→¬P' },
  { name: 'Biconditional Elim.', pattern: 'P↔Q ∴ P→Q, Q→P' },
  { name: 'Switcheroo', pattern: 'P→Q ∴ ¬P∨Q' }
]

export default function InferenceRulesDrawer({ isOpen, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])
  
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])
  
  if (!isOpen) return null
  
  return (
    <>
      {/* Overlay */}
      <div 
        className={styles.overlay}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={styles.drawer}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Inference Rules</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>
        
        {/* Rules list */}
        <div className={styles.content}>
          {INFERENCE_RULES.map((rule, index) => (
            <div key={index} className={styles.ruleRow}>
              <div className={styles.ruleName}>{rule.name}</div>
              <div className={styles.rulePattern}>{rule.pattern}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
