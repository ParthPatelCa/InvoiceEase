import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileName, fileSize, fileType, userId } = body

    // Validate file type
    if (!fileType.includes('pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (20MB limit)
    if (fileSize > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 20MB limit' },
        { status: 400 }
      )
    }

    // Generate a unique file key
    const fileKey = `uploads/${userId}/${Date.now()}-${fileName}`

    // Create signed upload URL for Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('invoices')
      .createSignedUploadUrl(fileKey)

    if (uploadError) {
      console.error('Upload URL error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to create upload URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      uploadUrl: uploadData.signedUrl,
      fileKey: fileKey
    })

  } catch (error) {
    console.error('Upload URL generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
