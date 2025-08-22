'use client'

import { useState } from 'react'
import { User, LogOut, Settings } from 'lucide-react'
import { signOut } from '@/lib/auth'

interface UserHeaderProps {
  user: {
    email?: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export function UserHeader({ user }: UserHeaderProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Handle user logout
  const handleLogout = async () => {
    try {
      setIsLoading(true)
      await signOut()
      alert('Logged out successfully')
      // Redirect handled by middleware
    } catch (error) {
      console.error('Logout error:', error)
      alert('Failed to log out')
    } finally {
      setIsLoading(false)
    }
  }

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const avatarUrl = user.user_metadata?.avatar_url

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      {/* User Info */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-blue-600" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{displayName}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <button
          className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          onClick={() => alert('Settings coming soon!')}
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Settings</span>
        </button>
        
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">
            {isLoading ? 'Logging out...' : 'Logout'}
          </span>
        </button>
      </div>
    </div>
  )
}
