# design.md — Mooner.dev Design Decisions

This file is a living document. Every significant design decision made in this project
is recorded here so future prompts to Kiro or Claude Code have full context.
Update this file whenever a new decision is made.

---

## Color Palette

| Token              | Value       | Usage                                                                  |
|--------------------|-------------|------------------------------------------------------------------------|
| `--color-bg`       | `#000000`   | Page background everywhere                                             |
| `--color-accent`   | `#8B5CF6`   | Primary purple — headings, buttons, active states, borders             |
| `--color-orange`   | `#EA6C0A`   | Secondary accent — Database and Logic group active states              |
| `--color-star`     | `#ffffff`   | Starfield dots only                                                    |
| `--color-muted`    | `#555555`   | Inactive icons, secondary text                                         |
| `--color-surface`  | `#0f0f0f`   | Input backgrounds, card surfaces                                       |
| `--color-border`   | `#222222`   | Subtle borders                                                         |
| `--color-error`    | `#ef4444`   | Error states only                                                      |
| `--color-success`  | `#22c55e`   | Online indicator dot only                                              |

**Rule:** No new colours without updating this table first.
**Rule:** Dynamic Island pill is always `#000` — never purple or orange.
**Rule:** Orange (`#EA6C0A`) is used exclusively for primary nav group active states.
**Rule:** Purple (`#8B5CF6`) is used for child tool active states within groups.

---

## Typography

