interface ProcessingIndicatorProps {
  status: string
}

export function ProcessingIndicator({ status }: ProcessingIndicatorProps) {
  if (status !== 'parsing') return null

  return (
    <div className="flex items-center space-x-2 text-yellow-600">
      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span className="text-sm">Processing...</span>
    </div>
  )
}

interface SuccessIndicatorProps {
  onDownload: () => void
}

export function SuccessIndicator({ onDownload }: SuccessIndicatorProps) {
  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center text-green-600 space-x-1">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm">Complete</span>
      </div>
      <button 
        onClick={onDownload}
        className="inline-flex items-center px-3 py-1.5 border border-green-600 text-sm font-medium rounded text-green-600 hover:bg-green-50 transition-colors"
      >
        Download CSV
      </button>
    </div>
  )
}
