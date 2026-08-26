-- Keep only the tenant-bound ticket relationship so PostgREST has one
-- unambiguous support_tickets <-> ticket_messages embedding path.
alter table public.ticket_messages
  drop constraint if exists ticket_messages_ticket_id_fkey;
