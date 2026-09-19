alter table public.family_vehicle_records
  add column if not exists appointment_time time without time zone,
  add column if not exists place text;

create or replace function public.family_sync_vehicle_calendar(p_record_id uuid, p_show boolean default true)
returns uuid
language plpgsql
security definer
set search_path = ''
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

  d := case
    when r.next_date is not null and (r.appointment_time is not null or nullif(trim(r.place),'') is not null) then r.next_date
    else coalesce(r.reminder_date, r.next_date)
  end;

  if not coalesce(p_show,false) or d is null then
    if r.calendar_event_id is not null then
      delete from public.events where id=r.calendar_event_id and source='vehicle';
      update public.family_vehicle_records set calendar_event_id=null where id=r.id;
    end if;
    return null;
  end if;

  event_title := case r.kind
    when 'itv' then '🚗 Próxima ITV · '||v.name
    when 'seguro' then case when r.reminder_date is not null and r.appointment_time is null and nullif(trim(r.place),'') is null
      then '🚗 Negociar seguro · '||v.name else '🚗 Renovar seguro · '||v.name end
    when 'taller' then '🚗 Coche · '||coalesce(nullif(trim(r.title),''),'Taller')||' · '||v.name
    when 'neumaticos' then '🛞 Neumáticos · '||coalesce(nullif(trim(r.title),''),'Revisión')||' · '||v.name
    when 'averia' then '⚠️ Avería · '||coalesce(nullif(trim(r.title),''),'Seguimiento')||' · '||v.name
    else '🚗 Coche · '||coalesce(nullif(trim(r.title),''),'Recordatorio')||' · '||v.name
  end;

  event_notes := concat_ws(E'\n',
    case when v.registration is not null then 'Matrícula: '||v.registration end,
    case when r.provider is not null then 'Proveedor/taller: '||r.provider end,
    case when r.next_date is not null then 'Próxima fecha: '||to_char(r.next_date,'DD/MM/YYYY') end,
    case when r.appointment_time is not null then 'Hora: '||to_char(r.appointment_time,'HH24:MI') end,
    case when r.place is not null then 'Lugar: '||r.place end,
    case when r.reminder_date is not null then 'Fecha de aviso: '||to_char(r.reminder_date,'DD/MM/YYYY') end,
    case when r.mileage is not null then 'Kilómetros: '||r.mileage::text end,
    case when r.amount is not null then 'Coste: '||trim(to_char(r.amount,'FM999999990D00'))||' €' end,
    nullif(trim(r.notes),'')
  );

  if r.calendar_event_id is not null and exists(select 1 from public.events where id=r.calendar_event_id and source='vehicle') then
    update public.events set
      category='coche',title=event_title,event_date=d,
      start_time=case when d=r.next_date then r.appointment_time else null end,
      end_time=null,member_names=array['Familia']::text[],
      place=case when d=r.next_date then nullif(trim(r.place),'') else null end,
      notes=event_notes,source='vehicle',source_ref=r.id::text,
      time_confirmed=(d=r.next_date and r.appointment_time is not null),updated_at=now()
    where id=r.calendar_event_id
    returning id into event_id;
  else
    insert into public.events(category,title,event_date,start_time,end_time,member_names,place,notes,source,source_ref,time_confirmed,created_by)
    values(
      'coche',event_title,d,
      case when d=r.next_date then r.appointment_time else null end,
      null,array['Familia']::text[],
      case when d=r.next_date then nullif(trim(r.place),'') else null end,
      event_notes,'vehicle',r.id::text,
      (d=r.next_date and r.appointment_time is not null),r.created_by
    )
    returning id into event_id;
    update public.family_vehicle_records set calendar_event_id=event_id where id=r.id;
  end if;

  return event_id;
end;
$$;

drop function if exists public.family_add_vehicle_record(text,uuid,text,date,date,date,text,text,integer,numeric,text,boolean,text);

