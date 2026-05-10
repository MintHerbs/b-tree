# 📁 New Folder Structure

## Complete Component Organization

```
src/
├── components/
│   ├── layout/                    ← Navigation & Layout
│   │   ├── Navbar.jsx
│   │   ├── Navbar.module.css
│   │   ├── Sidebar.jsx
│   │   ├── Sidebar.module.css
│   │   ├── SidebarIcon.jsx
│   │   └── SidebarIcon.module.css
│   │
│   ├── landing/                   ← Landing Page Components
│   │   ├── HeroText.jsx
│   │   ├── HeroText.module.css
│   │   ├── PillInput.jsx
│   │   └── PillInput.module.css
│   │
│   ├── dynamic-island/            ← Dynamic Island (iOS-style)
│   │   ├── DynamicIsland.jsx
│   │   └── DynamicIsland.module.css
│   │
│   ├── tree/                      ← B+ Tree Visualizer
│   │   ├── TreeCanvas.jsx         (main canvas)
│   │   ├── TreeCanvas.module.css
│   │   ├── TreeNode.jsx           (node rendering)
│   │   ├── TreeNode.module.css
│   │   ├── TreeEdge.jsx           (edge rendering)
│   │   ├── TreeEdge.module.css
│   │   ├── PointerArrow.jsx       (animation arrows)
│   │   ├── PointerArrow.module.css
│   │   ├── OperationsPanel.jsx    (insert/delete controls)
│   │   ├── OperationsPanel.module.css
│   │   ├── StepControls.jsx       (playback controls)
│   │   └── StepControls.module.css
│   │
│   ├── erd/                       ← ER Diagram Builder
│   │   ├── ERDCanvas.jsx          (main canvas)
│   │   ├── ERDCanvas.module.css
│   │   ├── shapes.jsx             (entity/relationship shapes)
│   │   ├── edges.jsx              (connection lines)
│   │   ├── ERDStep1.jsx           (step 1: describe scenario)
│   │   ├── ERDStep1.module.css
│   │   ├── ERDStep2.jsx           (step 2: copy prompt)
│   │   ├── ERDStep2.module.css
│   │   ├── ERDStep3.jsx           (step 3: paste JSON)
│   │   ├── ERDStep3.module.css
│   │   ├── ERDChoiceCards.jsx     (AI vs manual choice)
│   │   └── ERDChoiceCards.module.css
│   │
│   ├── music/                     ← Music Player
│   │   ├── MusicPlayer.jsx
│   │   └── MusicPlayer.module.css
│   │
│   ├── ui/                        ← Shared UI Primitives
│   │   ├── PaginationDots.jsx
│   │   └── PaginationDots.module.css
│   │
│   ├── background/                ← Background Effects
│   │   ├── Starfield.jsx
│   │   └── Starfield.module.css
│   │
│   ├── smoothui/                  ← Third-party UI Library
│   │   ├── glow-hover-card/
│   │   │   └── index.tsx
│   │   └── grid-loader/
│   │       └── index.tsx
│   │
│   └── InputBox/                  ⚠️ UNUSED - Can be deleted
│       ├── InputBox.jsx
│       └── InputBox.module.css
│
├── pages/                         ← Page Components (unchanged)
│   ├── LandingPage.jsx
│   ├── LandingPage.module.css
│   ├── TreePage.jsx
│   ├── TreePage.module.css
│   ├── ERDPage.jsx
│   ├── ERDPage.module.css
│   ├── AboutPage.jsx
│   ├── AboutPage.module.css
│   ├── DisclaimerPage.jsx
│   └── DisclaimerPage.module.css
│
├── hooks/                         ← Custom React Hooks (unchanged)
│   ├── useAnimationPlayer.js      ⚠️ UNUSED - Can be deleted
│   ├── useApiCalls.js
│   ├── useBPlusTree.js
│   ├── usePresence.js
│   └── hooks.test.jsx             ⚠️ EMPTY - Can be deleted
│
├── lib/                           ← Pure Functions & Utilities (unchanged)
│   ├── BPlusTree.js
│   ├── erdLayout.js
│   ├── erdParser.js
│   ├── erdPromptBuilder.js
│   ├── geminiService.js
│   ├── treeLayout.js
│   ├── treeLayout.test.js         ⚠️ EMPTY - Can be deleted
│   ├── utils.js
│   └── utils/
│       └── index.js               ⚠️ DUPLICATE - Can be deleted
│
├── engine/                        ← Animation Engine (unchanged)
│   └── AnimationEngine.js         ⚠️ UNUSED - Can be deleted
│
├── styles/                        ← Global Styles (unchanged)
│   └── global.css
│
├── img/                           ← Images & Icons (unchanged)
│   ├── ai icons/
│   │   ├── gemini.svg
│   │   └── mi.svg
│   ├── btree_off.svg
│   ├── btree_on.svg
│   ├── calculator_off.svg
│   ├── calculator_on.svg
│   ├── erd_off.svg
│   ├── erd_on.svg
│   └── moon.svg
│
├── App.jsx                        ← Root Component (unchanged)
└── main.jsx                       ← Entry Point (unchanged)
```

