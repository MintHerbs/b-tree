import { useState } from 'react'

function Lazy() {
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
      updated[index][field] = value
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
    if (!weightage || marks === '') return ''

    const result =
      ((thresholds[gradeTarget] - marks) * 100) /
      weightage

    return result > 100
      ? 'Impossible'
      : result.toFixed(2)
  }

  const isImpossible = (
    gradeTarget,
    marks,
    weightage
  ) => {
    if (!weightage || marks === '') return false

    return (
      ((thresholds[gradeTarget] - marks) * 100) /
        weightage >
      100
    )
  }

  return (
    <main className="min-h-screen bg-[#0f0f23] text-white px-4 py-20 sm:px-8 lg:pl-28 lg:pr-8">
      <div className="max-w-5xl mx-auto rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:p-8 shadow-2xl">

        <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-300">
          More Tools
        </p>

        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold">
          Minimum effort, maximum grades
        </h1>

        <div className="mt-6 rounded-2xl border-l-4 border-indigo-400 bg-indigo-950/40 p-4 text-sm sm:text-base text-indigo-50">
          <p className="mb-2 font-semibold">
            Coursework marks greatly affect the amount of effort you need to put into exams.
          </p>

          <p>
            This calculates the minimum exam marks required for your target grade.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {rows.map((row, index) => (
            <section
              key={index}
              className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-lg"
            >
              <div className="grid gap-3">
                <input
                  type="text"
                  placeholder="Module Name"
                  className="w-full rounded-xl border border-white/10 bg-white/10 p-3"
                  value={row.moduleName}
                  onChange={(e) =>
                    handleChange(
                      index,
                      'moduleName',
                      e.target.value
                    )
                  }
                />

                <input
                  type="number"
                  placeholder="Exam Weightage"
                  className="w-full rounded-xl border border-white/10 bg-white/10 p-3"
                  value={row.weightage}
                  onChange={(e) =>
                    handleChange(
                      index,
                      'weightage',
                      e.target.value
                    )
                  }
                />

                <input
                  type="number"
                  placeholder="Coursework Marks"
                  className="w-full rounded-xl border border-white/10 bg-white/10 p-3"
                  value={row.marks}
                  onChange={(e) =>
                    handleChange(
                      index,
                      'marks',
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {['A+', 'A', 'B', 'C', 'D'].map(
                  (grade) => {
                    const impossible =
                      isImpossible(
                        grade,
                        parseFloat(row.marks),
                        parseFloat(row.weightage)
                      )

                    return (
                      <div
                        key={grade}
                        className={`rounded-xl p-3 text-center font-semibold ${
                          impossible
                            ? 'bg-red-500 text-white'
                            : 'bg-white text-indigo-700'
                        }`}
                      >
                        {grade}:{' '}
                        {calculatePoints(
                          grade,
                          parseFloat(row.marks),
                          parseFloat(row.weightage)
                        )}
                      </div>
                    )
                  }
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={addRow}
            className="rounded-2xl bg-indigo-600 px-6 py-3 font-bold"
          >
            + Add Row
          </button>
        </div>
      </div>
    </main>
  )
}

export default Lazy