# ERD Builder — Addendum to Project Specification

## Overview

The ER Diagram Builder is a 3-step paginated flow inside the existing landing page ERD mode.
It guides the user from question → LLM prompt → JSON paste → rendered Chen notation diagram.
The ERD renderer is a new page at `/erd`. All existing components and pages are untouched.

---

## New Files & Structure

```
src/
├── pages/
│   └── ERDPage.jsx                  # The full 3-step paginated ERD flow page
│
├── components/
│   │
│   ├── PaginationDots/
│   │   ├── PaginationDots.jsx       # The • • • step indicator
│   │   └── PaginationDots.module.css
│   │
│   ├── ERDStep1/
│   │   ├── ERDStep1.jsx             # Input: user describes their ER scenario
│   │   └── ERDStep1.module.css
│   │
│   ├── ERDStep2/
│   │   ├── ERDStep2.jsx             # Output: generated prompt + copy button + instructions
│   │   └── ERDStep2.module.css
│   │
│   ├── ERDStep3/
│   │   ├── ERDStep3.jsx             # Input: user pastes JSON back
│   │   └── ERDStep3.module.css
│   │
│   └── ERDCanvas/
│       ├── ERDCanvas.jsx            # SVG renderer for Chen notation diagram
│       └── ERDCanvas.module.css
│
└── lib/
    ├── erdPromptBuilder.js          # Builds the prompt engineering string from user input
    ├── erdParser.js                 # Validates and parses the JSON into internal structure
    └── erdLayout.js                 # Assigns x/y coordinates to all ERD nodes for SVG render
```

---

## Routing

Add `/erd` to `App.jsx`:
```jsx
<Route path="/erd" element={<ERDPage />} />
```

Navigation from `LandingPage`: when `activeTool === 'erd'` and the user submits the pill input,
navigate to `/erd` passing the question string in `location.state.question`.

---

## ERD JSON Schema (the contract between LLM and renderer)

The prompt instructs the LLM to return **only** a JSON object matching this schema exactly.
The renderer must handle every field. This schema supports full Chen notation.

```json
{
  "entities": [
    {
      "id": "string (unique, no spaces, e.g. 'student')",
      "name": "string (display name, e.g. 'Student')",
      "attributes": [
        {
          "id": "string (unique)",
          "name": "string",
          "type": "simple | multiValued | derived | key | partialKey",
          "composedOf": ["attr_id_1", "attr_id_2"]  // only if composite, else omit
        }
      ],
      "isWeak": false
    }
  ],
  "relationships": [
    {
      "id": "string (unique)",
      "name": "string (verb phrase, e.g. 'Enrolls In')",
      "isIdentifying": false,
      "participants": [
        {
          "entityId": "string (references entities[].id)",
          "cardinality": "1 | N | M",
          "participation": "total | partial"
        }
      ],
      "attributes": []  // relationship attributes, same shape as entity attributes
    }
  ],
  "isA": [
    {
      "id": "string",
      "parent": "string (entity id)",
      "children": ["entity_id_1", "entity_id_2"],
      "constraint": "disjoint | overlapping",
      "participation": "total | partial"
    }
  ]
}
```

### Chen Notation Visual Rules (renderer must implement all of these)

| Element | Shape | Style |
|---|---|---|
| Regular entity | Rectangle | `#0d0d0d` fill, `1px solid #2a2a3a`, white text |
| Weak entity | Double rectangle (outer + inner inset 4px) | Same colours |
| Regular attribute | Ellipse / oval | `#0d0d0d` fill, `1px solid #2a2a3a`, white text |
| Key attribute | Ellipse with underlined text | Same, text has `text-decoration: underline` |
| Partial key | Ellipse with dashed underline | Same, dashed underline |
| Multivalued attribute | Double ellipse (outer + inner) | Same colours |
| Derived attribute | Dashed ellipse border | Same colours, border `stroke-dasharray: 5 3` |
| Composite attribute | Ellipse with sub-attribute ellipses branching from it | — |
| Regular relationship | Diamond | `#0d0d0d` fill, `1px solid #2a2a3a`, white text |
| Identifying relationship | Double diamond | Same colours |
| IS-A relationship | Triangle pointing down, labelled by constraint | `#0d0d0d` fill, `#2a2a3a` border |
| Total participation | Double line connecting entity to relationship | `stroke: #8B5CF6`, `stroke-width: 3` |
| Partial participation | Single line | `stroke: #555`, `stroke-width: 1.5` |
| Leaf-link lines (attr → entity, attr → rel) | Single thin line | `stroke: #444` |

