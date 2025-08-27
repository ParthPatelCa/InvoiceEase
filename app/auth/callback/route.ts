import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=auth_callback_error&message=${encodeURIComponent(error.message)}`)
      }

      // Successful authentication - redirect to dashboard
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
      
    } catch (error) {
      console.error('Auth callback exception:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=auth_callback_error&message=${encodeURIComponent('Authentication failed')}`)
    }
  }

  // No code parameter - redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=auth_callback_error&message=${encodeURIComponent('No authentication code provided')}`)
}
