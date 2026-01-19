'use client'

import { useEffect, useState, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Pagination from '@/app/components/Pagination'

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
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [paymentMode, setPaymentMode] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })
      
      if (statusFilter) {
        params.append('status', statusFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      if (dateFrom) {
        params.append('dateFrom', dateFrom)
      }
      if (dateTo) {
        params.append('dateTo', dateTo)
      }
      if (paymentMode) {
        params.append('mode', paymentMode)
      }
      if (minAmount) {
        params.append('minAmount', minAmount)
      }
      if (maxAmount) {
        params.append('maxAmount', maxAmount)
      }
      
      const response = await fetch(`/api/payments?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.payments && data.pagination) {
          setPayments(data.payments)
          setTotalPages(data.pagination.totalPages)
        } else {
          // Backward compatibility - if API returns array directly
          setPayments(Array.isArray(data) ? data : [])
          setTotalPages(1)
        }
      }
    } catch {
      // Error handled by console.error
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page, searchQuery, dateFrom, dateTo, paymentMode, minAmount, maxAmount])

  useEffect(() => {
    setPage(1) // Reset to page 1 when filter changes
  }, [statusFilter])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const handleUpdateStatus = async (paymentId: string, newStatus: 'PAID' | 'PENDING') => {
    setUpdatingPaymentId(paymentId)
    const loadingToast = toast.loading(`Updating payment status to ${newStatus}...`)
    
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
        toast.success(`Payment marked as ${newStatus} successfully!`, { id: loadingToast })
        await fetchPayments()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update payment' }))
        toast.error(errorData.error || 'Failed to update payment status', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error updating payment:', error)
      toast.error('An error occurred while updating payment', { id: loadingToast })
    } finally {
      setUpdatingPaymentId(null)
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

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Search by guest name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          {(searchQuery || dateFrom || dateTo || paymentMode || minAmount || maxAmount) && (
            <button
              onClick={() => {
                setSearchQuery('')
                setDateFrom('')
                setDateTo('')
                setPaymentMode('')
                setMinAmount('')
                setMaxAmount('')
                setPage(1)
              }}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => {
                  setPaymentMode(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Modes</option>
                <option value="CASH">Cash</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Amount (₹)</label>
              <input
                type="number"
                value={minAmount}
                onChange={(e) => {
                  setMinAmount(e.target.value)
                  setPage(1)
                }}
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Amount (₹)</label>
              <input
                type="number"
                value={maxAmount}
                onChange={(e) => {
                  setMaxAmount(e.target.value)
                  setPage(1)
                }}
                placeholder="999999"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Link
          href="/dashboard/payments"
          className={`px-4 py-2 rounded-lg ${
            statusFilter === null
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
            {payments.map((payment) => {
              const isUpdating = updatingPaymentId === payment.id
              return (
              <tr key={payment.id} className={`hover:bg-gray-50 ${isUpdating ? 'opacity-60' : ''}`}>
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
                      disabled={isUpdating}
                      className={`text-green-600 hover:text-green-900 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''} flex items-center gap-2`}
                    >
                      {isUpdating && (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      Mark Paid
                    </button>
                  )}
                  {payment.status === 'PAID' && (
                    <button
                      onClick={() => handleUpdateStatus(payment.id, 'PENDING')}
                      disabled={isUpdating}
                      className={`text-orange-600 hover:text-orange-900 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''} flex items-center gap-2`}
                    >
                      {isUpdating && (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      Mark Pending
                    </button>
                  )}
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
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
