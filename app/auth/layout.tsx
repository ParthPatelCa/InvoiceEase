import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
            Convert PDF invoices to CSV
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
