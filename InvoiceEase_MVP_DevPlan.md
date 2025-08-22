# InvoiceEase MVP Development Plan

A detailed step-by-step guide to build your MVP with clear component structure, props, logic, and Copilot-friendly comments.

---

## 1. Post-Signup Redirect & Dashboard

### Goal  
After email confirmation/login, route user to `/dashboard` and show user's invoices with upload/download options.

### Components & Files

/pages/dashboard.tsx # User dashboard page (protected)
/components/DashboardLayout.tsx # Page layout with sidebar and header
/components/InvoiceTable.tsx # List invoices and actions
/components/UploadButton.tsx # Upload file + trigger OCR
/components/UserHeader.tsx # User info and logout button
/lib/supabaseClient.ts # Supabase client initialization
/lib/auth.ts # Auth helpers (session check)
middleware.ts # Protect routes and redirect unauthorized users


### What to Build (Detailed)

- **middleware.ts**  
  Protect `/dashboard` route and redirect unauthenticated users to `/login`.

- **pages/dashboard.tsx**  
  Use `useUser()` to get session. Show loader if loading, redirect if no session. Render `<DashboardLayout>` wrapping `<InvoiceTable>` and `<UploadButton>`.

- **DashboardLayout.tsx**  
  Sidebar navigation (Dashboard, Profile, Billing), top bar with user avatar and logout.

- **UserHeader.tsx**  
  Display logged-in user's email/avatar and a logout button.

- **InvoiceTable.tsx**  
  Fetch invoices for logged-in user from Supabase. Show filename, upload date, status, and actions (download CSV, retry OCR).

- **UploadButton.tsx**  
  Open file picker (PDF only). Upload file to Supabase Storage. Call backend API `/api/parse-invoice` to trigger OCR. Show toast notifications for progress and errors.

### Copilot Comment Snippets

