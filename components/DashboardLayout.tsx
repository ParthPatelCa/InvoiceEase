'use client'

import { ReactNode } from 'react'
import { UserHeader } from './UserHeader'
import { Home, FileText, CreditCard, Settings, Upload } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface DashboardLayoutProps {
  children: ReactNode
  user: any
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname()

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: pathname === '/dashboard'
    },
    {
      name: 'Invoices',
      href: '/dashboard/invoices',
      icon: FileText,
      current: pathname === '/dashboard/invoices'
    },
    {
      name: 'Billing',
      href: '/dashboard/billing',
      icon: CreditCard,
      current: pathname === '/dashboard/billing'
    },
    {
      name: 'Profile',
      href: '/dashboard/profile',
      icon: Settings,
      current: pathname === '/dashboard/profile'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <UserHeader user={user} />

      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200">
            <div className="flex items-center flex-shrink-0 px-4">
              <div className="flex items-center">
                <Upload className="w-8 h-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">InvoiceEase</span>
              </div>
            </div>
            
            <div className="mt-8 flex-grow flex flex-col">
              <nav className="flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        item.current
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon
                        className={`mr-3 flex-shrink-0 h-5 w-5 ${
                          item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Usage Stats */}
            <div className="flex-shrink-0 p-4 bg-gray-50 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                <p className="font-medium">This Month</p>
                <p>3 of 5 invoices processed</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <nav className="flex justify-around">
            {navigation.slice(0, 4).map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center py-2 px-3 text-xs ${
                    item.current ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="mt-1">{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}
