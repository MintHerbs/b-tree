# B+ Tree Visualizer — Project Specification

## Overview

An interactive, animated B+ tree visualizer built for students learning tree data structures.
Users paste a comma-separated list of values (numbers or strings), watch the tree animate
step-by-step as it builds, and then continue inserting or deleting values with animated
feedback. Hosted on Vercel.

---

## Stack

| Layer       | Choice                          |
|-------------|----------------------------------|
| Framework   | React 18 (JavaScript, not TypeScript) |
| Bundler     | Vite                            |
| Styling     | CSS Modules (one `.module.css` per component) |
| Animation   | SVG + CSS transitions / `requestAnimationFrame` |
| Routing     | React Router v6 (two routes: `/` and `/tree`) |
| Deployment  | Vercel (static site)            |

No external animation libraries (Framer Motion, GSAP, etc.). Keep it native SVG + CSS so
students can inspect the source.

---

## Project Structure

```
/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx                  # Vite entry point
│   ├── App.jsx                   # Router setup
│   │
│   ├── pages/
│   │   ├── LandingPage.jsx       # Initial input screen
│   │   └── TreePage.jsx          # Main visualization screen
│   │
│   ├── components/
│   │   ├── Navbar/
│   │   │   ├── Navbar.jsx
│   │   │   └── Navbar.module.css
│   │   │
│   │   ├── InputBox/
│   │   │   ├── InputBox.jsx      # The centered "Claude-style" input on landing
│   │   │   └── InputBox.module.css
│   │   │
│   │   ├── TreeCanvas/
│   │   │   ├── TreeCanvas.jsx    # SVG viewport, owns the <svg> root element
│   │   │   └── TreeCanvas.module.css
│   │   │
│   │   ├── TreeNode/
│   │   │   ├── TreeNode.jsx      # Renders a single B+ tree node (keys + pointer slots)
│   │   │   └── TreeNode.module.css
│   │   │
│   │   ├── TreeEdge/
│   │   │   ├── TreeEdge.jsx      # Renders an SVG <path> or <line> between nodes
│   │   │   └── TreeEdge.module.css
│   │   │
│   │   ├── PointerArrow/
│   │   │   ├── PointerArrow.jsx  # Animated arrow showing current insertion path
│   │   │   └── PointerArrow.module.css
│   │   │
│   │   ├── OperationsPanel/
│   │   │   ├── OperationsPanel.jsx  # Right sidebar: insert + delete inputs
│   │   │   └── OperationsPanel.module.css
│   │   │
│   │   └── StepControls/
│   │       ├── StepControls.jsx  # Play / Pause / Next / Prev / Speed slider
│   │       └── StepControls.module.css
│   │
│   ├── lib/
│   │   ├── BPlusTree.js          # Pure B+ tree data structure (no React)
│   │   └── treeLayout.js         # Converts tree to x/y coordinates for SVG rendering
│   │
│   ├── engine/
│   │   └── AnimationEngine.js    # Produces an ordered array of animation "steps"
│   │
│   ├── hooks/
│   │   ├── useBPlusTree.js       # Wraps BPlusTree.js with React state
│   │   └── useAnimationPlayer.js # Plays through the step array with timing control
│   │
│   └── styles/
│       └── global.css            # CSS variables, resets, fonts
```

---

## Page Descriptions

### `/` — Landing Page

- **Navbar** at the top: app name ("B+ Tree Visualizer") on the left, a small "Order (t)" number
  input on the right (default = 3), and an "About" link.
- **Centered layout** (vertically + horizontally): a large heading, a subtitle explaining the
  tool in one sentence, and the `InputBox` component below it.
- `InputBox` shows a multi-line textarea with placeholder text
  `"e.g.  42, 7, banana, 15, dragon, 3"`. Below it, a primary "Build Tree →" button.
- On submit, validate that at least 2 values were entered, parse the CSV, navigate to `/tree`
  passing the values and order via React Router state.

### `/tree` — Tree Page

Layout is a **three-column flex/grid**:

```
[ TreeCanvas (flex: 1, center) ] [ OperationsPanel (fixed 280px right) ]
```

The `StepControls` bar sits pinned at the **bottom** of the viewport, spanning full width.

#### TreeCanvas
- Renders the B+ tree as an SVG.
- Each node is drawn as a horizontal rectangle divided into alternating **pointer slots** and
  **key slots** (the classic B+ tree cell layout):
  ```
  [ P | K1 | P | K2 | P ]
  ```
  Pointer slots are slightly narrower, shown in a muted colour. Key slots hold the value text.
  Leaf nodes have a **horizontal arrow** on the right side pointing to the next leaf node
  (linked-list pointer), displayed as an SVG arrow between adjacent leaf nodes.
- Internal nodes show pointer slots visually but their "pointers" are represented by the
  SVG edges (lines) going to children.
- The animated **PointerArrow** (a pulsing red/orange arrow) travels down the tree during
  each step, showing which node is being visited.

#### OperationsPanel (right sidebar)
- **Insert section**: label "Insert Values", a text input, and an "Insert" button.
  Accepts one or more comma-separated values.
