# Events and Jobs

## invoice.uploaded
- Data: { invoice_id, organization_id, user_id, object_key, page_count }
- Job: parse.invoice
  - Step 1: detect digital vs scanned.
  - Step 2: extract fields and tables.
  - Step 3: write normalized rows and CSV artifact.
  - Step 4: update status and confidence.
  - Step 5: emit invoice.parsed.

## invoice.parsed
- Consumers: email notify user, analytics counters, usage updates.

## stripe.webhook events
- customer.subscription.created / updated / deleted → synchronize plan and page limits.
- invoice.paid → extend access window.
