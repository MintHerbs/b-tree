# Feature Spec: Social Home Feed — v2
## Updated with UI/UX revisions, Tenor GIF search, carousel redesign, post actions

> **Changelog from v1**: Post-title modal flow, Tenor embedded search, portrait carousel with animate-ui icons & ripple buttons, post action icons from Lucide with custom flag shape, feed layout with vertical gutters + starfield bleed, rate limit bug fix, no navbar.

---

## 1. Overview

Two social features under the Globe sidebar icon:
- **Home Feed** (`/social/feed`) — anonymous Twitter-like post board
- **Global Chat** (`/social/chat`) — existing chat, typing indicators + limits

No top navbar. No "mooner.dev" branding. No online count header (online count lives in the Dynamic Island only).

---

## 2. Database Schema

*(Unchanged from v1 — all tables, indexes, triggers, RLS policies remain.)*

See v1 spec §2 for full SQL.

---

## 3. Component Architecture

```
src/
├── pages/
│   ├── HomeFeedPage.jsx
│   ├── HomeFeedPage.module.css
│   └── social/
│       └── guidelines.jsx
│
└── components/social/
    ├── PostComposer/
    │   ├── PostComposer.jsx
    │   ├── PostComposer.module.css
    │   ├── TitleModal/
    │   │   ├── TitleModal.jsx          ← NEW: modal shown on Post click
    │   │   └── TitleModal.module.css
    │   ├── TenorSearch/
    │   │   ├── TenorSearch.jsx         ← NEW: replaces URL input
    │   │   └── TenorSearch.module.css
    │   ├── PollBuilder/
    │   │   ├── PollBuilder.jsx
    │   │   └── PollBuilder.module.css
    │   └── CodeAttachment/
    │       ├── CodeAttachment.jsx
    │       └── CodeAttachment.module.css
    ├── PostCard/
    │   ├── PostCard.jsx
    │   └── PostCard.module.css
    ├── PostActions/
    │   ├── PostActions.jsx             ← UPDATED: Lucide icons + Hexagon flag
    │   └── PostActions.module.css
    ├── CommentSection/
    │   ├── CommentSection.jsx
    │   └── CommentSection.module.css
    ├── CommentItem/
    │   ├── CommentItem.jsx
    │   └── CommentItem.module.css
    ├── OnboardingCarousel/
    │   ├── OnboardingCarousel.jsx      ← UPDATED: portrait, animate-ui, ripple
    │   └── OnboardingCarousel.module.css
    ├── FeedSkeleton/
    │   ├── FeedSkeleton.jsx
    │   └── FeedSkeleton.module.css
    └── TypingIndicator/
        ├── TypingIndicator.jsx
        └── TypingIndicator.module.css
```

---

## 4. Layout: Feed Column with Starfield Gutters

### HomeFeedPage layout

```
┌────────────────────────────────────────────────────────────┐
│  [starfield bg]  │        feed column         │  [starfield]│
│                  │  (black, ~680px max-width)  │             │
│                  │                             │             │
│                  │  PostComposer               │             │
│                  │  ─────────────              │             │
│                  │  PostCard                   │             │
│                  │  PostCard                   │             │
│                  │  ...                        │             │
│                  │                             │             │
└────────────────────────────────────────────────────────────┘
```

**CSS rules:**
```css
.feedPage {
  min-height: 100vh;
  background: transparent; /* starfield is the page-level background */
  display: flex;
  justify-content: center;
  padding: 0 0 80px;
}

.feedColumn {
  width: 100%;
  max-width: 680px;
  background: #0a0a0a; /* near-black, not pure black */
  border-left: 1px solid rgba(255, 255, 255, 0.07);
  border-right: 1px solid rgba(255, 255, 255, 0.07);
  min-height: 100vh;
  padding: 0 0 40px;
}
```

The two faint vertical lines are the `border-left` and `border-right` on `.feedColumn`. Everything inside is `#0a0a0a`. Outside bleeds the existing starfield background. No extra wrappers needed.

---

## 5. PostComposer

### 5a. Composer layout (visual)

