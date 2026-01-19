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
    return <div className="text-center py-8">Loading bill history...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Bill History</h2>
          <p className="text-gray-600 mt-1">
            View all generated bills - Manual bills, Booking bills (room), and Food bills (kitchen)
          </p>
        </div>
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
              placeholder="Search by guest name or invoice number..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
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
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as 'createdAt' | 'totalAmount' | 'guestName')
                  setPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="createdAt">Date</option>
                <option value="totalAmount">Amount</option>
                <option value="guestName">Guest Name</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as 'asc' | 'desc')
                  setPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => {
            setFilterType('all')
            setPage(1)
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            filterType === 'all'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Bills
        </button>
        <button
          onClick={() => {
            setFilterType('manual')
            setPage(1)
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            filterType === 'manual'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Manual Bills (Generate Bill)
        </button>
        <button
          onClick={() => {
            setFilterType('booking')
            setPage(1)
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            filterType === 'booking'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Booking Bills (Room)
        </button>
        <button
          onClick={() => {
            setFilterType('food')
            setPage(1)
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            filterType === 'food'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Food Bills (Kitchen)
        </button>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bill Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guest Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room
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
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
                    {invoice.billNumber && (
                      <div className="text-xs text-gray-500">Sr. No: {invoice.billNumber}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.billDate
                      ? new Date(invoice.billDate).toLocaleDateString('en-IN')
                      : new Date(invoice.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.guestName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      if (invoice.isManual) {
                        return (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            Manual
                          </span>
                        )
                      }
                      if (invoice.invoiceType === 'FOOD') {
                        return (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            {invoice.invoiceType}
                          </span>
                        )
                      }
                      return (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {invoice.invoiceType}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.booking
                      ? `${invoice.booking.room.roomNumber} (${invoice.booking.room.roomType.name})`
                      : invoice.roomType || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                    ₹{invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={handleDownload}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {invoices.length === 0 && (
          <div className="text-center py-12 text-gray-500">No invoices found</div>
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
