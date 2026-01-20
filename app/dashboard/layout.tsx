'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
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
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-[#CBD5E1] rounded-lg shadow-sm"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6 text-[#111827]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-72 bg-white border-r border-[#CBD5E1] flex flex-col z-40 transition-transform duration-150 ease-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="p-6 border-b border-[#CBD5E1] shrink-0 bg-[#8E0E1C]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏨</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Hotel Management</h2>
              <p className="text-xs text-white/80 mt-0.5">Manager Dashboard</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-150 ${
                  isActive
                    ? 'bg-[#8E0E1C] text-white'
                    : 'text-[#111827] hover:bg-[#F8FAFC]'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>
        
        {/* Logout Button */}
        <div className="p-4 border-t border-[#CBD5E1] shrink-0 bg-white">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 text-white bg-[#8E0E1C] rounded-lg transition-opacity duration-150 font-medium hover:opacity-90 flex items-center justify-center gap-2 min-h-[44px]"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:ml-72">
        <header className="bg-white border-b border-[#CBD5E1] sticky top-0 z-10">
          <div className="px-4 py-4 sm:px-8 sm:py-5 flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#111827]">
                {navItems.find((item) => pathname === item.href || pathname?.startsWith(item.href + '/'))?.label || 'Dashboard'}
              </h1>
              <p className="text-sm text-[#64748B] mt-1 hidden sm:block">Welcome back! Here's what's happening today.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#8E0E1C] rounded-full flex items-center justify-center text-white font-bold">
                M
              </div>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-8">{children}</main>
      </div>
    </div>
  )
}
