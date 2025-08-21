export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="relative px-4 pt-20 pb-16 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Convert invoice PDFs to clean CSV{' '}
            <span className="text-primary">in seconds</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
            Stop retyping bills. Upload, convert, and download ready to import.
            Works with digital and scanned invoices.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="/auth/signup"
              className="rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Try free — 5 pages monthly
            </a>
            <a
              href="#demo"
              className="text-base font-semibold leading-6 text-muted-foreground hover:text-primary"
            >
              See sample result <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Why choose InvoiceEase?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Accurate fields and item lines
              </h3>
              <p className="text-muted-foreground">
                Extract supplier name, invoice number, dates, amounts, and line items with high accuracy.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Works with digital and scanned invoices
              </h3>
              <p className="text-muted-foreground">
                Advanced OCR technology handles both digital PDFs and scanned documents seamlessly.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Simple pricing and transparent limits
              </h3>
              <p className="text-muted-foreground">
                Start free with 5 pages per month. Clear pricing with no hidden fees or surprises.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to streamline your invoice processing?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join hundreds of businesses saving hours every month.
          </p>
          <a
            href="/auth/signup"
            className="rounded-md bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Get started for free
          </a>
        </div>
      </section>
    </div>
  )
}
