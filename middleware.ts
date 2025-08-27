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

  // Allow auth callback route to proceed without redirects
  if (req.nextUrl.pathname === '/auth/callback') {
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

  try {
    // Refresh session if expired - required for Server Components
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    const pathname = req.nextUrl.pathname
    const hasUser = !!user
    const isAuthPage = pathname.startsWith('/auth/') && pathname !== '/auth/callback'
    const isDashboardPage = pathname.startsWith('/dashboard')
    
    console.log('Middleware - Path:', pathname, 'User:', user?.email || 'none', 'Has User:', hasUser)

    // Check for fresh login redirect - if coming from login with specific parameter, always allow through
    const fromLogin = req.nextUrl.searchParams.get('from') === 'login'
    
    if (fromLogin) {
      console.log('Middleware - Fresh login detected, allowing through')
      // Remove the from parameter and allow the request
      const cleanUrl = req.nextUrl.clone()
      cleanUrl.searchParams.delete('from')
      if (cleanUrl.search !== req.nextUrl.search) {
        return NextResponse.redirect(cleanUrl)
      }
      return supabaseResponse
    }

    // Handle dashboard protection - only redirect if no user AND no recent login attempt
    if (isDashboardPage && !hasUser) {
      // Check if this is a recent redirect to prevent loops
      const redirectedFrom = req.nextUrl.searchParams.get('redirectedFrom')
      if (redirectedFrom !== pathname) {
        console.log('Middleware - Protecting dashboard, redirecting to login')
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/auth/login'
        redirectUrl.searchParams.set('redirectedFrom', pathname)
        return NextResponse.redirect(redirectUrl)
      } else {
        console.log('Middleware - Redirect loop detected, allowing through')
      }
    }

    // Handle auth page redirects - only if user exists AND not in a redirect loop
    if (isAuthPage && hasUser) {
      // Don't redirect if we just came from dashboard (prevents loops)
      const redirectedFrom = req.nextUrl.searchParams.get('redirectedFrom')
      if (!redirectedFrom) {
        console.log('Middleware - User authenticated, redirecting from auth to dashboard')
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/dashboard'
        redirectUrl.search = ''
        return NextResponse.redirect(redirectUrl)
      } else {
        console.log('Middleware - In redirect chain, allowing auth page access')
      }
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
