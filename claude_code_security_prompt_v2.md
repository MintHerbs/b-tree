# Security Implementation Task — Claude Code Prompt

## Context
The database migrations in `supabase_security_migrations_v2.sql` have been applied.
This task updates the client-side hooks to use the new RPCs correctly.

The schema uses:
- `session_id` as a **UUID** referencing `sessions(id)` — stored in `localStorage.session_id`
- `is_deleted = true` for soft deletes (no `deleted_at` column)
- `is_flagged` boolean on posts
- A `rate_limits` table with counter columns: `post_count`, `comment_count`, `chat_count`, `vote_count`

---

## Task 1 — Add `withSession` helper to `supabaseClient.js`

Add this export to `src/lib/supabaseClient.js`:

```js
/**
 * Sets app.session_id for the current transaction so RLS ownership
 * policies can evaluate correctly. Call before every mutating query.
 */
export async function withSession() {
  const sessionId = localStorage.getItem('session_id')
  if (!sessionId) return
  await supabase.rpc('set_session_id', { p_session_id: sessionId })
}
```

---

## Task 2 — Replace rate limit writes in `useRateLimit.js`

Replace any direct `supabase.from('rate_limits')` insert/update calls with the RPC:

```js
import { supabase } from '../lib/supabaseClient'

const LIMITS = {
  post:    { max: 5,  windowSecs: 3600  },
  comment: { max: 10, windowSecs: 3600  },
  chat:    { max: 20, windowSecs: 300   },
  vote:    { max: 50, windowSecs: 3600  },
}

export async function checkRateLimit(action) {
  const sessionId = localStorage.getItem('session_id')
  const { max, windowSecs } = LIMITS[action]

  const { data, error } = await supabase.rpc('check_and_increment_rate_limit', {
    p_session_id:  sessionId,
    p_action:      action,
    p_max_count:   max,
    p_window_secs: windowSecs,
  })

  if (error) throw new Error('Rate limit check failed')

  if (!data.allowed) {
    const mins = Math.ceil(data.retry_after_seconds / 60)
    throw new Error(
      `Slow down! You can ${action} again in ${mins > 1 ? `${mins} minutes` : `${data.retry_after_seconds} seconds`}.`
    )
  }

  return data
}
```

The existing UI that reads `retry_after_seconds` for the countdown timer should use
`data.retry_after_seconds` from this response directly.

---

## Task 3 — Add bot check before post/comment inserts in `usePosts.js` and `useComments.js`

Before every `supabase.from('posts').insert(...)` or `supabase.from('comments').insert(...)` call:

```js
const sessionId = localStorage.getItem('session_id')
const { data: botCheck } = await supabase.rpc('check_bot_blacklist', {
  p_session_id: sessionId
})

if (botCheck?.is_blacklisted) {
  throw new Error('Unable to post at this time.')
}
```

---

## Task 4 — Replace direct delete calls with soft-delete RPCs

### Posts (`usePosts.js`)

Replace any `.update({ is_deleted: true })` or `.delete()` call with:

```js
import { withSession } from '../lib/supabaseClient'

async function deletePost(postId) {
  await withSession()
  const sessionId = localStorage.getItem('session_id')

  const { data, error } = await supabase.rpc('soft_delete_post', {
    p_post_id:    postId,
    p_session_id: sessionId,
  })

  if (error || !data?.success) {
    throw new Error(data?.error || 'Failed to delete post')
  }

  // Remove from local state only after confirmed server success
  setPosts(prev => prev.filter(p => p.id !== postId))
}
```

### Comments (`useComments.js`)

```js
async function deleteComment(commentId) {
  await withSession()
  const sessionId = localStorage.getItem('session_id')

  const { data, error } = await supabase.rpc('soft_delete_comment', {
    p_comment_id: commentId,
    p_session_id: sessionId,
  })

  if (error || !data?.success) {
    throw new Error(data?.error || 'Failed to delete comment')
  }

  setComments(prev => prev.filter(c => c.id !== commentId))
}
```

---

## Task 5 — Add `withSession()` before all update calls

In `usePosts.js` and `useComments.js`, call `withSession()` before any
`.update()` query (post edits, etc.) so the RLS ownership policy can evaluate:

```js
await withSession()
const { error } = await supabase
  .from('posts')
  .update({ content, is_edited: true, updated_at: new Date().toISOString() })
  .eq('id', postId)

if (error) throw new Error('Update failed — not authorized or not found')
```

---

## Task 6 — Proxy the Gemini API key (if used)

If `VITE_GEMINI_API_KEY` is used anywhere in the social components:

1. Create `supabase/functions/gemini-proxy/index.ts`:
   - Accept POST `{ prompt: string }`
   - Call Gemini using `Deno.env.get('GEMINI_API_KEY')` (a Supabase secret, not a VITE_ var)
   - Return the response
   - Validate `Origin` header matches your domain

2. Replace frontend Gemini calls with calls to `/functions/v1/gemini-proxy`

3. Run: `supabase secrets set GEMINI_API_KEY=your_key_here`

4. Remove `VITE_GEMINI_API_KEY` from `.env`

Note: Tenor URLs in `GIF_PATTERNS` are regex-matched against user-pasted URLs, so no
Tenor API key is needed — leave that as-is.

---

## Do NOT change

- The existing triggers (`handle_post_flag`, `sync_post_votes`, `sync_comment_votes`,
  `check_comment_depth`) — these are correct and complete
- The existing constraints (`posts_content_length`, `posts_code_lines`,
  `comments_content_length`, `comments_max_depth`, vote `check` constraints) — already in DB
- The `is_flagged` / `is_deleted` filter logic in Realtime subscriptions — correct as-is
- The `unique (post_id, session_id)` constraint logic for votes/flags — DB handles dedup

---

## Files to change
- `src/lib/supabaseClient.js` — add `withSession()`
- `src/hooks/useRateLimit.js` — replace rate limit writes with RPC
- `src/hooks/usePosts.js` — bot check on insert, `withSession()` on update, RPC on delete
- `src/hooks/useComments.js` — bot check on insert, `withSession()` on update, RPC on delete
- `supabase/functions/gemini-proxy/index.ts` — new file (if Gemini is used)
