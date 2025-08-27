import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: Boolean(supabaseUrl),
    hasKey: Boolean(supabaseAnonKey)
  })
}

// Client-side Supabase client with proper auth settings
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Add production-specific settings
        storageKey: 'invoiceease-auth',
        flowType: 'pkce'
      }
    })
  : null

// Server-side Supabase client for admin operations
export const supabaseAdmin = supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null

// Export configuration for debugging
export const supabaseConfig = {
  url: supabaseUrl,
  hasAnonKey: Boolean(supabaseAnonKey),
  hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  isConfigured: Boolean(supabase)
}
