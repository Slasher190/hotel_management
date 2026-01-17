'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Booking {
  id: string
  guestName: string
  room: {
    roomNumber: string
    roomType: string
  }
  foodOrders: Array<{
    id: string
    quantity: number
    foodItem: {
      id: string
      name: string
      price: number
      gstPercent: number
    }
  }>
}

export default function FoodBillPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params?.id as string

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
      }
    } catch (error) {
      console.error('Error fetching booking:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateFoodTotals = () => {
    if (!booking) return { subtotal: 0, totalGst: 0, total: 0 }

    let subtotal = 0
    let totalGst = 0

    booking.foodOrders.forEach((order) => {
      const itemTotal = order.foodItem.price * order.quantity
      subtotal += itemTotal
      totalGst += (itemTotal * order.foodItem.gstPercent) / 100
    })

    const total = subtotal + totalGst

    return { subtotal, totalGst, total }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Loading food bill...</div>
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

  if (booking.foodOrders.length === 0) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-900">Food Bill</h2>
          <Link
            href={`/dashboard/bookings/${bookingId}`}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            ← Back to Booking
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">No food orders for this booking</p>
        </div>
      </div>
    )
  }

  const totals = calculateFoodTotals()

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Food Bill</h2>
        <Link
          href={`/dashboard/bookings/${bookingId}`}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          ← Back to Booking
        </Link>
      </div>

      {/* Booking Info */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-900 font-medium">Guest Name:</span>
            <span className="font-semibold text-gray-900 ml-2">{booking.guestName}</span>
          </div>
          <div>
            <span className="text-gray-900 font-medium">Room:</span>
            <span className="font-semibold text-gray-900 ml-2">
              {booking.room.roomNumber} ({booking.room.roomType})
            </span>
          </div>
        </div>
      </div>

      {/* Food Orders */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Food Orders</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Item</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Price</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Quantity</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">GST %</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">GST Amount</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Total</th>
              </tr>
            </thead>
            <tbody>
              {booking.foodOrders.map((order) => {
                const itemTotal = order.foodItem.price * order.quantity
                const gst = (itemTotal * order.foodItem.gstPercent) / 100
                const total = itemTotal + gst
                return (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900 font-medium">{order.foodItem.name}</td>
                    <td className="text-right py-3 px-4 text-gray-900 font-medium">₹{order.foodItem.price.toLocaleString('en-IN')}</td>
                    <td className="text-right py-3 px-4 text-gray-900 font-medium">{order.quantity}</td>
                    <td className="text-right py-3 px-4 text-gray-900 font-medium">{order.foodItem.gstPercent}%</td>
                    <td className="text-right py-3 px-4 text-gray-900 font-medium">₹{gst.toLocaleString('en-IN')}</td>
                    <td className="text-right py-3 px-4 text-gray-900 font-semibold">₹{total.toLocaleString('en-IN')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="bg-indigo-50 rounded-xl shadow-md p-6">
        <div className="space-y-2 text-lg">
          <div className="flex justify-between">
            <span className="text-gray-700">Subtotal:</span>
            <span className="font-medium">₹{totals.subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Total GST:</span>
            <span className="font-medium">₹{totals.totalGst.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-indigo-200">
            <span className="text-xl font-semibold text-gray-900">Total Amount:</span>
            <span className="text-xl font-semibold text-indigo-600">
              ₹{totals.total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
