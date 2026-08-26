-- ============================================================================
-- MERKATO - Team Collaboration module: channels, messages, activity log
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Fix-up: add a foreign key from organization_members.user_id to
-- profiles.id (in addition to the existing auth.users.id reference). This
-- lets PostgREST embed `profiles(...)` directly in queries against
-- organization_members, which several pages rely on (Team Directory,
-- Project task assignees, channel member name lookups). Safe to add because
-- every profiles.id is always also a valid auth.users.id (see
-- handle_new_user() trigger in 001_core_schema.sql).
-- ---------------------------------------------------------------------------
alter table public.organization_members
  add constraint organization_members_user_id_profiles_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- ---------------------------------------------------------------------------
-- Channels (also used for DMs — a DM is a channel with is_dm = true and
-- exactly 2 members, with no name)
-- ---------------------------------------------------------------------------
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text,
  is_dm boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_channels_org on public.channels(organization_id);

create table if not exists public.channel_members (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (channel_id, user_id)
);

create index if not exists idx_channel_members_channel on public.channel_members(channel_id);
create index if not exists idx_channel_members_user on public.channel_members(user_id);

alter table public.channel_members
  add constraint channel_members_user_id_profiles_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- ---------------------------------------------------------------------------
-- Messages
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  channel_id uuid not null references public.channels(id) on delete cascade,
  body text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_channel on public.messages(channel_id, created_at);

-- Enable Realtime for messages so the chat UI updates live without a
-- page refresh (subscribed to via postgres_changes in MessageThread).
alter publication supabase_realtime add table public.messages;

-- ---------------------------------------------------------------------------
-- Activity log (workspace-wide feed; modules insert rows here as they act)
-- ---------------------------------------------------------------------------
create type public.activity_type as enum (
  'deal_created', 'deal_stage_changed', 'deal_won', 'deal_lost',
  'contact_created', 'company_created',
  'project_created', 'task_created', 'task_completed', 'task_status_changed',
  'comment_added', 'message_sent',
  'ticket_created', 'ticket_resolved',
  'document_uploaded',
  'member_joined'
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type public.activity_type not null,
  actor_id uuid references auth.users(id),
  summary text not null,
  link text,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_org on public.activity_log(organization_id, created_at desc);

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.channels enable row level security;
alter table public.channel_members enable row level security;
alter table public.messages enable row level security;
alter table public.activity_log enable row level security;

-- Channels: org members can view/create org-wide channels; for DMs, only
-- members of that specific channel can view it.
create policy "Org members can view non-DM channels"
  on public.channels for select
  using (public.is_org_member(organization_id) and is_dm = false);

create policy "Channel members can view their DM channels"
  on public.channels for select
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.channel_members
      where channel_id = channels.id and user_id = auth.uid()
    )
  );

create policy "Org members can create channels"
  on public.channels for insert
  with check (public.is_org_member(organization_id));

-- Channel members
create policy "Org members can view channel membership"
  on public.channel_members for select
  using (public.is_org_member(organization_id));

create policy "Org members can add channel members"
  on public.channel_members for insert
  with check (public.is_org_member(organization_id));

create policy "Members can leave a channel"
  on public.channel_members for delete
  using (user_id = auth.uid());

-- Messages: only members of the channel (for DMs) or org members (for
-- public channels) can read/write.
create policy "Channel participants can view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.channels c
      where c.id = messages.channel_id
        and (
          (c.is_dm = false and public.is_org_member(c.organization_id))
          or exists (
            select 1 from public.channel_members cm
            where cm.channel_id = c.id and cm.user_id = auth.uid()
          )
        )
    )
  );

create policy "Channel participants can send messages"
  on public.messages for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.channels c
      where c.id = messages.channel_id
        and (
          (c.is_dm = false and public.is_org_member(c.organization_id))
          or exists (
            select 1 from public.channel_members cm
            where cm.channel_id = c.id and cm.user_id = auth.uid()
          )
        )
    )
  );

-- Activity log: read-only feed for org members; inserts come from
-- SECURITY DEFINER helper functions called by server actions (see below),
-- so direct client inserts are not allowed except by org members for
-- their own actions.
create policy "Org members can view activity"
  on public.activity_log for select
  using (public.is_org_member(organization_id));

create policy "Org members can log their own activity"
  on public.activity_log for insert
  with check (public.is_org_member(organization_id) and actor_id = auth.uid());