```
┌──────────────────────────────────────────────────────┐
│  [Avatar]  What's on your mind?                      │
│                                                      │
│  ──────────────────────────────────────────────      │
│  [📊 Poll]  [🗳 Vote]  [</> Code]  [GIF]    5/200   │
│                                                 [Post]│
└──────────────────────────────────────────────────────┘
```

- **No title field in the composer itself.** Title is prompted via TitleModal on Post click.
- Placeholder text: `"What's on your mind?"`
- Feature bar icons use **Lucide React**: `BarChart2`, `CheckSquare`, `Code2`, `ImagePlay`
- Character counter bottom-right of feature bar: `{n}/200`
- Post button: `RippleButton` from animate-ui (see §9), rounded pill, purple/violet accent

### 5b. Post button flow

```
User clicks Post
  → if content is empty: shake animation on textarea, do nothing
  → open TitleModal
      ├── "Add title?" input + [Add title] button (animate-ui RippleButton)
      └── [Skip & post] button (ghost variant RippleButton)
  → on either action: call submitPost(title | null)
  → on success: clear composer, close modal
  → on rate limit: show inline error below composer "You're posting too fast. Try again in Xs."
```

### 5c. TitleModal

```
┌─────────────────────────────────────────┐
│  Add a title? (optional)                │
│  ┌───────────────────────────────────┐  │
│  │ Title input...                    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [Add title]          [Skip & post]     │
└─────────────────────────────────────────┘
```

- Rendered as a centered overlay modal (backdrop blur, dark bg)
- Input maxLength: 100 chars
- `[Add title]` = `RippleButton` default variant
- `[Skip & post]` = `RippleButton` ghost variant
- Pressing Enter in input = same as clicking [Add title]
- Pressing Escape = close modal (cancel post)

### 5d. GIF — Tenor Embedded Search

Replace the old "paste a GIF URL" input with an inline Tenor search panel.

**Dependencies:**
```bash
# No npm package needed — use Tenor API v2 (free, requires API key)
# Add VITE_TENOR_API_KEY to .env
```

**TenorSearch component:**
```jsx
// Opens as an inline panel below the composer feature bar when GIF icon is clicked
// Renders a search input + scrollable grid of GIF results from Tenor API v2

const TENOR_API_KEY = import.meta.env.VITE_TENOR_API_KEY;

async function searchTenor(query) {
  const url = query
    ? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${TENOR_API_KEY}&limit=20&media_filter=gif`
    : `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=20&media_filter=gif`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results; // array of Tenor result objects
}

// Each result: result.media_formats.tinygif.url  → thumbnail preview
//              result.media_formats.gif.url       → full GIF (store this as gif_url)
//              result.itemurl                     → Tenor page URL (for attribution)
```

**Attribution requirement (Tenor ToS):** Show "via Tenor" text or Tenor logo near GIF picker.

**UX flow:**
1. Click GIF icon → TenorSearch panel slides in below feature bar
2. Panel shows featured GIFs by default (no query)
3. User types in search box → debounced 400ms → fetch results → replace grid
4. User clicks a GIF:
   - Set `selectedGif = { url: gif.media_formats.gif.url, preview: gif.media_formats.tinygif.url }`
   - Show preview thumbnail in composer (with ✕ to remove)
   - Close TenorSearch panel
5. On post submit: `gif_url = selectedGif.url`

**Panel CSS:**
```css
.tenorPanel {
  background: #111;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 12px;
  margin-top: 8px;
}

.gifGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  max-height: 240px;
  overflow-y: auto;
}

