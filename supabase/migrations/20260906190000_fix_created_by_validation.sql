create or replace function public.family_normalize_created_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_by := case lower(trim(coalesce(new.created_by, '')))
    when 'igor' then 'Igor'
    when 'mirari' then 'Mirari'
    when 'joane' then 'Joane'
    when 'laia' then 'Laia'
    when 'alain' then 'Alain'
    else null
  end;
  return new;
end;
$$;

revoke all on function public.family_normalize_created_by() from public;

update public.events
set created_by = case lower(trim(created_by))
  when 'solfeo' then 'Igor'
  when 'igor' then 'Igor'
  when 'mirari' then 'Mirari'
  when 'joane' then 'Joane'
  when 'laia' then 'Laia'
  when 'alain' then 'Alain'
  else null
end
where created_by is not null;

update public.recurring_activities
set created_by = case lower(trim(created_by))
  when 'solfeo' then 'Igor'
  when 'igor' then 'Igor'
  when 'mirari' then 'Mirari'
  when 'joane' then 'Joane'
  when 'laia' then 'Laia'
  when 'alain' then 'Alain'
  else null
end
where created_by is not null;

update public.shopping_items
set created_by = case lower(trim(created_by))
  when 'solfeo' then 'Igor'
  when 'igor' then 'Igor'
  when 'mirari' then 'Mirari'
  when 'joane' then 'Joane'
  when 'laia' then 'Laia'
  when 'alain' then 'Alain'
  else null
end
where created_by is not null;

drop trigger if exists normalize_events_created_by on public.events;
create trigger normalize_events_created_by
before insert or update of created_by on public.events
for each row execute function public.family_normalize_created_by();

drop trigger if exists normalize_recurring_created_by on public.recurring_activities;
create trigger normalize_recurring_created_by
before insert or update of created_by on public.recurring_activities
for each row execute function public.family_normalize_created_by();

drop trigger if exists normalize_shopping_created_by on public.shopping_items;
create trigger normalize_shopping_created_by
before insert or update of created_by on public.shopping_items
for each row execute function public.family_normalize_created_by();

alter table public.events drop constraint if exists events_created_by_family_check;
alter table public.events add constraint events_created_by_family_check
check (created_by is null or created_by in ('Igor','Mirari','Joane','Laia','Alain'));

alter table public.recurring_activities drop constraint if exists recurring_created_by_family_check;
alter table public.recurring_activities add constraint recurring_created_by_family_check
check (created_by is null or created_by in ('Igor','Mirari','Joane','Laia','Alain'));

alter table public.shopping_items drop constraint if exists shopping_created_by_family_check;
alter table public.shopping_items add constraint shopping_created_by_family_check
check (created_by is null or created_by in ('Igor','Mirari','Joane','Laia','Alain'));
