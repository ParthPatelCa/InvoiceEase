# Supabase Email Configuration Fix

## Issue: Email confirmation not using custom template

The email confirmation emails are not following the custom template format set in Supabase. This is likely due to one of these issues:

### 1. Check Supabase Auth Settings
In your Supabase Dashboard:

1. Go to **Authentication** → **Settings** → **Auth**
2. Verify these settings:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Additional redirect URLs**: 
     - `http://localhost:3000/auth/callback`
     - `https://your-domain.vercel.app/auth/callback`

### 2. Email Template Settings
Go to **Authentication** → **Email Templates**:

1. **Confirm signup template** should be customized
2. Make sure the template is **enabled** and **published**
3. Check that the confirmation URL uses: `{{ .ConfirmationURL }}`
4. Verify the **"From" email address** is set correctly

### 3. Common Issues:

- **Template not published**: Ensure you clicked "Save" on your custom template
- **Wrong redirect URL**: The template must use the correct callback URL
- **Site URL mismatch**: Development vs production URL confusion
- **Email provider settings**: SMTP settings not configured

### 4. Test the Fix:

1. Update Supabase settings as above
2. Clear browser cache/cookies
3. Try signing up with a new email
4. Check if the new confirmation email uses your template

If emails still use default template, the custom template may not be properly saved or published in Supabase.
