-- Allow role changes when running as superuser (SQL editor) or service_role.
-- Those contexts have auth.uid() = null. The trigger only needs to block
-- regular authenticated users from escalating themselves.

create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is null then
      -- Bypass: SQL editor / service_role / cron / migrations.
      return new;
    end if;
    if not public.is_admin() then
      raise exception 'Only admins can change role';
    end if;
  end if;
  return new;
end;
$$;