.gifItem img {
  width: 100%;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.15s;
}
.gifItem img:hover { opacity: 0.8; }
```

---

## 6. Rate Limit Bug Fix

**Problem:** Posts fail with a rate limit error immediately on first post attempt.

**Root cause (likely):** The `rate_limits` upsert in `useRateLimit.js` is either:
- a) Failing silently and throwing a Supabase error that gets caught as a rate-limit hit
- b) Comparing timestamps incorrectly (timezone mismatch between client `Date.now()` and Supabase `timestamptz`)

**Fix:**
```js
// useRateLimit.js — checkAndIncrementPostCount()
export async function checkAndIncrementPostCount(supabase, sessionId) {
  const now = new Date().toISOString(); // always ISO string for Supabase

  // Upsert with explicit conflict handling
  const { data: existing, error: fetchError } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle(); // use maybeSingle not single — won't throw on no rows

  if (fetchError) {
    console.error('[RateLimit] fetch error:', fetchError);
    return { allowed: true }; // fail open, don't block the user
  }

  if (!existing) {
    // First post ever — create row
    await supabase.from('rate_limits').insert({
      session_id: sessionId,
      post_count: 1,
      post_window_start: now,
    });
    return { allowed: true };
  }

  const windowStart = new Date(existing.post_window_start);
  const windowAge = (Date.now() - windowStart.getTime()) / 1000 / 60; // minutes

  if (windowAge >= 60) {
    // Window expired — reset
    await supabase.from('rate_limits').update({
      post_count: 1,
      post_window_start: now,
    }).eq('session_id', sessionId);
    return { allowed: true };
  }

  if (existing.post_count >= 5) {
    const nextAllowed = new Date(windowStart.getTime() + 60 * 60 * 1000);
    const secondsLeft = Math.ceil((nextAllowed - Date.now()) / 1000);
    return { allowed: false, secondsLeft };
  }

  // Increment
  await supabase.from('rate_limits').update({
    post_count: existing.post_count + 1,
  }).eq('session_id', sessionId);

  return { allowed: true };
}
```

**Also check:** Ensure `rate_limits` table has a row inserted for the session on first visit (or use the upsert approach above). The error `"new row violates row-level security policy"` on `rate_limits` means the RLS policy needs to allow anonymous insert — confirm this policy exists:
```sql
create policy "manage_rate_limits" on rate_limits for all using (true) with check (true);
```

---

## 7. PostActions — Icons & Flag Shape

Use **Lucide React** for all action icons.

```jsx
import { ArrowUp, ArrowDown, MessageCircle } from 'lucide-react';
```

For the flag/report action — **do not use a flag icon**. Use a custom hexagon shape that transitions to red when active:

```jsx
// HexagonFlag.jsx
function HexagonFlag({ flagged, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`${styles.hexFlag} ${flagged ? styles.flagged : ''}`}
      aria-label={flagged ? 'Flagged' : 'Flag post'}
      title={flagged ? 'You flagged this' : 'Flag as inappropriate'}
    >
      {/* SVG hexagon */}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 1L14.06 4.5V11.5L8 15L1.94 11.5V4.5L8 1Z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill={flagged ? 'currentColor' : 'none'}
        />
      </svg>
    </button>
  );
}
```

```css
/* PostActions.module.css */
.hexFlag {
  color: rgba(255,255,255,0.35);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: color 0.2s, transform 0.15s;
  display: flex;
  align-items: center;
}

.hexFlag:hover {
  color: rgba(255,255,255,0.7);
}

.hexFlag.flagged {
  color: #ef4444; /* red-500 */
}

.hexFlag:active {
  transform: scale(0.9);
}
```

**Full PostActions layout:**
```jsx
<div className={styles.actions}>
  {/* Upvote */}
  <button className={`${styles.voteBtn} ${userVote === 'up' ? styles.active : ''}`} onClick={() => vote('up')}>
    <ArrowUp size={15} />
    <span>{upvotes}</span>
  </button>

  {/* Downvote */}
  <button className={`${styles.voteBtn} ${userVote === 'down' ? styles.downActive : ''}`} onClick={() => vote('down')}>
    <ArrowDown size={15} />
    <span>{downvotes}</span>
  </button>

  {/* Comments */}
  <button className={styles.commentBtn} onClick={onCommentToggle}>
    <MessageCircle size={15} />
    <span>{commentCount}</span>
  </button>

  {/* Hexagon flag */}
  <HexagonFlag flagged={hasFlagged} onClick={onFlag} />
</div>
```

Active upvote color: `#7c3aed` (violet). Downvote active: `#64748b` (slate). Comment: muted white.

---

## 8. OnboardingCarousel — Redesign

