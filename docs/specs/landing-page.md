# Feature Spec: Landing Page Rework (Hero Copy + Material You Tool Cards)

## Context

The landing page at `/home` ([`src/pages/home/HomePage.jsx`](../../src/pages/home/HomePage.jsx))
currently presents four **faculty** cards (IT, Social Science, Agricultural
Science, Engineering) rendered with emoji icons. The faculties are inert —
none of them navigates anywhere, and the site has no faculty-scoped content
to route to. Meanwhile the actual tools (B+ Tree, ERD, complexity,
recurrence, CPA calculator, the social feed) are reachable only from the
sidebar, so a first-time visitor lands on a page that advertises a taxonomy
the product doesn't have and hides the things it does.

This spec replaces the faculty taxonomy with a **Tools** grid where every
card navigates to a real route, rewrites the hero description, and moves the
card visual language onto **Material You (Material Design 3)** using the
Phosphor icon set the sidebar already uses.

Scope decisions confirmed with the requester:

- The Algorithms tools ship as **two separate cards**, not one combined card.
- Material You lands as **reusable tokens + the card component only**. No
  other surface (sidebar, navbar, panels, tool pages) is restyled here.
- "Socials" means the in-app community feed reached via the sidebar's globe
  (public/social mode), i.e. `/social/feed` — not the external
  YouTube/Instagram/LinkedIn links.

---

## 1. Hero copy

In [`HomePage.jsx`](../../src/pages/home/HomePage.jsx), the title (`Codex`)
and tagline (`A study companion built by students, for students.`) are
unchanged. Only `.heroDescription` is replaced.

**Current** (contains an em dash, and enumerates tools inside a single
run-on sentence):

> Codex is an open-source toolkit of interactive visualizers, solvers, and
> notes for university coursework — B+ trees, ER diagrams, code complexity,
> logical proofs, recurrence relations, grade calculators, and more.
> Everything runs in your browser, nothing is tracked, and the source is
> yours to read, fork, and improve.

**New** (no em dashes, three clean sentences, global framing):

> Codex is an open-source toolkit of interactive visualizers, solvers, and
> notes for university coursework anywhere in the world. It covers B+ trees,
> ER diagrams, code complexity, logical proofs, recurrence relations, and
> grade calculators. Everything runs in your browser, nothing is tracked,
> and the source is yours to read, fork, and improve.

---

## 2. Section: "Browse by faculty" → "Tools"

| | Current | New |
|---|---|---|
| Heading | Browse by faculty | Tools |
| Subtitle | Pick your faculty to see the tools and notes relevant to your modules. | Pick a tool to get started. Everything runs in your browser. |
| Data | `FACULTIES` (4 entries, emoji icons, no routes) | `TOOLS` (6 entries, Phosphor icons, real routes) |
| CSS class | `.facultyGrid` | `.toolGrid` |

`FACULTIES` is deleted outright. Nothing else imports it.

### The six cards

Icons come from `@phosphor-icons/react` — the same package
[`Sidebar/modules.js`](../../src/components/layout/Sidebar/modules.js) imports
from. Every icon below is already imported somewhere in that file, so no new
glyph is being introduced. Render them at `size={22} weight="regular"`,
matching the sidebar's convention.

| # | Title | Description | Icon | Route |
|---|---|---|---|---|
| 1 | CPA Calculator | Work out your CPA and see what each module does to it. | `Calculator` | `/tools/grade-toolkit` |
| 2 | B+ Tree Visualizer | Insert, delete, and search keys with every step animated. | `TreeStructure` | `/tree` |
| 3 | ERD Visualizer | Turn a schema description into an entity relationship diagram. | `Graph` | `/erd` |
| 4 | Code Complexity | Paste code and get its Big-O complexity line by line. | `ChartLineUp` | `/algo/code-complexity` |
| 5 | Recurrence Relation | Solve recurrences and follow the substitution steps. | `Function` (imported as `FunctionIcon`) | `/algo/recurrence-relation` |
| 6 | Socials | Post, read, and reply on the community feed. | `Globe` | `/social/feed` |

