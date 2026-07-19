---
id: T-006
title: Self-referential RLS policy on admin_users risks recursion error / full admin lockout
status: done
severity: medium
area: admin
epic: E-001
created: 2026-07-19
---

## Summary

The "owners can view all admin users" RLS policy on `admin_users` queries
`admin_users` from inside its own policy definition. This is a documented
Postgres/Supabase footgun ("infinite recursion detected in policy for
relation ...") — and if it does fire in this project's Supabase instance,
the blast radius is worse than the user-list feature: it could break
every `select` against `admin_users`, including the own-profile lookup
every admin page load depends on, effectively locking every admin
(including owners) out of `/admin` entirely.

## Evidence

`db/sql/0016_init_admin_users.sql:21-29`:

```sql
create policy "Owners can view all admin users" on admin_users for select
  using ( exists (select 1 from admin_users where id = auth.uid() and role = 'owner') );
```

This queries `admin_users` from within a policy defined on `admin_users`
itself. Postgres applies RLS to every reference to a protected relation,
including a `FROM admin_users` nested inside another policy's own
qualifying expression — the structural shape Postgres's recursion
detector exists to catch, and exactly the pattern Supabase's own RLS docs
recommend avoiding via a `security definer` helper function.

`src/lib/adminSupabase.js`'s `getAdminProfile()` — called from
`useAdmin.js` on every admin page load — runs a plain `select ... eq('id',
userId).single()` against the same table. If the owner-policy recursion
error fires, `useAdmin.js`'s "redirect to `/admin` on any error" behavior
means this profile lookup itself could start failing for everyone, not
just the owner-only user list.

**Verification status:** this was reasoned from Postgres/Supabase RLS
mechanics, not reproduced against a live instance (no Postgres/Supabase
CLI was reachable during the audit that found this). Confidence it fires
is high but not certain — confirm empirically before treating this as
fully resolved-by-analysis.

## Impact

Best case: owners get an error loading the Users page. Worst case:
`admin_users` becomes unqueryable entirely, and every admin (owners
included) gets bounced to `/admin` on every page load, since
`getAdminProfile()` throwing is treated the same as "not authenticated."

**Folded scope (formerly T-009):** the same table also grants `SELECT` to
the `anon` Postgres role in addition to `authenticated`
(`db/sql/0016_init_admin_users.sql:61-62`):

```sql
grant usage on schema public to anon, authenticated;
grant select on admin_users to anon, authenticated;
```

RLS currently blocks `anon` from reading any rows (both SELECT policies
require `id = auth.uid()`, which is `NULL` for unauthenticated requests
and never matches) — not an active vulnerability today, but unnecessary
attack surface: if RLS is ever disabled or a future policy is added
carelessly, `anon` is already primed to expose the full `admin_users`
table (usernames, emails, roles, `allowed_directories`) with zero
additional change needed. Folded here because it's the same file, same
table, and lands in the same migration as the recursion fix below —
there's no reason to ship these as two separate migrations.

## Suggested fix

- Replace the self-referential `exists (select ... from admin_users ...)`
  with a `security definer` helper function (e.g. `is_owner(uid uuid)
  returns boolean`) that Postgres does not re-apply RLS to when called
  from within a policy — Supabase's documented pattern for exactly this
  case. Have the policy call `is_owner(auth.uid())` instead of the raw
  subquery.
- In the same migration, narrow the grant: `grant select on admin_users
  to authenticated;` (drop `anon` from that grant).

## Acceptance criteria

- [x] Confirm empirically (against a real Supabase project, local or staging) whether the current policy actually throws a recursion error today. Confirmed against a local Supabase stack: the original `0016` policy throws `infinite recursion detected in policy for relation "admin_users"` when queried as an authenticated owner.
- [x] Whether or not it currently fires, replace the pattern with the `security definer` helper function approach so it can't regress into a live incident later. Shipped in `db/sql/0017_fix_admin_users_rls.sql` (`is_owner(uid uuid)`).
- [x] An owner can load the Users list; a non-owner authenticated user still only sees their own profile row. Verified: owner query returns all rows (no recursion), contributor query returns only their own row.
- [x] `anon` no longer has SELECT on `admin_users`. Verified: anon query fails with `permission denied for table admin_users` (42501) after the `revoke`.
- [x] Authenticated admin flows (login, profile lookup, owner user-list) continue to work unchanged. `getAdminProfile()` and `UsersDrawer.jsx`'s `loadUsers()` queries both exercised directly against the local stack post-`0017`, both succeed as expected.

## References

- Supabase docs: avoiding recursive RLS policies (security definer function pattern)
- [T-009](T-009-admin-users-anon-select-grant.md) — folded into this ticket, same table/file/migration
