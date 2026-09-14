create table if not exists public.family_vehicles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  registration text,
  notes text,
  active boolean not null default true,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_vehicles_name_check check (nullif(trim(name),'') is not null),
  constraint family_vehicles_created_by_check check (created_by is null or created_by = any(array['Igor','Mirari','Joane','Laia','Alain']::text[]))
);

create table if not exists public.family_vehicle_records (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.family_vehicles(id) on delete cascade,
  kind text not null,
  record_date date not null,
  next_date date,
  reminder_date date,
  title text,
  provider text,
  mileage integer,
  amount numeric(10,2),
  notes text,
  calendar_event_id uuid references public.events(id) on delete set null,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_vehicle_records_kind_check check (kind in ('itv','seguro','taller','otro')),
  constraint family_vehicle_records_mileage_check check (mileage is null or mileage >= 0),
  constraint family_vehicle_records_amount_check check (amount is null or amount >= 0),
  constraint family_vehicle_records_created_by_check check (created_by is null or created_by = any(array['Igor','Mirari','Joane','Laia','Alain']::text[]))
);

create index if not exists family_vehicle_records_vehicle_date_idx on public.family_vehicle_records(vehicle_id, record_date desc);
create index if not exists family_vehicle_records_future_idx on public.family_vehicle_records(next_date, reminder_date);

alter table public.family_vehicles enable row level security;
alter table public.family_vehicle_records enable row level security;
revoke all on table public.family_vehicles from public, anon, authenticated;
revoke all on table public.family_vehicle_records from public, anon, authenticated;

create or replace function public.family_sync_vehicle_calendar(p_record_id uuid, p_show boolean default true)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r public.family_vehicle_records;
  v public.family_vehicles;
  d date;
  event_title text;
  event_notes text;
  event_id uuid;
begin
  select * into r from public.family_vehicle_records where id=p_record_id;
  if r.id is null then return null; end if;
  select * into v from public.family_vehicles where id=r.vehicle_id;
  if v.id is null then return null; end if;

  d := coalesce(r.reminder_date, r.next_date);
  if not coalesce(p_show,false) or d is null then
    if r.calendar_event_id is not null then
      delete from public.events where id=r.calendar_event_id and source='vehicle';
      update public.family_vehicle_records set calendar_event_id=null where id=r.id;
    end if;
    return null;
  end if;

  event_title := case r.kind
    when 'itv' then '🚗 Próxima ITV · '||v.name
    when 'seguro' then case when r.reminder_date is not null then '🚗 Negociar seguro · '||v.name else '🚗 Renovar seguro · '||v.name end
    when 'taller' then '🚗 Coche · '||coalesce(nullif(trim(r.title),''),'Taller')||' · '||v.name
    else '🚗 Coche · '||coalesce(nullif(trim(r.title),''),'Recordatorio')||' · '||v.name
  end;

  event_notes := concat_ws(E'\n',
    case when v.registration is not null then 'Matrícula: '||v.registration end,
    case when r.provider is not null then 'Proveedor/taller: '||r.provider end,
    case when r.next_date is not null then 'Próxima fecha: '||to_char(r.next_date,'DD/MM/YYYY') end,
    case when r.reminder_date is not null then 'Fecha de aviso: '||to_char(r.reminder_date,'DD/MM/YYYY') end,
    case when r.mileage is not null then 'Kilómetros: '||r.mileage::text end,
    case when r.amount is not null then 'Coste: '||trim(to_char(r.amount,'FM999999990D00'))||' €' end,
    nullif(trim(r.notes),'')
  );

  if r.calendar_event_id is not null and exists(select 1 from public.events where id=r.calendar_event_id and source='vehicle') then
    update public.events set
      category='coche', title=event_title, event_date=d, start_time=null, end_time=null,
      member_names=array['Familia']::text[], place=null, notes=event_notes,
      source='vehicle', source_ref=r.id::text, time_confirmed=false, updated_at=now()
    where id=r.calendar_event_id
    returning id into event_id;
  else
    insert into public.events(category,title,event_date,start_time,end_time,member_names,place,notes,source,source_ref,time_confirmed,created_by)
    values('coche',event_title,d,null,null,array['Familia']::text[],null,event_notes,'vehicle',r.id::text,false,r.created_by)
    returning id into event_id;
    update public.family_vehicle_records set calendar_event_id=event_id where id=r.id;
  end if;
  return event_id;
end;
$$;

revoke all on function public.family_sync_vehicle_calendar(uuid,boolean) from public, anon, authenticated;

