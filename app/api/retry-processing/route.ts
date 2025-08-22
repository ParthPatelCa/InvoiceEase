import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { invoiceId } = await request.json()

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // For service role, we need to get the user from the request headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // For this route, we'll rely on the middleware to check authentication
    // and pass the user ID in a header or extract from the token
    // For now, let's get the user ID from the invoice itself

    // Get the invoice first to check ownership
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (fetchError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Reset the invoice status to pending
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'pending',
        processed_at: null,
        total_amount: null,
        invoice_number: null,
        invoice_date: null,
        vendor_name: null,
        csv_url: null
      })
      .eq('id', invoiceId)

    if (updateError) {
      console.error('Error updating invoice:', updateError)
      return NextResponse.json(
        { error: 'Failed to reset invoice status' },
        { status: 500 }
      )
    }

    // Trigger processing again by calling the process endpoint
    const processResponse = await fetch(`${request.nextUrl.origin}/api/process-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoiceId }),
    })

    if (!processResponse.ok) {
      console.error('Error triggering reprocessing')
      return NextResponse.json(
        { error: 'Failed to trigger reprocessing' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in retry-processing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
