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
  Calculator,
  ChartLineUp,
  Code,
  Cpu,
  Database,
  Eye,
  FileCode,
  Function as FunctionIcon,
  HardDrive,
  Network,
  ShieldCheck,
  Sparkle,
  TerminalWindow,
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
    ],
    tools: [
      { id: 'btree', label: 'B+ Tree.js',        route: '/tree' },
      { id: 'erd',   label: 'ERD Visualizer.js', route: '/erd' },
    ],
  },

  // Coming soon — declare with just { id, label, Icon }. Add `tools` to activate.
  { id: 'computational-math',    label: 'Computational Math',    Icon: FunctionIcon },
  { id: 'computer-architecture', label: 'Computer Architecture', Icon: Cpu },
  { id: 'computer-networking',   label: 'Computer Networking',   Icon: Network },
  { id: 'computer-security',     label: 'Computer Security',     Icon: ShieldCheck },
  { id: 'computer-vision',       label: 'Computer Vision',       Icon: Eye },
  { id: 'operating-systems',     label: 'Operating Systems',     Icon: HardDrive },
  { id: 'programming',           label: 'Programming',           Icon: TerminalWindow },
  { id: 'software-engineering',  label: 'Software Engineering',  Icon: Code },
]

// ── Standalone tools (below the divider) ────────────────────────────────────

export const STANDALONE_TOOLS = [
  { id: 'cpa',    label: 'CPA Calculator.js',        Icon: Calculator, route: '/tools/cpa-calculator' },
  { id: 'minmax', label: 'Min Effort Max Result.js', Icon: Sparkle,    route: '/tools/lazy-grades' },
]

// ── Easter-egg pinned at the divider ────────────────────────────────────────

export const PACKAGE_JSON = { id: 'package-json', label: 'package.json', Icon: FileCode }

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
