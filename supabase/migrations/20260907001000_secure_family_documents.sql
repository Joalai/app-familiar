create schema if not exists private;

create table if not exists private.family_document_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  adult_name text not null unique check (adult_name in ('Igor', 'Mirari')),
  created_at timestamptz not null default now()
);

create table if not exists private.family_documents (
  id uuid primary key default extensions.uuid_generate_v4(),
  person_name text not null check (person_name in ('Igor', 'Mirari', 'Joane', 'Laia', 'Alain')),
  document_type text not null check (document_type in ('DNI', 'Pasaporte', 'Carnet de conducir')),
  document_number_encrypted bytea not null,
  expires_on date not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (person_name, document_type),
  check (document_type <> 'Carnet de conducir' or person_name in ('Igor', 'Mirari'))
);

alter table private.family_document_access enable row level security;
alter table private.family_documents enable row level security;
create policy "deny direct document access" on private.family_document_access as restrictive for all using (false) with check (false);
create policy "deny direct documents" on private.family_documents as restrictive for all using (false) with check (false);
create index if not exists family_documents_created_by_idx on private.family_documents (created_by);
revoke all on schema private from public, anon, authenticated;
revoke all on all tables in schema private from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'app_family_documents_key') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'app_family_documents_key',
      'Encryption key for App Familiar identity document numbers'
    );
  end if;
end;
$$;

create or replace function private.family_documents_key()
returns text
language sql
security definer
set search_path = private, vault, pg_catalog
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'app_family_documents_key'
  limit 1
$$;

revoke all on function private.family_documents_key() from public, anon, authenticated;

create or replace function private.family_documents_authorized()
returns boolean
language sql
security definer
stable
set search_path = private, auth, pg_catalog
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from private.family_document_access a
      where a.user_id = auth.uid()
    )
$$;

revoke all on function private.family_documents_authorized() from public, anon, authenticated;

create or replace function public.family_document_access_status()
returns jsonb
language plpgsql
security definer
set search_path = public, private, auth, pg_catalog
as $$
declare
  result_name text;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select adult_name into result_name
  from private.family_document_access
  where user_id = auth.uid();

  return jsonb_build_object(
    'authorized', result_name is not null,
    'adult_name', result_name
  );
end;
$$;

create or replace function public.family_claim_document_access(p_code text, p_adult_name text)
returns jsonb
language plpgsql
security definer
set search_path = public, private, auth, pg_catalog
as $$
declare
  current_name text;
  normalized_name text := initcap(lower(trim(coalesce(p_adult_name, ''))));
begin
  if auth.uid() is null or not exists (
    select 1 from auth.users u
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
      and coalesce(u.is_anonymous, false) = false
  ) then
    raise exception 'confirmed adult account required' using errcode = '28000';
  end if;

  if not public.family_code_ok(p_code) then
    raise exception 'invalid family code' using errcode = '28000';
  end if;

  if normalized_name not in ('Igor', 'Mirari') then
    raise exception 'only Igor or Mirari can access documents' using errcode = '22023';
  end if;

  select adult_name into current_name
  from private.family_document_access
  where user_id = auth.uid();

  if current_name is not null and current_name <> normalized_name then
    raise exception 'this account is already linked to another adult' using errcode = '23505';
  end if;

  if exists (
    select 1 from private.family_document_access
    where adult_name = normalized_name and user_id <> auth.uid()
  ) then
    raise exception 'this adult already has an account' using errcode = '23505';
  end if;

  insert into private.family_document_access (user_id, adult_name)
  values (auth.uid(), normalized_name)
  on conflict (user_id) do nothing;

  return jsonb_build_object('authorized', true, 'adult_name', normalized_name);
end;
$$;

