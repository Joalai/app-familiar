
create table if not exists private.family_client_errors (
  id uuid primary key default extensions.gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  app_version text,
  section text,
  message text not null,
  stack text,
  user_agent text
);

revoke all on private.family_client_errors from public, anon, authenticated;

create index if not exists family_client_errors_occurred_at_idx
on private.family_client_errors (occurred_at desc);

create or replace function public.family_log_client_error(
  p_code text,
  p_version text,
  p_section text,
  p_message text,
  p_stack text,
  p_user_agent text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.family_code_ok(p_code) then
    raise exception 'invalid family code' using errcode='28000';
  end if;

  insert into private.family_client_errors(app_version,section,message,stack,user_agent)
  values(
    left(nullif(trim(p_version),''),64),
    left(nullif(trim(p_section),''),64),
    left(coalesce(p_message,'Unknown client error'),1000),
    left(nullif(p_stack,''),5000),
    left(nullif(p_user_agent,''),500)
  );

  delete from private.family_client_errors
  where occurred_at < now() - interval '30 days';
end;
$$;

revoke all on function public.family_log_client_error(text,text,text,text,text,text) from public;
grant execute on function public.family_log_client_error(text,text,text,text,text,text) to anon, authenticated;