Relationship diamonds sit between their participant entities.
Attributes branch outward from their parent entity or relationship like spokes.
IS-A triangles sit below the parent entity, with children entities below the triangle.

---

## ERD Layout Algorithm (erdLayout.js)

This is a pure JavaScript module — no React. Input: parsed JSON object. Output:
`{ nodes: [], edges: [] }` ready for SVG rendering.

### Layout Strategy

1. **Entities** are placed first in a horizontal row, evenly spaced, at `y = 300`.
   Spacing between entity centers: `max(200px, longestEntityName * 12 + 160px)`.

2. **Relationship diamonds** are placed between their two participant entities at the midpoint
   x between them, at `y = 300` (same row). If a relationship has more than 2 participants,
   place it above the entities at `y = 100`.

3. **Attributes** radiate outward from their parent node. Distribute them in a `180°` arc
   on the side away from the diagram center. Each attribute center is `120px` from parent center.
   Composite attributes spawn their sub-attributes in a smaller `90°` arc `80px` further out.

4. **IS-A triangles** are placed directly below the parent entity at `y = parentY + 150`.
   Child entities are placed at `y = parentY + 300`, spread horizontally.

5. **Edges** are computed last. Each edge is a straight line between node centers, except:
   - Total participation: render as two parallel lines `4px` apart.
   - Identifying relationship connection: double line on the entity side.

### Node shape dimensions

| Shape | Width | Height |
|---|---|---|
| Entity rectangle | `max(100px, nameLength * 9 + 32px)` | `44px` |
| Relationship diamond | `max(100px, nameLength * 9 + 32px)` | `60px` |
| Attribute ellipse | `max(80px, nameLength * 8 + 24px)` | `36px` |
| IS-A triangle | `80px` base | `60px` height |

---

## ERDCanvas.jsx

The SVG renderer. Props:
```js
{ erdData: object }  // the parsed + laid-out ERD data
```

- Renders inside a `<svg>` with pan + zoom (reuse the same viewBox transform pattern
  from `TreeCanvas.jsx` — copy the logic, do not import from TreeCanvas).
- Renders each node type according to the Chen notation visual rules table above.
- Renders all edges, with double-line logic for total participation.
- No animation. No step-by-step. Static render only.
- Supports the same `Starfield` background (already on ERDPage).

---

## ERDPage.jsx — Layout & Step Logic

```
<div class="erdPage">
  <Starfield />                         ← z-index: 0, same as LandingPage
  <Navbar />                            ← same landing-page Navbar (About link only, top-right)
  <main class="erdMain">               ← centered, margin-left: 56px (no sidebar on this page)
    <PaginationDots total={3} current={step} />
    { step === 1 && <ERDStep1 ... /> }
    { step === 2 && <ERDStep2 ... /> }
    { step === 3 && <ERDStep3 ... /> }
    { step === 4 && <ERDCanvas erdData={parsedERD} /> }  ← full canvas after step 3 submit
  </main>
</div>
```

State:
```js
const [step, setStep] = useState(1)
const [question, setQuestion] = useState('')      // from location.state.question or typed here
const [prompt, setPrompt] = useState('')          // generated by erdPromptBuilder
const [parsedERD, setParsedERD] = useState(null)  // after JSON is validated
```

No sidebar on ERDPage — it's a focused flow, not a tool switcher.

---

## Step Components

### ERDStep1.jsx

- Same pill input as LandingPage (reuse `PillInput` component directly — do not copy it).
- Pre-filled with `location.state.question` if it exists.
- Placeholder: `"e.g. A university has students who enroll in courses taught by professors..."`
- Title above pill: `ER Diagram Builder` in `#8B5CF6`, same HeroText sizing.
- Subtitle: `describe your scenario below` in `rgba(255,255,255,0.55)`.
- On submit: calls `erdPromptBuilder(question)`, stores result in `prompt`, advances to step 2.

