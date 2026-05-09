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
import { useNavigate, useLocation } from 'react-router-dom'
import { GitBranch, Table2 } from 'lucide-react'
import NavGroup from './NavGroup/NavGroup'
import NavChildIcon from './NavChildIcon/NavChildIcon'
import ChatAvatar from '../../chat/ChatAvatar/ChatAvatar'
import NotificationBadge from '../../smoothui/components/notification-badge'
import useChat from '../../../hooks/useChat'
import styles from './Sidebar.module.css'

// Import SVG icons
import moonLogo from '../../../img/moon.svg'
import databaseOff from '../../../img/left nav/Database_off.svg'
import databaseOn from '../../../img/left nav/Database_on.svg'
import btreeOff from '../../../img/btree_off.svg'
import btreeOn from '../../../img/btree_on.svg'
import erdOff from '../../../img/erd_off.svg'
import erdOn from '../../../img/erd_on.svg'
import dsaOff from '../../../img/DSA_OFF.svg'
import dsaOn from '../../../img/DSA_ON.svg'
import complexityOff from '../../../img/COMPLEXITY_OFF.svg'
import complexityHover from '../../../img/COMPLEXITY_HOVER.svg'
import complexityOn from '../../../img/COMPLEXITY_ON.svg'
import logicOff from '../../../img/left nav/Logic_off.svg'
import logicOn from '../../../img/left nav/Logic_on.svg'
import downOff from '../../../img/left nav/Down_off.svg'
import downOn from '../../../img/left nav/Down_on.svg'
import calculatorOff from '../../../img/calculator_off.svg'
import calculatorOn from '../../../img/calculator_on.svg'
import chatOff from '../../../img/social/chat_off.svg'
import chatHover from '../../../img/social/chat_hover.svg'
import chatOn from '../../../img/social/chat_on.svg'

