import {
  Brain,
  Calculator,
  ChartLineUp,
  Code,
  Cpu,
  Database,
  Eye,
  FileCode as FileJson,
  Function as FunctionIcon,
  HardDrive,
  Network,
  ShieldCheck,
  Sparkle,
  TerminalWindow,
} from '@phosphor-icons/react'

export const MODULES = [
  {
    id: 'algorithms',
    label: 'Algorithms',
    Icon: ChartLineUp,
    primaryRoute: '/algo/code-complexity',
    primaryChildId: 'complexity',
    routeMatches: (p) => p.startsWith('/algo'),
    notes: [],
    tools: [
      { label: 'Code Complexity.js', route: '/algo/code-complexity', childId: 'complexity' },
      { label: 'Recurrence Relation.js', route: '/algo/recurrence-relation', childId: 'recurrence' },
    ],
  },
  {
    id: 'artificial-intelligence',
    label: 'Artificial Intelligence',
    Icon: Brain,
    primaryRoute: '/logic/truth-tree',
    primaryChildId: 'truth-tree',
    routeMatches: (p) => p.startsWith('/logic'),
    notes: [],
    tools: [
      { label: 'Truth Tree.js', route: '/logic/truth-tree', childId: 'truth-tree' },
      { label: 'Semantic Tableaux.js', route: '/logic/semantic-tableaux', childId: 'semantic-tableaux' },
    ],
  },
  {
    id: 'computational-math',
    label: 'Computational Math',
    Icon: FunctionIcon,
    primaryRoute: null,
    routeMatches: () => false,
    notes: [],
    tools: [],
  },
  {
    id: 'computer-architecture',
    label: 'Computer Architecture',
    Icon: Cpu,
    primaryRoute: null,
    routeMatches: () => false,
    notes: [],
    tools: [],
  },
  {
    id: 'computer-networking',
    label: 'Computer Networking',
    Icon: Network,
    primaryRoute: null,
    routeMatches: () => false,
    notes: [],
    tools: [],
  },
  {
    id: 'computer-security',
    label: 'Computer Security',
    Icon: ShieldCheck,
    primaryRoute: null,
    routeMatches: () => false,
    notes: [],
    tools: [],
  },
  {
    id: 'computer-vision',
    label: 'Computer Vision',
    Icon: Eye,
    primaryRoute: null,
    routeMatches: () => false,
    notes: [],
    tools: [],
  },
  {
    id: 'database',
    label: 'Database',
    Icon: Database,
    primaryRoute: '/tree',
    primaryChildId: 'btree',
    routeMatches: (p) => p === '/tree' || p === '/erd',
    notes: [
      { label: 'getting-started.md', route: '/notes/database/getting-started.md', childId: 'notes' },
    ],
    tools: [
      { label: 'B+ Tree.js', route: '/tree', childId: 'btree' },
      { label: 'ERD Visualizer.js', route: '/erd', childId: 'erd' },
    ],
  },
  {
    id: 'operating-systems',
    label: 'Operating Systems',
    Icon: HardDrive,
    primaryRoute: null,
    routeMatches: () => false,
    notes: [],
    tools: [],
  },
  {
    id: 'programming',
    label: 'Programming',
    Icon: TerminalWindow,
    primaryRoute: null,
    routeMatches: () => false,
    notes: [],
    tools: [],
  },
  {
    id: 'software-engineering',
    label: 'Software Engineering',
    Icon: Code,
    primaryRoute: null,
    routeMatches: () => false,
    notes: [],
    tools: [],
  },
]

export const STANDALONE_TOOLS = [
  { id: 'cpa',    label: 'CPA Calculator.js',         Icon: Calculator, route: '/tools/cpa-calculator', childId: 'cpa' },
  { id: 'minmax', label: 'Min Effort Max Result.js',  Icon: Sparkle,    route: '/tools/lazy-grades',   childId: 'minmax' },
]

export const PACKAGE_JSON = { id: 'package-json', label: 'package.json', Icon: FileJson }

export function findActiveModule(path) {
  if (path.startsWith('/notes/')) {
    const section = path.split('/')[2]
    return MODULES.find((m) => m.id === section) ?? null
  }
  return MODULES.find((m) => m.routeMatches(path)) ?? null
}
