import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Retry Processing - Starting authentication check...')
    
    const { invoiceId } = await request.json()

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    // Try Authorization header first
    const authHeader = request.headers.get('authorization')
    console.log('Retry Processing - Auth header present:', !!authHeader)
    
    let user = null
    
    if (authHeader) {
      // Use token from header
      const token = authHeader.replace('Bearer ', '')
      console.log('Retry Processing - Using token authentication')
      
      const supabase = await createServerClient()
      const { data: { user: tokenUser }, error: authError } = await supabase.auth.getUser(token)
      
      if (authError || !tokenUser) {
        console.log('Retry Processing - Token authentication failed:', authError?.message || 'No user')
        return NextResponse.json(
          { error: 'Unauthorized - Invalid or expired token' },
          { status: 401 }
        )
      }

      user = tokenUser
      console.log('Retry Processing - User authenticated via token:', user.email)
      
    } else {
      // Fall back to cookie-based auth
      console.log('Retry Processing - Trying cookie-based authentication...')
      
      const supabase = await createServerClient()
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser()

      if (authError || !cookieUser) {
        console.log('Retry Processing - Cookie authentication failed:', authError?.message || 'No user')
        return NextResponse.json(
          { error: 'Unauthorized - No valid session' },
          { status: 401 }
        )
      }

      user = cookieUser
      console.log('Retry Processing - User authenticated via cookies:', user.email)
    }

    // Use service role client for database operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Retry Processing - Using service role client for database operations')

    // Get the invoice first to check ownership
    const { data: invoice, error: fetchError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('user_id', user.id) // Ensure user can only access their own invoices
      .maybeSingle() // Use maybeSingle instead of single

    if (fetchError) {
      console.error('Retry Processing - Database error:', {
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
        code: fetchError.code
      })
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      )
    }

    if (!invoice) {
      console.log('Retry Processing - No invoice found for ID:', invoiceId, 'user:', user.id)
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    console.log('Retry Processing - Resetting invoice status for:', invoiceId)

    // Reset the invoice status to pending
    const { error: updateError } = await supabaseAdmin
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
      .eq('user_id', user.id) // Ensure user can only update their own invoices

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
