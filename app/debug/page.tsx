'use client'

import { useEffect, useState } from 'react'
import { supabase, supabaseConfig } from '@/lib/supabase'

export default function DebugPage() {
  const [authState, setAuthState] = useState<any>(null)
  const [sessionInfo, setSessionInfo] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        setAuthState({ error: 'Supabase client not initialized' })
        return
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        setSessionInfo({ session, error })
        
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        setAuthState({ user, error: userError })
      } catch (error) {
        setAuthState({ error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }

    checkAuth()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Debug Information</h1>
          
          <div className="space-y-6">
            {/* Environment Variables */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Environment Configuration</h2>
              <div className="bg-gray-50 rounded p-4">
                <pre className="text-sm">
{JSON.stringify({
  NODE_ENV: process.env.NODE_ENV,
  hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  hasSupabaseKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
  supabaseConfig: supabaseConfig
}, null, 2)}
                </pre>
              </div>
            </div>

            {/* Supabase Client Status */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Supabase Client Status</h2>
              <div className="bg-gray-50 rounded p-4">
                <pre className="text-sm">
{JSON.stringify({
  clientInitialized: Boolean(supabase),
  clientConfig: supabase ? 'Available' : 'Not Available'
}, null, 2)}
                </pre>
              </div>
            </div>

            {/* Session Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Session Information</h2>
              <div className="bg-gray-50 rounded p-4">
                <pre className="text-sm">
{JSON.stringify(sessionInfo, null, 2)}
                </pre>
              </div>
            </div>

            {/* Auth State */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Auth State</h2>
              <div className="bg-gray-50 rounded p-4">
                <pre className="text-sm">
{JSON.stringify(authState, null, 2)}
                </pre>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
              <div className="space-x-4">
                <a 
                  href="/auth/login" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Go to Login
                </a>
                <a 
                  href="/dashboard" 
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Go to Dashboard
                </a>
                <button 
                  onClick={() => window.location.reload()} 
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
