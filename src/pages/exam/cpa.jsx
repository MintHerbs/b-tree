import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function CPACalculatorPage() {
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

  const getGradeColor = percentage => {
    const value = Number(percentage) || 0

    if (value < 40) return 'text-red-400'
    if (value < 60) return 'text-yellow-300'
    return 'text-emerald-300'
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

  const renderYear = (label, year, setter, weight, extraRow = null) => {
    const lpa = computeLPA(year, weight, extraRow)

    return (
      <div className="bg-[#17172f]/95 p-4 rounded shadow mb-6 border-2 border-violet-400/40 border-dashed">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold flex-shrink-0 text-white">
            {label}
          </h2>

          <div className="flex gap-4 text-sm text-violet-200 font-semibold">
            <span className="bg-violet-500/20 border border-violet-400/30 px-3 py-1 rounded">
              LPA: {lpa}
            </span>
            <span className="bg-violet-500/20 border border-violet-400/30 px-3 py-1 rounded">
              CPA: {cpa}
            </span>
          </div>
        </div>

        {extraRow && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
            <input
              value="Final Year Project"
              disabled
              className="border border-white/10 p-2 rounded bg-white/10 text-white font-semibold"
            />

            <div className="flex flex-col">
              <input
                type="range"
                min="0"
                max="100"
                value={Number(extraRow.percentage) || 0}
                onChange={e => handleFinalProjectChange(e.target.value)}
                className="w-full accent-violet-500"
              />

              <span
                className={`text-sm text-center mt-1 font-medium ${getGradeColor(
                  extraRow.percentage
                )}`}
              >
                {getGradeLabel(extraRow.percentage)}
              </span>
            </div>
          </div>
        )}

        {year.map((mod, index) => (
          <div
            key={index}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3"
          >
            <input
              placeholder="Module Name"
              value={mod.name}
              onChange={e =>
                handleChange(setter, index, 'name', e.target.value)
              }
              className="border border-white/10 p-2 rounded bg-white/10 text-white placeholder:text-white/40"
            />

            <div className="flex flex-col">
              <input
                type="range"
                min="0"
                max="100"
                value={Number(mod.percentage) || 0}
                onChange={e =>
                  handleChange(setter, index, 'percentage', e.target.value)
                }
                className="w-full accent-violet-500"
              />

              <span
                className={`text-sm text-center mt-1 font-medium ${getGradeColor(
                  mod.percentage
                )}`}
              >
                {getGradeLabel(mod.percentage)}
              </span>
            </div>
          </div>
        ))}

        <button
          onClick={() => addRow(setter)}
          className="mt-2 px-4 py-1 bg-violet-600 text-white rounded hover:bg-violet-500"
        >
          + Add Module
        </button>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#171730] to-[#111827] text-white p-6 pb-24 lg:pl-28">
      <Link
        to="/tree"
        className="inline-block mb-4 text-sm text-violet-300 hover:text-violet-200 hover:underline font-medium"
      >
        ← Back
      </Link>

      <div className="max-w-4xl mx-auto">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-300 mb-2">
          More Tools
        </p>

        <h1 className="text-3xl font-bold mb-6 text-violet-200">
          CPA Calculator
        </h1>

        <div className="border-l-4 border-violet-400 bg-white/5 p-4 mb-6 sm:mb-8 rounded-md text-sm sm:text-base text-violet-50">
          <p className="mb-2 font-semibold">
            You know your marks and want to see what your future CPA may look like
          </p>
          <p className="mb-2">
            <strong>LPA</strong> can be considered to be your performance for that year only
          </p>
          <p>
            <strong>CPA</strong> is cumulative, meaning the previous year(s) CPAs will affect
            the current year you're in. As you continue to input your marks, your CPA across
            years will keep getting updated.
          </p>
          <p className="mb-2">
            Weightages for Year 1 is 1, Year 2 is 3, and Year 3 is 5.
          </p>
          <p>
            CPA calculation <strong>requires</strong> you to input all your modules' marks for
            highest accuracy.
          </p>
        </div>

        {renderYear('Year 1', year1, setYear1, 1)}
        {renderYear('Year 2', year2, setYear2, 3)}
        {renderYear('Year 3', year3, setYear3, 5, finalProject)}

        <div className="mt-8 bg-[#17172f]/95 border border-violet-400/30 p-4 rounded shadow">
          <p className="text-lg font-bold text-violet-200 mt-2">
            CPA: {cpa}
          </p>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/tree"
          className="inline-block text-sm text-violet-300 hover:text-violet-200 hover:underline font-medium"
        >
          ← Back
        </Link>
      </div>
    </main>
  )
}