Notes on the route choices:

- `Calculator` and `Globe` deliberately mirror the sidebar: `Calculator` is
  already the icon for the `cpa` entry in `STANDALONE_TOOLS`, and `Globe` is
  the sidebar's public/social mode switcher in
  [`CollapsedView.jsx`](../../src/components/layout/Sidebar/CollapsedView/CollapsedView.jsx).
  Reusing them means the card and the sidebar affordance for the same
  destination look the same.
- `/algo/code-complexity` and `/algo/recurrence-relation` are the aliases the
  sidebar uses; `/algo/complexity` and `/algo/recurrence` also resolve to the
  same components (see
  [`academiaRoutes.jsx`](../../src/routes/academiaRoutes.jsx)). Use the
  sidebar's spelling so the two stay consistent.
- The CPA card points at `/tools/grade-toolkit`, not `/tools/cpa-calculator`.
  The CPA calculator and "Min effort, max result" tools were fused into the
  Grade Toolkit; `/tools/cpa-calculator` still resolves but only as a
  `<Navigate>` redirect to the toolkit's default (CPA) mode. Linking straight
  to the toolkit skips that redirect hop.

---

## 3. Material You tokens

**Add** to `:root` in [`src/styles/global.css`](../../src/styles/global.css),
and mirror in [`src/constants/colors.js`](../../src/constants/colors.js) under
a new `md` key. Nothing existing is renamed or removed — `--color-accent`,
`--color-surface`, `--color-border` all stay exactly as they are.

The dark scheme below is seeded from the existing brand purple `#8B5CF6`, so
Material You's tonal roles are derived from the accent already in use rather
than importing Material's baseline palette.

```css
/* ── Material You (M3) — dark scheme, seeded from --color-accent ────────── */

/* Surface container tones (M3 elevation is tonal, not shadow-based) */
--md-surface-container-low:  #131117;
--md-surface-container:      #1a171f;
--md-surface-container-high: #241f2b;

/* Primary + tonal container */
--md-primary:              #8B5CF6;  /* same as --color-accent */
--md-on-primary:           #ffffff;
--md-primary-container:    #2e2148;
--md-on-primary-container: #d9c8ff;

/* Text on surfaces */
--md-on-surface:         #eae5ef;
--md-on-surface-variant: #c9c2d2;
--md-outline-variant:    #2c2833;

/* State layer opacities (M3 spec values) */
--md-state-hover:   0.08;
--md-state-focus:   0.10;
--md-state-pressed: 0.12;

/* Shape scale */
--md-shape-sm: 8px;
--md-shape-md: 12px;
--md-shape-lg: 16px;
--md-shape-xl: 28px;

/* Motion — durations sit inside the bands in docs/rules.md §10 */
--md-easing-emphasized: cubic-bezier(0.2, 0, 0, 1);
--md-duration-short:    200ms;  /* Fast band: 150–250ms */
--md-duration-medium:   350ms;  /* Medium band: 300–500ms */
```

**No new dependency.** Per [docs/rules.md §5.2](../rules.md) and
[docs/design/components.md](../design/components.md), MUI / `@material/web` /
any installed MD3 library is out of bounds. Material You here is a token set
plus a hand-built card on CSS Modules, consistent with how every other
primitive in `src/components/ui/` is built.

---

## 4. Card component

[`src/components/ui/Card`](../../src/components/ui/Card/Card.jsx) is the
project's only card primitive and **`HomePage` is its only consumer**
(verified — nothing else imports it). It is rewritten in place as the
Material You card rather than adding a second, competing card component.

### Two problems in the current component to fix while rewriting

1. **`href` breaks SPA navigation.** `Card` renders a bare `<a href>`, which
   triggers a full page reload. The tool cards are internal routes, so they
   need react-router. Add a **`to` prop** that renders react-router's `Link`;
   keep `href` for genuinely external destinations.
