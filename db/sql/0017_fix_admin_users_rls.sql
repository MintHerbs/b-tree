-- 0017_fix_admin_users_rls.sql
-- Fixes the self-referential "Owners can view all admin users" policy on
-- admin_users (0016), which queries admin_users from inside its own
-- policy definition and can trigger Postgres's "infinite recursion
-- detected in policy for relation" error. Replaces it with a security
-- definer helper function, Supabase's documented pattern for this exact
-- case. Also narrows the SELECT grant to authenticated only — anon never
-- legitimately needs it, and RLS blocking anon today is not a substitute
-- for not granting it in the first place. See tickets/T-006.

-- security definer means Postgres does not re-apply RLS to the internal
-- query below, breaking the self-reference. search_path is pinned to
-- guard against search-path hijacking of a definer-rights function.
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

drop policy if exists "Owners can view all admin users" on admin_users;

create policy "Owners can view all admin users"
  on admin_users for select
  using ( is_owner(auth.uid()) );

revoke select on admin_users from anon;
