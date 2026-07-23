/**
 * Sidebar registry — single source of truth for what the sidebar shows.
 *
 * To add new items:
 *
 *   • Tool inside an existing module — append to that module's `tools[]`.
 *   • Note inside an existing module — append to that module's `notes[]`.
 *     The file must live at `src/content/notes/<module-id>/<filename>`;
 *     the URL is derived as `/notes/<module-id>/<filename>`.
 *   • Whole new module — append an object to MODULES. Minimum is
 *     `{ id, label, Icon }`. Without tools or notes it renders as a
 *     greyed "coming soon" icon.
 *   • Standalone tool (below the divider) — append to STANDALONE_TOOLS.
 *
 * Conventions:
 *   • `id`      kebab-case identifier — used in URLs and as React keys.
 *   • `Icon`    React component (PascalCase) from @phosphor-icons/react.
 *   • `route`   must exist in src/routes/index.jsx; clicking navigates here.
 *   • `label`   user-facing string. The ".js" suffix on tools matches the
 *               expanded sidebar's "file tree" visual metaphor.
 *
 * Routing: a module is "active" when the current pathname's first segment
 * matches any of its tools' first segments (e.g. `/algo/anything` activates
 * the module whose tool route starts with `/algo`). Notes addressed under
 * `/notes/<module-id>/...` also activate that module.
 */

import {
  Brain,
  BookOpen,
  BracketsCurly,
  Bug,
  Calculator,
  ChartLineUp,
  Circuitry,
  Cloud,
  Code,
  Cpu,
  Cube,
  Database,
  Eye,
  FileCode,
  FileJs,
  Flask,
  Function as FunctionIcon,
  Gear,
  GitBranch,
  Globe,
  Graph,
  HardDrive,
  Laptop,
  Network,
  Robot,
  ShieldCheck,
  Terminal,
  TerminalWindow,
  TreeStructure,
  WifiHigh,
  Wrench,
  Atom,
} from '@phosphor-icons/react'

// ── Modules ─────────────────────────────────────────────────────────────────

export const MODULES = [
  {
    id: 'algorithms',
    label: 'Algorithms',
    Icon: ChartLineUp,
    tools: [
      { id: 'complexity', label: 'Code Complexity.js',     route: '/algo/code-complexity' },
      { id: 'recurrence', label: 'Recurrence Relation.js', route: '/algo/recurrence-relation' },
    ],
  },
  {
    id: 'artificial-intelligence',
    label: 'Artificial Intelligence',
    Icon: Brain,
    tools: [
      { id: 'truth-tree',        label: 'Truth Tree.js',        route: '/logic/truth-tree' },
      { id: 'semantic-tableaux', label: 'Semantic Tableaux.js', route: '/logic/semantic-tableaux' },
    ],
  },
  {
    id: 'database',
    label: 'Database',
    Icon: Database,
    notes: [
      { filename: 'getting-started.md', label: 'getting-started.md' },
          { filename: 'notes/img-push', label: 'img-push.md' },
    ],
    tools: [
      { id: 'btree', label: 'B+ Tree.js',        route: '/tree' },
      { id: 'erd',   label: 'ERD Visualizer.js', route: '/erd' },
    ],
  },

  // Coming soon — declare with just { id, label, Icon }. Add `tools` to activate.
  {
    id: 'math',
    label: 'Computational Math',
    Icon: FunctionIcon,
    subfolders: ['notes • sem 2'],
    notes: [
      { filename: 'notes • sem 1/determinant',               label: 'determinant.md' },
      { filename: 'notes • sem 1/cofactor',                  label: 'cofactor.md' },
      { filename: 'notes • sem 1/types-of-matrices',         label: 'types-of-matrices.md' },
      { filename: 'notes • sem 1/properties-of-determinants',label: 'properties-of-determinants.md' },
      { filename: 'notes • sem 1/simultaneous-equations',    label: 'simultaneous-equations.md' },
      { filename: 'notes • sem 1/inverse',                   label: 'inverse.md' },
      { filename: 'notes • sem 1/cramers-rule',              label: 'cramers-rule.md' },
      { filename: 'notes • sem 1/gauss-elimination',         label: 'gauss-elimination.md' },
      { filename: 'notes • sem 1/lu-decomposition',          label: 'lu-decomposition.md' },
      { filename: 'notes • sem 1/echelon-form',              label: 'echelon-form.md' },
      { filename: 'notes • sem 1/rank',                      label: 'rank.md' },
      { filename: 'notes • sem 1/system-of-linear-equations',label: 'system-of-linear-equations.md' },
      { filename: 'notes • sem 1/homogeneous-equations',     label: 'homogeneous-equations.md' },
      { filename: 'notes • sem 1/eigenvalues',               label: 'eigenvalues.md' },
      { filename: 'notes • sem 1/gauss-jacobi',              label: 'gauss-jacobi.md' },
      { filename: 'notes • sem 1/gauss-seidel',              label: 'gauss-seidel.md' },
    ],
  },
  { id: 'computer-architecture', label: 'Computer Architecture', Icon: Cpu, notes: [
    { filename: 'notes/lecture-1-binary-numbers', label: 'lecture-1-binary-numbers.md' 
    notes: [
      { filename: 'notes/lecture-2-floating-point-numbers', label: 'lecture-2-floating-point-numbers.md' },
          { filename: 'notes/lecture-3-boolean-algebra', label: 'lecture-3-boolean-algebra.md' },
    ],
  },
  ] },
  { id: 'computer-networking',   label: 'Computer Networking',   Icon: Network },
  { id: 'computer-security',     label: 'Computer Security',     Icon: ShieldCheck },
  { id: 'computer-vision',       label: 'Computer Vision',       Icon: Eye },
  {
    id: 'operating-systems',
    label: 'Operating Systems',
    Icon: HardDrive,
    notes: [
      { filename: 'notes/process-threads', label: 'process-threads.md' },
    ],
  },
  {
    id: 'notes',
    label: 'Notes',
    Icon: BookOpen,
    notes: [
      { filename: 'notes/process-threads', label: 'process-threads.md' },
    ],
  },
  {
    id: 'labs',
    label: 'Labs',
    Icon: Flask,
    notes: [
      { filename: 'Labs/C Programming/introduction',                label: 'introduction.md' },
      { filename: 'Labs/C Programming/c-fundamentals',              label: 'c-fundamentals.md' },
      { filename: 'Labs/C Programming/the-quadratic-equation-question', label: 'the-quadratic-equation-question.md' },
      { filename: 'Labs/C Programming/system-calls-part-1',         label: 'system-calls-part-1.md' },
      { filename: 'Labs/C Programming/file-io-system-calls',        label: 'file-io-system-calls.md' },
      { filename: 'Labs/C Programming/pipes',                       label: 'pipes.md' },
      { filename: 'Labs/C Programming/process-creation-with-fork',  label: 'process-creation-with-fork.md' },
      { filename: 'Labs/C Programming/signals',                     label: 'signals.md' },
      { filename: 'Labs/C Programming/threads-and-mutex-locks',     label: 'threads-and-mutex-locks.md' },
      { filename: 'Labs/C Programming/directory-operations',        label: 'directory-operations.md' },
          { filename: 'notes/test-note', label: 'test-note.md' },
          { filename: 'notes/processes-threads', label: 'processes-threads.md' },
    ],
  },
  { id: 'programming',           label: 'Programming',           Icon: TerminalWindow },
  { id: 'software-engineering',  label: 'Software Engineering',  Icon: Code },
  {
    id: 'experimental',
    label: 'experimental',
    Icon: Atom,
    notes: [
          { filename: 'notes/test-file', label: 'test-file.md' },
    ],
    tools: [
    ],
  },
]