### 8a. Install dependencies

```bash
npm install class-variance-authority
npx shadcn@latest add @animate-ui/components-buttons-button @animate-ui/primitives-buttons-ripple
npx shadcn@latest add @animate-ui/icons-message-circle-heart
```

### 8b. Layout

The carousel modal should be **portrait-oriented**, taller than wide:

```css
.carouselModal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  z-index: 1000;
}

.carouselCard {
  width: 360px;        /* narrow = portrait feel */
  min-height: 520px;   /* tall */
  background: #0f0f0f;
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 20px;
  padding: 40px 32px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0;
}
```

### 8c. Navigation

**No arrow buttons (← →).** Use:
- Dot indicators at the bottom (clickable circles, active dot = white, inactive = dim)
- Swipe gesture support (touch events or a lightweight library like `react-swipeable`)
- Forward progression on slide 1 and 2 via a single `[Continue]` ripple button at the bottom
- Slide 3 has `[Got it]` button

```jsx
// Dot indicators
<div className={styles.dots}>
  {slides.map((_, i) => (
    <button
      key={i}
      className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
      onClick={() => setCurrent(i)}
    />
  ))}
</div>
```

```css
.dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  border: none;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}
.dotActive {
  background: rgba(255,255,255,0.9);
  transform: scale(1.3);
}
```

### 8d. Slides

---

**Slide 1 — You are anonymous**

```
         ╔═══════════════════╗
         ║                   ║
         ║  [MessageCircleHeart animated icon — 56px]
         ║                   ║
         ║  Welcome to the   ║
         ║  Global Feed      ║
         ║                   ║
         ║  You are completely anonymous here.
         ║  No names, no accounts.
         ║  Only your ideas matter.
         ║                   ║
         ║  Your session ID is randomly generated
         ║  each time — nobody knows who you are,
         ║  not even us.     ║
         ║                   ║
         ║     [Continue]    ║
         ║                   ║
         ║      • ○ ○        ║
         ╚═══════════════════╝
```

Icon: `<MessageCircleHeart animateOnHover />` from animate-ui. Show it with `animate-on-mount` or trigger animation on slide enter. Size: 56px, color: `#7c3aed`.

---

**Slide 2 — Be respectful**

```
         ╔═══════════════════╗
         ║                   ║
         ║  Be Respectful    ║
         ║                   ║
         ║  This is a shared space for students.
         ║  Keep it constructive.
         ║                   ║
         ║  ✓  Ask genuine questions
         ║  ✓  Share study tips & resources
         ║  ✓  Support each other
         ║                   ║
         ║  ✗  No harassment or hate speech
         ║  ✗  No spam or off-topic content
         ║  ✗  No personal info sharing
         ║                   ║
         ║  Read full guidelines →           ║
         ║                                   ║
         ║       [Continue]                  ║
         ║         ○ • ○                     ║
         ╚═══════════════════╝
```

"Read full guidelines →" is a plain text link (`/social/guidelines`), no button styling.

---

**Slide 3 — Community Safety**

```
         ╔═══════════════════╗
         ║                   ║
         ║  [HexagonFlag icon — animated: inactive → red]
         ║                   ║
         ║  Community Safety ║
         ║                   ║
         ║  Every post can be flagged.
         ║  If 10 people flag a post,
         ║  it's automatically removed
         ║  for review.      ║
         ║                   ║
         ║  The hexagon icon on each post
         ║  is how you flag content that
         ║  violates the guidelines.
         ║                   ║
         ║  Use it responsibly.
         ║                   ║
         ║     [Got it]      ║
         ║      ○ ○ •        ║
         ╚═══════════════════╝
```

Icon: a HexagonFlag component (the same one used in PostActions) that runs an animation on slide enter:
```js
// On mount / slide enter: animate from dim/inactive → red/filled
useEffect(() => {
  const timer = setTimeout(() => setAnimated(true), 600);
  return () => clearTimeout(timer);
}, []);
```

```css
.hexDemo {
  width: 48px; height: 48px;
  color: rgba(255,255,255,0.25);
  transition: color 0.6s ease, filter 0.6s ease;
}
.hexDemo.animated {
  color: #ef4444;
  filter: drop-shadow(0 0 8px rgba(239,68,68,0.5));
}
```

