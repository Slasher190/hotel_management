'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Booking {
  id: string
  guestName: string
  idType: string
  roomPrice: number
  tariff?: number | null
  checkInDate: string
  room: {
    roomNumber: string
    roomType: {
      name: string
    }
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params?.id as string

  const [booking, setBooking] = useState<Booking | null>(null)
  const [baseAmount, setBaseAmount] = useState(0)
  const [tariff, setTariff] = useState(0)
  const [gstEnabled, setGstEnabled] = useState(false)
  const [gstPercent, setGstPercent] = useState(5)
  const [gstNumber, setGstNumber] = useState('')
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'ONLINE'>('CASH')
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PENDING'>('PENDING')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (bookingId) {
      fetchBooking()
    } else {
      setLoading(false)
    }
  }, [bookingId])

  useEffect(() => {
    if (booking) {
      setBaseAmount(booking.roomPrice)
      setTariff(booking.tariff || 0)
    }
  }, [booking])

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

      // Retry logic for newly created bookings
      let retries = 3
      let lastError = null

      while (retries > 0) {
        try {
          const response = await fetch(`/api/bookings/${bookingId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            setBooking(data)
            setBaseAmount(data.roomPrice)
            setLoading(false)
            return
          } else if (response.status === 404) {
            if (retries > 1) {
              await new Promise((resolve) => setTimeout(resolve, 500))
              retries--
              continue
            }
            setBooking(null)
            setLoading(false)
            return
          } else {
            const errorData = await response.json().catch(() => ({}))
            lastError = `Error ${response.status}: ${errorData.error || response.statusText}`
          }
        } catch (fetchError: any) {
          lastError = fetchError?.message || 'Network error'
        }
        retries--
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }

      if (lastError) {
        console.error('Error fetching booking after retries:', lastError)
      }
    } catch (error) {
      console.error('Error fetching booking:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotals = () => {
    const gstAmount = gstEnabled ? ((baseAmount + tariff) * gstPercent) / 100 : 0
    const total = baseAmount + tariff + gstAmount

    return { baseAmount, tariff, gstAmount, gstPercent, total }
  }

  const handleCheckout = async () => {
    if (!booking) return

    setProcessing(true)
    try {
      const token = localStorage.getItem('token')
      const totals = calculateTotals()

      const response = await fetch(`/api/bookings/${bookingId}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          baseAmount: totals.baseAmount,
          tariff: totals.tariff,
          gstEnabled,
          gstPercent: gstEnabled ? gstPercent : 0,
          gstNumber: gstEnabled ? gstNumber : null,
          paymentMode,
          paymentStatus,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = globalThis.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${bookingId}.pdf`
        document.body.appendChild(a)
        a.click()
        globalThis.URL.revokeObjectURL(url)
        a.remove()

        router.push('/dashboard/bookings')
      } else {
        const errorData = await response.json().catch(() => ({}))
        alert(errorData.error || 'Checkout failed')
      }
    } catch (error) {
      console.error('Error during checkout:', error)
      alert('An error occurred during checkout')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Loading checkout details...</div>
      </div>
    )
  }

  if (!bookingId) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Invalid booking ID</div>
        <button
          onClick={() => router.push('/dashboard/checkout')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Back to Checkout
        </button>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2 font-semibold">Booking not found</div>
        <div className="text-gray-500 text-sm mb-4">
          Booking ID: {bookingId}
        </div>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push('/dashboard/checkout')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Checkout
          </button>
          <button
            onClick={() => router.push('/dashboard/bookings')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            View All Bookings
          </button>
        </div>
      </div>
    )
  }

  const totals = calculateTotals()

  return (
    <div className="max-w-4xl space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Checkout</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Summary */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Booking Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-900 font-medium">Guest Name:</span>
              <span className="font-semibold text-gray-900">{booking.guestName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-900 font-medium">Room:</span>
              <span className="font-semibold text-gray-900">
                {booking.room.roomNumber} ({booking.room.roomType.name})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-900 font-medium">ID Type:</span>
              <span className="font-semibold text-gray-900">{booking.idType}</span>
            </div>
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
              <span className="text-gray-900 font-medium">Room Price:</span>
              <span className="font-semibold text-gray-900">₹{booking.roomPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Amount & Payment */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Amount & Payment</h3>

          <div>
            <label htmlFor="baseAmount" className="block text-sm font-medium text-gray-700 mb-2">
              Room Charges (₹) *
            </label>
            <input
              id="baseAmount"
              type="number"
              required
              min="0"
              step="0.01"
              value={baseAmount}
              onChange={(e) => setBaseAmount(Number.parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              placeholder="Enter room charges"
            />
          </div>

          <div>
            <label htmlFor="tariff" className="block text-sm font-medium text-gray-700 mb-2">
              Tariff (₹)
            </label>
            <input
              id="tariff"
              type="number"
              min="0"
              step="0.01"
              value={tariff}
              onChange={(e) => setTariff(Number.parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              placeholder="Enter tariff amount"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="gstEnabled"
              checked={gstEnabled}
              onChange={(e) => setGstEnabled(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="gstEnabled" className="text-sm font-medium text-gray-900 cursor-pointer">
              Include GST (5%)
            </label>
          </div>

          {gstEnabled && (
            <>
              <div>
                <label htmlFor="gstPercent" className="block text-sm font-medium text-gray-700 mb-2">
                  GST Percentage (%)
                </label>
                <input
                  id="gstPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={gstPercent}
                  onChange={(e) => setGstPercent(Number.parseFloat(e.target.value) || 5)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                  placeholder="5"
                />
              </div>
              <div>
                <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  GST Number
                </label>
                <input
                  id="gstNumber"
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder:text-gray-500"
                  placeholder="Enter GST number"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="paymentMode" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Mode
            </label>
            <select
              id="paymentMode"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as 'CASH' | 'ONLINE')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
            >
              <option value="CASH">Cash</option>
              <option value="ONLINE">Online</option>
            </select>
          </div>

          <div>
            <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Status
            </label>
            <select
              id="paymentStatus"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as 'PAID' | 'PENDING')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
            >
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="bg-indigo-50 rounded-xl shadow-md p-6">
        <div className="space-y-2 text-lg">
          <div className="flex justify-between">
            <span className="text-gray-700">Room Charges:</span>
            <span className="font-medium">₹{totals.baseAmount.toLocaleString('en-IN')}</span>
          </div>
          {totals.tariff > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-700">Tariff:</span>
              <span className="font-medium">₹{totals.tariff.toLocaleString('en-IN')}</span>
            </div>
          )}
          {gstEnabled && (
            <div className="flex justify-between">
              <span className="text-gray-700">GST ({gstPercent}%):</span>
              <span className="font-medium">₹{totals.gstAmount.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-indigo-200">
            <span className="text-xl font-semibold text-gray-900">Total Amount:</span>
            <span className="text-xl font-semibold text-indigo-600">
              ₹{totals.total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={processing || baseAmount <= 0}
          className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? 'Processing...' : 'Complete Checkout & Generate Invoice'}
        </button>
      </div>
    </div>
  )
}
