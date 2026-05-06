-- step-images bucket: holds the screenshot for each troubleshooting step.
-- Public-read so the storefront can render images without auth; admin-write
-- so only admins can upload/replace/delete via the Troubleshooting CMS.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'step-images',
  'step-images',
  true,
  5242880, -- 5 MB cap per file
  array['image/png','image/jpeg','image/webp','image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists step_images_public_read on storage.objects;
create policy step_images_public_read on storage.objects
  for select using (bucket_id = 'step-images');

drop policy if exists step_images_admin_write on storage.objects;
create policy step_images_admin_write on storage.objects
  for insert with check (bucket_id = 'step-images' and public.is_admin());

drop policy if exists step_images_admin_update on storage.objects;
create policy step_images_admin_update on storage.objects
  for update using (bucket_id = 'step-images' and public.is_admin());

drop policy if exists step_images_admin_delete on storage.objects;
create policy step_images_admin_delete on storage.objects
  for delete using (bucket_id = 'step-images' and public.is_admin());
