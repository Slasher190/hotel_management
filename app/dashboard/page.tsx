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
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Bookings',
      value: stats?.totalBookings || 0,
      icon: '📋',
      color: 'bg-blue-500',
      href: '/dashboard/bookings',
    },
    {
      title: 'Active Bookings',
      value: stats?.activeBookings || 0,
      icon: '✅',
      color: 'bg-green-500',
      href: '/dashboard/bookings?status=active',
    },
    {
      title: 'Monthly Revenue',
      value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`,
      icon: '💰',
      color: 'bg-indigo-500',
    },
    {
      title: 'GST Revenue',
      value: `₹${(stats?.gstRevenue || 0).toLocaleString('en-IN')}`,
      icon: '🧾',
      color: 'bg-purple-500',
    },
    {
      title: 'Pending Payments',
      value: stats?.pendingPayments || 0,
      icon: '⏳',
      color: 'bg-orange-500',
      href: '/dashboard/payments?status=pending',
    },
    {
      title: 'Available Rooms',
      value: `${stats?.availableRooms || 0} / ${(stats?.availableRooms || 0) + (stats?.occupiedRooms || 0)}`,
      icon: '🏨',
      color: 'bg-teal-500',
      href: '/dashboard/rooms',
    },
  ]

  return (
    <div className="space-y-8 fade-in">
      {/* Month Selector */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-6">
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          📅 Select Month
        </label>
        <input
          type="month"
          value={currentMonth}
          onChange={(e) => setCurrentMonth(e.target.value)}
          className="px-5 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 font-medium bg-white shadow-sm hover:shadow-md transition-all"
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const content = (
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-6 card-hover group cursor-pointer">
              <div className="flex items-center justify-between">
                <div className={`${card.color} w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {card.icon}
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    {card.value}
                  </div>
                  <div className="text-sm font-medium text-slate-500 mt-2">{card.title}</div>
                </div>
              </div>
              <div className="mt-4 h-1 bg-gradient-to-r from-slate-200 to-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${card.color} rounded-full w-full`}></div>
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

      {/* Quick Actions */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
            ⚡
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/bookings/new"
            className="group px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 text-center font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <span className="text-xl">➕</span>
            <span>Add New Booking</span>
          </Link>
          <Link
            href="/dashboard/bookings?status=ACTIVE"
            className="group px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 text-center font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <span className="text-xl">🍽️</span>
            <span>Add Food to Booking</span>
          </Link>
          <Link
            href="/dashboard/police-verification"
            className="group px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all duration-200 text-center font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <span className="text-xl">📥</span>
            <span>Download Daily Record</span>
          </Link>
          <Link
            href="/dashboard/reports"
            className="group px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 text-center font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <span className="text-xl">📊</span>
            <span>View Record</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
