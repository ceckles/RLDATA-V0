-- Create storage bucket for firearm images
insert into storage.buckets (id, name, public)
values ('firearm-images', 'firearm-images', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload their own firearm images
create policy "Users can upload firearm images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'firearm-images' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view all firearm images (public bucket)
create policy "Anyone can view firearm images"
on storage.objects for select
to public
using (bucket_id = 'firearm-images');

-- Allow users to delete their own firearm images
create policy "Users can delete own firearm images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'firearm-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own firearm images
create policy "Users can update own firearm images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'firearm-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
