'use client'

import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'

// Hook to get current user session
export const useUser = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      if (!supabase) {
        console.log('useUser - No supabase client available')
        setLoading(false)
        return
      }

      try {
        console.log('useUser - Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('useUser - Session error:', error)
        }
        
        const currentUser = session?.user ?? null
        console.log('useUser - Initial session user:', currentUser?.email || 'none')
        
        setUser(currentUser)
        setLoading(false)
      } catch (error) {
        console.error('useUser - Exception getting session:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('useUser - Auth state change:', event, session?.user?.email || 'none')
          setUser(session?.user ?? null)
          setLoading(false)
        }
      )

      return () => subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}

// Function to check if user is authenticated
export const checkAuth = async (): Promise<{ user: User | null; session: any }> => {
  if (!supabase) {
    return { user: null, session: null }
  }

  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Auth check error:', error)
    return { user: null, session: null }
  }

  return { user: session?.user ?? null, session }
}

// Function to sign out user
export const signOut = async () => {
  if (!supabase) return

  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

// Function to get current user profile
export const getCurrentUser = async () => {
  if (!supabase) return null

  const { data: { user } } = await supabase.auth.getUser()
  return user
}