create or replace function public.family_add_vehicle(
  p_code text,
  p_name text,
  p_registration text default null,
  p_notes text default null,
  p_created_by text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r public.family_vehicles;
begin
  if not public.family_code_ok(p_code) then raise exception 'invalid family code' using errcode='28000'; end if;
  if nullif(trim(p_name),'') is null then raise exception 'vehicle name required' using errcode='22023'; end if;
  insert into public.family_vehicles(name,registration,notes,created_by)
  values(trim(p_name),upper(nullif(trim(p_registration),'')),nullif(trim(p_notes),''),nullif(trim(p_created_by),''))
  returning * into r;
  return to_jsonb(r);
end;
$$;

create or replace function public.family_update_vehicle(
  p_code text,
  p_id uuid,
  p_name text,
  p_registration text default null,
  p_notes text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r public.family_vehicles;
begin
  if not public.family_code_ok(p_code) then raise exception 'invalid family code' using errcode='28000'; end if;
  if nullif(trim(p_name),'') is null then raise exception 'vehicle name required' using errcode='22023'; end if;
  update public.family_vehicles set name=trim(p_name),registration=upper(nullif(trim(p_registration),'')),notes=nullif(trim(p_notes),''),updated_at=now()
  where id=p_id and active returning * into r;
  if r.id is null then raise exception 'vehicle not found' using errcode='P0002'; end if;
  update public.events e set title=replace(e.title, split_part(e.title,' · ',array_length(string_to_array(e.title,' · '),1)), r.name), updated_at=now()
  where e.source='vehicle' and e.source_ref in (select vr.id::text from public.family_vehicle_records vr where vr.vehicle_id=r.id);
  return to_jsonb(r);
end;
$$;

create or replace function public.family_delete_vehicle(p_code text, p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.family_code_ok(p_code) then raise exception 'invalid family code' using errcode='28000'; end if;
  delete from public.events where source='vehicle' and source_ref in (select id::text from public.family_vehicle_records where vehicle_id=p_id);
  delete from public.family_vehicles where id=p_id;
  return found;
end;
$$;

create or replace function public.family_add_vehicle_record(
  p_code text,
  p_vehicle_id uuid,
  p_kind text,
  p_record_date date,
  p_next_date date default null,
  p_reminder_date date default null,
  p_title text default null,
  p_provider text default null,
  p_mileage integer default null,
  p_amount numeric default null,
  p_notes text default null,
  p_show_calendar boolean default true,
  p_created_by text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r public.family_vehicle_records;
begin
  if not public.family_code_ok(p_code) then raise exception 'invalid family code' using errcode='28000'; end if;
  if p_kind not in ('itv','seguro','taller','otro') or p_record_date is null then raise exception 'invalid vehicle record' using errcode='22023'; end if;
  if not exists(select 1 from public.family_vehicles where id=p_vehicle_id and active) then raise exception 'vehicle not found' using errcode='P0002'; end if;
  insert into public.family_vehicle_records(vehicle_id,kind,record_date,next_date,reminder_date,title,provider,mileage,amount,notes,created_by)
  values(p_vehicle_id,p_kind,p_record_date,p_next_date,p_reminder_date,nullif(trim(p_title),''),nullif(trim(p_provider),''),p_mileage,p_amount,nullif(trim(p_notes),''),nullif(trim(p_created_by),''))
  returning * into r;
  perform public.family_sync_vehicle_calendar(r.id,p_show_calendar);
  select * into r from public.family_vehicle_records where id=r.id;
  return to_jsonb(r);
end;
$$;

create or replace function public.family_update_vehicle_record(
  p_code text,
  p_id uuid,
  p_kind text,
  p_record_date date,
  p_next_date date default null,
  p_reminder_date date default null,
  p_title text default null,
  p_provider text default null,
  p_mileage integer default null,
  p_amount numeric default null,
  p_notes text default null,
  p_show_calendar boolean default true
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r public.family_vehicle_records;
begin
  if not public.family_code_ok(p_code) then raise exception 'invalid family code' using errcode='28000'; end if;
  if p_kind not in ('itv','seguro','taller','otro') or p_record_date is null then raise exception 'invalid vehicle record' using errcode='22023'; end if;
  update public.family_vehicle_records set kind=p_kind,record_date=p_record_date,next_date=p_next_date,reminder_date=p_reminder_date,
    title=nullif(trim(p_title),''),provider=nullif(trim(p_provider),''),mileage=p_mileage,amount=p_amount,notes=nullif(trim(p_notes),''),updated_at=now()
  where id=p_id returning * into r;
  if r.id is null then raise exception 'vehicle record not found' using errcode='P0002'; end if;
  perform public.family_sync_vehicle_calendar(r.id,p_show_calendar);
  select * into r from public.family_vehicle_records where id=r.id;
  return to_jsonb(r);
end;
$$;

create or replace function public.family_delete_vehicle_record(p_code text, p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare ev uuid;
begin
  if not public.family_code_ok(p_code) then raise exception 'invalid family code' using errcode='28000'; end if;
  select calendar_event_id into ev from public.family_vehicle_records where id=p_id;
  if ev is not null then delete from public.events where id=ev and source='vehicle'; end if;
  delete from public.family_vehicle_records where id=p_id;
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
 'vehicle_records',coalesce((select jsonb_agg(to_jsonb(x) order by x.record_date desc,x.created_at desc) from public.family_vehicle_records x join public.family_vehicles v on v.id=x.vehicle_id where v.active),'[]'::jsonb));
end; $$;

revoke all on function public.family_add_vehicle(text,text,text,text,text) from public;
revoke all on function public.family_update_vehicle(text,uuid,text,text,text) from public;
revoke all on function public.family_delete_vehicle(text,uuid) from public;
revoke all on function public.family_add_vehicle_record(text,uuid,text,date,date,date,text,text,integer,numeric,text,boolean,text) from public;
revoke all on function public.family_update_vehicle_record(text,uuid,text,date,date,date,text,text,integer,numeric,text,boolean) from public;
revoke all on function public.family_delete_vehicle_record(text,uuid) from public;

grant execute on function public.family_add_vehicle(text,text,text,text,text) to anon, authenticated;
grant execute on function public.family_update_vehicle(text,uuid,text,text,text) to anon, authenticated;
grant execute on function public.family_delete_vehicle(text,uuid) to anon, authenticated;
grant execute on function public.family_add_vehicle_record(text,uuid,text,date,date,date,text,text,integer,numeric,text,boolean,text) to anon, authenticated;
grant execute on function public.family_update_vehicle_record(text,uuid,text,date,date,date,text,text,integer,numeric,text,boolean) to anon, authenticated;
grant execute on function public.family_delete_vehicle_record(text,uuid) to anon, authenticated;
