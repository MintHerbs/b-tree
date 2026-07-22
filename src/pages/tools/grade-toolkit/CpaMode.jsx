import { useState } from 'react'
import { motion } from 'motion/react'
import { gradeForMark, toneForMark } from './gradeScale'
import styles from './CpaMode.module.css'

// Credit weightings preserved from the original CPA calculator:
//   modules carry 12 credits, the final-year project carries 18,
//   and each year is scaled ×1 / ×3 / ×5.
const MODULE_CREDITS = 12
const PROJECT_CREDITS = 18

const YEARS = [
  { id: 'year1', label: 'Year 1', weight: 1 },
  { id: 'year2', label: 'Year 2', weight: 3 },
  { id: 'year3', label: 'Year 3', weight: 5, hasProject: true },
]

const newRow = () => ({ name: '', percentage: '' })

export default function CpaMode({ reduceMotion }) {
  const [rowsByYear, setRowsByYear] = useState({
    year1: [newRow()],
    year2: [newRow()],
    year3: [newRow()],
  })
  const [projectMark, setProjectMark] = useState('')

  const updateRow = (yearId, index, field, value) => {
    setRowsByYear(prev => {
      const rows = [...prev[yearId]]
      rows[index] = { ...rows[index], [field]: value }
      return { ...prev, [yearId]: rows }
    })
  }

  const addRow = yearId => {
    setRowsByYear(prev => ({ ...prev, [yearId]: [...prev[yearId], newRow()] }))
  }

  // Sum of (mark × credits × yearWeight) and the matching weighted-credit total.
  const tally = (rows, weight, includeProject) => {
    let score = 0
    let credits = 0

    if (includeProject) {
      const mark = parseFloat(projectMark)
      if (!Number.isNaN(mark)) {
        score += mark * PROJECT_CREDITS * weight
        credits += PROJECT_CREDITS * weight
      }
    }

    for (const row of rows) {
      const mark = parseFloat(row.percentage)
      if (Number.isNaN(mark)) continue
      score += mark * MODULE_CREDITS * weight
      credits += MODULE_CREDITS * weight
    }

    return { score, credits }
  }

  const perYear = YEARS.map(year => {
    const { score, credits } = tally(
      rowsByYear[year.id],
      year.weight,
      year.hasProject
    )
    const lpa = credits > 0 ? score / credits : 0
    return { ...year, score, credits, lpa }
  })

  const totalScore = perYear.reduce((acc, y) => acc + y.score, 0)
  const totalCredits = perYear.reduce((acc, y) => acc + y.credits, 0)
  const cpa = totalCredits > 0 ? totalScore / totalCredits : 0

  const renderSliderRow = (mark, onMark, tone) => (
    <div className={styles.sliderRow}>
      <input
        type="range"
        min="0"
        max="100"
        value={Number(mark) || 0}
        onChange={e => onMark(e.target.value)}
        className={`${styles.slider} ${styles[`slider_${tone}`]}`}
        aria-label="Mark percentage"
      />
      <div className={styles.markField}>
        <input
          type="number"
          min="0"
          max="100"
          inputMode="numeric"
          value={mark}
          placeholder="0"
          onChange={e => onMark(e.target.value)}
          className={styles.markInput}
        />
        <span className={styles.markSuffix}>%</span>
      </div>
      <span className={`${styles.gradeChip} ${styles[`chip_${tone}`]}`}>
        {gradeForMark(mark)}
      </span>
    </div>
  )

  return (
    <div className={styles.mode}>
      <p className={styles.supporting}>
        <strong>LPA</strong> is your performance for a single year;{' '}
        <strong>CPA</strong> is cumulative across all years (weighted ×1, ×3,
        ×5). Fill in every module for an accurate figure.
      </p>

      {YEARS.map((year, yi) => {
        const yearData = perYear[yi]
        return (
          <section key={year.id} className={styles.yearCard}>
            <div className={styles.yearHeader}>
              <div className={styles.yearTitleWrap}>
                <h2 className={styles.yearTitle}>{year.label}</h2>
                <span className={styles.yearWeight}>weight ×{year.weight}</span>
              </div>
              <div className={styles.chips}>
                <span className={styles.statChip}>
                  LPA <b>{yearData.lpa.toFixed(2)}</b>
                </span>
                <span className={`${styles.statChip} ${styles.statChipCpa}`}>
                  CPA <b>{cpa.toFixed(2)}</b>
                </span>
              </div>
            </div>

            {year.hasProject && (
              <div className={styles.field}>
                <label className={styles.fieldLabel}>
                  Final Year Project (worth {PROJECT_CREDITS} credits)
                </label>
                {renderSliderRow(
                  projectMark,
                  setProjectMark,
                  toneForMark(projectMark)
                )}
              </div>
            )}

            {rowsByYear[year.id].map((row, index) => (
              <motion.div
                key={index}
                className={styles.field}
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <input
                  type="text"
                  value={row.name}
                  placeholder="Module name (optional)"
                  onChange={e =>
                    updateRow(year.id, index, 'name', e.target.value)
                  }
                  className={styles.nameInput}
                />
                {renderSliderRow(
                  row.percentage,
                  value => updateRow(year.id, index, 'percentage', value),
                  toneForMark(row.percentage)
                )}
              </motion.div>
            ))}

            <motion.button
              type="button"
              onClick={() => addRow(year.id)}
              className={styles.addButton}
              whileHover={reduceMotion ? undefined : { y: -1 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              + Add module
            </motion.button>
          </section>
        )
      })}

      <div className={styles.summary}>
        <span className={styles.summaryLabel}>Projected CPA</span>
        <span className={styles.summaryValue}>{cpa.toFixed(2)}</span>
      </div>
    </div>
  )
}
