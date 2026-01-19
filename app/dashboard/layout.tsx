'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
    // Fetch user info (you can create an API endpoint for this)
    // For now, we'll just check if token exists
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/rooms', label: 'Rooms', icon: '🏨' },
    { href: '/dashboard/bookings', label: 'Bookings', icon: '📋' },
    { href: '/dashboard/food', label: 'Food Items', icon: '🍽️' },
    { href: '/dashboard/checkout', label: 'Checkout', icon: '✅' },
    { href: '/dashboard/payments', label: 'Payments', icon: '💳' },
    { href: '/dashboard/tours', label: 'Tours & Travel', icon: '🚌' },
    { href: '/dashboard/reports', label: 'Reports', icon: '📈' },
    { href: '/dashboard/bills/generate', label: 'Generate Bill', icon: '🧾' },
    { href: '/dashboard/bills/history', label: 'Bill History', icon: '📜' },
    { href: '/dashboard/kitchen-bills', label: 'Kitchen Bills', icon: '🍳' },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
    { href: '/dashboard/settings/password', label: 'Reset Password', icon: '🔒' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg flex flex-col">
        {/* Header - Fixed at top */}
        <div className="p-6 border-b shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Hotel Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manager Dashboard</p>
        </div>
        
        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        
        {/* Logout Button - Fixed at bottom */}
        <div className="p-4 border-t shrink-0 bg-white">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        <header className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              {navItems.find((item) => pathname === item.href || pathname?.startsWith(item.href + '/'))?.label || 'Dashboard'}
            </h1>
          </div>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  )
}
