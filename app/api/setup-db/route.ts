import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('Setup DB - Starting authentication check...')
    
    // Try Authorization header first
    const authHeader = request.headers.get('authorization')
    console.log('Setup DB - Auth header present:', !!authHeader)
    
    let user = null
    
    if (authHeader) {
      // Use token from header
      const token = authHeader.replace('Bearer ', '')
      console.log('Setup DB - Using token authentication')
      
      const supabase = await createClient()
      const { data: { user: tokenUser }, error: authError } = await supabase.auth.getUser(token)
      
      if (authError || !tokenUser) {
        console.log('Setup DB - Token authentication failed:', authError?.message || 'No user')
        return NextResponse.json(
          { error: 'Unauthorized - Invalid or expired token' },
          { status: 401 }
        )
      }

      user = tokenUser
      console.log('Setup DB - User authenticated via token:', user.email)
      
    } else {
      // Fall back to cookie-based auth
      console.log('Setup DB - Trying cookie-based authentication...')
      
      const supabase = await createClient()
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser()

      if (authError || !cookieUser) {
        console.log('Setup DB - Cookie authentication failed:', authError?.message || 'No user')
        return NextResponse.json(
          { error: 'Unauthorized - No valid session' },
          { status: 401 }
        )
      }

      user = cookieUser
      console.log('Setup DB - User authenticated via cookies:', user.email)
    }

    console.log('Setup DB - Testing uploads table for user:', user.email)

    // Use service role client for database operations
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

    // Try to create a test upload record
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const { data: testRecord, error: insertError } = await supabaseAdmin
      .from('uploads')
      .insert([{
        id: testId,
        user_id: user.id,
        filename: 'test.pdf',
        file_size: 1000,
        file_type: 'application/pdf',
        status: 'processing'
      }])
      .select()
      .maybeSingle() // Use maybeSingle instead of single

    if (insertError) {
      console.error('Setup DB - Insert error:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Failed to insert test record',
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint,
        sqlToRun: `
-- Run this SQL in your Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS uploads (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  status text NOT NULL DEFAULT 'processing',
  invoice_count int,
  download_count int NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  last_downloaded_at timestamptz
);

-- Enable RLS
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can insert their own uploads" ON uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own uploads" ON uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own uploads" ON uploads
  FOR UPDATE USING (auth.uid() = user_id);
        `
      })
    }

    // Clean up test record
    await supabaseAdmin.from('uploads').delete().eq('id', testId)

    return NextResponse.json({
      success: true,
      message: 'Uploads table is working correctly!',
      testRecord: testRecord,
      user: { id: user.id, email: user.email }
    })

  } catch (error) {
    console.error('Setup DB - Exception:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Exception occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
