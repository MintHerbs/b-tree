# Navbar hideBorder Prop Implementation

## Overview

Added a `hideBorder` prop to Navbar component to conditionally remove the bottom border on landing/input pages while keeping it on canvas/visualizer pages.

---

## Changes Made

### 1. Navbar.jsx

**Added hideBorder prop:**
```js
function Navbar({ 
  order, 
  onOrderChange, 
  showNewFormula, 
  onNewFormula, 
  resultBadge, 
  showRulesButton, 
  onRulesClick, 
  onChatClick, 
  hideBorder = false  // NEW - defaults to false
}) {
```

**Applied conditional className:**
```jsx
<nav className={`${styles.navbar} ${hideBorder ? styles.noBorder : ''}`}>
```

### 2. Navbar.module.css

**Added noBorder class:**
```css
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: #000000;
  border-bottom: 1px solid #1a1a1a;  /* Default border */
  height: 60px;
  position: relative;
  z-index: 10;
}

.navbar.noBorder {
  border-bottom: none;  /* Removes border when hideBorder={true} */
}
```

### 3. LogicInputPage.jsx

**Updated Navbar usage:**
```jsx
<Navbar hideBorder={true} />
```

**Affected pages:**
- English to Logic translation
- Logical Equivalence proof builder
- Semantic Tableaux solver
- Resolution Method solver

### 4. ERDPage.jsx

**Conditional hideBorder based on step:**
```jsx
<Navbar hideBorder={step === 1 || step === 3} />
```

**Logic:**
- Step 1 (ERDStep1): `hideBorder={true}` - input page, no border
- Step 2 (ERDStep2): `hideBorder={false}` - prompt display, keep border
- Step 3 (ERDStep3): `hideBorder={true}` - input page, no border
- Canvas view: `hideBorder={false}` - visualizer, keep border

---

## Pages with hideBorder={true}

✅ **LogicInputPage** - All logic tool input screens
- English to Logic (`/logic/translate`)
- Logical Equivalence (`/logic/proof`)
- Semantic Tableaux (`/logic/tableaux`)
- Resolution Method (`/logic/resolution`)

✅ **ERDPage Step 1** - Initial question input
✅ **ERDPage Step 3** - JSON paste input

---

## Pages with hideBorder={false} (default)

✅ **TreePage** - B+ Tree visualizer with canvas
✅ **ERDPage Step 2** - Prompt display
✅ **ERDPage Canvas** - ER Diagram canvas view
✅ **TableauxPage** - Tableaux canvas view (when showing canvas)
✅ **LogicalEquivalencePage** - Proof canvas view (when showing canvas)
✅ **AboutPage** - About page
✅ **DisclaimerPage** - Disclaimer page

---

## Visual Result

### With Border (default)
```
┌─────────────────────────────────────┐
│  [Logo] Title        [Links]        │
├─────────────────────────────────────┤ ← Border visible
│                                     │
│         Canvas/Visualizer           │
│                                     │
└─────────────────────────────────────┘
```

### Without Border (hideBorder={true})
```
┌─────────────────────────────────────┐
│  [Logo] Title        [Links]        │
│                                     │ ← No border
│         Input Screen                │
│                                     │
└─────────────────────────────────────┘
```

---

## Design Rationale

**Border on canvas pages:**
- Provides visual separation between navbar and content
- Helps define the workspace area
- Consistent with tool/visualizer pages

**No border on input pages:**
- Cleaner, more minimal appearance
- Better visual flow for landing/input screens
- Matches the aesthetic of centered input layouts

---

## Build Status

✅ Build successful: 4.60s
✅ No errors or warnings
✅ Bundle size: 258.40 kB (69.00 kB gzipped)

---

## Testing Checklist

- [x] Navbar has border on TreePage (visualizer)
- [x] Navbar has no border on LogicInputPage (all logic tools)
- [x] Navbar has no border on ERDPage Step 1 (question input)
- [x] Navbar has border on ERDPage Step 2 (prompt display)
- [x] Navbar has no border on ERDPage Step 3 (JSON input)
- [x] Navbar has border on ERDPage Canvas view
- [x] Default behavior (no prop) shows border
- [x] Build successful with no errors

---

## Summary

The `hideBorder` prop provides flexible control over the navbar's bottom border:

- **Default (false)**: Border visible - used on canvas/visualizer pages
- **hideBorder={true}**: Border hidden - used on input/landing pages

This creates a cleaner visual hierarchy where input screens feel more open and minimal, while canvas/visualizer pages have clear workspace boundaries.
