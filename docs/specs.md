# Presence Tracking + Dynamic Island + Music Player — Spec

## Overview

Add three interconnected features to the existing Vite + React project:
1. Session-based presence tracking via Supabase (database already created)
2. A Dynamic Island pill fixed at the top center of every page
3. A hidden YouTube music player controllable from the pill

These features are global — they render outside all routes and persist across page navigation.

---

## Environment Variables

The `.env` file in the repo root already contains:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Access them in code as:
```js
import.meta.env.VITE_SUPABASE_URL
import.meta.env.VITE_SUPABASE_ANON_KEY
```

Do NOT use `process.env` — this is a Vite project, not Node. Always use `import.meta.env`.

---

## Database (already exists in Supabase)

Table `sessions` has already been created with this schema:
```sql
create table sessions (
  id uuid primary key,
  last_seen timestamptz not null default now()
);
```

Do not create or modify any SQL. Just read and write to this table.

---

## New Files & Structure

```
src/
├── hooks/
│   └── usePresence.js              # Session ID + ping + online count
│
├── components/
│   ├── DynamicIsland/
│   │   ├── DynamicIsland.jsx       # The pill component
│   │   └── DynamicIsland.module.css
│   │
│   └── MusicPlayer/
│       ├── MusicPlayer.jsx         # Hidden YouTube IFrame API player
│       └── MusicPlayer.module.css
│
└── App.jsx                         # Wire everything at root level
```

---

## Part 1 — usePresence.js

Location: `src/hooks/usePresence.js`

This is a pure React hook. No Vercel API routes — call Supabase directly from the
frontend using `@supabase/supabase-js`.

Install if not already installed:
```
npm install @supabase/supabase-js
```

### Logic

```js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

On mount:
1. Check `localStorage.getItem('session_id')`. If null, generate a new UUID with
   `crypto.randomUUID()` and save it with `localStorage.setItem('session_id', id)`.
2. Immediately call `pingSession(sessionId)`.
3. Set up `setInterval(() => pingSession(sessionId), 30000)`.
4. Immediately call `fetchOnlineCount()`.
5. Set up `setInterval(() => fetchOnlineCount(), 30000)`.
6. On unmount, clear both intervals.

`pingSession(sessionId)`:
```js
await supabase
  .from('sessions')
  .upsert({ id: sessionId, last_seen: new Date().toISOString() })
```

`fetchOnlineCount()`:
```js
const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
const { count } = await supabase
  .from('sessions')
  .select('*', { count: 'exact', head: true })
  .gte('last_seen', twoMinutesAgo)
setOnlineCount(count ?? 1)
```

Expose: `{ onlineCount }` — default value `1` (the current user is always online).
Handle all errors silently with try/catch — never crash the UI.

---

## Part 2 — MusicPlayer.jsx

Location: `src/components/MusicPlayer/MusicPlayer.jsx`

A `forwardRef` component that renders a hidden div and manages the YouTube IFrame API.

### Implementation

```jsx
import { forwardRef, useImperativeHandle, useEffect } from 'react'

const MusicPlayer = forwardRef((props, ref) => {
  // renders <div id="yt-player" /> hidden offscreen
  // injects YouTube IFrame API script on mount
  // creates YT.Player once API is ready
  // exposes play() and pause() via useImperativeHandle
})
```

Hidden div style: `position: fixed`, `top: -9999px`, `left: -9999px`,
`width: 1px`, `height: 1px`, `opacity: 0`, `pointer-events: none`.

YouTube IFrame API setup:
```js
useEffect(() => {
  // Only inject script once globally
  if (!window.YT && !document.getElementById('yt-api-script')) {
    const script = document.createElement('script')
    script.id = 'yt-api-script'
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(script)
  }

  const initPlayer = () => {
    playerRef.current = new window.YT.Player('yt-player', {
      videoId: 'wjJ3-SzxhCk',
      playerVars: {
        autoplay: 1,
        loop: 1,
        playlist: 'wjJ3-SzxhCk',
        controls: 0,
        mute: 0
      },
      events: {
        onReady: (e) => e.target.playVideo()
      }
    })
  }

  if (window.YT && window.YT.Player) {
    initPlayer()
  } else {
    window.onYouTubeIframeAPIReady = initPlayer
  }

  return () => {
    if (playerRef.current) playerRef.current.destroy()
  }
}, [])
```

`useImperativeHandle(ref, () => ({ play, pause }))` where:
- `play()` calls `playerRef.current?.playVideo()`
- `pause()` calls `playerRef.current?.pauseVideo()`

---

## Part 3 — DynamicIsland.jsx

Location: `src/components/DynamicIsland/DynamicIsland.jsx`

### Props
```js
{
  onlineCount: number,
  isPlaying: boolean,
  onPlayPause: () => void
}
```

### Positioning
```css
position: fixed;
top: 16px;
left: 50%;
transform: translateX(-50%);
z-index: 9999;
```

### Pill appearance
```css
background: #000;
border: 1px solid #1a1a1a;
border-radius: 9999px;
box-shadow:
  0 0 0 1px #222,
  0 8px 32px rgba(0, 0, 0, 0.9),
  0 2px 12px rgba(0, 0, 0, 0.7);
