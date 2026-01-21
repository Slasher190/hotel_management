'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Booking {
  id: string
  guestName: string
  room: {
    roomNumber: string
    roomType: {
      name: string
    }
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
  const [generating, setGenerating] = useState(false)
  const [showGst, setShowGst] = useState(false) // Default unchecked
  const [gstPercent, setGstPercent] = useState(5)
  const [gstNumber, setGstNumber] = useState('')
  const [previousBills, setPreviousBills] = useState<Array<{
    id: string
    invoiceNumber: string
    totalAmount: number
    createdAt: string
    billDate: string | null
  }>>([])

  const fetchBooking = useCallback(async () => {
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
        
        // Fetch previous food bills for this booking
        const billsResponse = await fetch(`/api/invoices?type=FOOD&bookingId=${bookingId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (billsResponse.ok) {
          const billsData = await billsResponse.json()
          setPreviousBills(billsData.invoices || [])
        }
      } else if (response.status === 404) {
        setBooking(null)
      }
    } catch {
      // Error handled by console.error
    } finally {
      setLoading(false)
    }
  }, [bookingId, router])

  useEffect(() => {
    if (bookingId) {
      fetchBooking()
    } else {
      setLoading(false)
    }
  }, [bookingId, fetchBooking])

  const calculateFoodTotals = () => {
    if (!booking) return { subtotal: 0, totalGst: 0, total: 0 }

    let subtotal = 0
    // Remove GST calculation - food bills don't have GST
    let totalGst = 0

    booking.foodOrders.forEach((order) => {
      const itemTotal = order.foodItem.price * order.quantity
      subtotal += itemTotal
      // No GST calculation
    })

    const total = subtotal // No GST added

    return { subtotal, totalGst, total }
  }

  const handleGenerateInvoice = async () => {
    if (!booking) return

    setGenerating(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/bookings/${bookingId}/food-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          showGst,
          gstPercent,
          gstNumber: gstNumber || null,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = globalThis.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `food-invoice-${bookingId}.pdf`
        document.body.appendChild(a)
        a.click()
        globalThis.URL.revokeObjectURL(url)
        a.remove()
        toast.success('Food invoice generated successfully!')
        
        // Remove food items that were included in the invoice
        // Fetch updated booking to get current food orders
        await fetchBooking()
        
        // Refresh previous bills list
        const token = localStorage.getItem('token')
        const billsResponse = await fetch(`/api/invoices?type=FOOD&bookingId=${bookingId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (billsResponse.ok) {
          const billsData = await billsResponse.json()
          setPreviousBills(billsData.invoices || [])
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || 'Failed to generate invoice')
      }
    } catch {
      toast.error('An error occurred while generating invoice')
    } finally {
      setGenerating(false)
    }
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
        <div className="flex gap-2">
          <button
            onClick={handleGenerateInvoice}
            disabled={generating}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Invoice PDF'}
          </button>
          <Link
            href={`/dashboard/bookings/${bookingId}`}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            ← Back to Booking
          </Link>
        </div>
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
              {booking.room.roomNumber} ({booking.room.roomType.name})
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
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Total</th>
              </tr>
            </thead>
            <tbody>
              {booking.foodOrders.map((order) => {
                const itemTotal = order.foodItem.price * order.quantity
                // No GST calculation
                const total = itemTotal
                return (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900 font-medium">{order.foodItem.name}</td>
                    <td className="text-right py-3 px-4 text-gray-900 font-medium">₹{order.foodItem.price.toLocaleString('en-IN')}</td>
                    <td className="text-right py-3 px-4 text-gray-900 font-medium">{order.quantity}</td>
                    <td className="text-right py-3 px-4 text-gray-900 font-semibold">₹{total.toLocaleString('en-IN')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* GST Options */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Options</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showGst"
              checked={showGst}
              onChange={(e) => setShowGst(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="showGst" className="text-sm font-medium text-gray-900 cursor-pointer">
              Show GST on Invoice
            </label>
          </div>
          {showGst && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GST Percentage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={gstPercent}
                  onChange={(e) => setGstPercent(Number.parseFloat(e.target.value) || 5)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GST Number (Optional)</label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter GST number"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Totals */}
      <div className="bg-indigo-50 rounded-xl shadow-md p-6">
        <div className="space-y-2 text-lg">
          <div className="flex justify-between pt-2 border-t border-indigo-200">
            <span className="text-xl font-semibold text-gray-900">Total Amount:</span>
            <span className="text-xl font-semibold text-indigo-600">
              ₹{totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Previous Bills */}
      {previousBills.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Previously Generated Bills</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Invoice Number</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                </tr>
              </thead>
              <tbody>
                {previousBills.map((bill) => (
                  <tr key={bill.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900 font-medium">{bill.invoiceNumber}</td>
                    <td className="text-right py-3 px-4 text-gray-900 font-semibold">
                      ₹{bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-gray-900 font-medium">
                      {bill.billDate
                        ? new Date(bill.billDate).toLocaleDateString('en-IN')
                        : new Date(bill.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
