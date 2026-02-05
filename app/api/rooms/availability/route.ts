import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffOrManager } from '@/lib/role-auth'

export async function GET(request: NextRequest) {
    try {
        const user = requireStaffOrManager(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const checkInDate = request.nextUrl.searchParams.get('checkInDate')
        const checkOutDate = request.nextUrl.searchParams.get('checkOutDate')
        const roomTypeId = request.nextUrl.searchParams.get('roomTypeId')

        if (!checkInDate || !checkOutDate) {
            return NextResponse.json(
                { error: 'Check-in and check-out dates are required' },
                { status: 400 }
            )
        }

        const checkIn = new Date(checkInDate)
        const checkOut = new Date(checkOutDate)

        if (checkIn >= checkOut) {
            return NextResponse.json(
                { error: 'Check-out date must be after check-in date' },
                { status: 400 }
            )
        }

        // Get all rooms (optionally filtered by room type)
        const roomWhere = roomTypeId ? { roomTypeId } : {}
        const allRooms = await prisma.room.findMany({
            where: roomWhere,
            include: {
                roomType: true,
            },
        })

        // Get rooms with overlapping reservations (PENDING or CONFIRMED)
        const overlappingReservations = await prisma.reservation.findMany({
            where: {
                status: { in: ['PENDING', 'CONFIRMED'] },
                AND: [
                    { checkInDate: { lt: checkOut } },
                    { checkOutDate: { gt: checkIn } },
                ],
            },
            select: { roomId: true },
        })

        // Get rooms with active bookings that would overlap
        const overlappingBookings = await prisma.booking.findMany({
            where: {
                status: 'ACTIVE',
                checkInDate: { lt: checkOut },
                OR: [
                    { checkoutDate: null },
                    { checkoutDate: { gt: checkIn } },
                ],
            },
            select: { roomId: true },
        })

        const bookedRoomIds = new Set([
            ...overlappingReservations.map(r => r.roomId),
            ...overlappingBookings.map(b => b.roomId),
        ])

        // Split rooms into available and unavailable
        const availableRooms = allRooms.filter(room => !bookedRoomIds.has(room.id))
        const unavailableRooms = allRooms.filter(room => bookedRoomIds.has(room.id))

        return NextResponse.json({
            availableRooms,
            unavailableRooms,
            checkInDate,
            checkOutDate,
        })
    } catch (error) {
        console.error('Error checking room availability:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
