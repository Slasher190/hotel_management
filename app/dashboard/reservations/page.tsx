'use client'

import { useEffect, useState, Suspense, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import Pagination from '@/app/components/Pagination'
import { useUserRole } from '@/lib/useUserRole'

interface Reservation {
    id: string
    reservationNumber: string
    guestName: string
    guestMobile: string
    checkInDate: string
    checkOutDate: string
    numberOfNights: number
    roomRate: number
    totalAmount: number
    advanceAmount: number
    status: string
    room: {
        roomNumber: string
        roomType: {
            name: string
        }
    }
}

function ReservationsContent() {
    const searchParams = useSearchParams()
    const statusFilter = searchParams.get('status')
    const { canWrite } = useUserRole()
    const [reservations, setReservations] = useState<Reservation[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [showFilters, setShowFilters] = useState(false)

    const fetchReservations = useCallback(async () => {
        try {
            const token = localStorage.getItem('token')
            const params = new URLSearchParams()

            if (statusFilter) {
                params.append('status', statusFilter)
            }

            params.append('page', page.toString())
            params.append('limit', '10')

            if (searchQuery) {
                params.append('search', searchQuery)
            }
            if (dateFrom) {
                params.append('dateFrom', dateFrom)
            }
            if (dateTo) {
                params.append('dateTo', dateTo)
            }

            const response = await fetch(`/api/reservations?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                setReservations(data.reservations || [])
                if (data.pagination) {
                    setTotalPages(data.pagination.totalPages)
                }
            }
        } catch {
            toast.error('Failed to load reservations')
        } finally {
            setLoading(false)
        }
    }, [statusFilter, page, searchQuery, dateFrom, dateTo])

    useEffect(() => {
        fetchReservations()
    }, [fetchReservations])

    const handleConfirm = async (id: string) => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/reservations/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: 'CONFIRMED' }),
            })

            if (response.ok) {
                toast.success('Reservation confirmed!')
                fetchReservations()
            } else {
                toast.error('Failed to confirm reservation')
            }
        } catch {
            toast.error('Failed to confirm reservation')
        }
    }

    const handleCancel = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this reservation?')) return

        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/reservations/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                toast.success('Reservation cancelled')
                fetchReservations()
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
                <div className="text-lg font-semibold text-[#64748B]">Loading reservations...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
                <div>
                    <h2 className="text-2xl sm:text-4xl font-bold text-[#111827] mb-2">
                        📅 Reservations
                    </h2>
                    <p className="text-sm sm:text-base text-[#64748B] font-medium">Manage advance room bookings and reservations</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                    {canWrite && (
                        <Link
                            href="/dashboard/reservations/new"
                            className="px-4 py-2 sm:px-6 sm:py-3 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold flex items-center gap-2 min-h-[44px] text-sm sm:text-base"
                        >
                            <span className="text-xl">➕</span>
                            <span>New Reservation</span>
                        </Link>
                    )}
                    <Link
                        href="/dashboard/reservations/calendar"
                        className="px-4 py-2 sm:px-6 sm:py-3 bg-[#64748B] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold flex items-center gap-2 min-h-[44px] text-sm sm:text-base"
                    >
                        <span>📆</span>
                        <span>Calendar View</span>
                    </Link>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label htmlFor="search" className="block text-sm font-semibold text-[#111827] mb-2">🔍 Search</label>
                        <input
                            id="search"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setPage(1)
                            }}
                            placeholder="Search by guest name, mobile, or reservation #..."
                            className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="px-4 py-3 bg-[#F8FAFC] border border-[#CBD5E1] text-[#111827] rounded-lg hover:bg-[#F1F5F9] transition-colors duration-150 font-semibold min-h-[44px] text-sm sm:text-base"
                    >
                        {showFilters ? '🙈 Hide Filters' : '🔧 Show Filters'}
                    </button>
                    {(searchQuery || dateFrom || dateTo) && (
                        <button
                            onClick={() => {
                                setSearchQuery('')
                                setDateFrom('')
                                setDateTo('')
                                setPage(1)
                            }}
                            className="px-4 py-3 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold min-h-[44px] text-sm sm:text-base"
                        >
                            🗑️ Clear
                        </button>
                    )}
                </div>

                {showFilters && (
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-[#CBD5E1]">
                        <div>
                            <label htmlFor="dateFrom" className="block text-sm font-semibold text-[#111827] mb-2">📅 Check-In From</label>
                            <input
                                id="dateFrom"
                                type="date"
                                value={dateFrom}
                                onChange={(e) => {
                                    setDateFrom(e.target.value)
                                    setPage(1)
                                }}
                                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="dateTo" className="block text-sm font-semibold text-[#111827] mb-2">📅 Check-In To</label>
                            <input
                                id="dateTo"
                                type="date"
                                value={dateTo}
                                onChange={(e) => {
                                    setDateTo(e.target.value)
                                    setPage(1)
                                }}
                                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Status Filters */}
            <div className="flex gap-2 sm:gap-3 flex-wrap items-center">
                <Link
                    href="/dashboard/reservations"
                    className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg font-semibold transition-colors duration-150 min-h-[44px] flex items-center ${!statusFilter
                            ? 'bg-[#8E0E1C] text-white'
                            : 'bg-white text-[#111827] hover:bg-[#F8FAFC] border border-[#CBD5E1]'
                        }`}
                >
                    All
                </Link>
                <Link
                    href="/dashboard/reservations?status=PENDING"
                    className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg font-semibold transition-colors duration-150 min-h-[44px] flex items-center ${statusFilter === 'PENDING'
                            ? 'bg-[#8E0E1C] text-white'
                            : 'bg-white text-[#111827] hover:bg-[#F8FAFC] border border-[#CBD5E1]'
                        }`}
                >
                    ⏳ Pending
                </Link>
                <Link
                    href="/dashboard/reservations?status=CONFIRMED"
                    className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg font-semibold transition-colors duration-150 min-h-[44px] flex items-center ${statusFilter === 'CONFIRMED'
                            ? 'bg-[#8E0E1C] text-white'
                            : 'bg-white text-[#111827] hover:bg-[#F8FAFC] border border-[#CBD5E1]'
                        }`}
                >
                    ✅ Confirmed
                </Link>
                <Link
                    href="/dashboard/reservations?status=COMPLETED"
                    className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg font-semibold transition-colors duration-150 min-h-[44px] flex items-center ${statusFilter === 'COMPLETED'
                            ? 'bg-[#8E0E1C] text-white'
                            : 'bg-white text-[#111827] hover:bg-[#F8FAFC] border border-[#CBD5E1]'
                        }`}
                >
                    🏨 Checked In
                </Link>
                <Link
                    href="/dashboard/reservations?status=CANCELLED"
                    className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg font-semibold transition-colors duration-150 min-h-[44px] flex items-center ${statusFilter === 'CANCELLED'
                            ? 'bg-[#8E0E1C] text-white'
                            : 'bg-white text-[#111827] hover:bg-[#F8FAFC] border border-[#CBD5E1]'
                        }`}
                >
                    ❌ Cancelled
                </Link>
            </div>

            {/* Reservations Table */}
            <div className="bg-white rounded-lg border border-[#CBD5E1] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#CBD5E1]">
                        <thead className="bg-[#8E0E1C]">
                            <tr>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    📋 Reservation #
                                </th>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    👤 Guest
                                </th>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    🏨 Room
                                </th>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider hidden md:table-cell">
                                    📅 Check-In
                                </th>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider hidden lg:table-cell">
                                    📅 Check-Out
                                </th>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    📊 Status
                                </th>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                                    ⚡ Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-[#CBD5E1]">
                            {reservations.map((reservation) => (
                                <tr key={reservation.id} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-[#8E0E1C]">{reservation.reservationNumber}</div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-[#111827]">{reservation.guestName}</div>
                                        <div className="text-xs text-[#64748B]">{reservation.guestMobile}</div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-[#111827]">
                                            <span className="font-bold text-[#8E0E1C]">{reservation.room.roomNumber}</span>
                                            <span className="text-[#64748B]"> ({reservation.room.roomType.name})</span>
                                        </div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                                        <div className="text-sm font-medium text-[#64748B]">
                                            {new Date(reservation.checkInDate).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                                        <div className="text-sm font-medium text-[#64748B]">
                                            {new Date(reservation.checkOutDate).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </div>
                                        <div className="text-xs text-[#64748B]">{reservation.numberOfNights} night(s)</div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${getStatusBadge(reservation.status)}`}>
                                            {reservation.status}
                                        </span>
                                    </td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2 flex-wrap">
                                            {reservation.status === 'PENDING' && (
                                                <button
                                                    onClick={() => handleConfirm(reservation.id)}
                                                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold text-xs min-h-[36px]"
                                                    title="Confirm Reservation"
                                                >
                                                    ✅ Confirm
                                                </button>
                                            )}
                                            {reservation.status === 'CONFIRMED' && (
                                                <Link
                                                    href={`/dashboard/reservations/${reservation.id}/checkin`}
                                                    className="px-3 py-1.5 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold text-xs min-h-[36px] flex items-center"
                                                >
                                                    🏨 Check-In
                                                </Link>
                                            )}
                                            <Link
                                                href={`/dashboard/reservations/${reservation.id}`}
                                                className="px-3 py-1.5 bg-[#64748B] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold text-xs min-h-[36px] flex items-center"
                                            >
                                                👁️ View
                                            </Link>
                                            {(reservation.status === 'PENDING' || reservation.status === 'CONFIRMED') && (
                                                <button
                                                    onClick={() => handleCancel(reservation.id)}
                                                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold text-xs min-h-[36px]"
                                                    title="Cancel Reservation"
                                                >
                                                    ❌
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                )}
                {reservations.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📅</div>
                        <div className="text-lg font-semibold text-[#64748B]">No reservations found</div>
                        <Link
                            href="/dashboard/reservations/new"
                            className="inline-block mt-4 px-6 py-3 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold"
                        >
                            ➕ Create First Reservation
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function ReservationsPage() {
    return (
        <Suspense fallback={<div className="text-center py-8">Loading reservations...</div>}>
            <ReservationsContent />
        </Suspense>
    )
}
