'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Room {
    id: string
    roomNumber: string
    roomType: {
        name: string
        price: number
    }
}

interface Reservation {
    id: string
    reservationNumber: string
    guestName: string
    checkInDate: string
    checkOutDate: string
    status: string
    room: {
        id: string
        roomNumber: string
    }
}

interface Booking {
    id: string
    guestName: string
    checkInDate: string
    checkoutDate: string | null
    status: string
    room: {
        id: string
        roomNumber: string
    }
}

export default function ReservationCalendarPage() {
    const [rooms, setRooms] = useState<Room[]>([])
    const [reservations, setReservations] = useState<Reservation[]>([])
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [currentDate, setCurrentDate] = useState(new Date())

    // Get start and end of current month view
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    // Generate array of dates for the month
    const daysInMonth = endOfMonth.getDate()
    const dates = Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1)
        return date
    })

    useEffect(() => {
        fetchData()
    }, [currentDate])

    const fetchData = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')

            // Fetch rooms
            const roomsRes = await fetch('/api/rooms', {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (roomsRes.ok) {
                const roomsData = await roomsRes.json()
                setRooms(roomsData)
            }

            // Fetch reservations for the month
            const reservationsRes = await fetch(
                `/api/reservations?showAll=true&dateFrom=${startOfMonth.toISOString().split('T')[0]}&dateTo=${endOfMonth.toISOString().split('T')[0]}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            if (reservationsRes.ok) {
                const reservationsData = await reservationsRes.json()
                setReservations(reservationsData.reservations || [])
            }

            // Fetch active bookings
            const bookingsRes = await fetch('/api/bookings?status=ACTIVE&showAll=true', {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (bookingsRes.ok) {
                const bookingsData = await bookingsRes.json()
                setBookings(bookingsData.bookings || [])
            }
        } catch {
            toast.error('Failed to load calendar data')
        } finally {
            setLoading(false)
        }
    }

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }

    const goToToday = () => {
        setCurrentDate(new Date())
    }

    const getReservationForCell = (roomId: string, date: Date) => {
        const dateStr = date.toISOString().split('T')[0]

        // Check reservations
        const reservation = reservations.find(r => {
            if (r.room.id !== roomId) return false
            if (r.status === 'CANCELLED' || r.status === 'COMPLETED') return false
            const checkIn = new Date(r.checkInDate).toISOString().split('T')[0]
            const checkOut = new Date(r.checkOutDate).toISOString().split('T')[0]
            return dateStr >= checkIn && dateStr < checkOut
        })

        if (reservation) {
            return { type: 'reservation' as const, data: reservation }
        }

        // Check active bookings
        const booking = bookings.find(b => {
            if (b.room.id !== roomId) return false
            if (b.status !== 'ACTIVE') return false
            const checkIn = new Date(b.checkInDate).toISOString().split('T')[0]
            return dateStr >= checkIn // Active bookings don't have checkoutDate yet
        })

        if (booking) {
            return { type: 'booking' as const, data: booking }
        }

        return null
    }

    const getCellStyle = (occupancy: ReturnType<typeof getReservationForCell>) => {
        if (!occupancy) return 'bg-green-50 hover:bg-green-100'

        if (occupancy.type === 'booking') {
            return 'bg-blue-500 text-white'
        }

        const status = (occupancy.data as Reservation).status
        switch (status) {
            case 'CONFIRMED':
                return 'bg-yellow-400 text-yellow-900'
            case 'PENDING':
                return 'bg-orange-300 text-orange-900'
            default:
                return 'bg-gray-300 text-gray-700'
        }
    }

    const monthName = currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

    if (loading) {
        return (
            <div className="text-center py-16">
                <div className="text-6xl mb-4">📆</div>
                <div className="text-lg font-semibold text-[#64748B]">Loading calendar...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
                <div>
                    <h2 className="text-2xl sm:text-4xl font-bold text-[#111827] mb-2">
                        📆 Availability Calendar
                    </h2>
                    <p className="text-sm sm:text-base text-[#64748B] font-medium">Room availability overview</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link
                        href="/dashboard/reservations"
                        className="px-4 py-2 bg-[#64748B] text-white rounded-lg hover:opacity-90 font-semibold"
                    >
                        ← Back to List
                    </Link>
                    <Link
                        href="/dashboard/reservations/new"
                        className="px-4 py-2 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 font-semibold"
                    >
                        ➕ New Reservation
                    </Link>
                </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-50 border border-green-300 rounded"></div>
                    <span className="text-sm font-medium">Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded"></div>
                    <span className="text-sm font-medium">Active Booking</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-yellow-400 rounded"></div>
                    <span className="text-sm font-medium">Confirmed Reservation</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-orange-300 rounded"></div>
                    <span className="text-sm font-medium">Pending Reservation</span>
                </div>
            </div>

            {/* Calendar Navigation */}
            <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 flex items-center justify-between">
                <button
                    onClick={previousMonth}
                    className="px-4 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg hover:bg-[#F1F5F9] font-semibold"
                >
                    ← Previous
                </button>
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-[#111827]">{monthName}</h3>
                    <button
                        onClick={goToToday}
                        className="px-3 py-1 text-sm bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 font-semibold"
                    >
                        Today
                    </button>
                </div>
                <button
                    onClick={nextMonth}
                    className="px-4 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg hover:bg-[#F1F5F9] font-semibold"
                >
                    Next →
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-lg border border-[#CBD5E1] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-[#8E0E1C]">
                                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider sticky left-0 bg-[#8E0E1C] z-10 min-w-[120px]">
                                    Room
                                </th>
                                {dates.map((date) => {
                                    const isToday = date.toDateString() === new Date().toDateString()
                                    const isWeekend = date.getDay() === 0 || date.getDay() === 6
                                    return (
                                        <th
                                            key={date.toISOString()}
                                            className={`px-1 py-2 text-center text-xs font-bold text-white min-w-[40px] ${isToday ? 'bg-green-600' : isWeekend ? 'bg-[#6B0A15]' : ''
                                                }`}
                                        >
                                            <div>{date.getDate()}</div>
                                            <div className="text-[10px] font-normal opacity-80">
                                                {date.toLocaleDateString('en-IN', { weekday: 'short' }).charAt(0)}
                                            </div>
                                        </th>
                                    )
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#CBD5E1]">
                            {rooms.map((room) => (
                                <tr key={room.id} className="hover:bg-[#F8FAFC]">
                                    <td className="px-4 py-2 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-[#CBD5E1]">
                                        <div className="font-bold text-[#8E0E1C]">{room.roomNumber}</div>
                                        <div className="text-xs text-[#64748B]">{room.roomType.name}</div>
                                    </td>
                                    {dates.map((date) => {
                                        const occupancy = getReservationForCell(room.id, date)
                                        const isToday = date.toDateString() === new Date().toDateString()

                                        return (
                                            <td
                                                key={date.toISOString()}
                                                className={`px-1 py-2 text-center text-xs cursor-pointer transition-colors ${getCellStyle(occupancy)} ${isToday ? 'ring-2 ring-green-500 ring-inset' : ''
                                                    }`}
                                                title={
                                                    occupancy
                                                        ? `${occupancy.type === 'booking' ? 'Booking' : 'Reservation'}: ${occupancy.data.guestName}`
                                                        : 'Available'
                                                }
                                            >
                                                {occupancy && (
                                                    <Link
                                                        href={
                                                            occupancy.type === 'booking'
                                                                ? `/dashboard/bookings/${occupancy.data.id}`
                                                                : `/dashboard/reservations/${occupancy.data.id}`
                                                        }
                                                        className="block w-full h-full"
                                                    >
                                                        <span className="text-[10px] font-medium truncate block">
                                                            {occupancy.data.guestName.split(' ')[0].substring(0, 6)}
                                                        </span>
                                                    </Link>
                                                )}
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 text-center">
                    <div className="text-3xl font-bold text-[#111827]">{rooms.length}</div>
                    <div className="text-sm text-[#64748B]">Total Rooms</div>
                </div>
                <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">{bookings.length}</div>
                    <div className="text-sm text-[#64748B]">Active Bookings</div>
                </div>
                <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 text-center">
                    <div className="text-3xl font-bold text-yellow-600">
                        {reservations.filter(r => r.status === 'CONFIRMED').length}
                    </div>
                    <div className="text-sm text-[#64748B]">Confirmed Reservations</div>
                </div>
                <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 text-center">
                    <div className="text-3xl font-bold text-orange-600">
                        {reservations.filter(r => r.status === 'PENDING').length}
                    </div>
                    <div className="text-sm text-[#64748B]">Pending Reservations</div>
                </div>
            </div>
        </div>
    )
}
