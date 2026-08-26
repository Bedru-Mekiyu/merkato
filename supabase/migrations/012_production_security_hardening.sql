-- ============================================================================
-- MERKATO - Production security hardening
-- ============================================================================
-- Run after 011_email_helpers.sql.
-- This migration closes the gap between the application role model and the
-- database policies. Customers may use Support only; internal data is staff
-- only. Workspace creation and invitation acceptance are atomic functions.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Membership helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
      and role in ('owner', 'admin', 'member')
  );
$$;

grant execute on function public.is_org_member(uuid) to authenticated;

create or replace function public.is_any_org_member(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
  );
$$;

grant execute on function public.is_any_org_member(uuid) to authenticated;

create or replace function public.is_staff_member(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_org_member(org_id);
$$;

grant execute on function public.is_staff_member(uuid) to authenticated;

create or replace function public.is_staff_user(org_id uuid, member_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = org_id
      and user_id = member_id
      and role in ('owner', 'admin', 'member')
  );
$$;

grant execute on function public.is_staff_user(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Atomic first-workspace creation. Direct membership self-inserts are removed
-- below, so an authenticated user can only create their own first workspace
-- through this function and can only receive the owner role here.
-- ---------------------------------------------------------------------------
create or replace function public.create_organization(org_name text, org_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  new_org_id uuid;
  clean_name text := trim(org_name);
  clean_slug text := lower(trim(org_slug));
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  if clean_name = '' or clean_slug = '' then
    raise exception 'Workspace name and slug are required';
  end if;

  if length(clean_name) > 120 or clean_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Workspace name or slug is invalid';
  end if;

  if exists (
    select 1 from public.organization_members where user_id = caller_id
  ) then
    raise exception 'You already belong to a workspace';
  end if;

  insert into public.organizations (name, slug, created_by)
  values (clean_name, clean_slug, caller_id)
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, caller_id, 'owner');

  return new_org_id;
end;
$$;

grant execute on function public.create_organization(text, text) to authenticated;

drop policy if exists "Authenticated users can create an organization"
  on public.organizations;

-- ---------------------------------------------------------------------------
-- Core policy corrections
-- ---------------------------------------------------------------------------
drop policy if exists "Members can view their organizations" on public.organizations;
create policy "Members can view their organizations"
  on public.organizations for select
  using (public.is_any_org_member(id) or created_by = auth.uid());

drop policy if exists "Authenticated users can read org by slug" on public.organizations;
create policy "Authenticated users can read org by slug"
  on public.organizations for select
  using (auth.uid() is not null);

drop policy if exists "Users can insert their own first membership (org creation)"
  on public.organization_members;

drop policy if exists "Members can view membership rows in their orgs"
  on public.organization_members;
create policy "Members can view membership rows in their orgs"
  on public.organization_members for select
  using (user_id = auth.uid() or public.is_staff_member(organization_id));

drop policy if exists "Owners and admins can add members" on public.organization_members;
create policy "Owners and admins can add members"
  on public.organization_members for insert
  with check (
    public.current_org_role(organization_id) in ('owner', 'admin')
    and role in ('admin', 'member')
  );

drop policy if exists "Org members can view each other's profiles" on public.profiles;
create policy "Staff can view staff profiles"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1
      from public.organization_members me
      join public.organization_members them
        on me.organization_id = them.organization_id
      where me.user_id = auth.uid()
        and me.role in ('owner', 'admin', 'member')
        and them.user_id = profiles.id
    )
  );

-- ---------------------------------------------------------------------------
-- Internal data is staff-only. Existing policies already use
-- is_org_member(), whose definition above now excludes customers.
-- ---------------------------------------------------------------------------

-- Support remains the customer boundary. Bind every message to its ticket's
-- organization and keep customer messages public/non-internal only.
drop policy if exists "Org members can create tickets" on public.support_tickets;
create policy "Customers can create their own tickets"
  on public.support_tickets for insert
  with check (
    customer_id = auth.uid()
    and exists (
      select 1 from public.organizations o
      where o.id = support_tickets.organization_id
    )
  );

