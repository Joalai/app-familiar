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

  d := coalesce(r.next_date, r.reminder_date);

  if not coalesce(p_show,false) or d is null then
    if r.calendar_event_id is not null then
      delete from public.events where id=r.calendar_event_id and source='vehicle';
      update public.family_vehicle_records set calendar_event_id=null where id=r.id;
    end if;
    return null;
  end if;

  event_title := case r.kind
    when 'itv' then '🚗 ITV · '||v.name
    when 'seguro' then '🚗 Seguro · '||v.name
    when 'taller' then '🚗 '||coalesce(nullif(trim(r.title),''),'Taller')||' · '||v.name
    when 'neumaticos' then '🛞 '||coalesce(nullif(trim(r.title),''),'Neumáticos')||' · '||v.name
    when 'averia' then '⚠️ '||coalesce(nullif(trim(r.title),''),'Avería')||' · '||v.name
    else '🚗 '||coalesce(nullif(trim(r.title),''),'Coche')||' · '||v.name
  end;

  event_notes := concat_ws(E'\n',
    case when v.registration is not null then 'Matrícula: '||v.registration end,
    case when r.provider is not null then 'Taller/proveedor: '||r.provider end,
    case when r.reminder_date is not null then 'Avisarme desde: '||to_char(r.reminder_date,'DD/MM/YYYY') end,
    case when r.mileage is not null then 'Kilómetros: '||r.mileage::text end,
    case when r.amount is not null then 'Coste: '||trim(to_char(r.amount,'FM999999990D00'))||' €' end,
    nullif(trim(r.notes),'')
  );

  if r.calendar_event_id is not null and exists(select 1 from public.events where id=r.calendar_event_id and source='vehicle') then
    update public.events set
      category='coche', title=event_title, event_date=d,
      start_time=case when r.next_date is not null then r.appointment_time else null end,
      end_time=null, member_names=array['Familia']::text[],
      place=case when r.next_date is not null then nullif(trim(r.place),'') else null end,
      notes=event_notes, source='vehicle', source_ref=r.id::text,
      time_confirmed=(r.next_date is not null and r.appointment_time is not null), updated_at=now()
    where id=r.calendar_event_id
    returning id into event_id;
  else
    insert into public.events(category,title,event_date,start_time,end_time,member_names,place,notes,source,source_ref,time_confirmed,created_by)
    values(
      'coche',event_title,d,
      case when r.next_date is not null then r.appointment_time else null end,
      null,array['Familia']::text[],
      case when r.next_date is not null then nullif(trim(r.place),'') else null end,
      event_notes,'vehicle',r.id::text,
      (r.next_date is not null and r.appointment_time is not null),r.created_by
    )
    returning id into event_id;
    update public.family_vehicle_records set calendar_event_id=event_id where id=r.id;
  end if;
  return event_id;
end;
$$;

revoke all on function public.family_sync_vehicle_calendar(uuid,boolean) from public, anon, authenticated;

do $$
declare x record;
begin
  for x in select id from public.family_vehicle_records where calendar_event_id is not null loop
    perform public.family_sync_vehicle_calendar(x.id,true);
  end loop;
end;
$$;
