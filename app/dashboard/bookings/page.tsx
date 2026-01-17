'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

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

  useEffect(() => {
    fetchBookings()
  }, [statusFilter, paymentPending])

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token')
      let url = '/api/bookings'
      const params = new URLSearchParams()
      
      if (paymentPending === 'true') {
        params.append('paymentPending', 'true')
      } else if (statusFilter) {
        params.append('status', statusFilter)
      }
      
      if (params.toString()) {
        url = `/api/bookings?${params.toString()}`
      }
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading bookings...</div>
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
      } else {
        alert('Failed to generate police verification report')
      }
    } catch (error) {
      console.error('Error generating police verification:', error)
      alert('An error occurred while generating the report')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Bookings</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePoliceVerification}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Download Police Verification
          </button>
          <Link
            href="/dashboard/bookings/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + New Check-In
          </Link>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Link
          href="/dashboard/bookings"
          className={`px-4 py-2 rounded-lg ${
            !statusFilter && !paymentPending
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </Link>
        <Link
          href="/dashboard/bookings?status=ACTIVE"
          className={`px-4 py-2 rounded-lg ${
            statusFilter === 'ACTIVE'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Active
        </Link>
        <Link
          href="/dashboard/bookings?status=CHECKED_OUT"
          className={`px-4 py-2 rounded-lg ${
            statusFilter === 'CHECKED_OUT' && !paymentPending
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Checked Out
        </Link>
        <Link
          href="/dashboard/bookings?paymentPending=true"
          className={`px-4 py-2 rounded-lg ${
            paymentPending === 'true'
              ? 'bg-orange-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Payment Pending
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Guest Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Room
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Check-In
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Room Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {booking.guestName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {booking.room.roomNumber} ({booking.room.roomType.name})
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(booking.checkInDate).toLocaleString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ₹{booking.roomPrice.toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        booking.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {booking.status}
                    </span>
                    {booking.status === 'CHECKED_OUT' && booking.payments && booking.payments.length > 0 && (
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          booking.payments.some((p) => p.status === 'PENDING')
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {booking.payments.some((p) => p.status === 'PENDING') ? 'Payment Pending' : 'Paid'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {booking.status === 'ACTIVE' && (
                    <Link
                      href={`/dashboard/checkout/${booking.id}`}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Checkout
                    </Link>
                  )}
                  <Link
                    href={`/dashboard/bookings/${booking.id}`}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
