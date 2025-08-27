import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('Auth Test API - Starting...')
    
    // Check authentication
    const supabase = await createClient()
    console.log('Auth Test API - Supabase client created')
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log('Auth Test API - Auth result:', {
      hasUser: !!user,
      userEmail: user?.email,
      userId: user?.id,
      authError: authError?.message
    })

    return NextResponse.json({
      success: true,
      authenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      } : null,
      error: authError?.message || null
    })

  } catch (error) {
    console.error('Auth Test API - Exception:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Exception occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
