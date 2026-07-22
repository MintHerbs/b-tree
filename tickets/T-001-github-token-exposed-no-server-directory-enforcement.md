---
id: T-001
title: GitHub write token shipped to the browser; contributor directory restrictions unenforced server-side
status: done
severity: critical
area: admin
epic: E-001
created: 2026-07-19
---

## Summary

The admin editor writes/deletes repo content by calling the GitHub
Contents API directly from the browser with a personal access token
baked into the client bundle. That token has repo-wide write/delete
access, and the "contributor can only touch their allowed directories"
restriction exists only as client-side `if` checks — nothing on any
server verifies it.

## Evidence

- `src/lib/githubApi.js:1-4` — `const TOKEN = import.meta.env.VITE_GITHUB_TOKEN`, used to build a shared `Authorization: Bearer ${TOKEN}` header for every GitHub API call (`getFileSha`, `commitFile`, and the delete/list equivalents in the same file).
- `VITE_`-prefixed env vars are inlined as literal strings at build time (confirmed convention — see [docs/architecture-update.md §3.1](../docs/architecture-update.md)). This token is not a "safe to expose" anon key like the Supabase anon key; it's a GitHub PAT with write access.
- `src/pages/admin/AdminEditor.jsx:302-308` and `src/components/admin/DirectoryDrawer.jsx:67-69` gate UI actions on `allowedDirectories`/`isOwner` in JS conditionals — these are the only place the restriction is expressed.
- `commitFile`, `deleteFile`, `getFileContent`, `listDirectory` in `githubApi.js` accept a raw path string and perform the write/delete unconditionally — no role or `allowed_directories` check anywhere in that module.

## Impact

Anyone who loads `/admin` (authenticated or not — the token ships in the
bundle regardless of auth state) can read the GitHub token out of the
built JS or a network request and call the GitHub Contents API directly,
bypassing Supabase auth, RLS, and the app's UI entirely. A contributor
account restricted to one content directory can, from devtools, call the
already-imported `deleteFile`/`commitFile` against any path in the repo —
other contributors' directories, `modules.js`, or files outside
`src/content/notes/` altogether.

## Suggested fix

Move all GitHub write/delete operations behind a server boundary (per the
existing `/api/` convention already used for the Gemini proxy —
[docs/architecture-update.md §3.1](../docs/architecture-update.md)):
a Vercel function (or a third Supabase Edge Function alongside
`admin-create-user`/`admin-delete-user`) that (1) verifies the caller's
Supabase session and `admin_users` role/`allowed_directories` server-side,
then (2) performs the GitHub API call with a token that never reaches the
client. `VITE_GITHUB_TOKEN` should be deleted from `.env`/`.env.example`
once nothing in `src/` references it.

## Acceptance criteria

- [x] No `VITE_GITHUB_*` token is present in the built client bundle (verify via `dist/` grep, per the same acceptance bar as Issue #12's Gemini key check).
- [x] A contributor-role request to write/delete a path outside their `allowed_directories` is rejected server-side, independent of what the client sends.
- [x] Existing editor save/delete/move flows continue to work for owners and correctly-scoped contributors.

## References

- [docs/architecture-update.md §3.1](../docs/architecture-update.md) — server-boundary rule that would have prevented this
- Related pattern already done correctly: `supabase/functions/admin-create-user/index.ts`, `admin-delete-user/index.ts`
