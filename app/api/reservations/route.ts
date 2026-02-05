import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffOrManager } from '@/lib/role-auth'
import { Prisma, ReservationStatus } from '@prisma/client'
import { startOfDayIST, endOfDayIST } from '@/lib/date-utils'

// Generate unique reservation number
function generateReservationNumber(): string {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `RES${year}${month}${day}${random}`
}

// Check if room is available for given dates
async function checkRoomAvailability(
    roomId: string,
    checkInDate: Date,
    checkOutDate: Date,
    excludeReservationId?: string
): Promise<boolean> {
    // Check for overlapping reservations (PENDING or CONFIRMED only)
    const overlappingReservations = await prisma.reservation.findFirst({
        where: {
            roomId,
            id: excludeReservationId ? { not: excludeReservationId } : undefined,
            status: { in: ['PENDING', 'CONFIRMED'] },
            AND: [
                { checkInDate: { lt: checkOutDate } },
                { checkOutDate: { gt: checkInDate } },
            ],
        },
    })

    if (overlappingReservations) {
        return false
    }

    // Check for active bookings that overlap
    const overlappingBookings = await prisma.booking.findFirst({
        where: {
            roomId,
            status: 'ACTIVE',
            checkInDate: { lt: checkOutDate },
            OR: [
                { checkoutDate: null },
                { checkoutDate: { gt: checkInDate } },
            ],
        },
    })

    return !overlappingBookings
}

export async function GET(request: NextRequest) {
    try {
        const user = requireStaffOrManager(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const status = request.nextUrl.searchParams.get('status')
        const page = Number.parseInt(request.nextUrl.searchParams.get('page') || '1')
        const limit = Number.parseInt(request.nextUrl.searchParams.get('limit') || '10')
        const showAll = request.nextUrl.searchParams.get('showAll') === 'true'
        const search = request.nextUrl.searchParams.get('search')
        const dateFrom = request.nextUrl.searchParams.get('dateFrom')
        const dateTo = request.nextUrl.searchParams.get('dateTo')
        const roomId = request.nextUrl.searchParams.get('roomId')
        const todayArrivals = request.nextUrl.searchParams.get('todayArrivals') === 'true'

        const where: Prisma.ReservationWhereInput = {}

        if (status) {
            where.status = status as ReservationStatus
        }

        if (search) {
            where.OR = [
                { guestName: { contains: search, mode: Prisma.QueryMode.insensitive } },
                { reservationNumber: { contains: search, mode: Prisma.QueryMode.insensitive } },
                { guestMobile: { contains: search, mode: Prisma.QueryMode.insensitive } },
            ]
        }

        if (dateFrom || dateTo) {
            where.checkInDate = {}
            if (dateFrom) {
                where.checkInDate.gte = startOfDayIST(dateFrom)
            }
            if (dateTo) {
                where.checkInDate.lte = endOfDayIST(dateTo)
            }
        }

        if (roomId) {
            where.roomId = roomId
        }

        if (todayArrivals) {
            const today = new Date()
            where.checkInDate = {
                gte: startOfDayIST(today.toISOString().split('T')[0]),
                lte: endOfDayIST(today.toISOString().split('T')[0]),
            }
            where.status = 'CONFIRMED'
        }

        const skip = showAll ? 0 : (page - 1) * limit
        const take = showAll ? undefined : limit

        const [reservations, total] = await Promise.all([
            prisma.reservation.findMany({
                where,
                include: {
                    room: {
                        include: {
                            roomType: true,
                        },
                    },
                    booking: true,
                },
                orderBy: { checkInDate: 'asc' },
                skip,
                take,
            }),
            showAll ? Promise.resolve(0) : prisma.reservation.count({ where }),
        ])

        return NextResponse.json({
            reservations,
            pagination: showAll
                ? null
                : {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
        })
    } catch (error) {
        console.error('Error fetching reservations:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = requireStaffOrManager(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized - Staff or Manager access required' }, { status: 403 })
        }

        const {
            roomId,
            guestName,
            guestEmail,
            guestMobile,
            guestAddress,
            checkInDate,
            checkOutDate,
            expectedArrival,
            adults,
            children,
            roomRate,
            advanceAmount,
            specialRequests,
        } = await request.json()

        // Validate required fields
        if (!roomId || !guestName || !guestMobile || !checkInDate || !checkOutDate || !roomRate) {
            return NextResponse.json(
                { error: 'Room, guest name, mobile, check-in date, check-out date, and room rate are required' },
                { status: 400 }
            )
        }

        const checkIn = new Date(checkInDate)
        const checkOut = new Date(checkOutDate)

        // Validate dates
        if (checkIn >= checkOut) {
            return NextResponse.json(
                { error: 'Check-out date must be after check-in date' },
                { status: 400 }
            )
        }

        // Check room exists
        const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: { roomType: true },
        })

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 })
        }

        // Check availability
        const isAvailable = await checkRoomAvailability(roomId, checkIn, checkOut)
        if (!isAvailable) {
            return NextResponse.json(
                { error: 'Room is not available for the selected dates' },
                { status: 400 }
            )
        }

        // Calculate number of nights
        const numberOfNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        const totalAmount = parseFloat(roomRate) * numberOfNights

        // Create reservation
        const reservation = await prisma.reservation.create({
            data: {
                reservationNumber: generateReservationNumber(),
                roomId,
                guestName,
                guestEmail: guestEmail || null,
                guestMobile,
                guestAddress: guestAddress || null,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                expectedArrival: expectedArrival || null,
                numberOfNights,
                adults: parseInt(adults) || 1,
                children: parseInt(children) || 0,
                roomRate: parseFloat(roomRate),
                advanceAmount: parseFloat(advanceAmount) || 0,
                totalAmount,
                specialRequests: specialRequests || null,
                status: 'PENDING',
            },
            include: {
                room: {
                    include: {
                        roomType: true,
                    },
                },
            },
        })

        return NextResponse.json(reservation, { status: 201 })
    } catch (error) {
        console.error('Error creating reservation:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
