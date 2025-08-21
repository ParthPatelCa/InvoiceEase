'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (!supabase) {
      setMessage('Authentication service not available')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Check your email for the confirmation link!')
      }
    } catch (error) {
      setMessage('An error occurred during sign up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background p-8 rounded-lg border border-border shadow-sm">
      <form className="space-y-6" onSubmit={handleSignUp}>
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Create account</h2>
          <p className="text-sm text-muted-foreground">
            Start converting invoices for free
          </p>
        </div>

        {message && (
          <div className={`p-3 rounded-md text-sm ${
            message.includes('Check your email') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
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
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <div className="text-center">
          <span className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <a href="/auth/login" className="font-medium text-primary hover:text-primary/80">
              Sign in
            </a>
          </span>
        </div>
      </form>
    </div>
  )
}
