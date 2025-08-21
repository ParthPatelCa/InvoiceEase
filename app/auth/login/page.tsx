'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (!supabase) {
      setMessage('Authentication service not available')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage(error.message)
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      setMessage('An error occurred during sign in')
    } finally {
      setLoading(false)
    }
  }

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
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

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
