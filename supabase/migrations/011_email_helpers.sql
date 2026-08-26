-- ============================================================================
-- MERKATO - Email helper functions
-- These SECURITY DEFINER functions allow the application layer to look up
-- email addresses from auth.users (which is not directly accessible via
-- the anon/authenticated role) for the purpose of sending transactional
-- emails (ticket reply notifications, new ticket alerts).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- get_user_email(p_user_id uuid) → text
-- Returns the email address of a single user. Used for ticket reply emails.
-- ---------------------------------------------------------------------------
create or replace function public.get_user_email(p_user_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select email from auth.users where id = p_user_id;
$$;

-- ---------------------------------------------------------------------------
-- get_org_staff_emails(p_org_id uuid) → setof text
-- Returns email addresses of all staff (owner/admin/member) in an org.
-- Used to notify the support team when a new ticket arrives.
-- ---------------------------------------------------------------------------
create or replace function public.get_org_staff_emails(p_org_id uuid)
returns setof text
language sql
security definer
set search_path = public
stable
as $$
  select au.email
  from public.organization_members om
  join auth.users au on au.id = om.user_id
  where om.organization_id = p_org_id
    and om.role in ('owner', 'admin', 'member')
    and au.email is not null;
$$;
