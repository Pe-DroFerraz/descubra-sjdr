-- TEST FIXTURE ONLY. Invoked exclusively inside the disposable --network none container.
-- Existing demonstration fixtures were already tested, including concurrent redemption.
-- Model the user's empty catalog before testing the separate editorial proposal.
-- NEVER run files in supabase/tests/ against a real Supabase project.
truncate public.routes, public.categories cascade;
