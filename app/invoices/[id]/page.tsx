'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Invoice {
  id: string
  source_object_key: string
  status: string
  supplier_name: string | null
  invoice_number: string | null
  invoice_date: string | null
  due_date: string | null
  currency: string | null
  subtotal: number | null
  tax_total: number | null
  total_amount: number | null
  confidence: number | null
  csv_object_key: string | null
  error_message: string | null
  created_at: string
  invoice_lines: Array<{
    id: string
    description: string | null
    quantity: number | null
    unit_price: number | null
    line_total: number | null
  }>
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params
      setInvoiceId(id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice()
    }
  }, [invoiceId])

  const fetchInvoice = async () => {
    if (!invoiceId || !supabase) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_lines (*)
        `)
        .eq('id', invoiceId)
        .single()

      if (error) {
        console.error('Error fetching invoice:', error)
        router.push('/dashboard')
      } else {
        setInvoice(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!invoice?.csv_object_key || !invoiceId || !supabase) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/invoices/${invoiceId}/download`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const { downloadUrl } = await response.json()
        window.open(downloadUrl, '_blank')
      }
    } catch (error) {
      console.error('Download error:', error)
    }
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Invoice not found</h2>
          <a href="/dashboard" className="mt-4 text-primary hover:text-primary/80">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <a href="/dashboard" className="text-primary hover:text-primary/80">
                ← Dashboard
              </a>
              <h1 className="text-2xl font-bold text-foreground">
                Invoice Details
              </h1>
            </div>
            {invoice.csv_object_key && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-4 py-2 border border-primary text-sm font-medium rounded-md text-primary hover:bg-primary/10"
              >
                Download CSV
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status and Basic Info */}
        <div className="bg-background border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                invoice.status
              )}`}
            >
              {invoice.status}
            </span>
            {invoice.confidence && (
              <span className="text-sm text-muted-foreground">
                Confidence: {Math.round(invoice.confidence * 100)}%
              </span>
            )}
          </div>

          {invoice.error_message && (
            <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 border border-red-200">
              {invoice.error_message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-3">
                Invoice Information
              </h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Supplier</dt>
                  <dd className="text-sm text-foreground">
                    {invoice.supplier_name || 'Not detected'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Invoice Number</dt>
                  <dd className="text-sm text-foreground">
                    {invoice.invoice_number || 'Not detected'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Invoice Date</dt>
                  <dd className="text-sm text-foreground">
                    {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : 'Not detected'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Due Date</dt>
                  <dd className="text-sm text-foreground">
                    {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Not detected'}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-medium text-foreground mb-3">
                Financial Summary
              </h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Currency</dt>
                  <dd className="text-sm text-foreground">
                    {invoice.currency || 'Not detected'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Subtotal</dt>
                  <dd className="text-sm text-foreground">
                    {invoice.subtotal ? `${invoice.currency || ''} ${invoice.subtotal}` : 'Not detected'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Tax</dt>
                  <dd className="text-sm text-foreground">
                    {invoice.tax_total ? `${invoice.currency || ''} ${invoice.tax_total}` : 'Not detected'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Total Amount</dt>
                  <dd className="text-lg font-semibold text-foreground">
                    {invoice.total_amount ? `${invoice.currency || ''} ${invoice.total_amount}` : 'Not detected'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Line Items */}
        {invoice.invoice_lines && invoice.invoice_lines.length > 0 && (
          <div className="bg-background border border-border rounded-lg p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">
              Line Items
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Line Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoice.invoice_lines.map((line) => (
                    <tr key={line.id}>
                      <td className="px-4 py-2 text-sm text-foreground">
                        {line.description || 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-sm text-foreground">
                        {line.quantity || 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-sm text-foreground">
                        {line.unit_price ? `${invoice.currency || ''} ${line.unit_price}` : 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-sm text-foreground">
                        {line.line_total ? `${invoice.currency || ''} ${line.line_total}` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
