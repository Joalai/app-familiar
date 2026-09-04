alter table public.events add column if not exists created_by text;
alter table public.shopping_items add column if not exists created_by text;
alter table public.recurring_activities add column if not exists created_by text;
alter table public.recurring_activities add column if not exists cadence text not null default 'weekly';
alter table public.recurring_activities add column if not exists anchor_date date;
alter table public.recurring_activities add column if not exists week_of_month smallint;

alter table public.recurring_activities
  drop constraint if exists recurring_activities_cadence_check;
alter table public.recurring_activities
  add constraint recurring_activities_cadence_check
  check (cadence in ('weekly','biweekly','monthly'));

alter table public.recurring_activities
  drop constraint if exists recurring_activities_week_of_month_check;
alter table public.recurring_activities
  add constraint recurring_activities_week_of_month_check
  check (week_of_month is null or week_of_month in (-1,1,2,3,4));

create or replace function public.family_add_event_v2(
  p_code text,
  p_category text,
  p_title text,
  p_event_date date,
  p_start_time time default null,
  p_end_time time default null,
  p_member_names text[] default '{}'::text[],
  p_place text default null,
  p_notes text default null,
  p_created_by text default null
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
  insert into public.events(
    category,title,event_date,start_time,end_time,member_names,place,notes,
    source,time_confirmed,created_by
  ) values (
    coalesce(nullif(trim(p_category),''),'plan'),trim(p_title),p_event_date,
    p_start_time,p_end_time,coalesce(p_member_names,'{}'::text[]),
    nullif(trim(p_place),''),nullif(trim(p_notes),''),'family',
    p_start_time is not null,nullif(trim(p_created_by),'')
  ) returning * into r;
  return to_jsonb(r);
end;
$$;

create or replace function public.family_update_event(
  p_code text,
  p_id uuid,
  p_category text,
  p_title text,
  p_event_date date,
  p_start_time time default null,
  p_end_time time default null,
  p_member_names text[] default '{}'::text[],
  p_place text default null,
  p_notes text default null
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
    updated_at=now()
  where id=p_id and source='family'
  returning * into r;
  if r.id is null then raise exception 'event not found' using errcode='P0002'; end if;
  return to_jsonb(r);
end;
$$;

create or replace function public.family_add_shopping_v2(
  p_code text,
  p_item_name text,
  p_category text default null,
  p_detail text default null,
  p_created_by text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r public.shopping_items;
begin
  if not public.family_code_ok(p_code) then
    raise exception 'invalid family code' using errcode='28000';
  end if;
  if nullif(trim(p_item_name),'') is null then
    raise exception 'item name is required' using errcode='22023';
  end if;
  insert into public.shopping_items(item_name,category,detail,created_by)
  values(
    trim(p_item_name),nullif(trim(p_category),''),
    nullif(trim(p_detail),''),nullif(trim(p_created_by),'')
  ) returning * into r;
  return to_jsonb(r);
end;
$$;

create or replace function public.family_update_shopping(
  p_code text,
  p_id uuid,
  p_item_name text,
  p_category text default null,
  p_detail text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r public.shopping_items;
begin
  if not public.family_code_ok(p_code) then
    raise exception 'invalid family code' using errcode='28000';
  end if;
  if nullif(trim(p_item_name),'') is null then
    raise exception 'item name is required' using errcode='22023';
  end if;
  update public.shopping_items set
    item_name=trim(p_item_name),
    category=nullif(trim(p_category),''),
    detail=nullif(trim(p_detail),''),
    updated_at=now()
  where id=p_id
  returning * into r;
  if r.id is null then raise exception 'shopping item not found' using errcode='P0002'; end if;
  return to_jsonb(r);
end;
$$;

create or replace function public.family_add_recurring(
  p_code text,
  p_title text,
  p_weekday smallint,
  p_start_time time,
  p_end_time time,
  p_member_names text[] default '{}'::text[],
  p_place text default null,
  p_valid_from date default null,
  p_valid_until date default null,
  p_cadence text default 'weekly',
  p_anchor_date date default null,
  p_week_of_month smallint default null,
  p_created_by text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r public.recurring_activities;
begin
  if not public.family_code_ok(p_code) then
    raise exception 'invalid family code' using errcode='28000';
  end if;
  if nullif(trim(p_title),'') is null or p_weekday not between 1 and 7
     or p_start_time is null or p_end_time is null or p_end_time <= p_start_time then
    raise exception 'invalid recurring activity' using errcode='22023';
  end if;
  insert into public.recurring_activities(
    title,weekday,start_time,end_time,member_names,place,valid_from,valid_until,
    cadence,anchor_date,week_of_month,created_by,active
  ) values (
    trim(p_title),p_weekday,p_start_time,p_end_time,coalesce(p_member_names,'{}'::text[]),
    nullif(trim(p_place),''),p_valid_from,p_valid_until,p_cadence,p_anchor_date,
    p_week_of_month,nullif(trim(p_created_by),''),true
  ) returning * into r;
  return to_jsonb(r);
end;
$$;

create or replace function public.family_update_recurring(
  p_code text,
  p_id uuid,
  p_title text,
  p_weekday smallint,
  p_start_time time,
  p_end_time time,
  p_member_names text[] default '{}'::text[],
  p_place text default null,
  p_valid_from date default null,
  p_valid_until date default null,
  p_cadence text default 'weekly',
  p_anchor_date date default null,
  p_week_of_month smallint default null
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r public.recurring_activities;
begin
  if not public.family_code_ok(p_code) then
    raise exception 'invalid family code' using errcode='28000';
  end if;
  if nullif(trim(p_title),'') is null or p_weekday not between 1 and 7
     or p_start_time is null or p_end_time is null or p_end_time <= p_start_time then
    raise exception 'invalid recurring activity' using errcode='22023';
  end if;
  update public.recurring_activities set
    title=trim(p_title),weekday=p_weekday,start_time=p_start_time,end_time=p_end_time,
    member_names=coalesce(p_member_names,'{}'::text[]),place=nullif(trim(p_place),''),
    valid_from=p_valid_from,valid_until=p_valid_until,cadence=p_cadence,
    anchor_date=p_anchor_date,week_of_month=p_week_of_month,updated_at=now()
  where id=p_id
  returning * into r;
  if r.id is null then raise exception 'recurring activity not found' using errcode='P0002'; end if;
  return to_jsonb(r);
end;
$$;

create or replace function public.family_delete_recurring(p_code text, p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.family_code_ok(p_code) then
    raise exception 'invalid family code' using errcode='28000';
  end if;
  delete from public.recurring_activities where id=p_id;
  return found;
end;
$$;

revoke all on function public.family_add_event_v2(text,text,text,date,time,time,text[],text,text,text) from public;
revoke all on function public.family_update_event(text,uuid,text,text,date,time,time,text[],text,text) from public;
revoke all on function public.family_add_shopping_v2(text,text,text,text,text) from public;
revoke all on function public.family_update_shopping(text,uuid,text,text,text) from public;
revoke all on function public.family_add_recurring(text,text,smallint,time,time,text[],text,date,date,text,date,smallint,text) from public;
revoke all on function public.family_update_recurring(text,uuid,text,smallint,time,time,text[],text,date,date,text,date,smallint) from public;
revoke all on function public.family_delete_recurring(text,uuid) from public;

grant execute on function public.family_add_event_v2(text,text,text,date,time,time,text[],text,text,text) to anon, authenticated;
grant execute on function public.family_update_event(text,uuid,text,text,date,time,time,text[],text,text) to anon, authenticated;
grant execute on function public.family_add_shopping_v2(text,text,text,text,text) to anon, authenticated;
grant execute on function public.family_update_shopping(text,uuid,text,text,text) to anon, authenticated;
grant execute on function public.family_add_recurring(text,text,smallint,time,time,text[],text,date,date,text,date,smallint,text) to anon, authenticated;
grant execute on function public.family_update_recurring(text,uuid,text,smallint,time,time,text[],text,date,date,text,date,smallint) to anon, authenticated;
grant execute on function public.family_delete_recurring(text,uuid) to anon, authenticated;
