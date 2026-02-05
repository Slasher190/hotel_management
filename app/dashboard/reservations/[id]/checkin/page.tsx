'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Reservation {
    id: string
    reservationNumber: string
    guestName: string
    guestMobile: string
    guestAddress: string | null
    checkInDate: string
    checkOutDate: string
    numberOfNights: number
    adults: number
    children: number
    roomRate: number
    advanceAmount: number
    totalAmount: number
    room: {
        roomNumber: string
        status: string
        roomType: {
            name: string
        }
    }
}

const ID_TYPES = [
    { value: 'AADHAAR', label: 'Aadhaar Card' },
    { value: 'DL', label: 'Driving License' },
    { value: 'VOTER_ID', label: 'Voter ID' },
    { value: 'PASSPORT', label: 'Passport' },
    { value: 'OTHER', label: 'Other' },
]

export default function CheckinPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()
    const [reservation, setReservation] = useState<Reservation | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        idType: 'AADHAAR',
        idNumber: '',
        purpose: 'Reservation Check-in',
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
                if (data.status !== 'CONFIRMED') {
                    toast.error('Only confirmed reservations can be checked in')
                    router.push(`/dashboard/reservations/${resolvedParams.id}`)
                    return
                }
                setReservation(data)
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.idType) {
            toast.error('Please select ID type')
            return
        }

        setSubmitting(true)
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/reservations/${resolvedParams.id}/convert`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                const data = await response.json()
                toast.success('Guest checked in successfully!')
                router.push(`/dashboard/bookings/${data.booking.id}`)
            } else {
                const data = await response.json()
                toast.error(data.error || 'Failed to check in guest')
            }
        } catch {
            toast.error('Failed to check in guest')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="text-center py-16">
                <div className="text-6xl mb-4">🏨</div>
                <div className="text-lg font-semibold text-[#64748B]">Loading...</div>
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
        <div className="space-y-6 sm:space-y-8 max-w-2xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl sm:text-4xl font-bold text-[#111827]">
                        🏨 Check-In Guest
                    </h2>
                    <Link
                        href={`/dashboard/reservations/${resolvedParams.id}`}
                        className="px-4 py-2 bg-[#64748B] text-white rounded-lg hover:opacity-90 font-semibold"
                    >
                        ← Back
                    </Link>
                </div>
                <p className="text-[#64748B]">Convert reservation to active booking</p>
            </div>

            {/* Reservation Summary */}
            <div className="bg-[#8E0E1C]/5 rounded-lg border border-[#8E0E1C]/20 p-4 sm:p-6">
                <h3 className="text-lg font-bold text-[#111827] mb-4">📋 Reservation Details</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-[#64748B]">Reservation #</p>
                        <p className="font-bold text-[#8E0E1C]">{reservation.reservationNumber}</p>
                    </div>
                    <div>
                        <p className="text-sm text-[#64748B]">Room</p>
                        <p className="font-bold text-[#111827]">{reservation.room.roomNumber} ({reservation.room.roomType.name})</p>
                    </div>
                    <div>
                        <p className="text-sm text-[#64748B]">Guest Name</p>
                        <p className="font-semibold text-[#111827]">{reservation.guestName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-[#64748B]">Mobile</p>
                        <p className="font-semibold text-[#111827]">{reservation.guestMobile}</p>
                    </div>
                    <div>
                        <p className="text-sm text-[#64748B]">Check-In Date</p>
                        <p className="font-semibold text-[#111827]">
                            {new Date(reservation.checkInDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                            })}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-[#64748B]">Check-Out Date</p>
                        <p className="font-semibold text-[#111827]">
                            {new Date(reservation.checkOutDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                            })}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-[#64748B]">Total Amount</p>
                        <p className="font-bold text-[#8E0E1C]">₹{reservation.totalAmount.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                        <p className="text-sm text-[#64748B]">Advance Paid</p>
                        <p className="font-semibold text-green-600">₹{reservation.advanceAmount.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>

            {/* Room Status Warning */}
            {reservation.room.status === 'OCCUPIED' && (
                <div className="bg-red-50 rounded-lg border border-red-200 p-4">
                    <p className="text-red-800 font-semibold">
                        ⚠️ This room is currently occupied. Please check out the current guest first.
                    </p>
                </div>
            )}

            {/* Check-in Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6 space-y-4">
                <h3 className="text-lg font-bold text-[#111827] mb-4">📝 Guest Verification</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="idType" className="block text-sm font-semibold text-[#111827] mb-2">
                            ID Type *
                        </label>
                        <select
                            id="idType"
                            value={formData.idType}
                            onChange={(e) => setFormData(prev => ({ ...prev, idType: e.target.value }))}
                            className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                            required
                        >
                            {ID_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="idNumber" className="block text-sm font-semibold text-[#111827] mb-2">
                            ID Number
                        </label>
                        <input
                            type="text"
                            id="idNumber"
                            value={formData.idNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, idNumber: e.target.value }))}
                            placeholder="Enter ID number"
                            className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="purpose" className="block text-sm font-semibold text-[#111827] mb-2">
                            Purpose of Stay
                        </label>
                        <input
                            type="text"
                            id="purpose"
                            value={formData.purpose}
                            onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                            className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                        />
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={submitting || reservation.room.status === 'OCCUPIED'}
                        className="flex-1 px-6 py-4 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? '⏳ Processing...' : '🏨 Complete Check-In'}
                    </button>
                    <Link
                        href={`/dashboard/reservations/${resolvedParams.id}`}
                        className="px-6 py-4 bg-[#64748B] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold flex items-center justify-center"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    )
}
