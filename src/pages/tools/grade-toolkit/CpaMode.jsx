import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
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
  const [activeYear, setActiveYear] = useState('year1')

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

  const activeIndex = YEARS.findIndex(y => y.id === activeYear)
  const year = YEARS[activeIndex]
  const activeLpa = perYear[activeIndex].lpa

  const renderMarkRow = (mark, onMark, name, onName, isProject = false) => {
    const tone = toneForMark(mark)
    return (
      <div className={styles.row}>
        {isProject ? (
          <span className={styles.projectTag}>Final Year Project</span>
        ) : (
          <input
            type="text"
            value={name}
            placeholder="Module (optional)"
            onChange={e => onName(e.target.value)}
            className={styles.nameInput}
          />
        )}

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
  }

  return (
    <div className={styles.mode}>
      <p className={styles.hint}>
        <strong>LPA</strong> is one year; <strong>CPA</strong> is cumulative
        (years weighted&nbsp;×1&nbsp;/&nbsp;×3&nbsp;/&nbsp;×5). Fill in every
        module for accuracy.
      </p>

      {/* Year tabs - only the active year is shown, so the page stays short. */}
      <div className={styles.yearTabs} role="tablist" aria-label="Year">
        {YEARS.map(y => {
          const selected = y.id === activeYear
          return (
            <button
              key={y.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveYear(y.id)}
              className={`${styles.yearTab} ${selected ? styles.yearTabActive : ''}`}
            >
              {selected && !reduceMotion && (
                <motion.span
                  layoutId="yearTabIndicator"
                  className={styles.yearTabIndicator}
                  transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
                />
              )}
              <span className={styles.yearTabLabel}>
                {y.label} <em>×{y.weight}</em>
              </span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.section
          key={activeYear}
          className={styles.yearCard}
          initial={reduceMotion ? false : { opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, x: -8 }}
          transition={{ duration: 0.18 }}
        >
          {year.hasProject &&
            renderMarkRow(projectMark, setProjectMark, null, null, true)}

          {rowsByYear[year.id].map((row, index) => (
            <div key={index}>
              {renderMarkRow(
                row.percentage,
                value => updateRow(year.id, index, 'percentage', value),
                row.name,
                value => updateRow(year.id, index, 'name', value)
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={() => addRow(year.id)}
            className={styles.addButton}
          >
            + Add module
          </button>
        </motion.section>
      </AnimatePresence>

      <div className={styles.summary}>
        <div className={styles.summaryStat}>
          <span className={styles.summaryLabel}>{year.label} LPA</span>
          <span className={styles.summaryLpa}>{activeLpa.toFixed(2)}</span>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryStat}>
          <span className={styles.summaryLabel}>Projected CPA</span>
          <span className={styles.summaryValue}>{cpa.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