```

The double shadow makes the black pill visible against the black page background.
Do NOT use any purple from the site's color scheme. Pill stays pitch black.

### Entrance animation

On mount, the pill is invisible and offset upward:
```css
opacity: 0;
transform: translateX(-50%) translateY(-24px);
```

After a `3000ms` delay, it transitions to:
```css
opacity: 1;
transform: translateX(-50%) translateY(0);
transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
```

Implement this with a `useEffect` + `setTimeout(3000)` that adds a CSS class.

### States

**Collapsed (default, not hovered):**
- Pill is `40px` tall, `40px` wide (a small circle).
- Contains only a single `8px` green dot (`#22c55e`) centered.
- Transition: `width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)`.

**Expanded (on hover):**
- Pill expands to `auto` width (min `220px`), `40px` tall.
- Left section: green dot + `"{onlineCount} online"` text in `#fff`, `font-size: 12px`,
  `font-weight: 500`. Gap `6px` between dot and text.
- Divider: `1px solid #2a2a2a`, `height: 16px`, `margin: 0 12px`.
- Right section: music icon — show `⏸` if `isPlaying`, show `▶` if not.
  Icon in `#fff`, `font-size: 14px`. Clicking calls `onPlayPause`.
- Below the right icon, in `font-size: 9px`, `color: rgba(255,255,255,0.35)`:
  text `"click to control"`. This hint disappears permanently after the user
  clicks `onPlayPause` once. Store in `useState(true)` — set to false on first click.
- Padding: `0 16px`.

Use CSS `max-width` + `overflow: hidden` + `transition` instead of animating `width`
directly, to avoid layout jank.

### No external animation library needed
Implement all animations with CSS transitions + `useState`/`useEffect`.
Do NOT install Framer Motion or GSAP for this component.
The SmoothUI CLI install is also not needed — build this from scratch following
the design above. The SmoothUI page was referenced for design inspiration only.

---

## Part 4 — App.jsx wiring

Add the following at the root level of `App.jsx`, outside all `<Route>` elements
so they render on every page:

```jsx
const { onlineCount } = usePresence()
const musicPlayerRef = useRef(null)
const [isPlaying, setIsPlaying] = useState(false)

const handlePlayPause = () => {
  if (isPlaying) {
    musicPlayerRef.current?.pause()
  } else {
    musicPlayerRef.current?.play()
  }
  setIsPlaying(prev => !prev)
}

// In JSX:
<MusicPlayer ref={musicPlayerRef} />
<DynamicIsland
  onlineCount={onlineCount}
  isPlaying={isPlaying}
  onPlayPause={handlePlayPause}
/>
<RouterProvider /> {/* or whatever the existing router setup is */}
```

Make sure `MusicPlayer` and `DynamicIsland` are siblings to the router, not nested
inside any route component. They must persist across all route changes.

---

## Design Rules

- Pill is always `#000` — never purple, never transparent.
- Shadow is the only thing separating it visually from the black background.
- Green dot is `#22c55e` — the only non-black, non-white element in the pill.
- All text inside pill is `#fff` or `rgba(255,255,255,0.35)` for hints.
- Do not add any hover glow, purple border, or accent color to the pill.
- Do not modify any existing component outside of `App.jsx`.

---

## Files That Must Not Be Modified

Everything except `App.jsx`. All existing pages, components, hooks, and lib files
are untouched. Only add new files and modify `App.jsx`.
