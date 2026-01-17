'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

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
    roomType: string
  }
  foodOrders: Array<{
    id: string
    quantity: number
    foodItem: {
      name: string
      price: number
      gstPercent: number
    }
  }>
  invoices: Array<{
    invoiceNumber: string
    totalAmount: number
    gstEnabled: boolean
    createdAt: string
  }>
  payments: Array<{
    mode: string
    status: string
    amount: number
  }>
}

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (bookingId) {
      fetchBooking()
    } else {
      setLoading(false)
    }
  }, [bookingId])

  const fetchBooking = async () => {
    if (!bookingId) {
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/bookings/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setBooking(data)
      } else if (response.status === 404) {
        setBooking(null)
      } else {
        console.error('Error fetching booking:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching booking:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Loading booking details...</div>
      </div>
    )
  }

  if (!bookingId) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Invalid booking ID</div>
        <Link
          href="/dashboard/bookings"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-block"
        >
          Back to Bookings
        </Link>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Booking not found</div>
        <Link
          href="/dashboard/bookings"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-block"
        >
          Back to Bookings
        </Link>
      </div>
    )
  }

  const invoice = booking.invoices[0]
  const payment = booking.payments[0]

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Booking Details</h2>
        <div className="flex gap-2">
          {booking.status === 'ACTIVE' && booking.foodOrders.length > 0 && (
            <Link
              href={`/dashboard/bookings/${booking.id}/food-bill`}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Food Bill
            </Link>
          )}
          <Link
            href="/dashboard/bookings"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            ← Back to Bookings
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Guest Information */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Guest Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-900 font-medium">Name:</span>
              <span className="font-semibold text-gray-900">{booking.guestName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-900 font-medium">ID Type:</span>
              <span className="font-semibold text-gray-900">{booking.idType}</span>
            </div>
          </div>
        </div>

        {/* Room Information */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-900 font-medium">Room Number:</span>
              <span className="font-semibold text-gray-900">{booking.room.roomNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-900 font-medium">Room Type:</span>
              <span className="font-semibold text-gray-900">{booking.room.roomType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-900 font-medium">Room Price:</span>
              <span className="font-semibold text-gray-900">₹{booking.roomPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Booking Dates */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Dates</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-900 font-medium">Check-In:</span>
              <span className="font-semibold text-gray-900">
                {new Date(booking.checkInDate).toLocaleString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-900 font-medium">Checkout:</span>
              <span className="font-semibold text-gray-900">
                {booking.checkoutDate
                  ? new Date(booking.checkoutDate).toLocaleString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Not checked out'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-900 font-medium">Status:</span>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  booking.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {booking.status}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        {payment && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-900 font-medium">Amount:</span>
                <span className="font-semibold text-gray-900">₹{payment.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-900 font-medium">Mode:</span>
                <span className="font-semibold text-gray-900">{payment.mode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-900 font-medium">Status:</span>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    payment.status === 'PAID'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {payment.status}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Food Orders */}
      {booking.foodOrders.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Food Orders</h3>
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-semibold text-gray-900">Item</th>
                <th className="text-right py-2 font-semibold text-gray-900">Price</th>
                <th className="text-right py-2 font-semibold text-gray-900">Quantity</th>
                <th className="text-right py-2 font-semibold text-gray-900">GST</th>
                <th className="text-right py-2 font-semibold text-gray-900">Total</th>
              </tr>
            </thead>
            <tbody>
              {booking.foodOrders.map((order) => {
                const itemTotal = order.foodItem.price * order.quantity
                const gst = (itemTotal * order.foodItem.gstPercent) / 100
                return (
                  <tr key={order.id} className="border-b">
                    <td className="py-2 text-gray-900 font-medium">{order.foodItem.name}</td>
                    <td className="text-right py-2 text-gray-900 font-medium">₹{order.foodItem.price.toLocaleString('en-IN')}</td>
                    <td className="text-right py-2 text-gray-900 font-medium">{order.quantity}</td>
                    <td className="text-right py-2 text-gray-900 font-medium">{order.foodItem.gstPercent}%</td>
                    <td className="text-right py-2 text-gray-900 font-semibold">₹{(itemTotal + gst).toLocaleString('en-IN')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoice Information */}
      {invoice && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-900 font-medium">Invoice Number:</span>
              <span className="font-semibold text-gray-900">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-900 font-medium">Total Amount:</span>
              <span className="font-semibold text-gray-900">₹{invoice.totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-900 font-medium">GST Enabled:</span>
              <span className="font-semibold text-gray-900">{invoice.gstEnabled ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-900 font-medium">Invoice Date:</span>
              <span className="font-semibold text-gray-900">
                {new Date(invoice.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {booking.status === 'ACTIVE' && (
        <div className="bg-indigo-50 rounded-xl shadow-md p-6">
          <Link
            href={`/dashboard/checkout/${booking.id}`}
            className="block w-full text-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
          >
            Proceed to Checkout
          </Link>
        </div>
      )}
    </div>
  )
}
