'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get('error')
    const message = searchParams.get('message')
    
    if (error === 'auth_callback_error') {
      const errorMessage = message 
        ? decodeURIComponent(message)
        : 'There was an error with email confirmation. Please try signing in.'
      setMessage(errorMessage)
    }
  }, [searchParams])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (!supabase) {
      setMessage('Authentication service not available. Please check your configuration.')
      setLoading(false)
      return
    }

    try {
      console.log('Attempting to sign in...')
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Sign in error:', error)
        setMessage(error.message)
      } else if (data.user) {
        console.log('Sign in successful, user:', data.user.email)
        
        // Get the redirect URL from search params, default to dashboard
        const redirectedFrom = searchParams.get('redirectedFrom')
        const redirectTo = redirectedFrom || '/dashboard'
        
        console.log('Redirecting to:', redirectTo)
        
        // Add a flag to indicate this is a fresh login to help middleware
        const redirectUrl = new URL(redirectTo, window.location.origin)
        redirectUrl.searchParams.set('from', 'login')
        
        console.log('Final redirect URL:', redirectUrl.toString())
        
        // Use location.href for reliable redirect
        window.location.href = redirectUrl.toString()
      } else {
        setMessage('Sign in succeeded but no user data received. Please try again.')
      }
    } catch (error) {
      console.error('Sign in exception:', error)
      setMessage('An unexpected error occurred during sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Debug info for development
  const isProduction = process.env.NODE_ENV === 'production'
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  return (
    <div className="bg-background p-8 rounded-lg border border-border shadow-sm">
      <form className="space-y-6" onSubmit={handleSignIn}>
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Sign in</h2>
          <p className="text-sm text-muted-foreground">
            Welcome back to InvoiceEase
          </p>
        </div>

        {message && (
          <div className="p-3 rounded-md text-sm bg-red-50 text-red-700 border border-red-200">
            {message}
          </div>
        )}

        {/* Debug info for development */}
        {!isProduction && !hasSupabaseConfig && (
          <div className="p-3 rounded-md text-sm bg-yellow-50 text-yellow-700 border border-yellow-200">
            ⚠️ Missing Supabase configuration. Check your environment variables.
          </div>
        )}

        {!supabase && (
          <div className="p-3 rounded-md text-sm bg-red-50 text-red-700 border border-red-200">
            ❌ Supabase client not initialized. Please check your configuration.
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !supabase}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        {/* Debug: Manual redirect button if sign in seems stuck */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              console.log('Manual redirect to dashboard')
              window.location.href = '/dashboard'
            }}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Having issues? Click here to go to dashboard
          </button>
        </div>

        <div className="text-center">
          <span className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <a href="/auth/signup" className="font-medium text-primary hover:text-primary/80">
              Sign up
            </a>
          </span>
        </div>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="bg-background p-8 rounded-lg border border-border shadow-sm">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Sign in</h2>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
