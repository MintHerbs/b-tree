-- 0018_sync_admin_users_grants.sql
-- Discovered while verifying 0017 against the hosted project: the live
-- admin_users table had drifted from what 0016/0017 describe. Live held
-- full table-level grants (arwdDxtm -- all privileges) to both anon and
-- authenticated, plus RLS policies ("authenticated read all",
-- "authenticated insert", "authenticated update", "authenticated delete")
-- gated only on "is this any authenticated session", with no owner check
-- at all. That let any admin account -- including contributors, not just
-- owners -- read, create, modify, or delete any admin_users row directly
-- via the REST API, bypassing the intended service-role-only Edge
-- Function gate for writes (a contributor could self-promote to owner).
--
-- Confirmed via full codebase grep that no legitimate code path relies on
-- client-side insert/update/delete against this table: every write goes
-- through supabase/functions/admin-{create,delete}-user and
-- admin-github-write, all of which use a service-role client that
-- bypasses RLS regardless of these policies. Client-side code only ever
-- does .select() (src/lib/adminSupabase.js, src/components/admin/UsersDrawer.jsx).
--
-- This migration re-states the full intended policy set from scratch
-- (rather than layering another delta on top of 0016+0017) so the table's
-- RLS/grants have one canonical definition instead of three files' worth
-- of partial history to reconcile.

drop policy if exists "authenticated read all" on admin_users;
drop policy if exists "authenticated insert" on admin_users;
drop policy if exists "authenticated update" on admin_users;
drop policy if exists "authenticated delete" on admin_users;
drop policy if exists "read own profile" on admin_users;
drop policy if exists "Owners can view all admin users" on admin_users;
drop policy if exists "Users can view own profile" on admin_users;

create or replace function is_owner(uid uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from admin_users
    where id = uid and role = 'owner'
  );
$$;

create policy "Users can view own profile"
  on admin_users for select
  using ( id = auth.uid() );

create policy "Owners can view all admin users"
  on admin_users for select
  using ( is_owner(auth.uid()) );

revoke all on admin_users from anon, authenticated;
grant select on admin_users to authenticated;
