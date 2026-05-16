import { lazy } from 'react'

const TreePage = lazy(() => import('../pages/tree/TreePage'))
const ERDPage = lazy(() => import('../pages/erd/ERDPage'))
const ComplexityPage = lazy(() =>
  new Promise(resolve =>
    setTimeout(() => resolve(import('../pages/algo/complexity/ComplexityPage')), 300)
  )
)
const RecurrencePage = lazy(() =>
  new Promise(resolve =>
    setTimeout(() => resolve(import('../pages/algo/recurrence/RecurrencePage')), 300)
  )
)
const AboutPage = lazy(() => import('../pages/about/AboutPage'))
const DisclaimerPage = lazy(() => import('../pages/disclaimer/DisclaimerPage'))
const LogicalEquivalencePage = lazy(() => import('../pages/logic/proof/LogicalEquivalencePage'))
const TableauxPage = lazy(() => import('../pages/logic/tableaux/TableauxPage'))
const CpaCalculatorPage = lazy(() => import('../pages/tools/cpa-calculator/CpaCalculatorPage'))
const LazyGradesPage = lazy(() => import('../pages/tools/lazy-grades/LazyGradesPage'))
const HomePage = lazy(() => import('../pages/home/HomePage'))

export const NotesPage = lazy(() => import('../pages/notes/NotesPage'))

export const routeComponents = {
  '/tree': TreePage,
  '/erd': ERDPage,
  '/algo/complexity': ComplexityPage,
  '/algo/code-complexity': ComplexityPage,
  '/algo/recurrence': RecurrencePage,
  '/algo/recurrence-relation': RecurrencePage,
  '/logic/proof': LogicalEquivalencePage,
  '/logic/tableaux': TableauxPage,
  '/logic/truth-tree': TableauxPage,
  '/logic/semantic-tableaux': TableauxPage,
  '/about': AboutPage,
  '/disclaimer': DisclaimerPage,
  '/tools/lazy-grades': LazyGradesPage,
  '/tools/cpa-calculator': CpaCalculatorPage,
  '/home': HomePage,
}

export function preloadAcademiaRoutes() {
  import('../pages/tree/TreePage')
  import('../pages/erd/ERDPage')
  import('../pages/logic/proof/LogicalEquivalencePage')
  import('../pages/logic/tableaux/TableauxPage')
  import('../pages/algo/complexity/ComplexityPage')
  import('../pages/algo/recurrence/RecurrencePage')
  import('../pages/tools/cpa-calculator/CpaCalculatorPage')
  import('../pages/tools/lazy-grades/LazyGradesPage')
  import('../pages/home/HomePage')
  import('../pages/notes/NotesPage')
}
