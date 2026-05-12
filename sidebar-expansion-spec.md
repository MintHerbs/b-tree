# sidebar-expansion-spec.md — Expandable File System Sidebar

## Overview

The sidebar gains a hover-expand behaviour. When the user's cursor enters the sidebar,
it expands from 56px to 240px revealing a VS Code-style file system built with the
animate-ui `Files` component. When the cursor leaves, it collapses back to 56px showing
only the active section's icons.

This is purely a navigation/UI change. No existing tools, routes, or logic change.

---

## Sidebar Modes

### Collapsed (default, cursor away)
- Width: `56px`
- Shows: only the icons relevant to the current section
- If in Database section: shows TreeStructure + Database icons
- If in a note: shows a single file icon
- Bottom always shows: Globe icon | BookOpen icon | Avatar

### Expanded (cursor over sidebar)
- Width: `240px`
- Shows: full file system tree using animate-ui `Files` component
- Smooth width transition: `transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1)`
- Bottom always shows: Globe text row | Academia text row | Avatar

---

## File System Structure

```
App                          ← root label, not clickable
├── Database/                ← FolderItem, Phosphor: Database icon
│   ├── notes/               ← FolderItem
│   │   └── getting-started.md  ← FileItem, opens a markdown viewer
│   └── tools/               ← FolderItem
│       ├── B+ Tree.js       ← FileItem, navigates to /tree
│       └── ER Diagram.js    ← FileItem, navigates to /erd
├── Algorithms/              ← FolderItem, Phosphor: ChartLineUp icon
│   ├── notes/               ← FolderItem (empty for now)
│   └── tools/               ← FolderItem
│       └── Complexity.js    ← FileItem, navigates to /algo/complexity
├── Logic/                   ← FolderItem, Phosphor: GitBranch icon
│   ├── notes/               ← FolderItem (empty for now)
│   └── tools/               ← FolderItem
│       ├── Logical Equiv.js ← FileItem, navigates to /logic/proof
│       └── Tableaux.js      ← FileItem, navigates to /logic/tableaux
├── Operating Systems/       ← FolderItem, Phosphor: HardDrive icon
│   └── notes/               ← FolderItem (empty, coming soon)
├── Computational Math/      ← FolderItem, Phosphor: Function icon
│   └── notes/               ← FolderItem (empty, coming soon)
├── package.json             ← FileItem, FileJsonIcon from Phosphor
│                               content: motivational JSON easter egg
├── CPA Calculator.js        ← FileItem, Calculator icon, → /tools/cpa-calculator
└── Min Effort Max Result.js ← FileItem, Sparkle icon, → /tools/lazy-grades
```

---

## Bottom Section (always visible, expands with sidebar)

### Collapsed state (56px):
```
[ Globe icon ]      ← with notification badge if unread
[ BookOpen icon ]   ← academia mode
[ Avatar ]
```

### Expanded state (240px):
```
[ Globe icon ] Global        ← notification badge on right of "Global" text
[ BookOpen icon ] Academia   ← currently active indicator
[ Avatar ] Session ID hint
```

---

## animate-ui Files Component

### Installation
```
npx shadcn@latest add @animate-ui/components-radix-files
```

Since this is a JS project, after install:
1. Rename the installed `.tsx` file to `.jsx`
2. Remove all TypeScript type annotations
3. Replace `import { cn } from "@/lib/utils"` with
   `const cn = (...classes) => classes.filter(Boolean).join(' ')`
4. Remove all `: Type` annotations, `interface`, `type` keywords

### Styling to match mooner.dev theme

Override the component's default styles in `Sidebar.module.css`:
```css
/* File system container */
.filesContainer {
  width: 100%;
  padding: 8px 0;
  overflow-y: auto;
  flex: 1;
}

/* Folder trigger rows */
.filesContainer [data-slot="folder-trigger"],
.filesContainer [data-slot="file-item"] {
  color: rgba(255,255,255,0.55);
  font-size: 12px;
  font-family: monospace;
  padding: 3px 8px;
  border-radius: 4px;
  transition: color 0.15s ease, background 0.15s ease;
}

.filesContainer [data-slot="folder-trigger"]:hover,
.filesContainer [data-slot="file-item"]:hover {
  color: #fff;
  background: rgba(255,255,255,0.05);
  cursor: pointer;
}

/* Active file */
.filesContainer [data-slot="file-item"][data-active="true"] {
  color: #8B5CF6;
  background: rgba(139,92,246,0.1);
}

/* Git status dots — restyle to match theme */
.filesContainer [data-git-status="modified"] { color: #EA6C0A; }
.filesContainer [data-git-status="untracked"] { color: #22c55e; }
```

No Tailwind classes should remain in the component after conversion.

---

## package.json Easter Egg Content

When user clicks `package.json`, show a small tooltip or modal with:
```json
{
  "name": "your-degree",
  "version": "4.0.0",
  "description": "You are closer than you think.",
  "scripts": {
    "study": "stay-consistent --daily",
    "rest": "sleep 8h",
    "succeed": "npm run study && npm run rest"
  },
  "dependencies": {
    "discipline": "^1.0.0",
    "curiosity": "latest",
    "patience": "*"
  },
  "author": "You",
  "license": "MIT"
}
```

Display in a small dark popup (`background: #0f0f0f`, `border: 1px solid #222`,
`border-radius: 8px`, `font-family: monospace`, `font-size: 11px`, white text).
Clicking anywhere outside closes it.

---

## Collapse/Expand Logic

```jsx
// In Sidebar.jsx
const [isExpanded, setIsExpanded] = useState(false)

<aside
  className={styles.sidebar}
  onMouseEnter={() => setIsExpanded(true)}
  onMouseLeave={() => setIsExpanded(false)}
  style={{ width: isExpanded ? '240px' : '56px' }}
>
  {isExpanded ? <ExpandedView /> : <CollapsedView />}
</aside>
```

`CollapsedView` — renders current section icons only (same as existing sidebar).
`ExpandedView` — renders the full `Files` file system tree + expanded bottom section.

Both views share the same navigation handlers via the parent `Sidebar` component.

---

## Notes Viewer

When a `.md` file is clicked, navigate to `/notes/:section/:filename`.
The notes page renders markdown content centered on the starfield background.
For now only `getting-started.md` exists under Database with placeholder content.
Notes pages are lazy-loaded.

---

## New Files Required

```
src/
├── components/
│   └── layout/
│       └── Sidebar/
│           ├── ExpandedView.jsx      ← full file system tree
│           ├── CollapsedView.jsx     ← current icons-only view
│           └── PackageJsonPopup.jsx  ← easter egg popup
├── pages/
│   └── NotesPage.jsx                 ← renders .md content
└── content/
    └── notes/
        └── database/
            └── getting-started.md   ← placeholder note
```

---

## Colors

All from `src/constants/colors.js`:
- File/folder text inactive: `rgba(255,255,255,0.55)`
- File/folder text hover: `#ffffff`
- Active file: `#8B5CF6`
- Folder icon: `rgba(255,255,255,0.4)`
- Modified indicator: `#EA6C0A`
- New/untracked indicator: `#22c55e`

---

## Rules

- Do not modify any existing tool pages or logic
- Do not modify `App.jsx` routing (only add `/notes/:section/:file` route)
- All new components follow the 200-line limit and JSDoc rule
- animate-ui component must be converted from TS to JS before use
- No Tailwind classes in any component file
