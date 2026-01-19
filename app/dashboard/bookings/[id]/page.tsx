'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Booking {
  id: string
  guestName: string
  idType: string
  idNumber: string | null
  additionalGuests: number
  additionalGuestCharges: number
  mattresses: number
  roomPrice: number
  tariff: number | null
  status: string
  checkInDate: string
  checkoutDate: string | null
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
    id: string
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
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState<{
    guestName: string
    idType: string
    idNumber: string
    additionalGuests: number
    additionalGuestCharges: number
    mattresses: number
    roomPrice: number
    tariff: number
    checkInDate: string
    checkoutDate: string
  }>({
    guestName: '',
    idType: '',
    idNumber: '',
    additionalGuests: 0,
    additionalGuestCharges: 0,
    mattresses: 0,
    roomPrice: 0,
    tariff: 0,
    checkInDate: '',
    checkoutDate: '',
  })
  const [loading, setLoading] = useState(true)

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
        setEditData({
          guestName: data.guestName,
          idType: data.idType,
          idNumber: data.idNumber || '',
          additionalGuests: data.additionalGuests || 0,
          additionalGuestCharges: data.additionalGuestCharges || 0,
          mattresses: data.mattresses || 0,
          roomPrice: data.roomPrice,
          tariff: data.tariff || 0,
          checkInDate: new Date(data.checkInDate).toISOString().slice(0, 16),
          checkoutDate: data.checkoutDate ? new Date(data.checkoutDate).toISOString().slice(0, 16) : '',
        })
      } else if (response.status === 404) {
        setBooking(null)
      } else {
        console.error('Error fetching booking:', response.statusText)
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

  const handleSave = async () => {
    if (!booking) return

    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      })

      if (response.ok) {
        const updated = await response.json()
        setBooking(updated)
        setEditing(false)
        toast.success('Booking updated successfully!')
        fetchBooking()
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || 'Failed to update booking')
      }
    } catch {
      toast.error('An error occurred while updating booking')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePayment = async (paymentId: string, newStatus: 'PAID' | 'PENDING', newAmount?: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          amount: newAmount,
        }),
      })

      if (response.ok) {
        fetchBooking()
        toast.success('Payment updated successfully!')
      } else {
        toast.error('Failed to update payment')
      }
    } catch {
      toast.error('An error occurred while updating payment')
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
    <div className="max-w-6xl space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Booking Details</h2>
        <div className="flex gap-2">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Edit Booking
            </button>
          )}
          {booking.status === 'ACTIVE' && (
            <>
              <Link
                href={`/dashboard/bookings/${booking.id}/add-food`}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                title="Add Food Items"
              >
                🍽️ Add Food
              </Link>
              {booking.foodOrders.length > 0 && (
                <Link
                  href={`/dashboard/bookings/${booking.id}/food-bill`}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Food Bill
                </Link>
              )}
            </>
          )}
          <Link
            href="/dashboard/bookings"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            ← Back
          </Link>
        </div>
      </div>

      {editing ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Booking Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Guest Name *</label>
              <input
                type="text"
                value={editData.guestName}
                onChange={(e) => setEditData({ ...editData, guestName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID Type *</label>
              <select
                value={editData.idType}
                onChange={(e) => setEditData({ ...editData, idType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="AADHAAR">Aadhaar</option>
                <option value="DL">Driving License</option>
                <option value="VOTER_ID">Voter ID</option>
                <option value="PASSPORT">Passport</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID Number</label>
              <input
                type="text"
                value={editData.idNumber}
                onChange={(e) => setEditData({ ...editData, idNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Room Price (₹) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editData.roomPrice}
                onChange={(e) => setEditData({ ...editData, roomPrice: Number.parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Guests</label>
              <input
                type="number"
                min="0"
                value={editData.additionalGuests}
                onChange={(e) => setEditData({ ...editData, additionalGuests: Number.parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Guest Charges (₹ per guest)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editData.additionalGuestCharges}
                onChange={(e) => setEditData({ ...editData, additionalGuestCharges: Number.parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mattresses</label>
              <input
                type="number"
                min="0"
                value={editData.mattresses}
                onChange={(e) => setEditData({ ...editData, mattresses: Number.parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tariff (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editData.tariff}
                onChange={(e) => setEditData({ ...editData, tariff: Number.parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Check-In Date & Time</label>
              <input
                type="datetime-local"
                value={editData.checkInDate}
                onChange={(e) => setEditData({ ...editData, checkInDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {booking.status === 'CHECKED_OUT' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Checkout Date & Time</label>
                <input
                  type="datetime-local"
                  value={editData.checkoutDate}
                  onChange={(e) => setEditData({ ...editData, checkoutDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => {
                setEditing(false)
                fetchBooking()
              }}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
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
              {booking.idNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-900 font-medium">ID Number:</span>
                  <span className="font-semibold text-gray-900">{booking.idNumber}</span>
                </div>
              )}
              {booking.additionalGuests > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-900 font-medium">Additional Guests:</span>
                  <span className="font-semibold text-gray-900">
                    {booking.additionalGuests} (₹{booking.additionalGuestCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each)
                  </span>
                </div>
              )}
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
                <span className="font-semibold text-gray-900">{booking.room.roomType.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-900 font-medium">Room Price:</span>
                <span className="font-semibold text-gray-900">₹{booking.roomPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {booking.tariff && booking.tariff > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-900 font-medium">Tariff:</span>
                  <span className="font-semibold text-gray-900">₹{booking.tariff.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
                Payment Information
                {payment.status === 'PENDING' && (
                  <button
                    onClick={() => {
                      const newStatus = payment.status === 'PENDING' ? 'PAID' : 'PENDING'
                      handleUpdatePayment(payment.id, newStatus, payment.amount)
                    }}
                    className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Mark as Paid
                  </button>
                )}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-900 font-medium">Amount:</span>
                  <span className="font-semibold text-gray-900">₹{payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
      )}

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
                    <td className="text-right py-2 text-gray-900 font-medium">₹{order.foodItem.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="text-right py-2 text-gray-900 font-medium">{order.quantity}</td>
                    <td className="text-right py-2 text-gray-900 font-medium">{order.foodItem.gstPercent}%</td>
                    <td className="text-right py-2 text-gray-900 font-semibold">₹{(itemTotal + gst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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
              <span className="font-semibold text-gray-900">₹{invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
      {booking.status === 'ACTIVE' && !editing && (
        <div className="space-y-4">
          <div className="bg-indigo-50 rounded-xl shadow-md p-6">
            <Link
              href={`/dashboard/checkout/${booking.id}`}
              className="block w-full text-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              Proceed to Checkout
            </Link>
          </div>
          {booking.foodOrders && booking.foodOrders.length > 0 && (
            <div className="bg-orange-50 rounded-xl shadow-md p-6">
              <Link
                href={`/dashboard/bookings/${booking.id}/kitchen-bills`}
                className="block w-full text-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
              >
                🍽️ Manage Kitchen Bills
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
