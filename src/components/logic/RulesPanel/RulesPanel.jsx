// RulesPanel - Collapsible reference panel for tableau rules
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import styles from './RulesPanel.module.css'

export default function RulesPanel() {
  const [isOpen, setIsOpen] = useState(false)

  const togglePanel = () => setIsOpen(prev => !prev)

  return (
    <>
      {/* Toggle button - fixed in top-right */}
      <button
        className={styles.toggleButton}
        onClick={togglePanel}
        title="Show/hide rules reference"
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
                <h2 className={styles.title}>Tableau Rules Reference</h2>
                <button
                  className={styles.closeButton}
                  onClick={togglePanel}
                  title="Close"
                >
                  ×
                </button>
              </div>

              <div className={styles.content}>
                {/* Alpha Rules Section */}
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>α-Rules (Single Branch)</h3>
                  <p className={styles.sectionDescription}>
                    These rules add formulas sequentially to the same branch.
                  </p>
                  <table className={styles.rulesTable}>
                    <thead>
                      <tr>
                        <th>Formula</th>
                        <th>Produces</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className={styles.formulaCell}>¬¬A</td>
                        <td className={styles.resultCell}>A</td>
                      </tr>
                      <tr>
                        <td className={styles.formulaCell}>A∧B</td>
                        <td className={styles.resultCell}>A, B</td>
                      </tr>
                      <tr>
                        <td className={styles.formulaCell}>¬(A∨B)</td>
                        <td className={styles.resultCell}>¬A, ¬B</td>
                      </tr>
                      <tr>
                        <td className={styles.formulaCell}>¬(A→B)</td>
                        <td className={styles.resultCell}>A, ¬B</td>
                      </tr>
                    </tbody>
                  </table>
                </section>

                {/* Beta Rules Section */}
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>β-Rules (Branch Split)</h3>
                  <p className={styles.sectionDescription}>
                    These rules create two branches from the split point.
                  </p>
                  <table className={styles.rulesTable}>
                    <thead>
                      <tr>
                        <th>Formula</th>
                        <th>Left Branch</th>
                        <th>Right Branch</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className={styles.formulaCell}>A∨B</td>
                        <td className={styles.resultCell}>A</td>
                        <td className={styles.resultCell}>B</td>
                      </tr>
                      <tr>
                        <td className={styles.formulaCell}>¬(A∧B)</td>
                        <td className={styles.resultCell}>¬A</td>
                        <td className={styles.resultCell}>¬B</td>
                      </tr>
                      <tr>
                        <td className={styles.formulaCell}>A→B</td>
                        <td className={styles.resultCell}>¬A</td>
                        <td className={styles.resultCell}>B</td>
                      </tr>
                      <tr>
                        <td className={styles.formulaCell}>A↔B</td>
                        <td className={styles.resultCell}>A, B</td>
                        <td className={styles.resultCell}>¬A, ¬B</td>
                      </tr>
                      <tr>
                        <td className={styles.formulaCell}>¬(A↔B)</td>
                        <td className={styles.resultCell}>¬A, B</td>
                        <td className={styles.resultCell}>A, ¬B</td>
                      </tr>
                    </tbody>
                  </table>
                </section>

                {/* Branch Closure */}
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>Branch Closure</h3>
                  <p className={styles.sectionDescription}>
                    A branch closes (✗) when it contains both A and ¬A for some atom A.
                    A branch is open (○) when all formulas are expanded and no contradiction exists.
                  </p>
                </section>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
