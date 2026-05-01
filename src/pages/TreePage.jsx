// Main visualization screen - two-column layout with TreeCanvas and OperationsPanel
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Starfield from '../components/Starfield/Starfield'
import Navbar from '../components/Navbar/Navbar'
import TreeCanvas from '../components/TreeCanvas/TreeCanvas'
import OperationsPanel from '../components/OperationsPanel/OperationsPanel'
import { useBPlusTree } from '../hooks/useBPlusTree'
import styles from './TreePage.module.css'

function TreePage() {
  const location = useLocation()
  const { values = [], order = 3 } = location.state || {}
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  // Tree management hook (no animation)
  const { tree, stats, initializeTree, insert, deleteValues } = useBPlusTree(order)

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

  return (
    <div className={styles.container}>
      {/* Starfield background - z-index: 0 */}
      <Starfield />
      
      <Navbar order={order} />
      
      <div className={styles.mainContent}>
        <TreeCanvas tree={tree} />
        
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
    </div>
  )
}

export default TreePage