2. **The icon slot assumes a text glyph.** `.icon` is styled with
   `font-size: 1.5rem` for emoji. It becomes a Material tonal icon container.

### MD3 anatomy

| Part | Spec |
|---|---|
| Container | `--md-surface-container` fill, `--md-shape-lg` (16px) radius, 20px padding, **no border** (M3 filled card; tonal separation from the near-black page does the work) |
| Icon container | 40×40 circle, `--md-primary-container` background, icon coloured `--md-on-primary-container` at `size={22}` |
| Title | 1rem / 600 / `--md-on-surface` (M3 title-medium) |
| Description | 0.875rem / 400 / 1.5 line-height / `--md-on-surface-variant` (M3 body-medium) |
| State layer | `::after` overlay filled with `--md-on-surface`: opacity `0` → `--md-state-hover` on hover → `--md-state-pressed` on active. This is the M3 interaction model — **not** the current `translateY(-2px)` lift, which is removed |
| Focus | `outline: 2px solid var(--md-primary)` with `outline-offset: 2px` on `:focus-visible` (keep the existing behaviour, retinted) |
| Transition | `--md-duration-short` with `--md-easing-emphasized` |

### Ripple

Reuse the existing primitive rather than writing one:
`RippleButton` + `RippleButtonRipples` from
[`@/components/animate-ui/primitives/buttons/ripple`](../../src/components/animate-ui/primitives/buttons/ripple.tsx),
already used by `PostCard`, `PostComposer`, `FlagConfirmDialog`, and
`OnboardingCarousel`.

Two adjustments for MD3 fidelity:

- `RippleButton` defaults to `hoverScale={1.05}` / `tapScale={0.95}`. Material
  cards do not scale on hover — pass `hoverScale={1}` and `tapScale={0.98}`.
- Use `asChild` wrapping the react-router `Link` so the card stays a real
  anchor (middle-click, open-in-new-tab, screen-reader link semantics). The
  animate-ui `Slot` calls `motion.create(children.type)`, so motion props are
  forwarded correctly through `asChild` — verified in
  [`slot.tsx`](../../src/components/animate-ui/primitives/animate/slot.tsx).
- Ripple colour: `rgba(139, 92, 246, 0.3)`, matching the accent ripple already
  used in `PostCard`.

### Reduced motion

[docs/design/motion.md](../design/motion.md) makes this mandatory, not
optional: gate the ripple and the state-layer transition behind
`prefers-reduced-motion`. Copy the `matchMedia` pattern from `ScrambleText`
rather than re-deriving it. Under reduced motion the card jumps straight to
its hover/pressed end state with no ripple.

---

## 5. Sidebar mode sync (small, in scope)

`Sidebar` holds `const [mode, setMode] = useState('academia')` and never
derives it from the URL. Today only the globe button sets `mode = 'social'`,
so arriving at `/social/feed` any other way — the new Socials card, a direct
link, a refresh — leaves the sidebar showing academia icons on a social page.

Fix in [`Sidebar.jsx`](../../src/components/layout/Sidebar/Sidebar.jsx) with
one effect:

```jsx
useEffect(() => {
  setMode(path.startsWith('/social') ? 'social' : 'academia')
}, [path])
```

This is a pre-existing bug that the Socials card would otherwise make
visible on the main entry path, so it is fixed here rather than deferred.

---

## 5a. Footer (follow-up, shipped)

The old "Find us online" `RichTooltip` pill row was removed and replaced by a
reusable site footer, [`components/layout/Footer`](../../src/components/layout/Footer/Footer.jsx),
rendered at the bottom of `HomePage`. The footer carries the brand blurb, a
Tools column, a Resources column (Community, Guidelines, About, Disclaimer,
GitHub), the three external social icon links (relocated from the old row,
reusing `YouTubeIcon` / `InstagramIcon` / `LinkedInIcon` from the
rich-popover module), and a copyright + MIT-licence line. Internal links use
react-router `Link`; external links are new-tab anchors. It follows the dark
theme via the shared `--color-*` tokens. `SOCIAL_DEMOS`, `.socialRow`,
`.socialTrigger`, and the now-dead `.heroDescription` / `.sectionTitle`
classes were deleted from `HomePage`.

