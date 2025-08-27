import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if uploads table exists and get its structure
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'uploads')

    console.log('DB Check - Tables query result:', { tables, tablesError })

    // Try to query uploads table directly
    const { data: uploads, error: uploadsError } = await supabase
      .from('uploads')
      .select('*')
      .limit(1)

    console.log('DB Check - Uploads query result:', { uploads, uploadsError })

    // Get current user for testing
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    return NextResponse.json({
      success: true,
      tableExists: !tablesError && tables && tables.length > 0,
      canQueryUploads: !uploadsError,
      sampleUpload: uploads?.[0] || null,
      currentUser: user ? { id: user.id, email: user.email } : null,
      errors: {
        tablesError: tablesError?.message,
        uploadsError: uploadsError?.message,
        authError: authError?.message
      }
    })

  } catch (error) {
    console.error('DB Check - Exception:', error)
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
