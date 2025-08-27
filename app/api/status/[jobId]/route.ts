import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // Check authentication
    const supabase = createClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { jobId } = params

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Get job status from database
    const { data: upload, error: dbError } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id) // Ensure user can only access their own jobs
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (!upload) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

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