create function public.family_add_vehicle_record(
  p_code text,p_vehicle_id uuid,p_kind text,p_record_date date,
  p_next_date date default null,p_reminder_date date default null,
  p_title text default null,p_provider text default null,p_mileage integer default null,
  p_amount numeric default null,p_notes text default null,p_show_calendar boolean default true,
  p_created_by text default null,p_appointment_time time without time zone default null,
  p_place text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare r public.family_vehicle_records;
begin
  if not public.family_code_ok(p_code) then raise exception 'invalid family code' using errcode='28000'; end if;
  if p_kind not in ('itv','seguro','taller','neumaticos','averia','otro') or p_record_date is null then
    raise exception 'invalid vehicle record' using errcode='22023';
  end if;
  if p_appointment_time is not null and p_next_date is null then
    raise exception 'appointment time requires next date' using errcode='22023';
  end if;
  if not exists(select 1 from public.family_vehicles where id=p_vehicle_id and active) then
    raise exception 'vehicle not found' using errcode='P0002';
  end if;

  insert into public.family_vehicle_records(
    vehicle_id,kind,record_date,next_date,reminder_date,title,provider,mileage,amount,notes,created_by,appointment_time,place
  )
  values(
    p_vehicle_id,p_kind,p_record_date,p_next_date,p_reminder_date,nullif(trim(p_title),''),
    nullif(trim(p_provider),''),p_mileage,p_amount,nullif(trim(p_notes),''),
    nullif(trim(p_created_by),''),p_appointment_time,nullif(trim(p_place),'')
  )
  returning * into r;

  perform public.family_sync_vehicle_calendar(r.id,p_show_calendar);
  select * into r from public.family_vehicle_records where id=r.id;
  return to_jsonb(r);
end;
$$;

drop function if exists public.family_update_vehicle_record(text,uuid,text,date,date,date,text,text,integer,numeric,text,boolean);

create function public.family_update_vehicle_record(
  p_code text,p_id uuid,p_kind text,p_record_date date,
  p_next_date date default null,p_reminder_date date default null,
  p_title text default null,p_provider text default null,p_mileage integer default null,
  p_amount numeric default null,p_notes text default null,p_show_calendar boolean default true,
  p_appointment_time time without time zone default null,p_place text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare r public.family_vehicle_records;
begin
  if not public.family_code_ok(p_code) then raise exception 'invalid family code' using errcode='28000'; end if;
  if p_kind not in ('itv','seguro','taller','neumaticos','averia','otro') or p_record_date is null then
    raise exception 'invalid vehicle record' using errcode='22023';
  end if;
  if p_appointment_time is not null and p_next_date is null then
    raise exception 'appointment time requires next date' using errcode='22023';
  end if;

  update public.family_vehicle_records set
    kind=p_kind,record_date=p_record_date,next_date=p_next_date,reminder_date=p_reminder_date,
    title=nullif(trim(p_title),''),provider=nullif(trim(p_provider),''),mileage=p_mileage,
    amount=p_amount,notes=nullif(trim(p_notes),''),appointment_time=p_appointment_time,
    place=nullif(trim(p_place),''),updated_at=now()
  where id=p_id returning * into r;

  if r.id is null then raise exception 'vehicle record not found' using errcode='P0002'; end if;
  perform public.family_sync_vehicle_calendar(r.id,p_show_calendar);
  select * into r from public.family_vehicle_records where id=r.id;
  return to_jsonb(r);
end;
$$;

revoke all on function public.family_sync_vehicle_calendar(uuid,boolean) from public, anon, authenticated;
revoke all on function public.family_add_vehicle_record(text,uuid,text,date,date,date,text,text,integer,numeric,text,boolean,text,time without time zone,text) from public, anon, authenticated;
revoke all on function public.family_update_vehicle_record(text,uuid,text,date,date,date,text,text,integer,numeric,text,boolean,time without time zone,text) from public, anon, authenticated;

grant execute on function public.family_add_vehicle_record(text,uuid,text,date,date,date,text,text,integer,numeric,text,boolean,text,time without time zone,text) to anon, authenticated;
grant execute on function public.family_update_vehicle_record(text,uuid,text,date,date,date,text,text,integer,numeric,text,boolean,time without time zone,text) to anon, authenticated;
