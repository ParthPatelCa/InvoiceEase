import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    console.log('Status API - Starting authentication check...')
    
    // Try Authorization header first
    const authHeader = request.headers.get('authorization')
    console.log('Status API - Auth header present:', !!authHeader)
    
    let user = null
    
    if (authHeader) {
      // Use token from header
      const token = authHeader.replace('Bearer ', '')
      console.log('Status API - Using token authentication')
      
      const supabase = await createClient()
      const { data: { user: tokenUser }, error: authError } = await supabase.auth.getUser(token)
      
      console.log('Status API - Token auth result:', {
        hasUser: !!tokenUser,
        userEmail: tokenUser?.email,
        userId: tokenUser?.id,
        authError: authError?.message
      })

      if (authError || !tokenUser) {
        console.log('Status API - Token authentication failed:', authError?.message || 'No user')
        return NextResponse.json(
          { error: 'Unauthorized - Invalid or expired token' },
          { status: 401 }
        )
      }

      user = tokenUser
      console.log('Status API - User authenticated via token:', user.email)
      
    } else {
      // Fall back to cookie-based auth
      console.log('Status API - Trying cookie-based authentication...')
      
      const supabase = await createClient()
      const {
        data: { user: cookieUser },
        error: authError,
      } = await supabase.auth.getUser()

      console.log('Status API - Cookie auth result:', {
        hasUser: !!cookieUser,
        userEmail: cookieUser?.email,
        authError: authError?.message
      })

      if (authError || !cookieUser) {
        console.log('Status API - Cookie authentication failed:', authError?.message || 'No user')
        return NextResponse.json(
          { error: 'Unauthorized - No valid session' },
          { status: 401 }
        )
      }

      user = cookieUser
      console.log('Status API - User authenticated via cookies:', user.email)
    }

    const { jobId } = await params

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Get job status from database using service role client
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    console.log('Status API - Using service role client for database operations')
    
    const { data: upload, error: dbError } = await supabaseAdmin
      .from('uploads')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id) // Ensure user can only access their own jobs
      .maybeSingle() // Use maybeSingle instead of single to handle zero results gracefully

    console.log('Status API - Database query result:', {
      jobId,
      userId: user.id,
      hasUpload: !!upload,
      dbErrorCode: dbError?.code,
      dbErrorMessage: dbError?.message
    })

    if (dbError) {
      console.error('Status API - Database error:', {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code
      })
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      )
    }

    if (!upload) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    console.log('Status API - Job found:', upload.id, 'Status:', upload.status)

    // Return job status
    return NextResponse.json({
      jobId: upload.id,
      status: upload.status,
      filename: upload.filename,
      fileSize: upload.file_size,
      createdAt: upload.created_at,
      processedAt: upload.processed_at,
      invoiceCount: upload.invoice_count,
      errorMessage: upload.error_message,
    })

  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
