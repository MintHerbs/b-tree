# Social Platform Security Audit

Date: 2026-05-16

Scope: `src/components/social`, `src/hooks/usePosts.js`, `src/hooks/useComments.js`, `src/hooks/useRateLimit.js`, `src/lib/supabaseClient.js`, and related social data flows.

## Summary

The social platform is currently a client-driven Supabase app. Basic React rendering protects text content from DOM XSS because post/comment/code values are rendered as text nodes, not with `dangerouslySetInnerHTML`. The highest-risk issues are authorization and abuse controls: ownership is based on a browser-stored `session_id`, and there are no committed Supabase migrations or RLS policies in this repo that prove the database enforces the same rules.

## Findings

### 1. Client-controlled ownership token

Severity: High

Posts, comments, votes, flags, polls, and rate limits use `localStorage.session_id` as the user identity. A user can edit local storage and impersonate another anonymous session if they learn or guess an ID from exposed rows. The UI also receives row `session_id` values to decide whether to show edit/delete controls.

Desired fix: move ownership enforcement to Supabase Auth or a server-issued signed anonymous token. If the platform must stay anonymous, store a hashed owner secret server-side and expose only a non-secret display identifier. Delete/update policies should compare against an authenticated claim, not a mutable browser value.

### 2. Missing committed database schema and RLS policy source of truth

Severity: High

The repo has no working `supabase/` or `db/sql/` migrations for the social tables. That means security depends on whatever exists in the hosted Supabase project, which cannot be reviewed, versioned, or tested here.

Desired fix: commit migrations for `posts`, `comments`, `post_votes`, `comment_votes`, `post_flags`, `polls`, `poll_votes`, `rate_limits`, and `bot_blacklist`. Enable RLS on every table. Add policies that allow public reads of non-deleted content, allow inserts with validated owner claims, and allow updates/deletes only for the row owner.

### 3. Rate limiting is client-controlled and non-atomic

Severity: High

Rate limit checks and increments happen from the browser. A user can skip the hook, race requests, clear local storage, or call Supabase directly. The current update pattern is not atomic, so concurrent requests can bypass counters.

Desired fix: replace browser-side rate-limit writes with a Postgres RPC or Edge Function that atomically checks and increments counters in one transaction. Rate by authenticated anonymous user plus IP/device signals where available. Keep the UI hook only for displaying errors.

### 4. Input validation is mostly client-side

Severity: Medium

Post content length, title stripping, comment depth, poll shape, and vote type are validated in React hooks. A direct Supabase client can bypass those checks unless the database has matching constraints.

Desired fix: add database constraints and triggers: content/comment max lengths, allowed vote types, poll option count 2-4, option length limits, max reply depth, allowed code language values, HTTPS-only GIF URLs, and foreign keys with cascade behavior for votes/polls/comments.

### 5. Public API keys in the browser

Severity: Medium

`VITE_TENOR_API_KEY` and `VITE_GEMINI_API_KEY` are client-exposed by design because they use the `VITE_` prefix. The social GIF feature uses Tenor directly from the browser; other app docs/code show Gemini exposed similarly.

Desired fix: proxy paid or quota-sensitive APIs through a server/Edge Function with origin checks and server-side rate limits. Tenor can remain client-side only if the key is restricted and acceptable to expose.

### 6. Realtime subscriptions may leak deleted or private metadata if RLS is weak

Severity: Medium

The feed subscribes to public changes for `posts`, `post_votes`, and `comments`. If RLS is not strict, realtime payloads can expose rows before client filters remove them.

Desired fix: add RLS policies for realtime-visible tables and ensure deleted/flagged rows are not visible to anon users unless needed. Prefer server-side soft-delete visibility policies over client-side filtering.

### 7. Delete/update success was ambiguous

Severity: Fixed in this pass

Post and comment deletes previously treated "zero rows updated" as success. That made failed deletes look successful or left users with a generic failure path.

Fix applied: delete operations now request the updated row id, return an ownership/not-found error when no row changed, and locally remove deleted posts after confirmed success.

### 8. Comment count freshness was incomplete

Severity: Fixed in this pass

The post feed did not subscribe to comment changes, so the comment pill could remain stale after comments were created or deleted.

Fix applied: the post hook now counts non-deleted comments directly and updates `comment_count` on realtime comment changes.

## Recommended Next Work

1. Add Supabase migrations and RLS policies as the authoritative backend.
2. Move rate-limit mutation and privileged moderation actions into Postgres RPCs or Edge Functions.
3. Add a small integration test suite against local Supabase for create, vote, comment, delete, poll vote, flag, and unauthorized update/delete attempts.
4. Add database constraints matching every client validation rule.
5. Stop exposing quota-sensitive third-party keys in `VITE_` variables.
