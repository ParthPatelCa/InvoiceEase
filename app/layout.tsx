import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'InvoiceEase - Convert PDF Invoices to CSV',
  description: 'Upload PDF invoices and download clean CSV files ready for accounting import',
  icons: {
    icon: '/favicon.svg',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="text-xl font-bold text-primary">
                  InvoiceEase
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <a 
                  href="/auth/login" 
                  className="text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  Sign In
                </a>
                <a 
                  href="/auth/signup" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
                >
                  Get Started
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="border-t border-border/40 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-sm text-muted-foreground">
              © 2025 InvoiceEase. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
