---
id: T-014
title: Hosted admin_users RLS/grants drifted from repo migrations, letting contributors self-promote to owner
status: done
severity: high
area: admin
epic: E-001
created: 2026-07-19
---

## Summary

While empirically verifying the T-006 fix against the hosted Supabase
project (read-only MCP connection), the live `admin_users` table turned
out not to match `db/sql/0016`/`0017` at all. Live grants full table
privileges to `anon`/`authenticated`, and its RLS policies gate every
operation on "is this any authenticated session" with no owner check —
letting any admin account, including `contributor`s, read, insert,
update, or delete any `admin_users` row directly via the REST API,
bypassing the app's intended service-role-only Edge Function gate for
writes.

## Evidence

Queried directly against the hosted project (`project_ref=uidwarvgznzsutotuabv`)
via the Supabase MCP connection:

```sql
select policyname, cmd, qual from pg_policies where tablename = 'admin_users';
-- authenticated delete  | DELETE | (auth.role() = 'authenticated'::text)
-- authenticated insert  | INSERT | null (with_check: auth.role() = 'authenticated'::text)
-- authenticated read all| SELECT | (auth.role() = 'authenticated'::text)
-- authenticated update  | UPDATE | (auth.role() = 'authenticated'::text)
-- read own profile      | SELECT | (id = auth.uid())

select relacl from pg_class where relname = 'admin_users';
-- {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}
```

`arwdDxtm` is every table privilege (insert/select/update/delete/truncate/
references/trigger/maintain), granted directly to both `anon` and
`authenticated` — not just `select` as `db/sql/0016_init_admin_users.sql`
describes. None of the four RLS policies check `role = 'owner'`; they
only check that the caller is signed in at all.

`select relrowsecurity, relforcerowsecurity from pg_class where relname =
'admin_users'` returned `(true, false)` — RLS is enabled, so these
policies are the actual live gate, not dead weight.

Confirmed via `grep -rn "admin_users" src/ supabase/functions/` that no
legitimate code path relies on client-side write access to this table:
`src/lib/adminSupabase.js` and `src/components/admin/UsersDrawer.jsx`
only ever `.select()`; all inserts/updates/deletes happen inside
`supabase/functions/admin-create-user`, `admin-delete-user`, and
`admin-github-write`, every one of which reads `admin_users` through a
`service_role` client that bypasses RLS entirely regardless of these
policies.

Also confirmed (separate check) that this project has no public sign-up
path — `signUp`/`signInWithOtp`/`signInWithOAuth`/`signInAnonymously` are
absent from `src/`; the only way to obtain an `authenticated` session is
`signInWithPassword` against a pre-provisioned admin account
(`src/pages/admin/AdminLogin.jsx`). The social/chat features run fully
anonymously via a client-generated `session_id`, not real Supabase Auth,
so they hit the database as `anon`, not `authenticated`.

## Impact

Not exploitable by the general public (no self-service sign-up exists).
It **is** exploitable by any existing `contributor`-role admin account:
a straightforward authenticated REST call —
`update admin_users set role = 'owner' where id = auth.uid()` (or insert/
delete against any other row) — succeeds against the live project today,
fully bypassing the "only owners can manage users, only via the
service-role Edge Function" model the UI enforces. That's a live
contributor → owner privilege escalation, independent of the RLS
recursion issue T-006 was originally about.

## Suggested fix

Re-state `admin_users`'s RLS policies and grants from scratch (rather
than layering another delta) so there's one canonical definition instead
of reconciling three files' worth of partial history. Written and
applied to the local dev stack as
[db/sql/0018_sync_admin_users_grants.sql](../db/sql/0018_sync_admin_users_grants.sql):
drops all four drifted/vestigial policies, recreates the two intended
SELECT-only policies (own profile + `is_owner()`-gated owner view), and
revokes all privileges from `anon`/`authenticated` before granting back
bare `SELECT` to `authenticated` only.

## Acceptance criteria

- [x] Confirm empirically what's actually deployed on the hosted project (not just assume `0016`/`0017` reflect it).
- [x] Root-cause why it diverged enough to rule out a legitimate reason for the extra write policies (confirmed: no code path uses them).
- [x] Write and verify a corrective migration against the local dev stack (`0018`, verified: only two SELECT policies remain, `authenticated` has bare `SELECT`, `anon` has none).
- [x] **Apply `db/sql/0018_sync_admin_users_grants.sql` to the hosted project.** Applied via `mcp__supabase__apply_migration` (migration name `sync_admin_users_rls_and_grants_to_repo_intent`) once the MCP connection's `read_only` flag was switched to `false` in `.mcp.json` and a fresh connection picked it up.
- [x] Re-verify against the hosted project after manual application (same queries as in Evidence, above) to confirm it matches the local dev stack's post-`0018` state.

Re-verification results (hosted project, post-apply):

```sql
select policyname, cmd, qual from pg_policies where tablename = 'admin_users';
-- Owners can view all admin users | SELECT | is_owner(auth.uid())
-- Users can view own profile      | SELECT | (id = auth.uid())

select relacl from pg_class where relname = 'admin_users';
-- {postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres,authenticated=r/postgres}
-- (anon absent entirely -- no privileges)

select proname, prosecdef from pg_proc where proname = 'is_owner';
-- is_owner | t
```

Exactly two SELECT-only policies, `authenticated` reduced to bare
`SELECT`, `anon` has nothing, `is_owner()` exists as a security-definer
function. Matches the local dev stack's post-`0018` state exactly.

## Blocked by

Resolved. Required a human to flip `.mcp.json`'s `read_only` flag to
`false` and start a fresh MCP connection (auto-mode's safety classifier
does not allow agent-initiated writes to a detected shared/production
database, and the prior read-only MCP connection was rejected server-side
regardless). Once both were addressed, `db/sql/0018_sync_admin_users_grants.sql`
was applied and re-verified against the hosted project as above.

## References

- [T-006](T-006-admin-users-rls-self-reference-recursion-risk.md) — discovered while verifying this ticket's fix against the hosted project
- [db/sql/0018_sync_admin_users_grants.sql](../db/sql/0018_sync_admin_users_grants.sql)
