import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    console.log('Download API - Starting authentication check...')
    
    // Try Authorization header first
    const authHeader = request.headers.get('authorization')
    console.log('Download API - Auth header present:', !!authHeader)
    
    let user = null
    
    if (authHeader) {
      // Use token from header
      const token = authHeader.replace('Bearer ', '')
      console.log('Download API - Using token authentication')
      
      const supabase = await createClient()
      const { data: { user: tokenUser }, error: authError } = await supabase.auth.getUser(token)
      
      console.log('Download API - Token auth result:', {
        hasUser: !!tokenUser,
        userEmail: tokenUser?.email,
        userId: tokenUser?.id,
        authError: authError?.message
      })

      if (authError || !tokenUser) {
        console.log('Download API - Token authentication failed:', authError?.message || 'No user')
        return NextResponse.json(
          { error: 'Unauthorized - Invalid or expired token' },
          { status: 401 }
        )
      }

      user = tokenUser
      console.log('Download API - User authenticated via token:', user.email)
      
    } else {
      // Fall back to cookie-based auth
      console.log('Download API - Trying cookie-based authentication...')
      
      const supabase = await createClient()
      const {
        data: { user: cookieUser },
        error: authError,
      } = await supabase.auth.getUser()

      console.log('Download API - Cookie auth result:', {
        hasUser: !!cookieUser,
        userEmail: cookieUser?.email,
        authError: authError?.message
      })

      if (authError || !cookieUser) {
        console.log('Download API - Cookie authentication failed:', authError?.message || 'No user')
        return NextResponse.json(
          { error: 'Unauthorized - No valid session' },
          { status: 401 }
        )
      }

      user = cookieUser
      console.log('Download API - User authenticated via cookies:', user.email)
    }

    const { jobId } = await params

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Get job from database using service role client
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
    
    console.log('Download API - Using service role client for database operations')
    
    const { data: upload, error: dbError } = await supabaseAdmin
      .from('uploads')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id) // Ensure user can only access their own jobs
      .single()

    if (dbError || !upload) {
      console.error('Download API - Database error:', {
        message: dbError?.message,
        details: dbError?.details,
        hint: dbError?.hint,
        code: dbError?.code
      })
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Check if processing is complete
    if (upload.status !== 'completed') {
      return NextResponse.json(
        { error: 'Job not completed yet. Please wait for processing to finish.' },
        { status: 400 }
      )
    }

    console.log('Download API - Generating CSV for job:', upload.id)

    // Generate mock CSV data for MVP
    const csvData = generateMockInvoiceCSV(upload.filename, upload.invoice_count || 4)
    
    // Create response with CSV file
    const response = new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="invoices_${jobId}.csv"`,
        'Cache-Control': 'no-cache',
      },
    })

    // Update download count in database
    await supabaseAdmin
      .from('uploads')
      .update({ 
        download_count: (upload.download_count || 0) + 1,
        last_downloaded_at: new Date().toISOString()
      })
      .eq('id', jobId)

    console.log('Download API - CSV download successful')
    return response

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Generate mock CSV invoice data
function generateMockInvoiceCSV(originalFilename: string, invoiceCount: number): string {
  const headers = [
    'Invoice Number',
    'Date', 
    'Client Name',
    'Client Email',
    'Description',
    'Amount',
    'Currency',
    'Status'
  ]

  const rows = [headers.join(',')]
  const baseDate = new Date()

  for (let i = 1; i <= invoiceCount; i++) {
    const invoiceDate = new Date(baseDate)
    invoiceDate.setDate(baseDate.getDate() + i)
    
    const row = [
      `"INV-${Date.now()}-${i.toString().padStart(3, '0')}"`,
      `"${invoiceDate.toISOString().split('T')[0]}"`,
      `"Sample Client ${i}"`,
      `"client${i}@example.com"`,
      `"Mock service ${i} - Generated from ${originalFilename}"`,
      `"${(Math.random() * 1000 + 100).toFixed(2)}"`,
      `"USD"`,
      `"draft"`
    ]
    
    rows.push(row.join(','))
  }

  return rows.join('\n')
}
