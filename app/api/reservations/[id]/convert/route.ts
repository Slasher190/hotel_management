import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffOrManager } from '@/lib/role-auth'
import { getCurrentDate } from '@/lib/date-utils'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = requireStaffOrManager(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id } = await params
        const body = await request.json()

        // Get reservation
        const reservation = await prisma.reservation.findUnique({
            where: { id },
            include: {
                room: {
                    include: {
                        roomType: true,
                    },
                },
            },
        })

        if (!reservation) {
            return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
        }

        // Validate status
        if (reservation.status !== 'CONFIRMED') {
            return NextResponse.json(
                { error: 'Only confirmed reservations can be converted to bookings' },
                { status: 400 }
            )
        }

        // Check if room is currently available (not occupied by another active booking)
        if (reservation.room.status === 'OCCUPIED') {
            return NextResponse.json(
                { error: 'Room is currently occupied. Please check out the current guest first.' },
                { status: 400 }
            )
        }

        // Create booking from reservation data
        const booking = await prisma.booking.create({
            data: {
                roomId: reservation.roomId,
                guestName: reservation.guestName,
                guestAddress: reservation.guestAddress,
                guestMobile: reservation.guestMobile,
                idType: body.idType || 'OTHER',
                idNumber: body.idNumber || null,
                adults: reservation.adults,
                children: reservation.children,
                roomPrice: reservation.roomRate,
                checkInDate: getCurrentDate(),
                status: 'ACTIVE',
                purpose: body.purpose || 'Reservation Check-in',
            },
        })

        // Update room status to occupied
        await prisma.room.update({
            where: { id: reservation.roomId },
            data: { status: 'OCCUPIED' },
        })

        // Update reservation status and link to booking
        await prisma.reservation.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                bookingId: booking.id,
            },
        })

        return NextResponse.json({
            message: 'Reservation converted to booking successfully',
            booking,
        })
    } catch (error) {
        console.error('Error converting reservation to booking:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
