-- MVP Phase 1: Upload tracking table setup

-- Create uploads table for tracking spreadsheet processing
create table if not exists uploads (
  id text primary key, -- job_timestamp_random format
  user_id uuid not null,
  filename text not null,
  file_size bigint not null,
  file_type text not null,
  status text not null default 'processing', -- processing | completed | failed
  invoice_count int,
  download_count int not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  last_downloaded_at timestamptz
);

-- Add Row Level Security (RLS)
alter table uploads enable row level security;

-- Policy: Users can only access their own uploads
create policy "Users can only access their own uploads" on uploads
  for all using (auth.uid() = user_id);

-- Grant permissions
grant usage on schema public to anon, authenticated;
grant all on uploads to anon, authenticated;

-- Create index for performance
create index if not exists uploads_user_id_created_at_idx 
  on uploads (user_id, created_at desc);

create index if not exists uploads_status_idx 
  on uploads (status);
