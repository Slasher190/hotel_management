'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Invoice {
  id: string
  invoiceNumber: string
  guestName: string
  foodCharges: number
  gstAmount: number
  totalAmount: number
  createdAt: string
  booking: {
    id: string
    room: {
      roomNumber: string
      roomType: {
        name: string
      }
    }
  }
}

interface Summary {
  totalInvoices: number
  totalAmount: number
  totalGst: number
  totalFoodCharges: number
}

export default function KitchenBillsPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [summary, setSummary] = useState<Summary>({
    totalInvoices: 0,
    totalAmount: 0,
    totalGst: 0,
    totalFoodCharges: 0,
  })
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  )

  useEffect(() => {
    fetchKitchenBills()
  }, [selectedMonth])

  const fetchKitchenBills = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/kitchen-bills?month=${selectedMonth}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices || [])
        setSummary(data.summary || {
          totalInvoices: 0,
          totalAmount: 0,
          totalGst: 0,
          totalFoodCharges: 0,
        })
      } else {
        toast.error('Failed to fetch kitchen bills')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadBill = async (bookingId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/bookings/${bookingId}/food-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          showGst: true,
          gstPercent: 5,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = globalThis.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `kitchen-bill-${Date.now()}.pdf`
        document.body.appendChild(a)
        a.click()
        globalThis.URL.revokeObjectURL(url)
        a.remove()
        toast.success('Kitchen bill downloaded successfully!')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to download bill')
      }
    } catch {
      toast.error('An error occurred while downloading bill')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading kitchen bills...</div>
  }

  return (
    <div className="space-y-8 fade-in">
      <div className="flex justify-between items-center bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-6">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            🍳 Kitchen Bills
          </h2>
          <p className="text-slate-600 font-medium">View monthly kitchen bills and food invoices</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm font-semibold text-slate-700">📅 Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-8 card-hover">
          <p className="text-sm font-semibold text-slate-600 mb-2">🧾 Total Invoices</p>
          <p className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">{summary.totalInvoices}</p>
        </div>
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-8 card-hover">
          <p className="text-sm font-semibold text-slate-600 mb-2">🍽️ Total Food Charges</p>
          <p className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            ₹{summary.totalFoodCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-8 card-hover">
          <p className="text-sm font-semibold text-slate-600 mb-2">🧾 Total GST</p>
          <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            ₹{summary.totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-8 card-hover">
          <p className="text-sm font-semibold text-slate-600 mb-2">💰 Total Amount</p>
          <p className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            ₹{summary.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {invoices.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🍳</div>
            <p className="text-lg font-semibold text-slate-500">No kitchen bills found for this month</p>
            <p className="text-sm text-slate-400 mt-2">Kitchen bills will appear here once generated</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-gradient-to-r from-indigo-600 to-purple-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">🧾 Invoice #</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">👤 Guest Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">🏨 Room</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase">🍽️ Food Charges</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase">🧾 GST</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase">💰 Total</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">📅 Date</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase">⚡ Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-900">{invoice.invoiceNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-900">{invoice.guestName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-700">
                      <span className="font-bold text-indigo-600">{invoice.booking.room.roomNumber}</span>
                      <span className="text-slate-500"> ({invoice.booking.room.roomType.name})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-slate-900">
                      ₹{invoice.foodCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-slate-600">
                      ₹{(invoice.gstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-slate-900">
                      ₹{invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-600">
                      {new Date(invoice.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleDownloadBill(invoice.booking.id)}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold text-xs shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      📥 Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
