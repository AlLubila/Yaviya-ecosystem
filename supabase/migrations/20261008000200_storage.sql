-- Product photos are public; identity and delivery evidence remain private.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp']),
  ('identity-documents', 'identity-documents', false, 8388608, array['image/jpeg', 'image/png']),
  ('delivery-proofs', 'delivery-proofs', false, 8388608, array['image/jpeg', 'image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy product_images_public_download
on storage.objects for select
using (bucket_id = 'product-images');

create policy authenticated_product_image_upload
on storage.objects for insert to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'seller')
);

create policy owners_manage_product_images
on storage.objects for update to authenticated
using (bucket_id = 'product-images' and owner_id = auth.uid()::text)
with check (bucket_id = 'product-images' and owner_id = auth.uid()::text);

create policy owners_delete_product_images
on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and owner_id = auth.uid()::text);

create policy identity_owner_upload
on storage.objects for insert to authenticated
with check (bucket_id = 'identity-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy identity_owner_read
on storage.objects for select to authenticated
using (bucket_id = 'identity-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy delivery_courier_upload
on storage.objects for insert to authenticated
with check (
  bucket_id = 'delivery-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'courier')
);

-- Admin review and participant downloads use short-lived signed URLs created server-side.