- **Delete section**: label "Delete Values", a text input, and a "Delete" button.
  Same format.
- Both operations enqueue new animation steps into the player.
- A small "Tree Info" section shows: Order (t), total nodes, total keys, tree height.

#### StepControls (bottom bar)
- Buttons: `|◀ Prev`, `▶ Play / ⏸ Pause`, `Next ▶|`
- Speed slider: Slow → Fast
- Step counter: "Step 3 / 12"
- Description text: one line explaining the current step
  e.g. "Inserting 42 → traversing to leaf node [7 | 15]"

---

## B+ Tree Rules (implement strictly)

- **Order t**: every internal node has at most `2t - 1` keys and at least `t - 1` keys
  (except root). Every internal node has at most `2t` children.
- **Leaf nodes**: hold the actual values (or key-pointer pairs in a real DB; here just values).
  Leaf nodes are linked left-to-right (next-leaf pointer).
- **Splits**: when a node overflows (reaches `2t` keys), split at the median. For internal
  nodes, the median key is **pushed up**. For leaf nodes, the median key is **copied up**.
- **Deletions**: borrow from siblings before merging. Show the borrow/merge as distinct steps.
- Support **string keys**: comparison is lexicographic (case-insensitive).
- Support **mixed key types** in the same tree by converting all keys to strings and comparing
  lexicographically. Display numbers without quotes, strings without quotes.

---

## Animation Steps (AnimationEngine.js)

Every insert or delete operation must be broken into an **array of step objects** before any
React state changes. Each step has the shape:

```js
{
  id: number,           // step index
  description: string,  // human-readable label for StepControls
  treeSnapshot: object, // deep clone of the tree state AFTER this step
  highlightNodeId: string | null,  // which node to highlight
  highlightKeys: string[],         // which keys to highlight inside that node
  arrowFrom: { x, y } | null,     // PointerArrow start position
  arrowTo:   { x, y } | null,     // PointerArrow end position
  arrowLabel: string | null,       // text on the arrow (e.g. "go right")
  type: 'traverse' | 'insert' | 'split' | 'delete' | 'borrow' | 'merge' | 'done'
}
```

The `useAnimationPlayer` hook consumes this array and advances through steps either manually
(Next/Prev buttons) or automatically (Play mode with the speed setting).

---

## Visual Design

- **Background**: very dark (`#0d0d0d`) — dark-mode only.
- **Tree nodes**: dark card background (`#1a1a2e`) with a subtle border (`#2a2a4a`).
  Keys are white text. Pointer slots are `#252540`.
- **Highlighted node**: glowing border in accent blue (`#4f8ef7`), keys turn bright white.
- **Current step arrow**: accent orange (`#ff9f43`), animated stroke-dashoffset so it
  "draws itself" from source to target.
- **Leaf-to-leaf pointers**: dashed accent green line (`#26de81`) with a right-arrow head.
- **Edges (parent → child)**: solid grey lines (`#555`).
- **OperationsPanel**: slightly lighter background (`#111122`), fixed on right, full height.
- **StepControls bar**: `#111` background, border-top, `z-index: 100`.
- Typography: system font stack. Tree node keys use a monospace font.

---

## Key Implementation Notes

1. **`BPlusTree.js` must be pure** — no React imports, no DOM, no side effects. It is a plain
   JavaScript class. This makes it testable in isolation.

2. **`treeLayout.js`** performs a BFS or DFS on the tree and assigns `x, y` pixel coordinates
   to every node, using a Reingold-Tilford-style algorithm (or simpler level-based spacing).
   It returns a flat array of `{ id, x, y, width, height, keys, pointers, isLeaf }` objects
   and a separate array of `{ fromId, toId }` edge objects.

3. **`AnimationEngine.js`** takes a `BPlusTree` instance and a value to insert/delete, runs
   the operation step-by-step internally, records each intermediate state + metadata, and
   returns the `steps[]` array. It must **not mutate** the live tree used by the UI — work on
   a deep clone.

4. **`useBPlusTree`** hook manages: the live tree instance, the current steps array, and
   exposes `insert(values[])`, `delete(values[])`, and `resetTree(values[], order)`.

5. **`useAnimationPlayer`** hook manages: `currentStepIndex`, `isPlaying`, `speed`.
   Exposes `play()`, `pause()`, `next()`, `prev()`, `setSpeed()`.

6. **SVG pan & zoom**: add mouse-drag panning and scroll-wheel zoom on `TreeCanvas` so large
   trees remain usable. Implement with a `viewBox` transform state, no external library.

7. **Responsive**: on screens < 768 px wide, hide the right `OperationsPanel` and show an
   "Operations" bottom sheet instead (CSS media query + a show/hide toggle button).

---

## Vercel Deployment

- Add a `vercel.json` at the root:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- `vite.config.js` needs no special config beyond the default React plugin.
- `package.json` build command: `vite build`, output dir: `dist`.

---

## Out of Scope (do not implement)

- Backend / API of any kind.
- User accounts or persistence.
- B-tree (non-plus) variant.
- Bulk-load / bulk-delete.
- Drag-and-drop reordering of keys.
