-- Supabase Postgres schema for InvoiceEase

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists organization_members (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

-- InvoiceEase Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create uploads table for tracking PDF processing jobs
CREATE TABLE IF NOT EXISTS uploads (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  status text NOT NULL DEFAULT 'processing',
  invoice_count int,
  download_count int NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  last_downloaded_at timestamptz,
  -- New fields for real PDF extraction
  extracted_data jsonb, -- Store the raw extracted invoice data as JSON
  csv_data text -- Store the generated CSV data
);

-- Enable RLS
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can insert their own uploads" ON uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own uploads" ON uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own uploads" ON uploads
  FOR UPDATE USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_status ON uploads(status);
CREATE INDEX IF NOT EXISTS idx_uploads_created_at ON uploads(created_at DESC);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null,
  source_object_key text not null, -- storage key to uploaded PDF
  mime text not null,
  page_count int,
  status text not null default 'queued', -- queued | parsing | parsed | failed
  currency text,
  supplier_name text,
  invoice_number text,
  invoice_date date,
  due_date date,
  subtotal numeric,
  tax_total numeric,
  total_amount numeric,
  confidence numeric, -- 0..1 aggregate confidence
  csv_object_key text, -- storage key to CSV result
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists invoice_pages (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  page_index int not null,
  ocr_text_key text,       -- storage key for raw OCR text
  tables_json_key text,    -- storage key for extracted tables JSON
  status text not null default 'parsed'
);

create table if not exists invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  line_index int not null,
  description text,
  quantity numeric,
  unit_price numeric,
  tax_amount numeric,
  line_total numeric
);

create table if not exists usage_counters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  pages_processed int not null default 0,
  limit_pages int not null default 150,
  created_at timestamptz not null default now(),
  unique (organization_id, period_start, period_end)
);

create table if not exists stripe_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  stripe_subscription_id text not null,
  plan_code text not null,
  status text not null,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
