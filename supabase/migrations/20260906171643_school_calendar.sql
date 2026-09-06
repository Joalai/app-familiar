create table if not exists public.school_calendar_periods (
  id uuid primary key default gen_random_uuid(),
  school_year text not null,
  title text not null,
  kind text not null,
  start_date date not null,
  end_date date not null,
  no_class boolean not null default true,
  extracurriculars_allowed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_calendar_dates_check check (end_date >= start_date),
  constraint school_calendar_kind_check check (kind in ('holiday','bridge','vacation','intensive')),
  constraint school_calendar_period_unique unique (school_year, title, start_date, end_date)
);

alter table public.school_calendar_periods enable row level security;
revoke all on table public.school_calendar_periods from public, anon, authenticated;

insert into public.school_calendar_periods (
  school_year, title, kind, start_date, end_date, no_class, extracurriculars_allowed
) values
  ('2026-2027','Inicio de curso','vacation','2026-09-01','2026-09-08',true,false),
  ('2026-2027','Festivo','holiday','2026-10-12','2026-10-12',true,false),
  ('2026-2027','Festivo local de la ikastola','holiday','2026-11-23','2026-11-23',true,true),
  ('2026-2027','Puente','bridge','2026-12-07','2026-12-07',true,false),
  ('2026-2027','Festivo','holiday','2026-12-08','2026-12-08',true,false),
  ('2026-2027','Vacaciones de Navidad','vacation','2026-12-23','2027-01-06',true,false),
  ('2026-2027','Puente','bridge','2027-02-08','2027-02-08',true,false),
  ('2026-2027','Festivo','holiday','2027-02-09','2027-02-09',true,false),
  ('2026-2027','Vacaciones de Semana Santa','vacation','2027-03-22','2027-04-02',true,false),
  ('2026-2027','Festivo','holiday','2027-05-01','2027-05-01',true,false),
  ('2026-2027','Jornada intensiva','intensive','2027-06-10','2027-06-11',false,true),
  ('2026-2027','Jornada intensiva','intensive','2027-06-14','2027-06-17',false,true),
  ('2026-2027','Vacaciones de verano','vacation','2027-06-18','2027-08-31',true,false)
on conflict (school_year, title, start_date, end_date) do update set
  kind = excluded.kind,
  no_class = excluded.no_class,
  extracurriculars_allowed = excluded.extracurriculars_allowed,
  updated_at = now();

create or replace function public.family_get_data(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.family_code_ok(p_code) then
    raise exception 'invalid family code' using errcode='28000';
  end if;
  return jsonb_build_object(
    'members', coalesce((select jsonb_agg(to_jsonb(x) order by x.sort_order) from public.family_members x where x.active), '[]'::jsonb),
    'recurring', coalesce((select jsonb_agg(to_jsonb(x) order by x.weekday, x.start_time) from public.recurring_activities x where x.active), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(to_jsonb(x) order by x.event_date, x.start_time nulls last) from public.events x), '[]'::jsonb),
    'shopping', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at) from public.shopping_items x), '[]'::jsonb),
    'school_calendar', coalesce((select jsonb_agg(to_jsonb(x) order by x.start_date, x.end_date) from public.school_calendar_periods x), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.family_get_data(text) from public;
grant execute on function public.family_get_data(text) to anon, authenticated;
