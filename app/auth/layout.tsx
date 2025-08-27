'use client'

import { supabaseConfig } from '@/lib/supabase'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">InvoiceEase</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Convert spreadsheets to invoices
          </p>
        </div>
        
        {/* Configuration Warning */}
        {!supabaseConfig.isConfigured && (
          <div className="p-4 rounded-md bg-yellow-50 border border-yellow-200">
            <div className="text-sm text-yellow-700">
              ⚠️ Authentication service not properly configured. 
              <a href="/debug" className="underline ml-1">Check debug page</a>
            </div>
          </div>
        )}
        
        {children}
      </div>
    </div>
  )
}
