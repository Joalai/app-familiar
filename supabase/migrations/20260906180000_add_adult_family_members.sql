insert into public.family_members (name, color, sort_order, active)
values
  ('Igor', '#2563EB', 4, true),
  ('Mirari', '#EC4899', 5, true)
on conflict (name) do update set
  color = excluded.color,
  sort_order = excluded.sort_order,
  active = excluded.active;
