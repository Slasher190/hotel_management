'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Room {
    id: string
    roomNumber: string
    status: string
    roomType: {
        id: string
        name: string
        price: number
    }
}

interface RoomType {
    id: string
    name: string
    price: number
}

export default function NewReservationPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [checkingAvailability, setCheckingAvailability] = useState(false)
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
    const [availableRooms, setAvailableRooms] = useState<Room[]>([])
    const [unavailableRooms, setUnavailableRooms] = useState<Room[]>([])

    const [formData, setFormData] = useState({
        roomIds: [] as string[],
        guestName: '',
        guestEmail: '',
        guestMobile: '',
        guestAddress: '',
        checkInDate: '',
        checkOutDate: '',
        expectedArrival: '',
        adults: '1',
        children: '0',
        roomRate: '',
        advanceAmount: '0',
        specialRequests: '',
        roomTypeId: '',
    })

    useEffect(() => {
        fetchRoomTypes()
    }, [])

    useEffect(() => {
        if (formData.checkInDate && formData.checkOutDate) {
            checkAvailability()
        }
    }, [formData.checkInDate, formData.checkOutDate, formData.roomTypeId])

    const fetchRoomTypes = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/room-types', {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                const data = await response.json()
                setRoomTypes(data)
            }
        } catch {
            toast.error('Failed to load room types')
        }
    }

    const checkAvailability = async () => {
        if (!formData.checkInDate || !formData.checkOutDate) return

        setCheckingAvailability(true)
        try {
            const token = localStorage.getItem('token')
            const params = new URLSearchParams({
                checkInDate: formData.checkInDate,
                checkOutDate: formData.checkOutDate,
            })
            if (formData.roomTypeId) {
                params.append('roomTypeId', formData.roomTypeId)
            }

            const response = await fetch(`/api/rooms/availability?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (response.ok) {
                const data = await response.json()
                setAvailableRooms(data.availableRooms)
                setUnavailableRooms(data.unavailableRooms)

                // Keep only those selected rooms that are still available
                const availableIds = new Set(data.availableRooms.map((r: Room) => r.id));

                setFormData(prev => {
                    const newSelectedIds = prev.roomIds.filter((id) => availableIds.has(id));
                    let newRoomRate = 0;
                    for (const id of newSelectedIds) {
                        const room = data.availableRooms.find((r: Room) => r.id === id);
                        if (room) newRoomRate += room.roomType.price;
                    }
                    return {
                        ...prev,
                        roomIds: newSelectedIds,
                        roomRate: newSelectedIds.length > 0 ? newRoomRate.toString() : ''
                    };
                })
            }
        } catch {
            toast.error('Failed to check availability')
        } finally {
            setCheckingAvailability(false)
        }
    }

    const handleRoomSelect = (room: Room) => {
        setFormData(prev => {
            const isSelected = prev.roomIds.includes(room.id);
            let newRoomIds;
            if (isSelected) {
                newRoomIds = prev.roomIds.filter(id => id !== room.id);
            } else {
                newRoomIds = [...prev.roomIds, room.id];
            }

            let newRoomRate = 0;
            availableRooms.forEach(r => {
                if (newRoomIds.includes(r.id)) {
                    newRoomRate += r.roomType.price;
                }
            });

            return {
                ...prev,
                roomIds: newRoomIds,
                roomRate: newRoomRate > 0 ? newRoomRate.toString() : '',
            };
        })
    }

    const calculateTotal = () => {
        if (!formData.checkInDate || !formData.checkOutDate || !formData.roomRate) return 0
        const checkIn = new Date(formData.checkInDate)
        const checkOut = new Date(formData.checkOutDate)
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        return nights * parseFloat(formData.roomRate)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (formData.roomIds.length === 0) {
            toast.error('Please select at least one room')
            return
        }

        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                toast.success('Reservation created successfully!')
                router.push('/dashboard/reservations')
            } else {
                const data = await response.json()
                toast.error(data.error || 'Failed to create reservation')
            }
        } catch {
            toast.error('Failed to create reservation')
        } finally {
            setLoading(false)
        }
    }

    const nights = formData.checkInDate && formData.checkOutDate
        ? Math.ceil((new Date(formData.checkOutDate).getTime() - new Date(formData.checkInDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0

    return (
        <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
                <div>
                    <h2 className="text-2xl sm:text-4xl font-bold text-[#111827] mb-2">
                        ➕ New Reservation
                    </h2>
                    <p className="text-sm sm:text-base text-[#64748B] font-medium">Create an advance room booking</p>
                </div>
                <Link
                    href="/dashboard/reservations"
                    className="px-4 py-2 sm:px-6 sm:py-3 bg-[#64748B] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold flex items-center gap-2 min-h-[44px] text-sm sm:text-base"
                >
                    ← Back to Reservations
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date Selection */}
                <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
                    <h3 className="text-lg font-bold text-[#111827] mb-4">📅 Booking Dates</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="checkInDate" className="block text-sm font-semibold text-[#111827] mb-2">
                                Check-In Date *
                            </label>
                            <input
                                type="date"
                                id="checkInDate"
                                value={formData.checkInDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setFormData(prev => ({ ...prev, checkInDate: e.target.value }))}
                                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="checkOutDate" className="block text-sm font-semibold text-[#111827] mb-2">
                                Check-Out Date *
                            </label>
                            <input
                                type="date"
                                id="checkOutDate"
                                value={formData.checkOutDate}
                                min={formData.checkInDate || new Date().toISOString().split('T')[0]}
                                onChange={(e) => setFormData(prev => ({ ...prev, checkOutDate: e.target.value }))}
                                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="expectedArrival" className="block text-sm font-semibold text-[#111827] mb-2">
                                Expected Arrival Time
                            </label>
                            <input
                                type="time"
                                id="expectedArrival"
                                value={formData.expectedArrival}
                                onChange={(e) => setFormData(prev => ({ ...prev, expectedArrival: e.target.value }))}
                                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                            />
                        </div>
                    </div>
                    {nights > 0 && (
                        <div className="mt-4 p-3 bg-[#F8FAFC] rounded-lg">
                            <span className="font-semibold text-[#111827]">Duration: </span>
                            <span className="text-[#8E0E1C] font-bold">{nights} night(s)</span>
                        </div>
                    )}
                </div>

                {/* Room Selection */}
                <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
                    <h3 className="text-lg font-bold text-[#111827] mb-4">🏨 Select Room</h3>

                    <div className="mb-4">
                        <label htmlFor="roomTypeId" className="block text-sm font-semibold text-[#111827] mb-2">
                            Filter by Room Type
                        </label>
                        <select
                            id="roomTypeId"
                            value={formData.roomTypeId}
                            onChange={(e) => setFormData(prev => ({ ...prev, roomTypeId: e.target.value }))}
                            className="w-full sm:w-64 px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                        >
                            <option value="">All Room Types</option>
                            {roomTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.name} (₹{type.price}/night)
                                </option>
                            ))}
                        </select>
                    </div>

                    {checkingAvailability ? (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-2">🔍</div>
                            <p className="text-[#64748B]">Checking availability...</p>
                        </div>
                    ) : formData.checkInDate && formData.checkOutDate ? (
                        <div className="space-y-4">
                            {availableRooms.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-green-700 mb-2">✅ Available Rooms ({availableRooms.length})</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {availableRooms.map((room) => (
                                            <button
                                                key={room.id}
                                                type="button"
                                                onClick={() => handleRoomSelect(room)}
                                                className={`p-4 rounded-lg border-2 transition-all duration-150 text-left ${formData.roomIds.includes(room.id)
                                                    ? 'border-[#8E0E1C] bg-[#8E0E1C]/5'
                                                    : 'border-[#CBD5E1] hover:border-[#8E0E1C]/50'
                                                    }`}
                                            >
                                                <div className="font-bold text-lg text-[#111827]">{room.roomNumber}</div>
                                                <div className="text-sm text-[#64748B]">{room.roomType.name}</div>
                                                <div className="text-sm font-semibold text-[#8E0E1C] mt-1">₹{room.roomType.price}/night</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {unavailableRooms.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-gray-500 mb-2">❌ Unavailable ({unavailableRooms.length})</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {unavailableRooms.map((room) => (
                                            <div
                                                key={room.id}
                                                className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50 opacity-50"
                                            >
                                                <div className="font-bold text-lg text-gray-400">{room.roomNumber}</div>
                                                <div className="text-sm text-gray-400">{room.roomType.name}</div>
                                                <div className="text-sm text-red-400 mt-1">Booked</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {availableRooms.length === 0 && unavailableRooms.length === 0 && (
                                <div className="text-center py-8 text-[#64748B]">
                                    No rooms found for the selected criteria
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-[#64748B]">
                            <div className="text-4xl mb-2">📅</div>
                            <p>Select check-in and check-out dates to see available rooms</p>
                        </div>
                    )}
                </div>

                {/* Guest Details */}
                <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
                    <h3 className="text-lg font-bold text-[#111827] mb-4">👤 Guest Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="guestName" className="block text-sm font-semibold text-[#111827] mb-2">
                                Guest Name *
                            </label>
                            <input
                                type="text"
                                id="guestName"
                                value={formData.guestName}
                                onChange={(e) => setFormData(prev => ({ ...prev, guestName: e.target.value }))}
                                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="guestMobile" className="block text-sm font-semibold text-[#111827] mb-2">
                                Mobile Number *
                            </label>
                            <input
                                type="tel"
                                id="guestMobile"
                                value={formData.guestMobile}
                                onChange={(e) => setFormData(prev => ({ ...prev, guestMobile: e.target.value }))}
                                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="guestEmail" className="block text-sm font-semibold text-[#111827] mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="guestEmail"
                                value={formData.guestEmail}
                                onChange={(e) => setFormData(prev => ({ ...prev, guestEmail: e.target.value }))}
                                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="guestAddress" className="block text-sm font-semibold text-[#111827] mb-2">
                                Address
                            </label>
                            <input
                                type="text"
                                id="guestAddress"
                                value={formData.guestAddress}
                                onChange={(e) => setFormData(prev => ({ ...prev, guestAddress: e.target.value }))}
                                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="adults" className="block text-sm font-semibold text-[#111827] mb-2">
                                Adults
                            </label>
                            <input
                                type="number"
                                id="adults"
                                min="1"
                                value={formData.adults}
                                onChange={(e) => setFormData(prev => ({ ...prev, adults: e.target.value }))}
                                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="children" className="block text-sm font-semibold text-[#111827] mb-2">
                                Children
                            </label>
                            <input
                                type="number"
                                id="children"
                                min="0"
                                value={formData.children}
                                onChange={(e) => setFormData(prev => ({ ...prev, children: e.target.value }))}
                                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Payment & Notes */}
                <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
                    <h3 className="text-lg font-bold text-[#111827] mb-4">💰 Payment Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="roomRate" className="block text-sm font-semibold text-[#111827] mb-2">
                                Room Rate (per night) *
                            </label>
                            <input
                                type="number"
                                id="roomRate"
                                value={formData.roomRate}
                                onChange={(e) => setFormData(prev => ({ ...prev, roomRate: e.target.value }))}
                                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="advanceAmount" className="block text-sm font-semibold text-[#111827] mb-2">
                                Advance Amount
                            </label>
                            <input
                                type="number"
                                id="advanceAmount"
                                value={formData.advanceAmount}
                                onChange={(e) => setFormData(prev => ({ ...prev, advanceAmount: e.target.value }))}
                                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="specialRequests" className="block text-sm font-semibold text-[#111827] mb-2">
                                Special Requests
                            </label>
                            <textarea
                                id="specialRequests"
                                value={formData.specialRequests}
                                onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                                rows={3}
                                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                                placeholder="Any special requirements or notes..."
                            />
                        </div>
                    </div>
                </div>

                {/* Summary */}
                {formData.roomIds.length > 0 && nights > 0 && (
                    <div className="bg-[#8E0E1C]/5 rounded-lg border border-[#8E0E1C]/20 p-4 sm:p-6">
                        <h3 className="text-lg font-bold text-[#111827] mb-4">📋 Booking Summary ({formData.roomIds.length} Room{formData.roomIds.length > 1 ? 's' : ''})</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-[#64748B]">Room Rate:</span>
                                <span className="font-medium">₹{formData.roomRate}/night</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#64748B]">Duration:</span>
                                <span className="font-medium">{nights} night(s)</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#64748B]">Advance Paid:</span>
                                <span className="font-medium">₹{formData.advanceAmount || 0}</span>
                            </div>
                            <hr className="border-[#CBD5E1]" />
                            <div className="flex justify-between text-lg">
                                <span className="font-bold text-[#111827]">Total Amount:</span>
                                <span className="font-bold text-[#8E0E1C]">₹{calculateTotal().toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#64748B]">Balance Due:</span>
                                <span className="font-medium text-[#8E0E1C]">
                                    ₹{(calculateTotal() - parseFloat(formData.advanceAmount || '0')).toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={loading || formData.roomIds.length === 0}
                        className="flex-1 px-6 py-4 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? '⏳ Creating...' : '📅 Create Reservation'}
                    </button>
                    <Link
                        href="/dashboard/reservations"
                        className="px-6 py-4 bg-[#64748B] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    )
}
