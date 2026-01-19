'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import toast from 'react-hot-toast'

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
  const [bookings, setBookings] = useState<Booking[]>([])
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
        setBookings(data)
        setEditableBookings(
          data.map((b: Booking) => ({
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
        guest.idNumber || 'N/A',
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
    return <div className="text-center py-8">Loading active bookings...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Daily Record - Police Verification</h2>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            disabled={saving || editableBookings.length === 0}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Generating...' : 'Download PDF'}
          </button>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <p className="text-sm text-gray-600 mb-4">
          Edit guest details before downloading. You can remove bookings that should not be included.
        </p>

        {editableBookings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No active bookings found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    S.No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Room
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Check-In
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {editableBookings.map((booking, index) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={booking.guestName}
                        onChange={(e) => handleUpdateBooking(index, 'guestName', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm w-full"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.idType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={booking.idNumber || ''}
                        onChange={(e) => handleUpdateBooking(index, 'idNumber', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm w-full"
                        placeholder="Enter ID number"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.room.roomNumber} ({booking.room.roomType.name})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(booking.checkInDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleRemoveBooking(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
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
