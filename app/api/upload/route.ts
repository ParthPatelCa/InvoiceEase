import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API - Starting authentication check...')
    
    // Check authentication
    const supabase = await createClient()
    
    console.log('Upload API - Supabase client created, getting user...')
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log('Upload API - Auth result:', {
      hasUser: !!user,
      userEmail: user?.email,
      authError: authError?.message
    })

    if (authError || !user) {
      console.log('Upload API - Authentication failed:', authError?.message || 'No user')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Upload API - User authenticated:', user.email)

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type (PDF files for invoice extraction)
    const allowedTypes = [
      'application/pdf', // .pdf
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF invoice file' },
        { status: 400 }
      )
    }

    // Validate file size (max 20MB for MVP)
    const maxSize = 20 * 1024 * 1024 // 20MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 20MB' },
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
    // In production, this would trigger OCR/AI processing of PDF
    setTimeout(async () => {
      try {
        // Mock: Extract sample data from PDF
        const mockExtractedData = await generateMockExtractedData(fileContent, file.name)
        
        // Update status to completed
        await supabase
          .from('uploads')
          .update({ 
            status: 'completed',
            processed_at: new Date().toISOString(),
            invoice_count: mockExtractedData.length
          })
          .eq('id', jobId)

        console.log(`Mock PDF extraction completed for job ${jobId}`)
      } catch (error) {
        console.error('Mock processing error:', error)
        // Update status to failed
        await supabase
          .from('uploads')
          .update({ 
            status: 'failed',
            error_message: 'PDF extraction failed'
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

// Mock function to extract sample invoice data from PDF
async function generateMockExtractedData(fileContent: Buffer, filename: string) {
  // For MVP: Generate mock extracted data regardless of input PDF
  // In production, this would use OCR/AI to extract real data
  const mockExtractedData = []
  
  // Simulate extracting 1-3 invoices from the PDF
  const invoiceCount = Math.floor(Math.random() * 3) + 1
  
  for (let i = 1; i <= invoiceCount; i++) {
    const invoiceDate = new Date()
    invoiceDate.setDate(invoiceDate.getDate() - Math.floor(Math.random() * 30))
    
    mockExtractedData.push({
      invoice_number: `INV-${2024}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
      invoice_date: invoiceDate.toISOString().split('T')[0],
      vendor_name: `Vendor Company ${i}`,
      vendor_address: `${123 + i} Business St, City, State 12345`,
      total_amount: (Math.random() * 2000 + 50).toFixed(2),
      tax_amount: (Math.random() * 200 + 5).toFixed(2),
      description: `Professional services - Extracted from ${filename}`,
      currency: 'USD',
      payment_terms: '30 days',
      extracted_from: filename
    })
  }
  
  return mockExtractedData
}
