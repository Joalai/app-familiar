create table if not exists public.family_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  due_date date,
  assignees text[] not null default '{}'::text[],
  notes text,
  is_done boolean not null default false,
  completed_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_tasks_title_check check (nullif(trim(title),'') is not null),
  constraint family_tasks_assignees_check check (assignees <@ array['Igor','Mirari']::text[]),
  constraint family_tasks_created_by_check check (created_by is null or created_by = any(array['Igor','Mirari','Joane','Laia','Alain']::text[]))
);

create index if not exists family_tasks_open_due_idx on public.family_tasks(is_done,due_date,created_at);
alter table public.family_tasks enable row level security;
revoke all on table public.family_tasks from public, anon, authenticated;

create or replace function public.family_add_task(
  p_code text,
  p_title text,
  p_due_date date default null,
  p_assignees text[] default '{}'::text[],
  p_notes text default null,
  p_created_by text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r public.family_tasks; a text[];
begin
  if not public.family_code_ok(p_code) then raise exception 'invalid family code' using errcode='28000'; end if;
  if nullif(trim(p_title),'') is null then raise exception 'task title required' using errcode='22023'; end if;
  select coalesce(array_agg(distinct x order by x),'{}'::text[]) into a from unnest(coalesce(p_assignees,'{}'::text[])) x;
  if not (a <@ array['Igor','Mirari']::text[]) then raise exception 'invalid assignee' using errcode='22023'; end if;
  insert into public.family_tasks(title,due_date,assignees,notes,created_by)
  values(trim(p_title),p_due_date,a,nullif(trim(p_notes),''),nullif(trim(p_created_by),''))
  returning * into r;
  return to_jsonb(r);
end;
$$;

create or replace function public.family_update_task(
  p_code text,
  p_id uuid,
  p_title text,
  p_due_date date default null,
  p_assignees text[] default '{}'::text[],
  p_notes text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r public.family_tasks; a text[];
begin
  if not public.family_code_ok(p_code) then raise exception 'invalid family code' using errcode='28000'; end if;
  if nullif(trim(p_title),'') is null then raise exception 'task title required' using errcode='22023'; end if;
  select coalesce(array_agg(distinct x order by x),'{}'::text[]) into a from unnest(coalesce(p_assignees,'{}'::text[])) x;
  if not (a <@ array['Igor','Mirari']::text[]) then raise exception 'invalid assignee' using errcode='22023'; end if;
  update public.family_tasks set title=trim(p_title),due_date=p_due_date,assignees=a,notes=nullif(trim(p_notes),''),updated_at=now()
  where id=p_id returning * into r;
  if r.id is null then raise exception 'task not found' using errcode='P0002'; end if;
  return to_jsonb(r);
end;
$$;

create or replace function public.family_set_task_done(p_code text,p_id uuid,p_done boolean)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r public.family_tasks;
begin
  if not public.family_code_ok(p_code) then raise exception 'invalid family code' using errcode='28000'; end if;
  update public.family_tasks set is_done=coalesce(p_done,false),completed_at=case when coalesce(p_done,false) then now() else null end,updated_at=now()
  where id=p_id returning * into r;
  if r.id is null then raise exception 'task not found' using errcode='P0002'; end if;
  return to_jsonb(r);
end;
$$;

create or replace function public.family_assign_task(p_code text,p_id uuid,p_assignees text[] default '{}'::text[])
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r public.family_tasks; a text[];
begin
  if not public.family_code_ok(p_code) then raise exception 'invalid family code' using errcode='28000'; end if;
  select coalesce(array_agg(distinct x order by x),'{}'::text[]) into a from unnest(coalesce(p_assignees,'{}'::text[])) x;
  if not (a <@ array['Igor','Mirari']::text[]) then raise exception 'invalid assignee' using errcode='22023'; end if;
  update public.family_tasks set assignees=a,updated_at=now() where id=p_id returning * into r;
  if r.id is null then raise exception 'task not found' using errcode='P0002'; end if;
  return to_jsonb(r);
end;
$$;

create or replace function public.family_delete_task(p_code text,p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.family_code_ok(p_code) then raise exception 'invalid family code' using errcode='28000'; end if;
  delete from public.family_tasks where id=p_id;
  return found;
end;
$$;

create or replace function public.family_get_data(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
 if not public.family_code_ok(p_code) then raise exception 'invalid family code' using errcode='28000'; end if;
 return jsonb_build_object(
 'members',coalesce((select jsonb_agg(to_jsonb(x) order by x.sort_order) from public.family_members x where x.active),'[]'::jsonb),
 'recurring',coalesce((select jsonb_agg(to_jsonb(x) order by x.weekday,x.start_time) from public.recurring_activities x where x.active),'[]'::jsonb),
 'events',coalesce((select jsonb_agg(to_jsonb(x) order by x.event_date,x.start_time nulls last) from public.events x),'[]'::jsonb),
 'shopping',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at) from public.shopping_items x),'[]'::jsonb),
 'school_calendar',coalesce((select jsonb_agg(to_jsonb(x) order by x.start_date,x.end_date) from public.school_calendar_periods x),'[]'::jsonb),
 'vehicles',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at) from public.family_vehicles x where x.active),'[]'::jsonb),
 'vehicle_records',coalesce((select jsonb_agg(to_jsonb(x) order by x.record_date desc,x.created_at desc) from public.family_vehicle_records x join public.family_vehicles v on v.id=x.vehicle_id where v.active),'[]'::jsonb),
 'tasks',coalesce((select jsonb_agg(to_jsonb(x) order by x.is_done asc,x.due_date nulls last,x.created_at) from public.family_tasks x),'[]'::jsonb));
end; $$;

revoke all on function public.family_add_task(text,text,date,text[],text,text) from public;
revoke all on function public.family_update_task(text,uuid,text,date,text[],text) from public;
revoke all on function public.family_set_task_done(text,uuid,boolean) from public;
revoke all on function public.family_assign_task(text,uuid,text[]) from public;
revoke all on function public.family_delete_task(text,uuid) from public;
grant execute on function public.family_add_task(text,text,date,text[],text,text) to anon, authenticated;
grant execute on function public.family_update_task(text,uuid,text,date,text[],text) to anon, authenticated;
grant execute on function public.family_set_task_done(text,uuid,boolean) to anon, authenticated;
grant execute on function public.family_assign_task(text,uuid,text[]) to anon, authenticated;
grant execute on function public.family_delete_task(text,uuid) to anon, authenticated;
