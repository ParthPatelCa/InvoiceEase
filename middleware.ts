import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: req,
  })

  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables in middleware')
    // Allow request to continue but log error
    return supabaseResponse
  }

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

  // Allow auth callback route to proceed without redirects
  if (req.nextUrl.pathname === '/auth/callback') {
    return supabaseResponse
  }

  try {
    // Refresh session if expired - required for Server Components
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Check if accessing protected dashboard routes
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      if (!user) {
        // Redirect unauthenticated users to login
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/auth/login'
        redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }

    // Redirect to dashboard if accessing auth pages with session (except callback)
    if (req.nextUrl.pathname.startsWith('/auth/') && 
        req.nextUrl.pathname !== '/auth/callback' && 
        user) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }

  } catch (error) {
    console.error('Middleware auth error:', error)
    // On auth error, allow request to continue to avoid blocking the app
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
