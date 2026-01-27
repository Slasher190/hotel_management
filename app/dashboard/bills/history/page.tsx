'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import Pagination from '@/app/components/Pagination'
import Modal from '@/app/components/Modal'

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
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; invoiceId: string | null; invoiceNumber: string }>({
    isOpen: false,
    invoiceId: null,
    invoiceNumber: '',
  })

  const [searchLoading, setSearchLoading] = useState(false)

  const fetchInvoices = useCallback(async () => {
    try {
      // Only show full screen loader on initial load, not on search/filter
      if (page === 1 && !searchQuery && !dateFrom && !dateTo && !minAmount && !maxAmount) {
        setLoading(true)
      } else {
        setSearchLoading(true)
      }
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })

      if (filterType === 'manual') {
        params.append('isManual', 'true')
      } else if (filterType === 'booking') {
        params.append('isManual', 'false')
        params.append('type', 'ROOM')
      } else if (filterType === 'food') {
        params.append('type', 'FOOD')
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
      setSearchLoading(false)
    }
  }, [page, filterType, searchQuery, dateFrom, dateTo, minAmount, maxAmount, sortBy, sortOrder])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const handleDownload = async (invoiceId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/invoices/${invoiceId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = globalThis.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoiceId}.pdf`
        document.body.appendChild(a)
        a.click()
        globalThis.URL.revokeObjectURL(url)
        a.remove()
        toast.success('Invoice downloaded successfully!')
      } else {
        toast.error('Failed to download invoice')
      }
    } catch {
      toast.error('An error occurred while downloading invoice')
    }
  }

  const handlePrintFiltered = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (filterType === 'manual') {
        params.append('isManual', 'true')
      } else if (filterType === 'booking') {
        params.append('isManual', 'false')
        params.append('type', 'ROOM')
      } else if (filterType === 'food') {
        params.append('type', 'FOOD')
      }
      if (searchQuery) params.append('search', searchQuery)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)
      if (minAmount) params.append('minAmount', minAmount)
      if (maxAmount) params.append('maxAmount', maxAmount)
      params.append('format', 'pdf')
      params.append('showAll', 'true')

      // Fetch all invoices matching filters
      const allParams = new URLSearchParams(params.toString())
      allParams.append('showAll', 'true')
      const invoicesResponse = await fetch(`/api/invoices?${allParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!invoicesResponse.ok) {
        toast.error('Failed to fetch invoices')
        return
      }
      const invoicesData = await invoicesResponse.json()
      const allInvoices = invoicesData.invoices || []

      // Generate PDF report
      const response = await fetch(`/api/invoices/export?${params.toString()}&format=pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = globalThis.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `bills-${Date.now()}.pdf`
        document.body.appendChild(a)
        a.click()
        globalThis.URL.revokeObjectURL(url)
        a.remove()
        toast.success('PDF generated successfully!')
      } else {
        toast.error('Failed to generate PDF')
      }
    } catch {
      toast.error('An error occurred while generating PDF')
    }
  }

  const confirmDeleteInvoice = async () => {
    if (!deleteModal.invoiceId) return

    try {
      const token = localStorage.getItem('token')
      const invoice = invoices.find((inv) => inv.id === deleteModal.invoiceId)

      // If it's a booking bill, delete associated food bills
      if (invoice && invoice.invoiceType === 'ROOM' && !invoice.isManual && invoice.booking) {
        // Delete all food bills for this booking
        const foodInvoicesResponse = await fetch(`/api/invoices?type=FOOD&bookingId=${invoice.booking.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (foodInvoicesResponse.ok) {
          const foodData = await foodInvoicesResponse.json()
          const foodInvoices = foodData.invoices || []
          for (const foodInvoice of foodInvoices) {
            await fetch(`/api/invoices/${foodInvoice.id}`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
          }
        }
      }

      const response = await fetch(`/api/invoices/${deleteModal.invoiceId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast.success('Bill deleted successfully!')
        fetchInvoices()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete bill')
      }
    } catch {
      toast.error('An error occurred while deleting bill')
    } finally {
      setDeleteModal({ isOpen: false, invoiceId: null, invoiceNumber: '' })
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📜</div>
        <div className="text-lg font-semibold text-[#64748B]">Loading bill history...</div>
      </div>
    )
  }

  return (
    <>
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, invoiceId: null, invoiceNumber: '' })}
        onConfirm={confirmDeleteInvoice}
        title="Delete Bill"
        message={`Are you sure you want to delete invoice "${deleteModal.invoiceNumber}"? If this is a booking bill, all associated food bills will also be deleted. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-[#8E0E1C] hover:opacity-90"
      />
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
          <div>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#111827] mb-2">
              📜 Bill History
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] font-medium">
              View all generated bills - Manual bills and Booking bills (room)
            </p>
          </div>
          <button
            onClick={handlePrintFiltered}
            className="px-4 py-3 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold min-h-[44px] text-sm sm:text-base"
          >
            🖨️ Print Filtered PDF
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label htmlFor="search" className="block text-sm font-semibold text-[#111827] mb-2">🔍 Search</label>
              <div className="relative">
                <input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                  placeholder="Search by guest name or invoice number..."
                  className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="animate-spin h-5 w-5 text-[#8E0E1C]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 bg-[#F8FAFC] border border-[#CBD5E1] text-[#111827] rounded-lg hover:bg-[#F1F5F9] transition-colors duration-150 font-semibold min-h-[44px] text-sm sm:text-base"
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
              <div>
                <label htmlFor="sortBy" className="block text-sm font-semibold text-[#111827] mb-2">🔀 Sort By</label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as 'createdAt' | 'totalAmount' | 'guestName')
                    setPage(1)
                  }}
                  className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                >
                  <option value="createdAt">Date</option>
                  <option value="totalAmount">Amount</option>
                  <option value="guestName">Guest Name</option>
                </select>
              </div>
              <div>
                <label htmlFor="sortOrder" className="block text-sm font-semibold text-[#111827] mb-2">📊 Order</label>
                <select
                  id="sortOrder"
                  value={sortOrder}
                  onChange={(e) => {
                    setSortOrder(e.target.value as 'asc' | 'desc')
                    setPage(1)
                  }}
                  className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 sm:gap-3 flex-wrap border-b border-[#CBD5E1] pb-2">
          <button
            onClick={() => {
              setFilterType('all')
              setPage(1)
            }}
            className={`px-4 py-2 sm:px-6 sm:py-3 font-bold rounded-lg transition-colors duration-150 min-h-[44px] flex items-center ${filterType === 'all'
              ? 'bg-[#8E0E1C] text-white'
              : 'bg-white text-[#111827] hover:bg-[#F8FAFC] border border-[#CBD5E1]'
              }`}
          >
            📋 All Bills
          </button>
          <button
            onClick={() => {
              setFilterType('manual')
              setPage(1)
            }}
            className={`px-4 py-2 sm:px-6 sm:py-3 font-bold rounded-lg transition-colors duration-150 min-h-[44px] flex items-center ${filterType === 'manual'
              ? 'bg-[#8E0E1C] text-white'
              : 'bg-white text-[#111827] hover:bg-[#F8FAFC] border border-[#CBD5E1]'
              }`}
          >
            ✍️ Manual Bills
          </button>
          <button
            onClick={() => {
              setFilterType('booking')
              setPage(1)
            }}
            className={`px-4 py-2 sm:px-6 sm:py-3 font-bold rounded-lg transition-colors duration-150 min-h-[44px] flex items-center ${filterType === 'booking'
              ? 'bg-[#8E0E1C] text-white'
              : 'bg-white text-[#111827] hover:bg-[#F8FAFC] border border-[#CBD5E1]'
              }`}
          >
            🏨 Booking Bills (Room)
          </button>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg border border-[#CBD5E1] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#CBD5E1]">
              <thead className="bg-[#8E0E1C]">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    🧾 Invoice No.
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider hidden sm:table-cell">
                    📅 Bill Date
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    👤 Guest Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    🏷️ Type
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider hidden md:table-cell">
                    🏨 Room
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                    💰 Total Amount
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                    ⚡ Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#CBD5E1]">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-[#111827]">{invoice.invoiceNumber}</div>
                      {invoice.billNumber && (
                        <div className="text-xs text-[#64748B] font-medium">Sr. No: {invoice.billNumber}</div>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="text-sm font-medium text-[#64748B]">
                        {invoice.billDate
                          ? new Date(invoice.billDate).toLocaleDateString('en-IN')
                          : new Date(invoice.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-[#111827]">{invoice.guestName}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {(() => {
                        if (invoice.isManual) {
                          return (
                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-[#8E0E1C] text-white">
                              Manual
                            </span>
                          )
                        }
                        if (invoice.invoiceType === 'FOOD') {
                          return (
                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-[#8E0E1C] text-white">
                              {invoice.invoiceType}
                            </span>
                          )
                        }
                        return (
                          <span className="px-2 py-1 text-xs font-bold rounded-full bg-[#64748B] text-white">
                            {invoice.invoiceType}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm font-medium text-[#64748B]">
                        {invoice.booking
                          ? `${invoice.booking.room.roomNumber} (${invoice.booking.room.roomType.name})`
                          : invoice.roomType || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-[#111827]">
                        ₹{invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDownload(invoice.id)}
                          className="px-3 py-2 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold text-xs min-h-[44px] flex items-center"
                        >
                          📥 Download
                        </button>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber })}
                          className="px-3 py-2 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold text-xs min-h-[44px] flex items-center"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {invoices.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📭</div>
              <div className="text-lg font-semibold text-[#64748B]">No invoices found</div>
              <div className="text-sm text-[#94A3B8] mt-2">Try adjusting your filters</div>
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
    </>
  )
}

export default function BillsHistoryPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <BillsHistoryContent />
    </Suspense>
  )
}
