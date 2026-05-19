# notes-virtualized-spec.md — Virtualized Section Rendering

## Overview

Replace the current monolithic markdown render with a virtualized card-based
section renderer. Only visible sections are KaTeX-rendered. TOC is hardcoded
per note. Previous sections stay rendered up to a 3-section window.

---

## Architecture

```
src/
├── content/
│   └── notes/
│       ├── toc/
│       │   ├── math.js              ← hardcoded TOC for math.md
│       │   └── c-programming.js     ← hardcoded TOC for C Programming.md
│       ├── math/notes/math.md
│       └── operating-systems/labs/C Programming.md
├── pages/
│   └── NotesPage.jsx                ← rebuilt with virtualization
├── components/
│   └── notes/
│       ├── SectionCard/
│       │   ├── SectionCard.jsx      ← single rendered section card
│       │   └── SectionCard.module.css
│       └── NotesDrawer/
│           ├── NotesDrawer.jsx      ← TOC drawer (click to open)
│           └── NotesDrawer.module.css
```

---

## TOC File Format

Each note gets a static `.js` file in `src/content/notes/toc/`.
This file lists every H2 section with its anchor slug and optional subtitle.

```js
// src/content/notes/toc/math.js
export const toc = [
  { id: 'determinant',          title: 'Determinant',              subtitle: 'Minors & cofactors' },
  { id: 'cofactor',             title: 'Cofactor',                 subtitle: 'Rules & computation' },
  { id: 'types-of-matrices',    title: 'Types of Matrices',        subtitle: 'Diagonal, identity, triangular' },
  { id: 'determinant-3x3',      title: 'Determinant (3×3)',        subtitle: 'Step-by-step method' },
  { id: 'properties',           title: 'Properties of Determinants', subtitle: '10 rules' },
  { id: 'simultaneous-eq',      title: 'Simultaneous Equations',   subtitle: 'AX = B method' },
  { id: 'inverse',              title: 'Inverse of a Matrix',      subtitle: 'Cofactor & row reduction' },
  { id: 'cramers-rule',         title: "Cramer's Rule",            subtitle: 'Determinant method' },
  { id: 'gauss-elimination',    title: 'Gauss Elimination',        subtitle: 'Row operations' },
  { id: 'lu-decomposition',     title: 'LU Decomposition',         subtitle: "Crout's & Doolittle's" },
  { id: 'echelon-form',         title: 'Echelon Form',             subtitle: 'REF & RREF' },
  { id: 'rank',                 title: 'Rank',                     subtitle: 'Linear independence' },
  { id: 'system-linear-eq',     title: 'System of Linear Equations', subtitle: 'Solvability conditions' },
  { id: 'homogeneous',          title: 'Homogeneous Equations',    subtitle: 'Trivial & non-trivial' },
  { id: 'eigenvalues',          title: 'Eigenvalues & Eigenvectors', subtitle: 'Characteristic equation' },
  { id: 'gauss-jacobi',         title: 'Gauss-Jacobi Method',      subtitle: 'Iterative solution' },
  { id: 'gauss-seidel',         title: 'Gauss-Seidel Method',      subtitle: 'Faster convergence' },
]

export const meta = {
  title: 'Matrix',
  description: 'Computational Mathematics — Matrix operations and methods',
}
```

```js
// src/content/notes/toc/c-programming.js
export const toc = [
  { id: 'introduction',         title: 'Introduction to C',        subtitle: 'History & structure' },
  { id: 'data-types',           title: 'Data Types',               subtitle: 'int, float, char, etc.' },
  { id: 'operators',            title: 'Operators',                subtitle: 'Arithmetic & logical' },
  { id: 'control-flow',         title: 'Control Flow',             subtitle: 'if, for, while, switch' },
  { id: 'functions',            title: 'Functions',                subtitle: 'Declaration & definition' },
  { id: 'arrays',               title: 'Arrays',                   subtitle: '1D & 2D arrays' },
  { id: 'pointers',             title: 'Pointers',                 subtitle: 'Memory & dereferencing' },
  { id: 'strings',              title: 'Strings',                  subtitle: 'char arrays & functions' },
  { id: 'structs',              title: 'Structures',               subtitle: 'Custom data types' },
  { id: 'file-io',              title: 'File I/O',                 subtitle: 'fopen, fread, fwrite' },
]

export const meta = {
  title: 'C Programming',
  description: 'Operating Systems Lab — C language fundamentals',
}
```

---

## TOC Registry

One central registry maps note keys to their TOC files:

```js
// src/content/notes/toc/index.js
import { toc as mathToc, meta as mathMeta } from './math'
import { toc as cToc, meta as cMeta } from './c-programming'

export const TOC_REGISTRY = {
  'math/notes/math':                          { toc: mathToc, meta: mathMeta },
  'operating-systems/labs/C Programming':     { toc: cToc,   meta: cMeta },
}
```

