-- 0020_init_notes.sql
-- E-005 / T-043 (Phase A): move note CONTENT to Supabase as the source of truth.
--
-- Notes were build-time static Markdown: bundled by `import.meta.glob` and
-- listed in a hand-maintained `modules.js` `notes[]` registry that every save
-- rewrote with regex surgery. This table makes note content runtime data — a
-- save becomes one upsert and is live on the next reader load, no rebuild.
--
-- Identity is (module_id, path): `path` is the note's location relative to its
-- module, WITHOUT the `.md` extension — exactly the old `notes[].filename`
-- value and the on-disk `src/content/notes/<module_id>/<path>.md` layout.
-- `path` may contain slashes (e.g. 'notes • sem 1/determinant',
-- 'Labs/C Programming/introduction'); the first segment is the display
-- subfolder. `title` carries the old registry LABEL (e.g. 'determinant.md') so
-- the sidebar renders unchanged; the visible note heading is still the
-- Markdown `# H1`.
--
-- Structural module definitions (id, label, Icon React component, route,
-- tools) deliberately STAY in modules.js — only note content moves here.
--
-- Authorization reproduces the admin-github-write Edge Function exactly
-- (isPathAllowed): owners write anything, everyone else (including role
-- 'admin') writes only modules listed in their admin_users.allowed_directories.
-- Reuses the existing is_owner(uuid) security-definer helper (migration 0017).

-- ─── Helper: admin_can_write_module ──────────────────────────────────────────
-- Mirrors isPathAllowed(path, role, allowedDirectories) for a module id.
-- SECURITY DEFINER so RLS policies can read admin_users without the caller
-- needing direct SELECT on it (same pattern as is_owner).
create or replace function public.admin_can_write_module(p_module_id text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from admin_users
    where id = auth.uid()
      and (role = 'owner' or p_module_id = any(allowed_directories))
  );
$$;

-- ─── notes ───────────────────────────────────────────────────────────────────
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  module_id   text        not null,
  path        text        not null,
  title       text        not null default '',
  content_md  text        not null default '',
  updated_at  timestamptz not null default now(),
  updated_by  uuid        references auth.users(id) on delete set null,
  unique (module_id, path)
);

create index if not exists notes_module_id_idx on public.notes (module_id);

alter table public.notes enable row level security;

-- Policies use drop-if-exists guards so this migration is safely re-runnable
-- (Postgres has no CREATE POLICY IF NOT EXISTS).

-- Public content: anyone (anon or authenticated) may read.
drop policy if exists "notes public read" on public.notes;
create policy "notes public read"
  on public.notes for select
  using ( true );

-- Create: only within a module the caller may write.
drop policy if exists "notes insert scoped" on public.notes;
create policy "notes insert scoped"
  on public.notes for insert
  with check ( public.admin_can_write_module(module_id) );

-- Update: caller must be able to write the row's module both before (USING,
-- the existing module_id) and after (WITH CHECK, the new module_id) — so a
-- contributor can never move a note into a module outside their scope. The
-- BEFORE UPDATE trigger below additionally makes any module_id CHANGE
-- owner-only, matching the Edge Function's owner-only cross-subject move.
drop policy if exists "notes update scoped" on public.notes;
create policy "notes update scoped"
  on public.notes for update
  using ( public.admin_can_write_module(module_id) )
  with check ( public.admin_can_write_module(module_id) );

-- Delete: owner-only, matching admin-github-write's owner-gated deleteFile.
-- (Rename/move is an UPDATE in this model, so contributors never need DELETE.)
drop policy if exists "notes owner delete" on public.notes;
create policy "notes owner delete"
  on public.notes for delete
  using ( public.is_owner(auth.uid()) );

-- ─── note_folders ─────────────────────────────────────────────────────────────
-- Empty subfolders have no note rows to derive their existence from, so they
-- are tracked here (replaces the ad-hoc `subfolders:` field the old modules.js
-- regex surgery maintained for T-027). `name` is a first-level subfolder name
-- under a module (e.g. 'notes • sem 2'). Once a note is added under that name
-- the folder also shows up via notes.path; the row is then redundant, not
-- wrong, and is cleaned up on folder rename/delete.
create table if not exists public.note_folders (
  id         uuid primary key default gen_random_uuid(),
  module_id  text        not null,
  name       text        not null,
  created_at timestamptz not null default now(),
  unique (module_id, name)
);

alter table public.note_folders enable row level security;

drop policy if exists "note_folders public read" on public.note_folders;
create policy "note_folders public read"
  on public.note_folders for select
  using ( true );

drop policy if exists "note_folders insert scoped" on public.note_folders;
create policy "note_folders insert scoped"
  on public.note_folders for insert
  with check ( public.admin_can_write_module(module_id) );

drop policy if exists "note_folders update scoped" on public.note_folders;
create policy "note_folders update scoped"
  on public.note_folders for update
  using ( public.admin_can_write_module(module_id) )
  with check ( public.admin_can_write_module(module_id) );

drop policy if exists "note_folders delete scoped" on public.note_folders;
create policy "note_folders delete scoped"
  on public.note_folders for delete
  using ( public.admin_can_write_module(module_id) );

-- ─── Metadata + owner-only module reassignment trigger ────────────────────────
-- On write, stamp updated_at/updated_by. On UPDATE, if module_id changes,
-- require the caller to be an owner (reproduces the owner-only cross-subject
-- move rule; the scoped UPDATE policy already prevents writing into an
-- out-of-scope module, this adds the "only owners move between subjects" rule).
create or replace function public.notes_set_metadata()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  if tg_op = 'UPDATE' and new.module_id is distinct from old.module_id then
    if not public.is_owner(auth.uid()) then
      raise exception 'Only owners can move a note to a different subject';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists notes_set_metadata_trg on public.notes;
create trigger notes_set_metadata_trg
  before insert or update on public.notes
  for each row execute function public.notes_set_metadata();

-- ─── Grants ───────────────────────────────────────────────────────────────────
-- RLS is the gate; grants let the roles reach the table at all. Public read is
-- intentional (notes are public site content); writes are still filtered by the
-- policies above.
grant select on public.notes to anon, authenticated;
grant insert, update, delete on public.notes to authenticated;
grant select on public.note_folders to anon, authenticated;
grant insert, update, delete on public.note_folders to authenticated;

-- Lock down the helper functions from direct RPC exposure. Postgres grants
-- EXECUTE to PUBLIC by default; that lets anon/authenticated call these via
-- /rest/v1/rpc/*. admin_can_write_module is only needed by write-policy
-- evaluation (authenticated writers); notes_set_metadata is a trigger function
-- invoked by the trigger machinery, never called directly. Revoke the rest.
revoke execute on function public.notes_set_metadata() from public;
revoke execute on function public.admin_can_write_module(text) from public;
grant execute on function public.admin_can_write_module(text) to authenticated;
