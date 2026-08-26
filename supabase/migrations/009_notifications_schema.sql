-- ============================================================================
-- MERKATO - Notifications module
-- ============================================================================

create type public.notification_type as enum (
  'task_assigned',
  'task_due_soon',
  'mention',
  'ticket_assigned',
  'ticket_reply',
  'deal_won',
  'project_invite',
  'team_invite',
  'system'
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id),
  type public.notification_type not null,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_recipient
  on public.notifications(recipient_id, created_at desc);
create index if not exists idx_notifications_unread
  on public.notifications(recipient_id, is_read)
  where is_read = false;

-- Enable Realtime so the notification bell updates instantly
alter publication supabase_realtime add table public.notifications;

-- RLS: users can only see their own notifications
alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  using (recipient_id = auth.uid());

create policy "Org members can create notifications"
  on public.notifications for insert
  with check (public.is_org_member(organization_id));

create policy "Users can update (mark read) their own notifications"
  on public.notifications for update
  using (recipient_id = auth.uid());

create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (recipient_id = auth.uid());
