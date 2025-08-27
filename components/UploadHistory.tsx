'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FileText, Download, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Upload {
  id: string
  filename: string
  file_size: number
  status: 'processing' | 'completed' | 'failed'
  created_at: string
  processed_at?: string
  invoice_count?: number
  download_count?: number
  error_message?: string
}

interface UploadHistoryProps {
  refreshTrigger?: number
}

export function UploadHistory({ refreshTrigger = 0 }: UploadHistoryProps) {
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUploads = async () => {
    try {
      const { data, error } = await supabase
        .from('uploads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      setUploads(data || [])
    } catch (error) {
      console.error('Error fetching uploads:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUploads()
  }, [refreshTrigger])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDownload = async (jobId: string) => {
    try {
      const response = await fetch(`/api/download/${jobId}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Download failed')
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoices_${jobId}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      // Refresh the data to update download count
      fetchUploads()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Download failed')
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upload History</h3>
        <div className="animate-pulse">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Upload History</h3>
        <p className="mt-1 text-sm text-gray-500">
          Your recent file uploads and processing status
        </p>
      </div>

      {uploads.length === 0 ? (
        <div className="p-6 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No uploads yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Upload your first spreadsheet to get started generating invoices.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <FileText className="-ml-1 mr-2 h-4 w-4" />
              Upload Spreadsheet
            </Link>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {uploads.map((upload) => (
            <div key={upload.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {upload.filename}
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(upload.status)}`}>
                        {getStatusIcon(upload.status)}
                        <span className="ml-1 capitalize">{upload.status}</span>
                      </span>
                    </div>
                    
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <span>{formatFileSize(upload.file_size)}</span>
                      <span>•</span>
                      <span>{formatDate(upload.created_at)}</span>
                      {upload.invoice_count && (
                        <>
                          <span>•</span>
                          <span>{upload.invoice_count} invoices</span>
                        </>
                      )}
                      {upload.download_count && upload.download_count > 0 && (
                        <>
                          <span>•</span>
                          <span>{upload.download_count} download{upload.download_count !== 1 ? 's' : ''}</span>
                        </>
                      )}
                    </div>
                    
                    {upload.error_message && (
                      <p className="mt-1 text-sm text-red-600">
                        Error: {upload.error_message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {upload.status === 'processing' && (
                    <Link
                      href={`/dashboard/processing/${upload.id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Clock className="mr-1 h-3 w-3" />
                      View Status
                    </Link>
                  )}
                  
                  {upload.status === 'completed' && (
                    <>
                      <button
                        onClick={() => handleDownload(upload.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                      >
                        <Download className="mr-1 h-3 w-3" />
                        Download CSV
                      </button>
                      <Link
                        href={`/dashboard/processing/${upload.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        View Details
                      </Link>
                    </>
                  )}
                  
                  {upload.status === 'failed' && (
                    <Link
                      href={`/dashboard/processing/${upload.id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100"
                    >
                      <AlertCircle className="mr-1 h-3 w-3" />
                      View Error
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
