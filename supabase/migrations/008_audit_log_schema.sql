-- ============================================================================
-- MERKATO - Audit Log module
-- ============================================================================
-- The activity_log table (from 004) is a user-friendly "what happened"
-- feed. The audit_log is the lower-level security/compliance log: every
-- significant create/update/delete action is recorded here with more
-- detail, including the IP address and the changed fields.
-- ============================================================================

create type public.audit_action as enum (
  'create', 'update', 'delete', 'login', 'logout',
  'invite', 'role_change', 'export', 'password_reset'
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id),
  action public.audit_action not null,
  resource_type text not null,
  resource_id text,
  resource_name text,
  metadata jsonb default '{}',
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_org on public.audit_logs(organization_id, created_at desc);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_id);
create index if not exists idx_audit_logs_resource on public.audit_logs(resource_type, resource_id);

-- RLS: only owners and admins can view the audit log
alter table public.audit_logs enable row level security;

create policy "Owners and admins can view audit logs"
  on public.audit_logs for select
  using (public.current_org_role(organization_id) in ('owner', 'admin'));

-- Anyone can insert their own audit log entries (the insert RLS is permissive
-- because audit logging must never silently fail due to permissions).
-- The actor_id = auth.uid() constraint prevents spoofing.
create policy "Org members can insert their own audit entries"
  on public.audit_logs for insert
  with check (
    public.is_org_member(organization_id)
    and (actor_id = auth.uid() or actor_id is null)
  );
