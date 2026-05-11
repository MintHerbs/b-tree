/**
 * RecurrenceSubstitutionView - LaTeX formula display for substitution method
 * Displays a scrollable list of substitution steps with KaTeX rendering
 */
import katex from 'katex'
import 'katex/dist/katex.min.css'
import styles from './RecurrenceSubstitutionView.module.css'

function RecurrenceSubstitutionView({ formulas }) {
  if (!formulas || formulas.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>No formulas to display</div>
      </div>
    )
  }

  const renderFormula = (item, index) => {
    let html
    try {
      html = katex.renderToString(item.latex, {
        throwOnError: false,
        displayMode: true,
      })
    } catch (err) {
      // Fallback to raw text on error
      html = `<span>${item.latex}</span>`
    }

    // Add divider after every 2-3 formulas for visual grouping
    const showDivider = (index + 1) % 3 === 0 && index < formulas.length - 1

    return (
      <div key={index}>
        <div className={styles.formulaRow}>
          {item.label && (
            <div className={styles.label}>{item.label}</div>
          )}
          <div
            className={styles.formula}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
        {showDivider && <div className={styles.divider} />}
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.formulaList}>
        {formulas.map((item, index) => renderFormula(item, index))}
      </div>
    </div>
  )
}

export default RecurrenceSubstitutionView
