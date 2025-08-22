'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/lib/auth'
import { DashboardLayout } from '@/components/DashboardLayout'
import { InvoiceTable } from '@/components/InvoiceTable'
import { UploadButton } from '@/components/UploadButton'
import { FileText, DollarSign, Clock, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  totalInvoices: number
  completedInvoices: number
  processingInvoices: number
  failedInvoices: number
  totalAmount: number
}

export default function Dashboard() {
  const { user, loading } = useUser()
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    completedInvoices: 0,
    processingInvoices: 0,
    failedInvoices: 0,
    totalAmount: 0
  })
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const fetchStats = async () => {
    if (!user || !supabase) return

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('status, total_amount')

      if (error) throw error

      const stats = data.reduce((acc: DashboardStats, invoice: any) => {
        acc.totalInvoices++
        if (invoice.status === 'completed') {
          acc.completedInvoices++
          if (invoice.total_amount) {
            acc.totalAmount += invoice.total_amount
          }
        } else if (invoice.status === 'pending' || invoice.status === 'processing') {
          acc.processingInvoices++
        } else if (invoice.status === 'failed') {
          acc.failedInvoices++
        }
        return acc
      }, {
        totalInvoices: 0,
        completedInvoices: 0,
        processingInvoices: 0,
        failedInvoices: 0,
        totalAmount: 0
      })

      setStats(stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user, refreshTrigger])

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will be redirected by middleware
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back! Here's an overview of your invoice processing activity.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Invoices
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalInvoices}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Amount
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ${stats.totalAmount.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Processing
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.processingInvoices}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Failed
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.failedInvoices}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <UploadButton onUploadComplete={handleUploadComplete} />
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="text-sm text-gray-500">
                <p>• {stats.completedInvoices} invoices processed this month</p>
                <p>• {stats.processingInvoices} invoices currently processing</p>
                <p>• Last upload: {stats.totalInvoices > 0 ? 'Recently' : 'None yet'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Table */}
        <InvoiceTable refreshTrigger={refreshTrigger} />
      </div>
    </DashboardLayout>
  )
}
