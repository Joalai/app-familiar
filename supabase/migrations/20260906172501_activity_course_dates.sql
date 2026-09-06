alter table public.recurring_activities
  add column if not exists school_closure_exceptions date[] not null default '{}'::date[];

update public.recurring_activities
set valid_until = '2027-06-17', updated_at = now()
where active;

update public.recurring_activities
set valid_from = '2026-10-05', updated_at = now()
where active and title in ('Fútbol','G. Rítmica');

update public.recurring_activities
set valid_from = '2026-09-16', updated_at = now()
where active and title = 'Inglés';

update public.recurring_activities
set valid_from = '2026-09-10', updated_at = now()
where active and title = 'Guitarra' and member_names = array['Alain']::text[];

update public.recurring_activities
set valid_from = '2026-09-10', updated_at = now()
where active and title = 'Solfeo' and member_names = array['Alain']::text[];

update public.recurring_activities
set member_names = array['Joane']::text[],
    valid_from = '2026-09-08',
    school_closure_exceptions = array['2026-09-08'::date],
    updated_at = now()
where active and title = 'Ballet' and member_names @> array['Joane','Laia']::text[];

insert into public.recurring_activities (
  title, weekday, start_time, end_time, member_names, place, active,
  valid_from, valid_until, created_by, cadence, anchor_date, week_of_month,
  school_closure_exceptions
)
select
  title, weekday, start_time, end_time, array['Laia']::text[], place, active,
  '2026-10-01'::date, '2027-06-17'::date, created_by, cadence, anchor_date,
  week_of_month, '{}'::date[]
from public.recurring_activities source
where source.active and source.title = 'Ballet'
  and source.member_names = array['Joane']::text[]
  and not exists (
    select 1 from public.recurring_activities existing
    where existing.active and existing.title = 'Ballet'
      and existing.member_names = array['Laia']::text[]
  );