- **dashboard.tsx**

  ```tsx
  // 1. Get current user with useUser()
  // 2. If no user, redirect to /login
  // 3. Render DashboardLayout containing InvoiceTable and UploadButton

InvoiceTable.tsx

// Fetch invoices from Supabase filtered by user_id
// Display in table with columns: File Name, Date, Status, Actions (Download, Retry)


UploadButton.tsx

// Render file input (accept only PDF)
// On file select: upload to Supabase Storage
// Call /api/parse-invoice to start OCR process
// Show toast notifications for upload and parsing status


Expected Behavior

Authenticated users land on /dashboard.

See a list of their invoices with status.

Can upload new invoices, triggering parsing.

Can retry parsing or download CSV of parsed data.

Unauthenticated users redirected to /login.


2. Invoice Upload & OCR Integration
Goal

Allow users to upload invoices (PDFs), parse them via OCR API, and store structured data.

Components & Files


/pages/api/parse-invoice.ts   # API route to process uploaded invoice with OCR
/components/UploadButton.tsx  # File picker and upload UI
/lib/ocr.ts                  # OCR integration functions (calls OCR.space or Google Vision)
/lib/supabaseClient.ts        # Supabase client for storage & DB


What to Build (Detailed)

UploadButton.tsx
Same as in Dashboard.

api/parse-invoice.ts

Receive Supabase file URL in POST request.

Download the PDF file.

Send PDF to OCR service.

Parse OCR response, extract key fields (vendor, total, date, line items).

Insert parsed data + metadata into invoices table with status = parsed.

Return success/error JSON response.

lib/ocr.ts
Functions to interact with OCR API:

sendToOCR(fileBuffer): Promise<ParsedData>

Handle API keys, response parsing, errors.

Database Schema

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  parsed_data JSONB,
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMP DEFAULT now()
);


Copilot Comment Snippets

api/parse-invoice.ts

// 1. Parse request body to get file URL
// 2. Download file from Supabase Storage
// 3. Send file to OCR API (OCR.space or Google Vision)
// 4. Parse OCR response to extract invoice details
// 5. Store invoice record in Supabase DB with status 'parsed'
// 6. Return JSON with parse result or error


lib/ocr.ts

// Function: sendToOCR(buffer)
// 1. Post buffer to OCR API endpoint
// 2. Await response and extract invoice fields
// 3. Return parsed invoice data or throw error


Expected Behavior

User uploads PDF invoice via UI.

Backend API processes invoice asynchronously.

Parsed invoice data stored in DB.

Dashboard shows updated status and parsed details.

3. User Dashboard Features
Goal

Show users a comprehensive view of their invoices with actionable options.

Components & Files

/components/InvoiceTable.tsx    # List invoices with action buttons
/components/UploadButton.tsx    # Upload new invoices
/pages/dashboard.tsx            # Main page that uses above components


What to Build (Detailed)

InvoiceTable.tsx

Fetch invoices from Supabase for current user.

Display columns: File Name, Upload Date, Parsing Status.

Buttons per row:

Download CSV of parsed data.

Retry OCR parsing (calls API).

Delete invoice (optional).

Handle loading and empty states.

UploadButton.tsx

Covered previously.

Copilot Comment Snippets

InvoiceTable.tsx

// Fetch invoices for user from Supabase
// Map invoices to table rows
// For each invoice, render Download CSV and Retry buttons
// Wire up button handlers to corresponding API routes


Expected Behavior

User sees all invoices uploaded.

Can download parsed data as CSV.

Can retry OCR if parsing failed.

Clear feedback on actions.

4. Stripe Billing Integration
Goal

Enable paid plans, billing management, and enforce invoice upload limits.

Components & Files

/pages/api/create-checkout-session.ts # Create Stripe checkout session
/pages/api/webhook.ts                 # Handle Stripe webhooks
/pages/billing.tsx                   # Billing management page
/lib/stripe.ts                      # Stripe client wrapper
/lib/supabaseClient.ts              # Supabase client


What to Build (Detailed)

create-checkout-session.ts

Accept plan selection and user ID.

Create Stripe checkout session with metadata.

Return checkout URL.

webhook.ts

Verify Stripe webhook signature.

Listen for checkout.session.completed.

Update Supabase user profile with new plan.

billing.tsx

Display current plan.

Button to upgrade/downgrade.

Link to Stripe Customer Portal.

Plan Enforcement

Add invoice upload limit in user_profiles.

Check limits on upload API, reject if exceeded.

Copilot Comment Snippets

create-checkout-session.ts

// Receive user and plan info
// Create Stripe Checkout session with price_id for plan
// Return session URL for client redirection

webhook.ts

// Verify webhook signature
// On checkout.session.completed event:
// Update user's plan in Supabase


upload API

// Check user's invoice count against plan limit
// Reject upload if limit exceeded


Expected Behavior

Users can subscribe and pay.

Plans control upload limits.

Billing page shows status and upgrades.

Stripe securely handles payments.

5. Background Processing with Inngest
Goal

Run OCR parsing asynchronously after file upload.

Components & Files

/lib/inngest.ts              # Inngest client & function definition
/pages/api/parse-invoice.ts  # Trigger background job on upload


What to Build (Detailed)

On invoice upload, emit Inngest event invoice.uploaded with invoice ID and file URL.

Inngest function:

Listen for invoice.uploaded.

Download file, run OCR.

Update invoices table with parsed data and status.

Copilot Comment Snippets

Inngest function

// Listen for 'invoice.uploaded' event
// Download file from Supabase Storage
// Call OCR API and parse result
// Update invoice status and data in DB

parse-invoice API

// On upload, trigger Inngest event instead of processing inline


Expected Behavior

Invoice parsing runs in background.

UI shows processing status.

More scalable and reliable.

6. Miscellaneous

User Profile Page (/profile): Edit user details

Settings Page: Manage billing, export all invoices, delete account

Toast Notifications: Use react-hot-toast for user feedback

RLS Policies: Secure Supabase tables for user-specific access

Error Pages (404.tsx, _error.tsx): Friendly UX on broken routes

Responsive UI: Fully mobile-compatible layouts


