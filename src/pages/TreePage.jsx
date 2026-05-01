// Main visualization screen - three-column layout with TreeCanvas, OperationsPanel, and StepControls
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar/Navbar'
import TreeCanvas from '../components/TreeCanvas/TreeCanvas'
import OperationsPanel from '../components/OperationsPanel/OperationsPanel'
import StepControls from '../components/StepControls/StepControls'
import { useBPlusTree } from '../hooks/useBPlusTree'
import { useAnimationPlayer } from '../hooks/useAnimationPlayer'
import styles from './TreePage.module.css'

function TreePage() {
  const location = useLocation()
  const { values = [], order = 3 } = location.state || {}
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  // Tree management hook
  const { tree, steps, stats, initializeTree, insert, deleteValues } = useBPlusTree([], order)
  
  // Animation playback hook
  const player = useAnimationPlayer(steps)

  // Initialize tree on mount with values from router
  useEffect(() => {
    if (values.length > 0) {
      initializeTree(values, order)
    }
  }, []) // Empty deps - only run once on mount

  // Handle insert operation from OperationsPanel
  const handleInsert = (valuesToInsert) => {
    insert(valuesToInsert)
  }

  // Handle delete operation from OperationsPanel
  const handleDelete = (valuesToDelete) => {
    deleteValues(valuesToDelete)
  }

  // Toggle mobile panel
  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen)
  }

  // Close panel when clicking overlay
  const closePanel = () => {
    setIsPanelOpen(false)
  }

  // Get current step data for rendering
  const currentStep = player.currentStep

  return (
    <div className={styles.container}>
      <Navbar order={order} />
      
      <div className={styles.mainContent}>
        <TreeCanvas
          treeSnapshot={currentStep?.treeSnapshot}
          highlightNodeId={currentStep?.highlightNodeId}
          highlightKeys={currentStep?.highlightKeys || []}
          arrowFrom={currentStep?.arrowFrom}
          arrowTo={currentStep?.arrowTo}
          arrowLabel={currentStep?.arrowLabel}
        />
        
        {/* Desktop: always visible */}
        <div className={styles.desktopPanel}>
          <OperationsPanel
            order={order}
            stats={stats}
            onInsert={handleInsert}
            onDelete={handleDelete}
          />
        </div>

        {/* Mobile: toggle button */}
        <button 
          className={styles.mobileToggle}
          onClick={togglePanel}
          title="Operations"
        >
          ⚙️
        </button>

        {/* Mobile: bottom sheet overlay */}
        {isPanelOpen && (
          <>
            <div className={styles.overlay} onClick={closePanel} />
            <div className={styles.bottomSheet}>
              <div className={styles.sheetHeader}>
                <h2 className={styles.sheetTitle}>Operations</h2>
                <button className={styles.closeButton} onClick={closePanel}>
                  ✕
                </button>
              </div>
              <OperationsPanel
                order={order}
                stats={stats}
                onInsert={handleInsert}
                onDelete={handleDelete}
              />
            </div>
          </>
        )}
      </div>
      
      <StepControls player={player} />
    </div>
  )
}

export default TreePage
