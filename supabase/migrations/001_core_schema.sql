-- ============================================================================
-- MERKATO - Core schema: profiles, organizations (workspaces), memberships
-- ============================================================================

-- Profiles: one row per auth user, mirrors auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Organizations: a "workspace" / tenant. All data is scoped to an org.
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Org members: links a user to an org with a role.
create type public.org_role as enum ('owner', 'admin', 'member');

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.org_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index if not exists idx_org_members_user on public.organization_members(user_id);
create index if not exists idx_org_members_org on public.organization_members(organization_id);

-- ============================================================================
-- Helper function: is the current user a member of a given org?
-- SECURITY DEFINER so it can read organization_members regardless of caller's
-- row-level access, avoiding recursive RLS checks.
-- ============================================================================
create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.current_org_role(org_id uuid)
returns public.org_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.organization_members
  where organization_id = org_id
    and user_id = auth.uid()
  limit 1;
$$;

-- ============================================================================
-- Trigger: auto-create a profile row whenever a new auth user signs up
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- RLS: profiles
-- ============================================================================
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Org members can view each other's profiles"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.organization_members me
      join public.organization_members them
        on me.organization_id = them.organization_id
      where me.user_id = auth.uid()
        and them.user_id = profiles.id
    )
  );

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================================================
-- RLS: organizations
-- ============================================================================
alter table public.organizations enable row level security;

create policy "Members can view their organizations"
  on public.organizations for select
  using (public.is_org_member(id) or created_by = auth.uid());

-- Portal visitors (customers who haven't joined yet) need to read basic org
-- info to see the portal page. We allow any authenticated user to SELECT
-- the organization slug/name so the portal can render.
create policy "Authenticated users can read org by slug"
  on public.organizations for select
  using (auth.uid() is not null);

create policy "Authenticated users can create an organization"
  on public.organizations for insert
  with check (auth.uid() = created_by);

create policy "Owners and admins can update their organization"
  on public.organizations for update
  using (public.current_org_role(id) in ('owner', 'admin'));

-- ============================================================================
-- RLS: organization_members
-- ============================================================================
alter table public.organization_members enable row level security;

create policy "Members can view membership rows in their orgs"
  on public.organization_members for select
  using (public.is_org_member(organization_id));

create policy "Users can insert their own first membership (org creation)"
  on public.organization_members for insert
  with check (user_id = auth.uid());

create policy "Owners and admins can add members"
  on public.organization_members for insert
  with check (public.current_org_role(organization_id) in ('owner', 'admin'));

create policy "Owners and admins can update member roles"
  on public.organization_members for update
  using (public.current_org_role(organization_id) in ('owner', 'admin'));

create policy "Owners and admins can remove members"
  on public.organization_members for delete
  using (public.current_org_role(organization_id) in ('owner', 'admin'));
