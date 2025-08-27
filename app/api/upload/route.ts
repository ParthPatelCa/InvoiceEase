import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
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

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type (spreadsheet formats)
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a spreadsheet (.xlsx, .xls, or .csv)' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB for MVP)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      )
    }

    // Generate unique job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Read file content for processing
    const fileBuffer = await file.arrayBuffer()
    const fileContent = Buffer.from(fileBuffer)
    
    // Store upload record in database
    const { data: uploadRecord, error: dbError } = await supabase
      .from('uploads')
      .insert([
        {
          id: jobId,
          user_id: user.id,
          filename: file.name,
          file_size: file.size,
          file_type: file.type,
          status: 'processing',
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save upload record' },
        { status: 500 }
      )
    }

    // For MVP: Mock processing (simulate delay)
    // In production, this would trigger background processing
    setTimeout(async () => {
      try {
        // Mock: Generate sample invoice data
        const mockInvoices = await generateMockInvoices(fileContent, file.name)
        
        // Update status to completed
        await supabase
          .from('uploads')
          .update({ 
            status: 'completed',
            processed_at: new Date().toISOString(),
            invoice_count: mockInvoices.length
          })
          .eq('id', jobId)

        console.log(`Mock processing completed for job ${jobId}`)
      } catch (error) {
        console.error('Mock processing error:', error)
        // Update status to failed
        await supabase
          .from('uploads')
          .update({ 
            status: 'failed',
            error_message: 'Processing failed'
          })
          .eq('id', jobId)
      }
    }, 3000) // 3 second mock processing delay

    return NextResponse.json({
      success: true,
      jobId,
      message: 'File uploaded successfully. Processing started.',
      upload: uploadRecord
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Mock function to generate sample invoice data
async function generateMockInvoices(fileContent: Buffer, filename: string) {
  // For MVP: Generate 3-5 mock invoices regardless of input
  const mockInvoices = []
  const baseDate = new Date()
  
  for (let i = 1; i <= 4; i++) {
    const invoiceDate = new Date(baseDate)
    invoiceDate.setDate(baseDate.getDate() + i)
    
    mockInvoices.push({
      invoice_number: `INV-${Date.now()}-${i.toString().padStart(3, '0')}`,
      date: invoiceDate.toISOString().split('T')[0],
      client_name: `Sample Client ${i}`,
      client_email: `client${i}@example.com`,
      description: `Mock service ${i} - Generated from ${filename}`,
      amount: (Math.random() * 1000 + 100).toFixed(2),
      currency: 'USD',
      status: 'draft'
    })
  }
  
  return mockInvoices
}