---

## 📊 Folder Purpose Guide

### `components/layout/`
**Purpose:** Top-level navigation and layout components  
**Contains:** Navbar, Sidebar, SidebarIcon  
**Used by:** All pages

### `components/landing/`
**Purpose:** Landing page-specific components  
**Contains:** HeroText, PillInput  
**Used by:** LandingPage

### `components/dynamic-island/`
**Purpose:** iOS-style dynamic island notification system  
**Contains:** DynamicIsland  
**Used by:** App.jsx (global)

### `components/tree/`
**Purpose:** B+ Tree visualizer components  
**Contains:** Canvas, nodes, edges, controls, operations panel  
**Used by:** TreePage

### `components/erd/`
**Purpose:** ER Diagram builder components  
**Contains:** Canvas, shapes, edges, multi-step flow  
**Used by:** ERDPage

### `components/music/`
**Purpose:** Background music player  
**Contains:** MusicPlayer  
**Used by:** App.jsx (global)

### `components/ui/`
**Purpose:** Reusable UI primitives  
**Contains:** PaginationDots, (future shared components)  
**Used by:** Multiple pages

### `components/background/`
**Purpose:** Background visual effects  
**Contains:** Starfield  
**Used by:** All pages

### `components/smoothui/`
**Purpose:** Third-party UI component library  
**Contains:** glow-hover-card, grid-loader  
**Used by:** Various components

---

## 🎯 Import Path Examples

### Before Refactor
```javascript
import Navbar from '../components/Navbar/Navbar'
import Sidebar from '../components/Sidebar/Sidebar'
import TreeCanvas from '../components/TreeCanvas/TreeCanvas'
import ERDCanvas from '../components/ERDCanvas/ERDCanvas'
```

### After Refactor
```javascript
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import TreeCanvas from '../components/tree/TreeCanvas'
import ERDCanvas from '../components/erd/ERDCanvas'
```

**Benefits:**
- ✅ Clearer intent from path
- ✅ Easier to find related components
- ✅ Better autocomplete suggestions
- ✅ Logical grouping visible in imports

---

## 🔄 Component Dependencies

### Layout Components
```
Navbar ← (used by all pages)
Sidebar ← (used by LandingPage, AboutPage, DisclaimerPage, ERDPage)
  └── SidebarIcon ← (used by Sidebar)
```

### Landing Components
```
LandingPage
  ├── HeroText
  └── PillInput
```

### Tree Components
```
TreePage
  ├── TreeCanvas
  │   ├── TreeNode
  │   └── TreeEdge
  ├── OperationsPanel
  └── StepControls (unused currently)
```

### ERD Components
```
ERDPage
  ├── ERDStep1
  │   ├── PillInput (from landing/)
  │   └── PaginationDots (from ui/)
  ├── ERDStep2
  │   └── PaginationDots (from ui/)
  ├── ERDStep3
  │   ├── PillInput (from landing/)
  │   └── PaginationDots (from ui/)
  └── ERDCanvas
      ├── shapes.jsx
      └── edges.jsx
```

### Global Components
```
App.jsx
  ├── DynamicIsland (from dynamic-island/)
  └── MusicPlayer (from music/)

All Pages
  └── Starfield (from background/)
```

---

## 📈 Scalability

### Adding New Components

**Tree-related component:**
```
src/components/tree/NewTreeComponent.jsx
```

**ERD-related component:**
```
src/components/erd/NewERDComponent.jsx
```

**Shared UI component:**
```
src/components/ui/NewUIComponent.jsx
```

**New feature group:**
```
src/components/new-feature/
  ├── FeatureMain.jsx
  ├── FeatureMain.module.css
  └── FeatureHelper.jsx
```

---

## 🧹 Cleanup Recommendations

### Files to Delete (5 items)
1. `src/components/InputBox/` (unused component)
2. `src/hooks/useAnimationPlayer.js` (unused hook)
3. `src/engine/AnimationEngine.js` (legacy code)
4. `src/hooks/hooks.test.jsx` (empty test)
5. `src/lib/treeLayout.test.js` (empty test)
6. `src/lib/utils/index.js` (duplicate)

### Potential Improvements
1. Add `index.js` files for cleaner imports:
   ```javascript
   // src/components/layout/index.js
   export { default as Navbar } from './Navbar'
   export { default as Sidebar } from './Sidebar'
   export { default as SidebarIcon } from './SidebarIcon'
   ```

2. Create shared hooks folder structure:
   ```
   src/hooks/
     ├── shared/
     │   ├── usePanZoom.js
     │   ├── useAIState.js
     │   └── useNavigation.js
     └── feature/
         ├── useBPlusTree.js
         └── useApiCalls.js
   ```

---

## ✅ Verification

All imports have been automatically updated and verified:
- ✅ Zero broken imports
- ✅ Zero compilation errors
- ✅ All diagnostics passing
- ✅ Application runs successfully
