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
        <div className="text-6xl mb-4">📋</div>
        <div className="text-lg font-semibold text-[#64748B]">Loading bookings...</div>
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
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#111827] mb-2">
            📋 Bookings
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] font-medium">Manage all hotel bookings and guest check-ins</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={handlePoliceVerification}
            className="px-4 py-2 sm:px-6 sm:py-3 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold flex items-center gap-2 min-h-[44px] text-sm sm:text-base"
          >
            <span>📄</span>
            <span>Police Verification</span>
          </button>
          <Link
            href="/dashboard/bookings/new"
            className="px-4 py-2 sm:px-6 sm:py-3 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold flex items-center gap-2 min-h-[44px] text-sm sm:text-base"
          >
            <span className="text-xl">➕</span>
            <span>New Check-In</span>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label htmlFor="search" className="block text-sm font-semibold text-[#111827] mb-2">🔍 Search</label>
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Search by guest name..."
              className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 bg-[#F8FAFC] border border-[#CBD5E1] text-[#111827] rounded-lg hover:bg-[#F1F5F9] transition-colors duration-150 font-semibold min-h-[44px] text-sm sm:text-base"
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
              className="px-4 py-3 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold min-h-[44px] text-sm sm:text-base"
            >
              🗑️ Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 border-t border-[#CBD5E1]">
            <div>
              <label htmlFor="dateFrom" className="block text-sm font-semibold text-[#111827] mb-2">📅 Check-In From</label>
              <input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
              />
            </div>
            <div>
              <label htmlFor="dateTo" className="block text-sm font-semibold text-[#111827] mb-2">📅 Check-In To</label>
              <input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
              />
            </div>
            <div>
              <label htmlFor="roomNumber" className="block text-sm font-semibold text-[#111827] mb-2">🏨 Room Number</label>
              <input
                id="roomNumber"
                type="text"
                value={roomNumber}
                onChange={(e) => {
                  setRoomNumber(e.target.value)
                  setPage(1)
                }}
                placeholder="Filter by room number..."
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 sm:gap-3 flex-wrap items-center">
        <Link
          href="/dashboard/bookings"
          className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg font-semibold transition-colors duration-150 min-h-[44px] flex items-center ${
            !statusFilter && !paymentPending
              ? 'bg-[#8E0E1C] text-white'
              : 'bg-white text-[#111827] hover:bg-[#F8FAFC] border border-[#CBD5E1]'
          }`}
        >
          All
        </Link>
        <Link
          href="/dashboard/bookings?status=ACTIVE"
          className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg font-semibold transition-colors duration-150 min-h-[44px] flex items-center ${
            statusFilter === 'ACTIVE'
              ? 'bg-[#8E0E1C] text-white'
              : 'bg-white text-[#111827] hover:bg-[#F8FAFC] border border-[#CBD5E1]'
          }`}
        >
          ✅ Active
        </Link>
        <Link
          href="/dashboard/bookings?status=CHECKED_OUT"
          className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg font-semibold transition-colors duration-150 min-h-[44px] flex items-center ${
            statusFilter === 'CHECKED_OUT' && !paymentPending
              ? 'bg-[#8E0E1C] text-white'
              : 'bg-white text-[#111827] hover:bg-[#F8FAFC] border border-[#CBD5E1]'
          }`}
        >
          🚪 Checked Out
        </Link>
        <Link
          href="/dashboard/bookings?paymentPending=true"
          className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg font-semibold transition-colors duration-150 min-h-[44px] flex items-center ${
            paymentPending === 'true'
              ? 'bg-[#8E0E1C] text-white'
              : 'bg-white text-[#111827] hover:bg-[#F8FAFC] border border-[#CBD5E1]'
          }`}
        >
          ⏳ Payment Pending
        </Link>
        <button
          onClick={() => {
            setShowAll(!showAll)
            setPage(1)
          }}
          className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg font-semibold transition-colors duration-150 min-h-[44px] flex items-center ${
            showAll
              ? 'bg-[#8E0E1C] text-white'
              : 'bg-white text-[#111827] hover:bg-[#F8FAFC] border border-[#CBD5E1]'
          }`}
        >
          {showAll ? '📄 Show Paginated' : '📋 Show All'}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-[#CBD5E1] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#CBD5E1]">
            <thead className="bg-[#8E0E1C]">
              <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  👤 Guest Name
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  🏨 Room
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider hidden sm:table-cell">
                  📅 Check-In
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  💰 Room Price
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  📊 Status
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                  ⚡ Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#CBD5E1]">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-[#111827]">{booking.guestName}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-[#111827]">
                      <span className="font-bold text-[#8E0E1C]">{booking.room.roomNumber}</span>
                      <span className="text-[#64748B]"> ({booking.room.roomType.name})</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                    <div className="text-sm font-medium text-[#64748B]">
                      {new Date(booking.checkInDate).toLocaleString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-[#111827]">
                      ₹{booking.roomPrice.toLocaleString('en-IN')}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-2">
                      <span
                        className={`px-2 py-1 text-xs font-bold rounded-full ${
                          booking.status === 'ACTIVE'
                            ? 'bg-[#8E0E1C] text-white'
                            : 'bg-[#64748B] text-white'
                        }`}
                      >
                        {booking.status}
                      </span>
                      {booking.status === 'CHECKED_OUT' && booking.payments && booking.payments.length > 0 && (
                        <span
                          className={`px-2 py-1 text-xs font-bold rounded-full ${
                            booking.payments.some((p) => p.status === 'PENDING')
                              ? 'bg-[#8E0E1C] text-white'
                              : 'bg-[#64748B] text-white'
                          }`}
                        >
                          {booking.payments.some((p) => p.status === 'PENDING') ? 'Payment Pending' : 'Paid'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      {booking.status === 'ACTIVE' && (
                        <>
                          <Link
                            href={`/dashboard/bookings/${booking.id}/add-food`}
                            className="px-3 py-1.5 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold text-xs min-h-[44px] flex items-center"
                            title="Add Food Items"
                          >
                            🍽️
                          </Link>
                          <Link
                            href={`/dashboard/checkout/${booking.id}`}
                            className="px-3 py-1.5 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold text-xs min-h-[44px] flex items-center"
                          >
                            Checkout
                          </Link>
                        </>
                      )}
                      <Link
                        href={`/dashboard/bookings/${booking.id}`}
                        className="px-3 py-1.5 bg-[#64748B] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold text-xs min-h-[44px] flex items-center"
                      >
                        👁️ View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!showAll && totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
        {bookings.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <div className="text-lg font-semibold text-[#64748B]">No bookings found</div>
          </div>
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
