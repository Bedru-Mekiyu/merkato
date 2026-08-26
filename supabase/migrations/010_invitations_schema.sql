-- ============================================================================
-- MERKATO - Team Invitations
-- ============================================================================

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  invited_by uuid not null references auth.users(id),
  email text not null,
  role public.org_role not null default 'member',
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create index if not exists idx_invitations_org on public.invitations(organization_id);
create index if not exists idx_invitations_token on public.invitations(token);
create index if not exists idx_invitations_email on public.invitations(email);

-- RLS: owners and admins manage invitations; the token-based accept flow
-- uses a SECURITY DEFINER function (below) so it bypasses RLS safely.
alter table public.invitations enable row level security;

create policy "Owners and admins can view invitations"
  on public.invitations for select
  using (public.current_org_role(organization_id) in ('owner', 'admin'));

create policy "Owners and admins can create invitations"
  on public.invitations for insert
  with check (
    public.current_org_role(organization_id) in ('owner', 'admin')
    and invited_by = auth.uid()
  );

create policy "Owners and admins can delete invitations"
  on public.invitations for delete
  using (public.current_org_role(organization_id) in ('owner', 'admin'));

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER function: accept an invitation by token.
-- Called from the /invite/[token] page. Does three things atomically:
--   1. Validates the token is real, unexpired, and not already accepted
--   2. Inserts the caller as an org member with the invited role
--   3. Marks the invitation as accepted
-- Returns the organization slug on success so we can redirect there.
-- ---------------------------------------------------------------------------
create or replace function public.accept_invitation(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
begin
  select * into inv
  from public.invitations
  where token = p_token
    and accepted_at is null
    and expires_at > now();

  if not found then
    return jsonb_build_object('error', 'Invitation not found or has expired.');
  end if;

  -- Check the calling user isn't already a member
  if exists (
    select 1 from public.organization_members
    where organization_id = inv.organization_id
      and user_id = auth.uid()
  ) then
    return jsonb_build_object('error', 'You are already a member of this workspace.');
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (inv.organization_id, auth.uid(), inv.role);

  update public.invitations
  set accepted_at = now()
  where id = inv.id;

  return jsonb_build_object(
    'success', true,
    'organization_id', inv.organization_id,
    'org_slug', (select slug from public.organizations where id = inv.organization_id)
  );
end;
$$;
