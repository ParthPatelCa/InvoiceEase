import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  console.log('Middleware - Processing:', req.nextUrl.pathname)
  
  // Create response with cookie handling for auth
  let supabaseResponse = NextResponse.next({
    request: req,
  })

  // Only handle cookie management for authentication, no redirects
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request: req,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Just refresh the session to maintain cookies, no redirects
    try {
      await supabase.auth.getUser()
      console.log('Middleware - Session refreshed for:', req.nextUrl.pathname)
    } catch (error) {
      console.log('Middleware - Session refresh error:', error)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and API routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
