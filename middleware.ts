import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // TEMPORARILY DISABLE ALL MIDDLEWARE LOGIC FOR DEBUGGING
  console.log('Middleware - DISABLED - Path:', req.nextUrl.pathname)
  
  // Allow all requests through without any redirects
  return NextResponse.next({
    request: req,
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and API routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
