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
  const [filterType, setFilterType] = useState<'all' | 'manual' | 'booking'>('manual')

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
      }

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
  }, [page, filterType])

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
            View all generated bills - Manual bills (from Generate Bill section) and Booking bills (from checkouts)
          </p>
        </div>
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
          Booking Bills
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
