drop policy if exists "deny direct document access" on private.family_document_access;
create policy "deny direct document access"
on private.family_document_access
as restrictive for all
using (false)
with check (false);

drop policy if exists "deny direct documents" on private.family_documents;
create policy "deny direct documents"
on private.family_documents
as restrictive for all
using (false)
with check (false);

create index if not exists family_documents_created_by_idx
on private.family_documents (created_by);

revoke execute on function public.family_document_access_status() from anon;
revoke execute on function public.family_claim_document_access(text, text) from anon;
revoke execute on function public.family_list_documents() from anon;
revoke execute on function public.family_save_document(uuid, text, text, text, date) from anon;
revoke execute on function public.family_delete_document(uuid) from anon;
