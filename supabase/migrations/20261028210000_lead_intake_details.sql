-- Commercial intake data; admin-only RLS inherited from public.leads.
-- Store only volunteered fields, no automatic contact or payments.
begin;
alter table public.leads
  add column contact_name text check (contact_name is null or char_length(contact_name) between 2 and 120),
  add column phone text check (phone is null or char_length(phone) <= 30),
  add column message text check (message is null or char_length(message) <= 1000),
  add column plan_slug text check (plan_slug is null or char_length(plan_slug) <= 100),
  add column consent_at timestamptz;
comment on column public.leads.consent_at is 'Recorded opt-in to use voluntarily submitted contact information for reply; no marketing consent implied.';
commit;
