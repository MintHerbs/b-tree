# sidebar-drilldown-spec.md

## Overview

Two changes working together:
1. Split `math.md` and `C Programming.md` into individual topic `.md` files
2. Rebuild `ExpandedView.jsx` with breadcrumb + drill-down folder navigation

---

## Part 1 — File Structure After Split

```
src/content/notes/
├── math/
│   └── notes/
│       ├── determinant.md
│       ├── cofactor.md
│       ├── types-of-matrices.md
│       ├── properties-of-determinants.md
│       ├── simultaneous-equations.md
│       ├── inverse.md
│       ├── cramers-rule.md
│       ├── gauss-elimination.md
│       ├── lu-decomposition.md
│       ├── echelon-form.md
│       ├── rank.md
│       ├── system-of-linear-equations.md
│       ├── homogeneous-equations.md
│       ├── eigenvalues.md
│       ├── gauss-jacobi.md
│       └── gauss-seidel.md
└── operating-systems/
    └── labs/
        ├── introduction.md
        ├── data-types.md
        ├── operators.md
        ├── control-flow.md
        ├── functions.md
        ├── arrays.md
        ├── pointers.md
        ├── strings.md
        ├── structures.md
        └── file-io.md
```

Each split file keeps its original content from the parent `.md`.
The parent `math.md` and `C Programming.md` can be deleted after splitting.

---

## Part 2 — modules.js Updates

Update the `math` module notes array and `operating-systems` notes array:

```js
{
  id: 'computational-math',
  label: 'Computational Math',
  Icon: FunctionIcon,
  notes: [
    { filename: 'notes/determinant',               label: 'determinant.md' },
    { filename: 'notes/cofactor',                  label: 'cofactor.md' },
    { filename: 'notes/types-of-matrices',         label: 'types-of-matrices.md' },
    { filename: 'notes/properties-of-determinants',label: 'properties-of-determinants.md' },
    { filename: 'notes/simultaneous-equations',    label: 'simultaneous-equations.md' },
    { filename: 'notes/inverse',                   label: 'inverse.md' },
    { filename: 'notes/cramers-rule',              label: 'cramers-rule.md' },
    { filename: 'notes/gauss-elimination',         label: 'gauss-elimination.md' },
    { filename: 'notes/lu-decomposition',          label: 'lu-decomposition.md' },
    { filename: 'notes/echelon-form',              label: 'echelon-form.md' },
    { filename: 'notes/rank',                      label: 'rank.md' },
    { filename: 'notes/system-of-linear-equations',label: 'system-of-linear-equations.md' },
    { filename: 'notes/homogeneous-equations',     label: 'homogeneous-equations.md' },
    { filename: 'notes/eigenvalues',               label: 'eigenvalues.md' },
    { filename: 'notes/gauss-jacobi',              label: 'gauss-jacobi.md' },
    { filename: 'notes/gauss-seidel',              label: 'gauss-seidel.md' },
  ],
},
{
  id: 'operating-systems',
  label: 'Operating Systems',
  Icon: HardDrive,
  notes: [
    { filename: 'labs/introduction',  label: 'introduction.md' },
    { filename: 'labs/data-types',    label: 'data-types.md' },
    { filename: 'labs/operators',     label: 'operators.md' },
    { filename: 'labs/control-flow',  label: 'control-flow.md' },
    { filename: 'labs/functions',     label: 'functions.md' },
    { filename: 'labs/arrays',        label: 'arrays.md' },
    { filename: 'labs/pointers',      label: 'pointers.md' },
    { filename: 'labs/strings',       label: 'strings.md' },
    { filename: 'labs/structures',    label: 'structures.md' },
    { filename: 'labs/file-io',       label: 'file-io.md' },
  ],
},
```

The `noteRoute` helper in `modules.js` must produce:
`/notes/${moduleId}/${filename}` — e.g. `/notes/computational-math/notes/determinant`

Update `App.jsx` route to: `<Route path="/notes/:section/*" element={<NotesPage />} />`
And in `NotesPage.jsx` use `useParams()` + `*` wildcard to get the full subpath.

---

## Part 3 — Breadcrumb Abbreviations

```js
export const MODULE_ABBREV = {
  'home':                    'home',
  'computer-science':        'CS',        // root label
  'algorithms':              'Algo',
  'artificial-intelligence': 'AI',
  'database':                'DB',
  'computational-math':      'Math',
  'computer-architecture':   'CA',
  'computer-networking':     'CN',
  'computer-security':       'CompSec',
  'computer-vision':         'CV',
  'operating-systems':       'OS',
  'programming':             'Prog',
  'software-engineering':    'SEPM',
  'miscellaneous':           'Misc',
  'notes':                   'notes',
  'labs':                    'labs',
  'tools':                   'tools',
}
```

---

## Part 4 — Drill-Down Navigation in ExpandedView

### State
```js
// In Sidebar.jsx (or passed down as props):
const [navPath, setNavPath] = useState([])
// [] = root (shows all modules)
// ['computational-math'] = inside math module
// ['computational-math', 'notes'] = inside math/notes
```

### Breadcrumb rendering
```jsx
// Always shows at top of ExpandedView
<div className={styles.breadcrumb}>
  <span
    className={styles.breadcrumbItem}
    onClick={() => setNavPath([])}
  >
    home
  </span>
  <span className={styles.breadcrumbSep}>/</span>
  <span
    className={styles.breadcrumbItem}
    onClick={() => setNavPath([])}
  >
    CS
  </span>
  {navPath.map((segment, i) => (
    <>
      <span className={styles.breadcrumbSep}>/</span>
      <span
        key={segment}
        className={`${styles.breadcrumbItem} ${
          i === navPath.length - 1 ? styles.breadcrumbCurrent : ''
        }`}
        onClick={() => setNavPath(navPath.slice(0, i + 1))}
      >
        {MODULE_ABBREV[segment] ?? segment}
      </span>
    </>
  ))}
</div>
```

