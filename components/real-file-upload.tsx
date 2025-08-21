'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface UploadedFile {
  id: string
  invoiceId?: string
  name: string
  size: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  error?: string
}

export default function RealFileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!supabase) {
      alert('Database not configured')
      return
    }

    for (const file of acceptedFiles) {
      // Add file to state with uploading status
      const fileId = crypto.randomUUID()
      const uploadedFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        status: 'uploading',
        progress: 0
      }

      setFiles(prev => [...prev, uploadedFile])
      setIsUploading(true)

      try {
        // Get current user
        const { data: { user } } = await supabase?.auth.getUser() || { data: { user: null } }
        if (!user) {
          throw new Error('Not authenticated')
        }

        // Get upload URL
        const response = await fetch('/api/upload-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase?.auth.getSession())?.data.session?.access_token}`
          },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            userId: user.id
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to get upload URL')
        }

        const { uploadUrl, fileKey } = await response.json()

        // Upload file to storage
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type
          }
        })

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file')
        }

        // Update progress
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, progress: 100, status: 'processing' }
            : f
        ))

        // Create invoice record
        const invoiceResponse = await fetch('/api/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase?.auth.getSession())?.data.session?.access_token}`
          },
          body: JSON.stringify({
            fileKey,
            fileName: file.name,
            fileSize: file.size,
            mime: file.type
          })
        })

        if (!invoiceResponse.ok) {
          const error = await invoiceResponse.json()
          throw new Error(error.error || 'Failed to create invoice')
        }

        const { invoice } = await invoiceResponse.json()

        // Update file with invoice ID
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, invoiceId: invoice.id }
            : f
        ))

        // Poll for completion
        pollInvoiceStatus(fileId, invoice.id)

      } catch (error) {
        console.error('Upload error:', error)
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
            : f
        ))
      }
    }

    setIsUploading(false)
  }, [])

  const pollInvoiceStatus = async (fileId: string, invoiceId: string) => {
    if (!supabase) return

    const maxAttempts = 30 // 30 attempts with 2-second intervals = 1 minute max
    let attempts = 0

    const poll = async () => {
      try {
        attempts++
        
        const response = await fetch(`/api/invoices/${invoiceId}`, {
          headers: {
            'Authorization': `Bearer ${(await supabase?.auth.getSession())?.data.session?.access_token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch invoice status')
        }

        const { invoice } = await response.json()

        if (invoice.status === 'completed') {
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'completed' }
              : f
          ))
          return
        }

        if (invoice.status === 'failed') {
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'error', error: invoice.error_message || 'Processing failed' }
              : f
          ))
          return
        }

        // Continue polling if still processing and haven't exceeded max attempts
        if (attempts < maxAttempts && (invoice.status === 'queued' || invoice.status === 'processing')) {
          setTimeout(poll, 2000)
        } else if (attempts >= maxAttempts) {
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'error', error: 'Processing timeout' }
              : f
          ))
        }

      } catch (error) {
        console.error('Polling error:', error)
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'error', error: 'Failed to check status' }
            : f
        ))
      }
    }

    // Start polling after a brief delay
    setTimeout(poll, 2000)
  }

  const handleDownload = async (file: UploadedFile) => {
    if (!file.invoiceId || !supabase) return

    try {
      const response = await fetch(`/api/invoices/${file.invoiceId}/download`, {
        headers: {
          'Authorization': `Bearer ${(await supabase?.auth.getSession())?.data.session?.access_token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Download failed')
      }

      const { downloadUrl } = await response.json()

      // Trigger download
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = file.name.replace('.pdf', '.csv')
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

    } catch (error) {
      console.error('Download error:', error)
      alert('Download failed. Please try again.')
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxSize: 20 * 1024 * 1024, // 20MB
    multiple: true,
    disabled: isUploading
  })

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = (file: UploadedFile) => {
    switch (file.status) {
      case 'uploading':
        return `Uploading... ${file.progress}%`
      case 'processing':
        return 'Processing PDF...'
      case 'completed':
        return 'Ready for download'
      case 'error':
        return file.error || 'Error occurred'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {isDragActive ? 'Drop files here' : 'Drop PDF invoices here'}
        </p>
        <p className="text-sm text-gray-500">
          or click to select files • Max 20MB per file
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900">Uploaded Files</h3>
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm text-gray-600">{getStatusText(file)}</p>
                  {file.status === 'uploading' && (
                    <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                {file.status === 'completed' ? (
                  <button
                    onClick={() => handleDownload(file)}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>CSV</span>
                  </button>
                ) : (
                  getStatusIcon(file.status)
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
