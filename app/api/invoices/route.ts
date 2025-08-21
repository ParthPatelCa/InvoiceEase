import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from JWT token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch invoices for the user
    const { data: invoices, error } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch invoices' },
        { status: 500 }
      )
    }

    return NextResponse.json({ invoices })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from JWT token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fileKey, fileName, fileSize, mime } = body

    // Create invoice record
    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .insert({
        user_id: user.id,
        organization_id: user.id, // For now, user_id = organization_id for single user orgs
        source_object_key: fileKey,
        mime: mime,
        status: 'queued'
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create invoice record' },
        { status: 500 }
      )
    }

    // TODO: Emit invoice.uploaded event to Inngest
    // This would trigger the parsing workflow
    console.log('Invoice created:', invoice.id, 'File:', fileKey)

    // For MVP: Start processing immediately
    setTimeout(async () => {
      await processInvoice(invoice.id, fileKey)
    }, 1000)

    return NextResponse.json({ invoice })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Mock PDF processing function for MVP
async function processInvoice(invoiceId: string, fileKey: string) {
  try {
    if (!supabaseAdmin) return

    console.log('Starting processing for invoice:', invoiceId)

    // Update status to processing
    await supabaseAdmin
      .from('invoices')
      .update({ status: 'processing' })
      .eq('id', invoiceId)

    // Simulate PDF processing delay (3-5 seconds)
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000))

    // Mock extracted data (in real implementation, this would come from OCR/AI)
    const extractedData = {
      supplier_name: 'ABC Supply Company',
      invoice_number: `INV-2025-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      invoice_date: '2025-01-15',
      due_date: '2025-02-14',
      currency: 'USD',
      subtotal: Math.round((800 + Math.random() * 500) * 100) / 100,
      tax_total: Math.round((64 + Math.random() * 40) * 100) / 100,
      total_amount: 0,
      confidence: Math.round((0.85 + Math.random() * 0.1) * 100) / 100
    }

    // Calculate total
    extractedData.total_amount = Math.round((extractedData.subtotal + extractedData.tax_total) * 100) / 100

    // Generate CSV content
    const csvContent = generateCSV(extractedData, invoiceId)
    const csvKey = `csv/${invoiceId}.csv`

    // Upload CSV to storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('invoices')
      .upload(csvKey, csvContent, {
        contentType: 'text/csv',
        upsert: true
      })

    if (uploadError) {
      throw new Error(`CSV upload failed: ${uploadError.message}`)
    }

    // Update invoice with extracted data and CSV location
    await supabaseAdmin
      .from('invoices')
      .update({
        ...extractedData,
        csv_object_key: csvKey,
        status: 'completed'
      })
      .eq('id', invoiceId)

    console.log('Processing completed for invoice:', invoiceId)

  } catch (error) {
    console.error('Invoice processing error:', error)
    
    // Update status to failed
    await supabaseAdmin
      ?.from('invoices')
      .update({ 
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Processing failed'
      })
      .eq('id', invoiceId)
  }
}

function generateCSV(data: any, invoiceId: string): string {
  const headers = [
    'Invoice ID',
    'Supplier Name',
    'Invoice Number',
    'Invoice Date',
    'Due Date',
    'Currency',
    'Subtotal',
    'Tax Total',
    'Total Amount',
    'Confidence Score'
  ]

  const row = [
    invoiceId,
    data.supplier_name || '',
    data.invoice_number || '',
    data.invoice_date || '',
    data.due_date || '',
    data.currency || '',
    data.subtotal || '',
    data.tax_total || '',
    data.total_amount || '',
    data.confidence || ''
  ]

  return [headers.join(','), row.join(',')].join('\n')
}