### ERDStep2.jsx

Shows the generated prompt the user should copy into their LLM of choice.

Layout:
```
[ Instruction text at top ]
[ Prompt text box — read-only, scrollable, full prompt text ]
[ Copy button ]
[ "Next: paste the JSON →" button ]
```

Instruction text (small, `rgba(255,255,255,0.5)`, appears only on step 2):
> Copy the prompt below and paste it into ChatGPT, Claude, Gemini, or any LLM.
> Then copy the JSON it returns and paste it in the next step.

Prompt text box:
- `background: #0f0f0f`, `border: 1px solid #222`, `border-radius: 12px`.
- `font-family: monospace`, `font-size: 0.8rem`, `color: rgba(255,255,255,0.8)`.
- `max-height: 340px`, `overflow-y: auto`, `padding: 16px`, not editable (`readOnly`).
- Width: `min(720px, 90vw)`.

Copy button:
- Ghost style: `1px solid #8B5CF6`, `#8B5CF6` text, `border-radius: 8px`.
- On click: copies `prompt` to clipboard, button text briefly changes to `"Copied ✓"` for `1.5s`.

Next button:
- Solid `#8B5CF6`, white text, `border-radius: 8px`, advances to step 3.

### ERDStep3.jsx

- Same pill input as step 1 (reuse `PillInput`).
- Placeholder: `"Paste your ERD JSON here..."`.
- Title: `Paste the JSON` in `#8B5CF6`.
- Subtitle: `paste the JSON your LLM returned` in `rgba(255,255,255,0.55)`.
- On submit: runs `erdParser(value)`. If valid, stores result and advances to step 4 (ERDCanvas).
  If invalid, shows inline error below pill: `"Invalid JSON — make sure you copied the full response"` in `#ef4444`.
- Also show a `"← Back"` ghost link above the pill to return to step 2.

---

## erdPromptBuilder.js

Pure function:
```js
export function buildERDPrompt(userQuestion) { ... }
```

Returns a string containing:
1. A clear instruction telling the LLM to return **only** a JSON object.
2. The full JSON schema (the one defined in this spec) as an inline example.
3. The user's original question appended at the end.
4. Explicit instruction: "Do not include any explanation, markdown, or code fences.
   Return only the raw JSON object."

---

## erdParser.js

Pure function:
```js
export function parseERD(jsonString) {
  // returns { valid: true, data: {...} } or { valid: false, error: '...' }
}
```

Validates:
- Is it parseable JSON?
- Does it have `entities` array with at least one item?
- Does each entity have `id`, `name`, `attributes`, `isWeak`?
- Does each relationship have `id`, `name`, `participants`?
- Do all `entityId` references in relationships and isA point to real entity ids?
- Returns sanitised/defaulted data (fill in missing optional fields with defaults).

---

## PaginationDots.jsx

Props: `{ total: number, current: number }`

Renders `total` dots horizontally centered.
- Inactive dot: `8px` circle, `background: #333`.
- Active dot: `8px` circle, `background: #8B5CF6`, `box-shadow: 0 0 6px rgba(139,92,246,0.6)`.
- Gap between dots: `10px`.
- Position: above the step content, `margin-bottom: 40px`.
- Transition: `background 0.2s ease`.

---

## Design Rules for ERD Page

- All styling follows the established token set: `#000` background, `#8B5CF6` accent,
  `rgba(255,255,255,0.55)` for secondary text, `#0f0f0f` for surfaces.
- No new colours introduced except `#ef4444` for error states.
- Starfield visible through all steps.
- ERDCanvas (step 4) is full screen minus navbar — same layout as TreePage.

---

## Files That Must Not Be Modified

`BPlusTree.js`, `AnimationEngine.js`, `treeLayout.js`, `useBPlusTree.js`,
`useAnimationPlayer.js`, `TreeCanvas.jsx`, `TreeNode.jsx`, `TreeEdge.jsx`,
`PointerArrow.jsx`, `OperationsPanel.jsx`, `StepControls.jsx`, `TreePage.jsx`,
`LandingPage.jsx`, `Sidebar.jsx`, `SidebarIcon.jsx`, `PillInput.jsx`, `HeroText.jsx`,
`Starfield.jsx`.