// ── Standalone tools (below the divider) ────────────────────────────────────

export const STANDALONE_TOOLS = [
  {id: 'Home', label: 'homePage.js', Icon: FileJs, route: '/home' },
  { id: 'grades', label: 'Grade Toolkit.js', Icon: Calculator, route: '/tools/grade-toolkit' },
]

// ── Easter-egg pinned at the divider ────────────────────────────────────────

export const PACKAGE_JSON = { id: 'package-json', label: 'package.json', Icon: FileCode }

// ── Breadcrumb abbreviations ────────────────────────────────────────────────

export const MODULE_ABBREV = {
  'home':                    'home',
  'computer-science':        'CS',        // root label
  'algorithms':              'Algo',
  'artificial-intelligence': 'AI',
  'database':                'DB',
  'math':                    'Math',
  'computer-architecture':   'CA',
  'computer-networking':     'CN',
  'computer-security':       'CompSec',
  'computer-vision':         'CV',
  'operating-systems':       'OS',
  'programming':             'Prog',
  'software-engineering':    'SEPM',
  'miscellaneous':           'Misc',
  'notes':                   'notes',
  'labs':                    'labs',
  'tools':                   'tools',
}

// ── Derived helpers — components consume these, not the raw arrays ──────────

/** First tool of a module, or null if it has none. */
export function primaryTool(module) {
  return module.tools?.[0] ?? null
}

/** Whether a module has at least one tool or note (i.e. is renderable in the expanded view). */
export function hasContent(module) {
  return (module.tools?.length ?? 0) + (module.notes?.length ?? 0) > 0
}

/** Build the URL for a note. Mirrors src/pages/notes/NotesPage.jsx routing. */
export function noteRoute(moduleId, filename) {
  return `/notes/${moduleId}/${filename}`
}

/** Find the module that owns the given pathname, or null. */
export function findActiveModule(pathname) {
  if (pathname.startsWith('/notes/')) {
    const id = pathname.split('/')[2]
    return MODULES.find((m) => m.id === id) ?? null
  }
  const seg = firstSegment(pathname)
  if (!seg) return null
  return (
    MODULES.find((m) =>
      (m.tools ?? []).some((t) => firstSegment(t.route) === seg)
    ) ?? null
  )
}

function firstSegment(pathname) {
  return pathname.split('/').filter(Boolean)[0] ?? null
}
