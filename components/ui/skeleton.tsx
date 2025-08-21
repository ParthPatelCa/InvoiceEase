export function InvoiceCardSkeleton() {
  return (
    <li>
      <div className="px-4 py-4 sm:px-6 hover:bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-5 bg-muted animate-pulse rounded-full"></div>
              <div className="w-32 h-4 bg-muted animate-pulse rounded"></div>
            </div>
            <div className="mt-2 flex items-center text-sm text-muted-foreground space-x-4">
              <div className="w-24 h-3 bg-muted animate-pulse rounded"></div>
              <div className="w-20 h-3 bg-muted animate-pulse rounded"></div>
              <div className="w-16 h-3 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-24 h-8 bg-muted animate-pulse rounded"></div>
            <div className="w-12 h-4 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    </li>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="w-24 h-8 bg-muted animate-pulse rounded"></div>
            <div className="flex items-center space-x-4">
              <div className="w-32 h-4 bg-muted animate-pulse rounded"></div>
              <div className="w-16 h-4 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section Skeleton */}
        <div className="mb-8">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <div className="w-12 h-12 bg-muted animate-pulse rounded mx-auto mb-4"></div>
            <div className="w-48 h-6 bg-muted animate-pulse rounded mx-auto mb-2"></div>
            <div className="w-64 h-4 bg-muted animate-pulse rounded mx-auto mb-4"></div>
            <div className="w-24 h-10 bg-muted animate-pulse rounded mx-auto"></div>
          </div>
        </div>

        {/* Invoices List Skeleton */}
        <div>
          <div className="w-32 h-6 bg-muted animate-pulse rounded mb-4"></div>
          <div className="bg-background shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-border">
              {[...Array(3)].map((_, i) => (
                <InvoiceCardSkeleton key={i} />
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <div className="mt-2 w-20 h-4 bg-muted animate-pulse rounded mx-auto"></div>
      </div>
    </div>
  )
}
