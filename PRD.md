# Product Requirements Document — InvoiceEase

## Objective
Ship a simple, reliable web app that converts PDF invoices into normalized CSV ready for accounting import. Optimize for speed to value, low friction, and predictable pricing.

## Customer
- Primary: freelancers and small businesses processing vendor invoices monthly.
- Secondary: bookkeeping firms needing bulk conversion and audit trail.

## Value Proposition
Upload invoices as PDFs and download clean CSV in seconds, with consistent columns and optional item lines, without manual retyping.

## Success Metrics
- Time to first conversion under 60 seconds.
- >90 percent successful parse rate on supported formats.
- Trial to paid conversion over 7 percent in 60 days.
- Net revenue retention over 95 percent after month three.

## Scope v1 (MVP)
- Email signup and login.
- Upload single PDF up to 20 pages.
- Auto detect digital text vs scanned.
- Extract supplier name, invoice number, invoice date, due date, currency, subtotal, tax, total, and basic line items when obvious.
- Generate CSV with a fixed schema.
- Show job status and allow download for seven days.
- Free tier with five pages per month.
- Single paid plan with page limit bump.
- Stripe checkout and customer portal.
- Basic product analytics and error tracking.

## Out of Scope v1
- Full vendor specific templates for every bank or ERP.
- Bulk multi file drag and drop.
- API for programmatic ingestion.
- Accounting integrations.
- Team seats and permissions.

## Risks and Mitigations
- OCR accuracy varies on scanned bills. Use a fallback to AWS Textract when Tesseract confidence drops.
- Users upload confidential data. Store encrypted at rest and scrub logs.
- Chargebacks from early adopters. Keep transparent limits and visible pricing.
