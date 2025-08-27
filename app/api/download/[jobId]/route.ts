import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    // Check authentication
    const supabase = await createClient()
    
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

    const { jobId } = await params

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Get job from database
    const { data: upload, error: dbError } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id) // Ensure user can only access their own jobs
      .single()

    if (dbError || !upload) {
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
    await supabase
      .from('uploads')
      .update({ 
        download_count: (upload.download_count || 0) + 1,
        last_downloaded_at: new Date().toISOString()
      })
      .eq('id', jobId)

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
