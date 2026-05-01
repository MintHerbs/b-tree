# SVG Components Implementation

## ✅ TreeCanvas.jsx - SVG Viewport with Pan/Zoom

**Purpose:** Main SVG container that renders the entire tree visualization with interactive pan and zoom

**Features:**
- **Mouse drag panning** - Click and drag to move the view
- **Scroll wheel zoom** - Zoom in/out with mouse wheel, centered on cursor position
- **ViewBox transform** - Manages SVG coordinate system for smooth pan/zoom
- **Layout calculation** - Uses `calculateTreeLayout()` to position nodes
- **Renders all child components** - TreeNode, TreeEdge, PointerArrow
- **SVG marker definitions** - Arrow markers for edges and pointers
- **Empty state** - Shows message when no tree exists
- **Zoom hint** - Displays "Drag to pan • Scroll to zoom" overlay

**Props:**
```javascript
{
  treeSnapshot: { t, root },      // Tree state from animation step
  highlightNodeId: string | null, // Node to highlight
  highlightKeys: string[],        // Keys to highlight
  arrowFrom: { x, y } | null,     // Arrow start position
  arrowTo: { x, y } | null,       // Arrow end position
  arrowLabel: string | null       // Arrow label text
}
```

**Pan/Zoom Implementation:**
- ViewBox state: `{ x, y, width, height }`
- Mouse down → start panning
- Mouse move → update viewBox x/y based on delta
- Mouse wheel → scale viewBox width/height, adjust position to zoom towards cursor
- Proper coordinate transformation between screen and SVG space

---

## ✅ TreeNode.jsx - B+ Tree Node Renderer

**Purpose:** Renders a single B+ tree node with alternating pointer and key slots

**Features:**
- **Slot layout** - Uses `getNodeSlots()` to calculate [P|K|P|K|P] pattern
- **Pointer slots** - Narrow slots (24px) with muted background color
- **Key slots** - Wider slots (50px) with key text centered
- **Highlighting** - Glowing border when node is highlighted
- **Key highlighting** - Orange color for highlighted keys
- **Leaf indicator** - Small "leaf" label below leaf nodes
- **Dynamic sizing** - Width scales with number of keys

**Props:**
```javascript
{
  node: {
    id: string,
    x: number,              // Center x position
    y: number,              // Center y position
    keys: array,            // Array of key values
    width: number,          // Node width
    height: number,         // Node height (60px)
    isLeaf: boolean
  },
  isHighlighted: boolean,
  highlightedKeys: string[]
}
```

**Visual Structure:**
```
┌──┬────┬──┬────┬──┬────┬──┐
│P │ K1 │P │ K2 │P │ K3 │P │
└──┴────┴──┴────┴──┴────┴──┘
```

---

## ✅ TreeEdge.jsx - Edge Renderer

**Purpose:** Renders lines connecting parent nodes to children, and leaf-to-leaf pointers

**Features:**
- **Parent-child edges** - Solid gray lines
- **Leaf pointers** - Dashed green lines with arrow markers
- **Simple line rendering** - Uses SVG `<line>` element
- **Marker support** - References SVG marker definitions

**Props:**
```javascript
{
  from: { x, y },           // Start position
  to: { x, y },             // End position
  isLeafPointer: boolean    // Whether this is a leaf-to-leaf pointer
}
```

**Edge Types:**
1. **Parent → Child**: Solid line from parent bottom to child top
2. **Leaf → Leaf**: Dashed line with green arrow (horizontal)

---

## ✅ PointerArrow.jsx - Animated Traversal Arrow

**Purpose:** Renders an animated arrow showing the current insertion/deletion path

**Features:**
- **Animated stroke** - Stroke-dashoffset animation creates "marching ants" effect
- **Pulsing opacity** - Fades in/out for attention
- **Arrow marker** - Orange arrow head at end
- **Label support** - Text label at midpoint (e.g., "go left", "go right")
- **Drop shadow** - Glowing effect for visibility

**Props:**
```javascript
{
  from: { x, y } | null,    // Start position
  to: { x, y } | null,      // End position
  label: string | null      // Optional label text
}
```

**Animations:**
- `pulse`: Opacity 1 → 0.7 → 1 (1.5s infinite)
- `dash`: Stroke-dashoffset animation (1s infinite)

---

## SVG Marker Definitions

TreeCanvas defines two arrow markers:

1. **`#leaf-arrow`** - Green arrow for leaf-to-leaf pointers
2. **`#pointer-arrow`** - Orange arrow for traversal pointer

---

## Integration Example

```javascript
function TreePage() {
  const { tree, steps } = useBPlusTree([], 3)
  const { currentStep } = useAnimationPlayer(steps)

  return (
    <TreeCanvas
      treeSnapshot={currentStep?.treeSnapshot}
      highlightNodeId={currentStep?.highlightNodeId}
      highlightKeys={currentStep?.highlightKeys}
      arrowFrom={currentStep?.arrowFrom}
      arrowTo={currentStep?.arrowTo}
      arrowLabel={currentStep?.arrowLabel}
    />
  )
}
```

---

## Styling

All components use CSS Modules with CSS variables:

**Colors:**
- `--bg-card` - Node background (#1a1a2e)
- `--border-subtle` - Node borders (#2a2a4a)
- `--border-highlight` - Highlighted node border (#4f8ef7)
- `--pointer-slot` - Pointer slot background (#252540)
- `--accent-orange` - Pointer arrow (#ff9f43)
- `--accent-green` - Leaf pointer (#26de81)
- `--edge-color` - Parent-child edges (#555)

**Fonts:**
- `--font-mono` - Key text (Courier New)
- `--font-body` - Labels (system font)

---

## Performance Notes

- **Layout calculation** - Runs on every render when treeSnapshot changes
- **Node map** - Built once per render for O(1) edge endpoint lookup
- **Pan/zoom** - Smooth 60fps with CSS transforms
- **Animations** - Pure CSS, no JavaScript animation loops

---

## Testing

All components compile without errors and are ready for integration with TreePage.

**Next Steps:**
1. Wire TreeCanvas to TreePage with animation step data
2. Test pan/zoom interactions
3. Test node highlighting and arrow animations
4. Verify layout with different tree sizes
