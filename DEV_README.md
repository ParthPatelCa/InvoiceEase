# InvoiceEase Development Setup

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy `.env.local` and fill in your Supabase credentials:
   ```bash
   # Get these from your Supabase project settings
   NEXT_PUBLIC_SUPABASE_URL=https://ogvvgpgxrrohsqgawpno.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ndnZncGd4cnJvaHNxZ2F3cG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTA2NjAsImV4cCI6MjA3MTM2NjY2MH0.0XSY9gfiaXcSaTDG1seL2FYnYfx2Ay75tqRq9UAj7vg
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ndnZncGd4cnJvaHNxZ2F3cG5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc5MDY2MCwiZXhwIjoyMDcxMzY2NjYwfQ.RGyoQXbOi8pNn-vHxPiUrSCRLGCR-g1WGBxQzRJq3PQ
   ```

3. **Set up database:**
   - Create a new Supabase project
   - Run the SQL from `SCHEMA.sql` in your Supabase SQL editor
   - Enable Row Level Security (RLS) on all tables
   - Set up storage bucket named "invoices"

4. **Run development server:**
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
app/
├── api/              # API routes
├── auth/             # Authentication pages
├── dashboard/        # Main dashboard
├── invoices/         # Invoice detail pages
├── globals.css       # Global styles
├── layout.tsx        # Root layout
└── page.tsx          # Landing page

lib/
└── supabase.ts       # Supabase client configuration
```

## Current Status

✅ **Completed (Week 1):**
- Next.js project setup with TypeScript and Tailwind
- Authentication flow with Supabase
- Basic UI components and landing page
- Dashboard with invoice listing
- Database schema and API routes
- File upload preparation

🚧 **Next Steps (Week 2):**
- Implement actual file upload with Supabase Storage
- Set up Inngest for background processing
- Add PDF parsing functionality
- Integrate PostHog and Sentry

## Environment Setup

You'll need to set up:

1. **Supabase Project** - Database and authentication
2. **Stripe Account** - For payments (Week 4)
3. **Inngest Account** - For background jobs (Week 2)
4. **PostHog Account** - For analytics (Week 2)
5. **Sentry Account** - For error tracking (Week 2)

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

Follow the `NEXT_STEPS.md` file for the weekly development plan.
