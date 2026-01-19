'use client'

import { useEffect, useState, Suspense, useCallback } from 'react'

interface ReportData {
  bookings: Array<{
    id: string
    guestName: string
    roomPrice: number
    checkInDate: string
    checkoutDate: string | null
    status: string
    room: {
      roomNumber: string
      roomType: {
        name: string
      }
    }
    invoices: Array<{
      totalAmount: number
      gstEnabled: boolean
      gstAmount: number
    }>
    payments: Array<{
      status: string
      amount: number
    }>
  }>
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

  const fetchReports = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        month,
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
  }, [month, gstFilter, paymentFilter])

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

  if (loading) {
    return <div className="text-center py-8">Loading reports...</div>
  }

  if (!reportData) {
    return <div className="text-center py-8">No data available</div>
  }

  return (
    <div className="space-y-8 fade-in">
      <div className="flex justify-between items-center bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-6">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            📊 Reports
          </h2>
          <p className="text-slate-600 font-medium">View and export monthly booking reports</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleExport('excel')}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
          >
            <span>📊</span>
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
          >
            <span>📄</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-6 card-hover">
          <div className="text-sm font-semibold text-slate-600 mb-2">📋 Total Bookings</div>
          <div className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">{reportData.summary.totalBookings}</div>
        </div>
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-6 card-hover">
          <div className="text-sm font-semibold text-slate-600 mb-2">💰 Total Revenue</div>
          <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            ₹{reportData.summary.totalRevenue.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-6 card-hover">
          <div className="text-sm font-semibold text-slate-600 mb-2">🧾 GST Revenue</div>
          <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            ₹{reportData.summary.gstRevenue.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-6 card-hover">
          <div className="text-sm font-semibold text-slate-600 mb-2">⏳ Pending Payments</div>
          <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            ₹{reportData.summary.pendingAmount.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="flex gap-6 mb-6 flex-wrap">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">📅 Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">🔧 Filters</label>
            <div className="flex gap-4 items-center">
              <label className="flex items-center p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-all">
                <input
                  type="checkbox"
                  checked={gstFilter}
                  onChange={(e) => setGstFilter(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <span className="ml-3 text-sm font-semibold text-slate-900">🧾 GST Only</span>
              </label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="px-5 py-3 border-2 border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
              >
                <option value="">All Payments</option>
                <option value="PAID">Paid Only</option>
                <option value="PENDING">Pending Only</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-gradient-to-r from-indigo-600 to-purple-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">
                  👤 Guest
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">
                  🏨 Room
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">
                  📅 Check-In
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">
                  💰 Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">
                  💳 Payment
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {reportData.bookings.map((booking) => {
                const invoice = booking.invoices[0]
                const payment = booking.payments[0]
                return (
                  <tr key={booking.id} className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900">{booking.guestName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-700">{booking.room.roomNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-600">
                        {new Date(booking.checkInDate).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900">
                        ₹{(invoice?.totalAmount || booking.roomPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1.5 text-xs font-bold rounded-full shadow-md ${
                          payment?.status === 'PAID'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                            : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                        }`}
                      >
                        {payment?.status || 'N/A'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
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
