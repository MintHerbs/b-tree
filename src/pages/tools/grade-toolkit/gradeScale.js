// Grade Toolkit — single source of truth for the grade scale.
//
// Both modes (My CPA, Min effort max result) previously defined this scale
// separately: the CPA page hard-coded the F/D/C/B/A/A+ bands inside
// getGradeLabel, and the lazy-grades page kept a parallel `thresholds` map.
// They are the same scale, so it lives here once.

// Ordered high → low so gradeForMark can return the first band a mark clears.
export const GRADE_BANDS = [
  { grade: 'A+', min: 80 },
  { grade: 'A', min: 70 },
  { grade: 'B', min: 60 },
  { grade: 'C', min: 50 },
  { grade: 'D', min: 40 },
  { grade: 'F', min: 0 },
]

// Grades a student would realistically plan a target toward (F is not a goal).
export const TARGET_GRADES = ['A+', 'A', 'B', 'C', 'D']

// Minimum overall mark (out of 100) that earns a given grade.
export function gradeThreshold(grade) {
  return GRADE_BANDS.find(band => band.grade === grade)?.min ?? 0
}

// The letter grade a numeric mark maps to.
export function gradeForMark(mark) {
  const value = Number(mark) || 0
  return GRADE_BANDS.find(band => value >= band.min)?.grade ?? 'F'
}

// Coarse tone bucket used for colour-coding across both modes.
//   fail  → below a pass (< 40)
//   mid   → a pass but not strong (40–59)
//   good  → strong (≥ 60)
export function toneForMark(mark) {
  const value = Number(mark) || 0
  if (value < 40) return 'fail'
  if (value < 60) return 'mid'
  return 'good'
}

// "Min effort, max result": the minimum exam mark (out of 100) needed to reach
// `targetGrade`, given coursework points already banked (out of 100 total) and
// the exam's weightage as a percentage of the final grade.
//
// Returns a tagged result so the UI can render feasibility without re-deriving:
//   { status: 'secured'    }                 coursework alone already clears it
//   { status: 'impossible' }                 even 100% on the exam falls short
//   { status: 'needed', value: <0..100> }    minimum exam mark required
//   { status: 'incomplete' }                 not enough input yet
export function examMarkNeeded(targetGrade, courseworkMark, examWeightage) {
  const coursework = parseFloat(courseworkMark)
  const weightage = parseFloat(examWeightage)

  if (
    Number.isNaN(coursework) ||
    Number.isNaN(weightage) ||
    weightage <= 0
  ) {
    return { status: 'incomplete' }
  }

  const needed =
    ((gradeThreshold(targetGrade) - coursework) * 100) / weightage

  if (needed <= 0) return { status: 'secured' }
  if (needed > 100) return { status: 'impossible' }
  return { status: 'needed', value: Number(needed.toFixed(2)) }
}
