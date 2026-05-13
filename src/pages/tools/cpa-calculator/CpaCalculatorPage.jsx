import { useState } from 'react'
import { motion } from 'motion/react'
import { colors } from '../../../constants/colors'
import styles from './CpaCalculatorPage.module.css'

export default function CpaCalculatorPage() {
  const initRow = () => ({ name: '', percentage: '' })

  const [year1, setYear1] = useState([initRow()])
  const [year2, setYear2] = useState([initRow()])
  const [year3, setYear3] = useState([initRow()])
  const [finalProject, setFinalProject] = useState({
    name: 'Final Project',
    percentage: ''
  })

  const handleChange = (yearSetter, index, field, value) => {
    yearSetter(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleFinalProjectChange = value => {
    setFinalProject(prev => ({ ...prev, percentage: value }))
  }

  const addRow = yearSetter => {
    yearSetter(prev => [...prev, initRow()])
  }

  const getGradeLabel = percentage => {
    const value = Number(percentage) || 0

    if (value === 0) return `${value}%`
    if (value < 40) return `${value}%: F`
    if (value < 50) return `${value}%: D`
    if (value < 60) return `${value}%: C`
    if (value < 70) return `${value}%: B`
    if (value < 80) return `${value}%: A`
    return `${value}%: A+`
  }

  const getGradeClass = percentage => {
    const value = Number(percentage) || 0

    if (value < 40) return `${styles.cpaGrade} ${styles.cpaGradeFail}`
    if (value < 60) return `${styles.cpaGrade} ${styles.cpaGradeMid}`
    return `${styles.cpaGrade} ${styles.cpaGradeGood}`
  }

  const computeTotal = (rows, weight, extraRow = null) => {
    let total = 0

    if (extraRow) {
      const percent = parseFloat(extraRow.percentage)
      if (!Number.isNaN(percent)) total += percent * 18 * weight
    }

    total += rows.reduce((acc, row) => {
      const percent = parseFloat(row.percentage)
      if (Number.isNaN(percent)) return acc
      return acc + percent * 12 * weight
    }, 0)

    return total
  }

  const computeCredits = (rows, weight, extraRow = null) => {
    let credits = 0

    if (extraRow) {
      const percent = parseFloat(extraRow.percentage)
      if (!Number.isNaN(percent)) credits += 18 * weight
    }

    credits +=
      rows.filter(
        row =>
          row.percentage !== '' &&
          !Number.isNaN(parseFloat(row.percentage))
      ).length *
      12 *
      weight

    return credits
  }

  const totalScore =
    computeTotal(year1, 1) +
    computeTotal(year2, 3) +
    computeTotal(year3, 5, finalProject)

  const totalWeightedCredits =
    computeCredits(year1, 1) +
    computeCredits(year2, 3) +
    computeCredits(year3, 5, finalProject)

  const cpa =
    totalWeightedCredits > 0
      ? (totalScore / totalWeightedCredits).toFixed(2)
      : '0.00'

  const computeLPA = (rows, weight, extraRow = null) => {
    const total = computeTotal(rows, weight, extraRow)
    const credits = computeCredits(rows, weight, extraRow)

    return credits > 0 ? (total / credits).toFixed(2) : '0.00'
  }

  const renderMarkRow = (row, onNameChange, onPercentageChange, disabled = false) => (
    <div className={styles.cpaRow}>
      <input
        value={row.name}
        placeholder="Module Name"
        disabled={disabled}
        onChange={e => onNameChange?.(e.target.value)}
        className={styles.cpaInput}
      />

      <div className={styles.cpaSliderBlock}>
        <input
          type="range"
          min="0"
          max="100"
          value={Number(row.percentage) || 0}
          onChange={e => onPercentageChange(e.target.value)}
          className={styles.cpaSlider}
        />

        <span className={getGradeClass(row.percentage)}>
          {getGradeLabel(row.percentage)}
        </span>
      </div>
    </div>
  )

  const renderYear = (label, year, setter, weight, extraRow = null) => {
    const lpa = computeLPA(year, weight, extraRow)

    return (
      <section className={styles.cpaYearCard}>
        <div className={styles.cpaYearHeader}>
          <h2 className={styles.cpaYearTitle}>{label}</h2>

          <div className={styles.cpaBadges}>
            <span className={styles.cpaBadge}>LPA: {lpa}</span>
            <span className={styles.cpaBadge}>CPA: {cpa}</span>
          </div>
        </div>

        {extraRow &&
          renderMarkRow(
            { name: 'Final Year Project', percentage: extraRow.percentage },
            null,
            handleFinalProjectChange,
            true
          )}

        {year.map((mod, index) => (
          <div key={index}>
            {renderMarkRow(
              mod,
              value => handleChange(setter, index, 'name', value),
              value => handleChange(setter, index, 'percentage', value)
            )}
          </div>
        ))}

        <motion.button
          onClick={() => addRow(setter)}
          className={styles.cpaButton}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
        >
          + Add Module
        </motion.button>
      </section>
    )
  }

  return (
    <main
      className={styles.cpaPage}
      style={{
        '--tool-bg': colors.bg,
        '--tool-surface': colors.surface,
        '--tool-card': colors.card,
        '--tool-panel': colors.panel,
        '--tool-border': colors.border,
        '--tool-accent': colors.accent,
        '--tool-orange': colors.orange,
        '--tool-text': colors.text,
        '--tool-text-muted': colors.textMuted,
        '--tool-error': colors.error,
        '--tool-warning': colors.warning,
        '--tool-success': colors.success,
        position: 'relative',
        zIndex: 5,
        minHeight: '100vh',
        background: 'transparent'
      }}
    >
      <div className={styles.cpaContent}>
        <motion.section
          className={styles.cpaCard}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >

          <h1 className={styles.cpaTitle}>CPA Calculator</h1>

          <section className={styles.cpaInfoBox}>
          <p>
            <strong>You know your marks and want to see what your future CPA may look like</strong>
          </p>

          <p>
            <strong>LPA</strong> can be considered to be your performance for that year only
          </p>

          <p>
            <strong>CPA</strong> is cumulative, meaning the previous year(s) CPAs will affect
            the current year you're in. As you continue to input your marks, your CPA across
            years will keep getting updated.
          </p>

          <p>
            Weightages for Year 1 is 1, Year 2 is 3, and Year 3 is 5.
          </p>

          <p>
            CPA calculation <strong>requires</strong> you to input all your modules' marks for
            highest accuracy.
          </p>
        </section>

        {renderYear('Year 1', year1, setYear1, 1)}
        {renderYear('Year 2', year2, setYear2, 3)}
        {renderYear('Year 3', year3, setYear3, 5, finalProject)}

        <section className={styles.cpaFinalBox}>
          <p className={styles.cpaFinalText}>
            <span>CPA:</span> {cpa}
          </p>
        </section>
        </motion.section>
      </div>
    </main>
  )
}
