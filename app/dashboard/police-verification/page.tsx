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
        maskIdNumber(guest.idNumber, guest.idType), // Mask ID number
      ])

      autoTable(doc, {
        startY: 40,
        head: [['S.No.', 'Name', 'ID Type', 'ID Number']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] },
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
        <div className="text-6xl mb-4 animate-pulse">📄</div>
        <div className="text-lg font-semibold text-slate-500">Loading active bookings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8 fade-in">
      <div className="flex justify-between items-center bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-6">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            📄 Police Verification
          </h2>
          <p className="text-slate-600 font-medium">Edit guest details before downloading the daily record</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            disabled={saving || editableBookings.length === 0}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
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
            className="px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-xl hover:from-slate-200 hover:to-slate-300 transition-all font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
          >
            ← Back
          </button>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
          <p className="text-sm font-semibold text-slate-700">
            💡 <span className="font-bold">Tip:</span> Edit guest details before downloading. You can remove bookings that should not be included in the police verification record.
          </p>
        </div>

        {editableBookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📄</div>
            <div className="text-lg font-semibold text-slate-500 mb-2">No active bookings found</div>
            <div className="text-sm text-slate-400">Create a booking first to generate police verification records</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-gradient-to-r from-indigo-600 to-purple-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    S.No.
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    👤 Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    🆔 ID Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    🔢 ID Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    🏨 Room
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    📅 Check-In
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                    ⚡ Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {editableBookings.map((booking, index) => (
                  <tr key={booking.id} className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900">{index + 1}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={booking.guestName}
                        onChange={(e) => handleUpdateBooking(index, 'guestName', e.target.value)}
                        className="px-4 py-2 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all w-full"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-700">{booking.idType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <input
                          type="text"
                          value={booking.idNumber || ''}
                          onChange={(e) => handleUpdateBooking(index, 'idNumber', e.target.value)}
                          className="px-4 py-2 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all w-full"
                          placeholder="Enter ID number"
                        />
                        {booking.idNumber && (
                          <div className="text-xs text-slate-500 mt-1 font-medium">
                            Will show as: <span className="font-bold">{maskIdNumber(booking.idNumber, booking.idType)}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-700">
                        <span className="font-bold text-indigo-600">{booking.room.roomNumber}</span>
                        <span className="text-slate-500"> ({booking.room.roomType.name})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-600">
                        {new Date(booking.checkInDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleRemoveBooking(index)}
                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all font-semibold text-xs shadow-md hover:shadow-lg transform hover:scale-105"
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
