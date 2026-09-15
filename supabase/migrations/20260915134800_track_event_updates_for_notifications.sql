alter table public.events add column if not exists updated_by text;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname='events_updated_by_check'
  ) then
    alter table public.events add constraint events_updated_by_check
      check (updated_by is null or updated_by = any(array['Igor','Mirari','Joane','Laia','Alain']::text[]));
  end if;
end $$;

create or replace function public.family_update_event_v2(
  p_code text,
  p_id uuid,
  p_category text,
  p_title text,
  p_event_date date,
  p_start_time time default null,
  p_end_time time default null,
  p_member_names text[] default '{}'::text[],
  p_place text default null,
  p_notes text default null,
  p_updated_by text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r public.events;
begin
  if not public.family_code_ok(p_code) then
    raise exception 'invalid family code' using errcode='28000';
  end if;
  if nullif(trim(p_title),'') is null or p_event_date is null then
    raise exception 'title and date are required' using errcode='22023';
  end if;
  update public.events set
    category=coalesce(nullif(trim(p_category),''),'plan'),
    title=trim(p_title),
    event_date=p_event_date,
    start_time=p_start_time,
    end_time=p_end_time,
    member_names=coalesce(p_member_names,'{}'::text[]),
    place=nullif(trim(p_place),''),
    notes=nullif(trim(p_notes),''),
    time_confirmed=p_start_time is not null,
    updated_at=now(),
    updated_by=case when p_updated_by = any(array['Igor','Mirari','Joane','Laia','Alain']::text[]) then p_updated_by else null end
  where id=p_id and source='family'
  returning * into r;
  if r.id is null then raise exception 'event not found' using errcode='P0002'; end if;
  return to_jsonb(r);
end;
$$;

revoke all on function public.family_update_event_v2(text,uuid,text,text,date,time,time,text[],text,text,text) from public;
grant execute on function public.family_update_event_v2(text,uuid,text,text,date,time,time,text[],text,text,text) to anon, authenticated;
