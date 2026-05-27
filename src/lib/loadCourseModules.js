// Loads a course's module registry the way Sidebar.jsx does (a dynamic,
// per-course import of its modules.js) rather than a static import hardwired to
// one course. Returns [] for a missing/unselected course so callers can render
// an empty tree instead of crashing.
//
// Canonical export name is `MODULES` (uppercase); the `?? mod.modules` fallback
// only exists to tolerate any legacy lowercase files committed before the
// casing was standardised.
export async function loadCourseModules(courseId) {
  if (!courseId) return []

  try {
    const mod = await import(`../content/notes/${courseId}/modules.js`)
    return mod.MODULES ?? mod.modules ?? []
  } catch {
    return []
  }
}
