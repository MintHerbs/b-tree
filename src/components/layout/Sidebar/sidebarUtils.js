/**
 * sidebarUtils.js — Helper functions for sidebar navigation and icon mapping.
 */

// Import SVG tool icons
import btreeOff from '../../../img/btree_off.svg'
import btreeOn from '../../../img/btree_on.svg'
import erdOff from '../../../img/erd_off.svg'
import erdOn from '../../../img/erd_on.svg'
import complexityOff from '../../../img/COMPLEXITY_OFF.svg'
import complexityOn from '../../../img/COMPLEXITY_ON.svg'
import logicOff from '../../../img/left nav/Logic_off.svg'
import logicOn from '../../../img/left nav/Logic_on.svg'

// Test.md content from spec section 8
export const TEST_MD_CONTENT = `# Study Notes

> "First, solve the problem. Then, write the code." — John Johnson

## B+ Tree Key Properties
- All leaf nodes are at the same level
- Each node has at most m children (m = order)
- Minimum fill: ⌈m/2⌉ children per internal node

## Quick Reference
...add your own notes here`

/**
 * Get tool icons for the current route.
 * Maps routes to their corresponding tool icon sets.
 */
export function getToolIconsForRoute(pathname) {
  // Database tools
  if (pathname === '/tree' || pathname === '/erd') {
    return [
      { route: '/tree', off: btreeOff, on: btreeOn, tooltip: 'B+ Tree' },
      { route: '/erd', off: erdOff, on: erdOn, tooltip: 'ER Diagram' },
    ]
  }
  
  // Algorithm tools
  if (pathname.startsWith('/algo')) {
    return [
      { route: '/algo/complexity', off: complexityOff, on: complexityOn, tooltip: 'O Complexity' },
      { route: '/algo/recurrence', off: complexityOff, on: complexityOn, tooltip: 'Recurrence Relation' },
    ]
  }
  
  // Logic tools
  if (pathname.startsWith('/logic')) {
    return [
      { route: '/logic/proof', off: logicOff, on: logicOn, tooltip: 'Logical Equivalence' },
      { route: '/logic/tableaux', off: logicOff, on: logicOn, tooltip: 'Semantic Tableaux' },
    ]
  }
  
  // Notes view — single file icon
  if (pathname.includes('/notes')) {
    return [{ route: pathname, icon: 'file', tooltip: 'Note' }]
  }
  
  return []
}
