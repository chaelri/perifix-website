-- Grant table-level access so PostgREST (anon + authenticated roles) can hit
-- our tables. RLS policies still gate row-level access on top of these grants.
-- This is needed because the project was created with "Automatically expose
-- new tables" disabled, which skips the default Supabase grants.

grant usage on schema public to anon, authenticated;

grant all on public.profiles to anon, authenticated;
grant all on public.account_requests to anon, authenticated;
grant all on public.support_requests to anon, authenticated;
grant all on public.devices to anon, authenticated;
grant all on public.problems to anon, authenticated;
grant all on public.troubleshooting_feedback to anon, authenticated;

-- Sequences for bigserial PKs (account_requests, devices, problems, feedback)
grant usage, select on all sequences in schema public to anon, authenticated;

-- Helper used inside RLS policies
grant execute on function public.is_admin() to anon, authenticated;

-- Make the same grants apply to any future tables/sequences created here, so
-- we don't have to remember to repeat this incantation.
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated;
