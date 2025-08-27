'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ProcessingStatus {
  jobId: string
  status: 'processing' | 'completed' | 'failed'
  filename: string
  fileSize: number
  createdAt: string
  processedAt?: string
  invoiceCount?: number
  errorMessage?: string
}

export default function ProcessingPage({ params }: { params: Promise<{ jobId: string }> }) {
  const [status, setStatus] = useState<ProcessingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const getJobId = async () => {
      const resolvedParams = await params
      setJobId(resolvedParams.jobId)
    }
    getJobId()
  }, [params])

  useEffect(() => {
    if (!jobId) return

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/status/${jobId}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to check status')
        }

        setStatus(result)
        setLoading(false)

        // If still processing, check again in 2 seconds
        if (result.status === 'processing') {
          setTimeout(checkStatus, 2000)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      }
    }

    checkStatus()
  }, [jobId])

  const handleDownload = async () => {
    if (!jobId) return
    
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
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Download failed')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow px-6 py-8 text-center">
            <div className="animate-spin w-12 h-12 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
            <p className="text-gray-600">Checking processing status...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow px-6 py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!status) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-6 py-8">
          {/* Status Header */}
          <div className="text-center mb-8">
            {status.status === 'processing' && (
              <>
                <div className="animate-spin w-16 h-16 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                <h1 className="text-3xl font-bold text-gray-900">Processing Your File</h1>
                <p className="mt-2 text-gray-600">
                  We're generating invoices from your spreadsheet. This usually takes a few seconds.
                </p>
              </>
            )}

            {status.status === 'completed' && (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Processing Complete!</h1>
                <p className="mt-2 text-gray-600">
                  Your invoices have been generated successfully. You can download them as a CSV file.
                </p>
              </>
            )}

            {status.status === 'failed' && (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Processing Failed</h1>
                <p className="mt-2 text-gray-600">
                  Something went wrong while processing your file. Please try uploading again.
                </p>
              </>
            )}
          </div>

          {/* File Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">File Details</h3>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Filename</dt>
                <dd className="text-sm text-gray-900">{status.filename}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">File Size</dt>
                <dd className="text-sm text-gray-900">{formatFileSize(status.fileSize)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Upload Time</dt>
                <dd className="text-sm text-gray-900">{formatDate(status.createdAt)}</dd>
              </div>
              {status.processedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Completed Time</dt>
                  <dd className="text-sm text-gray-900">{formatDate(status.processedAt)}</dd>
                </div>
              )}
              {status.invoiceCount && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Invoices Generated</dt>
                  <dd className="text-sm text-gray-900">{status.invoiceCount}</dd>
                </div>
              )}
              {status.errorMessage && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Error Message</dt>
                  <dd className="text-sm text-red-600">{status.errorMessage}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Actions */}
          <div className="flex justify-center space-x-4">
            {status.status === 'completed' && (
              <button
                onClick={handleDownload}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Download CSV Invoices
              </button>
            )}

            <Link
              href="/dashboard/upload"
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Upload Another File
            </Link>

            <Link
              href="/dashboard"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
