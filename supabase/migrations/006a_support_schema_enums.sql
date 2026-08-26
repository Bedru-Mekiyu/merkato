-- ============================================================================
-- MERKATO - Customer Support module, PART 1: enum extensions
-- ============================================================================
-- IMPORTANT: run this file and let it complete BEFORE running
-- 006b_support_schema_continued.sql. Postgres requires new enum values
-- (added via ALTER TYPE ... ADD VALUE) to be committed in their own
-- transaction before anything else can reference them — if you paste both
-- files together and run them as one script, you will get an error like
-- "unsafe use of new value". Run this one, wait for "Success", then run
-- the next file.
-- ============================================================================

-- Extend org_role with 'customer' — a restricted role for portal users who
-- can only see and act on their own support tickets, never CRM/Projects/etc.
alter type public.org_role add value if not exists 'customer';

-- Extend activity_type with support-specific events.
alter type public.activity_type add value if not exists 'ticket_assigned';
