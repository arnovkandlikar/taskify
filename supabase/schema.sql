-- Taskify task board schema
-- Run this in the Supabase SQL editor, then enable Anonymous Sign-Ins in Auth.

create extension if not exists "pgcrypto";

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '',
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'in_review', 'done')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high')),
  due_date date,
  assignee text not null default 'Guest',
  assignee_color text not null default '#6c5ce7',
  labels text[] not null default '{}',
  comments integer not null default 0 check (comments >= 0),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists tasks_user_status_idx
  on public.tasks (user_id, status, created_at);

alter table public.tasks enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;

drop policy if exists "Guests can view their tasks" on public.tasks;
create policy "Guests can view their tasks"
  on public.tasks for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Guests can create their tasks" on public.tasks;
create policy "Guests can create their tasks"
  on public.tasks for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Guests can update their tasks" on public.tasks;
create policy "Guests can update their tasks"
  on public.tasks for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Guests can delete their tasks" on public.tasks;
create policy "Guests can delete their tasks"
  on public.tasks for delete
  to authenticated
  using ((select auth.uid()) = user_id);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tasks'
  ) then
    alter publication supabase_realtime add table public.tasks;
  end if;
end $$;

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  role text not null default 'Team member',
  email text not null,
  color text not null default '#ff1e00',
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists team_members_user_idx
  on public.team_members (user_id, created_at);

alter table public.team_members enable row level security;

grant select, insert, update, delete on public.team_members to authenticated;

drop policy if exists "Guests can view their team" on public.team_members;
create policy "Guests can view their team"
  on public.team_members for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Guests can add team members" on public.team_members;
create policy "Guests can add team members"
  on public.team_members for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Guests can update team members" on public.team_members;
create policy "Guests can update team members"
  on public.team_members for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Guests can remove team members" on public.team_members;
create policy "Guests can remove team members"
  on public.team_members for delete
  to authenticated
  using ((select auth.uid()) = user_id);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'team_members'
  ) then
    alter publication supabase_realtime add table public.team_members;
  end if;
end $$;