---

### 8e. RippleButton usage

All carousel primary buttons use `RippleButton`:

```jsx
import { RippleButton, RippleButtonRipples } from '@/components/animate-ui/components/buttons/button';

// Continue / Got it button
<RippleButton variant="default" className={styles.carouselBtn}>
  Continue
  <RippleButtonRipples />
</RippleButton>
```

```css
.carouselBtn {
  width: 100%;
  border-radius: 50px; /* pill shape */
  background: #7c3aed;
  color: white;
  font-size: 0.9rem;
  padding: 12px 24px;
  margin-top: auto; /* push to bottom of card */
}
```

---

## 9. RippleButton — Global Usage

Install once:
```bash
npm install class-variance-authority
npx shadcn@latest add @animate-ui/components-buttons-button @animate-ui/primitives-buttons-ripple
```

Use `RippleButton` for:
- Carousel [Continue] / [Got it]
- PostComposer [Post] button
- TitleModal [Add title] and [Skip & post]
- Any primary CTA in the social feature

Always include `<RippleButtonRipples />` as last child. Use `rounded-full` or `border-radius: 50px` for pill shape where appropriate.

---

## 10. PostComposer — Full Feature Bar

```jsx
// Feature bar icons (Lucide)
import { BarChart2, CheckSquare, Code2, ImagePlay } from 'lucide-react';

const featureButtons = [
  { icon: BarChart2, label: 'Poll', action: 'poll' },
  { icon: CheckSquare, label: 'Vote', action: 'vote' },
  { icon: Code2, label: 'Code', action: 'code' },
  { icon: ImagePlay, label: 'GIF', action: 'gif' },
];
```

GIF button toggles TenorSearch panel (§5d). All others unchanged from v1.

---

## 11. Hooks

```
src/hooks/
├── usePosts.js         CRUD + realtime + vote/flag
├── useComments.js      CRUD + realtime + vote
├── useRateLimit.js     UPDATED: fix maybeSingle, fail-open on error (see §6)
└── useChat.js          existing + typing indicators
```

---

## 12. Environment Variables

Add to `.env`:
```
VITE_TENOR_API_KEY=your_tenor_api_v2_key
```

Get a free Tenor API v2 key at: https://developers.google.com/tenor/guides/quickstart

---

## 13. Rate Limiting Rules (unchanged)

| Action | Limit | Window |
|---|---|---|
| Post creation | 5 posts | per hour |
| Comment creation | 10 comments | per hour |
| Chat messages | 20 messages | per 5 minutes |
| Votes | 50 votes | per hour |

---

## 14. Routing (unchanged)

```
/social/feed        HomeFeedPage
/social/chat        ChatPanel
/social/guidelines  Community guidelines
```

---

## 15. Security Checklist (unchanged from v1)

- [x] Bot blacklist checked before every post/comment  
- [x] Rate limits enforced client-side + DB constraints as fallback  
- [x] Unique constraints on votes/flags  
- [x] DB check constraints for text length  
- [x] DB trigger enforces max comment depth (1)  
- [x] DB trigger auto-flags at 10 flags  
- [x] Post content sanitised: strip HTML before insert  
- [x] GIF URLs validated (Tenor API returns safe URLs)  
- [x] Poll option count: 2-4 only  
- [x] All deletes are soft  

---

## 16. Known Issues (to fix)

| # | Issue | Location | Fix |
|---|---|---|---|
| 1 | Rate limit error on first post | `useRateLimit.js` | Use `maybeSingle()`, fail open on Supabase errors (see §6) |
| 2 | CORS error `data:text/plain;base64,Cg==` | Unknown — likely an empty fetch/image src | Find any `src=""` or `fetch("")` calls and guard them |
| 3 | Composer shows title field inline | `PostComposer.jsx` | Remove inline title input; add `TitleModal` triggered on Post click |
| 4 | GIF requires manual URL paste | `PostComposer.jsx` | Replace with `TenorSearch` component |