- Font stack: system font (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`)
- Monospace: used inside code blocks and prompt output only
- Hero headings: `clamp(2.2rem, 5vw, 3.8rem)`, `font-weight: 700`, colour `#8B5CF6`
- Subtitles: `clamp(0.9rem, 2vw, 1.15rem)`, `font-weight: 400`, `rgba(255,255,255,0.55)`
- Body: `#fff` or `rgba(255,255,255,0.8)`
- Hints/labels: `rgba(255,255,255,0.35)`, `font-size: 0.7rem`

---

## Component Library

**SmoothUI** (`npx smoothui-cli add <component>`) is the chosen component library.
Installed components:
- `glow-hover-card` (used for ERD AI choice cards)
- `grid-loader` (used in Dynamic Island AI states)

**Motion/React** (`motion/react`) is used for all animations. Do NOT use Framer Motion.
Do NOT use GSAP. All other animations use CSS transitions.

**Lucide React** (`lucide-react`) is used for all icons unless a custom SVG is specified.

---

## Sidebar Navigation System

### Architecture

The sidebar is a two-level navigation system:
- **Primary icons** — top-level group toggles (Database, Logic)
- **Child icons** — expand below their parent when the group is open
- Only one group can be open at a time

The moon logo at the top is NOT a nav item — it links to LinkedIn only.

### Primary Groups

| Group      | Icon source                              | Active colour | Status      |
|------------|------------------------------------------|---------------|-------------|
| Database   | `src/img/left nav/Database_off/on.svg`   | `#EA6C0A`     | Active      |
| Logic      | `src/img/left nav/Logic_off/on.svg`      | `#EA6C0A`     | Placeholder |
| More Tools | `src/img/left nav/Down_off/on.svg`       | `#EA6C0A`     | Active      |

### Child Icons — Database group

| Child   | Off SVG              | On SVG              | Active colour | Route  |
|---------|----------------------|---------------------|---------------|--------|
| B+ Tree | `src/img/btree_off.svg` | `src/img/btree_on.svg` | `#8B5CF6` | `/tree` |
| ERD     | `src/img/erd_off.svg`   | `src/img/erd_on.svg`   | `#8B5CF6` | `/erd`  |

### Child Icons — Logic group

| Child               | Lucide icon  | Route                  |
|---------------------|--------------|------------------------|
| English to Logic    | `Languages`  | `/logic/translate`     |
| Logical Equivalence | `GitBranch`  | `/logic/proof`         |
| Semantic Tableaux   | `Table2`     | `/logic/tableaux`      |
| Resolution Method   | `Layers`     | `/logic/resolution`    |

### Child Icons — More Tools group

| Child          | Off SVG                      | On SVG                     | Active colour | Action                                      |
|----------------|------------------------------|----------------------------|---------------|---------------------------------------------|
| GPA Calculator | `src/img/calculator_off.svg` | `src/img/calculator_on.svg`| `#EA6C0A`     | Opens `https://lazy-grades.vercel.app/`     |

**Note:** More Tools group uses Down icon as the parent icon. When expanded, it reveals the GPA Calculator child icon.

### Expand / Collapse Behaviour

- Clicking a primary icon toggles its group open/closed
- When a group opens, a `2px` horizontal line in `#EA6C0A` appears directly below
  the primary icon as a visual separator
- Child icons animate in with `motion/react` spring: `stiffness: 300, damping: 25`
- Clicking an already-open primary icon collapses it
- Opening one group automatically closes the other

### Default State on Load

On first load: Database group is open, B+ Tree child is active, route is `/tree`.
Implemented via `defaultOpenGroup="database"` prop on `Sidebar` — this prop can be
set to `null` later when a dedicated landing page is added.

---

## Sidebar Component Structure

```
src/components/layout/
└── Sidebar/
    ├── Sidebar.jsx              ← root, manages openGroup state
    ├── Sidebar.module.css
    ├── NavGroup/
    │   ├── NavGroup.jsx         ← one collapsible group (parent + animated children)
    │   └── NavGroup.module.css
    ├── NavGroupIcon/
    │   ├── NavGroupIcon.jsx     ← primary (parent) icon button
    │   └── NavGroupIcon.module.css
    └── NavChildIcon/
        ├── NavChildIcon.jsx     ← child icon with tooltip + on/off SVG
        └── NavChildIcon.module.css
```

`SidebarIcon` (old component) is retired and replaced by `NavChildIcon`.
`NavChildIcon` accepts the same props as `SidebarIcon` plus an `activeColor` prop.

---

## Layout System

**All pages:**
- Sidebar: `56px` wide, `#000` solid, fixed left, `z-index: 10`
- Starfield: fullscreen background, `z-index: 0`
- Content area: `margin-left: 56px`

**Tree page (`/tree`):**
- Navbar: `#000`, `1px solid #1a1a1a` bottom border
- OperationsPanel: `280px` fixed right
- StepControls: fixed bottom, full width
- TreeCanvas: fills remaining space

**ERD page (`/erd`):**
- Global sidebar still shows
- Navbar: About link only, top-right
- Content centered

---

## Dynamic Island

**Positioning:** Fixed wrapper `100vw` wide at `top: 16px`, flex center.

**States:**
1. `idle` — small pill, green dot only
2. `hover` — same width, online count text fades in
3. `music` — expanded music player
4. `observing` — blue pulse GridLoader + "Observing"
5. `waiting` — white stagger GridLoader + "Waiting"
6. `thinking` — amber stagger GridLoader + "Thinking"
7. `generating` — blue pulse GridLoader + "Generating"
8. `error` — red dot + message, auto-collapses after 3s

**Pill colour:** Always `#000`. Box-shadow is the only separator from black background.

---

## Routing

| Path          | Page            | Description                                    |
|---------------|-----------------|------------------------------------------------|
| `/`           | Navigate        | Redirects to `/tree` (default route)           |
| `/tree`       | TreePage        | B+ Tree visualizer                             |
| `/erd`        | ERDPage         | ERD builder (3-step flow)                      |
| `/about`      | AboutPage       | About page with personal story                 |
| `/disclaimer` | DisclaimerPage  | Open source info and usage warnings            |

**Note:** LandingPage component exists but only redirects to `/tree`. It will be replaced with a neutral landing page in the future.

---

## API Call Tracking

**Table:** `api_calls` in Supabase. **Limit:** 10 per session. **Reset:** 24 hours.

---

## Gemini API

- Model: `gemini-2.0-flash-lite`
- Key: `VITE_GEMINI_API_KEY` in `.env`
- Called from frontend via `@google/generative-ai`

---

## Modularity Rules

- Every feature = new folder with `Component.jsx` + `Component.module.css`
- No logic in page files — pages compose components only
- Pure functions in `src/lib/`, hooks in `src/hooks/`
- No file exceeds 200 lines
- Shared primitives in `src/components/ui/`

---

## Files That Must Never Be Modified

`BPlusTree.js`, `AnimationEngine.js`, `treeLayout.js`, `useBPlusTree.js`,
`useAnimationPlayer.js`, `TreeCanvas.jsx`, `TreeNode.jsx`, `TreeEdge.jsx`,
`PointerArrow.jsx`, `OperationsPanel.jsx`, `StepControls.jsx`,
`Starfield.jsx`, `MusicPlayer.jsx`, `geminiService.js`, `erdParser.js`,
`erdPromptBuilder.js`, `erdLayout.js`.

---

## Decisions Log

| Date | Decision | Reason |
|---|---|---|
| Session 1 | Vite + React | Vercel hosting, web-only |
| Session 1 | CSS Modules | No Tailwind compiler needed |
| Session 2 | `#8B5CF6` accent | Better contrast on black than `#7148D4` |
| Session 2 | Pill centering via 100vw wrapper | `motion layout` breaks `translateX(-50%)` |
| Session 3 | Supabase direct from frontend | Anon key is safe, no backend needed |
| Session 3 | YouTube IFrame API via script tag | No npm package, universal support |
| Session 4 | ERD layout full rewrite | Original produced constellation, not diagram |
| Session 5 | Gemini 2.0 Flash Lite | Separate quota pool from Flash |
| Session 5 | 10 calls per session | Limits API abuse without login requirement |
| Session 6 | Two-level sidebar nav | Scales cleanly as more tools are added |
| Session 6 | `#EA6C0A` orange for group active states | Complements purple, signals tool category |
| Session 6 | Default route `/tree` not `/` | B+ Tree is current primary tool |
| Session 6 | Calculator removed from sidebar | Will be re-added under future Tools group |
| Session 7 | New Sidebar component structure | Modular NavGroup/NavGroupIcon/NavChildIcon for maintainability |
| Session 7 | Motion/react spring animations for nav | Smooth, physics-based expand/collapse (stiffness: 300, damping: 25) |
| Session 7 | Alert for Logic tools placeholder | No toast library installed, simple native alert |
| Session 7 | Logic icon uses on/off SVG swap | NavGroupIcon conditionally renders logicOn/logicOff based on isOpen |

| Session 8 | Logic tools fully implemented | Four tools: translate (LLM), proof (stub), tableaux (pure JS), resolution (pure JS) |
| Session 8 | Formula parser with recursive descent | Standard propositional logic grammar with operator precedence |
| Session 8 | Tableaux engine pure JavaScript | No LLM needed, deterministic algorithm from Smullyan's textbook |
| Session 8 | Resolution engine with CNF conversion | Robinson's resolution principle (1965), pure JavaScript |
| Session 8 | LogicInputPage shared component | Consistent UX across all four logic tools with ScrambleText animations |
| Session 8 | SymbolBar custom component | No external dependencies, uses setRangeText() API for cursor insertion |
| Session 8 | RulesPanel collapsible reference | Slides in from right, shows α/β rules for tableaux |
| Session 8 | LogicStepControls separate component | Same pattern as tree StepControls but not imported (separate file) |
| Session 8 | TableauxCanvas with pan/zoom | SVG renderer with automatic layout, closed (✗) and open (○) markers |
| Session 8 | ResolutionCanvas with V-connectors | Knowledge base panel + V-diagram, empty clause as ⊥ in red |
| Session 8 | Generic callGeminiWithParser() | Accepts any parser function, refactored existing callGemini() |
| Session 8 | Logic group navigation updated | Added Languages icon for translate tool, removed toast alerts |
