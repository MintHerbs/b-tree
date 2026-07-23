-- 0022_admin_delete_lock_and_visibility.sql
-- T-045 phases B+C: lock delete (subject/folder/file) to one named account,
-- and add a "hide from live site" flag for Subjects/folders/notes.
--
-- Full design: docs/specs/admin-drive-navigation.md §6-§9.
--
-- ─── Phase B: delete lockdown ────────────────────────────────────────────────
-- Today `notes owner delete` / `note_folders delete scoped` (0020_init_notes.sql)
-- let ANY owner-role account delete. The owner asked for delete narrowed to one
-- specific account regardless of how many accounts hold the `owner` role. This
-- is an additional, narrower check stacked on top of the existing one — not a
-- replacement — so an out-of-scope contributor is still blocked exactly as
-- before, and even an `owner` row is now blocked unless it's this account.
--
-- Deliberately NOT applied to the notes cross-subject-move check (the
-- `notes_set_metadata` trigger's owner-only `module_id` change rule) — the
-- owner's ask was specifically about delete; moving a note between subjects
-- isn't a delete and narrowing it further wasn't requested.
--
-- Checks the verified JWT email (auth.jwt()), NOT admin_users.email — that
-- column is an admin-editable profile field, not an identity claim, and using
-- it here would let a mis-set or compromised profile row grant itself delete
-- rights (see docs/specs/admin-drive-navigation.md §6).
create or replace function public.admin_is_delete_authorized()
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'moon@mooner.dev';
$$;

drop policy if exists "notes owner delete" on public.notes;
create policy "notes delete locked"
  on public.notes for delete
  using ( public.admin_can_write_module(module_id) and public.admin_is_delete_authorized() );

drop policy if exists "note_folders delete scoped" on public.note_folders;
create policy "note_folders delete locked"
  on public.note_folders for delete
  using ( public.admin_can_write_module(module_id) and public.admin_is_delete_authorized() );

revoke execute on function public.admin_is_delete_authorized() from public;
grant execute on function public.admin_is_delete_authorized() to authenticated;

-- ─── Phase C: hide from live site ────────────────────────────────────────────
-- Notes/folders already live in the DB, so a column is enough — the existing
-- scoped UPDATE policies on notes/note_folders already cover writing it, no
-- new policy needed. Subjects live in code (modules.js) with no row of their
-- own, so a side table is the only place their visibility state can live
-- without a redeploy per toggle.
alter table public.notes        add column if not exists hidden boolean not null default false;
alter table public.note_folders add column if not exists hidden boolean not null default false;

create table if not exists public.module_visibility (
  module_id  text primary key,
  hidden     boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.module_visibility enable row level security;

drop policy if exists "module_visibility public read" on public.module_visibility;
create policy "module_visibility public read"
  on public.module_visibility for select
  using ( true );

-- Subject-level actions (create/rename/delete) are owner-only everywhere else
-- in the admin panel (subjects require a modules.js commit); hide follows the
-- same rule. Not delete-locked — hiding isn't destructive.
drop policy if exists "module_visibility owner write" on public.module_visibility;
create policy "module_visibility owner write"
  on public.module_visibility for insert
  with check ( public.is_owner(auth.uid()) );

drop policy if exists "module_visibility owner update" on public.module_visibility;
create policy "module_visibility owner update"
  on public.module_visibility for update
  using ( public.is_owner(auth.uid()) )
  with check ( public.is_owner(auth.uid()) );

create or replace function public.module_visibility_set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists module_visibility_set_updated_at_trg on public.module_visibility;
create trigger module_visibility_set_updated_at_trg
  before update on public.module_visibility
  for each row execute function public.module_visibility_set_updated_at();

grant select on public.module_visibility to anon, authenticated;
grant insert, update on public.module_visibility to authenticated;
