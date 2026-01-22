'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface KitchenBill {
  id: string
  invoiceNumber: string
  totalAmount: number
  foodCharges: number
  gstAmount: number
  gstEnabled: boolean
  createdAt: string
  billDate: string | null
}

export default function KitchenBillsPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string
  const [bills, setBills] = useState<KitchenBill[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedBill, setSelectedBill] = useState<KitchenBill | null>(null)
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'ONLINE'>('CASH')
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PENDING'>('PAID')
  const [paying, setPaying] = useState(false)

  const fetchBills = useCallback(async () => {
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

      const response = await fetch(`/api/bookings/${bookingId}/kitchen-bill`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setBills(data.invoices || [])
      } else {
        toast.error('Failed to fetch kitchen bills')
      }
    } catch (error) {
      console.error('Error fetching kitchen bills:', error)
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }, [bookingId, router])

  useEffect(() => {
    fetchBills()
  }, [fetchBills])

  const handleGenerateBill = async () => {
    setGenerating(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/bookings/${bookingId}/kitchen-bill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}), // No GST options for kitchen bills
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = globalThis.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `kitchen-bill-${Date.now()}.pdf`
        document.body.appendChild(a)
        a.click()
        globalThis.URL.revokeObjectURL(url)
        a.remove()

        toast.success('Kitchen bill generated successfully!')
        fetchBills() // Refresh the list
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || 'Failed to generate kitchen bill')
      }
    } catch (error) {
      console.error('Error generating kitchen bill:', error)
      toast.error('An error occurred')
    } finally {
      setGenerating(false)
    }
  }

  const handlePayBill = (bill: KitchenBill) => {
    setSelectedBill(bill)
    setShowPaymentModal(true)
  }

  const handleConfirmPayment = async () => {
    if (!selectedBill) return

    setPaying(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/bookings/${bookingId}/kitchen-bill/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          invoiceId: selectedBill.id,
          paymentMode,
          paymentStatus,
          amount: selectedBill.totalAmount,
        }),
      })

      if (response.ok) {
        toast.success('Payment recorded successfully!')
        setShowPaymentModal(false)
        setSelectedBill(null)
        fetchBills() // Refresh the list
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || 'Failed to record payment')
      }
    } catch (error) {
      console.error('Error paying bill:', error)
      toast.error('An error occurred')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading kitchen bills...</div>
  }

  const totalAmount = bills.reduce((sum, bill) => sum + bill.totalAmount, 0)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Kitchen Bills</h2>
          <p className="text-gray-600 mt-1">Generate and manage kitchen bills for this booking</p>
        </div>
        <Link
          href={`/dashboard/bookings/${bookingId}`}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          ← Back to Booking
        </Link>
      </div>

      {/* Generate Bill Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate New Kitchen Bill</h3>
        <p className="text-sm text-gray-600 mb-4">
          Kitchen bills are generated without GST. Only unpaid food items will be included.
        </p>
        <button
          onClick={handleGenerateBill}
          disabled={generating}
          className="w-full bg-[#8E0E1C] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? 'Generating...' : 'Generate Kitchen Bill'}
        </button>
      </div>

      {/* Bills History */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Kitchen Bills History</h3>
          {bills.length > 0 && (
            <div className="text-sm font-medium text-gray-700">
              Total: ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          )}
        </div>

        {bills.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No kitchen bills generated yet. Generate a bill to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Time
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Food Charges
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {bill.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bill.billDate
                        ? new Date(bill.billDate).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : new Date(bill.createdAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      ₹{bill.foodCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      ₹{bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => handlePayBill(bill)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Pay Bill
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity cursor-pointer"
            onClick={() => {
              setShowPaymentModal(false)
              setSelectedBill(null)
            }}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pay Kitchen Bill</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice Number:</span>
                      <span className="font-semibold text-gray-900">{selectedBill.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-semibold text-gray-900">
                        ₹{selectedBill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as 'CASH' | 'ONLINE')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="ONLINE">Online</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as 'PAID' | 'PENDING')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="PAID">Paid</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleConfirmPayment}
                    disabled={paying}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {paying ? 'Processing...' : 'Confirm Payment'}
                  </button>
                  <button
                    onClick={() => {
                      setShowPaymentModal(false)
                      setSelectedBill(null)
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
