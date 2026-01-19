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
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4 animate-pulse">💳</div>
        <div className="text-lg font-semibold text-slate-500">Loading payments...</div>
      </div>
    )
  }

  const pendingTotal = payments
    .filter((p) => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-8 fade-in">
      <div className="flex justify-between items-center bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-6">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            💳 Payments
          </h2>
          <p className="text-slate-600 font-medium">
            {statusFilter === 'PENDING' ? (
              <>Total Pending: <span className="font-bold text-orange-600">₹{pendingTotal.toLocaleString('en-IN')}</span></>
            ) : (
              'Manage and track all payment transactions'
            )}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-700 mb-2">🔍 Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Search by guest name..."
              className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-xl hover:from-slate-200 hover:to-slate-300 transition-all font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
          >
            {showFilters ? '🙈 Hide Filters' : '🔧 Show Filters'}
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
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
            >
              🗑️ Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 border-t border-slate-200">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">📅 Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setPage(1)
                }}
                className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">📅 Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setPage(1)
                }}
                className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">💳 Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => {
                  setPaymentMode(e.target.value)
                  setPage(1)
                }}
                className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
              >
                <option value="">All Modes</option>
                <option value="CASH">Cash</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">💰 Min Amount (₹)</label>
              <input
                type="number"
                value={minAmount}
                onChange={(e) => {
                  setMinAmount(e.target.value)
                  setPage(1)
                }}
                placeholder="0"
                className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">💰 Max Amount (₹)</label>
              <input
                type="number"
                value={maxAmount}
                onChange={(e) => {
                  setMaxAmount(e.target.value)
                  setPage(1)
                }}
                placeholder="999999"
                className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <Link
          href="/dashboard/payments"
          className={`px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform hover:scale-105 ${
            statusFilter === null
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
          }`}
        >
          📋 All
        </Link>
        <Link
          href="/dashboard/payments?status=PENDING"
          className={`px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform hover:scale-105 ${
            statusFilter === 'PENDING'
              ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
          }`}
        >
          ⏳ Pending
        </Link>
        <Link
          href="/dashboard/payments?status=PAID"
          className={`px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform hover:scale-105 ${
            statusFilter === 'PAID'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
          }`}
        >
          ✅ Paid
        </Link>
      </div>

      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-gradient-to-r from-indigo-600 to-purple-600">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                👤 Guest
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                🏨 Room
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                💰 Amount
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                💳 Mode
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                📊 Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                📅 Date
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                ⚡ Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {payments.map((payment) => {
              const isUpdating = updatingPaymentId === payment.id
              return (
              <tr key={payment.id} className={`hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 ${isUpdating ? 'opacity-60' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-slate-900">{payment.booking.guestName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-700">
                    <span className="font-bold text-indigo-600">{payment.booking.room.roomNumber}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-slate-900">
                    ₹{payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-600">{payment.mode}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1.5 text-xs font-bold rounded-full shadow-md ${
                      payment.status === 'PAID'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                        : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                    }`}
                  >
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-600">
                    {new Date(payment.createdAt).toLocaleDateString('en-IN')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {payment.status === 'PENDING' && (
                    <button
                      onClick={() => handleUpdateStatus(payment.id, 'PAID')}
                      disabled={isUpdating}
                      className={`px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold text-xs shadow-md hover:shadow-lg transform hover:scale-105 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''} flex items-center gap-2`}
                    >
                      {isUpdating && (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      ✅ Mark Paid
                    </button>
                  )}
                  {payment.status === 'PAID' && (
                    <button
                      onClick={() => handleUpdateStatus(payment.id, 'PENDING')}
                      disabled={isUpdating}
                      className={`px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:from-orange-700 hover:to-amber-700 transition-all font-semibold text-xs shadow-md hover:shadow-lg transform hover:scale-105 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''} flex items-center gap-2`}
                    >
                      {isUpdating && (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      ⏳ Mark Pending
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
