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
  purpose?: string
  adults: number
  children: number
  additionalGuests: number
  room: {
    roomNumber: string
    roomType: {
      name: string
    }
  }
  mobileNumber?: string
}

export default function PoliceVerificationPage() {
  const router = useRouter()
  const [editableBookings, setEditableBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Single Date Filter - Defaults to Today
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchActiveBookings(selectedDate)
  }, [selectedDate])

  const fetchActiveBookings = async (date: string) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        status: 'ACTIVE',
        showAll: 'true',
        dateFrom: date,
        dateTo: date, // Single date range
      })

      const response = await fetch(`/api/bookings?${params.toString()}`, {
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
            adults: b.adults || 1,
            children: b.children || 0,
            additionalGuests: b.additionalGuests || 0,
            purpose: b.purpose || '',
            mobileNumber: b.mobileNumber || '',
          }))
        )
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBooking = (index: number, field: keyof Booking, value: string | number) => {
    const updated = [...editableBookings]
    if (field === 'idNumber' || field === 'guestName' || field === 'purpose' || field === 'mobileNumber') {
      updated[index] = { ...updated[index], [field]: value }
    }
    setEditableBookings(updated)
  }

  const handleRemoveBooking = (index: number) => {
    const updated = editableBookings.filter((_, i) => i !== index)
    setEditableBookings(updated)
  }

  const handleAddRecord = () => {
    const newRecord: Booking = {
      id: `temp-${Date.now()}`,
      guestName: '',
      idType: 'AADHAAR',
      idNumber: '',
      purpose: '',
      adults: 1,
      children: 0,
      additionalGuests: 0,
      checkInDate: new Date().toISOString(),
      room: {
        roomNumber: '',
        roomType: {
          name: '',
        },
      },
      mobileNumber: '',
    }
    setEditableBookings([...editableBookings, newRecord])
  }

  const handleDownload = async () => {
    setSaving(true)
    try {
      const doc = new jsPDF()

      doc.setFontSize(16)
      doc.text('Police Verification Record', 105, 20, { align: 'center' })

      doc.setFontSize(10)
      doc.text(`Date: ${selectedDate}`, 105, 30, {
        align: 'center',
      })

      const tableData = editableBookings.map((guest, index) => {
        const totalPeople = (guest.adults || 0) + (guest.children || 0) + (guest.additionalGuests || 0)
        return [
          (index + 1).toString(),
          guest.guestName,
          guest.room.roomNumber || 'N/A',
          totalPeople.toString(),
          guest.purpose || '-',
          guest.mobileNumber || '-',
          maskIdNumber(guest.idNumber, guest.idType),
        ]
      })

      autoTable(doc, {
        startY: 40,
        head: [['S.No.', 'Name', 'Room No', 'No. of People', 'Purpose', 'Mobile', 'Last 4 Digits ID']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [142, 14, 28] },
        styles: { fontSize: 8 },
      })

      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
      const url = globalThis.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `police-verification-${selectedDate}.pdf`
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

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#111827] mb-2">
            📄 Police Verification
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] font-medium">Daily record of guests for police submission</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto items-center">

          <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2">
            <span className="text-sm font-semibold text-[#111827]">📅 Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-medium"
            />
          </div>

          <button
            onClick={handleAddRecord}
            className="px-4 py-2 sm:px-6 sm:py-3 bg-[#F8FAFC] border border-[#CBD5E1] text-[#111827] rounded-lg hover:bg-[#F1F5F9] transition-colors duration-150 font-semibold flex items-center gap-2 min-h-[44px] text-sm sm:text-base"
          >
            <span>➕ Add Row</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={saving || editableBookings.length === 0}
            className="px-4 py-2 sm:px-6 sm:py-3 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-[44px] text-sm sm:text-base"
          >
            {saving ? 'Generating...' : '📥 Download PDF'}
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
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : editableBookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📄</div>
            <div className="text-lg font-semibold text-[#64748B] mb-2">No active bookings found for {selectedDate}</div>
            <div className="text-sm text-[#94A3B8]">Change date or add a record manually</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#CBD5E1]">
              <thead className="bg-[#8E0E1C]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">S.No.</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Room No</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">No. of People</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Purpose</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Mobile</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Last 4 Digits ID</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#CBD5E1]">
                {editableBookings.map((booking, index) => {
                  const totalPeople = (booking.adults || 1) + (booking.children || 0) + (booking.additionalGuests || 0)
                  return (
                    <tr key={booking.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3 font-bold">{index + 1}</td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={booking.guestName}
                          onChange={(e) => handleUpdateBooking(index, 'guestName', e.target.value)}
                          className="px-2 py-1 border rounded w-full"
                        />
                      </td>
                      <td className="px-4 py-3 font-bold text-[#8E0E1C]">{booking.room.roomNumber || '-'}</td>
                      <td className="px-4 py-3">
                        {totalPeople}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={booking.purpose || ''}
                          onChange={(e) => handleUpdateBooking(index, 'purpose', e.target.value)}
                          className="px-2 py-1 border rounded w-full"
                          placeholder="Purpose"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={booking.mobileNumber || ''}
                          onChange={(e) => handleUpdateBooking(index, 'mobileNumber', e.target.value)}
                          className="px-2 py-1 border rounded w-full"
                          placeholder="Mobile"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <input
                            type="text"
                            value={booking.idNumber || ''}
                            onChange={(e) => handleUpdateBooking(index, 'idNumber', e.target.value)}
                            className="px-2 py-1 border rounded w-full mb-1"
                            placeholder="Full ID Number"
                          />
                          <div className="text-xs text-gray-500">
                            {maskIdNumber(booking.idNumber, booking.idType)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRemoveBooking(index)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
