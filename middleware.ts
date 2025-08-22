import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Check if accessing protected dashboard routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    // Check for auth token in cookies
    const token = req.cookies.get('supabase-auth-token')
    
    if (!token) {
      // Redirect unauthenticated users to login
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/auth/login'
      redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Redirect to dashboard if accessing auth pages with session
  if (req.nextUrl.pathname.startsWith('/auth/') && 
      req.cookies.get('supabase-auth-token')) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and API routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