---

## Section Parsing

The markdown is split into sections by H2 headings (`## heading`).
Each section's content is the H2 line plus all lines until the next H2 or end of file.
The section ID is derived from the H2 text — lowercased, spaces replaced with `-`.

```js
function splitIntoSections(markdown) {
  const lines = markdown.split('\n')
  const sections = []
  let current = { id: null, heading: null, content: [] }

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/)
    if (h2) {
      if (current.id) sections.push(current)
      const title = h2[1]
      const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      current = { id, heading: title, content: [line] }
    } else {
      current.content.push(line)
    }
  }
  if (current.id) sections.push(current)
  return sections
}
```

Sections are stored in state as `{ id, heading, content: string }` objects.
Content is only passed to `MarkdownRenderer` when the section is visible.

---

## Rendering Window

At any time, only sections within the render window are fully rendered:

```
rendered = sections where abs(index - activeIndex) <= 2
```

- Active section: fully rendered
- 1 section above: fully rendered (scroll back is instant)
- 1 section below: fully rendered (pre-renders before scroll reaches it)
- 2 sections above/below: rendered but may be slightly stale
- Everything else: renders a placeholder skeleton only

The placeholder skeleton:
```jsx
<div className={styles.skeleton}>
  <div className={styles.skeletonHeading} />
  <div className={styles.skeletonLine} />
  <div className={styles.skeletonLine} style={{ width: '80%' }} />
  <div className={styles.skeletonLine} style={{ width: '65%' }} />
</div>
```

---

## SectionCard Component

Each section renders as a card:

```jsx
function SectionCard({ section, isActive, isRendered, cardRef }) {
  return (
    <div
      id={section.id}
      ref={cardRef}
      className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
    >
      {isRendered
        ? <MarkdownRenderer content={section.content} />
        : <SkeletonPlaceholder />
      }
    </div>
  )
}
```

### Card CSS
```css
.card {
  background: #161311;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 40px 48px;
  margin-bottom: 24px;
  transition: border-color 0.2s ease;
}
.cardActive {
  border-color: rgba(139,92,246,0.25);
  box-shadow: 0 0 0 1px rgba(139,92,246,0.08);
}
.skeleton {
  padding: 8px 0;
}
.skeletonHeading {
  width: 40%;
  height: 28px;
  background: rgba(255,255,255,0.04);
  border-radius: 6px;
  margin-bottom: 16px;
  animation: pulse 1.5s ease-in-out infinite;
}
.skeletonLine {
  width: 100%;
  height: 14px;
  background: rgba(255,255,255,0.03);
  border-radius: 4px;
  margin-bottom: 10px;
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
```

---

## NotesDrawer Component

Click-based TOC drawer. Opens from the right.

```jsx
function NotesDrawer({ toc, meta, activeId, onNavigate, isOpen, onClose }) {
  return (
    <>
      {isOpen && <div className={styles.backdrop} onClick={onClose} />}
      <div className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>{meta.title}</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <nav className={styles.nav}>
          {toc.map((item) => (
            <button
              key={item.id}
              className={`${styles.item} ${activeId === item.id ? styles.itemActive : ''}`}
              onClick={() => { onNavigate(item.id); onClose(); }}
            >
              <span className={styles.itemTitle}>{item.title}</span>
              {item.subtitle && (
                <span className={styles.itemSubtitle}>{item.subtitle}</span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}
```

### Drawer CSS
```css
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 53;
  background: rgba(0,0,0,0.4);
}
.drawer {
  position: fixed;
  right: 0;
  top: 0;
  width: 300px;
  height: 100vh;
  background: #100e0c;
  border-left: 1px solid rgba(255,255,255,0.07);
  z-index: 54;
  padding: 24px 0;
  overflow-y: auto;
  transform: translateX(100%);
  transition: transform 0.18s ease;
}
.drawerOpen {
  transform: translateX(0);
}
.drawerHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  margin-bottom: 12px;
}
.drawerTitle {
  color: #8B5CF6;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.closeBtn {
  color: rgba(255,255,255,0.3);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: color 0.15s ease;
}
.closeBtn:hover { color: #fff; }
.nav {
  display: flex;
  flex-direction: column;
  padding: 0 12px;
  gap: 2px;
}
.item {
  display: flex;
  flex-direction: column;
  text-align: left;
  padding: 10px 12px;
  border-radius: 8px;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
}
.item:hover { background: rgba(255,255,255,0.04); }
.itemActive { background: rgba(139,92,246,0.12); }
.itemTitle {
  color: rgba(255,255,255,0.75);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
}
.itemActive .itemTitle { color: #8B5CF6; }
.itemSubtitle {
  color: rgba(255,255,255,0.3);
  font-size: 11px;
  margin-top: 2px;
}
```

