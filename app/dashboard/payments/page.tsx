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
    setPage(1)
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
        <div className="text-6xl mb-4">💳</div>
        <div className="text-lg font-semibold text-[#64748B]">Loading payments...</div>
      </div>
    )
  }

  const pendingTotal = payments
    .filter((p) => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#111827] mb-2">
            💳 Payments
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] font-medium">
            {statusFilter === 'PENDING' ? (
              <>Total Pending: <span className="font-bold text-[#8E0E1C]">₹{pendingTotal.toLocaleString('en-IN')}</span></>
            ) : (
              'Manage and track all payment transactions'
            )}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label htmlFor="search" className="block text-sm font-semibold text-[#111827] mb-2">🔍 Search</label>
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Search by guest name..."
              className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 bg-[#F8FAFC] border border-[#CBD5E1] text-[#111827] rounded-lg hover:bg-[#F1F5F9] transition-colors duration-150 font-semibold min-h-[44px] text-sm sm:text-base"
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
              className="px-4 py-3 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold min-h-[44px] text-sm sm:text-base"
            >
              🗑️ Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 border-t border-[#CBD5E1]">
            <div>
              <label htmlFor="dateFrom" className="block text-sm font-semibold text-[#111827] mb-2">📅 Date From</label>
              <input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
              />
            </div>
            <div>
              <label htmlFor="dateTo" className="block text-sm font-semibold text-[#111827] mb-2">📅 Date To</label>
              <input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
              />
            </div>
            <div>
              <label htmlFor="paymentMode" className="block text-sm font-semibold text-[#111827] mb-2">💳 Payment Mode</label>
              <select
                id="paymentMode"
                value={paymentMode}
                onChange={(e) => {
                  setPaymentMode(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
              >
                <option value="">All Modes</option>
                <option value="CASH">Cash</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>
            <div>
              <label htmlFor="minAmount" className="block text-sm font-semibold text-[#111827] mb-2">💰 Min Amount (₹)</label>
              <input
                id="minAmount"
                type="number"
                value={minAmount}
                onChange={(e) => {
                  setMinAmount(e.target.value)
                  setPage(1)
                }}
                placeholder="0"
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
              />
            </div>
            <div>
              <label htmlFor="maxAmount" className="block text-sm font-semibold text-[#111827] mb-2">💰 Max Amount (₹)</label>
              <input
                id="maxAmount"
                type="number"
                value={maxAmount}
                onChange={(e) => {
                  setMaxAmount(e.target.value)
                  setPage(1)
                }}
                placeholder="999999"
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 sm:gap-3 flex-wrap">
        <Link
          href="/dashboard/payments"
          className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-bold transition-colors duration-150 min-h-[44px] flex items-center ${
            statusFilter === null
              ? 'bg-[#8E0E1C] text-white'
              : 'bg-white text-[#111827] hover:bg-[#F8FAFC] border border-[#CBD5E1]'
          }`}
        >
          📋 All
        </Link>
        <Link
          href="/dashboard/payments?status=PENDING"
          className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-bold transition-colors duration-150 min-h-[44px] flex items-center ${
            statusFilter === 'PENDING'
              ? 'bg-[#8E0E1C] text-white'
              : 'bg-white text-[#111827] hover:bg-[#F8FAFC] border border-[#CBD5E1]'
          }`}
        >
          ⏳ Pending
        </Link>
        <Link
          href="/dashboard/payments?status=PAID"
          className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-bold transition-colors duration-150 min-h-[44px] flex items-center ${
            statusFilter === 'PAID'
              ? 'bg-[#8E0E1C] text-white'
              : 'bg-white text-[#111827] hover:bg-[#F8FAFC] border border-[#CBD5E1]'
          }`}
        >
          ✅ Paid
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-[#CBD5E1] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#CBD5E1]">
            <thead className="bg-[#8E0E1C]">
              <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  👤 Guest
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider hidden sm:table-cell">
                  🏨 Room
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  💰 Amount
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider hidden md:table-cell">
                  💳 Mode
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  📊 Status
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider hidden lg:table-cell">
                  📅 Date
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                  ⚡ Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#CBD5E1]">
              {payments.map((payment) => {
                const isUpdating = updatingPaymentId === payment.id
                return (
                <tr key={payment.id} className={`hover:bg-[#F8FAFC] transition-colors duration-150 ${isUpdating ? 'opacity-60' : ''}`}>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-[#111827]">{payment.booking.guestName}</div>
                    <div className="text-xs text-[#64748B] sm:hidden">{payment.booking.room.roomNumber}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                    <div className="text-sm font-medium text-[#111827]">
                      <span className="font-bold text-[#8E0E1C]">{payment.booking.room.roomNumber}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-[#111827]">
                      ₹{payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="text-sm font-medium text-[#64748B]">{payment.mode}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-bold rounded-full ${
                        payment.status === 'PAID'
                          ? 'bg-[#64748B] text-white'
                          : 'bg-[#8E0E1C] text-white'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                    <div className="text-sm font-medium text-[#64748B]">
                      {new Date(payment.createdAt).toLocaleDateString('en-IN')}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                    {payment.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateStatus(payment.id, 'PAID')}
                        disabled={isUpdating}
                        className={`px-3 py-2 bg-[#64748B] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold text-xs min-h-[44px] flex items-center gap-2 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        className={`px-3 py-2 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold text-xs min-h-[44px] flex items-center gap-2 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        {payments.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💳</div>
            <div className="text-lg font-semibold text-[#64748B]">No payments found</div>
          </div>
        )}
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
