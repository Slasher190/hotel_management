'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface DashboardStats {
  totalBookings: number
  activeBookings: number
  totalRevenue: number
  gstRevenue: number
  pendingPayments: number
  availableRooms: number
  occupiedRooms: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7))
  const [showStats, setShowStats] = useState(false) // Hidden by default

  const fetchDashboardStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/dashboard/stats?month=${currentMonth}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch {
      // Error handled by console.error
    } finally {
      setLoading(false)
    }
  }, [currentMonth])

  useEffect(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#64748B]">Loading dashboard...</div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Bookings',
      value: stats?.totalBookings || 0,
      icon: '📋',
      href: '/dashboard/bookings',
    },
    {
      title: 'Active Bookings',
      value: stats?.activeBookings || 0,
      icon: '✅',
      href: '/dashboard/bookings?status=active',
    },
    {
      title: 'Monthly Revenue',
      value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`,
      icon: '💰',
    },
    {
      title: 'GST Revenue',
      value: `₹${(stats?.gstRevenue || 0).toLocaleString('en-IN')}`,
      icon: '🧾',
    },
    {
      title: 'Pending Payments',
      value: stats?.pendingPayments || 0,
      icon: '⏳',
      href: '/dashboard/payments?status=pending',
    },
    {
      title: 'Available Rooms',
      value: `${stats?.availableRooms || 0} / ${(stats?.availableRooms || 0) + (stats?.occupiedRooms || 0)}`,
      icon: '🏨',
      href: '/dashboard/rooms',
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Month Selector and Show Stats Button */}
      <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-[#111827] mb-3">
            📅 Select Month
          </label>
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="w-full sm:w-auto px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] text-[#111827] font-medium bg-white"
          />
        </div>
        <button
          onClick={() => setShowStats(!showStats)}
          className="px-4 py-3 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold min-h-[44px]"
        >
          {showStats ? '🙈 Hide Stats' : '👁️ Show Stats'}
        </button>
      </div>

      {/* Stats Grid - Hidden by default */}
      {showStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map((card, index) => {
          const content = (
            <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6 hover:border-[#8E0E1C] transition-colors duration-150">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#8E0E1C] rounded-lg flex items-center justify-center text-2xl sm:text-3xl">
                  {card.icon}
                </div>
                <div className="text-right min-w-0 flex-1">
                  <div className="text-xl sm:text-2xl lg:text-4xl font-bold text-[#111827] break-words">
                    {card.value}
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-2">{card.title}</div>
                </div>
              </div>
            </div>
          )

          return card.href ? (
            <Link key={index} href={card.href} className="block">
              {content}
            </Link>
          ) : (
            <div key={index}>{content}</div>
          )
        })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-[#CBD5E1] p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#8E0E1C] rounded-lg flex items-center justify-center text-white text-xl">
            ⚡
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#111827]">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/bookings/new"
            className="px-4 py-3 sm:px-6 sm:py-4 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 text-center font-semibold flex items-center justify-center gap-2 min-h-[44px]"
          >
            <span className="text-xl">➕</span>
            <span className="text-sm sm:text-base">Add New Booking</span>
          </Link>
          <Link
            href="/dashboard/bookings?status=ACTIVE"
            className="px-4 py-3 sm:px-6 sm:py-4 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 text-center font-semibold flex items-center justify-center gap-2 min-h-[44px]"
          >
            <span className="text-xl">🍽️</span>
            <span className="text-sm sm:text-base">Add Food to Booking</span>
          </Link>
          <Link
            href="/dashboard/police-verification"
            className="px-4 py-3 sm:px-6 sm:py-4 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 text-center font-semibold flex items-center justify-center gap-2 min-h-[44px]"
          >
            <span className="text-xl">📥</span>
            <span className="text-sm sm:text-base">Download Daily Record</span>
          </Link>
          <Link
            href="/dashboard/reports"
            className="px-4 py-3 sm:px-6 sm:py-4 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 text-center font-semibold flex items-center justify-center gap-2 min-h-[44px]"
          >
            <span className="text-xl">📊</span>
            <span className="text-sm sm:text-base">View Record</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
