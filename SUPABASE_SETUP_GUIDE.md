# Supabase Configuration Guide for InvoiceEase

This guide walks you through configuring Supabase for the InvoiceEase MVP after running the SQL setup.

## 1. Authentication Configuration

### Enable Email Authentication
1. Go to **Authentication** > **Settings** in your Supabase Dashboard
2. Under **Auth Providers**, ensure **Email** is enabled
3. Configure the following settings:

**Email Settings:**
```
✓ Enable email confirmations: ON (recommended for production)
✓ Confirm email: ON (prevents unverified users)
✓ Enable email change: ON
✓ Enable phone confirmations: OFF (not needed for MVP)
```

**Security Settings:**
```
✓ Site URL: https://your-vercel-domain.vercel.app
✓ Additional redirect URLs: 
  - http://localhost:3000 (for development)
  - https://your-vercel-domain.vercel.app/auth/callback
```

**Password Requirements:**
```
✓ Minimum password length: 8
✓ Require uppercase: ON
✓ Require lowercase: ON  
✓ Require numbers: ON
✓ Require special characters: OFF (for user friendliness)
```

### Email Templates (Optional)
1. Go to **Authentication** > **Email Templates**
2. Customize the email templates for:
   - Confirm signup
   - Reset password
   - Email change confirmation

## 2. Storage Configuration

### Create Invoices Bucket
1. Go to **Storage** in your Supabase Dashboard
2. Click **Create Bucket**
3. Configure:
   ```
   Bucket name: invoices
   Public bucket: OFF (private files)
   File size limit: 20971520 (20MB)
   Allowed MIME types: application/pdf,text/csv
   ```

### CORS Configuration (if needed)
If you experience CORS issues, add these origins:
```
http://localhost:3000
https://your-vercel-domain.vercel.app
```

## 3. API Configuration

### Get Your Keys
1. Go to **Settings** > **API**
2. Note these values for your environment variables:
   ```
   Project URL: https://your-project.supabase.co
   anon public key: eyJhbGci...
   service_role secret key: eyJhbGci...
   ```

### Row Level Security Check
1. Ensure **Row Level Security** is enabled
2. You should see: "Row Level Security enabled" in the API section

## 4. Environment Variables Setup

### For Local Development (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### For Vercel Production
Set these in your Vercel Dashboard > Settings > Environment Variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
```

## 5. Testing Your Setup

### Test Authentication
1. Go to your app's `/auth/signup` page
2. Create a test account
3. Check that:
   - User is created in **Authentication** > **Users**
   - Organization is auto-created in your database
   - Email confirmation works (if enabled)

### Test Storage
1. Go to your app's `/dashboard` page
2. Upload a PDF file
3. Check that:
   - File appears in **Storage** > **invoices** bucket
   - File is in a user-specific folder (uploads/user-id/...)
   - Invoice record is created in database

### Test RLS
1. Try accessing another user's data
2. Verify that RLS blocks unauthorized access
3. Check that users can only see their own invoices

## 6. Production Checklist

Before going live, ensure:
- [ ] Email confirmations are enabled
- [ ] Site URL is set to your production domain
- [ ] Storage bucket is configured with proper size limits
- [ ] RLS policies are working correctly
- [ ] Environment variables are set in Vercel
- [ ] Test user signup and file upload flow
- [ ] Monitor quota usage in Supabase Dashboard

## 7. Monitoring and Maintenance

### Regular Checks
- Monitor storage usage in **Settings** > **Usage**
- Check authentication metrics in **Authentication** > **Users**
- Review database performance in **Database** > **Logs**
- Monitor API usage and quotas

### Backup Strategy
- Enable automatic backups in **Settings** > **Database**
- Consider exporting schema changes for version control
- Monitor storage costs as file uploads increase

## 8. Troubleshooting Common Issues

### "User not authenticated" errors
- Check that JWT tokens are being passed correctly
- Verify auth headers in API calls
- Ensure RLS policies allow the operation

### Storage upload failures
- Check file size limits (20MB max)
- Verify MIME type restrictions
- Ensure storage policies allow uploads

### Database permission errors
- Review RLS policies for the affected table
- Check that user belongs to correct organization
- Verify auth.uid() is working correctly

This completes the Supabase configuration for your InvoiceEase MVP! 🚀