drop policy if exists "Staff can create tickets on behalf of a customer"
  on public.support_tickets;
create policy "Staff can create tickets on behalf of a customer"
  on public.support_tickets for insert
  with check (public.is_staff_member(organization_id));

drop policy if exists "Staff can post any message including internal notes"
  on public.ticket_messages;
create policy "Staff can post any message including internal notes"
  on public.ticket_messages for insert
  with check (
    created_by = auth.uid()
    and public.is_staff_member(organization_id)
    and exists (
      select 1
      from public.support_tickets t
      where t.id = ticket_messages.ticket_id
        and t.organization_id = ticket_messages.organization_id
    )
  );

drop policy if exists "Customers can post non-internal messages on their tickets"
  on public.ticket_messages;
create policy "Customers can post non-internal messages on their tickets"
  on public.ticket_messages for insert
  with check (
    created_by = auth.uid()
    and is_internal_note = false
    and exists (
      select 1
      from public.support_tickets t
      where t.id = ticket_messages.ticket_id
        and t.organization_id = ticket_messages.organization_id
        and t.customer_id = auth.uid()
    )
  );

-- Composite relationship prevents a message from claiming another tenant's
-- organization_id while pointing at a valid ticket.
alter table public.support_tickets
  drop constraint if exists support_tickets_id_organization_id_key;
alter table public.support_tickets
  add constraint support_tickets_id_organization_id_key unique (id, organization_id);

alter table public.ticket_messages
  drop constraint if exists ticket_messages_ticket_org_fkey;
alter table public.ticket_messages
  add constraint ticket_messages_ticket_org_fkey
  foreign key (ticket_id, organization_id)
  references public.support_tickets (id, organization_id)
  on delete cascade;

