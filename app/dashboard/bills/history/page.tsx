'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import Pagination from '@/app/components/Pagination'

interface Invoice {
  id: string
  invoiceNumber: string
  billNumber: string | null
  invoiceType: string
  isManual: boolean
  guestName: string
  roomType: string | null
  roomCharges: number
  foodCharges: number
  tariff: number
  additionalGuestCharges: number
  gstAmount: number
  totalAmount: number
  billDate: string | null
  createdAt: string
  booking: {
    id: string
    room: {
      roomNumber: string
      roomType: {
        name: string
      }
    }
  } | null
}

function BillsHistoryContent() {
  const searchParams = useSearchParams()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(Number.parseInt(searchParams.get('page') || '1'))
  const [totalPages, setTotalPages] = useState(1)
  const [filterType, setFilterType] = useState<'all' | 'manual' | 'booking' | 'food'>('manual')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [sortBy, setSortBy] = useState<'createdAt' | 'totalAmount' | 'guestName'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })

      if (filterType === 'manual') {
        params.append('isManual', 'true')
      } else if (filterType === 'booking') {
        params.append('isManual', 'false')
        params.append('type', 'ROOM') // Only show ROOM invoices for booking bills
      } else if (filterType === 'food') {
        params.append('type', 'FOOD') // Only show FOOD invoices
      }

      // Add search and filter parameters
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      if (dateFrom) {
        params.append('dateFrom', dateFrom)
      }
      if (dateTo) {
        params.append('dateTo', dateTo)
      }
      if (minAmount) {
        params.append('minAmount', minAmount)
      }
      if (maxAmount) {
        params.append('maxAmount', maxAmount)
      }
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)

      const response = await fetch(`/api/invoices?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices)
        setTotalPages(data.pagination.totalPages)
      } else {
        toast.error('Failed to fetch invoices')
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }, [page, filterType, searchQuery, dateFrom, dateTo, minAmount, maxAmount, sortBy, sortOrder])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const handleDownload = async () => {
    try {
      // You can create a download endpoint or regenerate the PDF
      toast('PDF download feature coming soon', { icon: 'ℹ️' })
    } catch {
      toast.error('Failed to download invoice')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4 animate-pulse">📜</div>
        <div className="text-lg font-semibold text-slate-500">Loading bill history...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8 fade-in">
      <div className="flex justify-between items-center bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-6">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            📜 Bill History
          </h2>
          <p className="text-slate-600 font-medium">
            View all generated bills - Manual bills, Booking bills (room), and Food bills (kitchen)
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
              placeholder="Search by guest name or invoice number..."
              className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-xl hover:from-slate-200 hover:to-slate-300 transition-all font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
          >
            {showFilters ? '🙈 Hide Filters' : '🔧 Show Filters'}
          </button>
          {(searchQuery || dateFrom || dateTo || minAmount || maxAmount) && (
            <button
              onClick={() => {
                setSearchQuery('')
                setDateFrom('')
                setDateTo('')
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
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">🔀 Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as 'createdAt' | 'totalAmount' | 'guestName')
                  setPage(1)
                }}
                className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
              >
                <option value="createdAt">Date</option>
                <option value="totalAmount">Amount</option>
                <option value="guestName">Guest Name</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">📊 Order</label>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as 'asc' | 'desc')
                  setPage(1)
                }}
                className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-3 flex-wrap border-b-2 border-slate-200 pb-2">
        <button
          onClick={() => {
            setFilterType('all')
            setPage(1)
          }}
          className={`px-6 py-3 font-bold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105 ${
            filterType === 'all'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
          }`}
        >
          📋 All Bills
        </button>
        <button
          onClick={() => {
            setFilterType('manual')
            setPage(1)
          }}
          className={`px-6 py-3 font-bold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105 ${
            filterType === 'manual'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
          }`}
        >
          ✍️ Manual Bills
        </button>
        <button
          onClick={() => {
            setFilterType('booking')
            setPage(1)
          }}
          className={`px-6 py-3 font-bold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105 ${
            filterType === 'booking'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
          }`}
        >
          🏨 Booking Bills (Room)
        </button>
        <button
          onClick={() => {
            setFilterType('food')
            setPage(1)
          }}
          className={`px-6 py-3 font-bold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105 ${
            filterType === 'food'
              ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
          }`}
        >
          🍽️ Food Bills (Kitchen)
        </button>
      </div>

      {/* Invoices Table */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-gradient-to-r from-indigo-600 to-purple-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  🧾 Invoice No.
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  📅 Bill Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  👤 Guest Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  🏷️ Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  🏨 Room
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                  💰 Total Amount
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                  ⚡ Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-900">{invoice.invoiceNumber}</div>
                    {invoice.billNumber && (
                      <div className="text-xs text-slate-500 font-medium">Sr. No: {invoice.billNumber}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-600">
                      {invoice.billDate
                        ? new Date(invoice.billDate).toLocaleDateString('en-IN')
                        : new Date(invoice.createdAt).toLocaleDateString('en-IN')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-900">{invoice.guestName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      if (invoice.isManual) {
                        return (
                          <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md">
                            Manual
                          </span>
                        )
                      }
                      if (invoice.invoiceType === 'FOOD') {
                        return (
                          <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md">
                            {invoice.invoiceType}
                          </span>
                        )
                      }
                      return (
                        <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md">
                          {invoice.invoiceType}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-600">
                      {invoice.booking
                        ? `${invoice.booking.room.roomNumber} (${invoice.booking.room.roomType.name})`
                        : invoice.roomType || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-slate-900">
                      ₹{invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold text-xs shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      📥 Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {invoices.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📭</div>
            <div className="text-lg font-semibold text-slate-500">No invoices found</div>
            <div className="text-sm text-slate-400 mt-2">Try adjusting your filters</div>
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

export default function BillsHistoryPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <BillsHistoryContent />
    </Suspense>
  )
}
