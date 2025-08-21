# Architecture and Stack

## Chosen Stack
- Frontend: Next.js App Router on Vercel.
- Auth, DB, Storage: Supabase (Postgres, Row Level Security).
- Uploads: UploadThing direct to Supabase Storage or S3.
- Background jobs: Inngest for event driven parsing pipelines.
- OCR: Tabula or pdfplumber for digital PDFs, Tesseract for scans, optional AWS Textract for hard cases.
- Payments: Stripe subscriptions with metered page usage optional later.
- Analytics: PostHog.
- Errors: Sentry.
- Email: Resend transactional.

## Flow
1. User uploads PDF via signed upload endpoint to object storage.
2. App emits `invoice.uploaded` event with file key and metadata.
3. Inngest worker fetches file, detects digital vs scanned, extracts fields and lines, writes rows, and stores CSV artifact.
4. Worker updates invoice status and emits `invoice.parsed` event.
5. User downloads CSV and sees parse confidence and any warnings.
6. Stripe webhooks update subscription status and page limits.
7. PostHog captures funnels and success rates for iterations.

## Security Notes
- Enforce RLS so users only see their own rows.
- Generate signed download URLs with short expiry.
- Store only minimal PII; avoid vendor account numbers when possible.
- Hash and salt emails for analytics where feasible.
