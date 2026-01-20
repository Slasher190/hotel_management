'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import toast from 'react-hot-toast'
import { maskIdNumber } from '@/lib/pdf-utils'

interface Booking {
  id: string
  guestName: string
  idType: string
  idNumber: string | null
  checkInDate: string
  room: {
    roomNumber: string
    roomType: {
      name: string
    }
  }
}

export default function PoliceVerificationPage() {
  const router = useRouter()
  const [editableBookings, setEditableBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchActiveBookings()
  }, [])

  const fetchActiveBookings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/bookings?status=ACTIVE', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const bookingsData = Array.isArray(data) ? data : (data.bookings || [])
        setEditableBookings(
          bookingsData.map((b: Booking) => ({
            ...b,
            idNumber: b.idNumber || '',
          }))
        )
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBooking = (index: number, field: keyof Booking, value: string) => {
    const updated = [...editableBookings]
    if (field === 'idNumber') {
      updated[index] = { ...updated[index], idNumber: value }
    } else if (field === 'guestName') {
      updated[index] = { ...updated[index], guestName: value }
    }
    setEditableBookings(updated)
  }

  const handleRemoveBooking = (index: number) => {
    const updated = editableBookings.filter((_, i) => i !== index)
    setEditableBookings(updated)
  }

  const handleDownload = async () => {
    setSaving(true)
    try {
      const doc = new jsPDF()

      doc.setFontSize(16)
      doc.text('Police Verification Record', 105, 20, { align: 'center' })

      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 105, 30, {
        align: 'center',
      })

      const tableData = editableBookings.map((guest, index) => [
        (index + 1).toString(),
        guest.guestName,
        guest.idType,
        maskIdNumber(guest.idNumber, guest.idType),
      ])

      autoTable(doc, {
        startY: 40,
        head: [['S.No.', 'Name', 'ID Type', 'ID Number']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [142, 14, 28] },
      })

      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
      const url = globalThis.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `police-verification-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      globalThis.URL.revokeObjectURL(url)
      a.remove()
      toast.success('PDF generated successfully!')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📄</div>
        <div className="text-lg font-semibold text-[#64748B]">Loading active bookings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#111827] mb-2">
            📄 Police Verification
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] font-medium">Edit guest details before downloading the daily record</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={handleDownload}
            disabled={saving || editableBookings.length === 0}
            className="px-4 py-2 sm:px-6 sm:py-3 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-[44px] text-sm sm:text-base"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>📥</span>
                <span>Download PDF</span>
              </>
            )}
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 sm:px-6 sm:py-3 bg-[#F8FAFC] border border-[#CBD5E1] text-[#111827] rounded-lg hover:bg-[#F1F5F9] transition-colors duration-150 font-semibold min-h-[44px] text-sm sm:text-base"
          >
            ← Back
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#CBD5E1] p-6 sm:p-8">
        <div className="mb-6 p-4 bg-[#F8FAFC] rounded-lg border border-[#CBD5E1]">
          <p className="text-sm font-semibold text-[#111827]">
            💡 <span className="font-bold">Tip:</span> Edit guest details before downloading. You can remove bookings that should not be included in the police verification record.
          </p>
        </div>

        {editableBookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📄</div>
            <div className="text-lg font-semibold text-[#64748B] mb-2">No active bookings found</div>
            <div className="text-sm text-[#94A3B8]">Create a booking first to generate police verification records</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#CBD5E1]">
              <thead className="bg-[#8E0E1C]">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    S.No.
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    👤 Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    🆔 ID Type
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    🔢 ID Number
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider hidden sm:table-cell">
                    🏨 Room
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider hidden md:table-cell">
                    📅 Check-In
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                    ⚡ Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#CBD5E1]">
                {editableBookings.map((booking, index) => (
                  <tr key={booking.id} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-[#111827]">{index + 1}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={booking.guestName}
                        onChange={(e) => handleUpdateBooking(index, 'guestName', e.target.value)}
                        className="px-3 py-2 sm:px-4 sm:py-2 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white w-full"
                      />
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[#111827]">{booking.idType}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div>
                        <input
                          type="text"
                          value={booking.idNumber || ''}
                          onChange={(e) => handleUpdateBooking(index, 'idNumber', e.target.value)}
                          className="px-3 py-2 sm:px-4 sm:py-2 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white w-full"
                          placeholder="Enter ID number"
                        />
                        {booking.idNumber && (
                          <div className="text-xs text-[#64748B] mt-1 font-medium">
                            Will show as: <span className="font-bold">{maskIdNumber(booking.idNumber, booking.idType)}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="text-sm font-medium text-[#111827]">
                        <span className="font-bold text-[#8E0E1C]">{booking.room.roomNumber}</span>
                        <span className="text-[#64748B]"> ({booking.room.roomType.name})</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm font-medium text-[#64748B]">
                        {new Date(booking.checkInDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleRemoveBooking(index)}
                        className="px-3 py-2 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold text-xs min-h-[44px] flex items-center"
                      >
                        🗑️ Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
