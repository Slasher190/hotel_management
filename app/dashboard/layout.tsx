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
    { href: '/dashboard/bookings', label: 'Bookings', icon: '📋' },
    { href: '/dashboard/checkout', label: 'Checkout', icon: '✅' },
    { href: '/dashboard/payments', label: 'Payments', icon: '💳' },
    { href: '/dashboard/tours', label: 'Tours & Travel', icon: '🚌' },
    { href: '/dashboard/reports', label: 'Reports', icon: '📈' },
    { href: '/dashboard/bills/generate', label: 'Generate Bill', icon: '🧾' },
    { href: '/dashboard/bills/history', label: 'Bill History', icon: '📜' },
    { href: '/dashboard/kitchen-bills', label: 'Kitchen Bills', icon: '🍳' },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-gradient-to-b from-white to-slate-50 shadow-2xl flex flex-col border-r border-slate-200">
        {/* Header - Fixed at top */}
        <div className="p-6 border-b border-slate-200 shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🏨</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Hotel Management</h2>
              <p className="text-xs text-indigo-100 mt-0.5">Manager Dashboard</p>
            </div>
          </div>
        </div>
        
        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 transform scale-[1.02]'
                    : 'text-slate-700 hover:bg-slate-100 hover:shadow-md hover:transform hover:translate-x-1'
                }`}
              >
                <span className={`text-xl transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </span>
                <span className={`font-medium ${isActive ? 'text-white' : 'text-slate-700'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </Link>
            )
          })}
        </nav>
        
        {/* Logout Button - Fixed at bottom */}
        <div className="p-4 border-t border-slate-200 shrink-0 bg-white/50 backdrop-blur-sm">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-xl transition-all duration-200 font-semibold shadow-md hover:shadow-lg hover:from-red-600 hover:to-pink-600 transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-72">
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 sticky top-0 z-10">
          <div className="px-8 py-5 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {navItems.find((item) => pathname === item.href || pathname?.startsWith(item.href + '/'))?.label || 'Dashboard'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">Welcome back! Here's what's happening today.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                M
              </div>
            </div>
          </div>
        </header>
        <main className="p-8 fade-in">{children}</main>
      </div>
    </div>
  )
}
