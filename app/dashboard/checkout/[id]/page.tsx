'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import KitchenBillPrint from '../../../components/KitchenBillPrint'

interface Booking {
  id: string
  guestName: string
  idType: string
  roomPrice: number
  tariff?: number | null
  additionalGuests?: number | null
  additionalGuestCharges?: number | null
  checkInDate: string
  room: {
    roomNumber: string
    roomType: {
      name: string
    }
  }
  foodOrders?: Array<{
    id: string
    quantity: number
    foodItem: {
      name: string
      price: number
      gstPercent: number
    }
  }>
  companyName?: string
  department?: string
  designation?: string
  guestGstNumber?: string // Helper field if available
}

export default function CheckoutPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params?.id as string

  const [booking, setBooking] = useState<Booking | null>(null)
  const [baseAmount, setBaseAmount] = useState(0)
  const [tariff, setTariff] = useState(0)
  const [additionalGuestCharges, setAdditionalGuestCharges] = useState(0)
  // GST removed
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'ONLINE'>('CASH')
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PENDING'>('PENDING')
  const [kitchenBillPaid, setKitchenBillPaid] = useState(false)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [showCombinedFoodBill, setShowCombinedFoodBill] = useState(false)
  const [complimentary, setComplimentary] = useState(0)
  const [previousFoodBills, setPreviousFoodBills] = useState<Array<{
    id: string
    invoiceNumber: string
    totalAmount: number
    foodCharges: number
    createdAt: string
    foodOrders?: Array<{
      id: string
      quantity: number
      foodItem: {
        name: string
        price: number
      }
    }>
  }>>([])

  // New fields for complete bill
  const [companyName, setCompanyName] = useState('')
  const [department, setDepartment] = useState('')
  const [designation, setDesignation] = useState('')
  const [roundOff, setRoundOff] = useState(0)
  const [autoRoundOff, setAutoRoundOff] = useState(true)
  const [checkoutDate, setCheckoutDate] = useState(new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16))

  // Additional Guest Details for Invoice
  const [billNumber, setBillNumber] = useState('')
  const [guestState, setGuestState] = useState('JHARKHAND')
  const [guestStateCode, setGuestStateCode] = useState('20')
  const [guestNationality, setGuestNationality] = useState('INDIAN')
  const [businessPhoneNumber, setBusinessPhoneNumber] = useState('')

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
            setBooking(data)
            setBaseAmount(data.roomPrice)

            // Pre-fill company details from booking if available
            setCompanyName(data.companyName || '')
            setDepartment(data.department || '')
            setDesignation(data.designation || '')

            // Fetch previous food bills for this booking
            const billsResponse = await fetch(`/api/invoices?type=FOOD&bookingId=${bookingId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
            if (billsResponse.ok) {
              const billsData = await billsResponse.json()
              setPreviousFoodBills(billsData.invoices || [])
            }

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
        } catch (fetchError: unknown) {
          const err = fetchError as { message?: string }
          lastError = err?.message || 'Network error'
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
  }, [bookingId, router])

  useEffect(() => {
    if (bookingId) {
      fetchBooking()
    } else {
      setLoading(false)
    }
  }, [bookingId, fetchBooking])

  useEffect(() => {
    if (booking) {
      setBaseAmount(booking.roomPrice)
      setTariff(booking.tariff || 0)
      setAdditionalGuestCharges(booking.additionalGuestCharges || 0)
    }
  }, [booking])

  const calculateTotals = () => {
    const additionalGuestsTotal = booking && booking.additionalGuests && booking.additionalGuests > 0
      ? additionalGuestCharges * booking.additionalGuests
      : 0

    // Calculate combined food bill total
    let combinedFoodTotal = 0
    if (showCombinedFoodBill) {
      // Sum all previous food bills
      const previousBillsTotal = previousFoodBills.reduce((sum, bill) => sum + bill.totalAmount, 0)

      // Calculate current food orders total (no GST for food)
      let currentFoodTotal = 0
      if (booking?.foodOrders) {
        booking.foodOrders.forEach((order) => {
          currentFoodTotal += order.foodItem.price * order.quantity
        })
      }

      combinedFoodTotal = previousBillsTotal + currentFoodTotal - complimentary
    }

    const baseTotal = baseAmount + tariff + additionalGuestsTotal + (showCombinedFoodBill ? combinedFoodTotal : 0)
    const gstAmount = 0
    const subtotal = baseTotal + gstAmount

    // Calculate round-off
    let calculatedRoundOff = roundOff
    if (autoRoundOff) {
      const remainder = subtotal % 1
      if (remainder >= 0.5) {
        calculatedRoundOff = Math.ceil(subtotal) - subtotal
      } else {
        calculatedRoundOff = -remainder
      }
      calculatedRoundOff = Math.round(calculatedRoundOff * 100) / 100
    }

    const total = subtotal + calculatedRoundOff

    return {
      baseAmount,
      tariff,
      additionalGuestsTotal,
      combinedFoodTotal,
      complimentary,
      gstAmount,
      gstPercent: 0,
      subtotal,
      roundOff: calculatedRoundOff,
      total
    }
  }

  const getPrintableKitchenItems = () => {
    const items: any[] = []

    // Add current orders
    if (booking?.foodOrders) {
      booking.foodOrders.forEach(order => {
        items.push({
          id: order.id,
          name: order.foodItem.name,
          quantity: order.quantity,
          amount: order.foodItem.price * order.quantity
        })
      })
    }

    // Add previous bills items
    previousFoodBills.forEach(bill => {
      if (bill.foodOrders && bill.foodOrders.length > 0) {
        bill.foodOrders.forEach(order => {
          items.push({
            id: order.id,
            name: `${order.foodItem.name} (${bill.invoiceNumber})`,
            quantity: order.quantity,
            amount: order.foodItem.price * order.quantity
          })
        })
      } else {
        items.push({
          id: bill.id,
          name: `Bill ${bill.invoiceNumber}`,
          quantity: 1,
          amount: bill.totalAmount
        })
      }
    })

    return items
  }

  // Update round-off when auto is enabled and totals change
  useEffect(() => {
    if (autoRoundOff) {
      const totals = calculateTotals()
      setRoundOff(totals.roundOff)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseAmount, tariff, additionalGuestCharges, showCombinedFoodBill, complimentary, autoRoundOff])

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
          additionalGuestCharges,
          gstEnabled: false,
          showGst: false,
          gstPercent: 0,
          gstNumber: null,
          paymentStatus,
          kitchenBillPaid,
          showCombinedFoodBill,
          complimentary: showCombinedFoodBill ? complimentary : 0,
          // New fields
          companyName: companyName || null,
          department: department || null,
          designation: designation || null,
          billNumber: billNumber || null,
          guestState,
          guestStateCode,
          guestNationality,
          businessPhoneNumber: businessPhoneNumber || null,
          roundOff: totals.roundOff,
          checkoutDate,
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

        toast.success('Checkout completed successfully! Invoice downloaded.')
        router.push('/dashboard/bookings')
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || 'Checkout failed')
      }
    } catch (error) {
      console.error('Error during checkout:', error)
      toast.error('An error occurred during checkout')
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

      </div>

      {/* Guest Details for Invoice */}
      <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Guest Invoice Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="billNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Bill No. (Manual Override)
            </label>
            <input
              id="billNumber"
              type="text"
              value={billNumber}
              onChange={(e) => setBillNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
              placeholder="Leave empty to use System Invoice Number"
            />
          </div>
          <div>
            <label htmlFor="guestState" className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <input
              id="guestState"
              type="text"
              value={guestState}
              onChange={(e) => setGuestState(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
              placeholder="State"
            />
          </div>
          <div>
            <label htmlFor="guestStateCode" className="block text-sm font-medium text-gray-700 mb-2">
              State Code
            </label>
            <input
              id="guestStateCode"
              type="text"
              value={guestStateCode}
              onChange={(e) => setGuestStateCode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
              placeholder="e.g. 20"
            />
          </div>
          <div>
            <label htmlFor="guestNationality" className="block text-sm font-medium text-gray-700 mb-2">
              Nationality
            </label>
            <input
              id="guestNationality"
              type="text"
              value={guestNationality}
              onChange={(e) => setGuestNationality(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
              placeholder="Nationality"
            />
          </div>
          <div>
            <label htmlFor="businessPhoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Business Phone (Optional)
            </label>
            <input
              id="businessPhoneNumber"
              type="text"
              value={businessPhoneNumber}
              onChange={(e) => setBusinessPhoneNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
              placeholder="Business Phone"
            />
          </div>
        </div>
      </div>

      {/* Company Details */}
      <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Company Details (Optional)</h3>
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
            Company Name
          </label>
          <input
            id="companyName"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            placeholder="Enter company name"
          />
        </div>
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <input
            id="department"
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            placeholder="Enter department"
          />
        </div>
        <div>
          <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-2">
            Designation
          </label>
          <input
            id="designation"
            type="text"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            placeholder="Enter designation"
          />
        </div>
      </div>

      {/* Amount & Payment */}
      <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Amount & Payment</h3>

        <div>
          <label htmlFor="checkoutDate" className="block text-sm font-medium text-gray-700 mb-2">
            Checkout Date & Time
          </label>
          <input
            id="checkoutDate"
            type="datetime-local"
            value={checkoutDate}
            onChange={(e) => setCheckoutDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
          />
        </div>

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
            step="0.01"
            value={tariff}
            onChange={(e) => setTariff(Number.parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            placeholder="Enter tariff amount (can be negative)"
          />
        </div>

        {booking && booking.additionalGuests && booking.additionalGuests > 0 && (
          <div>
            <label htmlFor="additionalGuestCharges" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Guest Charges (₹) - {booking.additionalGuests} guest(s)
            </label>
            <input
              id="additionalGuestCharges"
              type="number"
              min="0"
              step="0.01"
              value={additionalGuestCharges}
              onChange={(e) => setAdditionalGuestCharges(Number.parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              placeholder="Enter charges per additional guest"
            />
          </div>
        )}

        {/* GST Section Removed */}

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

        {/* Round-off Section */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoRoundOff"
                checked={autoRoundOff}
                onChange={(e) => setAutoRoundOff(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="autoRoundOff" className="text-sm font-medium text-gray-900 cursor-pointer">
                Auto Round-off
              </label>
            </div>
          </div>

          {!autoRoundOff && (
            <div>
              <label htmlFor="roundOff" className="block text-sm font-medium text-gray-700 mb-2">
                Round-off Amount (₹) - Positive adds, negative subtracts
              </label>
              <input
                id="roundOff"
                type="number"
                step="0.01"
                value={roundOff}
                onChange={(e) => setRoundOff(Number.parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                placeholder="0.00"
              />
            </div>
          )}
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

      {/* Kitchen Bill Section Removed as per request */}

      {/* Total */}
      <div className="bg-indigo-50 rounded-xl shadow-md p-6">
        <div className="space-y-2 text-lg">
          <div className="flex justify-between">
            <span className="text-gray-700">Room Charges:</span>
            <span className="font-medium">₹{totals.baseAmount.toLocaleString('en-IN')}</span>
          </div>
          {totals.tariff !== 0 && (
            <div className="flex justify-between">
              <span className="text-gray-700">Tariff:</span>
              <span className="font-medium">₹{totals.tariff.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
          {totals.additionalGuestsTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-700">
                Additional Guests ({booking?.additionalGuests || 0} × ₹{additionalGuestCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}):
              </span>
              <span className="font-medium">₹{totals.additionalGuestsTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
          {showCombinedFoodBill && totals.combinedFoodTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-700">Combined Food Bill:</span>
              <span className="font-medium">₹{totals.combinedFoodTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
          {showCombinedFoodBill && totals.complimentary > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-700">Complimentary/Discount:</span>
              <span className="font-medium text-red-600">- ₹{totals.complimentary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}

          {totals.roundOff !== 0 && (
            <div className="flex justify-between">
              <span className="text-gray-700">Round-off:</span>
              <span className={`font-medium ${totals.roundOff < 0 ? 'text-red-600' : ''}`}>
                {totals.roundOff < 0 ? '- ' : ''}₹{Math.abs(totals.roundOff).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-indigo-200">
            <span className="text-xl font-semibold text-gray-900">Total Amount:</span>
            <span className="text-xl font-semibold text-indigo-600">
              ₹{totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
    </div >
  )
}
