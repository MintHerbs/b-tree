-- Admin users table for managing content editors
-- Stores user roles and directory permissions

create table if not exists admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text,
  role text not null check (role in ('owner', 'contributor')),
  allowed_directories text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for faster lookups
create index if not exists idx_admin_users_role on admin_users(role);
create index if not exists idx_admin_users_username on admin_users(username);

-- RLS policies
alter table admin_users enable row level security;

-- Owners can see all users
create policy "Owners can view all admin users"
  on admin_users for select
  using (
    exists (
      select 1 from admin_users
      where id = auth.uid() and role = 'owner'
    )
  );

-- Users can view their own profile
create policy "Users can view own profile"
  on admin_users for select
  using (id = auth.uid());

-- Only owners can insert new users (via Edge Function with service role)
-- No direct insert policy needed as Edge Function uses service role

-- Only owners can update users (via Edge Function with service role)
-- No direct update policy needed as Edge Function uses service role

-- Only owners can delete users (via Edge Function with service role)
-- No direct delete policy needed as Edge Function uses service role

-- Function to update updated_at timestamp
create or replace function update_admin_users_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger update_admin_users_updated_at
  before update on admin_users
  for each row
  execute function update_admin_users_updated_at();

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant select on admin_users to anon, authenticated;
