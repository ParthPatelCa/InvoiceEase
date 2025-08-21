-- Supabase Complete Setup for InvoiceEase MVP
-- Run this in your Supabase SQL editor to set up the complete schema

-- ============================================================================
-- STEP 1: DATABASE SCHEMA
-- ============================================================================

-- Organizations table
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Organization members
create table if not exists organization_members (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

-- Main invoices table
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null,
  source_object_key text not null,
  mime text not null,
  page_count int,
  status text not null default 'queued',
  currency text,
  supplier_name text,
  invoice_number text,
  invoice_date date,
  due_date date,
  subtotal numeric,
  tax_total numeric,
  total_amount numeric,
  confidence numeric,
  csv_object_key text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Invoice pages for multi-page processing
create table if not exists invoice_pages (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  page_index int not null,
  ocr_text_key text,
  tables_json_key text,
  status text not null default 'parsed'
);

-- Line items extracted from invoices
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

-- Usage tracking for billing
create table if not exists usage_counters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  pages_processed int not null default 0,
  limit_pages int not null default 5,
  created_at timestamptz not null default now(),
  unique (organization_id, period_start, period_end)
);

-- Stripe subscriptions
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

-- ============================================================================
-- STEP 2: ROW LEVEL SECURITY (RLS) SETUP
-- ============================================================================

-- Enable RLS on all tables
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table invoices enable row level security;
alter table invoice_pages enable row level security;
alter table invoice_lines enable row level security;
alter table usage_counters enable row level security;
alter table stripe_subscriptions enable row level security;

-- Organizations policies
create policy "Users can view their own organizations" on organizations
  for select using (owner_user_id = auth.uid());

create policy "Users can create organizations" on organizations
  for insert with check (owner_user_id = auth.uid());

create policy "Users can update their own organizations" on organizations
  for update using (owner_user_id = auth.uid());

create policy "Users can delete their own organizations" on organizations
  for delete using (owner_user_id = auth.uid());

-- Organization members policies
create policy "Users can view their organization memberships" on organization_members
  for select using (
    user_id = auth.uid() or 
    organization_id in (
      select id from organizations where owner_user_id = auth.uid()
    )
  );

create policy "Organization owners can manage memberships" on organization_members
  for all using (
    organization_id in (
      select id from organizations where owner_user_id = auth.uid()
    )
  );

-- Invoices policies
create policy "Users can view their own invoices" on invoices
  for select using (user_id = auth.uid());

create policy "Users can create invoices" on invoices
  for insert with check (user_id = auth.uid());

create policy "Users can update their own invoices" on invoices
  for update using (user_id = auth.uid());

create policy "Users can delete their own invoices" on invoices
  for delete using (user_id = auth.uid());

-- Invoice pages policies
create policy "Users can view their invoice pages" on invoice_pages
  for select using (
    invoice_id in (
      select id from invoices where user_id = auth.uid()
    )
  );

create policy "Users can manage their invoice pages" on invoice_pages
  for all using (
    invoice_id in (
      select id from invoices where user_id = auth.uid()
    )
  );

-- Invoice lines policies
create policy "Users can view their invoice lines" on invoice_lines
  for select using (
    invoice_id in (
      select id from invoices where user_id = auth.uid()
    )
  );

create policy "Users can manage their invoice lines" on invoice_lines
  for all using (
    invoice_id in (
      select id from invoices where user_id = auth.uid()
    )
  );

-- Usage counters policies
create policy "Users can view their usage" on usage_counters
  for select using (
    organization_id in (
      select id from organizations where owner_user_id = auth.uid()
    )
  );

create policy "System can manage usage counters" on usage_counters
  for all using (true); -- Allow service role to manage

-- Stripe subscriptions policies
create policy "Users can view their subscriptions" on stripe_subscriptions
  for select using (
    organization_id in (
      select id from organizations where owner_user_id = auth.uid()
    )
  );

create policy "System can manage subscriptions" on stripe_subscriptions
  for all using (true); -- Allow service role to manage

-- ============================================================================
-- STEP 3: FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to create organization for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.organizations (name, owner_user_id)
  values (coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)) || '''s Organization', new.id);
  
  insert into public.organization_members (organization_id, user_id, role)
  select id, new.id, 'owner'
  from public.organizations
  where owner_user_id = new.id;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create organization when user signs up
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
drop trigger if exists handle_updated_at on organizations;
create trigger handle_updated_at
  before update on organizations
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_updated_at on invoices;
create trigger handle_updated_at
  before update on invoices
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_updated_at on stripe_subscriptions;
create trigger handle_updated_at
  before update on stripe_subscriptions
  for each row execute procedure public.handle_updated_at();

-- ============================================================================
-- STEP 4: STORAGE BUCKET SETUP (Run in Supabase Dashboard > Storage)
-- ============================================================================

-- Create invoices bucket
-- NOTE: Run this in the Supabase Dashboard > Storage section or via SQL
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', false)
on conflict (id) do nothing;

-- Storage policies for invoices bucket
create policy "Users can upload their own files" on storage.objects
  for insert with check (
    bucket_id = 'invoices' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view their own files" on storage.objects
  for select using (
    bucket_id = 'invoices' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own files" on storage.objects
  for delete using (
    bucket_id = 'invoices' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- STEP 5: SAMPLE DATA FOR TESTING (Optional)
-- ============================================================================

-- Insert a sample organization and usage counter for testing
-- (This will be created automatically when users sign up via the trigger)

-- ============================================================================
-- CONFIGURATION CHECKLIST
-- ============================================================================

-- After running this SQL, also configure these in the Supabase Dashboard:

-- 1. Authentication Settings (Authentication > Settings):
--    ✓ Enable email confirmations (recommended for production)
--    ✓ Set site URL to your production domain
--    ✓ Configure email templates (optional)
--    ✓ Enable "Confirm email" if you want email verification

-- 2. Storage Settings (Storage > Settings):
--    ✓ Create 'invoices' bucket if not created above
--    ✓ Set file size limits (20MB max recommended)
--    ✓ Configure CORS if needed

-- 3. API Settings (Settings > API):
--    ✓ Note your anon key and service role key
--    ✓ Ensure RLS is enabled (should show "Row Level Security enabled")

-- 4. Environment Variables (Set in your deployment):
--    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
--    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
--    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
