create or replace function public.family_document_link_recent(p_code text, p_email text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select case
    when not public.family_code_ok(p_code) then false
    else exists (
      select 1
      from auth.users u
      where lower(u.email) = lower(trim(coalesce(p_email,'')))
        and u.email_confirmed_at is not null
        and u.recovery_sent_at is not null
        and u.recovery_sent_at >= now() - interval '3 minutes'
    )
  end
$$;

revoke all on function public.family_document_link_recent(text,text) from public;
grant execute on function public.family_document_link_recent(text,text) to anon, authenticated;
