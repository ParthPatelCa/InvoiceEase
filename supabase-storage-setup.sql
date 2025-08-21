-- Additional Storage Configuration for Supabase
-- Run this AFTER the main supabase-setup.sql

-- ============================================================================
-- STORAGE BUCKET CONFIGURATION
-- ============================================================================

-- Create the invoices storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invoices', 
  'invoices', 
  false, 
  20971520, -- 20MB limit
  array['application/pdf', 'text/csv']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ============================================================================
-- STORAGE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
drop policy if exists "Users can upload their own files" on storage.objects;
drop policy if exists "Users can view their own files" on storage.objects;
drop policy if exists "Users can delete their own files" on storage.objects;
drop policy if exists "Service role can manage all files" on storage.objects;

-- Policy for uploading files to user's own folder
create policy "Users can upload their own files" on storage.objects
  for insert with check (
    bucket_id = 'invoices' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for viewing files in user's own folder
create policy "Users can view their own files" on storage.objects
  for select using (
    bucket_id = 'invoices' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for updating files in user's own folder
create policy "Users can update their own files" on storage.objects
  for update using (
    bucket_id = 'invoices' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for deleting files in user's own folder
create policy "Users can delete their own files" on storage.objects
  for delete using (
    bucket_id = 'invoices' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for service role to manage all files (for processing)
create policy "Service role can manage all files" on storage.objects
  for all using (
    bucket_id = 'invoices' and
    auth.jwt() ->> 'role' = 'service_role'
  );

-- ============================================================================
-- VERIFY SETUP
-- ============================================================================

-- Check that bucket was created
select 
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types
from storage.buckets 
where id = 'invoices';

-- Check that policies are in place
select 
  policyname, 
  cmd, 
  qual
from pg_policies 
where tablename = 'objects' 
and schemaname = 'storage';

-- Display setup summary
select 
  'Storage bucket "invoices" configured successfully!' as status,
  'File size limit: 20MB' as file_limit,
  'Allowed types: PDF, CSV' as mime_types,
  'RLS policies: Enabled' as security;
