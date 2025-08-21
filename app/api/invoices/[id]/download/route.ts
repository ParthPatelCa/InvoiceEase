import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const { id } = await params
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

    // Fetch invoice to verify ownership and get CSV key
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('csv_object_key, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (invoiceError) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    if (!invoice.csv_object_key || invoice.status !== 'parsed') {
      return NextResponse.json(
        { error: 'CSV not available yet' },
        { status: 400 }
      )
    }

    // Generate signed download URL
    const { data: downloadData, error: downloadError } = await supabaseAdmin.storage
      .from('invoices')
      .createSignedUrl(invoice.csv_object_key, 3600) // 1 hour expiry

    if (downloadError) {
      console.error('Download URL error:', downloadError)
      return NextResponse.json(
        { error: 'Failed to generate download URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      downloadUrl: downloadData.signedUrl 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
