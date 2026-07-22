-- 0019_admin_note_drafts.sql
-- Purpose-built autosave table for the admin editor (T-032). One row per
-- (user, module, subfolder, filename) open note, upserted in place so a
-- note being edited in two tabs doesn't clobber a shared draft slot.
--
-- Distinct from the existing public.drafts table, which has no tracked
-- migration, is referenced nowhere in the codebase, and doesn't fit this
-- shape (one draft per user, not one per open note). That table is left
-- untouched here; dropping it is a separate, explicit decision.

create table if not exists admin_note_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id text not null,
  subfolder text not null,
  filename text not null,
  title text not null default '',
  content text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, module_id, subfolder, filename)
);

alter table admin_note_drafts enable row level security;

create policy "own draft select"
  on admin_note_drafts for select
  using ( auth.uid() = user_id );

create policy "own draft insert"
  on admin_note_drafts for insert
  with check ( auth.uid() = user_id );

create policy "own draft update"
  on admin_note_drafts for update
  using ( auth.uid() = user_id );

create policy "own draft delete"
  on admin_note_drafts for delete
  using ( auth.uid() = user_id );
