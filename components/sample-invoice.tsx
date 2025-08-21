'use client'

import { useState } from 'react'

interface SampleInvoiceProps {
  onSampleProcess: () => void
}

export function SampleInvoice({ onSampleProcess }: SampleInvoiceProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleTrySample = async () => {
    setIsProcessing(true)
    
    // Simulate processing a sample invoice
    try {
      await new Promise(resolve => setTimeout(resolve, 3000)) // 3 second demo
      onSampleProcess()
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Try InvoiceEase with a sample invoice
          </h3>
          <p className="text-blue-700 mb-4">
            See how our PDF to CSV conversion works with a real example. We&apos;ll process a sample invoice and show you the extracted data.
          </p>
          <button
            onClick={handleTrySample}
            disabled={isProcessing}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing sample...
              </>
            ) : (
              'Try sample invoice'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
