'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Payment {
  id: string
  mode: string
  status: string
  amount: number
  createdAt: string
  booking: {
    id: string
    guestName: string
    room: {
      roomNumber: string
    }
  }
}

function PaymentsContent() {
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('status')
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [statusFilter])

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token')
      const url = statusFilter
        ? `/api/payments?status=${statusFilter}`
        : '/api/payments'
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPayments(data)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (paymentId: string, newStatus: 'PAID' | 'PENDING') => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchPayments()
      }
    } catch (error) {
      console.error('Error updating payment:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading payments...</div>
  }

  const pendingTotal = payments
    .filter((p) => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Payments</h2>
        {statusFilter === 'PENDING' && (
          <div className="text-lg font-semibold text-orange-600">
            Total Pending: ₹{pendingTotal.toLocaleString('en-IN')}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Link
          href="/dashboard/payments"
          className={`px-4 py-2 rounded-lg ${
            !statusFilter
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </Link>
        <Link
          href="/dashboard/payments?status=PENDING"
          className={`px-4 py-2 rounded-lg ${
            statusFilter === 'PENDING'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Pending
        </Link>
        <Link
          href="/dashboard/payments?status=PAID"
          className={`px-4 py-2 rounded-lg ${
            statusFilter === 'PAID'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Paid
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Guest
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Room
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {payment.booking.guestName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payment.booking.room.roomNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ₹{payment.amount.toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payment.mode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      payment.status === 'PAID'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(payment.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {payment.status === 'PENDING' && (
                    <button
                      onClick={() => handleUpdateStatus(payment.id, 'PAID')}
                      className="text-green-600 hover:text-green-900"
                    >
                      Mark Paid
                    </button>
                  )}
                  {payment.status === 'PAID' && (
                    <button
                      onClick={() => handleUpdateStatus(payment.id, 'PENDING')}
                      className="text-orange-600 hover:text-orange-900"
                    >
                      Mark Pending
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading payments...</div>}>
      <PaymentsContent />
    </Suspense>
  )
}
