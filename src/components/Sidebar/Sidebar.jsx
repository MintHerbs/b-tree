// Left icon rail with moon logo and tool icons
import SidebarIcon from '../SidebarIcon/SidebarIcon'
import styles from './Sidebar.module.css'

// Import SVG icons
import moonLogo from '../../img/moon.svg'
import btreeOff from '../../img/btree_off.svg'
import btreeOn from '../../img/btree_on.svg'
import erdOff from '../../img/erd_off.svg'
import erdOn from '../../img/erd_on.svg'
import calculatorOff from '../../img/calculator_off.svg'
import calculatorOn from '../../img/calculator_on.svg'

function Sidebar({ activeTool, onToolChange }) {
  return (
    <aside className={styles.sidebar}>
      {/* Moon logo */}
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

      {/* Tool icons */}
      <div className={styles.icons}>
        <SidebarIcon
          iconOff={btreeOff}
          iconOn={btreeOn}
          tooltip="B+ Tree Visualizer"
          isActive={activeTool === 'btree'}
          onClick={() => onToolChange('btree')}
        />
        
        <SidebarIcon
          iconOff={erdOff}
          iconOn={erdOn}
          tooltip="ER Diagram Builder"
          isActive={activeTool === 'erd'}
          onClick={() => onToolChange('erd')}
        />
        
        <SidebarIcon
          iconOff={calculatorOff}
          iconOn={calculatorOn}
          tooltip="Calculator"
          isActive={false}
          onClick={() => onToolChange('calculator')}
        />
      </div>
    </aside>
  )
}

export default Sidebar
