-- ============================================================================
-- MERKATO - Knowledge Base module: categories, articles
-- ============================================================================

-- Extend the activity_type enum (created in 004) with a KB-specific event.
alter type public.activity_type add value if not exists 'article_published';

create type public.article_status as enum ('draft', 'published');

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
create table if not exists public.kb_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_kb_categories_org on public.kb_categories(organization_id);

-- ---------------------------------------------------------------------------
-- Articles
-- ---------------------------------------------------------------------------
create table if not exists public.kb_articles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid references public.kb_categories(id) on delete set null,
  title text not null,
  content text not null default '',
  tags text[] not null default '{}',
  status public.article_status not null default 'draft',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_kb_articles_org on public.kb_articles(organization_id);
create index if not exists idx_kb_articles_category on public.kb_articles(category_id);
create index if not exists idx_kb_articles_status on public.kb_articles(status);

-- Full-text search index over title + content
create index if not exists idx_kb_articles_search on public.kb_articles
  using gin (to_tsvector('english', title || ' ' || content));

drop trigger if exists touch_kb_articles on public.kb_articles;
create trigger touch_kb_articles before update on public.kb_articles
  for each row execute procedure public.touch_updated_at();

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.kb_categories enable row level security;
alter table public.kb_articles enable row level security;

create policy "Org members can view categories"
  on public.kb_categories for select
  using (public.is_org_member(organization_id));
create policy "Org members can create categories"
  on public.kb_categories for insert
  with check (public.is_org_member(organization_id));
create policy "Org members can delete categories"
  on public.kb_categories for delete
  using (public.is_org_member(organization_id));

create policy "Org members can view articles"
  on public.kb_articles for select
  using (public.is_org_member(organization_id));
create policy "Org members can create articles"
  on public.kb_articles for insert
  with check (public.is_org_member(organization_id));
create policy "Org members can update articles"
  on public.kb_articles for update
  using (public.is_org_member(organization_id));
create policy "Org members can delete articles"
  on public.kb_articles for delete
  using (public.is_org_member(organization_id));
