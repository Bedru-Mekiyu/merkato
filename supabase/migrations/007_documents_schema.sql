-- ============================================================================
-- MERKATO - Document Management module
-- ============================================================================
-- NOTE: This migration creates the Postgres metadata tables. You also need
-- to create a Supabase Storage bucket named "documents" with RLS enabled:
--
--   1. Go to Storage in your Supabase dashboard
--   2. Create a new bucket called "documents", set to PRIVATE (not public)
--   3. The storage policies below reference this bucket by name
--
-- Files are stored at: documents/{organization_id}/{folder_path}/{filename}
-- ============================================================================

-- Extend activity_type with document events.
-- Run this file as its own transaction first if you get "unsafe use of new
-- value" errors — same pattern as 006a_support_schema_enums.sql.
alter type public.activity_type add value if not exists 'document_deleted';

create type public.document_status as enum ('active', 'trashed');

-- ---------------------------------------------------------------------------
-- Folders (virtual — just a path string on documents, but we track distinct
-- folders so users can create empty folders and rename them)
-- ---------------------------------------------------------------------------
create table if not exists public.document_folders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  parent_id uuid references public.document_folders(id) on delete cascade,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_doc_folders_org on public.document_folders(organization_id);
create index if not exists idx_doc_folders_parent on public.document_folders(parent_id);

-- ---------------------------------------------------------------------------
-- Documents (metadata only — actual bytes live in Supabase Storage)
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  folder_id uuid references public.document_folders(id) on delete set null,
  name text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint default 0,
  status public.document_status not null default 'active',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_documents_org on public.documents(organization_id);
create index if not exists idx_documents_folder on public.documents(folder_id);
create index if not exists idx_documents_status on public.documents(status);

drop trigger if exists touch_documents on public.documents;
create trigger touch_documents before update on public.documents
  for each row execute procedure public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Document versions (previous file bytes stored in Storage under a versioned
-- path; only metadata tracked here)
-- ---------------------------------------------------------------------------
create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  version_number integer not null,
  storage_path text not null,
  size_bytes bigint default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_doc_versions_document on public.document_versions(document_id, version_number desc);

-- ============================================================================
-- RLS — standard org-member pattern
-- ============================================================================
alter table public.document_folders enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;

-- Folders
create policy "Org members can view folders"
  on public.document_folders for select
  using (public.is_org_member(organization_id));
create policy "Org members can create folders"
  on public.document_folders for insert
  with check (public.is_org_member(organization_id));
create policy "Org members can update folders"
  on public.document_folders for update
  using (public.is_org_member(organization_id));
create policy "Org members can delete folders"
  on public.document_folders for delete
  using (public.is_org_member(organization_id));

-- Documents
create policy "Org members can view documents"
  on public.documents for select
  using (public.is_org_member(organization_id));
create policy "Org members can create documents"
  on public.documents for insert
  with check (public.is_org_member(organization_id));
create policy "Org members can update documents"
  on public.documents for update
  using (public.is_org_member(organization_id));
create policy "Org members can delete documents"
  on public.documents for delete
  using (public.is_org_member(organization_id));

-- Versions
create policy "Org members can view versions"
  on public.document_versions for select
  using (public.is_org_member(organization_id));
create policy "Org members can create versions"
  on public.document_versions for insert
  with check (public.is_org_member(organization_id));

-- ============================================================================
-- Supabase Storage RLS policies for the "documents" bucket.
-- These are inserted into storage.objects which already has RLS enabled.
-- The path convention is: {org_id}/{document_id}/{filename}
-- ============================================================================
create policy "Org members can upload documents"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
    and public.is_org_member((storage.foldername(name))[1]::uuid)
  );

create policy "Org members can read documents"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
    and public.is_org_member((storage.foldername(name))[1]::uuid)
  );

create policy "Org members can delete documents"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
    and public.is_org_member((storage.foldername(name))[1]::uuid)
  );
