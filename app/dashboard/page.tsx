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
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Month
        </label>
        <input
          type="month"
          value={currentMonth}
          onChange={(e) => setCurrentMonth(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const content = (
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
                  {card.icon}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">{card.value}</div>
                  <div className="text-sm text-gray-500 mt-1">{card.title}</div>
                </div>
              </div>
            </div>
          )

          return card.href ? (
            <Link key={index} href={card.href}>
              {content}
            </Link>
          ) : (
            <div key={index}>{content}</div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/bookings/new"
            className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-center font-medium"
          >
            Add New Booking
          </Link>
          <Link
            href="/dashboard/bookings?status=ACTIVE"
            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center font-medium"
          >
            Add Food to Booking
          </Link>
          <Link
            href="/dashboard/police-verification"
            className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-center font-medium"
          >
            Download Daily Record
          </Link>
          <Link
            href="/dashboard/reports"
            className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-center font-medium"
          >
            View Record
          </Link>
        </div>
      </div>
    </div>
  )
}