## 6. Out of scope

- **Hero styling.** `.hero*` classes in
  [`home.module.css`](../../src/pages/home/home.module.css) keep their
  hardcoded `rgba(255,255,255,…)` values. Migrating them to `--md-on-surface`
  is a follow-up, not part of this change.
- **Every other surface.** Sidebar, navbar, tool pages, admin panel: no
  visual change.

---

## 7. Files touched

| File | Change |
|---|---|
| [`src/pages/home/HomePage.jsx`](../../src/pages/home/HomePage.jsx) | New hero copy; delete `FACULTIES`, add `TOOLS`; render `Card` with `to` + Phosphor icon elements; drop the "Find us online" section and `SOCIAL_DEMOS`; render `<Footer />` |
| [`src/components/layout/Footer/`](../../src/components/layout/Footer/Footer.jsx) | New reusable footer component (`.jsx` + CSS Module + `index.js`) |
| [`src/pages/home/home.module.css`](../../src/pages/home/home.module.css) | Rename `.facultyGrid` → `.toolGrid`; delete dead `.socialRow` / `.socialTrigger` / `.heroDescription` / `.sectionTitle` |
| [`src/components/ui/Card/Card.jsx`](../../src/components/ui/Card/Card.jsx) | Add `to` prop (react-router `Link`); wrap in `RippleButton asChild`; reduced-motion gate |
| [`src/components/ui/Card/Card.module.css`](../../src/components/ui/Card/Card.module.css) | Rewrite onto MD3 tokens: tonal fill, state layer, tonal icon container; remove `translateY` lift |
| [`src/styles/global.css`](../../src/styles/global.css) | Append the `--md-*` token block to `:root` |
| [`src/constants/colors.js`](../../src/constants/colors.js) | Mirror the MD3 tokens under a new `md` key |
| [`src/components/layout/Sidebar/Sidebar.jsx`](../../src/components/layout/Sidebar/Sidebar.jsx) | Derive `mode` from pathname |
| [`docs/design.md`](../design.md) | Append two rows to the Decisions Log: Material You tokens, and cards-only scope |
| [`docs/design/colors.md`](../design/colors.md) | Document the `--md-*` set and that it is seeded from `#8B5CF6` |

Doc updates are required, not optional: `design.md` is the canonical token
table and its Decisions Log is where new design decisions land first
(see [docs/design/README.md](../design/README.md)).

---

## 8. Verification

Run the app (`npm run dev`) and check `/home`:

1. **Copy** — no em dash anywhere in the hero. Three sentences.
2. **Grid** — six cards under a "Tools" heading, each with a Phosphor glyph
   in a purple tonal circle, no emoji anywhere on the page.
3. **Navigation** — click each card in turn and confirm it lands on the route
   in the §2 table with **no full page reload** (the starfield should not
   re-initialise; DevTools Network shows no document request).
4. **Socials card** — lands on `/social/feed` *and* the sidebar switches to
   social mode (house + chat icons). Refresh on `/social/feed` and confirm it
   still shows social mode.
5. **Material interaction** — hover shows a flat tonal state layer with no
   upward lift; press shows a ripple originating at the cursor; keyboard
   `Tab` shows the purple focus ring; `Enter` activates the card.
6. **Reduced motion** — enable "Reduce motion" in the OS (or emulate
   `prefers-reduced-motion: reduce` in DevTools Rendering) and confirm no
   ripple and no transition, while hover/press states still change.
7. **Responsive** — at 480px, 640px, and 968px the grid reflows without
   horizontal overflow (`auto-fit, minmax(240px, 1fr)` handles this; confirm
   the wider card content does not force it).
8. **No regressions** — the "Find us online" pill row still opens its
   `RichTooltip` popovers; every other page still renders (the Card rewrite
   has no other consumer, so this should be a no-op elsewhere).
