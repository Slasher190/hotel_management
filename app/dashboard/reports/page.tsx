'use client'

import { useEffect, useState, Suspense, useCallback } from 'react'

interface ReportData {
  bookings: Array<{
    id: string
    guestName: string
    guestGstNumber?: string | null
    roomPrice: number
    checkInDate: string
    checkoutDate: string | null
    status: string
    billNumber?: string | null
    companyName?: string | null
    room: {
      roomNumber: string
      roomType: {
        name: string
      }
    }
    invoices: Array<{
      invoiceNumber: string
      companyName?: string | null
      totalAmount: number
      gstEnabled: boolean
      gstAmount: number
      guestGstNumber?: string | null
    }>
    payments: Array<{
      status: string
      amount: number
    }>
  }>
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  summary: {
    totalBookings: number
    totalRevenue: number
    gstRevenue: number
    paidAmount: number
    pendingAmount: number
  }
}

function ReportsContent() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [gstFilter, setGstFilter] = useState(false)
  const [paymentFilter, setPaymentFilter] = useState('')
  const [userRole, setUserRole] = useState('')

  const [page, setPage] = useState(1)
  const limit = 10

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUserRole(payload.role || '')
      } catch (e) { }
    }
  }, [])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [month, gstFilter, paymentFilter])

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        month,
        page: page.toString(),
        limit: limit.toString(),
        ...(gstFilter && { gst: 'true' }),
        ...(paymentFilter && { paymentStatus: paymentFilter }),
      })

      const response = await fetch(`/api/reports?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch {
      // Error handled by console.error
    } finally {
      setLoading(false)
    }
  }, [month, gstFilter, paymentFilter, page])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleExport = async (format: 'excel' | 'csv') => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        month,
        format,
        ...(gstFilter && { gst: 'true' }),
        ...(paymentFilter && { paymentStatus: paymentFilter }),
      })

      const response = await fetch(`/api/reports/export?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = globalThis.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report-${month}.${format === 'excel' ? 'xlsx' : 'csv'}`
        document.body.appendChild(a)
        a.click()
        globalThis.URL.revokeObjectURL(url)
        a.remove()
      }
    } catch {
      // Error handled by console.error
    }
  }

  if (!reportData && !loading) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📊</div>
        <div className="text-lg font-semibold text-[#64748B]">No data available</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#111827] mb-2">
            📊 Reports
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] font-medium">View and export monthly booking reports</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => handleExport('excel')}
            className="px-4 py-2 sm:px-6 sm:py-3 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold flex items-center gap-2 min-h-[44px] text-sm sm:text-base"
          >
            <span>📊</span>
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 sm:px-6 sm:py-3 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold flex items-center gap-2 min-h-[44px] text-sm sm:text-base"
          >
            <span>📄</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {userRole !== 'STAFF' && reportData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
            <div className="text-sm font-semibold text-[#64748B] mb-2">📋 Total Bookings</div>
            <div className="text-2xl sm:text-4xl font-bold text-[#111827]">{reportData.summary.totalBookings}</div>
          </div>
          <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
            <div className="text-sm font-semibold text-[#64748B] mb-2">💰 Total Revenue</div>
            <div className="text-2xl sm:text-4xl font-bold text-[#111827]">
              ₹{reportData.summary.totalRevenue.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
            <div className="text-sm font-semibold text-[#64748B] mb-2">🧾 GST Revenue</div>
            <div className="text-2xl sm:text-4xl font-bold text-[#111827]">
              ₹{reportData.summary.gstRevenue.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
            <div className="text-sm font-semibold text-[#64748B] mb-2">⏳ Pending Payments</div>
            <div className="text-2xl sm:text-4xl font-bold text-[#111827]">
              ₹{reportData.summary.pendingAmount.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-[#CBD5E1] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6 flex-wrap">
          <div>
            <label htmlFor="month" className="block text-sm font-semibold text-[#111827] mb-3">📅 Month</label>
            <input
              id="month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-3">🔧 Filters</label>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <label className="flex items-center p-3 bg-[#F8FAFC] rounded-lg cursor-pointer hover:bg-[#F1F5F9] transition-colors duration-150 border border-[#CBD5E1]">
                <input
                  type="checkbox"
                  checked={gstFilter}
                  onChange={(e) => setGstFilter(e.target.checked)}
                  className="w-5 h-5 text-[#8E0E1C] border-[#CBD5E1] rounded focus:ring-[#8E0E1C] cursor-pointer"
                />
                <span className="ml-3 text-sm font-semibold text-[#111827]">🧾 GST Only</span>
              </label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="px-4 py-3 border border-[#CBD5E1] rounded-lg text-sm text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
              >
                <option value="">All Payments</option>
                <option value="PAID">Paid Only</option>
                <option value="PENDING">Pending Only</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📊</div>
            <div className="text-lg font-semibold text-[#64748B]">Loading reports...</div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#CBD5E1]">
                <thead className="bg-[#8E0E1C]">
                  <tr>
                    <th className="px-4 text-left text-xs font-bold text-white uppercase">Date</th>
                    <th className="px-4 text-left text-xs font-bold text-white uppercase">Bill No</th>
                    <th className="px-4 text-left text-xs font-bold text-white uppercase">Name</th>
                    <th className="px-4 text-left text-xs font-bold text-white uppercase">Company</th>
                    <th className="px-4 text-left text-xs font-bold text-white uppercase">GSTIN</th>
                    <th className="px-4 text-left text-xs font-bold text-white uppercase">GST Amount</th>
                    <th className="px-4 text-left text-xs font-bold text-white uppercase">Payment</th>
                    <th className="px-4 text-left text-xs font-bold text-white uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#CBD5E1]">
                  {reportData?.bookings.map((booking: any) => {
                    const invoice = booking.invoices?.[0]
                    const date = booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString('en-IN') : '-'
                    const billNo = booking.billNumber || invoice?.invoiceNumber || '-'
                    const company = booking.companyName || invoice?.companyName || '-'
                    const gstAmount = invoice?.gstAmount ? `₹${invoice.gstAmount.toLocaleString('en-IN')}` : '-'
                    const total = invoice?.totalAmount || booking.roomPrice || 0
                    const gstNumber = invoice?.guestGstNumber || booking.guestGstNumber || '-'

                    return (
                      <tr key={booking.id} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                        <td className="px-4 py-3 text-sm text-[#111827] font-medium">{date}</td>
                        <td className="px-4 py-3 text-sm text-[#111827]">{billNo}</td>
                        <td className="px-4 py-3 text-sm text-[#111827] font-bold">{booking.guestName}</td>
                        <td className="px-4 py-3 text-sm text-[#64748B]">{company}</td>
                        <td className="px-4 py-3 text-sm text-[#111827] font-mono">{gstNumber}</td>
                        <td className="px-4 py-3 text-sm text-[#111827]">{gstAmount}</td>
                        <td className="px-4 py-3 text-sm text-[#111827]">
                          {booking.payments?.length > 0
                            ? <span className={`px-2 py-1 rounded-full text-xs font-semibold ${booking.payments[0].status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {booking.payments[0].status}
                            </span>
                            : <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-[#8E0E1C]">
                          ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {reportData && reportData.pagination && reportData.pagination.totalPages > 1 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#CBD5E1]">
                <div className="text-sm text-[#64748B]">
                  Showing page <span className="font-semibold text-[#111827]">{page}</span> of <span className="font-semibold text-[#111827]">{reportData.pagination.totalPages}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm font-medium text-[#111827] bg-white border border-[#CBD5E1] rounded-lg hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(reportData.pagination.totalPages, p + 1))}
                    disabled={page >= reportData.pagination.totalPages}
                    className="px-4 py-2 text-sm font-medium text-[#111827] bg-white border border-[#CBD5E1] rounded-lg hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {reportData?.bookings.length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📊</div>
                <div className="text-lg font-semibold text-[#64748B]">No bookings found for this month</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading reports...</div>}>
      <ReportsContent />
    </Suspense>
  )
}
