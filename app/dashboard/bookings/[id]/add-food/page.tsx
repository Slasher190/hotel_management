'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import ThermalSlip from '@/app/components/ThermalSlip'

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
    invoiceId: string | null
    createdAt: string
    foodItem: FoodItem
  }>
}


interface Invoice {
  id: string
  invoiceNumber: string
  totalAmount: number
  createdAt: string
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
  const [pastBills, setPastBills] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFoodItem, setSelectedFoodItem] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [printableBill, setPrintableBill] = useState<Invoice | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (bookingId) {
      fetchBooking()
      fetchFoodItems()
      fetchPastBills()
    }
  }, [bookingId])

  const fetchPastBills = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/bookings/${bookingId}/kitchen-bill`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setPastBills(data.invoices || [])
      }
    } catch {
      // concise error handling
    }
  }

  // Effect to trigger print when bill is set
  useEffect(() => {
    if (printableBill) {
      // Small delay to ensure render
      const timer = setTimeout(() => {
        window.print()
        // Optional: clear after print dialog closes (though js execution pauses)
        // setPrintableBill(null) 
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [printableBill])

  const handlePrintInvoice = (invoice: Invoice) => {
    setPrintableBill(invoice)
  }

  /* Legacy download function kept if needed, but unused now
  const handleDownloadInvoice = async (invoice: Invoice) => {
     ...
  }
  */

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

  // Filter unpaid orders (not yet invoiced)
  const unpaidOrders = booking.foodOrders?.filter((order) => !order.invoiceId) || []

  const calculateTotal = () => {
    if (unpaidOrders.length === 0) return 0
    let total = 0
    unpaidOrders.forEach((order) => {
      // Kitchen bills don't have GST
      const itemTotal = order.foodItem.price * order.quantity
      total += itemTotal
    })
    return total
  }

  const handleGenerateAndPrintBill = async () => {
    if (unpaidOrders.length === 0) {
      toast.error('No unpaid food items to generate bill')
      return
    }

    setDownloading(true)
    try {
      const token = localStorage.getItem('token')
      const orderIds = unpaidOrders.map((order) => order.id)
      const response = await fetch(`/api/bookings/${bookingId}/kitchen-bill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          includeOrders: orderIds,
          format: 'json',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const invoice = data.invoice

        // Trigger print for the new invoice
        setPrintableBill(invoice)

        toast.success('Kitchen bill generated!')
        fetchBooking() // Refresh to update invoice status
        fetchPastBills()
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || 'Failed to generate kitchen bill')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setDownloading(false)
    }
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
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Search food items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={selectedFoodItem}
                  onChange={(e) => {
                    setSelectedFoodItem(e.target.value)
                    setSearchQuery('') // Clear search after selection
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
                  size={searchQuery ? Math.min(foodItems.filter(item =>
                    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.category.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length + 1, 8) : 1}
                >
                  <option value="">Select food item</option>
                  {foodItems
                    .filter(item =>
                      searchQuery === '' ||
                      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.category.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} - ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({item.category})
                      </option>
                    ))}
                </select>
              </div>
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

      {/* Current Food Orders (Unpaid Only) */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Unpaid Food Orders</h3>
          {unpaidOrders.length > 0 && (
            <button
              onClick={handleGenerateAndPrintBill}
              disabled={downloading}
              className="px-4 py-2 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              <span>🖨️</span>
              {downloading ? 'Generating...' : 'Print Bill'}
            </button>
          )}
        </div>
        {unpaidOrders.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Time</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {unpaidOrders.map((order) => {
                    const itemTotal = order.foodItem.price * order.quantity
                    return (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.foodItem.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          ₹{order.foodItem.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {order.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          ₹{itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
          <p className="text-gray-500 text-center py-8">No unpaid food items. Add items to generate a bill.</p>
        )}
      </div>

      {/* Past Food Bills */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Past Food Bills</h3>
        {pastBills.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pastBills.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invoice.createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-xs truncate" title={invoice.foodOrders.map(o => `${o.foodItem.name} x${o.quantity}`).join(', ')}>
                        {invoice.foodOrders.length} items
                        <span className="text-xs text-gray-400 block">
                          {invoice.foodOrders.slice(0, 2).map(o => `${o.foodItem.name}`).join(', ')}
                          {invoice.foodOrders.length > 2 && '...'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      ₹{invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <button
                        onClick={() => handlePrintInvoice(invoice)}
                        className="text-[#8E0E1C] hover:text-[#7a0c18] font-medium flex items-center justify-center gap-1 mx-auto"
                      >
                        <span>🖨️</span> Print PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No past food bills found.</p>
        )}
      </div>

      {/* Hidden Thermal Slip Component */}
      {printableBill && booking && (
        <ThermalSlip
          lotNumber={printableBill.invoiceNumber}
          dateTime={new Date(printableBill.createdAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).replace(/\//g, '-')}
          roomNumber={booking.room.roomNumber}
          guestName={booking.guestName}
          attendantName="Staff"
          items={printableBill.foodOrders.map(order => ({
            id: order.id,
            name: order.foodItem.name,
            quantity: order.quantity,
            amount: order.foodItem.price * order.quantity
          }))}
          subtotal={printableBill.totalAmount}
          discount={0}
          total={printableBill.totalAmount}
        />
      )}
    </div>
  )
}
