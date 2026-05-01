# B+ Tree Visualizer — Updated Project Specification

## Overview

A Grok-inspired multi-tool landing page with an animated starfield background. The left sidebar
lets users switch between three tools: B+ Tree Visualizer, ER Diagram Builder (placeholder),
and an external Calculator. The center shows a large heading and a pill-shaped input. All UI
is component-based, dark-themed, and hosted on Vercel.

This document **replaces** the previous LandingPage section of the spec. The `/tree` page and
all B+ tree logic (BPlusTree.js, AnimationEngine.js, treeLayout.js, hooks, TreeCanvas, etc.)
remain unchanged from the original claude.md.

---

## Color Palette

| Token            | Value     | Usage                                      |
|------------------|-----------|--------------------------------------------|
| `--color-bg`     | `#000000` | Page background                            |
| `--color-accent` | `#7148D4` | Replaces white — headings, active states, subtitle text, send button, hover glows |
| `--color-star`   | `#ffffff` | Starfield dots only                        |
| `--color-muted`  | `#555555` | Inactive sidebar icons, input placeholder  |
| `--color-surface`| `#0f0f0f` | Pill input background                      |
| `--color-border` | `#222222` | Pill input border                          |

No other colours. Do not introduce greys, blues, or purples outside of the tokens above.

---

## Updated Project Structure

```
src/
├── main.jsx
├── App.jsx
│
├── pages/
│   ├── LandingPage.jsx         # REPLACED — now uses the new layout below
│   └── TreePage.jsx            # Unchanged
│
├── components/
│   │
│   ├── Starfield/
│   │   ├── Starfield.jsx       # Full-screen canvas starfield animation
│   │   └── Starfield.module.css
│   │
│   ├── Sidebar/
│   │   ├── Sidebar.jsx         # Left icon rail
│   │   └── Sidebar.module.css
│   │
│   ├── SidebarIcon/
│   │   ├── SidebarIcon.jsx     # Single icon slot with hover tooltip + on/off SVG swap
│   │   └── SidebarIcon.module.css
│   │
│   ├── HeroText/
│   │   ├── HeroText.jsx        # Large heading + subtitle, updates per active tool
│   │   └── HeroText.module.css
│   │
│   ├── PillInput/
│   │   ├── PillInput.jsx       # Pill-shaped text input with conditional send button
│   │   └── PillInput.module.css
│   │
│   └── Navbar/                 # Existing — keep the top-right "About" link as-is
│
├── img/
│   ├── moon.svg                # Logo — top of sidebar, links to LinkedIn
│   ├── btree_off.svg
│   ├── btree_on.svg
│   ├── erd_off.svg
│   ├── erd_on.svg
│   ├── calculator_off.svg
│   └── calculator_on.svg
│
└── styles/
    └── global.css              # Add the new CSS tokens listed above
```

---

## Component Specifications

### Starfield.jsx

- Renders a `<canvas>` element, `position: fixed`, `inset: 0`, `z-index: 0`, pointer-events none.
- On mount, generate **180 stars** with random `x`, `y`, `radius` (0.5–2px), and `speed` (0.05–0.3).
- Each frame (via `requestAnimationFrame`), move each star upward by its speed value.
  When a star exits the top, reset it to the bottom at a new random `x`.
- Stars are drawn as filled white circles (`#ffffff`) with no glow or blur.
- Handle window resize: re-read `canvas.width/height` and redistribute stars.
- This component is imported once in `LandingPage.jsx` and sits behind everything via z-index.

### Sidebar.jsx

- Fixed to the left edge of the viewport. Width: `56px`. Full viewport height.
- Background: transparent (starfield shows through). A very subtle right border: `1px solid #1a1a1a`.
- Contains three sections stacked vertically using flex column + space-between:
  1. **Top**: the Moon logo icon (not a SidebarIcon — special case, see below).
  2. **Middle**: the three tool SidebarIcon components (BTree, ERD, Calculator), grouped together.
  3. **Bottom**: empty / reserved for future use.

**Moon logo (top of sidebar)**
- Renders `moon.svg` as an `<img>` tag, width `28px`.
- Wrapped in an `<a href="https://www.linkedin.com/in/offrian/" target="_blank" rel="noreferrer">`.
- No tooltip. No hover swap — the moon SVG is always visible as-is.
- Subtle hover: `opacity` transitions from `0.7` to `1.0`.

### SidebarIcon.jsx

Props:
```js
{
  iconOff: string,       // path to the _off SVG
  iconOn: string,        // path to the _on SVG
  tooltip: string,       // text shown on hover
  isActive: boolean,     // whether this tool is currently selected
  onClick: () => void    // click handler
}
```

Behaviour:
- Default state: shows `iconOff` SVG. Icon appears at `opacity: 0.5`.
- Hover state: swaps to `iconOn` SVG, opacity goes to `1.0`, shows tooltip.
- Active state (`isActive = true`): always shows `iconOn` SVG at full opacity. A small
  `3px` vertical bar in `#7148D4` appears on the left edge of the icon slot.
- Tooltip: absolutely positioned to the right of the icon, `left: 60px`, vertically centred.
  White text (`#fff`) on a dark pill background (`#1c1c1c`), `border-radius: 6px`, `padding: 4px 10px`.
  Appears on hover with an `opacity 0.15s ease` transition. Never wraps (`white-space: nowrap`).
- Icon image size: `22px × 22px`.
- All transitions use `transition: opacity 0.15s ease`.