### Content rendering based on navPath depth

**Depth 0 — `navPath = []` (root)**
Show all modules exactly as today — the full `MODULES.map()` file tree.
The `Files` component from animate-ui renders as normal.

**Depth 1 — `navPath = ['computational-math']`**
Show only the contents of that module:
```jsx
const module = MODULES.find(m => m.id === navPath[0])
// Show two folder buttons: "notes" and "tools" (if they exist)
// Clicking "notes" → setNavPath([module.id, 'notes'])
// Clicking "tools" → setNavPath([module.id, 'tools'])
```

**Depth 2 — `navPath = ['computational-math', 'notes']`**
Show list of FileItems for all notes in that module:
```jsx
module.notes.map(n => (
  <FileItem
    key={n.filename}
    onClick={() => go(noteRoute(module.id, n.filename), 'notes')}
  >
    {n.label}
  </FileItem>
))
```

**Depth 2 — `navPath = ['computational-math', 'tools']`**
Show list of FileItems for all tools in that module.

### Module click at depth 0
When user clicks a module folder at root level, instead of the current
animate-ui accordion expand, call `setNavPath([module.id])` to drill in.
The animate-ui `FolderItem` accordion is replaced by simple click navigation
at depth 0.

Exception: standalone tools (`package.json`, `CPA Calculator.js`,
`Min Effort Max Result.js`) always show at root regardless of navPath.

### Back navigation
The breadcrumb handles back navigation — clicking any segment in the path
navigates to that depth. No separate back button needed.

---

## Breadcrumb CSS (add to ExpandedView.module.css)

```css
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 10px 10px;
  font-size: 11px;
  font-family: monospace;
  flex-wrap: wrap;
}
.breadcrumbItem {
  color: rgba(255,255,255,0.35);
  cursor: pointer;
  transition: color 0.15s ease;
  white-space: nowrap;
}
.breadcrumbItem:hover {
  color: rgba(255,255,255,0.75);
}
.breadcrumbCurrent {
  color: rgba(255,255,255,0.65);
  cursor: default;
}
.breadcrumbCurrent:hover {
  color: rgba(255,255,255,0.65);
}
.breadcrumbSep {
  color: rgba(255,255,255,0.2);
}
```

---

## NotesPage route update

Route in `App.jsx`:
```jsx
<Route path="/notes/:section/*" element={<NotesPage />} />
```

In `NotesPage.jsx`:
```js
const { section } = useParams()
const subpath = useParams()['*']  // e.g. "notes/determinant"
```

---

## Implementation Prompts

### Prompt 1 — Split math.md (Claude Code)
> Read `src/content/notes/math/notes/math.md` in full. Split it into 16 individual
> `.md` files in `src/content/notes/math/notes/`. Each file contains the content
> from one `## heading` section. File names:
> `determinant.md`, `cofactor.md`, `types-of-matrices.md`,
> `properties-of-determinants.md`, `simultaneous-equations.md`, `inverse.md`,
> `cramers-rule.md`, `gauss-elimination.md`, `lu-decomposition.md`,
> `echelon-form.md`, `rank.md`, `system-of-linear-equations.md`,
> `homogeneous-equations.md`, `eigenvalues.md`, `gauss-jacobi.md`,
> `gauss-seidel.md`. Each file starts with the `## heading` line and includes
> all content until the next `## heading` or end of file. Keep the shared header
> (title, author line) only in `determinant.md` as the first file. After confirming
> all 16 files are created correctly, delete `math.md`.

### Prompt 2 — Split C Programming.md (Claude Code)
> Read `src/content/notes/operating-systems/labs/C Programming.md` in full.
> Split into individual `.md` files in the same directory, one per major section.
> Name them based on the section headings. After confirming all files are created,
> delete `C Programming.md`.

### Prompt 3 — Update modules.js
> Read `sidebar-drilldown-spec.md` Part 2. Update `src/components/layout/Sidebar/modules.js`
> to replace the `computational-math` and `operating-systems` module entries with the
> full notes arrays listed in the spec. Add `MODULE_ABBREV` export from Part 3.
> Update `noteRoute` to produce `/notes/${moduleId}/${filename}`.
> Do not change any other module entries.

### Prompt 4 — Update App.jsx route + NotesPage params
> In `App.jsx`, change the notes route from
> `path="/notes/:section/:subfolder/:file"` to `path="/notes/:section/*"`.
> In `NotesPage.jsx`, replace `useParams()` destructuring with:
> `const { section } = useParams(); const subpath = useParams()['*']`
> and update `noteKey` to `${section}/${subpath}`.
> Update the `import.meta.glob` pattern to
> `'../../content/notes/**/*.md'` if not already.
> Do not change anything else.

### Prompt 5 — Rebuild ExpandedView with drill-down + breadcrumb
> Read `sidebar-drilldown-spec.md` in full — specifically Part 3 and Part 4.
> In `ExpandedView.jsx`, add `navPath` and `setNavPath` props (passed from
> `Sidebar.jsx` which holds the state). Add the breadcrumb at the top using
> `MODULE_ABBREV` from `modules.js`. Replace the current animate-ui accordion
> root level with click-to-drill navigation: clicking a module folder calls
> `setNavPath([module.id])` instead of expanding an accordion. At depth 1,
> show two folder buttons for `notes` and `tools`. At depth 2, show FileItems
> for that subfolder's contents. Standalone tools always render at root.
> Add breadcrumb CSS to `ExpandedView.module.css`. Do not change
> `CollapsedView.jsx`, `Sidebar.module.css`, or `modules.js`.
