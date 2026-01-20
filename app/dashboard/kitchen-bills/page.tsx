'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Modal from '@/app/components/Modal'

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
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; invoiceId: string | null; invoiceNumber: string }>({
    isOpen: false,
    invoiceId: null,
    invoiceNumber: '',
  })

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

  const confirmDeleteInvoice = async () => {
    if (!deleteModal.invoiceId) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/invoices/${deleteModal.invoiceId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast.success('Kitchen bill deleted successfully!')
        fetchKitchenBills()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete kitchen bill')
      }
    } catch {
      toast.error('An error occurred while deleting kitchen bill')
    } finally {
      setDeleteModal({ isOpen: false, invoiceId: null, invoiceNumber: '' })
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🍳</div>
        <div className="text-lg font-semibold text-[#64748B]">Loading kitchen bills...</div>
      </div>
    )
  }

  return (
    <>
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, invoiceId: null, invoiceNumber: '' })}
        onConfirm={confirmDeleteInvoice}
        title="Delete Kitchen Bill"
        message={`Are you sure you want to delete invoice "${deleteModal.invoiceNumber}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-[#8E0E1C] hover:opacity-90"
      />
      <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#111827] mb-2">
            🍳 Kitchen Bills
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] font-medium">View monthly kitchen bills and food invoices</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm font-semibold text-[#111827]">📅 Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg border border-[#CBD5E1] p-6 sm:p-8">
          <p className="text-sm font-semibold text-[#64748B] mb-2">🧾 Total Invoices</p>
          <p className="text-2xl sm:text-4xl font-bold text-[#111827]">{summary.totalInvoices}</p>
        </div>
        <div className="bg-white rounded-lg border border-[#CBD5E1] p-6 sm:p-8">
          <p className="text-sm font-semibold text-[#64748B] mb-2">🍽️ Total Food Charges</p>
          <p className="text-2xl sm:text-4xl font-bold text-[#111827]">
            ₹{summary.totalFoodCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-[#CBD5E1] p-6 sm:p-8">
          <p className="text-sm font-semibold text-[#64748B] mb-2">🧾 Total GST</p>
          <p className="text-2xl sm:text-4xl font-bold text-[#111827]">
            ₹{summary.totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-[#CBD5E1] p-6 sm:p-8">
          <p className="text-sm font-semibold text-[#64748B] mb-2">💰 Total Amount</p>
          <p className="text-2xl sm:text-4xl font-bold text-[#111827]">
            ₹{summary.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg border border-[#CBD5E1] overflow-hidden">
        {invoices.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🍳</div>
            <p className="text-lg font-semibold text-[#64748B]">No kitchen bills found for this month</p>
            <p className="text-sm text-[#94A3B8] mt-2">Kitchen bills will appear here once generated</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#CBD5E1]">
              <thead className="bg-[#8E0E1C]">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase">🧾 Invoice #</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase">👤 Guest Name</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase hidden sm:table-cell">🏨 Room</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-bold text-white uppercase">🍽️ Food Charges</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-bold text-white uppercase hidden md:table-cell">🧾 GST</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-bold text-white uppercase">💰 Total</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase hidden lg:table-cell">📅 Date</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs font-bold text-white uppercase">⚡ Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#CBD5E1]">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-[#111827]">{invoice.invoiceNumber}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-[#111827]">{invoice.guestName}</div>
                      <div className="text-xs text-[#64748B] sm:hidden">{invoice.booking.room.roomNumber}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="text-sm font-medium text-[#111827]">
                        <span className="font-bold text-[#8E0E1C]">{invoice.booking.room.roomNumber}</span>
                        <span className="text-[#64748B]"> ({invoice.booking.room.roomType.name})</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                      <div className="text-sm font-bold text-[#111827] break-words">
                        ₹{invoice.foodCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right hidden md:table-cell">
                      <div className="text-sm font-medium text-[#64748B] break-words">
                        ₹{(invoice.gstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                      <div className="text-sm font-bold text-[#111827] break-words">
                        ₹{invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm font-medium text-[#64748B]">
                        {new Date(invoice.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDownloadBill(invoice.booking.id)}
                          className="px-3 py-2 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold text-xs min-h-[44px] inline-flex items-center"
                        >
                          📥 Download
                        </button>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber })}
                          className="px-3 py-2 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold text-xs min-h-[44px] inline-flex items-center"
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
        )}
      </div>
    </div>
    </>
  )
}
