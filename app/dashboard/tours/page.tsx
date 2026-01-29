'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import Modal from '@/app/components/Modal'
import Pagination from '@/app/components/Pagination'
import ThermalSlip from '@/app/components/ThermalSlip'
import { useUserRole } from '@/lib/useUserRole'

import { getLocalDateISOString } from '@/lib/utils'

interface BusBooking {
  id: string
  busNumber: string
  fromDate: string
  toDate: string
  status: 'BOOKED' | 'PENDING'
  notes: string | null
  bookingAmount: number
  advanceAmount: number
}

function ToursContent() {
  const { isStaff } = useUserRole()
  const searchParams = useSearchParams()
  // Tours manager is open to all users
  const [bookings, setBookings] = useState<BusBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(
    searchParams.get('date') || getLocalDateISOString()
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
    bookingAmount: '',
    advanceAmount: '',
  })
  const [printableBooking, setPrintableBooking] = useState<BusBooking | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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
        const fetchedBookings = Array.isArray(data) ? data : data.bookings || []

        // Sort by fromDate descending (newest first)
        fetchedBookings.sort((a: BusBooking, b: BusBooking) =>
          new Date(b.fromDate).getTime() - new Date(a.fromDate).getTime()
        )
        setBookings(fetchedBookings)
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

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedDate, showAll])

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
          bookingAmount: '',
          advanceAmount: '',
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

  const paginatedBookings = bookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )


  const handlePrint = (booking: BusBooking) => {
    setPrintableBooking(booking)
    setTimeout(() => {
      window.print()
    }, 100)
  }



  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🚌</div>
        <div className="text-lg font-semibold text-[#64748B]">Loading bus bookings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {printableBooking && (
        <ThermalSlip
          title="Bus Booking Slip"
          lotNumber={`BUS-${printableBooking.id.slice(-6).toUpperCase()}`}
          dateTime={new Date().toLocaleString('en-IN')}
          roomLabel="BUS NO."
          roomNumber={printableBooking.busNumber}
          guestName="Booked"
          guestLabel="STATUS"
          attendantName="Manager"
          items={[{
            id: printableBooking.id,
            name: `Bus Booking (${new Date(printableBooking.fromDate).toLocaleDateString()} to ${new Date(printableBooking.toDate).toLocaleDateString()})`,
            quantity: 1,
            amount: printableBooking.bookingAmount || 0
          }]}
          subtotal={printableBooking.bookingAmount || 0}
          discountLabel="Advance Paid"
          discount={printableBooking.advanceAmount || 0}
          total={(printableBooking.bookingAmount || 0) - (printableBooking.advanceAmount || 0)}
        />
      )}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, bookingId: null, busNumber: '' })}
        onConfirm={confirmDelete}
        title="Delete Bus Booking"
        message={`Are you sure you want to delete bus booking "${deleteModal.busNumber}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-[#8E0E1C] hover:opacity-90"
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#111827] mb-2">
            🚌 Tours & Travel - Bus Bookings
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] font-medium">Manage bus bookings for tours and travel</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 sm:px-6 sm:py-3 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold flex items-center gap-2 min-h-[44px] text-sm sm:text-base"
        >
          <span className="text-xl">➕</span>
          <span>Add Bus Booking</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center flex-wrap bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
        {!showAll && (
          <>
            <label htmlFor="selectedDate" className="text-sm font-semibold text-[#111827]">📅 Select Date:</label>
            <input
              id="selectedDate"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
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
          className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold transition-colors duration-150 min-h-[44px] ${showAll
            ? 'bg-[#8E0E1C] text-white'
            : 'bg-white text-[#111827] hover:bg-[#F8FAFC] border border-[#CBD5E1]'
            }`}
        >
          {showAll ? '📅 Show by Date' : '📋 Show All Bookings'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg border border-[#CBD5E1] p-6 sm:p-8">
          <div className="text-sm font-semibold text-[#64748B] mb-2">✅ Booked Buses</div>
          <div className="text-2xl sm:text-4xl font-bold text-[#111827]">{bookedCount}</div>
        </div>
        <div className="bg-white rounded-lg border border-[#CBD5E1] p-6 sm:p-8">
          <div className="text-sm font-semibold text-[#64748B] mb-2">⏳ Pending Buses</div>
          <div className="text-2xl sm:text-4xl font-bold text-[#111827]">{pendingCount}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#CBD5E1] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#CBD5E1]">
            <thead className="bg-[#8E0E1C]">
              <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase">
                  🚌 Bus Number
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase">
                  📅 From Date
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase hidden sm:table-cell">
                  📅 To Date
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase">
                  📊 Status
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase hidden md:table-cell">
                  📝 Notes
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-bold text-white uppercase">
                  ⚡ Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#CBD5E1]">
              {paginatedBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-[#111827]">{booking.busNumber}</div>
                    <div className="text-xs text-[#64748B] mt-1">₹{booking.bookingAmount?.toLocaleString('en-IN') || '0'}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-[#64748B]">
                      {new Date(booking.fromDate).toLocaleDateString('en-IN')}
                    </div>
                    <div className="text-xs text-[#94A3B8] sm:hidden">To: {new Date(booking.toDate).toLocaleDateString('en-IN')}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                    <div className="text-sm font-medium text-[#64748B]">
                      {new Date(booking.toDate).toLocaleDateString('en-IN')}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-bold rounded-full ${booking.status === 'BOOKED'
                        ? 'bg-[#64748B] text-white'
                        : 'bg-[#8E0E1C] text-white'
                        }`}
                    >
                      {booking.status}
                    </span>
                    <div className="text-xs text-[#64748B] mt-1">Adv: ₹{booking.advanceAmount?.toLocaleString('en-IN') || '0'}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                    <div className="text-sm font-medium text-[#64748B] max-w-xs truncate">{booking.notes || '-'}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2 flex-wrap">
                      <button
                        onClick={() => handlePrint(booking)}
                        className="px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity duration-150 min-h-[44px]"
                        title="Print Bill"
                      >
                        🖨️ Print
                      </button>


                      <button
                        onClick={() =>
                          handleStatusChange(
                            booking.id,
                            booking.status === 'BOOKED' ? 'PENDING' : 'BOOKED'
                          )
                        }
                        className={`px-3 py-2 rounded-lg text-xs font-semibold transition-opacity duration-150 min-h-[44px] ${booking.status === 'BOOKED'
                          ? 'bg-[#8E0E1C] text-white hover:opacity-90'
                          : 'bg-[#64748B] text-white hover:opacity-90'
                          }`}
                      >
                        {booking.status === 'BOOKED' ? '⏳ Mark Pending' : '✅ Mark Booked'}
                      </button>
                      {!isStaff && (
                        <button
                          onClick={() => handleDelete(booking.id, booking.busNumber)}
                          className="px-3 py-2 bg-[#8E0E1C] text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity duration-150 min-h-[44px]"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {bookings.length > itemsPerPage && (
          <div className="border-t border-[#CBD5E1]">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(bookings.length / itemsPerPage)}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
        {bookings.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🚌</div>
            <div className="text-lg font-semibold text-[#64748B]">No bus bookings found</div>
            <div className="text-sm text-[#94A3B8] mt-2">Add your first bus booking to get started</div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {
        showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg p-5 max-w-lg w-full border border-[#CBD5E1]">
              <h3 className="text-lg font-bold text-[#111827] mb-4 flex items-center gap-2">
                <span className="text-xl">🚌</span>
                <span>Add Bus Booking</span>
              </h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="busNumber" className="block text-xs font-semibold text-[#111827] mb-1">
                      🚌 Bus Number <span className="text-[#8E0E1C]">*</span>
                    </label>
                    <input
                      id="busNumber"
                      type="text"
                      required
                      value={formData.busNumber}
                      onChange={(e) => setFormData({ ...formData, busNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                      placeholder="Enter bus number"
                    />
                  </div>
                  <div>
                    <label htmlFor="status" className="block text-xs font-semibold text-[#111827] mb-1">📊 Status <span className="text-[#8E0E1C]">*</span></label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as 'BOOKED' | 'PENDING' })
                      }
                      className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="BOOKED">Booked</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="fromDate" className="block text-xs font-semibold text-[#111827] mb-1">
                      📅 From Date <span className="text-[#8E0E1C]">*</span>
                    </label>
                    <input
                      id="fromDate"
                      type="date"
                      required
                      value={formData.fromDate}
                      onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                      className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="toDate" className="block text-xs font-semibold text-[#111827] mb-1">
                      📅 To Date <span className="text-[#8E0E1C]">*</span>
                    </label>
                    <input
                      id="toDate"
                      type="date"
                      required
                      value={formData.toDate}
                      onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                      className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="bookingAmount" className="block text-xs font-semibold text-[#111827] mb-1">
                      💰 Booking Amount
                    </label>
                    <input
                      id="bookingAmount"
                      type="number"
                      min="0"
                      value={formData.bookingAmount}
                      onChange={(e) => setFormData({ ...formData, bookingAmount: e.target.value })}
                      className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label htmlFor="advanceAmount" className="block text-xs font-semibold text-[#111827] mb-1">
                      💵 Advance
                    </label>
                    <input
                      id="advanceAmount"
                      type="number"
                      min="0"
                      value={formData.advanceAmount}
                      onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
                      className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-xs font-semibold text-[#111827] mb-1">📝 Notes</label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white resize-none"
                    rows={2}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-[#8E0E1C] text-white py-2 rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold min-h-[40px] text-sm"
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
                        bookingAmount: '',
                        advanceAmount: '',
                      })
                    }}
                    className="flex-1 bg-[#F8FAFC] border border-[#CBD5E1] text-[#111827] py-2 rounded-lg hover:bg-[#F1F5F9] transition-colors duration-150 font-semibold min-h-[40px] text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </div >
  )
}

export default function ToursPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <ToursContent />
    </Suspense>
  )
}