Tooltip labels:
- BTree icon → `"B+ Tree Visualizer"`
- ERD icon → `"ER Diagram Builder"`
- Calculator icon → `"Calculator"`

### HeroText.jsx

Props:
```js
{ activeTool: 'btree' | 'erd' }
```

Renders two lines, centered:
1. A large `<h1>` title in `#7148D4`.
2. A smaller subtitle in `#7148D4` at reduced opacity (`0.65`).

Content per tool:

| activeTool | h1 title               | subtitle                                      |
|------------|------------------------|-----------------------------------------------|
| `'btree'`  | `B+ Tree Visualizer`   | `insert your values separated by a comma`     |
| `'erd'`    | `ER Diagram Builder`   | `describe your entities and relationships`    |

Text transition: when `activeTool` changes, the text fades out (`opacity: 0`) then fades back
in (`opacity: 1`) over `200ms`. Achieve this by toggling a CSS class or changing the `key` prop.

Font sizes:
- `h1`: `clamp(2.2rem, 5vw, 3.8rem)`, font-weight `700`.
- Subtitle: `clamp(0.9rem, 2vw, 1.15rem)`, font-weight `400`.

### PillInput.jsx

Props:
```js
{
  activeTool: 'btree' | 'erd',
  onSubmit: (value: string) => void
}
```

Visual structure (pill shape, `border-radius: 9999px`):
```
[ (padding)  (text input flex: 1)  (send button — only when value.length > 0) ]
```

- Background: `#0f0f0f`. Border: `1px solid #222`. Width: `min(680px, 90vw)`.
- Height: `56px`. Padding: `14px 20px`.
- **Placeholder text**: `"banana, 67, 69, cabbage, moon..."` — same regardless of active tool.
- Input text colour: `#ffffff`. Caret colour: `#7148D4`.
- No border-radius changes on focus — keep pill shape always.
- On focus: border colour transitions to `#7148D4` with `box-shadow: 0 0 0 2px rgba(113,72,212,0.25)`.

**Send button** (visible only when `input.value.length > 0`):
- A filled circle, diameter `32px`, background `#7148D4`.
- Contains a right-pointing arrow chevron (inline SVG, white, `16px`).
- Appears with a `transform: scale(0) → scale(1)` transition over `150ms ease`.
- On click: calls `onSubmit(value)`, then clears the input.
- Also triggers on `Enter` key press.

---

## LandingPage.jsx — Layout & Logic

```
<div class="landing">               ← position: relative, width: 100vw, height: 100vh, overflow: hidden
  <Starfield />                     ← z-index: 0, fixed, behind everything
  <Sidebar                          ← z-index: 10, fixed left
    activeTool={activeTool}
    onToolChange={handleToolChange}
  />
  <Navbar />                        ← z-index: 10, fixed top-right ("About" link only)
  <main class="center">             ← z-index: 5, centered, margin-left: 56px
    <HeroText activeTool={activeTool} />
    <PillInput activeTool={activeTool} onSubmit={handleSubmit} />
  </main>
</div>
```

**State in LandingPage:**
```js
const [activeTool, setActiveTool] = useState('btree')
```

**Tool switching logic (`handleToolChange`):**
- `'btree'`: sets `activeTool = 'btree'`. Updates HeroText and PillInput.
- `'erd'`: sets `activeTool = 'erd'`. Updates HeroText. PillInput stays visible.
- `'calculator'`: calls `window.open('https://lazy-grades.vercel.app/', '_blank')` immediately.
  Does NOT change `activeTool`. Calculator is never the "active" state visually.

**Submit logic (`handleSubmit`):**
- If `activeTool === 'btree'`: parse value as CSV, trim each item, filter empty strings,
  navigate to `/tree` via React Router `useNavigate` with the values array in `location.state`.
- If `activeTool === 'erd'`: show a toast notification `"ER Diagram builder coming soon!"`.
  Toast is a small `<div>` that fades in, stays for `2500ms`, then fades out.
  Position it `bottom: 32px, left: 50%, transform: translateX(-50%)`. Style: dark pill,
  `#7148D4` text, border `1px solid #7148D4`.

**Center layout:**
- `main.center` uses flex column, `align-items: center`, `justify-content: center`, `gap: 28px`.
  It fills the full viewport minus the 56px sidebar.

---

## Navbar Update

On the `/` landing route, the Navbar renders only the `"About"` text link:
- `position: fixed`, `top: 16px`, `right: 24px`, `z-index: 10`.
- Colour: `#7148D4`. Hover: underline.
- Remove all other navbar items from the landing page view.
- The full Navbar (with Reset button etc.) only appears on `/tree`.

---

## Responsive Behaviour

| Breakpoint | Behaviour                                                                    |
|------------|------------------------------------------------------------------------------|
| `< 640px`  | Sidebar collapses to `40px` wide. Icons shrink to `18px`. Tooltips hidden.  |
| `< 480px`  | HeroText `h1` drops to `1.8rem`. PillInput becomes `95vw`.                  |

---

## Files to Leave Untouched

Everything inside `src/lib/`, `src/engine/`, `src/hooks/`, and all existing tree components
(`TreeCanvas`, `TreeNode`, `TreeEdge`, `PointerArrow`, `OperationsPanel`, `StepControls`)
must not be modified. This spec only touches the landing page layer.

---

## Vercel / Build

No changes to `vercel.json` or `vite.config.js` needed.
