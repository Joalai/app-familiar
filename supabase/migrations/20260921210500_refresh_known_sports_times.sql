
-- Refresh fixture dates/times that are now published by competition/club sources.
update public.events
set event_date = date '2026-09-26',
    start_time = time '18:30',
    time_confirmed = true,
    updated_at = now()
where category='sport'
  and source_ref='Sestao River'
  and title='Sestao River – Atlético Astorga';

update public.events
set start_time = time '17:00',
    time_confirmed = true,
    updated_at = now()
where category='sport'
  and source_ref='Sestao River'
  and title='Sestao River – Gimnástica Torrelavega'
  and event_date=date '2026-10-11';

update public.events
set start_time = time '17:00',
    time_confirmed = true,
    updated_at = now()
where category='sport'
  and source_ref='Sestao River'
  and title='Sestao River – Arosa'
  and event_date=date '2026-10-25';

update public.events
set start_time = time '14:00',
    time_confirmed = true,
    updated_at = now()
where category='sport'
  and source_ref='Athletic'
  and title='Athletic – Getafe CF'
  and event_date=date '2026-10-25';
