import { useState } from 'react'
import { Link } from 'react-router-dom'
import './lazy.css'

export default function Lazy() {
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
    <main className="lazyPage">
      <div className="lazyContent">
        <section className="lazyCard">
          <h1 className="lazyTitle">
            Minimum effort, maximum grades
          </h1>

          <section className="lazyInfoBox">
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

          <div className="lazyRows">
            {rows.map((row, index) => {
              const marks = parseFloat(row.marks)
              const weightage = parseFloat(row.weightage)

              return (
                <section key={index} className="lazyModuleCard">
                  <input
                    type="text"
                    placeholder="Module Name"
                    className="lazyInput"
                    value={row.moduleName}
                    onChange={e =>
                      handleChange(index, 'moduleName', e.target.value)
                    }
                  />

                  <input
                    type="number"
                    placeholder="Exam Weightage (if your exam is worth 60% of your grade, type 60)"
                    className="lazyInput"
                    value={row.weightage}
                    onChange={e =>
                      handleChange(index, 'weightage', e.target.value)
                    }
                  />

                  <input
                    type="number"
                    placeholder="Total Coursework Marks, e.g 30"
                    className="lazyInput"
                    value={row.marks}
                    onChange={e =>
                      handleChange(index, 'marks', e.target.value)
                    }
                  />

                  <div className="lazyGradeGrid">
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
                              ? 'lazyGradeBox lazyGradeImpossible'
                              : 'lazyGradeBox'
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
                </section>
              )
            })}
          </div>

          <div className="lazyAddWrapper">
            <button onClick={addRow} className="lazyAddButton">
              + Add Row
            </button>
          </div>

          <section className="lazyPrivacy">
            <h2>🔐 Privacy Notice</h2>
            <p>
              This app is fully static. Your data is never sent or stored anywhere — not even on your device! No info is collected, logged, or tracked. We respect your privacy.
            </p>
          </section>

          <p className="lazyCredit">
            Made with love ❤️ from CS 2023
          </p>
        </section>

        <div className="lazyBackWrapper">
          <Link to="/tree" className="lazyBackLink">
            ← Back
          </Link>
        </div>
      </div>
    </main>
  )
}