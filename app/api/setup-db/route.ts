import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Setup DB - Testing uploads table for user:', user.email)

    // Try to create a test upload record
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const { data: testRecord, error: insertError } = await supabase
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
      .single()

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
    await supabase.from('uploads').delete().eq('id', testId)

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
