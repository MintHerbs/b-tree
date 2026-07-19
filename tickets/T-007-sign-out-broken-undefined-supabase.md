---
id: T-007
title: Admin "Sign Out" throws a ReferenceError and never signs the user out
status: done
severity: medium
area: admin
epic: E-001
created: 2026-07-19
---

## Summary

Clicking "Sign out" in the admin editor throws `ReferenceError: supabase
is not defined` — the module that calls `supabase.auth.signOut()` never
imports `supabase`. The session is never actually cleared.

## Evidence

`src/pages/admin/AdminEditor.jsx:582-585`:

```js
const handleSignOut = async () => {
  await supabase.auth.signOut()
  window.location.href = '/admin'
}
```

Checked the file's import list (`AdminEditor.jsx:1-26`) — no
`import { supabase } from '...'` exists anywhere in the file, and no
global `window.supabase` is assigned anywhere in `src/`. This is the only
usage of a bare `supabase` reference in the file.

## Impact

Sign Out silently fails (the error surfaces in the console, not to the
user) and the Supabase session stays active. On a shared or public
machine, an admin who believes they've signed out has not — the next
person to open the browser can navigate straight back into `/admin`.

## Suggested fix

Add `import { supabase } from '../../lib/supabaseClient'` to
`AdminEditor.jsx` (the existing client used everywhere else in the app).

## Acceptance criteria

- [x] Clicking "Sign out" clears the Supabase session and redirects to `/admin`.
- [x] After signing out, navigating back to `/admin/editor` redirects to login (no stale session).

## References

- `src/lib/supabaseClient.js` — the existing shared client to import