create or replace function public.family_list_documents()
returns jsonb
language plpgsql
security definer
set search_path = public, private, extensions, pg_catalog
as $$
begin
  if not private.family_documents_authorized() then
    raise exception 'document access denied' using errcode = '28000';
  end if;

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', d.id,
        'person_name', d.person_name,
        'document_type', d.document_type,
        'document_number', extensions.pgp_sym_decrypt(d.document_number_encrypted, private.family_documents_key()),
        'expires_on', d.expires_on,
        'updated_at', d.updated_at
      ) order by d.person_name, d.document_type
    )
    from private.family_documents d
  ), '[]'::jsonb);
end;
$$;

create or replace function public.family_save_document(
  p_id uuid,
  p_person_name text,
  p_document_type text,
  p_document_number text,
  p_expires_on date
)
returns uuid
language plpgsql
security definer
set search_path = public, private, extensions, pg_catalog
as $$
declare
  result_id uuid;
  clean_person text := initcap(lower(trim(coalesce(p_person_name, ''))));
  clean_type text := case lower(trim(coalesce(p_document_type, '')))
    when 'dni' then 'DNI'
    when 'pasaporte' then 'Pasaporte'
    when 'carnet de conducir' then 'Carnet de conducir'
    else null
  end;
  clean_number text := upper(regexp_replace(trim(coalesce(p_document_number, '')), '\s+', '', 'g'));
begin
  if not private.family_documents_authorized() then
    raise exception 'document access denied' using errcode = '28000';
  end if;
  if clean_person not in ('Igor', 'Mirari', 'Joane', 'Laia', 'Alain') then
    raise exception 'invalid person' using errcode = '22023';
  end if;
  if clean_type is null then
    raise exception 'invalid document type' using errcode = '22023';
  end if;
  if clean_type = 'Carnet de conducir' and clean_person not in ('Igor', 'Mirari') then
    raise exception 'driving licence is only available for adults' using errcode = '22023';
  end if;
  if length(clean_number) < 4 or length(clean_number) > 32 then
    raise exception 'invalid document number' using errcode = '22023';
  end if;
  if p_expires_on is null then
    raise exception 'expiry date is required' using errcode = '22023';
  end if;

  if p_id is null then
    insert into private.family_documents (
      person_name, document_type, document_number_encrypted, expires_on, created_by
    ) values (
      clean_person,
      clean_type,
      extensions.pgp_sym_encrypt(clean_number, private.family_documents_key(), 'cipher-algo=aes256'),
      p_expires_on,
      auth.uid()
    )
    returning id into result_id;
  else
    update private.family_documents
    set person_name = clean_person,
        document_type = clean_type,
        document_number_encrypted = extensions.pgp_sym_encrypt(clean_number, private.family_documents_key(), 'cipher-algo=aes256'),
        expires_on = p_expires_on,
        updated_at = now()
    where id = p_id
    returning id into result_id;

    if result_id is null then
      raise exception 'document not found' using errcode = 'P0002';
    end if;
  end if;

  return result_id;
end;
$$;

create or replace function public.family_delete_document(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
begin
  if not private.family_documents_authorized() then
    raise exception 'document access denied' using errcode = '28000';
  end if;
  delete from private.family_documents where id = p_id;
end;
$$;

revoke all on function public.family_document_access_status() from public;
revoke all on function public.family_claim_document_access(text, text) from public;
revoke all on function public.family_list_documents() from public;
revoke all on function public.family_save_document(uuid, text, text, text, date) from public;
revoke all on function public.family_delete_document(uuid) from public;
revoke execute on function public.family_document_access_status() from anon;
revoke execute on function public.family_claim_document_access(text, text) from anon;
revoke execute on function public.family_list_documents() from anon;
revoke execute on function public.family_save_document(uuid, text, text, text, date) from anon;
revoke execute on function public.family_delete_document(uuid) from anon;

grant execute on function public.family_document_access_status() to authenticated;
grant execute on function public.family_claim_document_access(text, text) to authenticated;
grant execute on function public.family_list_documents() to authenticated;
grant execute on function public.family_save_document(uuid, text, text, text, date) to authenticated;
grant execute on function public.family_delete_document(uuid) to authenticated;
