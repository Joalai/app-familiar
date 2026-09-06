do $$
declare
  duplicate_group record;
  keep_id uuid;
  merged_members text[];
begin
  for duplicate_group in
    select array_agg(id order by created_at, id) as ids
    from public.recurring_activities
    where active
    group by
      lower(trim(title)), weekday, start_time, end_time,
      coalesce(trim(place), ''), valid_from, valid_until,
      coalesce(cadence, 'weekly'), anchor_date, week_of_month
    having count(*) > 1
  loop
    keep_id := duplicate_group.ids[1];
    select coalesce(array_agg(distinct member_name order by member_name), '{}'::text[])
    into merged_members
    from public.recurring_activities activity
    cross join lateral unnest(coalesce(activity.member_names, '{}'::text[])) member_name
    where activity.id = any(duplicate_group.ids);

    update public.recurring_activities
    set member_names = merged_members, updated_at = now()
    where id = keep_id;

    delete from public.recurring_activities
    where id = any(duplicate_group.ids) and id <> keep_id;
  end loop;
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
declare
  r public.recurring_activities;
  merged_members text[];
begin
  if not public.family_code_ok(p_code) then
    raise exception 'invalid family code' using errcode='28000';
  end if;
  if nullif(trim(p_title),'') is null or p_weekday not between 1 and 7
     or p_start_time is null or p_end_time is null or p_end_time <= p_start_time then
    raise exception 'invalid recurring activity' using errcode='22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(concat_ws('|',
    lower(trim(p_title)), p_weekday::text, p_start_time::text, p_end_time::text,
    coalesce(trim(p_place), ''), coalesce(p_valid_from::text, ''),
    coalesce(p_valid_until::text, ''), coalesce(p_cadence, 'weekly'),
    coalesce(p_anchor_date::text, ''), coalesce(p_week_of_month::text, '')
  ), 0));

  select * into r
  from public.recurring_activities activity
  where activity.active
    and lower(trim(activity.title)) = lower(trim(p_title))
    and activity.weekday = p_weekday
    and activity.start_time = p_start_time
    and activity.end_time = p_end_time
    and coalesce(trim(activity.place), '') = coalesce(trim(p_place), '')
    and activity.valid_from is not distinct from p_valid_from
    and activity.valid_until is not distinct from p_valid_until
    and coalesce(activity.cadence, 'weekly') = coalesce(p_cadence, 'weekly')
    and activity.anchor_date is not distinct from p_anchor_date
    and activity.week_of_month is not distinct from p_week_of_month
  order by activity.created_at, activity.id
  limit 1
  for update;

  if found then
    select coalesce(array_agg(distinct member_name order by member_name), '{}'::text[])
    into merged_members
    from unnest(coalesce(r.member_names, '{}'::text[]) || coalesce(p_member_names, '{}'::text[])) member_name;

    update public.recurring_activities
    set member_names = merged_members, updated_at = now()
    where id = r.id
    returning * into r;
    return to_jsonb(r);
  end if;

  insert into public.recurring_activities(
    title,weekday,start_time,end_time,member_names,place,valid_from,valid_until,
    cadence,anchor_date,week_of_month,created_by,active
  ) values (
    trim(p_title),p_weekday,p_start_time,p_end_time,coalesce(p_member_names,'{}'::text[]),
    nullif(trim(p_place),''),p_valid_from,p_valid_until,coalesce(p_cadence,'weekly'),p_anchor_date,
    p_week_of_month,nullif(trim(p_created_by),''),true
  ) returning * into r;
  return to_jsonb(r);
end;
$$;

revoke all on function public.family_add_recurring(
  text, text, smallint, time, time, text[], text, date, date, text, date, smallint, text
) from public;
grant execute on function public.family_add_recurring(
  text, text, smallint, time, time, text[], text, date, date, text, date, smallint, text
) to anon, authenticated;
