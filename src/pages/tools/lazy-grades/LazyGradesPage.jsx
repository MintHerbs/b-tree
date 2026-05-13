import { useState } from 'react'
import { motion } from 'motion/react'
import { colors } from '../../../constants/colors'
import styles from './LazyGradesPage.module.css'

export default function LazyGradesPage() {
  const [rows, setRows] = useState([
    { moduleName: '', weightage: '', marks: '' }
  ])

  const thresholds = {
    'A+': 80,
    A: 70,
    B: 60,
    C: 50,
    D: 40
  }

  const handleChange = (index, field, value) => {
    setRows(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: value
      }
      return updated
    })
  }

  const addRow = () => {
    setRows(prev => [
      ...prev,
      { moduleName: '', weightage: '', marks: '' }
    ])
  }

  const calculatePoints = (gradeTarget, marks, weightage) => {
    if (!weightage || weightage === 0 || marks === '') return ''

    const result =
      ((thresholds[gradeTarget] - marks) * 100) / weightage

    return result > 100 ? 'Impossible' : result.toFixed(2)
  }

  const isImpossible = (gradeTarget, marks, weightage) => {
    if (!weightage || weightage === 0 || marks === '') return false

    return (
      ((thresholds[gradeTarget] - marks) * 100) / weightage >
      100
    )
  }

  return (
    <main
      className={styles.lazyPage}
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
      <div className={styles.lazyContent}>
        <motion.section
          className={styles.lazyCard}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h1 className={styles.lazyTitle}>
            Minimum effort, maximum grades
          </h1>

          <section className={styles.lazyInfoBox}>
            <p>
              <strong>
                Coursework marks greatly affects the amount of effort you need to put in exams.
              </strong>
            </p>

            <p>
              Want an A? What's the minimum effort you gotta put to receive it - given you got 30% of your coursemark?
            </p>

            <p>
              Example: If the exam weightage of Algorithms and Complexities is 50%, and your coursework marks is 30 - you will see that you need <strong>at least</strong> a 80/100 on the exam paper to achieve an A.
            </p>

            <p>
              Module name is optional and is just for you to track multiple modules in 1 view.
            </p>
          </section>

          <div className={styles.lazyRows}>
            {rows.map((row, index) => {
              const marks = parseFloat(row.marks)
              const weightage = parseFloat(row.weightage)

              return (
                <motion.section
                  key={index}
                  className={styles.lazyModuleCard}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <input
                    type="text"
                    placeholder="Module Name"
                    className={styles.lazyInput}
                    value={row.moduleName}
                    onChange={e =>
                      handleChange(index, 'moduleName', e.target.value)
                    }
                  />

                  <input
                    type="number"
                    placeholder="Exam Weightage (if your exam is worth 60% of your grade, type 60)"
                    className={styles.lazyInput}
                    value={row.weightage}
                    onChange={e =>
                      handleChange(index, 'weightage', e.target.value)
                    }
                  />

                  <input
                    type="number"
                    placeholder="Total Coursework Marks, e.g 30"
                    className={styles.lazyInput}
                    value={row.marks}
                    onChange={e =>
                      handleChange(index, 'marks', e.target.value)
                    }
                  />

                  <div className={styles.lazyGradeGrid}>
                    {['A+', 'A', 'B', 'C', 'D'].map(grade => {
                      const impossible = isImpossible(
                        grade,
                        marks,
                        weightage
                      )

                      return (
                        <div
                          key={grade}
                          className={
                            impossible
                              ? `${styles.lazyGradeBox} ${styles.lazyGradeImpossible}`
                              : styles.lazyGradeBox
                          }
                          title={
                            impossible
                              ? 'Achieving this grade is not possible with your current marks and weightage.'
                              : ''
                          }
                        >
                          {grade}: {calculatePoints(grade, marks, weightage)}
                        </div>
                      )
                    })}
                  </div>
                </motion.section>
              )
            })}
          </div>

          <div className={styles.lazyAddWrapper}>
            <motion.button
              onClick={addRow}
              className={styles.lazyAddButton}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              + Add Row
            </motion.button>
          </div>

          <section className={styles.lazyPrivacy}>
            <h2>🔐 Privacy Notice</h2>
            <p>
              This app is fully static. Your data is never sent or stored anywhere — not even on your device! No info is collected, logged, or tracked. We respect your privacy.
            </p>
          </section>

          <p className={styles.lazyCredit}>
            Made with love ❤️ from CS 2023
          </p>
        </motion.section>
      </div>
    </main>
  )
}
