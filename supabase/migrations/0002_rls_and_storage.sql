alter table public.profiles enable row level security; alter table public.noticings enable row level security; alter table public.noticing_assets enable row level security; alter table public.tags enable row level security; alter table public.noticing_tags enable row level security; alter table public.noticing_notes enable row level security; alter table public.publication_records enable row level security;

create policy profiles_select on public.profiles for select using ((select auth.uid()) = id);
create policy profiles_update on public.profiles for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy own_noticings_select on public.noticings for select using ((select auth.uid()) = user_id);
create policy own_noticings_insert on public.noticings for insert with check ((select auth.uid()) = user_id);
create policy own_noticings_update on public.noticings for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy own_noticings_delete on public.noticings for delete using ((select auth.uid()) = user_id);

create policy own_assets_all on public.noticing_assets for all using ((select auth.uid()) = user_id and exists(select 1 from public.noticings n where n.id=noticing_id and n.user_id=(select auth.uid()))) with check ((select auth.uid()) = user_id and exists(select 1 from public.noticings n where n.id=noticing_id and n.user_id=(select auth.uid())));
create policy own_tags_all on public.tags for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy own_noticing_tags_all on public.noticing_tags for all using ((select auth.uid()) = user_id and exists(select 1 from public.noticings n where n.id=noticing_id and n.user_id=(select auth.uid()))) with check ((select auth.uid()) = user_id and exists(select 1 from public.noticings n where n.id=noticing_id and n.user_id=(select auth.uid())));
create policy own_notes_all on public.noticing_notes for all using ((select auth.uid()) = user_id and exists(select 1 from public.noticings n where n.id=noticing_id and n.user_id=(select auth.uid()))) with check ((select auth.uid()) = user_id and exists(select 1 from public.noticings n where n.id=noticing_id and n.user_id=(select auth.uid())));
create policy own_publications_all on public.publication_records for all using ((select auth.uid()) = user_id and exists(select 1 from public.noticings n where n.id=noticing_id and n.user_id=(select auth.uid()))) with check ((select auth.uid()) = user_id and exists(select 1 from public.noticings n where n.id=noticing_id and n.user_id=(select auth.uid())));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('noticing-assets','noticing-assets',false,524288000,array['image/jpeg','image/png','image/webp','image/heic','image/heif','video/mp4','video/quicktime','audio/webm','audio/mp4','audio/ogg','audio/mpeg','audio/wav']) on conflict(id) do update set public=false;
create policy own_storage_select on storage.objects for select to authenticated using (bucket_id='noticing-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy own_storage_insert on storage.objects for insert to authenticated with check (bucket_id='noticing-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy own_storage_update on storage.objects for update to authenticated using (bucket_id='noticing-assets' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='noticing-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy own_storage_delete on storage.objects for delete to authenticated using (bucket_id='noticing-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