---

## NotesPage.jsx Structure

```jsx
function NotesPage() {
  const { section, file } = useParams()
  const [markdown, setMarkdown] = useState('')
  const [status, setStatus] = useState('idle')
  const [sections, setSections] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const cardRefs = useRef({})

  // Load markdown
  useEffect(() => { /* same glob import as before */ }, [section, file])

  // Split into sections when markdown loads
  useEffect(() => {
    if (!markdown) return
    const parsed = splitIntoSections(markdown)
    setSections(parsed)
    if (parsed.length > 0) setActiveId(parsed[0].id)
  }, [markdown])

  // Intersection Observer — updates activeId as user scrolls
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            setActiveId(entry.target.id)
          }
        })
      },
      { threshold: [0.3], rootMargin: '-15% 0px -60% 0px' }
    )
    Object.values(cardRefs.current).forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [sections])

  // Compute render window
  const activeIndex = sections.findIndex(s => s.id === activeId)
  const renderedIds = new Set(
    sections
      .filter((_, i) => Math.abs(i - activeIndex) <= 2)
      .map(s => s.id)
  )

  // Navigate to section
  const navigateTo = (id) => {
    setActiveId(id)
    const el = cardRefs.current[id]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Get TOC from registry
  const noteKey = `${section}/${file}`
  const tocData = TOC_REGISTRY[noteKey]

  return (
    <div className={styles.page}>
      {/* Hamburger button */}
      <button
        className={styles.hamburger}
        onClick={() => setDrawerOpen(true)}
        aria-label="Open table of contents"
      >
        ☰
      </button>

      {/* TOC Drawer */}
      {tocData && (
        <NotesDrawer
          toc={tocData.toc}
          meta={tocData.meta}
          activeId={activeId}
          onNavigate={navigateTo}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      )}

      {/* Notes content */}
      <div className={styles.content}>
        {status === 'loading' && <p>Loading...</p>}
        {status === 'not_found' && <p>Note not found.</p>}
        {status === 'loaded' && sections.map(section => (
          <SectionCard
            key={section.id}
            section={section}
            isActive={section.id === activeId}
            isRendered={renderedIds.has(section.id)}
            cardRef={el => cardRefs.current[section.id] = el}
          />
        ))}
      </div>
    </div>
  )
}
```

### Page CSS
```css
.page {
  position: relative;
  min-height: 100vh;
  padding: 60px 32px 80px calc(76px + 32px); /* sidebar offset */
}
.content {
  max-width: 860px;
  margin: 0 auto;
}
.hamburger {
  position: fixed;
  right: 2rem;
  top: 70px;
  width: 40px;
  height: 40px;
  background: rgba(22,19,17,0.95);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  color: rgba(255,255,255,0.4);
  font-size: 16px;
  cursor: pointer;
  z-index: 52;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.hamburger:hover {
  color: #8B5CF6;
  border-color: rgba(139,92,246,0.4);
}
```

---

## Implementation Prompts

### Prompt 1 — Create TOC files
> Create these three files exactly as shown in the spec:
> `src/content/notes/toc/math.js` (17 entries),
> `src/content/notes/toc/c-programming.js` (10 entries),
> `src/content/notes/toc/index.js` (registry).

### Prompt 2 — SectionCard component
> Create `src/components/notes/SectionCard/SectionCard.jsx` and
> `SectionCard.module.css` exactly as shown in the spec. The component
> receives `{ section, isActive, isRendered, cardRef }`. When `isRendered`
> is false it shows the skeleton. When true it renders
> `<MarkdownRenderer content={section.content} />`.

### Prompt 3 — NotesDrawer component
> Create `src/components/notes/NotesDrawer/NotesDrawer.jsx` and
> `NotesDrawer.module.css` exactly as shown in the spec. Click-based,
> slides in from right via `transform: translateX`, closes on backdrop
> click or item click.

### Prompt 4 — Rebuild NotesPage
> Read `notes-virtualized-spec.md` in full. Rebuild `src/pages/NotesPage.jsx`
> using the structure shown. Import `TOC_REGISTRY` from
> `src/content/notes/toc/index.js`, `SectionCard` from
> `src/components/notes/SectionCard/SectionCard`, `NotesDrawer` from
> `src/components/notes/NotesDrawer/NotesDrawer`. Use `import.meta.glob`
> for markdown loading. Implement `splitIntoSections`, render window logic,
> and IntersectionObserver for active section tracking. Replace
> `NotesPage.module.css` with the page CSS from the spec.
> Remove all old TOC sidebar, progressive disclosure, and section parsing
> logic. Do not touch `MarkdownRenderer` or any other component.
