/**
 * Sidebar - Two-level navigation sidebar with collapsible groups
 * 
 * Manages openGroup state to control which navigation group is expanded.
 * Only one group can be open at a time. Contains Database, Logic, and More Tools groups.
 * 
 * Database group:
 * - B+ Tree (routes to /tree)
 * - ERD (routes to /erd)
 * 
 * Logic group (placeholder - shows "coming soon" alert):
 * - Proof Tree
 * - Semantic Tableaux
 * - Resolution Method
 * 
 * More Tools group:
 * - GPA Calculator (opens external link)
 * 
 * @param {Object} props
 * @param {string|null} props.defaultOpenGroup - Initial open group ('database' | 'logic' | 'tools' | null)
 * @param {string} props.activeChild - Currently active child icon id ('btree' | 'erd')
 * @param {Function} props.onChildSelect - Callback when a child icon is clicked
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GitBranch, Table2, Layers } from 'lucide-react'
import NavGroup from './NavGroup/NavGroup'
import NavChildIcon from './NavChildIcon/NavChildIcon'
import styles from './Sidebar.module.css'

// Import SVG icons
import moonLogo from '../../../img/moon.svg'
import databaseOff from '../../../img/left nav/Database_off.svg'
import databaseOn from '../../../img/left nav/Database_on.svg'
import btreeOff from '../../../img/btree_off.svg'
import btreeOn from '../../../img/btree_on.svg'
import erdOff from '../../../img/erd_off.svg'
import erdOn from '../../../img/erd_on.svg'
import logicOff from '../../../img/left nav/Logic_off.svg'
import logicOn from '../../../img/left nav/Logic_on.svg'
import downOff from '../../../img/left nav/Down_off.svg'
import downOn from '../../../img/left nav/Down_on.svg'
import calculatorOff from '../../../img/calculator_off.svg'
import calculatorOn from '../../../img/calculator_on.svg'

export default function Sidebar({
  defaultOpenGroup = 'database',
  activeChild,
  onChildSelect
}) {
  const [openGroup, setOpenGroup] = useState(defaultOpenGroup)
  const navigate = useNavigate()

  /**
   * Toggle a navigation group open/closed
   * If the group is already open, close it. Otherwise, open it and close others.
   */
  const handleGroupToggle = (groupId) => {
    setOpenGroup(prev => prev === groupId ? null : groupId)
  }

  /**
   * Handle Database child icon clicks
   * Navigates to the appropriate route and notifies parent
   */
  const handleDatabaseChildClick = (childId) => {
    onChildSelect?.(childId)
    
    if (childId === 'btree') {
      navigate('/tree')
    } else if (childId === 'erd') {
      navigate('/erd')
    }
  }

  /**
   * Handle Logic child icon clicks
   * Shows "coming soon" message for all Logic tools
   */
  const handleLogicChildClick = () => {
    // TODO: Replace with proper toast notification when toast library is added
    console.info('Coming soon: English to Logic, Proof Tree, Semantic Tableaux, Resolution Method')
    alert('Coming soon: English to Logic, Proof Tree, Semantic Tableaux, Resolution Method')
  }

  /**
   * Handle GPA Calculator click
   * Opens external link in new tab
   */
  const handleCalculatorClick = () => {
    window.open('https://lazy-grades.vercel.app/', '_blank')
  }

  return (
    <aside className={styles.sidebar}>
      {/* Moon logo - links to LinkedIn */}
      <a 
        href="https://www.linkedin.com/in/offrian/" 
        target="_blank" 
        rel="noreferrer"
        className={styles.moonLink}
      >
        <img 
          src={moonLogo} 
          alt="Moon logo" 
          className={styles.moonLogo}
        />
      </a>

      {/* Navigation groups */}
      <div className={styles.groups}>
        {/* Database group */}
        <NavGroup
          id="database"
          icon={
            <img 
              src={openGroup === 'database' ? databaseOn : databaseOff} 
              alt="Database" 
              style={{ width: '22px', height: '22px' }}
            />
          }
          label="Database"
          isOpen={openGroup === 'database'}
          onToggle={() => handleGroupToggle('database')}
        >
          <NavChildIcon
            iconOff={btreeOff}
            iconOn={btreeOn}
            tooltip="B+ Tree Visualizer"
            isActive={activeChild === 'btree'}
            hoverColor="#6A4BCB"
            activeColor="#DB7FF7"
            onClick={() => handleDatabaseChildClick('btree')}
          />
          
          <NavChildIcon
            iconOff={erdOff}
            iconOn={erdOn}
            tooltip="ER Diagram Builder"
            isActive={activeChild === 'erd'}
            hoverColor="#6A4BCB"
            activeColor="#DB7FF7"
            onClick={() => handleDatabaseChildClick('erd')}
          />
        </NavGroup>

        {/* Logic group */}
        <NavGroup
          id="logic"
          icon={
            <img 
              src={openGroup === 'logic' ? logicOn : logicOff} 
              alt="Logic" 
              style={{ width: '26px', height: '26px' }}
            />
          }
          label="Logic"
          isOpen={openGroup === 'logic'}
          onToggle={() => handleGroupToggle('logic')}
        >
          <NavChildIcon
            lucideIcon={<GitBranch />}
            tooltip="Proof Tree"
            isActive={false}
            hoverColor="#6A4BCB"
            activeColor="#DB7FF7"
            onClick={handleLogicChildClick}
          />
          
          <NavChildIcon
            lucideIcon={<Table2 />}
            tooltip="Semantic Tableaux"
            isActive={false}
            hoverColor="#6A4BCB"
            activeColor="#DB7FF7"
            onClick={handleLogicChildClick}
          />
          
          <NavChildIcon
            lucideIcon={<Layers />}
            tooltip="Resolution Method"
            isActive={false}
            hoverColor="#6A4BCB"
            activeColor="#DB7FF7"
            onClick={handleLogicChildClick}
          />
        </NavGroup>

        {/* More Tools group */}
        <NavGroup
          id="tools"
          icon={
            <img 
              src={openGroup === 'tools' ? downOn : downOff} 
              alt="More Tools" 
              style={{ width: '22px', height: '22px' }}
            />
          }
          label="More Tools"
          isOpen={openGroup === 'tools'}
          onToggle={() => handleGroupToggle('tools')}
        >
          <NavChildIcon
            iconOff={calculatorOff}
            iconOn={calculatorOn}
            tooltip="GPA Calculator"
            isActive={false}
            hoverColor="#6A4BCB"
            activeColor="#DB7FF7"
            onClick={handleCalculatorClick}
          />
        </NavGroup>
      </div>
    </aside>
  )
}
