'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface FoodItem {
  id: string
  name: string
  category: string
  price: number
  gstPercent: number
  enabled: boolean
}

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
    foodItem: FoodItem
  }>
}

export default function AddFoodPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params?.id as string

  const [booking, setBooking] = useState<Booking | null>(null)
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFoodItem, setSelectedFoodItem] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (bookingId) {
      fetchBooking()
      fetchFoodItems()
    }
  }, [bookingId])

  const fetchBooking = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/bookings/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setBooking(data)
      } else {
        toast.error('Failed to fetch booking')
        router.push('/dashboard/bookings')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchFoodItems = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/food?enabled=true', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setFoodItems(data)
      }
    } catch {
      // Error handled silently
    }
  }

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFoodItem || quantity < 1) {
      toast.error('Please select a food item and enter quantity')
      return
    }

    setAdding(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/bookings/food', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId,
          foodItemId: selectedFoodItem,
          quantity,
        }),
      })

      if (response.ok) {
        toast.success('Food item added successfully!')
        setSelectedFoodItem('')
        setQuantity(1)
        fetchBooking() // Refresh booking to show new food order
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to add food item')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveFood = async (orderId: string) => {
    if (!confirm('Are you sure you want to remove this food item?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/bookings/food/${orderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast.success('Food item removed successfully!')
        fetchBooking()
      } else {
        toast.error('Failed to remove food item')
      }
    } catch {
      toast.error('An error occurred')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!booking) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Booking not found</div>
        <Link
          href="/dashboard/bookings"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Back to Bookings
        </Link>
      </div>
    )
  }

  const calculateTotal = () => {
    if (!booking.foodOrders || booking.foodOrders.length === 0) return 0
    let total = 0
    booking.foodOrders.forEach((order) => {
      const itemTotal = order.foodItem.price * order.quantity
      const gst = (itemTotal * order.foodItem.gstPercent) / 100
      total += itemTotal + gst
    })
    return total
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Add Food Items</h2>
          <p className="text-gray-600 mt-1">
            Guest: {booking.guestName} | Room: {booking.room.roomNumber}
          </p>
        </div>
        <Link
          href={`/dashboard/bookings/${bookingId}`}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          ← Back to Booking
        </Link>
      </div>

      {/* Add Food Form */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Food Item</h3>
        <form onSubmit={handleAddFood} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Food Item *</label>
              <select
                value={selectedFoodItem}
                onChange={(e) => setSelectedFoodItem(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select food item</option>
                {foodItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} - ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({item.gstPercent}% GST)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={adding}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add Food Item'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Current Food Orders */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Food Orders</h3>
        {booking.foodOrders && booking.foodOrders.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">GST %</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {booking.foodOrders.map((order) => {
                    const itemTotal = order.foodItem.price * order.quantity
                    const gst = (itemTotal * order.foodItem.gstPercent) / 100
                    const total = itemTotal + gst
                    return (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.foodItem.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          ₹{order.foodItem.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {order.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {order.foodItem.gstPercent}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <button
                            onClick={() => handleRemoveFood(order.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 text-right">
              <p className="text-lg font-semibold text-gray-900">
                Total: ₹{calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-center py-8">No food items added yet</p>
        )}
      </div>
    </div>
  )
}
