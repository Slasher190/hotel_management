'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import Modal from '@/app/components/Modal'

interface BusBooking {
  id: string
  busNumber: string
  fromDate: string
  toDate: string
  status: 'BOOKED' | 'PENDING'
  notes: string | null
}

function ToursContent() {
  const searchParams = useSearchParams()
  const [bookings, setBookings] = useState<BusBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(
    searchParams.get('date') || new Date().toISOString().split('T')[0]
  )
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; bookingId: string | null; busNumber: string }>({
    isOpen: false,
    bookingId: null,
    busNumber: '',
  })
  const [formData, setFormData] = useState({
    busNumber: '',
    fromDate: selectedDate,
    toDate: selectedDate,
    status: 'PENDING' as 'BOOKED' | 'PENDING',
    notes: '',
  })

  useEffect(() => {
    fetchBookings()
  }, [selectedDate])

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/bus-bookings?date=${selectedDate}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      }
    } catch (error) {
      console.error('Error fetching bus bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.busNumber || !formData.fromDate || !formData.toDate) {
      toast.error('All fields are required')
      return
    }

    if (new Date(formData.fromDate) > new Date(formData.toDate)) {
      toast.error('From date cannot be after to date')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/bus-bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowAddModal(false)
        setFormData({
          busNumber: '',
          fromDate: selectedDate,
          toDate: selectedDate,
          status: 'PENDING',
          notes: '',
        })
        fetchBookings()
        toast.success('Bus booking added successfully!')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to create bus booking')
      }
    } catch (error) {
      console.error('Error creating bus booking:', error)
      toast.error('An error occurred. Please try again.')
    }
  }

  const handleStatusChange = async (id: string, newStatus: 'BOOKED' | 'PENDING') => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/bus-bookings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchBookings()
        toast.success(`Status updated to ${newStatus}`)
      } else {
        toast.error('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('An error occurred while updating status')
    }
  }

  const handleDelete = async (id: string, busNumber: string) => {
    setDeleteModal({ isOpen: true, bookingId: id, busNumber })
  }

  const confirmDelete = async () => {
    if (!deleteModal.bookingId) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/bus-bookings/${deleteModal.bookingId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchBookings()
        toast.success('Bus booking deleted successfully!')
      } else {
        toast.error('Failed to delete bus booking')
      }
    } catch (error) {
      console.error('Error deleting booking:', error)
      toast.error('An error occurred while deleting the booking')
    } finally {
      setDeleteModal({ isOpen: false, bookingId: null, busNumber: '' })
    }
  }

  const bookedCount = bookings.filter((b) => b.status === 'BOOKED').length
  const pendingCount = bookings.filter((b) => b.status === 'PENDING').length

  if (loading) {
    return <div className="text-center py-8">Loading bus bookings...</div>
  }

  return (
    <div className="space-y-6">
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, bookingId: null, busNumber: '' })}
        onConfirm={confirmDelete}
        title="Delete Bus Booking"
        message={`Are you sure you want to delete bus booking "${deleteModal.busNumber}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Tours & Travel - Bus Bookings</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Add Bus Booking
        </button>
      </div>

      <div className="flex gap-4 items-center">
        <label className="text-sm font-medium text-gray-700">Select Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-sm text-gray-600">Booked Buses</div>
          <div className="text-3xl font-bold text-green-600">{bookedCount}</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-sm text-gray-600">Pending Buses</div>
          <div className="text-3xl font-bold text-orange-600">{pendingCount}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Bus Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                From Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                To Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Notes
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {booking.busNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(booking.fromDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(booking.toDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      booking.status === 'BOOKED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {booking.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{booking.notes || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() =>
                        handleStatusChange(
                          booking.id,
                          booking.status === 'BOOKED' ? 'PENDING' : 'BOOKED'
                        )
                      }
                      className={`px-3 py-1 rounded-lg text-xs ${
                        booking.status === 'BOOKED'
                          ? 'bg-orange-600 text-white hover:bg-orange-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      Mark {booking.status === 'BOOKED' ? 'Pending' : 'Booked'}
                    </button>
                    <button
                      onClick={() => handleDelete(booking.id, booking.busNumber)}
                      className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bookings.length === 0 && (
          <div className="text-center py-8 text-gray-500">No bus bookings found for this date</div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Bus Booking</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bus Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.busNumber}
                  onChange={(e) => setFormData({ ...formData, busNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
                  placeholder="Enter bus number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.fromDate}
                  onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.toDate}
                  onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as 'BOOKED' | 'PENDING' })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                >
                  <option value="PENDING">Pending</option>
                  <option value="BOOKED">Booked</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Add Booking
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setFormData({
                      busNumber: '',
                      fromDate: selectedDate,
                      toDate: selectedDate,
                      status: 'PENDING',
                      notes: '',
                    })
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ToursPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <ToursContent />
    </Suspense>
  )
}
