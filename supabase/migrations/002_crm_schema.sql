-- ============================================================================
-- MERKATO - CRM module: companies, contacts, deals (pipeline), notes
-- ============================================================================

create type public.deal_stage as enum (
  'new_lead',
  'contacted',
  'qualified',
  'proposal',
  'won',
  'lost'
);

-- ---------------------------------------------------------------------------
-- Companies
-- ---------------------------------------------------------------------------
create table if not exists public.crm_companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  domain text,
  industry text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crm_companies_org on public.crm_companies(organization_id);

-- ---------------------------------------------------------------------------
-- Contacts
-- ---------------------------------------------------------------------------
create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.crm_companies(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  job_title text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crm_contacts_org on public.crm_contacts(organization_id);
create index if not exists idx_crm_contacts_company on public.crm_contacts(company_id);

-- ---------------------------------------------------------------------------
-- Deals (pipeline)
-- ---------------------------------------------------------------------------
create table if not exists public.crm_deals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.crm_companies(id) on delete set null,
  contact_id uuid references public.crm_contacts(id) on delete set null,
  title text not null,
  value numeric(14, 2) default 0,
  stage public.deal_stage not null default 'new_lead',
  owner_id uuid references auth.users(id),
  expected_close_date date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crm_deals_org on public.crm_deals(organization_id);
create index if not exists idx_crm_deals_stage on public.crm_deals(stage);
create index if not exists idx_crm_deals_owner on public.crm_deals(owner_id);

-- ---------------------------------------------------------------------------
-- Notes (polymorphic: can attach to a contact, company, or deal)
-- ---------------------------------------------------------------------------
create table if not exists public.crm_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid references public.crm_contacts(id) on delete cascade,
  company_id uuid references public.crm_companies(id) on delete cascade,
  deal_id uuid references public.crm_deals(id) on delete cascade,
  body text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint note_has_one_parent check (
    (contact_id is not null)::int +
    (company_id is not null)::int +
    (deal_id is not null)::int = 1
  )
);

create index if not exists idx_crm_notes_org on public.crm_notes(organization_id);

-- ---------------------------------------------------------------------------
-- updated_at auto-touch trigger (reused on every table with updated_at)
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_crm_companies on public.crm_companies;
create trigger touch_crm_companies before update on public.crm_companies
  for each row execute procedure public.touch_updated_at();

drop trigger if exists touch_crm_contacts on public.crm_contacts;
create trigger touch_crm_contacts before update on public.crm_contacts
  for each row execute procedure public.touch_updated_at();

drop trigger if exists touch_crm_deals on public.crm_deals;
create trigger touch_crm_deals before update on public.crm_deals
  for each row execute procedure public.touch_updated_at();

-- ============================================================================
-- RLS: all CRM tables follow the same pattern —
-- a user can act on a row only if they belong to that row's organization.
-- ============================================================================

alter table public.crm_companies enable row level security;
alter table public.crm_contacts enable row level security;
alter table public.crm_deals enable row level security;
alter table public.crm_notes enable row level security;

-- Companies
create policy "Org members can view companies"
  on public.crm_companies for select
  using (public.is_org_member(organization_id));
create policy "Org members can insert companies"
  on public.crm_companies for insert
  with check (public.is_org_member(organization_id));
create policy "Org members can update companies"
  on public.crm_companies for update
  using (public.is_org_member(organization_id));
create policy "Org members can delete companies"
  on public.crm_companies for delete
  using (public.is_org_member(organization_id));

-- Contacts
create policy "Org members can view contacts"
  on public.crm_contacts for select
  using (public.is_org_member(organization_id));
create policy "Org members can insert contacts"
  on public.crm_contacts for insert
  with check (public.is_org_member(organization_id));
create policy "Org members can update contacts"
  on public.crm_contacts for update
  using (public.is_org_member(organization_id));
create policy "Org members can delete contacts"
  on public.crm_contacts for delete
  using (public.is_org_member(organization_id));

-- Deals
create policy "Org members can view deals"
  on public.crm_deals for select
  using (public.is_org_member(organization_id));
create policy "Org members can insert deals"
  on public.crm_deals for insert
  with check (public.is_org_member(organization_id));
create policy "Org members can update deals"
  on public.crm_deals for update
  using (public.is_org_member(organization_id));
create policy "Org members can delete deals"
  on public.crm_deals for delete
  using (public.is_org_member(organization_id));

-- Notes
create policy "Org members can view notes"
  on public.crm_notes for select
  using (public.is_org_member(organization_id));
create policy "Org members can insert notes"
  on public.crm_notes for insert
  with check (public.is_org_member(organization_id));
create policy "Org members can delete notes"
  on public.crm_notes for delete
  using (public.is_org_member(organization_id));
