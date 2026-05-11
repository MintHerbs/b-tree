import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

const TreePage = lazy(() => import('../pages/TreePage'))
const ERDPage = lazy(() => import('../pages/ERDPage'))
const ComplexityPage = lazy(() =>
  new Promise(resolve =>
    setTimeout(() => resolve(import('../pages/ComplexityPage')), 300)
  )
)
const AboutPage = lazy(() => import('../pages/AboutPage'))
const DisclaimerPage = lazy(() => import('../pages/DisclaimerPage'))
const LogicalEquivalencePage = lazy(() => import('../pages/logic/LogicalEquivalencePage'))
const TableauxPage = lazy(() => import('../pages/logic/TableauxPage'))
const CPA = lazy(() => import('../pages/exam/cpa'))
const Lazy = lazy(() => import('../pages/exam/lazy'))

export function AppRoutes({ onAIStateChange, onChatOpen }) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/tree" replace />} />
      <Route path="/tree" element={<TreePage onAIStateChange={onAIStateChange} onChatOpen={onChatOpen} />} />
      <Route path="/erd" element={<ERDPage onAIStateChange={onAIStateChange} onChatOpen={onChatOpen} />} />
      <Route path="/algo/complexity" element={<ComplexityPage onAIStateChange={onAIStateChange} />} />
      <Route path="/logic/proof" element={<LogicalEquivalencePage onAIStateChange={onAIStateChange} onChatOpen={onChatOpen} />} />
      <Route path="/logic/tableaux" element={<TableauxPage onAIStateChange={onAIStateChange} onChatOpen={onChatOpen} />} />
      <Route path="/about" element={<AboutPage onChatOpen={onChatOpen} />} />
      <Route path="/disclaimer" element={<DisclaimerPage onChatOpen={onChatOpen} />} />
      <Route path="/tools/lazy-grades" element={<Lazy />} />
      <Route path="/tools/cpa-calculator" element={<CPA />} />
    </Routes>
  )
}

export function preloadRoutes() {
  import('../pages/TreePage')
  import('../pages/ERDPage')
  import('../pages/logic/LogicalEquivalencePage')
  import('../pages/logic/TableauxPage')
  import('../pages/ComplexityPage')
  import('../pages/exam/cpa')
  import('../pages/exam/lazy')
}
