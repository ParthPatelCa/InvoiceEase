# HTTP API Spec

## POST /api/upload-url
- Auth: required
- Body: { filename, mime, size }
- Returns: { uploadUrl, objectKey }

## POST /api/invoices
- Auth: required
- Body: { objectKey, pageCount }
- Action: creates invoice row and emits invoice.uploaded, returns { invoiceId }

## GET /api/invoices/:id
- Returns invoice metadata and status.

## GET /api/invoices/:id/download
- Returns a signed URL for CSV download when ready.

## POST /api/stripe/webhook
- Stripe webhook endpoint for subscription lifecycle.

## GET /api/usage
- Returns current period usage and limits.
