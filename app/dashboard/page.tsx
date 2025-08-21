'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { DashboardSkeleton } from '@/components/ui/skeleton'
import { SampleInvoice } from '@/components/sample-invoice'
import { FileUpload } from '@/components/file-upload'
import { ProcessingIndicator, SuccessIndicator } from '@/components/status-indicators'

interface Invoice {
  id: string
  source_object_key: string
  status: string
  supplier_name: string | null
  invoice_number: string | null
  total_amount: number | null
  currency: string | null
  created_at: string
  csv_object_key: string | null
}

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showSample, setShowSample] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkUser()
    fetchInvoices()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    setUser(user)
  }

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching invoices:', error)
      } else {
        setInvoices(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleSampleProcess = () => {
    // Add a sample invoice to the list
    const sampleInvoice: Invoice = {
      id: 'sample-' + Date.now(),
      source_object_key: 'sample/acme-corp-invoice.pdf',
      status: 'parsed',
      supplier_name: 'ACME Corp',
      invoice_number: 'INV-2024-001',
      total_amount: 1250.00,
      currency: 'USD',
      created_at: new Date().toISOString(),
      csv_object_key: 'sample/acme-corp-invoice.csv'
    }
    
    setInvoices(prev => [sampleInvoice, ...prev])
    setShowSample(false)
  }

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    
    try {
      // Simulate file upload and processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Add the uploaded file as a new invoice
      const newInvoice: Invoice = {
        id: 'upload-' + Date.now(),
        source_object_key: `uploads/${file.name}`,
        status: 'parsing',
        supplier_name: null,
        invoice_number: null,
        total_amount: null,
        currency: null,
        created_at: new Date().toISOString(),
        csv_object_key: null
      }
      
      setInvoices(prev => [newInvoice, ...prev])
      
      // Simulate processing completion
      setTimeout(() => {
        setInvoices(prev => prev.map(inv => 
          inv.id === newInvoice.id 
            ? { ...inv, status: 'parsed', supplier_name: 'Demo Supplier', total_amount: 999.99, currency: 'USD' }
            : inv
        ))
      }, 3000)
      
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadCSV = (invoice: Invoice) => {
    // In a real app, this would download the actual CSV
    // For demo, we'll create a sample CSV
    const csvContent = `Supplier,Invoice Number,Date,Amount,Currency
${invoice.supplier_name || 'Demo Supplier'},${invoice.invoice_number || 'INV-001'},${new Date().toLocaleDateString()},${invoice.total_amount || '0.00'},${invoice.currency || 'USD'}`
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoice-${invoice.id}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'parsed':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'parsing':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sample Invoice Section */}
        {showSample && invoices.length === 0 && (
          <SampleInvoice onSampleProcess={handleSampleProcess} />
        )}

        {/* Upload Section */}
        <FileUpload onFileUpload={handleFileUpload} isUploading={isUploading} />

        {/* Invoices List */}
        <div>
          <h2 className="text-lg font-medium text-foreground mb-4">
            Recent Invoices
          </h2>

          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-foreground">
                No invoices yet
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Drop a PDF to start, or use our sample file.
              </p>
            </div>
          ) : (
            <div className="bg-background shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-border">
                {invoices.map((invoice) => (
                  <li key={invoice.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                invoice.status
                              )}`}
                            >
                              {invoice.status}
                            </span>
                            <p className="text-sm font-medium text-foreground truncate">
                              {invoice.supplier_name || 'Unknown Supplier'}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-muted-foreground space-x-4">
                            <span>
                              Invoice: {invoice.invoice_number || 'N/A'}
                            </span>
                            <span>
                              Amount: {invoice.currency} {invoice.total_amount || 'N/A'}
                            </span>
                            <span>
                              {new Date(invoice.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {invoice.status === 'parsing' && (
                            <ProcessingIndicator status={invoice.status} />
                          )}
                          {invoice.status === 'parsed' && invoice.csv_object_key && (
                            <SuccessIndicator onDownload={() => handleDownloadCSV(invoice)} />
                          )}
                          {invoice.status === 'failed' && (
                            <span className="text-red-600 text-sm">Failed to process</span>
                          )}
                          <a
                            href={`/invoices/${invoice.id}`}
                            className="text-primary hover:text-primary/80 text-sm font-medium"
                          >
                            View →
                          </a>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
