'use client'

import { useEffect, useState, Suspense, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import Pagination from '@/app/components/Pagination'

interface Booking {
  id: string
  guestName: string
  idType: string
  roomPrice: number
  status: string
  checkInDate: string
  checkoutDate: string | null
  room: {
    roomNumber: string
    roomType: {
      name: string
    }
  }
  payments?: Array<{
    status: string
  }>
}

function BookingsContent() {
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('status')
  const paymentPending = searchParams.get('paymentPending')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showAll, setShowAll] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const fetchBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      
      if (paymentPending === 'true') {
        params.append('paymentPending', 'true')
      } else if (statusFilter) {
        params.append('status', statusFilter)
      }
      
      if (showAll) {
        params.append('showAll', 'true')
      } else {
        params.append('page', page.toString())
        params.append('limit', '10')
      }

      if (searchQuery) {
        params.append('search', searchQuery)
      }
      if (dateFrom) {
        params.append('dateFrom', dateFrom)
      }
      if (dateTo) {
        params.append('dateTo', dateTo)
      }
      if (roomNumber) {
        params.append('roomNumber', roomNumber)
      }
      
      const response = await fetch(`/api/bookings?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.bookings) {
          setBookings(data.bookings)
          if (data.pagination) {
            setTotalPages(data.pagination.totalPages)
          }
        } else {
          // Backward compatibility
          setBookings(data)
        }
      }
    } catch {
      // Error handled by console.error
    } finally {
      setLoading(false)
    }
  }, [statusFilter, paymentPending, page, showAll, searchQuery, dateFrom, dateTo, roomNumber])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4 animate-pulse">📋</div>
        <div className="text-lg font-semibold text-slate-500">Loading bookings...</div>
      </div>
    )
  }

  const handlePoliceVerification = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/police-verification?format=pdf', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = globalThis.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `police-verification-${Date.now()}.pdf`
        document.body.appendChild(a)
        a.click()
        globalThis.URL.revokeObjectURL(url)
        a.remove()
        toast.success('Police verification report downloaded successfully!')
      } else {
        toast.error('Failed to generate police verification report')
      }
    } catch (error) {
      console.error('Error generating police verification:', error)
      toast.error('An error occurred while generating the report')
    }
  }

  return (
    <div className="space-y-8 fade-in">
      <div className="flex justify-between items-center bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-6">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            📋 Bookings
          </h2>
          <p className="text-slate-600 font-medium">Manage all hotel bookings and guest check-ins</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePoliceVerification}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
          >
            <span>📄</span>
            <span>Police Verification</span>
          </button>
          <Link
            href="/dashboard/bookings/new"
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
          >
            <span className="text-xl">➕</span>
            <span>New Check-In</span>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-700 mb-2">🔍 Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Search by guest name..."
              className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-xl hover:from-slate-200 hover:to-slate-300 transition-all font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
          >
            {showFilters ? '🙈 Hide Filters' : '🔧 Show Filters'}
          </button>
          {(searchQuery || dateFrom || dateTo || roomNumber) && (
            <button
              onClick={() => {
                setSearchQuery('')
                setDateFrom('')
                setDateTo('')
                setRoomNumber('')
                setPage(1)
              }}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
            >
              🗑️ Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-200">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">📅 Check-In From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setPage(1)
                }}
                className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">📅 Check-In To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setPage(1)
                }}
                className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">🏨 Room Number</label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => {
                  setRoomNumber(e.target.value)
                  setPage(1)
                }}
                placeholder="Filter by room number..."
                className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <Link
          href="/dashboard/bookings"
          className={`px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg transform hover:scale-105 ${
            !statusFilter && !paymentPending
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
          }`}
        >
          All
        </Link>
        <Link
          href="/dashboard/bookings?status=ACTIVE"
          className={`px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg transform hover:scale-105 ${
            statusFilter === 'ACTIVE'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
          }`}
        >
          ✅ Active
        </Link>
        <Link
          href="/dashboard/bookings?status=CHECKED_OUT"
          className={`px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg transform hover:scale-105 ${
            statusFilter === 'CHECKED_OUT' && !paymentPending
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
          }`}
        >
          🚪 Checked Out
        </Link>
        <Link
          href="/dashboard/bookings?paymentPending=true"
          className={`px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg transform hover:scale-105 ${
            paymentPending === 'true'
              ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
          }`}
        >
          ⏳ Payment Pending
        </Link>
        <button
          onClick={() => {
            setShowAll(!showAll)
            setPage(1)
          }}
          className={`px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg transform hover:scale-105 ${
            showAll
              ? 'bg-gradient-to-r from-teal-600 to-green-600 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
          }`}
        >
          {showAll ? '📄 Show Paginated' : '📋 Show All'}
        </button>
      </div>

      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-gradient-to-r from-indigo-600 to-purple-600">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                👤 Guest Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                🏨 Room
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                📅 Check-In
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                💰 Room Price
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                📊 Status
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                ⚡ Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-slate-900">{booking.guestName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-700">
                    <span className="font-bold text-indigo-600">{booking.room.roomNumber}</span>
                    <span className="text-slate-500"> ({booking.room.roomType.name})</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-600">
                    {new Date(booking.checkInDate).toLocaleString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-slate-900">
                    ₹{booking.roomPrice.toLocaleString('en-IN')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-2">
                    <span
                      className={`px-3 py-1.5 text-xs font-bold rounded-full shadow-md ${
                        booking.status === 'ACTIVE'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                          : 'bg-gradient-to-r from-slate-400 to-slate-500 text-white'
                      }`}
                    >
                      {booking.status}
                    </span>
                    {booking.status === 'CHECKED_OUT' && booking.payments && booking.payments.length > 0 && (
                      <span
                        className={`px-3 py-1.5 text-xs font-bold rounded-full shadow-md ${
                          booking.payments.some((p) => p.status === 'PENDING')
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                            : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                        }`}
                      >
                        {booking.payments.some((p) => p.status === 'PENDING') ? 'Payment Pending' : 'Paid'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    {booking.status === 'ACTIVE' && (
                      <>
                        <Link
                          href={`/dashboard/bookings/${booking.id}/add-food`}
                          className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all font-semibold text-xs shadow-md hover:shadow-lg transform hover:scale-105"
                          title="Add Food Items"
                        >
                          🍽️
                        </Link>
                        <Link
                          href={`/dashboard/checkout/${booking.id}`}
                          className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold text-xs shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          Checkout
                        </Link>
                      </>
                    )}
                    <Link
                      href={`/dashboard/bookings/${booking.id}`}
                      className="px-4 py-1.5 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-lg hover:from-slate-600 hover:to-slate-700 transition-all font-semibold text-xs shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      👁️ View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!showAll && totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  )
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading bookings...</div>}>
      <BookingsContent />
    </Suspense>
  )
}
