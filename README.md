# InvoiceEase - PDF to CSV Invoice Converter

A complete MVP web application that converts PDF invoices to structured CSV files for accounting software import.

## 🚀 Features

- **Beautiful Landing Page** - Professional gradient design with clear value proposition
- **Email Authentication** - Secure signup/login with Supabase Auth
- **PDF Upload & Processing** - Drag & drop interface with real-time progress
- **OCR & Data Extraction** - Intelligent parsing of invoice fields
- **CSV Export** - Clean, standardized CSV output ready for import
- **Real-time Status Updates** - Live processing indicators and notifications
- **Responsive Design** - Works perfectly on desktop and mobile

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## 📋 Quick Setup

### 1. Clone and Install
```bash
git clone https://github.com/ParthPatelCa/InvoiceEase.git
cd InvoiceEase
npm install
```

### 2. Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL setup scripts:
   ```sql
   -- Copy and paste supabase-setup.sql in your Supabase SQL Editor
   -- Then run supabase-storage-setup.sql for storage configuration
   ```
3. Follow the detailed guide in `SUPABASE_SETUP_GUIDE.md`

### 3. Environment Variables
```bash
# Copy the example and fill in your values
cp ENV.example .env.local

# Required variables:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see your application!

## 📁 Project Structure

```
InvoiceEase/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes for invoices, upload, etc.
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   └── page.tsx           # Landing page
├── components/            # Reusable React components
│   ├── file-upload.tsx    # PDF upload interface
│   ├── sample-invoice.tsx # Demo functionality
│   └── ui/                # UI components
├── lib/                   # Utilities and configurations
│   └── supabase.ts        # Supabase client setup
├── supabase-setup.sql     # Complete database schema
└── supabase-storage-setup.sql # Storage configuration
```

## 🔧 Configuration Files

- `PRD.md` — Product requirements and MVP scope
- `ARCHITECTURE.md` — System design and tech decisions  
- `SCHEMA.sql` — Database schema for PostgreSQL
- `API_SPEC.md` — HTTP endpoints and contracts
- `DESIGN_TOKENS.json` — Design system values
- `UX_GUIDELINES.md` — Component and interaction patterns
- `SUPABASE_SETUP_GUIDE.md` — Detailed Supabase configuration
- `NEXT_STEPS.md` — 90-day development roadmap

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repo to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

The app is configured to work seamlessly with Vercel's deployment system.

## 📊 Current Status

✅ **Week 1 Complete** - MVP functionality implemented:
- Landing page with beautiful design
- User authentication and signup
- PDF upload with progress tracking
- Mock invoice processing and CSV generation
- Real-time status updates
- Download functionality
- Responsive design
- Production deployment

## 🎯 Next Steps

Refer to `NEXT_STEPS.md` for the complete 90-day roadmap including:
- Real OCR integration (Week 2-3)
- Stripe billing integration (Week 4)
- Advanced processing features (Week 5-8)
- Production optimizations (Week 9-12)

## 🔒 Security Features

- Row Level Security (RLS) enabled on all database tables
- User-scoped file storage with proper access controls
- JWT-based authentication with Supabase
- Secure file upload with signed URLs
- Environment-based configuration

## 📝 API Endpoints

- `POST /api/upload-url` - Generate signed upload URLs
- `POST /api/invoices` - Create invoice processing jobs
- `GET /api/invoices` - List user's invoices
- `GET /api/invoices/[id]` - Get invoice details
- `GET /api/invoices/[id]/download` - Download processed CSV

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- Check `SUPABASE_SETUP_GUIDE.md` for configuration help
- Review `TROUBLESHOOTING.md` for common issues
- Open an issue for bugs or feature requests

---

Built with ❤️ using Next.js 15, Supabase, and TypeScript.
