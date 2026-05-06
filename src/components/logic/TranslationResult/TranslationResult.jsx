// TranslationResult - Displays the English to Logic translation result
import { motion } from 'motion/react'
import styles from './TranslationResult.module.css'

export default function TranslationResult({ english, formal, breakdown }) {
  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* English sentence */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>English</h3>
        <p className={styles.englishText}>{english}</p>
      </div>

      {/* Formal logic translation */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Formal Logic</h3>
        <div className={styles.formalLogic}>{formal}</div>
      </div>

      {/* Symbol breakdown */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Symbol Breakdown</h3>
        <table className={styles.breakdownTable}>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((entry, index) => (
              <tr key={index}>
                <td className={styles.symbolCell}>{entry.symbol}</td>
                <td className={styles.meaningCell}>{entry.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
