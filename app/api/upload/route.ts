import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API - Starting authentication check...')
    
    // Try Authorization header first
    const authHeader = request.headers.get('authorization')
    console.log('Upload API - Auth header present:', !!authHeader)
    
    if (authHeader) {
      // Use token from header
      const token = authHeader.replace('Bearer ', '')
      console.log('Upload API - Using token authentication')
      
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      
      console.log('Upload API - Token auth result:', {
        hasUser: !!user,
        userEmail: user?.email,
        userId: user?.id,
        authError: authError?.message,
        authErrorCode: authError?.code
      })

      if (authError || !user) {
        console.log('Upload API - Token authentication failed:', {
          authError: authError?.message,
          authErrorCode: authError?.code,
          hasUser: !!user,
          tokenLength: token?.length
        })
        return NextResponse.json(
          { 
            error: 'Unauthorized - Invalid or expired token',
            details: authError?.message || 'No user found'
          },
          { status: 401 }
        )
      }

      console.log('Upload API - User authenticated via token:', user.email)
      
      // Continue with the rest of the upload logic...
      return await processUpload(request, user)
      
    } else {
      // Fall back to cookie-based auth
      console.log('Upload API - Trying cookie-based authentication...')
      
      const supabase = await createClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      console.log('Upload API - Cookie auth result:', {
        hasUser: !!user,
        userEmail: user?.email,
        authError: authError?.message
      })

      if (authError || !user) {
        console.log('Upload API - Cookie authentication failed:', authError?.message || 'No user')
        return NextResponse.json(
          { error: 'Unauthorized - No valid session' },
          { status: 401 }
        )
      }

      console.log('Upload API - User authenticated via cookies:', user.email)
      
      // Continue with the rest of the upload logic...
      return await processUpload(request, user)
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processUpload(request: NextRequest, user: any) {
  // Use service role client for database operations to bypass RLS
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
  
  console.log('Upload API - Using service role client for database operations')
  
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
  console.log('Upload API - Storing upload record for user:', user.id)
  console.log('Upload API - Upload data:', {
    id: jobId,
    user_id: user.id,
    filename: file.name,
    file_size: file.size,
    file_type: file.type,
    status: 'processing'
  })
  
  const { data: uploadRecord, error: dbError } = await supabaseAdmin
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
    console.error('Database error details:', {
      message: dbError.message,
      details: dbError.details,
      hint: dbError.hint,
      code: dbError.code
    })
    return NextResponse.json(
      { 
        error: 'Failed to save upload record',
        details: dbError.message,
        code: dbError.code
      },
      { status: 500 }
    )
  }

  console.log('Upload API - Upload record saved successfully:', uploadRecord.id)

  // For MVP: Mock processing (simulate delay)
  // In production, this would trigger OCR/AI processing of PDF
  setTimeout(async () => {
    try {
      // Create fresh service role client for the setTimeout callback
      const supabaseAdminCallback = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
      
      console.log(`Mock PDF extraction starting for job ${jobId}`)
      
      // Mock: Extract sample data from PDF
      const mockExtractedData = await generateMockExtractedData(fileContent, file.name)
      
      // Update status to completed
      const { data: updateResult, error: updateError } = await supabaseAdminCallback
        .from('uploads')
        .update({ 
          status: 'completed',
          processed_at: new Date().toISOString(),
          invoice_count: mockExtractedData.length
        })
        .eq('id', jobId)
        .select()

      if (updateError) {
        console.error(`Mock processing update error for job ${jobId}:`, updateError)
        throw updateError
      }

      console.log(`Mock PDF extraction completed for job ${jobId}`, updateResult)
    } catch (error) {
      console.error('Mock processing error:', error)
      
      // Create fresh service role client for error update
      const supabaseAdminError = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
      
      // Update status to failed
      await supabaseAdminError
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
}// Mock function to extract sample invoice data from PDF
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
