// LogicRulesPanel - Collapsible reference panel for inference rules
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import styles from './LogicRulesPanel.module.css'

export default function LogicRulesPanel() {
  const [isOpen, setIsOpen] = useState(false)

  const togglePanel = () => setIsOpen(prev => !prev)

  const rules = [
    {
      name: 'Modus Ponens',
      abbr: 'M.P.',
      pattern: 'P→Q, P',
      conclusion: 'Q'
    },
    {
      name: 'Modus Tollens',
      abbr: 'M.T.',
      pattern: 'P→Q, ¬Q',
      conclusion: '¬P'
    },
    {
      name: 'Hypothetical Syllogism',
      abbr: 'H.S.',
      pattern: 'P→Q, Q→R',
      conclusion: 'P→R'
    },
    {
      name: 'Disjunctive Syllogism',
      abbr: 'D.S.',
      pattern: 'P∨Q, ¬P',
      conclusion: 'Q'
    },
    {
      name: 'Addition',
      abbr: 'Add.',
      pattern: 'P',
      conclusion: 'P∨Q'
    },
    {
      name: 'Conjunction',
      abbr: 'Conj.',
      pattern: 'P, Q',
      conclusion: 'P∧Q'
    },
    {
      name: 'Simplification',
      abbr: 'Simp.',
      pattern: 'P∧Q',
      conclusion: 'P (or Q)'
    },
    {
      name: 'Switcheroo',
      abbr: 'Switch',
      pattern: 'P∨Q',
      conclusion: 'Q∨P'
    },
    {
      name: 'Assumption',
      abbr: 'Assump.',
      pattern: '—',
      conclusion: 'P (assumed)'
    },
    {
      name: 'Contrapositive',
      abbr: 'Contra.',
      pattern: 'P→Q',
      conclusion: '¬Q→¬P'
    },
    {
      name: 'Biconditional',
      abbr: 'Bicond.',
      pattern: 'P↔Q',
      conclusion: 'P→Q, Q→P'
    }
  ]

  return (
    <>
      {/* Toggle button - fixed in top-right */}
      <button
        className={styles.toggleButton}
        onClick={togglePanel}
        title="Show/hide inference rules"
      >
        ?
      </button>

      {/* Panel - slides in from right */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={togglePanel}
            />

            {/* Panel */}
            <motion.div
              className={styles.panel}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className={styles.header}>
                <h2 className={styles.title}>Inference Rules Reference</h2>
                <button
                  className={styles.closeButton}
                  onClick={togglePanel}
                  title="Close"
                >
                  ×
                </button>
              </div>

              <div className={styles.content}>
                <p className={styles.description}>
                  These are the inference rules used to derive conclusions from premises.
                </p>

                <table className={styles.rulesTable}>
                  <thead>
                    <tr>
                      <th>Rule</th>
                      <th>Pattern</th>
                      <th>Derives</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule, index) => (
                      <tr key={index}>
                        <td className={styles.nameCell}>
                          <span className={styles.ruleName}>{rule.name}</span>
                          <span className={styles.ruleAbbr}>({rule.abbr})</span>
                        </td>
                        <td className={styles.patternCell}>{rule.pattern}</td>
                        <td className={styles.conclusionCell}>{rule.conclusion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className={styles.note}>
                  <strong>Note:</strong> P, Q, R represent any propositional formulas.
                  The symbol ∴ means "therefore".
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
