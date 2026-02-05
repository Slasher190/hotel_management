'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Reservation {
    id: string
    reservationNumber: string
    guestName: string
    guestEmail: string | null
    guestMobile: string
    guestAddress: string | null
    checkInDate: string
    checkOutDate: string
    expectedArrival: string | null
    numberOfNights: number
    adults: number
    children: number
    roomRate: number
    advanceAmount: number
    totalAmount: number
    specialRequests: string | null
    status: string
    createdAt: string
    room: {
        roomNumber: string
        status: string
        roomType: {
            name: string
            price: number
        }
    }
    booking: {
        id: string
    } | null
}

export default function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()
    const [reservation, setReservation] = useState<Reservation | null>(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [formData, setFormData] = useState({
        guestName: '',
        guestEmail: '',
        guestMobile: '',
        guestAddress: '',
        expectedArrival: '',
        adults: '',
        children: '',
        advanceAmount: '',
        specialRequests: '',
    })

    useEffect(() => {
        fetchReservation()
    }, [resolvedParams.id])

    const fetchReservation = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/reservations/${resolvedParams.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (response.ok) {
                const data = await response.json()
                setReservation(data)
                setFormData({
                    guestName: data.guestName,
                    guestEmail: data.guestEmail || '',
                    guestMobile: data.guestMobile,
                    guestAddress: data.guestAddress || '',
                    expectedArrival: data.expectedArrival || '',
                    adults: data.adults.toString(),
                    children: data.children.toString(),
                    advanceAmount: data.advanceAmount.toString(),
                    specialRequests: data.specialRequests || '',
                })
            } else {
                toast.error('Reservation not found')
                router.push('/dashboard/reservations')
            }
        } catch {
            toast.error('Failed to load reservation')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/reservations/${resolvedParams.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                toast.success('Reservation updated!')
                setEditing(false)
                fetchReservation()
            } else {
                toast.error('Failed to update reservation')
            }
        } catch {
            toast.error('Failed to update reservation')
        }
    }

    const handleConfirm = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/reservations/${resolvedParams.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: 'CONFIRMED' }),
            })

            if (response.ok) {
                toast.success('Reservation confirmed!')
                fetchReservation()
            } else {
                toast.error('Failed to confirm reservation')
            }
        } catch {
            toast.error('Failed to confirm reservation')
        }
    }

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel this reservation?')) return

        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/reservations/${resolvedParams.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })

            if (response.ok) {
                toast.success('Reservation cancelled')
                router.push('/dashboard/reservations')
            } else {
                toast.error('Failed to cancel reservation')
            }
        } catch {
            toast.error('Failed to cancel reservation')
        }
    }

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: 'bg-yellow-500 text-white',
            CONFIRMED: 'bg-green-600 text-white',
            CANCELLED: 'bg-gray-500 text-white',
            NO_SHOW: 'bg-red-600 text-white',
            COMPLETED: 'bg-blue-600 text-white',
        }
        return styles[status] || 'bg-gray-500 text-white'
    }

    if (loading) {
        return (
            <div className="text-center py-16">
                <div className="text-6xl mb-4">📅</div>
                <div className="text-lg font-semibold text-[#64748B]">Loading reservation...</div>
            </div>
        )
    }

    if (!reservation) {
        return (
            <div className="text-center py-16">
                <div className="text-6xl mb-4">❌</div>
                <div className="text-lg font-semibold text-[#64748B]">Reservation not found</div>
            </div>
        )
    }

    return (
        <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl sm:text-4xl font-bold text-[#111827]">
                            {reservation.reservationNumber}
                        </h2>
                        <span className={`px-3 py-1 text-sm font-bold rounded-full ${getStatusBadge(reservation.status)}`}>
                            {reservation.status}
                        </span>
                    </div>
                    <p className="text-sm sm:text-base text-[#64748B] font-medium">
                        Created on {new Date(reservation.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {reservation.status === 'PENDING' && (
                        <button
                            onClick={handleConfirm}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold"
                        >
                            ✅ Confirm
                        </button>
                    )}
                    {reservation.status === 'CONFIRMED' && (
                        <Link
                            href={`/dashboard/reservations/${resolvedParams.id}/checkin`}
                            className="px-4 py-2 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold"
                        >
                            🏨 Check-In Guest
                        </Link>
                    )}
                    {(reservation.status === 'PENDING' || reservation.status === 'CONFIRMED') && (
                        <>
                            <button
                                onClick={() => setEditing(!editing)}
                                className="px-4 py-2 bg-[#64748B] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold"
                            >
                                ✏️ Edit
                            </button>
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold"
                            >
                                ❌ Cancel
                            </button>
                        </>
                    )}
                    <Link
                        href="/dashboard/reservations"
                        className="px-4 py-2 bg-[#F8FAFC] border border-[#CBD5E1] text-[#111827] rounded-lg hover:bg-[#F1F5F9] transition-colors duration-150 font-semibold"
                    >
                        ← Back
                    </Link>
                </div>
            </div>

            {editing ? (
                /* Edit Form */
                <form onSubmit={handleUpdate} className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6 space-y-4">
                    <h3 className="text-lg font-bold text-[#111827] mb-4">✏️ Edit Reservation</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-[#111827] mb-2">Guest Name</label>
                            <input
                                type="text"
                                value={formData.guestName}
                                onChange={(e) => setFormData(prev => ({ ...prev, guestName: e.target.value }))}
                                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[#111827] mb-2">Mobile</label>
                            <input
                                type="tel"
                                value={formData.guestMobile}
                                onChange={(e) => setFormData(prev => ({ ...prev, guestMobile: e.target.value }))}
                                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[#111827] mb-2">Email</label>
                            <input
                                type="email"
                                value={formData.guestEmail}
                                onChange={(e) => setFormData(prev => ({ ...prev, guestEmail: e.target.value }))}
                                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[#111827] mb-2">Expected Arrival</label>
                            <input
                                type="time"
                                value={formData.expectedArrival}
                                onChange={(e) => setFormData(prev => ({ ...prev, expectedArrival: e.target.value }))}
                                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[#111827] mb-2">Adults</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.adults}
                                onChange={(e) => setFormData(prev => ({ ...prev, adults: e.target.value }))}
                                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[#111827] mb-2">Children</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.children}
                                onChange={(e) => setFormData(prev => ({ ...prev, children: e.target.value }))}
                                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[#111827] mb-2">Advance Amount</label>
                            <input
                                type="number"
                                value={formData.advanceAmount}
                                onChange={(e) => setFormData(prev => ({ ...prev, advanceAmount: e.target.value }))}
                                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[#111827] mb-2">Address</label>
                            <input
                                type="text"
                                value={formData.guestAddress}
                                onChange={(e) => setFormData(prev => ({ ...prev, guestAddress: e.target.value }))}
                                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold text-[#111827] mb-2">Special Requests</label>
                            <textarea
                                value={formData.specialRequests}
                                onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                                rows={3}
                                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg"
                            />
                        </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            className="px-6 py-3 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 font-semibold"
                        >
                            💾 Save Changes
                        </button>
                        <button
                            type="button"
                            onClick={() => setEditing(false)}
                            className="px-6 py-3 bg-[#64748B] text-white rounded-lg hover:opacity-90 font-semibold"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                /* View Mode */
                <>
                    {/* Room & Dates */}
                    <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
                        <h3 className="text-lg font-bold text-[#111827] mb-4">🏨 Room & Dates</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div>
                                <p className="text-sm text-[#64748B] mb-1">Room</p>
                                <p className="text-xl font-bold text-[#8E0E1C]">
                                    {reservation.room.roomNumber}
                                </p>
                                <p className="text-sm text-[#64748B]">{reservation.room.roomType.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-[#64748B] mb-1">Check-In</p>
                                <p className="text-lg font-semibold text-[#111827]">
                                    {new Date(reservation.checkInDate).toLocaleDateString('en-IN', {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </p>
                                {reservation.expectedArrival && (
                                    <p className="text-sm text-[#64748B]">Expected: {reservation.expectedArrival}</p>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-[#64748B] mb-1">Check-Out</p>
                                <p className="text-lg font-semibold text-[#111827]">
                                    {new Date(reservation.checkOutDate).toLocaleDateString('en-IN', {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </p>
                                <p className="text-sm text-[#64748B]">{reservation.numberOfNights} night(s)</p>
                            </div>
                        </div>
                    </div>

                    {/* Guest Details */}
                    <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
                        <h3 className="text-lg font-bold text-[#111827] mb-4">👤 Guest Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-[#64748B]">Guest Name</p>
                                <p className="font-semibold text-[#111827]">{reservation.guestName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-[#64748B]">Mobile</p>
                                <p className="font-semibold text-[#111827]">{reservation.guestMobile}</p>
                            </div>
                            <div>
                                <p className="text-sm text-[#64748B]">Email</p>
                                <p className="font-semibold text-[#111827]">{reservation.guestEmail || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-[#64748B]">Address</p>
                                <p className="font-semibold text-[#111827]">{reservation.guestAddress || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-[#64748B]">Guests</p>
                                <p className="font-semibold text-[#111827]">
                                    {reservation.adults} Adult(s), {reservation.children} Child(ren)
                                </p>
                            </div>
                        </div>
                        {reservation.specialRequests && (
                            <div className="mt-4 pt-4 border-t border-[#CBD5E1]">
                                <p className="text-sm text-[#64748B]">Special Requests</p>
                                <p className="font-medium text-[#111827]">{reservation.specialRequests}</p>
                            </div>
                        )}
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-[#8E0E1C]/5 rounded-lg border border-[#8E0E1C]/20 p-4 sm:p-6">
                        <h3 className="text-lg font-bold text-[#111827] mb-4">💰 Payment Summary</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-[#64748B]">Room Rate:</span>
                                <span className="font-medium">₹{reservation.roomRate.toLocaleString('en-IN')}/night</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#64748B]">Nights:</span>
                                <span className="font-medium">{reservation.numberOfNights}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#64748B]">Advance Paid:</span>
                                <span className="font-medium text-green-600">₹{reservation.advanceAmount.toLocaleString('en-IN')}</span>
                            </div>
                            <hr className="border-[#CBD5E1]" />
                            <div className="flex justify-between text-lg">
                                <span className="font-bold text-[#111827]">Total Amount:</span>
                                <span className="font-bold text-[#8E0E1C]">₹{reservation.totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#64748B]">Balance Due:</span>
                                <span className="font-bold text-[#8E0E1C]">
                                    ₹{(reservation.totalAmount - reservation.advanceAmount).toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Linked Booking */}
                    {reservation.booking && (
                        <div className="bg-green-50 rounded-lg border border-green-200 p-4 sm:p-6">
                            <h3 className="text-lg font-bold text-green-800 mb-2">✅ Checked In</h3>
                            <p className="text-green-700">This reservation has been converted to an active booking.</p>
                            <Link
                                href={`/dashboard/bookings/${reservation.booking.id}`}
                                className="inline-block mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:opacity-90 font-semibold"
                            >
                                View Booking →
                            </Link>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
