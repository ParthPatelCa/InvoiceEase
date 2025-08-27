'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/lib/auth'
import { DashboardLayout } from '@/components/DashboardLayout'
import { UploadHistory } from '@/components/UploadHistory'
import { FileText, Upload, Clock, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface DashboardStats {
  totalUploads: number
  completedUploads: number
  processingUploads: number
  failedUploads: number
  totalInvoices: number
}

export default function Dashboard() {
  const { user, loading } = useUser()
  const [stats, setStats] = useState<DashboardStats>({
    totalUploads: 0,
    completedUploads: 0,
    processingUploads: 0,
    failedUploads: 0,
    totalInvoices: 0
  })
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const fetchStats = async () => {
    if (!user || !supabase) return

    try {
      const { data, error } = await supabase
        .from('uploads')
        .select('status, invoice_count')

      if (error) throw error

      const stats = data.reduce((acc: DashboardStats, upload: any) => {
        acc.totalUploads++
        if (upload.status === 'completed') {
          acc.completedUploads++
          if (upload.invoice_count) {
            acc.totalInvoices += upload.invoice_count
          }
        } else if (upload.status === 'processing') {
          acc.processingUploads++
        } else if (upload.status === 'failed') {
          acc.failedUploads++
        }
        return acc
      }, {
        totalUploads: 0,
        completedUploads: 0,
        processingUploads: 0,
        failedUploads: 0,
        totalInvoices: 0
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

  // Client-side redirect when not loading and no user
  useEffect(() => {
    if (!loading && !user) {
      console.log('Dashboard - No user found, redirecting to login')
      window.location.href = '/auth/login'
    }
  }, [loading, user])

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Show loading while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show loading while redirecting to login
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
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
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Invoice PDF
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Upload className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Uploads
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalUploads}
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
                  <FileText className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Data Entries Extracted
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
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Processing
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.processingUploads}
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
                      {stats.failedUploads}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/dashboard/upload"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center">
                <Upload className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-900">Upload Invoice PDF</h4>
                  <p className="text-sm text-gray-500">Upload a PDF invoice to extract data</p>
                </div>
              </div>
            </Link>
            
            <div className="p-4 border border-gray-200 rounded-lg opacity-50">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-gray-400 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-500">View Templates</h4>
                  <p className="text-sm text-gray-400">Coming soon - Invoice templates</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg opacity-50">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-gray-400 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-500">Schedule Processing</h4>
                  <p className="text-sm text-gray-400">Coming soon - Automated processing</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload History */}
        <UploadHistory refreshTrigger={refreshTrigger} />
      </div>
    </DashboardLayout>
  )
}
