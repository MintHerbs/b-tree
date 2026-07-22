import { useState } from 'react'
import { motion } from 'motion/react'
import { TARGET_GRADES, examMarkNeeded } from './gradeScale'
import styles from './MinMaxMode.module.css'

const newRow = () => ({ moduleName: '', weightage: '', marks: '' })

// Difficulty tone for a required exam mark — drives the colour of each result.
const neededTone = value => {
  if (value <= 60) return 'easy'
  if (value <= 85) return 'moderate'
  return 'hard'
}

function ResultCell({ result }) {
  switch (result.status) {
    case 'secured':
      return (
        <span className={`${styles.result} ${styles.result_secured}`}>
          Secured ✓
        </span>
      )
    case 'impossible':
      return (
        <span className={`${styles.result} ${styles.result_impossible}`}>
          Impossible
        </span>
      )
    case 'needed':
      return (
        <span
          className={`${styles.result} ${styles[`result_${neededTone(result.value)}`]}`}
        >
          {result.value}
          <small>/100</small>
        </span>
      )
    default:
      return <span className={`${styles.result} ${styles.result_empty}`}>—</span>
  }
}

export default function MinMaxMode({ reduceMotion }) {
  const [rows, setRows] = useState([newRow()])

  const updateRow = (index, field, value) => {
    setRows(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addRow = () => setRows(prev => [...prev, newRow()])

  return (
    <div className={styles.mode}>
      <p className={styles.supporting}>
        Enter an exam's weightage and the coursework marks you've already
        banked. Each cell is the <strong>minimum exam mark</strong> you'd need
        for that grade. Example: exam worth 50% with 30 coursework marks needs
        an <strong>80/100</strong> for an A.
      </p>

      <div className={styles.rows}>
        {rows.map((row, index) => {
          return (
            <motion.section
              key={index}
              className={styles.moduleCard}
              layout={!reduceMotion}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <input
                type="text"
                placeholder="Module name (optional)"
                className={styles.nameInput}
                value={row.moduleName}
                onChange={e => updateRow(index, 'moduleName', e.target.value)}
              />

              <div className={styles.inputPair}>
                <div className={styles.field}>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder=" "
                    className={styles.fieldInput}
                    value={row.weightage}
                    onChange={e => updateRow(index, 'weightage', e.target.value)}
                  />
                  <label className={styles.floatingLabel}>Exam weightage %</label>
                  <span className={styles.helper}>
                    e.g. exam is 60% of the grade → 60
                  </span>
                </div>

                <div className={styles.field}>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder=" "
                    className={styles.fieldInput}
                    value={row.marks}
                    onChange={e => updateRow(index, 'marks', e.target.value)}
                  />
                  <label className={styles.floatingLabel}>Coursework marks</label>
                  <span className={styles.helper}>points already banked, e.g. 30</span>
                </div>
              </div>

              <div className={styles.grades}>
                {TARGET_GRADES.map(grade => {
                  const result = examMarkNeeded(grade, row.marks, row.weightage)
                  return (
                    <div key={grade} className={styles.gradeCell}>
                      <span className={styles.gradeLetter}>{grade}</span>
                      <ResultCell result={result} />
                    </div>
                  )
                })}
              </div>
            </motion.section>
          )
        })}
      </div>

      <motion.button
        type="button"
        onClick={addRow}
        className={styles.addButton}
        whileHover={reduceMotion ? undefined : { y: -1 }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        transition={{ duration: 0.15 }}
      >
        + Add module
      </motion.button>
    </div>
  )
}
