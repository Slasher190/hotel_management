'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
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
  const [showAll, setShowAll] = useState(false)
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

  const fetchBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (showAll) {
        params.append('showAll', 'true')
      } else {
        params.append('date', selectedDate)
      }
      const response = await fetch(`/api/bus-bookings?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setBookings(Array.isArray(data) ? data : data.bookings || [])
      }
    } catch {
      // Error handled by console.error
    } finally {
      setLoading(false)
    }
  }, [selectedDate, showAll])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

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
    <div className="space-y-8 fade-in">
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

      <div className="flex justify-between items-center bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-6">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            🚌 Tours & Travel - Bus Bookings
          </h2>
          <p className="text-slate-600 font-medium">Manage bus bookings for tours and travel</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
        >
          <span className="text-xl">➕</span>
          <span>Add Bus Booking</span>
        </button>
      </div>

      <div className="flex gap-4 items-center flex-wrap bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-6">
        {!showAll && (
          <>
            <label className="text-sm font-semibold text-slate-700">📅 Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
            />
          </>
        )}
        <button
          onClick={() => {
            setShowAll(!showAll)
            if (!showAll) {
              setSelectedDate(new Date().toISOString().split('T')[0])
            }
          }}
          className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg transform hover:scale-105 ${
            showAll
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
          }`}
        >
          {showAll ? '📅 Show by Date' : '📋 Show All Bookings'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-8 card-hover">
          <div className="text-sm font-semibold text-slate-600 mb-2">✅ Booked Buses</div>
          <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{bookedCount}</div>
        </div>
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-8 card-hover">
          <div className="text-sm font-semibold text-slate-600 mb-2">⏳ Pending Buses</div>
          <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">{pendingCount}</div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-gradient-to-r from-indigo-600 to-purple-600">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">
                🚌 Bus Number
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">
                📅 From Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">
                📅 To Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">
                📊 Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">
                📝 Notes
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase">
                ⚡ Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-slate-900">{booking.busNumber}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-600">
                    {new Date(booking.fromDate).toLocaleDateString('en-IN')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-600">
                    {new Date(booking.toDate).toLocaleDateString('en-IN')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1.5 text-xs font-bold rounded-full shadow-md ${
                      booking.status === 'BOOKED'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                        : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                    }`}
                  >
                    {booking.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-slate-600 max-w-xs truncate">{booking.notes || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() =>
                        handleStatusChange(
                          booking.id,
                          booking.status === 'BOOKED' ? 'PENDING' : 'BOOKED'
                        )
                      }
                      className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all ${
                        booking.status === 'BOOKED'
                          ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-700 hover:to-amber-700'
                          : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                      }`}
                    >
                      {booking.status === 'BOOKED' ? '⏳ Mark Pending' : '✅ Mark Booked'}
                    </button>
                    <button
                      onClick={() => handleDelete(booking.id, booking.busNumber)}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl text-xs font-semibold hover:from-red-600 hover:to-pink-600 shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bookings.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🚌</div>
            <div className="text-lg font-semibold text-slate-500">No bus bookings found</div>
            <div className="text-sm text-slate-400 mt-2">Add your first bus booking to get started</div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 max-w-md w-full border-2 border-slate-200">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
              <span className="text-3xl">🚌</span>
              <span>Add Bus Booking</span>
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  🚌 Bus Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.busNumber}
                  onChange={(e) => setFormData({ ...formData, busNumber: e.target.value })}
                  className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                  placeholder="Enter bus number"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  📅 From Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.fromDate}
                  onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                  className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  📅 To Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.toDate}
                  onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                  className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">📊 Status <span className="text-red-500">*</span></label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as 'BOOKED' | 'PENDING' })
                  }
                  className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                >
                  <option value="PENDING">Pending</option>
                  <option value="BOOKED">Booked</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">📝 Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  ➕ Add Booking
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
                  className="flex-1 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 py-3 rounded-xl hover:from-slate-200 hover:to-slate-300 transition-all font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
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
