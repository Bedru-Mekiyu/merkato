-- ============================================================================
-- MERKATO - Projects module: projects, tasks, subtasks, task comments
-- ============================================================================

create type public.task_status as enum (
  'todo',
  'in_progress',
  'review',
  'done'
);

create type public.task_priority as enum (
  'low',
  'medium',
  'high',
  'urgent'
);

create type public.project_status as enum (
  'active',
  'on_hold',
  'completed',
  'archived'
);

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  status public.project_status not null default 'active',
  due_date date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_org on public.projects(organization_id);

-- ---------------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------------
create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'medium',
  due_date date,
  assignee_id uuid references auth.users(id),
  position integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_org on public.project_tasks(organization_id);
create index if not exists idx_tasks_project on public.project_tasks(project_id);
create index if not exists idx_tasks_status on public.project_tasks(status);
create index if not exists idx_tasks_due_date on public.project_tasks(due_date);

-- ---------------------------------------------------------------------------
-- Subtasks (simple checklist items within a task)
-- ---------------------------------------------------------------------------
create table if not exists public.task_subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.project_tasks(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  is_done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_subtasks_task on public.task_subtasks(task_id);

-- ---------------------------------------------------------------------------
-- Task comments
-- ---------------------------------------------------------------------------
create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.project_tasks(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  body text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_comments_task on public.task_comments(task_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers (reuses touch_updated_at() from 001_core_schema.sql)
-- ---------------------------------------------------------------------------
drop trigger if exists touch_projects on public.projects;
create trigger touch_projects before update on public.projects
  for each row execute procedure public.touch_updated_at();

drop trigger if exists touch_project_tasks on public.project_tasks;
create trigger touch_project_tasks before update on public.project_tasks
  for each row execute procedure public.touch_updated_at();

-- ============================================================================
-- RLS — same org-scoped pattern as the CRM module
-- ============================================================================
alter table public.projects enable row level security;
alter table public.project_tasks enable row level security;
alter table public.task_subtasks enable row level security;
alter table public.task_comments enable row level security;

-- Projects
create policy "Org members can view projects"
  on public.projects for select
  using (public.is_org_member(organization_id));
create policy "Org members can insert projects"
  on public.projects for insert
  with check (public.is_org_member(organization_id));
create policy "Org members can update projects"
  on public.projects for update
  using (public.is_org_member(organization_id));
create policy "Org members can delete projects"
  on public.projects for delete
  using (public.is_org_member(organization_id));

-- Tasks
create policy "Org members can view tasks"
  on public.project_tasks for select
  using (public.is_org_member(organization_id));
create policy "Org members can insert tasks"
  on public.project_tasks for insert
  with check (public.is_org_member(organization_id));
create policy "Org members can update tasks"
  on public.project_tasks for update
  using (public.is_org_member(organization_id));
create policy "Org members can delete tasks"
  on public.project_tasks for delete
  using (public.is_org_member(organization_id));

-- Subtasks
create policy "Org members can view subtasks"
  on public.task_subtasks for select
  using (public.is_org_member(organization_id));
create policy "Org members can insert subtasks"
  on public.task_subtasks for insert
  with check (public.is_org_member(organization_id));
create policy "Org members can update subtasks"
  on public.task_subtasks for update
  using (public.is_org_member(organization_id));
create policy "Org members can delete subtasks"
  on public.task_subtasks for delete
  using (public.is_org_member(organization_id));

-- Comments
create policy "Org members can view comments"
  on public.task_comments for select
  using (public.is_org_member(organization_id));
create policy "Org members can insert comments"
  on public.task_comments for insert
  with check (public.is_org_member(organization_id));
create policy "Org members can delete comments"
  on public.task_comments for delete
  using (public.is_org_member(organization_id));