-- Atomic customer reply + reopen operation. The organization is derived from
-- the ticket instead of being accepted from the browser.
create or replace function public.customer_reply(p_ticket_id uuid, p_body text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  ticket_row public.support_tickets%rowtype;
  clean_body text := trim(p_body);
begin
  if auth.uid() is null then
    return jsonb_build_object('error', 'Authentication required');
  end if;
  if clean_body = '' then
    return jsonb_build_object('error', 'Message cannot be empty.');
  end if;

  select * into ticket_row
  from public.support_tickets
  where id = p_ticket_id
    and customer_id = auth.uid()
  for update;

  if not found then
    return jsonb_build_object('error', 'Ticket not found.');
  end if;

  insert into public.ticket_messages (
    organization_id, ticket_id, body, is_internal_note, created_by
  ) values (
    ticket_row.organization_id, ticket_row.id, clean_body, false, auth.uid()
  );

  if ticket_row.status in ('pending', 'resolved') then
    update public.support_tickets
    set status = 'open'
    where id = ticket_row.id;
  end if;

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.customer_reply(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Invitation access and atomic acceptance
-- ---------------------------------------------------------------------------
update public.invitations
set role = 'member'
where role not in ('admin', 'member');

alter table public.invitations
  drop constraint if exists invitations_role_check;
alter table public.invitations
  add constraint invitations_role_check check (role in ('admin', 'member'));

create or replace function public.get_invitation_by_token(p_token text)
returns table (
  email text,
  role public.org_role,
  expires_at timestamptz,
  accepted_at timestamptz,
  organization_name text,
  organization_slug text
)
language sql
security definer
set search_path = public
stable
as $$
  select i.email, i.role, i.expires_at, i.accepted_at,
         o.name, o.slug
  from public.invitations i
  join public.organizations o on o.id = i.organization_id
  where i.token = p_token;
$$;

grant execute on function public.get_invitation_by_token(text) to authenticated;

create or replace function public.get_user_email(p_user_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select case
    when auth.role() = 'service_role' then
      (select email from auth.users where id = p_user_id)
    when exists (
      select 1
      from public.organization_members actor
      join public.organization_members target
        on target.organization_id = actor.organization_id
      where actor.user_id = auth.uid()
        and actor.role in ('owner', 'admin', 'member')
        and target.user_id = p_user_id
    ) then
      (select email from auth.users where id = p_user_id)
    else null
  end;
$$;

create or replace function public.get_org_staff_emails(p_org_id uuid)
returns setof text
language sql
security definer
set search_path = public
stable
as $$
  select au.email
  from auth.users au
  join public.organization_members om on om.user_id = au.id
  where om.organization_id = p_org_id
    and om.role in ('owner', 'admin', 'member')
    and au.email is not null
    and (
      auth.role() = 'service_role'
      or public.is_staff_member(p_org_id)
    );
$$;

revoke all on function public.get_user_email(uuid) from public, anon;
grant execute on function public.get_user_email(uuid) to authenticated, service_role;
revoke all on function public.get_org_staff_emails(uuid) from public, anon;
grant execute on function public.get_org_staff_emails(uuid) to authenticated, service_role;

create or replace function public.accept_invitation(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
  caller_email text;
begin
  if auth.uid() is null then
    return jsonb_build_object('error', 'You need to be signed in to accept this invitation.');
  end if;

  select i.*, o.slug as org_slug
  into inv
  from public.invitations i
  join public.organizations o on o.id = i.organization_id
  where i.token = p_token
    and i.accepted_at is null
    and i.expires_at > now()
  for update of i;

  if not found then
    return jsonb_build_object('error', 'Invitation not found or has expired.');
  end if;

  select email into caller_email from auth.users where id = auth.uid();
  if lower(coalesce(caller_email, '')) <> lower(inv.email) then
    return jsonb_build_object('error', 'This invitation was issued for a different email address.');
  end if;

  if exists (
    select 1 from public.organization_members
    where organization_id = inv.organization_id and user_id = auth.uid()
  ) then
    return jsonb_build_object('error', 'You are already a member of this workspace.');
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (inv.organization_id, auth.uid(), inv.role);

  update public.invitations
  set accepted_at = now()
  where id = inv.id and accepted_at is null;

  if not found then
    raise exception 'Invitation was already accepted';
  end if;

  return jsonb_build_object(
    'success', true,
    'organization_id', inv.organization_id,
    'org_slug', inv.org_slug
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Direct-message integrity: only staff from the same organization can be
-- members of internal channels.
-- ---------------------------------------------------------------------------
drop policy if exists "Org members can create channels" on public.channels;
create policy "Staff can create channels"
  on public.channels for insert
  with check (public.is_staff_member(organization_id));

drop policy if exists "Org members can view channel membership" on public.channel_members;
create policy "Staff can view channel membership"
  on public.channel_members for select
  using (public.is_staff_member(organization_id));

drop policy if exists "Org members can add channel members" on public.channel_members;
create policy "Staff can add staff channel members"
  on public.channel_members for insert
  with check (
    public.is_staff_member(organization_id)
    and exists (
      select 1 from public.channels c
      where c.id = channel_members.channel_id
        and c.organization_id = channel_members.organization_id
    )
    and public.is_staff_user(organization_id, user_id)
  );

drop policy if exists "Channel participants can view messages" on public.messages;
create policy "Staff channel participants can view messages"
  on public.messages for select
  using (
    exists (
      select 1
      from public.channels c
      where c.id = messages.channel_id
        and c.organization_id = messages.organization_id
        and public.is_staff_member(c.organization_id)
    )
  );

drop policy if exists "Channel participants can send messages" on public.messages;
create policy "Staff channel participants can send messages"
  on public.messages for insert
  with check (
    created_by = auth.uid()
    and public.is_staff_member(organization_id)
    and exists (
      select 1
      from public.channels c
      where c.id = messages.channel_id
        and c.organization_id = messages.organization_id
    )
  );

alter table public.channel_members
  drop constraint if exists channel_members_channel_org_fkey;

alter table public.channels
  drop constraint if exists channels_id_organization_id_key;
alter table public.channels
  add constraint channels_id_organization_id_key unique (id, organization_id);

alter table public.channel_members
  add constraint channel_members_channel_org_fkey
  foreign key (channel_id, organization_id)
  references public.channels (id, organization_id)
  on delete cascade;
