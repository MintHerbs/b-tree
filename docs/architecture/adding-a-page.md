# Adding a New Page

This guide walks through creating a new route-level page using [`PageShell`](../../src/components/layout/PageShell/PageShell.jsx) — the canonical layout wrapper that handles the navbar, sidebar offset, and the project's visual language (centered hero, glow title, ScrambleText animation, sidebar padding).

If you find yourself writing `position: absolute; top: 45%; left: 50%; transform: translate(...)` in a new `.module.css`, stop — `PageShell` already does this. Duplicating it is the exact problem this component was built to solve.

---

## TL;DR

```jsx
// src/pages/my-thing/MyThingPage.jsx
import PageShell from '../../components/layout/PageShell';

export default function MyThingPage() {
  return (
    <PageShell title="My Thing" subtitle="What it does in one line">
      <MyInput onSubmit={...} />
    </PageShell>
  );
}
```

Then register the route in [`src/routes/index.jsx`](../../src/routes/index.jsx):

```jsx
const MyThingPage = lazy(() => import('../pages/my-thing/MyThingPage'))

const routeComponents = {
  // ...
  '/my-thing': MyThingPage,
}
```

That's the whole page in the simple case.

---

## The three variants

`PageShell` accepts `variant="landing" | "result" | "content"` (defaults to `"landing"`).

### 1. `landing` — input / hero pages

Centered, absolute-positioned hero with `ScrambleText` title + subtitle. Use for tool input screens where the user is being asked to do one thing (paste code, type a formula, etc.).

```jsx
<PageShell title="Code Complexity" subtitle="Paste your Python code">
  <CodePillInput onSubmit={handleSubmit} />
</PageShell>
```

Visual: full-height container, hero vertically centered at 45%, swipe-up entrance, purple glow on the title.

### 2. `result` — output / visualizer pages

Full-height container with `padding-left: 80px` (for the global sidebar) and **no** centered hero. Use for the post-input state of a tool: split panels, canvases, error views. The Navbar is included but you control its props via the `navbar` prop.

```jsx
<PageShell
  variant="result"
  navbar={{
    showTitle: true,
    title: 'O Complexity',
    showNewFormula: true,
    onNewFormula: handleReset,
    newFormulaText: 'New Code',
  }}
>
  <SplitPanel
    left={<ComplexityCodeView code={code} annotations={result.annotations} />}
    right={<ComplexityTerminal steps={result.steps} />}
  />
</PageShell>
```

### 3. `content` — scrollable info pages

Top-aligned, scrollable normal-flow page with a max-width container and sidebar offset. Use for the home page, about page, settings, or anything that isn't a single-input tool.

```jsx
<PageShell variant="content">
  <section>
    <h1>Codex</h1>
    <p>...</p>
  </section>
  <section>
    <h2>Browse by faculty</h2>
    <div className={styles.facultyGrid}>{cards}</div>
  </section>
</PageShell>
```

Content is constrained to `max-width: 1100px` and centered.

---

## The typical tool flow: input → result

Most tools have two visual states — an input view and a result view. Keep the state in the page component; switch the `PageShell` variant accordingly:

```jsx
import { useState } from 'react';
import PageShell, { SplitPanel, ErrorBox } from '../../components/layout/PageShell';

export default function MyToolPage({ onAIStateChange }) {
  const [view, setView] = useState('input');
  const [result, setResult] = useState(null);

  const handleSubmit = (value) => {
    const r = solve(value);
    setResult(r);
    setView('result');
  };

  const handleReset = () => {
    setView('input');
    setResult(null);
  };

  if (view === 'input') {
    return (
      <PageShell title="My Tool" subtitle="One-line description">
        <MyInput onSubmit={handleSubmit} onAIStateChange={onAIStateChange} />
      </PageShell>
    );
  }

  return (
    <PageShell
      variant="result"
      navbar={{
        showTitle: true,
        title: 'My Tool',
        showNewFormula: true,
        onNewFormula: handleReset,
      }}
    >
      {result.error ? (
        <ErrorBox
          title="Parse Error"
          message={result.error}
          onRetry={handleReset}
        />
      ) : (
        <SplitPanel
          left={<MyVisualization data={result} />}
          right={<MyTerminal steps={result.steps} />}
        />
      )}
    </PageShell>
  );
}
```

This pattern is exactly what [`ComplexityPage`](../../src/pages/algo/complexity/ComplexityPage.jsx), [`RecurrencePage`](../../src/pages/algo/recurrence/RecurrencePage.jsx), and the logic pages do — refactor onto `PageShell` if you touch one of them.

---

## Props reference

### `PageShell`

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | `'landing' \| 'result' \| 'content'` | `'landing'` | Picks the layout. |
| `title` | `string` | — | Hero title (landing variant only). Wrapped in `ScrambleText`. |
| `subtitle` | `string` | — | Hero subtitle (landing variant only). Wrapped in `ScrambleText`. |
| `navbar` | `object` | `{}` | Forwarded to [`<Navbar />`](../../src/components/layout/Navbar/Navbar.jsx) as props. See Navbar source for the full prop list. |
| `children` | `ReactNode` | — | Page content. In `landing` it appears below the hero; in `result`/`content` it fills the page. |

### `SplitPanel`

| Prop | Type | Notes |
|---|---|---|
| `left` | `ReactNode` | Left panel (uses `--color-surface` background). |
| `right` | `ReactNode` | Right panel (terminal-style `#020409` background). |

### `ErrorBox`

| Prop | Type | Default | Notes |
|---|---|---|---|
| `title` | `string` | `'Error'` | Heading. |
| `message` | `string` | — | Body text. |
| `onRetry` | `() => void` | — | If provided, renders the retry button. |
| `retryText` | `string` | `'← Try Again'` | Button label. |

---

## What `PageShell` deliberately does **not** do

- **Renders `<Starfield />`** — it's already rendered globally in [`App.jsx`](../../src/App.jsx). Pages that include their own `<Starfield />` are redundant.
- **Owns page state** — `useState`, `useCallback`, AI state wiring all stay in the page. `PageShell` is layout-only.
- **Forces a Navbar variant** — you pass `navbar={{...}}` with whatever the page needs (reset button, result badge, custom title, etc.).

---

## Conventions checklist when adding a page

- [ ] Folder under `src/pages/<area>/<name>/` (kebab-case folder, PascalCase file: `MyThingPage.jsx`).
- [ ] No `.module.css` for layout — let `PageShell` own it. A page-specific CSS module is fine for **content** styles (grids, cards, section headings).
- [ ] No local `<Starfield />`, `<Navbar />` directly, or hand-rolled `landingCenter`/`splitPanel`/`resultPage` classes — these all live in `PageShell`.
- [ ] Lazy-import the page in [`src/routes/index.jsx`](../../src/routes/index.jsx) and add an entry to `routeComponents`. Add to `preloadRoutes()` if it's a hot path.
- [ ] If the page is a tool with thinking states, accept `onAIStateChange` as a prop and call it on submit/reset (see `ComplexityPage` for the canonical pattern).

---

## When **not** to use `PageShell`

- Embedded views rendered inside another page (e.g. a step component inside `ERDPage`'s flow) — those aren't routes and don't own the page chrome.
- A page that genuinely needs a different chrome (e.g. a full-bleed canvas with no navbar). In that case, build it directly — don't bend `PageShell` with a fourth variant unless two or more pages need it.
