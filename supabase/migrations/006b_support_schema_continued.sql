-- ============================================================================
-- MERKATO - Customer Support module, PART 2: tables, function, RLS
-- ============================================================================
-- Run 006a_support_schema_enums.sql FIRST and let it complete, then run
-- this file. See the note in 006a for why this must be split.
-- ============================================================================

create type public.ticket_status as enum ('open', 'pending', 'resolved', 'closed');
create type public.ticket_priority as enum ('low', 'medium', 'high', 'urgent');

-- ---------------------------------------------------------------------------
-- Lets an authenticated user join an organization as a 'customer' via its
-- public slug (used by the customer support portal). SECURITY DEFINER so
-- it can insert into organization_members regardless of the caller's RLS
-- access, the same pattern used for org creation in 001_core_schema.sql.
-- Safe because the only role this can ever grant is 'customer' — never
-- owner/admin/member — and it has no effect if the user already belongs
-- to that org in any role.
-- ---------------------------------------------------------------------------
create or replace function public.join_org_as_customer(org_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_org_id uuid;
begin
  select id into target_org_id from public.organizations where slug = org_slug;

  if target_org_id is null then
    raise exception 'Organization not found';
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (target_org_id, auth.uid(), 'customer')
  on conflict (organization_id, user_id) do nothing;

  return target_org_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tickets
-- ---------------------------------------------------------------------------
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  subject text not null,
  description text not null default '',
  status public.ticket_status not null default 'open',
  priority public.ticket_priority not null default 'medium',
  category text,
  customer_id uuid not null references auth.users(id),
  assigned_to uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tickets_org on public.support_tickets(organization_id);
create index if not exists idx_tickets_customer on public.support_tickets(customer_id);
create index if not exists idx_tickets_status on public.support_tickets(status);
create index if not exists idx_tickets_assigned on public.support_tickets(assigned_to);

alter table public.support_tickets
  add constraint support_tickets_customer_id_profiles_fkey
  foreign key (customer_id) references public.profiles(id) on delete cascade;

drop trigger if exists touch_support_tickets on public.support_tickets;
create trigger touch_support_tickets before update on public.support_tickets
  for each row execute procedure public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Ticket messages (replies). is_internal_note = true means staff-only,
-- never visible to the customer.
-- ---------------------------------------------------------------------------
create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  body text not null,
  is_internal_note boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_ticket_messages_ticket on public.ticket_messages(ticket_id, created_at);

alter table public.ticket_messages
  add constraint ticket_messages_created_by_profiles_fkey
  foreign key (created_by) references public.profiles(id) on delete set null;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.support_tickets enable row level security;
alter table public.ticket_messages enable row level security;

-- Staff (owner/admin/member) can see and manage all tickets in their org.
-- Customers can only see and create their own tickets.
create policy "Staff can view all org tickets"
  on public.support_tickets for select
  using (
    exists (
      select 1 from public.organization_members
      where organization_id = support_tickets.organization_id
        and user_id = auth.uid()
        and role in ('owner', 'admin', 'member')
    )
  );

create policy "Customers can view their own tickets"
  on public.support_tickets for select
  using (customer_id = auth.uid());

create policy "Org members can create tickets"
  on public.support_tickets for insert
  with check (public.is_org_member(organization_id) and customer_id = auth.uid());

create policy "Staff can create tickets on behalf of a customer"
  on public.support_tickets for insert
  with check (
    exists (
      select 1 from public.organization_members
      where organization_id = support_tickets.organization_id
        and user_id = auth.uid()
        and role in ('owner', 'admin', 'member')
    )
  );

create policy "Staff can update tickets"
  on public.support_tickets for update
  using (
    exists (
      select 1 from public.organization_members
      where organization_id = support_tickets.organization_id
        and user_id = auth.uid()
        and role in ('owner', 'admin', 'member')
    )
  );

-- Ticket messages: staff see everything in their org's tickets; customers
-- see only non-internal messages on their own tickets.
create policy "Staff can view all ticket messages"
  on public.ticket_messages for select
  using (
    exists (
      select 1 from public.organization_members
      where organization_id = ticket_messages.organization_id
        and user_id = auth.uid()
        and role in ('owner', 'admin', 'member')
    )
  );

create policy "Customers can view non-internal messages on their tickets"
  on public.ticket_messages for select
  using (
    is_internal_note = false
    and exists (
      select 1 from public.support_tickets t
      where t.id = ticket_messages.ticket_id
        and t.customer_id = auth.uid()
    )
  );

create policy "Staff can post any message including internal notes"
  on public.ticket_messages for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.organization_members
      where organization_id = ticket_messages.organization_id
        and user_id = auth.uid()
        and role in ('owner', 'admin', 'member')
    )
  );

create policy "Customers can post non-internal messages on their tickets"
  on public.ticket_messages for insert
  with check (
    created_by = auth.uid()
    and is_internal_note = false
    and exists (
      select 1 from public.support_tickets t
      where t.id = ticket_messages.ticket_id
        and t.customer_id = auth.uid()
    )
  );