export default function Sidebar({
  defaultOpenGroup = 'database',
  activeChild,
  onChildSelect,
  isChatOpen,
  setIsChatOpen
}) {
  const [openGroup, setOpenGroup] = useState(defaultOpenGroup)
  const navigate = useNavigate()
  const location = useLocation()
  const sessionId = localStorage.getItem('session_id') || 'anonymous'
  const { unreadCount } = useChat(isChatOpen)
  
  // Determine which child is active based on current route
  const isProofActive = location.pathname === '/logic/proof'
  const isTableauxActive = location.pathname === '/logic/tableaux'
  const isComplexityActive = location.pathname === '/algo/complexity'

  /**
   * Toggle a navigation group open/closed
   * If the group is already open, close it. Otherwise, open it and close others.
   */
  const handleGroupToggle = (groupId) => {
    setOpenGroup(prev => prev === groupId ? null : groupId)
  }

  /**
   * Handle Database child icon clicks
   * Closes chat, navigates to the appropriate route, and notifies parent
   */
  const handleDatabaseChildClick = (childId) => {
    setIsChatOpen?.(false)
    onChildSelect?.(childId)
    
    if (childId === 'btree') {
      navigate('/tree')
    } else if (childId === 'erd') {
      navigate('/erd')
    }
  }

  /**
   * Handle Logic child icon clicks
   * Closes chat and navigates to the appropriate logic tool route or shows coming soon toast
   */
  const handleLogicChildClick = (childId) => {
    if (childId === 'proof') {
      setIsChatOpen?.(false)
      navigate('/logic/proof')
    } else if (childId === 'tableaux') {
      setIsChatOpen?.(false)
      navigate('/logic/tableaux')
    } else {
      // Coming soon toast for other tools
      alert('Coming soon')
    }
  }

  /**
   * Handle Algorithms child icon clicks
   * Closes chat and navigates to the appropriate algorithm tool route
   */
  const handleAlgorithmsChildClick = (childId) => {
    if (childId === 'complexity') {
      setIsChatOpen?.(false)
      navigate('/algo/complexity')
    }
  }

  /**
   * Handle GPA Calculator click
   * Opens external link in new tab
   */
 const handleCalculatorClick = () => {
  setIsChatOpen?.(false)
  navigate('/tools/lazy-grades')
}

  /**
   * Handle moon logo click
   * Navigates to B+ Tree landing page
   */
  const handleMoonClick = (e) => {
    e.preventDefault()
    setIsChatOpen?.(false)
    onChildSelect?.('btree')
    navigate('/tree')
  }

  /**
   * Handle chat icon click
   * Toggles the chat panel open/closed
   */
  const handleChatClick = () => {
    setIsChatOpen?.(prev => !prev)
  }

  return (
    <aside className={styles.sidebar}>
      {/* Moon logo - navigates to B+ Tree landing page */}
      <a 
        href="/tree"
        onClick={handleMoonClick}
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
            tooltip="B+ Tree"
            isActive={activeChild === 'btree'}
            hoverColor="#8B5CF6"
            activeColor="#8B5CF6"
            onClick={() => handleDatabaseChildClick('btree')}
          />
          
          <NavChildIcon
            iconOff={erdOff}
            iconOn={erdOn}
            tooltip="ER Diagram"
            isActive={activeChild === 'erd'}
            hoverColor="#8B5CF6"
            activeColor="#8B5CF6"
            onClick={() => handleDatabaseChildClick('erd')}
          />
        </NavGroup>

        {/* Algorithms group */}
        <NavGroup
          id="algorithms"
          icon={
            <img 
              src={openGroup === 'algorithms' ? dsaOn : dsaOff} 
              alt="Algorithms" 
              style={{ width: '22px', height: '22px' }}
            />
          }
          label="Algorithms"
          isOpen={openGroup === 'algorithms'}
          onToggle={() => handleGroupToggle('algorithms')}
        >
          <NavChildIcon
            iconOff={complexityOff}
            iconHover={complexityHover}
            iconOn={complexityOn}
            tooltip="Code Complexity"
            isActive={isComplexityActive}
            hoverColor="#EA6C0A"
            activeColor="#EA6C0A"
            onClick={() => handleAlgorithmsChildClick('complexity')}
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
            tooltip="Logical Equivalence"
            isActive={isProofActive}
            hoverColor="#8B5CF6"
            activeColor="#8B5CF6"
            onClick={() => handleLogicChildClick('proof')}
          />
          
          <NavChildIcon
            lucideIcon={<Table2 />}
            tooltip="Semantic Tableaux"
            isActive={isTableauxActive}
            hoverColor="#8B5CF6"
            activeColor="#8B5CF6"
            onClick={() => handleLogicChildClick('tableaux')}
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
            tooltip="CPA Calculator"
            isActive={false}
            hoverColor="#8B5CF6"
            activeColor="#8B5CF6"
            onClick={handleCalculatorClick}
          />
          <NavChildIcon
            iconOff={calculatorOff}
            iconOn={calculatorOn}
            tooltip="CPA Calculator"
            isActive={false}
            hoverColor="#8B5CF6"
            activeColor="#8B5CF6"
            onClick={() => navigate('/tools/cpa-calculator')}
          />
        </NavGroup>
      </div>

      {/* Chat icon and avatar at bottom */}
      <div className={styles.bottomSection}>
        {!isChatOpen && unreadCount > 0 ? (
          <NotificationBadge
            count={unreadCount}
            max={10}
            variant="count"
            position="top-right"
          >
            <NavChildIcon
              iconOff={chatOff}
              iconHover={chatHover}
              iconOn={chatOn}
              tooltip="Community Chat"
              isActive={isChatOpen}
              hoverColor="#8B5CF6"
              activeColor="#8B5CF6"
              onClick={handleChatClick}
            />
          </NotificationBadge>
        ) : (
          <NavChildIcon
            iconOff={chatOff}
            iconHover={chatHover}
            iconOn={chatOn}
            tooltip="Community Chat"
            isActive={isChatOpen}
            hoverColor="#8B5CF6"
            activeColor="#8B5CF6"
            onClick={handleChatClick}
          />
        )}
        
        <div className={styles.avatarContainer}>
          <ChatAvatar sessionId={sessionId} size={28} />
        </div>
      </div>
    </aside>
  )
}
