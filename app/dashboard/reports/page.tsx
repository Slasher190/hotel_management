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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Reports</h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('excel')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Export Excel
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total Bookings</div>
          <div className="text-2xl font-bold text-gray-900">{reportData.summary.totalBookings}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total Revenue</div>
          <div className="text-2xl font-bold text-indigo-600">
            ₹{reportData.summary.totalRevenue.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">GST Revenue</div>
          <div className="text-2xl font-bold text-purple-600">
            ₹{reportData.summary.gstRevenue.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Pending Payments</div>
          <div className="text-2xl font-bold text-orange-600">
            ₹{reportData.summary.pendingAmount.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filters</label>
            <div className="flex gap-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={gstFilter}
                  onChange={(e) => setGstFilter(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-900 font-medium">GST Only</span>
              </label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
              >
                <option value="">All Payments</option>
                <option value="PAID">Paid Only</option>
                <option value="PENDING">Pending Only</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Guest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Check-In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Payment
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.bookings.map((booking) => {
                const invoice = booking.invoices[0]
                const payment = booking.payments[0]
                return (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {booking.guestName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.room.roomNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(booking.checkInDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{(invoice?.totalAmount || booking.roomPrice).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          payment?.status === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
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
